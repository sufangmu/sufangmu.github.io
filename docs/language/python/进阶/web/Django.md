Django

## 一、Django安装

```bash
pip install django==1.11.16
```

## 二、创建一个项目

### 1. 创建

```bash
django-admin startproject mysite
```

### 2. 运行

```bash
cd mysite
python manage.py runserver
```

![image-20200209115207572](..\img\Django_start.png)

### 3. 目录结构

```bash
\---demo
    |   db.sqlite3      # 内置的文件数据库
    |   manage.py		# 命令行入口文件
    +---demo
    |   |   settings.py # 配置文件相关
    |   |   urls.py		# url与函数的对应关系
    |   |   wsgi.py		# 收发socket相关
    |   |   __init__.py
    |
    \---templates		# HTML文件
```

### 4. HttpResponse

```python
# __file__: urls.py
from django.conf.urls import url
from django.contrib import admin
from django.shortcuts import HttpResponse


def index(request):
    # request: 所有与请求相关的数据都封装在这个参数里面
    return HttpResponse('Hello World!')


urlpatterns = [
    url(r'^admin/', admin.site.urls),
    url(r'^index', index),
]
```



![image-20200209120355882](..\img\demo_index.png)

### 5. render

```python
from django.conf.urls import url
from django.contrib import admin
from django.shortcuts import HttpResponse
from django.shortcuts import render


def index(request):
    # request: 所有与请求相关的数据都封装在这个参数里面
    return HttpResponse('Hello World!')


def login(request):
    # 1. 找到html文件
    # 2. 读取文件内容
    # 3. 安装HTTP协议的格式返回
    return render(request, 'login.html')
# login.html放在templates目录下


urlpatterns = [
    url(r'^admin/', admin.site.urls),
    url(r'^index/', index),
    url(r'^login/', login),
]

```

### 6. static

```python
# __file__:setting.py
...
# 静态文件的配置. 别名
STATIC_URL = '/static/'
# 告诉Django框架静态文件保存在哪些目录下
STATICFILES_DIRS = [
    # 具体文件路径
    os.path.join(BASE_DIR, 'static')
]
```

在项目目录下新建static目录，将css，js文件放在此目录下，html引用方法

```html
<link rel="stylesheet" href="/static/login.css">
<!-- 这里的"static"对应的setting.py中STATIC_URL = '/static/' -->
```

### 7. 处理请求流程

1. Django从收到消息中，从请求消息中分解出用户访问的路径
2. 拿着得到的路径在路径和函数的对应关系列表中进行匹配，匹配之后执行函数
3. 执行函数，把所有和请求相关的数据封装到一个request参数中
4. render找到html文件，打开并读取文件内容，按照http响应消息的格式封装，返回给用户的浏览器
5. 浏览器收到响应的消息，按照HTML的格式展示页面   