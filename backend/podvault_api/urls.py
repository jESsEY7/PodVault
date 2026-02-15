"""
URL configuration for podvault_api project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')), # Points to users app (me endpoint)
    path('api/', include('content.urls')),     # Points to episodes/podcasts directly under /api/
    path('api/', include('ingest.urls')),
    path('api/v1/content/', include('content.urls')), # Keeping v1 for specific namespaced usage if needed
    path('api/v1/sync/', include('sync.urls')),
    path('api/v1/creator/', include('creator.urls')),
    path('api/v1/payouts/', include('payouts.urls')),
]

