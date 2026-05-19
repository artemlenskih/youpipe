import os
import re
from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt

from .models import Video, ChatMessage
from .serializers import RegisterSerializer, VideoSerializer, ChatMessageSerializer

@method_decorator(csrf_exempt, name='dispatch')
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerialize


class VideoListCreateView(generics.ListCreateAPIView):
    queryset = Video.objects.all().order_by('-created_at')
    serializer_class = VideoSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ChatMessageListCreateView(generics.ListCreateAPIView):
    serializer_class = ChatMessageSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        queryset = ChatMessage.objects.all().order_by('created_at')
        video_id = self.request.query_params.get('video_id')
        if video_id:
            queryset = queryset.filter(video_id=video_id)
        return queryset

    def perform_create(self, serializer):
        video_id = self.request.data.get('video_id')
        video = get_object_or_404(Video, pk=video_id)
        serializer.save(user=self.request.user, video=video)


class VideoStreamView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request, pk):
        video = get_object_or_404(Video, pk=pk)
        path = video.video_file.path

        if not os.path.exists(path):
            raise Http404("Файл не найден")

        file_size = os.path.getsize(path)
        range_header = request.META.get('HTTP_RANGE', '').strip()

        start = 0
        end = file_size - 1
        status_code = 200

        if range_header:
            match = re.search(r'bytes=(\d+)-(\d*)', range_header)
            if match:
                start = int(match.group(1))
                if match.group(2):
                    end = int(match.group(2))
                status_code = 206

        if end >= file_size:
            end = file_size - 1

        content_length = end - start + 1

        file = open(path, 'rb')
        file.seek(start)

        response = FileResponse(file, status=status_code, content_type='video/mp4')
        response['Accept-Ranges'] = 'bytes'
        response['Content-Range'] = f'bytes {start}-{end}/{file_size}'
        response['Content-Length'] = str(content_length)

        return response

class VideoDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        video = get_object_or_404(Video, pk=pk)

        if video.user != request.user:
            return Response({"detail": "Вы не можете удалить чужое видео."}, status=status.HTTP_403_FORBIDDEN)

        if video.video_file and os.path.exists(video.video_file.path):
            os.remove(video.video_file.path)

        video.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
