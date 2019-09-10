## MeetMe-app's django module

You need to have `virtualenv` and `python` installed, if you do not please install them first.

### For django modules setup please run the following commands in this dir:

#### Firstly create virtual environment:
```    
$ virtualenv -p python3 env
```

#### Activate the environment:
```
$ source env/bin/activate
```

or use  for Windows
```
$ .\env\Scripts\activate
```

#### Now install required packages:
```
$ pip install -r req.txt
```

#### After that run the migrations and create super user:

```
$ python manage.py migrate
$ python manage.py createsuperuser
```

#### Now you are ready for running!

```
$ python manage.py runserver
```
