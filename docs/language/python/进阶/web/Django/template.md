# 模板层

## 一、静态文件配置

### 1.创建静态文件目录

```bash
mkdir mysite/app/static
# 网站使用的静态文件(css,js,img)一般都放在static目录下
```

### 2. 修改配置文件

```python
# 如果想访问静态文件，模板文件中的静态文件路径就必须以static开头，然后从STATICFILES_DIRS中给的路径从上到下依次查找指定的静态文件
STATIC_URL = '/static/'

# 添加以下内容
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'static'),
    os.path.join(BASE_DIR, 'static1'),
    os.path.join(BASE_DIR, 'static2'),
]
```

### 3. 静态文件动态解析

template/index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>登录</title>
    {% load static %}  <!--类似于导入模块，可以动态解析配置文件中STATIC_URL的值-->
    <link rel="stylesheet" href="{% static 'bootstrap-3.3.7-dist/css/bootstrap.min.css' %}">
    <script src="{% static 'bootstrap-3.3.7-dist/js/bootstrap.min.js' %}"></script>
</head>
<body>
    <h1 class="text-center">登陆</h1>
    <div class="container">
        <div class="row">
            <div class="col-md-8 col-md-offset-2">
                <form action="" method="post">
                    <p>username:<input type="text" name="username" class="form-control"></p>
                    <p>password:<input type="password" name="password" class="form-control"></p>
                    <input type="submit" class="btn btn-success btn-block">
                </form>
            </div>
        </div>
    </div>
</body>
</html>
```

