from rest_framework import serializers
from .models import CompressionSession, CostLog

class CostLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = CostLog
        fields = [
            'id', 'target_model', 'input_cost_per_1m', 'output_cost_per_1m',
            'raw_input_cost_usd', 'sir_input_cost_usd', 'cost_saved_usd', 'created_at'
        ]


class CompressionSessionSerializer(serializers.ModelSerializer):
    cost_log = CostLogSerializer(read_only=True)

    class Meta:
        model = CompressionSession
        fields = [
            'id', 'created_at', 'raw_prompt', 'sir_yaml', 'target_model',
            'raw_token_count', 'sir_token_count', 'tokens_saved', 'token_reduction_pct',
            'fidelity_score', 'fidelity_passed', 'compression_latency_ms',
            'inference_latency_ms', 'llm_response', 'compression_engine',
            'status', 'cost_log'
        ]


class CompressRequestSerializer(serializers.Serializer):
    raw_prompt = serializers.CharField(required=True, allow_blank=False)
    target_model = serializers.CharField(required=False, default="gpt-4o")
    compression_engine = serializers.CharField(required=False, default="auto")  # auto, gemini, groq, ollama


class ExecuteRequestSerializer(serializers.Serializer):
    session_id = serializers.UUIDField(required=True)
    custom_sir_yaml = serializers.CharField(required=False, allow_blank=True)
    target_model = serializers.CharField(required=False, default=None)
