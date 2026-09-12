from django.urls import path
from .views import (
    CompressPromptView,
    ExecutePromptView,
    OpenAIChatCompletionsProxyView,
    ModelsProxyView,
    HistoryListView,
    PricingListView,
    SystemHealthView
)

urlpatterns = [
    path('compress/', CompressPromptView.as_view(), name='api-compress'),
    path('execute/', ExecutePromptView.as_view(), name='api-execute'),
    path('history/', HistoryListView.as_view(), name='api-history'),
    path('pricing/', PricingListView.as_view(), name='api-pricing'),
    path('health/', SystemHealthView.as_view(), name='api-health'),
    
    # OpenAI-Compatible Drop-In Proxy Endpoints
    path('v1/chat/completions', OpenAIChatCompletionsProxyView.as_view(), name='api-v1-chat-completions'),
    path('v1/chat/completions/', OpenAIChatCompletionsProxyView.as_view(), name='api-v1-chat-completions-slash'),
    path('v1/models', ModelsProxyView.as_view(), name='api-v1-models'),
    path('v1/models/', ModelsProxyView.as_view(), name='api-v1-models-slash'),
    path('models', ModelsProxyView.as_view(), name='api-models'),
    path('models/', ModelsProxyView.as_view(), name='api-models-slash'),
]