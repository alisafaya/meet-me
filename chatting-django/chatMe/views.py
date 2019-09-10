from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect
from django.views import View
from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.contrib.auth import logout
from django.template.defaulttags import register
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from .models import *
from .utils import *
import json
from django.db.models import Q


@register.filter
def get_item(dictionary, key):
	return dictionary.get(key)

class Login(View):
	def get(self, request, *args, **kwargs):
		if request.user.is_authenticated:
			return HttpResponseRedirect('/')
		else:
			return render(request, 'login.html', {'errors': False})

	def post(self, request, *args, **kwargs):
		username = request.POST['username']
		password = request.POST['password']
		user = authenticate(request, username=username, password=password)
		if user is not None:
			login(request, user)
			return HttpResponseRedirect('/')
		else:
			return render(request, 'login.html', {'errors': True})

class Register(View):
	def get(self, request, *args, **kwargs):
		return render(request, 'register.html')

	def post(self, request, *args, **kwargs):
		global ChatmeBroadcaster
		username = request.POST['username']
		email = request.POST['email']
		password = request.POST['password']
		if len(User.objects.filter(username=username)) != 0:
			return render(request, 'register.html', {'errors': 'Bu kullanıcı adı alınmıştır. Başka bir ad seçiniz.' })

		newUser = User(username=username,email=email)
		newUser.set_password(password)
		newUser.save()
		profile_image, created =  UserProfileImage.objects.get_or_create(user=newUser)
		profile_image.image = gravatar_url(email)
		profile_image.user = newUser
		profile_image.save()

		return render(request, 'login.html')

def logout_view(request):
	logout(request)
	return HttpResponseRedirect('/')

@method_decorator(login_required, name='dispatch')
class MainPage(View):
	def get(self, request, *args, **kwargs):

		current_user = request.user
		sent_calls = current_user.sent_calls.filter(type='S').all()
		received_calls = current_user.received_calls.filter(type='S').all()

		callers_dic = {}

		for call in sent_calls:
			if call.receivers.first() not in callers_dic.keys():
				callers_dic[call.receivers.first()] = []
			callers_dic[call.receivers.first()].append(call)

		for call in received_calls:
			if call.sender not in callers_dic.keys():
				callers_dic[call.sender] = []
			callers_dic[call.sender].append(call)

		for call_set in callers_dic.values():
			call_set.sort(key=lambda call: call.date)

		callers_set = [ (caller, call_set[-1]) for caller, call_set in callers_dic.items() ]
		callers_set.sort(key=lambda tup: tup[1].date, reverse=True )

		token, created = Token.objects.get_or_create(user=current_user)

		followed_groups = current_user.group_set.all()
		groups_calls_set = [ (g, g.call_set.all()) for g in followed_groups]

		for g, call_set in groups_calls_set:
			call_set.sort(key=lambda call: call.date)
		groups_calls_set = [ (g, call_set[-1]) for g, call_set in groups_calls_set ]
		groups_calls_set.sort(key=lambda tup: tup[1].date, reverse=True )

		users = []
		for user in User.objects.all():
			if user not in callers_dic.keys() \
			and user != current_user and user.username != 'chatting_node':
				users.append(user)

		context = {
			'current_user': current_user,
			'callers_set': callers_set,
			'token': token,
			'groups_calls_set': groups_calls_set,
			'users':users
			}
		return render(request, 'home.html', context)
