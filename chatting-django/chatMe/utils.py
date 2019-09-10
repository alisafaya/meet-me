from .models import *
import hashlib
import urllib

def gravatar_url(email, size=200):
	return "https://www.gravatar.com/avatar/%s?%s" % (hashlib.md5(email.lower().encode('utf-8')).hexdigest(), urllib.parse.urlencode({'d':'identicon', 's':str(size)}))

def get_call_set(sender, receiver):
	calls = list(Call.objects.filter(sender=sender, type='S', receivers=receiver))
	calls += list(Call.objects.filter(sender=receiver, type='S', receivers=sender))
	calls.sort(key=lambda m: m.date )
	return calls

def get_group_call_set(id):
	calls = Group.objects.filter(id=id)[0].call_set.order_by('date').all()
	return calls
