from django import views
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from api.views import RegisterView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    path("user/register/", RegisterView.as_view(), name="register"),
    path('user/token/', TokenObtainPairView.as_view(), name='get_token'),
    path('user/token/refresh/', TokenRefreshView.as_view(), name='refresh_token'),
    
    path('api/', include('api.urls')),
]