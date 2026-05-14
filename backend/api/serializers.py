from rest_framework import serializers
from .models import User, Region, Team, Task, Visit, ActivityLog

class UserSerializer(serializers.ModelSerializer):
    team_name = serializers.ReadOnlyField(source='team.name')
    region_name = serializers.ReadOnlyField(source='region.name')
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'role', 'region', 'team', 'team_name', 'region_name']
        extra_kwargs = {'password': {'write_only': True, 'required': False}}

    def update(self, instance, validated_data):
        if 'password' in validated_data:
            password = validated_data.pop('password')
            instance.set_password(password)
        return super().update(instance, validated_data)
    
        
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'email']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data.get('email', '')
        )
        return user
        
class RegionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Region
        fields = '__all__'

class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = '__all__'

# class TaskSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Task
#         fields = '__all__'
#         read_only_fields = ['created_by', 'created_at', 'updated_at']

class TaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.ReadOnlyField(source='assigned_to.username')

    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'status', 'assigned_to', 'assigned_to_name', 'created_at', 'created_by', 'is_edited']

class VisitSerializer(serializers.ModelSerializer):
    task_title = serializers.ReadOnlyField(source='task.title')
    agent_name = serializers.ReadOnlyField(source='agent.username')
    class Meta:
        model = Visit
        fields = ['id','task','task_title','agent_name','visit_notes','ai_summary','status','started_at','completed_at']
        read_only_fields = ['agent', 'ai_summary']

class ActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.username')
    class Meta:
        model = ActivityLog
        fields = ['id', 'user', 'user_name', 'action', 'timestamp']