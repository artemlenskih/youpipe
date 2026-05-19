from django.db import models
from django.contrib.auth.models import User

class Video(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    video_file = models.FileField(upload_to='videos/')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

class ChatMessage(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name='messages')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)