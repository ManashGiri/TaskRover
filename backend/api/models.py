from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings
from django.db.models.signals import pre_save
from django.dispatch import receiver
from .mock_ai_service import MockAIService

class Region(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class Team(models.Model):
    name = models.CharField(max_length=100)
    region = models.ForeignKey(Region, on_delete=models.CASCADE, null=True, blank=True, related_name='teams')

    def __str__(self):
        if self.region:
            return f"{self.name} ({self.region.name})"
        return self.name

class User(AbstractUser):
    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('REGIONAL_MANAGER', 'Regional Manager'),
        ('TEAM_LEAD', 'Team Lead'),
        ('FIELD_AGENT', 'Field Agent'),
        ('AUDITOR', 'Auditor'),
    )
    role = models.CharField(max_length=25, choices=ROLE_CHOICES, default='FIELD_AGENT')
    region = models.ForeignKey(Region, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')

class Task(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('VERIFIED', 'Verified'), 
        ('FLAGGED', 'Flagged'),
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    assigned_to = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_tasks')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_edited = models.BooleanField(default=False)

    def __str__(self):
        return self.title

class Visit(models.Model):
    STATUS_CHOICES = (
        ('SCHEDULED', 'Scheduled'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
    )
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='visits')
    agent = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='visits')
    
    visit_notes = models.TextField(blank=True, null=True)
    ai_summary = models.TextField(blank=True, null=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SCHEDULED')
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Visit for {self.task.title}"

class ActivityLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.action}"


@receiver(pre_save, sender=Visit)
def automate_visit_ai_summary(sender, instance, **kwargs):
    if instance.id:
        try:
            old_visit = Visit.objects.get(id=instance.id)
 
            if old_visit.status != 'COMPLETED' and instance.status == 'COMPLETED':
                task_name = instance.task.title if instance.task else "Unknown Task"
                
                ai_data = MockAIService.generate_analysis(task_name, instance.visit_notes)
                
                formatted_output = (
                    f"SUMMARY: {ai_data['summary']}\n"
                    f"RISK FLAG: {ai_data['risk_flag']}\n"
                    f"RECOMMENDED ACTION: {ai_data['recommendation']}"
                )
                instance.ai_summary = formatted_output
                
        except Visit.DoesNotExist:
            pass