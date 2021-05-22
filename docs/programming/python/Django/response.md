# Response三板斧

## 1. HttpResponse

app/views.py

```python
from django.shortcuts import HttpResponse


def index(request):
    return HttpResponse("Hello World")
```

mysite/urls.py

```python
from django.conf.urls import url
from django.contrib import admin
from app import views

urlpatterns = [
    url(r'^admin/', admin.site.urls),
    url(r'^index/', views.index)
]
```

## 2. render

返回渲染过得模板文件

app/views.py

```python
from django.shortcuts import render


def index(request):
    return render(request, 'index.html')
```

templates/index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>index</title>
</head>
<body>
    <p>Hello Index</p>
</body>
</html>
```

## 3. redirect

重定向

app/views.py

```python
from django.shortcuts import redirect


def index(request):
    return redirect('http://www.baidu.com')
```

