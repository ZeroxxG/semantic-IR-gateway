from django.contrib import admin
from django.urls import path, include
from api.views import OpenAIChatCompletionsProxyView, ModelsProxyView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    
    # Direct drop-in endpoints when clients configure base_url="http://localhost:8000/v1" or "http://localhost:8000"
    path('v1/chat/completions', OpenAIChatCompletionsProxyView.as_view(), name='root-v1-chat-completions'),
    path('v1/chat/completions/', OpenAIChatCompletionsProxyView.as_view(), name='root-v1-chat-completions-slash'),
    path('v1/models', ModelsProxyView.as_view(), name='root-v1-models'),
    path('v1/models/', ModelsProxyView.as_view(), name='root-v1-models-slash'),
    path('models', ModelsProxyView.as_view(), name='root-models'),
    path('models/', ModelsProxyView.as_view(), name='root-models-slash'),
]

