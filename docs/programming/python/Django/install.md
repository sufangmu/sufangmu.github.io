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

## 四、 目录结构

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

## 五、请求生命周期

### 1. 浏览器

​	发送HTTP请求

### 2. Web服务网管接口

#### 2.1 作用

处理请求流程：请求来的时候解析封装，响应走的时候打包处理

#### 2.2 实现

1. wsgiref模块，django默认模块，不能承受高并发
2. uwsgi模块，可以支持高并发
3.  两个模块都是WSGI协议的实现

### 3. Django后端

#### 3.1 中间件

#### 3.2 路由层

识别路由匹配对应的视图函数

#### 3.3 视图层

网站整体的业务逻辑

#### 3.4 模板层

网站所有的html文件

#### 3.5 模型层

数据库相关

### 4. 流程

1. Django从收到消息中，从请求消息中分解出用户访问的路径
2. 拿着得到的路径在路径和函数的对应关系列表中进行匹配，匹配之后执行函数
3. 执行函数，把所有和请求相关的数据封装到一个request参数中
4. render找到html文件，打开并读取文件内容，按照http响应消息的格式封装，返回给用户的浏览器
5. 浏览器收到响应的消息，按照HTML的格式展示页面   