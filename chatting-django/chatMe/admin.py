from django.contrib import admin
from chatMe.models import *


class CallAdmin(admin.ModelAdmin):
    model = Call
    list_display = ('date', 'sender', 'type')

admin.site.register(Call, CallAdmin)
admin.site.register(Group)
admin.site.register(UserProfileImage)
