from django.contrib import admin
from .models import CompressionSession, CostLog

@admin.register(CompressionSession)
class CompressionSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'target_model', 'compression_engine', 'raw_token_count', 'sir_token_count', 'token_reduction_pct', 'fidelity_score', 'created_at')
    list_filter = ('target_model', 'compression_engine', 'fidelity_passed', 'status')
    search_fields = ('id', 'raw_prompt', 'sir_yaml')
    readonly_fields = ('id', 'created_at')

@admin.register(CostLog)
class CostLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'session', 'target_model', 'raw_input_cost_usd', 'sir_input_cost_usd', 'cost_saved_usd', 'created_at')
    list_filter = ('target_model',)
    readonly_fields = ('created_at',)
