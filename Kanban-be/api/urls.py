from django.urls import path
from django.urls import include
from django.urls import re_path
from api.consumers import UserConsumer
from api.kanbanBoard.consumers import WorkspaceConsumer

websocket_urlpatterns = [
    re_path(r"ws/user/", UserConsumer.as_asgi()),
    re_path(r"ws/workspace/(?P<workspace_id>[\w-]+)/", WorkspaceConsumer.as_asgi()),
]

urlpatterns = [
    path('workspaces/', include('api.workspaces.urls')),
    path('workspaces/<str:workspace_id>/', include('api.kanbanBoard.urls')),
    path('profiles/', include('api.profiles.urls')),
    path('notifications/', include('api.notifications.urls')),
]