"""
Django REST Framework API Views for SIR Gateway
"""

import os
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from .models import CompressionSession, CostLog
from .serializers import (
    CompressionSessionSerializer,
    CompressRequestSerializer,
    ExecuteRequestSerializer,
    CostLogSerializer
)
from .services.compressor import compile_prompt_to_sir, execute_sir_on_llm, count_tokens
from .services.fidelity import evaluate_fidelity
from .services.cost_tracker import (
    compute_request_metrics,
    project_enterprise_savings,
    get_all_pricing,
    get_pricing_for_model
)

logger = logging.getLogger(__name__)


class CompressPromptView(APIView):
    """
    POST /api/compress/
    Takes raw verbose prompt, target model, and engine preference.
    Compiles to SIR YAML, checks fidelity, computes cost savings, and stores session.
    """
    def post(self, request):
        serializer = CompressRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        raw_prompt = serializer.validated_data['raw_prompt']
        target_model = serializer.validated_data.get('target_model', 'gpt-4o')
        compression_engine = serializer.validated_data.get('compression_engine', 'auto')

        # 1. Compile prompt to SIR
        comp_result = compile_prompt_to_sir(
            raw_prompt=raw_prompt,
            target_model=target_model,
            requested_engine=compression_engine
        )

        sir_yaml = comp_result['sir_yaml']
        engine_used = comp_result['engine_used']
        compression_latency_ms = comp_result['compression_latency_ms']
        raw_tokens = comp_result['raw_tokens']
        sir_tokens = comp_result['sir_tokens']
        is_passthrough = comp_result.get('is_passthrough', False)
        passthrough_status = comp_result.get('passthrough_status')
        passthrough_reason = comp_result.get('passthrough_reason')

        # 2. Evaluate Semantic Fidelity Gatekeeper
        if is_passthrough:
            fidelity_score = 1.0
            fidelity_passed = True
        else:
            fidelity_score, fidelity_passed = evaluate_fidelity(raw_prompt, sir_yaml)

        # 3. Calculate Financial Metrics
        cost_metrics = compute_request_metrics(
            raw_tokens=raw_tokens,
            sir_tokens=sir_tokens,
            target_model=target_model
        )

        # 4. Compute Enterprise Scale Projections
        projections = project_enterprise_savings(
            cost_saved_per_request=cost_metrics['cost_saved_usd'],
            tokens_saved_per_request=cost_metrics['tokens_saved']
        )

        # 5. Persist Session & CostLog
        session_status = passthrough_status or ('compressed' if not is_passthrough else 'passthrough')
        session = CompressionSession.objects.create(
            raw_prompt=raw_prompt,
            sir_yaml=sir_yaml,
            target_model=target_model,
            raw_token_count=raw_tokens,
            sir_token_count=sir_tokens,
            tokens_saved=cost_metrics['tokens_saved'],
            token_reduction_pct=cost_metrics['token_reduction_pct'],
            fidelity_score=fidelity_score,
            fidelity_passed=fidelity_passed,
            compression_latency_ms=compression_latency_ms,
            compression_engine=engine_used,
            status=session_status
        )

        CostLog.objects.create(
            session=session,
            target_model=target_model,
            input_cost_per_1m=cost_metrics['pricing']['input_per_1m'],
            output_cost_per_1m=cost_metrics['pricing']['output_per_1m'],
            raw_input_cost_usd=cost_metrics['raw_input_cost_usd'],
            sir_input_cost_usd=cost_metrics['sir_input_cost_usd'],
            cost_saved_usd=cost_metrics['cost_saved_usd']
        )

        session_serializer = CompressionSessionSerializer(session)

        return Response({
            "session": session_serializer.data,
            "cost_metrics": cost_metrics,
            "projections": projections,
            "is_passthrough": is_passthrough,
            "passthrough_status": passthrough_status,
            "passthrough_reason": passthrough_reason,
            "fidelity": {
                "score": fidelity_score,
                "score_pct": round(fidelity_score * 100.0, 1),
                "passed": fidelity_passed,
                "threshold": 0.85
            }
        }, status=status.HTTP_201_CREATED)


class ExecutePromptView(APIView):
    """
    POST /api/execute/
    Executes compiled SIR YAML on target frontier LLM proxy and logs execution output.
    """
    def post(self, request):
        serializer = ExecuteRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        session_id = serializer.validated_data['session_id']
        session = get_object_or_404(CompressionSession, id=session_id)

        sir_to_run = serializer.validated_data.get('custom_sir_yaml') or session.sir_yaml
        target_model = serializer.validated_data.get('target_model') or session.target_model

        # Execute downstream
        exec_result = execute_sir_on_llm(
            sir_yaml=sir_to_run,
            target_model=target_model
        )

        # Update session record
        session.llm_response = exec_result['response']
        session.inference_latency_ms = exec_result['inference_latency_ms']
        session.status = 'executed' if exec_result['success'] else 'failed'
        session.save(update_fields=['llm_response', 'inference_latency_ms', 'status'])

        return Response({
            "session_id": str(session.id),
            "target_model": target_model,
            "llm_response": exec_result['response'],
            "inference_latency_ms": exec_result['inference_latency_ms'],
            "executor_engine": exec_result['executor_engine'],
            "status": session.status
        }, status=status.HTTP_200_OK)


class HistoryListView(APIView):
    """
    GET /api/history/
    Returns recent compression sessions (up to 50) for dashboard analytics and charts.
    """
    def get(self, request):
        limit = int(request.query_params.get('limit', 50))
        sessions = CompressionSession.objects.all().select_related('cost_log')[:limit]
        serializer = CompressionSessionSerializer(sessions, many=True)
        
        # Summary statistics
        total_sessions = CompressionSession.objects.count()
        total_tokens_saved = sum(s.tokens_saved for s in sessions)
        total_dollars_saved = sum(s.cost_log.cost_saved_usd for s in sessions if hasattr(s, 'cost_log'))
        avg_reduction = (
            sum(s.token_reduction_pct for s in sessions) / len(sessions)
            if sessions else 0.0
        )

        return Response({
            "count": len(sessions),
            "total_recorded": total_sessions,
            "summary": {
                "total_tokens_saved": total_tokens_saved,
                "total_dollars_saved_usd": round(total_dollars_saved, 6),
                "avg_reduction_pct": round(avg_reduction, 2),
            },
            "history": serializer.data
        }, status=status.HTTP_200_OK)


class PricingListView(APIView):
    """
    GET /api/pricing/
    Returns all frontier model pricing tiers.
    """
    def get(self, request):
        return Response({
            "pricing": get_all_pricing()
        }, status=status.HTTP_200_OK)


class SystemHealthView(APIView):
    """
    GET /api/health/
    Returns backend status, available engines and API key availability.
    """
    def get(self, request):
        from .services.compressor import get_api_keys
        gemini_key, groq_key = get_api_keys()
        
        has_gemini = bool(gemini_key and gemini_key not in ["your-gemini-api-key-here", "your_gemini_api_key_here"])
        has_groq = bool(groq_key and groq_key not in ["your_groq_api_key_here"])
        ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434")

        # Test Ollama reachability quickly
        ollama_available = False
        try:
            import requests
            r = requests.get(f"{ollama_host}/api/tags", timeout=0.5)
            ollama_available = (r.status_code == 200)
        except Exception:
            ollama_available = False

        active_cloud_engine = None
        if has_gemini:
            active_cloud_engine = "Gemini Flash (Cloud Active)"
        elif has_groq:
            active_cloud_engine = "Groq Cloud (Active)"

        return Response({
            "status": "online",
            "active_cloud_engine": active_cloud_engine,
            "engines": {
                "gemini": {
                    "configured": has_gemini,
                    "default_primary": True,
                    "model": "gemini-flash-lite-latest"
                },
                "groq": {
                    "configured": has_groq,
                    "model": "openai/gpt-oss-20b"
                },
                "ollama": {
                    "configured": ollama_available,
                    "host": ollama_host,
                    "model": os.getenv("OLLAMA_MODEL", "llama3.2:1b")
                },
                "offline_distiller": {
                    "configured": True,
                    "always_available": True
                }
            }
        }, status=status.HTTP_200_OK)
