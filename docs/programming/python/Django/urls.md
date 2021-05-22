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

### 1. 无名分组

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

### 1. 普通解析

通过一些方法得到一个结果 该结果可以直接访问对应的url触发视图函数

第一步：给路由与视图函数起别名

```python
# filename: urls.py
from django.conf.urls import url
from django.contrib import admin
from app import views

urlpatterns = [
    url(r'^admin/', admin.site.urls),
    url(r'^login/', views.login),
    # 给路由和视图函数起一个别名
    url(r'register/', views.reg_func, name="reg")
]
```

第二步：后端反向解析

```python
#filename: views.py
from django.shortcuts import render, reverse


def login(request):
    return render(request, 'login.html')


def reg_func(request):
    print(reverse('reg'))  # /register/
    return render(request, 'register.html')
```

第三步：前端反向解析

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>登录</title>
</head>
<body>
<ul>
    <li><a href="#">登录</a></li>
    <!--跳转到http://127.0.0.1:8000/register/-->
    <li><a href="{% url 'reg' %}">注册</a></li> 
</ul>
</body>
</html>
```

![1610111665556](images/1610111665556.png)

### 2. 无名有名分组反向解析

#### 2.1 无名分组反向解析

第一步：路由

```python
# filename: urls.py
from django.conf.urls import url
from django.contrib import admin
from app import views

urlpatterns = [
    url(r'^admin/', admin.site.urls),
    url(r'home/', views.home),
    url(r'article/(\d{4})/', views.article, name='new_article')
]
```

第二步：后端反向解析

```python
# filename: view.py
from django.shortcuts import render, HttpResponse, reverse


def home(request):
    return render(request, 'home.html')


def article(request, arg):
    year = arg
    url = reverse('new_article', args=(arg,)) # 解释的时候需要加一个参数
    return HttpResponse('url的值是%s,arg的是值是%s' % (url, year))
```

第三步：前端反向解析

```html
<!--filename:home.html-->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>home</title>
</head>
<body>
<ul>
    <li><a href="{% url 'new_article' 2020 %}">2020</a></li>
    <li><a href="{% url 'new_article' 2021 %}">2021</a></li>
</ul>
</body>
</html>
```



#### 2.2 有名分组反向解析

第一步：路由

```python
# filename: urls.py
from django.conf.urls import url
from django.contrib import admin
from app import views

urlpatterns = [
    url(r'^admin/', admin.site.urls),
    url(r'home/', views.home),
    url(r'article/(?P<year>\d{4})/', views.article, name='new_article')
]
```

第二步：后端解析

```python
# filename: views.py
from django.shortcuts import render, HttpResponse, reverse


def home(request):
    return render(request, 'home.html')


def article(request, year):
    print(reverse('new_article', kwargs={'year': year})) # 另一种写法
    url = reverse('new_article', args=(year,))
    return HttpResponse('url的值是%s,arg的是值是%s' % (url, year))
```

第三步：前端解析

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>home</title>
</head>
<body>
<ul>
    <li><a href="{% url 'new_article' year=2020 %}">2020</a></li> <!--另一种写法，不重要-->
    <li><a href="{% url 'new_article' 2021 %}">2021</a></li>
</ul>
</body>
</html>
```

## 四、路由分发

django的每一个应用都可以有自己的templates目录、urls.py、static目录，基于上述的特点，django能够非常好的做到按模块开发，每一个功能模块对应一个app，最后在配置文件里面注册所有的app再利用路由分发的特点将所有的app整合成一个完整的项目。

当一个django项目中的url特别多的时候，总路由urls.py代码非常冗余不好维护，这个时候也可以利用路由分发来减轻总路由的压力。

利用路由分发之后，总路由不再处理路由与视图函数的直接对应关系，而是做一个分发处理， 识别当前url是属于哪个应用下，然后直接分发给对应的应用去处理。

### 1. 总路由配置

#### 1.1 方式一

```python
from django.conf.urls import url, include
from django.contrib import admin
from app01 import urls as app01_urls
from app02 import urls as app02_urls

urlpatterns = [
    url(r'^admin/', admin.site.urls),
    url(r'^app01/', include(app01_urls)),
    url(r'^app02/', include(app02_urls)),
]
```

#### 1.2 方式二（推荐写法）

```python
from django.conf.urls import url, include
from django.contrib import admin

urlpatterns = [
    url(r'^admin/', admin.site.urls),
    url(r'^app01/', include('app01.urls')),
    url(r'^app02/', include('app02.urls')),
]
# 注意事项:总路由里面的url千万不能加$结尾
```

### 2. 子路由配置

app01/urls.py

```python
from django.conf.urls import url
from app01 import views

urlpatterns = [
    url(r'^index/', views.index)
]
```

app02/urls.py

```python
from django.conf.urls import url
from app02 import views

urlpatterns = [
    url(r'^index/', views.index)
]
```

## 五、名称空间

当多个应用出现了相同的别名，正常情况下的反向解析是没有办法自动识别前缀的。

### 1. 总路由

```python
# filename: urls.py
from django.conf.urls import url, include
from django.contrib import admin

urlpatterns = [
    url(r'^admin/', admin.site.urls),
    url(r'^app01/', include('app01.urls', namespace='app01')),
    url(r'^app02/', include('app02.urls', namespace='app02')),
]
```

### 2. 子路由

app01/urls.py

```python
from django.conf.urls import url
from app01 import views

urlpatterns = [
    url(r'^index/', views.index, name='index')
]
```

app02/urls.py

```python
from django.conf.urls import url
from app02 import views

urlpatterns = [
    url(r'^index/', views.index, name='index')
]
```

### 3. 模板层

```html
    {% url 'app01:index' %}
    {% url 'app02:index' %}
```

其实只要保证名字不冲突就没有必要使用名称空间，一般情况下有多个app的时候时，在起别名的时候加app的前缀就能够确保多个app之间名字不冲突。

```python
urlpatterns = [
    url(r'^index/',views.index,name='app01_index')
]
urlpatterns = [
    url(r'^index/',views.index,name='app02_index')
]
```

## 六、伪静态

```python
urlpatterns = [
    url(r'^index.html',views.reg,name='index')
]
```

