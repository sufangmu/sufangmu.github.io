# 路由层

## 一、路由匹配

### 1. 在mysite/mysite/urls.py中书写路由

```python
from django.conf.urls import url
from django.contrib import admin
from app import views

urlpatterns = [
    url(r'^admin/', admin.site.urls),
    url(r'^login/', views.login),
    url(r'^$', views.index),
]
```

`url()`方法的第一个参数是正则表达式，只要第一个参数正则表达式能够匹配到内容 那么就会立刻停止往下匹配，直接执行对应的视图函数。

在浏览器输入http://127.0.0.1:8000/login时，Django会做一次301重定向（自动在URL后面加`/`，重新请求一次）。

可以再配置文件中添加`APPEND_SLASH = False`来取消自动加`/`重定向

## 二. 分组

分组：将某一段正则表达式用小括号扩起来

### 1、 无名分组

**无名分组**就是将括号内正则表达式匹配到的内容当作**位置**参数传递给后面的视图函数。

```python
from django.conf.urls import url
from django.contrib import admin
from app import views

urlpatterns = [
    url(r'^admin/', admin.site.urls),
    url(r'^article/(\d{4})', views.article), # 无名分组
]
```

视图函数中形参的名字可以是任意的字符串

```python
# filename: views.py
from django.shortcuts import HttpResponse

# 形参的名字可以是任意的字符串
def article(request, arg):
    return HttpResponse("%s年的文章" % arg)
```

### 2. 有名分组

**有名分组**就是将括号内正则表达式匹配到的内容当作**关键字参数**传递给后面的视图函数。

```python
# filename: urls.py
from django.conf.urls import url
from django.contrib import admin
from app import views

urlpatterns = [
    url(r'^admin/', admin.site.urls),
    url(r'^article/(?P<year>\d{4})', views.article) # 正则表达式起一个别名
]
```

视图函数中形参的名字必须是路由中正则表达式的别名

```python
# filename: views.py
from django.shortcuts import HttpResponse

# 形参的名字是正则表达式的别名
def article(request, year):
    return HttpResponse("%s年的文章" % year)
```

无名分组和有名分组不可以混合使用，但是同一个分组可以重复使用多次

```python
urlpatterns = [
	...
    url(r'^article/([0-9]{4})/([0-9]{2})/([0-9]+)/$', views.article),
    url(r'^article/(?P<year>[0-9]{4})/(?P<month>[0-9]{2})/(?P<day>[0-9]{2})/$', views.article),
]
```

## 三、反向解析

通过一些方法得到一个结果 该结果可以直接访问对应的url触发视图函数