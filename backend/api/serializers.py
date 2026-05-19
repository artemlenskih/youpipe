from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import Video, ChatMessage

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'email')

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Пользователь с таким email уже существует.")
        return value

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Это имя пользователя уже занято.")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

class VideoSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Video
        fields = ('id', 'title', 'description', 'video_file', 'created_at', 'user')

class ChatMessageSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    video_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = ChatMessage
        fields = ('id', 'text', 'created_at', 'user', 'video', 'video_id')
        read_only_fields = ('video',)