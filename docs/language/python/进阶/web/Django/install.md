# Django安装

## 一、安装

```bash
pip install django==1.11.29
```

## 二、创建一个项目

### 1. 创建项目

```bash
$ django-admin startproject mysite
```

### 2. 创建应用

```bash
$ python manage.py startapp app
```

### 3. 注册应用

修改`mysite/mysite/settings.py`文件

```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'app.apps.AppConfig', # 添加此行
]
```

### 4. 创建模板文件夹

```bash
$ mkdir mysite/app/templates
```

在配置文件中添加模板文件路径

```python
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')], # 添加此行
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]
```

## 三、启动

```bash
$ cd mysite
$ python manage.py runserver
# 执行IP和端口
$ python manage.py runserver 127.0.0.1:8888
```

### 3. 目录结构

```bash
$ tree mysite/
mysite
├── app
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── migrations
│   │   ├── __init__.py
│   ├── models.py
│   ├── tests.py
│   └── views.py
├── db.sqlite3
├── manage.py
└── mysite
    ├── __init__.py
    ├── settings.py
    ├── urls.py
    └── wsgi.py
```

### 7. 处理请求流程

1. Django从收到消息中，从请求消息中分解出用户访问的路径
2. 拿着得到的路径在路径和函数的对应关系列表中进行匹配，匹配之后执行函数
3. 执行函数，把所有和请求相关的数据封装到一个request参数中
4. render找到html文件，打开并读取文件内容，按照http响应消息的格式封装，返回给用户的浏览器
5. 浏览器收到响应的消息，按照HTML的格式展示页面   