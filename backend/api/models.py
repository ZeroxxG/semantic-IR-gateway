import uuid
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver

class CompressionSession(models.Model):
    STATUS_CHOICES = [
        ('compressed', 'Compressed'),
        ('executed', 'Executed'),
        ('failed', 'Failed'),
        ('passthrough', 'Optimal (Pass-through)'),
        ('PASSTHROUGH_OPTIMAL', 'Pass-through (Optimal)'),
        ('PASSTHROUGH_ALREADY_OPTIMAL', 'Pass-through (Already Optimal)'),
        ('PASSTHROUGH_NEGATIVE_OVERHEAD', 'Pass-through (Negative Overhead)'),
        ('PASSTHROUGH_NEGATIVE_SAVINGS', 'Pass-through (Negative Savings)'),
        ('FALLBACK_FIDELITY_GUARD', 'Fallback (Fidelity Guard)'),
        ('FALLBACK', 'Fallback (General)'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    raw_prompt = models.TextField(help_text="Original verbose prompt")
    sir_yaml = models.TextField(help_text="Compiled Semantic Intermediate Representation (YAML)")
    target_model = models.CharField(max_length=64, default="gpt-4o", help_text="Target frontier model")
    raw_token_count = models.IntegerField(default=0)
    sir_token_count = models.IntegerField(default=0)
    tokens_saved = models.IntegerField(default=0)
    token_reduction_pct = models.FloatField(default=0.0)
    fidelity_score = models.FloatField(default=1.0, help_text="Cosine similarity score (0.0 to 1.0)")
    fidelity_passed = models.BooleanField(default=True, help_text="True if score >= 0.85")
    compression_latency_ms = models.FloatField(default=0.0)
    inference_latency_ms = models.FloatField(null=True, blank=True)
    llm_response = models.TextField(null=True, blank=True, help_text="Output returned by frontier LLM")
    compression_engine = models.CharField(max_length=64, default="gemini", help_text="Engine used (gemini, groq, ollama, proxy)")
    client_ip = models.CharField(max_length=64, null=True, blank=True, help_text="Client IP for telemetry")
    status = models.CharField(max_length=64, choices=STATUS_CHOICES, default='compressed')

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"Session {self.id} [{self.target_model}] - {self.token_reduction_pct:.1f}% saved"


class CostLog(models.Model):
    session = models.OneToOneField(
        CompressionSession,
        on_delete=models.CASCADE,
        related_name='cost_log'
    )
    target_model = models.CharField(max_length=64)
    input_cost_per_1m = models.FloatField(default=0.0)
    output_cost_per_1m = models.FloatField(default=0.0)
    raw_input_cost_usd = models.FloatField(default=0.0)
    sir_input_cost_usd = models.FloatField(default=0.0)
    cost_saved_usd = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"CostLog for {self.session_id} - Saved ${self.cost_saved_usd:.6f}"


# Auto-prune signal: keep table to max 500 records (Design Decision #4)
@receiver(post_save, sender=CompressionSession)
def prune_old_sessions(sender, instance, created, **kwargs):
    if created:
        MAX_RECORDS = 500
        count = CompressionSession.objects.count()
        if count > MAX_RECORDS:
            excess_ids = list(
                CompressionSession.objects.order_by('created_at')
                .values_list('id', flat=True)[:count - MAX_RECORDS]
            )
            if excess_ids:
                CompressionSession.objects.filter(id__in=excess_ids).delete()
