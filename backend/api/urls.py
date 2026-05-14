from django.urls import path
from . import views

urlpatterns = [
    # Task Routes
    path("tasks/", views.TaskListCreate.as_view(), name="task-list-create"),
    path("tasks/update/<int:pk>/", views.TaskUpdate.as_view(), name="task-update"),
    path("tasks/delete/<int:pk>/", views.TaskDelete.as_view(), name="task-delete"),
    
    # Visit Routes
    path("visits/", views.VisitListCreate.as_view(), name="visit-list-create"),
    path("visits/update/<int:pk>/", views.VisitUpdate.as_view(), name="visit-update"),
    path("visits/delete/<int:pk>/", views.VisitDelete.as_view(), name="visit-delete"),

    # User Routes
    path("users/", views.UserList.as_view(), name="user-list"),
    path("users/update/<int:pk>/", views.UserUpdate.as_view(), name="user-update"),
    path("users/delete/<int:pk>/", views.UserDelete.as_view(), name="user-delete"),
    
    # Region Routes
    path("regions/", views.RegionListCreate.as_view(), name="region-list-create"),
    path("regions/update/<int:pk>/", views.RegionUpdate.as_view(), name="region-update"),
    path("regions/delete/<int:pk>/", views.RegionDelete.as_view(), name="region-delete"),
    
    # Team Routes
    path("teams/", views.TeamListCreate.as_view(), name="team-list-create"),
    path("teams/update/<int:pk>/", views.TeamUpdate.as_view(), name="team-update"),
    path("teams/delete/<int:pk>/", views.TeamDelete.as_view(), name="team-delete"),
    
    # Audit Route
    path("logs/", views.ActivityLogListCreate.as_view(), name="log-list-create"),
]