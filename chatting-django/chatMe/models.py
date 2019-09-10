from django.db import models
from django.contrib.auth.models import User
from sorl.thumbnail import ImageField
from django.conf import settings
import hashlib
import urllib

def gravatar_url(email, size=50):
	return "https://www.gravatar.com/avatar/%s?%s" % (hashlib.md5(email.lower().encode('utf-8')).hexdigest(), urllib.parse.urlencode({'d':'identicon', 's':str(size)}))

class UserProfileImage(models.Model):
	user = models.OneToOneField(settings.AUTH_USER_MODEL, related_name='profile_image', on_delete=models.CASCADE)
	image = models.CharField(max_length=512, null=True)

class Group(models.Model):
	name = models.CharField(max_length=64)
	create_date = models.DateTimeField(auto_now=True)
	admin = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='managed_groups', on_delete=models.CASCADE)
	image = models.CharField(max_length=512,blank=True, null=True)
	users = models.ManyToManyField(settings.AUTH_USER_MODEL)

	def __str__(self):
		return self.name

	class Meta:
		verbose_name = 'Chat group'

	def save(self, *args, **kwargs):
		self.image = gravatar_url( self.admin.username + '@chatme.com')
		super().save(*args, **kwargs)

class Call(models.Model):
	SINGLE_USER = 'S'
	GROUP_CONVERSATION = 'G'
	MESSAGE_DESTINATION_CHOICES = (
		(SINGLE_USER, 'Single user'),
		(GROUP_CONVERSATION, 'Group'),
	)
	sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_calls')
	receivers = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='received_calls')
	group = models.ForeignKey(Group,blank=True, null=True, on_delete=models.CASCADE)
	date = models.DateTimeField(auto_now=True)
	type = models.CharField(max_length=1,blank=True, choices=MESSAGE_DESTINATION_CHOICES, default=SINGLE_USER)
	missed_call = models.BooleanField(default=False)
	is_video = models.BooleanField(default=False)
