## 1. `HttpResponse`

返回字符串类型的数据。

```python
from django.shortcuts import HttpResponse


def index(request):
    return HttpResponse("Hello World")
```

## 2. `render`

返回渲染过的模板文件

### 1. 创建模板文件

在`mysite/app/templates`下创建名为`index.html`的模板文件

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

### 2. 在视图函数中指明模板文件的名称

由于在配置文件中已经指明了模板文件的路径，所有此处只需要些模板文件名即可

```python
from django.shortcuts import render


def index(request):
    return render(request, 'index.html')
```

### 3. 传值

在模板文件中接收值：

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
</head>
<body>
    Hello Index
    {{ info }}
    {{ data }}
</body>
</html>
```

#### 3.1 方式一

```python
from django.shortcuts import render


# Create your views here.
def index(request):
    user_info = {"name": "admin", "password": "123456"}
    data = {"data": [1, 2, 3]}
    # 更加精确，节省资源
    return render(request, 'index.html', {"info": user_info, "data": data})
```

#### 3.2 方式二

```python
# 
from django.shortcuts import render


# Create your views here.
def index(request):
    user_info = {"name": "admin", "password": "123456"}
    data = {"data": [1, 2, 3]}
    # locals会将所在的名称空间中农所有的名称全部传递
    # 注意：使用此方法时，视图中的变量名有模板文件中的变量名要一致
    return render(request, 'index.html', locals())
```

## 3. `redirect`

重定向到指定的URL

```python
from django.shortcuts import redirect


def index(request):
    return redirect('http://www.baidu.com')  # 跳转到外部URL
	# return redirect("/admin")  # 跳转到内部URL
```

### 4.`JsonResponse`

```python
from django.http import JsonResponse


def index(request):
    data = {"name": "admin", "msg": "你好"}
    return JsonResponse(data, json_dumps_params={"ensure_ascii": False})
```

