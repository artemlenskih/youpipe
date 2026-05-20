from django.urls import path
from django.http import JsonResponse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, VideoListCreateView, VideoStreamView, ChatMessageListCreateView, VideoDeleteView

def api_root(request):
    return JsonResponse({"status": "API is running"})

urlpatterns = [
    path('', api_root),
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('videos/', VideoListCreateView.as_view(), name='video_list_create'),
    path('videos/<int:pk>/stream/', VideoStreamView.as_view(), name='video_stream'),
    path('chat/', ChatMessageListCreateView.as_view(), name='chat_list_create'),
    path('videos/<int:pk>/delete/', VideoDeleteView.as_view(), name='video_delete'),
]
