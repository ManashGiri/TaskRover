from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Region, Team, Task, Visit, ActivityLog

class BaseUserAdmin(UserAdmin):
    model = User
    list_display = ['username', 'email', 'role', 'team', 'region', 'is_staff']
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Roles & Org', {'fields': ('role', 'region', 'team')}),
    )

admin.site.register(User, BaseUserAdmin)
admin.site.register(Region)
admin.site.register(Team)
admin.site.register(Task)
admin.site.register(Visit)
admin.site.register(ActivityLog)
