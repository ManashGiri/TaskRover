from rest_framework import generics, permissions
from .models import User, Task, Visit, Region, Team, ActivityLog
from .serializers import UserSerializer, TaskSerializer, VisitSerializer, RegionSerializer, TeamSerializer, ActivityLogSerializer, RegisterSerializer
from django.db.models import Q
from rest_framework.exceptions import PermissionDenied


# USER VIEW 
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

class UserList(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'ADMIN':
            return User.objects.all()
        elif user.role == 'REGIONAL_MANAGER':
            return User.objects.filter(
                Q(id=user.id) | 
                Q(region=user.region) | 
                Q(region__isnull=True)
            )
        elif user.role == 'TEAM_LEAD':
            return User.objects.filter(
                Q(id=user.id) | 
                Q(team=user.team) | 
                (Q(role='FIELD_AGENT') & Q(team__isnull=True))
            )
        elif user.role == 'FIELD_AGENT':
            if user.team:
                return User.objects.filter(team=user.team)
            return User.objects.filter(id=user.id)
        return User.objects.filter(id=user.id)
    
class UserUpdate(generics.UpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'ADMIN':
            return User.objects.all()
            
        elif user.role == 'REGIONAL_MANAGER':
            return User.objects.filter(Q(region=user.region) | Q(region__isnull=True))
            
        elif user.role == 'TEAM_LEAD':
            return User.objects.filter(
                Q(id=user.id) | 
                (Q(role='FIELD_AGENT') & (Q(team=user.team) | Q(team__isnull=True)))
            )
            
        return User.objects.filter(id=user.id)


class UserDelete(generics.DestroyAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return User.objects.all()
        return User.objects.none()


# TASK VIEWS
class TaskListCreate(generics.ListCreateAPIView):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role in ['ADMIN', 'AUDITOR']:
            return Task.objects.all()
        return Task.objects.filter(Q(assigned_to=user) | Q(assigned_to__isnull=True))

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class TaskUpdate(generics.UpdateAPIView):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == 'ADMIN' or user.role == 'AUDITOR':
            return Task.objects.all()

        return Task.objects.filter(
            Q(assigned_to=user) | 
            
            Q(created_by=user) | 

            Q(assigned_to__isnull=True, status='PENDING')
        ).distinct() 


class TaskDelete(generics.DestroyAPIView):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'ADMIN':
            return Task.objects.all()
            
        return Task.objects.filter(
            Q(created_by=user) | 

            Q(assigned_to=user)
        ).distinct()


# VISIT VIEWS
class VisitListCreate(generics.ListCreateAPIView):
    serializer_class = VisitSerializer
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = VisitSerializer
    
    def get_queryset(self):
        return Visit.objects.all().order_by('-id')
    
    def perform_create(self, serializer):
            serializer.save(agent=self.request.user)

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN' or user.role == 'AUDITOR':
            return Visit.objects.all()
        elif user.role == 'REGIONAL_MANAGER':
            return Visit.objects.filter(agent__region=user.region)
        elif user.role == 'TEAM_LEAD':
            return Visit.objects.filter(agent__team=user.team)
        else:
            return Visit.objects.filter(agent=user)

class VisitUpdate(generics.UpdateAPIView):
    serializer_class = VisitSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Visit.objects.all()
        elif user.role == 'REGIONAL_MANAGER':
            return Visit.objects.filter(agent__region=user.region)
        elif user.role == 'TEAM_LEAD':
            return Visit.objects.filter(agent__team=user.team)
        else:
            return Visit.objects.filter(agent=user)

class VisitDelete(generics.DestroyAPIView):
    serializer_class = VisitSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Visit.objects.all()
        elif user.role == 'REGIONAL_MANAGER':
            return Visit.objects.filter(agent__region=user.region)
        elif user.role == 'TEAM_LEAD':
            return Visit.objects.filter(agent__team=user.team)
        else:
            return Visit.objects.none()


# REGION VIEWS
class RegionListCreate(generics.ListCreateAPIView):
    serializer_class = RegionSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Region.objects.all()

    def perform_create(self, serializer):
        if self.request.user.role != 'ADMIN':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only Admins can create new Regions.")
        serializer.save()

class RegionUpdate(generics.UpdateAPIView):
    serializer_class = RegionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'ADMIN':
            return Region.objects.all()
        return Region.objects.none()

class RegionDelete(generics.DestroyAPIView):
    serializer_class = RegionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'ADMIN':
            return Region.objects.all()
        return Region.objects.none()


# TEAM VIEWS 
class TeamListCreate(generics.ListCreateAPIView):
    serializer_class = TeamSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN' or user.role == 'AUDITOR':
            return Team.objects.all()
        elif user.role == 'REGIONAL_MANAGER':
            return Team.objects.filter(region=user.region)
        else:
            if user.team:
                return Team.objects.filter(id=user.team.id)
            return Team.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        
        if user.role not in ['ADMIN', 'TEAM_LEAD']:
            raise PermissionDenied("Only Admins and Team Leads can create new Teams.")
            
        serializer.save()

class TeamUpdate(generics.UpdateAPIView):
    serializer_class = TeamSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == 'ADMIN':
            return Team.objects.all()
        elif user.role == 'REGIONAL_MANAGER':
            return Team.objects.filter(region=user.region)
        elif user.role == 'TEAM_LEAD':
            if user.team:
                return Team.objects.filter(id=user.team.id)
            return Team.objects.none()
    
        return Team.objects.none()

class TeamDelete(generics.DestroyAPIView):
    serializer_class = TeamSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'ADMIN':
            return Team.objects.all()
        return Team.objects.none()

# ACTIVITY LOG VIEWS

class ActivityLogListCreate(generics.ListCreateAPIView):
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN' or user.role == 'AUDITOR':
            return ActivityLog.objects.all()
        elif user.role == 'REGIONAL_MANAGER':
            return ActivityLog.objects.filter(user__region=user.region)
        elif user.role == 'TEAM_LEAD':
            return ActivityLog.objects.filter(user__team=user.team)
        else:
            return ActivityLog.objects.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)