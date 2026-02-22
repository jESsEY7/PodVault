from django.urls import path
from .views import CurrentUserView, RegisterView, CustomTokenObtainPairView, LogoutView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('me/', CurrentUserView.as_view(), name='current_user'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('register/', RegisterView.as_view(), name='register'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
]
