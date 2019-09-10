import getpass

if getpass.getuser() in ['root', 'www-data']:
	from .prod import *
else:
	from .dev import *
