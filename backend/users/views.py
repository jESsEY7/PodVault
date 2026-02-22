from rest_framework import generics, permissions, viewsets, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import UserActivity, UserPreference
from .serializers import UserActivitySerializer, UserPreferenceSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

class CurrentUserView(generics.RetrieveAPIView):
    """
    Returns the currently logged-in user's details.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'subscription_tier': getattr(user, 'subscription_tier', 'free'),
            'avatar': getattr(user, 'avatar', None),
            'date_joined': user.date_joined,
        })


class EmailOrUsernameTokenSerializer(TokenObtainPairSerializer):
    """
    Allows login with either a username OR an email address.
    The simplejwt default only supports username.
    """
    def validate(self, attrs):
        # The incoming field is always called 'username' by simplejwt,
        # but the user might have typed an email address.
        identifier = attrs.get('username', '').strip()
        password   = attrs.get('password', '')

        if not identifier or not password:
            raise self.fail('required_fields')

        User = get_user_model()
        user = User.objects.filter(
            Q(username__iexact=identifier) | Q(email__iexact=identifier)
        ).first()

        if user is None or not user.check_password(password):
            raise self.fail('no_active_account')

        # Temporarily set username so the parent validate() can find the user
        attrs['username'] = user.username
        return super().validate(attrs)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailOrUsernameTokenSerializer



class RegisterView(APIView):
    """
    Creates a new user account and returns JWT tokens so the frontend
    can log the user in immediately after sign-up.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '')
        confirm_password = request.data.get('confirm_password', '')

        if not email or not username or not password:
            return Response(
                {'error': 'email, username and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if password != confirm_password:
            return Response(
                {'error': 'Passwords do not match'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(password) < 8:
            return Response(
                {'error': 'Password must be at least 8 characters'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'An account with this email already exists'},
                status=status.HTTP_409_CONFLICT
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'This username is already taken'},
                status=status.HTTP_409_CONFLICT
            )

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
        )

        # Issue JWT tokens immediately so the frontend can auto-login
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
            }
        }, status=status.HTTP_201_CREATED)


class LogoutView(APIView):
    """
    Blacklists the provided refresh token so it can no longer be used.
    The client should also delete access_token from localStorage.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'detail': 'Refresh token required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            # Token may already be expired/invalid - that's fine, logout is idempotent
            pass
        return Response({'detail': 'Successfully logged out'}, status=status.HTTP_200_OK)


class CommentViewSet(viewsets.ModelViewSet):
    """
    API endpoint for comments (stored as UserActivity).
    """
    queryset = UserActivity.objects.filter(activity_type='comment')
    serializer_class = UserActivitySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        episode_id = self.request.query_params.get('episode_id')
        if episode_id:
            queryset = queryset.filter(episode_id=episode_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, activity_type='comment')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, activity_type='comment')

class UserActivityViewSet(viewsets.ModelViewSet):
    """
    API endpoint for user activities (likes, plays, follows, comments, shares).
    """
    queryset = UserActivity.objects.all()
    serializer_class = UserActivitySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    ordering_fields = ['created_at', 'activity_type']
    ordering = ['-created_at']
    search_fields = ['activity_type']

    def get_queryset(self):
        queryset = super().get_queryset()
        # Filter by user
        user_id = self.request.query_params.get('user_id')
        if not user_id:
             user_id = self.request.query_params.get('created_by')
             
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        # Filter by activity type
        activity_type = self.request.query_params.get('activity_type')
        if activity_type:
            queryset = queryset.filter(activity_type=activity_type)
        # Filter by episode
        episode_id = self.request.query_params.get('episode_id')
        if episode_id:
            queryset = queryset.filter(episode_id=episode_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class UserPreferenceViewSet(viewsets.ModelViewSet):
    """
    API endpoint for user preferences.
    """
    queryset = UserPreference.objects.all()
    serializer_class = UserPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users can only see their own preferences
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
