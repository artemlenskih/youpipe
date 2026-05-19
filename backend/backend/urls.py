from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.shortcuts import redirect

urlpatterns = [
    #path('', lambda request: redirect('admin/')),
    path('admin/', admin.site.get_admin_urls() if hasattr(admin, 'get_admin_urls') else admin.site.urls),
    path('api/', include('api.urls')),
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
