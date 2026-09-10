from django.urls import path
from .views import (
    CompressPromptView,
    ExecutePromptView,
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
]
