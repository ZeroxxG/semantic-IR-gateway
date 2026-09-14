"""
Django REST Framework API Views for SIR Gateway
Includes Phase-4 OpenAI-Compatible Drop-In Proxy with Multi-Provider Dynamic Routing (OpenAI, Groq, Gemini),
System-Level Verbosity Suppression Directive Injection, and Live Telemetry Logging.
"""

import os
import time
import json
import logging
import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.http import JsonResponse, HttpResponse

from .models import CompressionSession, CostLog
from .serializers import (
    CompressionSessionSerializer,
    CompressRequestSerializer,
    ExecuteRequestSerializer,
    CostLogSerializer
)
from .services.compressor import compile_prompt_to_sir, execute_sir_on_llm, count_tokens
from .services.fidelity import evaluate_fidelity, FIDELITY_THRESHOLD
from .services.cost_tracker import (

    compute_request_metrics,
    project_enterprise_savings,
    get_all_pricing,
    get_pricing_for_model
)

logger = logging.getLogger(__name__)

CONCISE_SYSTEM_DIRECTIVE = {
    "role": "system",
    "content": "Be direct and concise. Deliver exact answers or code implementations without conversational preambles, tutorial breakdowns, or concluding pleasantries unless explicitly requested."
}


def get_client_ip(request) -> str:
    """Extract client IP from request headers."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
    return ip


class CompressPromptView(APIView):
    """
    POST /api/compress/
    Takes raw verbose prompt, target model, and engine preference.
    Compiles to SIR YAML, enforces anti-inflation & fidelity safety nets, computes cost savings, and stores session.
    """
    def post(self, request):
        serializer = CompressRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        raw_prompt = serializer.validated_data['raw_prompt']
        target_model = serializer.validated_data.get('target_model', 'gpt-4o')
        compression_engine = serializer.validated_data.get('compression_engine', 'auto')
        client_ip = get_client_ip(request)

        # 1. Compile prompt to SIR with all safety nets
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
        fidelity_score = comp_result.get('fidelity_score', 1.0)
        fidelity_passed = comp_result.get('fidelity_passed', True)
        tokens_saved = comp_result.get('tokens_saved', 0)
        token_reduction_pct = comp_result.get('token_reduction_pct', 0.0)

        # 2. Calculate Financial Metrics
        cost_metrics = compute_request_metrics(
            raw_tokens=raw_tokens,
            sir_tokens=sir_tokens,
            target_model=target_model
        )

        # 3. Compute Enterprise Scale Projections
        projections = project_enterprise_savings(
            cost_saved_per_request=cost_metrics['cost_saved_usd'],
            tokens_saved_per_request=cost_metrics['tokens_saved']
        )

        # 4. Persist Session & CostLog
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
            client_ip=client_ip,
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


class OpenAIChatCompletionsProxyView(APIView):
    """
    POST /api/v1/chat/completions/
    OpenAI-Compatible Drop-In Proxy with BYOK, Multi-Provider Routing (OpenAI, Groq, Gemini),
    and System-Level Verbosity Suppression Directive Injection.
    """
    authentication_classes = []
    permission_classes = []

    def post(self, request, *args, **kwargs):
        start_time = time.time()
        client_ip = get_client_ip(request)

        # 1. BYOK Authorization Header Extraction
        auth_header = request.headers.get("Authorization") or request.META.get("HTTP_AUTHORIZATION")
        if not auth_header or not auth_header.startswith("Bearer "):
            return Response({
                "error": {
                    "message": "You didn't provide an API key. You need to provide your API key in an Authorization header using Bearer auth (i.e. Authorization: Bearer YOUR_KEY).",
                    "type": "invalid_request_error",
                    "param": None,
                    "code": "unauthorized"
                }
            }, status=status.HTTP_401_UNAUTHORIZED)

        client_api_key = auth_header.replace("Bearer ", "").strip()
        if not client_api_key:
            return Response({
                "error": {
                    "message": "Empty API key provided in Authorization header.",
                    "type": "invalid_request_error",
                    "param": None,
                    "code": "invalid_api_key"
                }
            }, status=status.HTTP_401_UNAUTHORIZED)

        # 2. Parse Messages & Target Model
        body_data = request.data if isinstance(request.data, dict) else {}
        messages = body_data.get("messages", [])
        raw_model = body_data.get("model")
        raw_model_str = str(raw_model).lower() if raw_model else ""

        # 3. Dynamic Multi-Provider Routing Detection
        if auth_header.startswith("Bearer gsk_") or "llama" in raw_model_str or "qwen" in raw_model_str or "gpt-oss" in raw_model_str:
            provider = "groq"
            upstream_url = "https://api.groq.com/openai/v1/chat/completions"
            target_model = raw_model if raw_model else "llama-3.3-70b-versatile"
        elif auth_header.startswith("Bearer AIza") or "gemini" in raw_model_str:
            provider = "gemini"
            upstream_url = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
            target_model = raw_model if raw_model else "gemini-1.5-flash"
        else:
            provider = "openai"
            upstream_url = "https://api.openai.com/v1/chat/completions"
            target_model = raw_model if raw_model else "gpt-4o"

        if not messages or not isinstance(messages, list):
            return Response({
                "error": {
                    "message": "'messages' is a required list property and must contain at least one message.",
                    "type": "invalid_request_error",
                    "param": "messages",
                    "code": "invalid_request"
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        # Find last user message
        target_index = -1
        raw_prompt = ""
        for i in range(len(messages) - 1, -1, -1):
            msg = messages[i]
            if msg.get("role") == "user":
                target_index = i
                content = msg.get("content", "")
                if isinstance(content, str):
                    raw_prompt = content
                elif isinstance(content, list):
                    # Multimodal/multi-part content
                    text_parts = [p.get("text", "") for p in content if isinstance(p, dict) and p.get("type") == "text"]
                    raw_prompt = " ".join(text_parts) if text_parts else str(content)
                break

        if not raw_prompt:
            target_index = len(messages) - 1
            raw_prompt = str(messages[-1].get("content", ""))

        # 4. Compile prompt to d-SIR via internal compressor with anti-inflation pass-through guard
        comp_result = compile_prompt_to_sir(
            raw_prompt=raw_prompt,
            target_model=target_model,
            requested_engine="auto"
        )

        sir_yaml = comp_result['sir_yaml']
        engine_used = comp_result['engine_used']
        comp_latency = comp_result['compression_latency_ms']
        raw_tokens = comp_result['raw_tokens']
        sir_tokens = comp_result['sir_tokens']
        is_passthrough = comp_result.get('is_passthrough', False)
        passthrough_status = comp_result.get('passthrough_status')

        # Active circuit-breaker fidelity check
        if not is_passthrough:
            fidelity_score, passed = evaluate_fidelity(raw_prompt, sir_yaml)
            if passed:
                final_prompt = sir_yaml
                is_compressed = True
                fidelity_passed = True
            else:
                # Circuit breaker triggered: drop d-SIR and fallback to 100% raw prompt
                final_prompt = raw_prompt
                is_compressed = False
                fidelity_passed = False
                is_passthrough = True
                passthrough_status = "FALLBACK_FIDELITY_GUARD"
                sir_tokens = raw_tokens
                logger.warning(
                    f"Fidelity guard failed ({fidelity_score:.4f} < {FIDELITY_THRESHOLD}). Reverting to raw prompt."
                )
        else:
            final_prompt = raw_prompt
            is_compressed = False
            fidelity_score = comp_result.get('fidelity_score', 1.0)
            fidelity_passed = comp_result.get('fidelity_passed', True)
            sir_tokens = raw_tokens

        # 5. Prepare updated payload with verified d-SIR (or raw if pass-through / fallback)
        if is_compressed:
            optimized_content = (
                f"You are executing an engineering task specified in dense Semantic Intermediate Representation (d-SIR) YAML.\n"
                f"Follow all goal signatures, specifications, and output_mode directives precisely.\n\n"
                f"--- d-SIR SPECIFICATION ---\n"
                f"{final_prompt}\n"
                f"--- END SPECIFICATION ---\n\n"
                f"Produce the solution now:"
            )
        else:
            optimized_content = final_prompt

        updated_messages = [dict(m) for m in messages]
        updated_messages[target_index] = {
            **updated_messages[target_index],
            "content": optimized_content
        }

        # 6. Upstream System Message Injection for Output Verbosity Suppression
        # If no system message exists in the payload, prepend the concise directive to index 0
        has_system_msg = any(msg.get("role") in ["system", "developer"] for msg in updated_messages)
        if not has_system_msg:
            updated_messages.insert(0, dict(CONCISE_SYSTEM_DIRECTIVE))

        forward_payload = {
            **body_data,
            "messages": updated_messages,
            "model": target_model
        }

        # Prevent truncated responses on Groq by ensuring max_tokens is at least 4096 and removing conflicting limits
        if provider == "groq":
            forward_payload.pop("max_completion_tokens", None)
            client_max_tokens = forward_payload.get("max_tokens")
            if client_max_tokens is None or (isinstance(client_max_tokens, (int, float)) and client_max_tokens < 4096):
                forward_payload["max_tokens"] = 4096


        # 7. Forward to Upstream Provider (OpenAI, Groq, Gemini)
        upstream_headers = {
            "Authorization": f"Bearer {client_api_key}",
            "Content-Type": "application/json"
        }

        if request.headers.get("OpenAI-Organization"):
            upstream_headers["OpenAI-Organization"] = request.headers["OpenAI-Organization"]
        if request.headers.get("OpenAI-Project"):
            upstream_headers["OpenAI-Project"] = request.headers["OpenAI-Project"]

        upstream_res = None
        upstream_json = {}
        inference_latency_ms = 0.0

        try:
            inf_start = time.time()
            upstream_res = requests.post(
                upstream_url,
                json=forward_payload,
                headers=upstream_headers,
                timeout=90
            )
            inference_latency_ms = (time.time() - inf_start) * 1000.0

            try:
                upstream_json = upstream_res.json()
            except Exception:
                upstream_json = {"error": {"message": upstream_res.text, "type": "upstream_error"}}

        except requests.exceptions.Timeout:
            return Response({
                "error": {
                    "message": f"Upstream {provider.title()} API timed out.",
                    "type": "api_timeout_error",
                    "code": "gateway_timeout"
                }
            }, status=status.HTTP_504_GATEWAY_TIMEOUT)
        except Exception as e:
            logger.error(f"Error proxying to {provider}: {e}")
            return Response({
                "error": {
                    "message": f"Failed to connect to upstream {provider.title()}: {str(e)}",
                    "type": "api_connection_error",
                    "code": "bad_gateway"
                }
            }, status=status.HTTP_502_BAD_GATEWAY)

        # 8. Record Session & Cost Log with Output Token Tracking
        cost_metrics = compute_request_metrics(
            raw_tokens=raw_tokens,
            sir_tokens=sir_tokens if is_compressed else raw_tokens,
            target_model=target_model
        )

        response_content = ""
        if upstream_res and upstream_res.status_code == 200:
            choices = upstream_json.get("choices", [])
            if choices and "message" in choices[0]:
                response_content = choices[0]["message"].get("content", "")
            session_status = 'executed' if is_compressed else ('fallback' if passthrough_status == "FALLBACK_FIDELITY_GUARD" else 'passthrough')
        else:
            session_status = 'failed'

        session = CompressionSession.objects.create(
            raw_prompt=raw_prompt,
            sir_yaml=final_prompt,
            target_model=target_model,
            raw_token_count=raw_tokens,
            sir_token_count=sir_tokens if is_compressed else raw_tokens,
            tokens_saved=cost_metrics['tokens_saved'] if is_compressed else 0,
            token_reduction_pct=cost_metrics['token_reduction_pct'] if is_compressed else 0.0,
            fidelity_score=fidelity_score,
            fidelity_passed=fidelity_passed,
            compression_latency_ms=comp_latency,
            inference_latency_ms=round(inference_latency_ms, 2),
            llm_response=response_content if response_content else str(upstream_json),
            compression_engine=f"Proxy ({provider} -> {engine_used})",
            client_ip=client_ip,
            status=passthrough_status or session_status
        )


        CostLog.objects.create(
            session=session,
            target_model=target_model,
            input_cost_per_1m=cost_metrics['pricing']['input_per_1m'],
            output_cost_per_1m=cost_metrics['pricing']['output_per_1m'],
            raw_input_cost_usd=cost_metrics['raw_input_cost_usd'],
            sir_input_cost_usd=cost_metrics['sir_input_cost_usd'] if is_compressed else cost_metrics['raw_input_cost_usd'],
            cost_saved_usd=cost_metrics['cost_saved_usd'] if is_compressed else 0.0
        )

        # 9. Return exact upstream response with custom telemetry headers
        response = Response(upstream_json, status=upstream_res.status_code if upstream_res else 200)
        response["x-sir-tokens-saved"] = str(cost_metrics['tokens_saved'] if is_compressed else 0)
        response["x-sir-provider"] = provider
        response["x-sir-savings-usd"] = f"{(cost_metrics['cost_saved_usd'] if is_compressed else 0.0):.6f}"
        response["x-sir-reduction-pct"] = f"{(cost_metrics['token_reduction_pct'] if is_compressed else 0.0):.1f}%"
        response["x-sir-status"] = passthrough_status or session_status
        response["x-sir-fidelity"] = f"{fidelity_score:.4f}"
        response["x-sir-session-id"] = str(session.id)

        return response



class HistoryListView(APIView):
    """
    GET /api/history/
    Returns recent compression sessions (up to 50) for dashboard analytics and charts.
    """
    def get(self, request):
        limit = int(request.query_params.get('limit', 50))
        sessions = CompressionSession.objects.all().select_related('cost_log')[:limit]
        serializer = CompressionSessionSerializer(sessions, many=True)
        
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

        ollama_available = False
        try:
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


class ModelsProxyView(APIView):
    """
    GET /v1/models, GET /models
    OpenAI-compatible models list endpoint for connection checks in Cursor, Continue, Claude Desktop, etc.
    """
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        models = [
            {"id": "gpt-4o", "object": "model", "created": 1715367049, "owned_by": "openai"},
            {"id": "gpt-4o-mini", "object": "model", "created": 1715367049, "owned_by": "openai"},
            {"id": "gpt-4-turbo", "object": "model", "created": 1715367049, "owned_by": "openai"},
            {"id": "claude-3.5-sonnet", "object": "model", "created": 1715367049, "owned_by": "anthropic"},
            {"id": "gemini-1.5-flash", "object": "model", "created": 1715367049, "owned_by": "google"},
            {"id": "gemini-1.5-pro", "object": "model", "created": 1715367049, "owned_by": "google"},
            {"id": "llama-3.3-70b-versatile", "object": "model", "created": 1715367049, "owned_by": "groq"},
            {"id": "llama-3.1-8b-instant", "object": "model", "created": 1715367049, "owned_by": "groq"},
            {"id": "openai/gpt-oss-20b", "object": "model", "created": 1715367049, "owned_by": "groq"},
            {"id": "qwen/qwen3.8-27b", "object": "model", "created": 1715367049, "owned_by": "groq"},
        ]
        return Response({
            "object": "list",
            "data": models
        }, status=status.HTTP_200_OK)

