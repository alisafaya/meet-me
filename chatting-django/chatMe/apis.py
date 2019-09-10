from rest_framework import serializers, viewsets, permissions, authentication
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken, APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from rest_framework.parsers import JSONParser,MultiPartParser
from django.contrib.auth import authenticate, login
from django.core.files import File
from uuid import UUID, uuid4
from .models import *
from .serializers import *
from .utils import *
import json
import base64

from django.contrib.auth.models import User

class CallViewSet(viewsets.ModelViewSet):
	queryset = Call.objects.filter(id=-1)
	authentication_classes = (authentication.TokenAuthentication,)
	permission_classes = (permissions.IsAuthenticated,)
	serializer_class = CallSerializer
	parser_classes = (MultiPartParser, JSONParser)

	def get_queryset(self):
		try:
			id = int(self.request.GET['id'])
		except:
			param = self.request.GET.get('id', '')
			if param != '' and param[0] == 'G':
				return get_group_call_set(int(param[1:]))
			else:
				return []

		if len(User.objects.filter(id=id)) == 0:
			return []
		return get_call_set(self.request.user, User.objects.filter(id=id).first())


class GroupViewSet(viewsets.ModelViewSet):
	queryset = Group.objects.all()
	authentication_classes = (authentication.TokenAuthentication,)
	permission_classes = (permissions.IsAuthenticated,)
	serializer_class = GroupSerializer
	parser_classes = (MultiPartParser, JSONParser)


class ValidateToken(APIView):
	authentication_classes = (authentication.TokenAuthentication,)

	def post(self, request, *args, **kwargs):
		token = ''
		user_id = None
		try:
			token = request.data.get('token', '')
			user_id = int(request.data.get('user_id', -1))

		except:
			return Response({
				'valid': False
			})
		if len(Token.objects.filter(user=user_id, key=token)) == 0:
			return Response({
				'valid': False
			})

		return Response({
			'valid': True
		})


# class CreateGroup(APIView):
# 	authentication_classes = (authentication.TokenAuthentication,)
#
# 	def get(self, request, *args, **kwargs):
# 		group_name = ''
# 		try:
# 			group_name = request.GET.get('name', '')
# 			if Group.objects.filter(name=group_name).first() is not None:
# 				return Response({
# 					'created': False
# 				})
# 			else:
# 				g = Group.objects.create(
# 				name=group_name,
# 				admin=request.user,
# 				image=gravatar_url(request.user.username +'@chat.me')
# 				)
# 				g.users.add(request.user)
# 		except:
# 			return Response({
# 				'created': False
# 			})
#
# 		return Response({
# 			'created': True
# 		})


# class JoinGroup(APIView):
# 	authentication_classes = (authentication.TokenAuthentication,)
#
# 	def get(self, request, *args, **kwargs):
# 		group_name = ''
# 		try:
# 			group_name = request.GET.get('name', '')
# 			g = Group.objects.filter(name=group_name).first()
# 			if g is not None and request.user not in g.users.all():
# 				g.users.add(request.user)
# 				return Response({
# 					'joined': True
# 				})
# 			else:
# 				return Response({
# 					'joined': False
# 				})
# 		except:
# 			return Response({
# 				'joined': False
# 			})
