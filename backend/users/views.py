from rest_framework import generics, permissions, viewsets, filters
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import UserActivity
from .serializers import UserActivitySerializer

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
            # Add other fields as needed for the frontend
        })

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


