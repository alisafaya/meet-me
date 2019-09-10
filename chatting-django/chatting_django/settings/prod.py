from .base import *

# Database
# https://docs.djangoproject.com/en/2.1/ref/settings/#databases
DEBUG = False

DATABASES = {
	'default': {
		'ENGINE': 'django.db.backends.postgresql_psycopg2',
		'NAME': 'veritabani_ismi',
		'USER': 'kullanici_adi',
		'PASSWORD': 'sqlserver_sifre',
		'HOST': 'localhost',
		'PORT': '',
	}
}

STATIC_ROOT = os.path.join(BASE_DIR, 'static')
