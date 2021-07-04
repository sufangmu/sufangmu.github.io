# 请求和响应

## 一、请求

### 1.请求方法

#### 1.1 获取`formdata`中的数据

```python
from flask import Flask, render_template, request

app = Flask(__name__)


@app.route('/login', methods=["GET", "POST"])
def login():
    if request.method == "GET":
        return render_template('login.html')
    if request.method == "POST":
        print(request.form)  # ImmutableMultiDict([('username', 'admin'), ('password', '123456')])
        print(request.form.to_dict())  # {'username': 'admin', 'password': '123456'}
        print(request.form.get('username'))  # admin
        return "ok"

```

#### 1.2 获取请求方法

```python
request.method
```

#### 1.3 获取`URL`中的参数

```python
request.args  # ImmutableMultiDict([('page', '1')])
request.args.get('page')  # 1
request.args.to_dict()  # {'page': '1'}
```

#### 1.4 接收文件

创建模板文件接收文件

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>File</title>
</head>
<body>
<form action="" method="post" enctype="multipart/form-data">
    <p><input type="file" name="myfile"></p>
    <input type="submit" value="上传">
</form>
</body>
</html>
```

保存文件

```python
from flask import Flask, render_template, request

app = Flask(__name__)


@app.route('/file', methods=["GET", "POST"])
def user():
    if request.method == "GET":
        return render_template('file.html')
    if request.method == "POST":
        print(request.files)  # ImmutableMultiDict([('myfile', <FileStorage: 'George.jpg' ('image/jpeg')>)])
        print(request.files.get('myfile'))  # <FileStorage: 'George.jpg' ('image/jpeg')>
        my_file = request.files.get('myfile')
        my_file.save(my_file.filename)
        return "ok"

```

#### 1.5 URL相关

```python
request.url           # http://10.0.0.128:5000/user?page=1
request.url_root      # http://10.0.0.128:5000/
request.base_url      # http://10.0.0.128:5000/user
request.host_url      # http://10.0.0.128:5000/
request.url_charset   # utf-8   url编码方式
request.full_path     # /user?page=1
request.host          # 10.0.0.128:5000
request.path          # /user
request.url_rule      # /user
```

#### 1.6  其他数据

```python
request.cookies       # ImmutableMultiDict([('user', 'admin')])
request.headers 
request.data          # b'{"name":"admin"}' Content-Type无法被识别或不包含form字段时，获取请求体中的数据
request.json          # {'name': 'admin'} 获取Content-Type:application/json时提及的数据
```

### 2. 请求钩子

#### 1. `before_request`

每次请求之前运行，运行顺序按代码的顺序执行。

```python
from flask import Flask

app = Flask(__name__)
app.config['SECRET_KEY'] = 'UxlucZVeYToAjpMULTNOEw=='


@app.before_request
def before_part1():
    print("请求之前 part1")


@app.before_request
def before_part2():
    print("请求之前 part2")


@app.route('/')
def index():
    print("视图函数")
    return "Hello World"

# 请求之前 part1
# 请求之前 part2
# 视图函数
```

如果`before_request`装饰的函数中有`return`，跳过后续的`before_request`和视图函数，直接执行`after_request`

#### 2. `before_first_request`

程序启动后，只有第一个请求会执行。

#### 3. `after_request`

```python
from flask import Flask

app = Flask(__name__)
app.config['SECRET_KEY'] = 'UxlucZVeYToAjpMULTNOEw=='


@app.before_request
def before_part1():
    print("请求之前 part1")
    # 在此处有return ，会跳过视图函数，直接执行after_request
    return "请求之前 part1"


@app.after_request
def after_part1(response):
    print("请求之后 part1")
    return response


@app.after_request
def after_part1(response):
    print("请求之后 part2")
    return response


@app.route('/')
def index():
    print("视图函数")
    return "Hello World"

# 请求之前 part1
# 请求之后 part2
# 请求之后 part1
```

`after_request`可以叠加多个，执行顺序按代码顺序倒序执行。

#### 4. `teardown_request`

## 二、响应

### 1. 返回字符串

```python
from flask import Flask

app = Flask(__name__)


@app.route('/')
def index():
    return "Hello World!"

```

### 2. 返回模板文件

创建模板文件

```bash
$ mkdir templates
$ cd templates/
$ cat index.html
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Title</title>
    </head>
    <body>
        Hello World!
    </body>
</html>
```

此时的目录结构如下：

```bash
$ tree -L 2
.
├── hello.py
├── templates
    └── index.html
```

使用`render_template`返回模板文件

```python
from flask import Flask, render_template

app = Flask(__name__)


@app.route('/')
def index():
    return render_template('index.html')
```

### 3. 返回response对象

如果需要返回cookie和请求头等，需要通过`make_response()`

```python
from flask import Flask, make_response

app = Flask(__name__)


@app.route('/')
def index():
    response = make_response("Hello World!")
    response.set_cookie('user', 'admin')
    return response

```

### 4. 返回`json`

```python
from flask import Flask, jsonify

app = Flask(__name__)

data = {
    'user': 'root',
    'group': 'root',
}


@app.route('/')
def index():
    return jsonify(data)
```

使用`curl`命令访问

```bash
$ curl -s  http://127.0.0.1:5000/
{"group":"root","user":"root"}
```

返回的是标准格式的`json`:`Content-Type: application/json`

```bash
$ curl -I  http://10.0.0.128:5000/
HTTP/1.0 200 OK
Content-Type: application/json
Content-Length: 31
Server: Werkzeug/1.0.1 Python/3.6.9
Date: Sun, 20 Jun 2021 12:33:56 GMT
```

### 5. 重定向

```python
from flask import Flask, redirect

app = Flask(__name__)


@app.route('/login')
def login():
    return redirect('/')


@app.route('/')
def index():
    return 'Hello World!'
```

```bash
$ curl -s -i -L  http://10.0.0.128:5000/login
HTTP/1.0 302 FOUND   # 302重定向
Content-Type: text/html; charset=utf-8
Content-Length: 208
Location: http://10.0.0.128:5000/  # 重定向到/
Server: Werkzeug/2.0.1 Python/3.6.9
Date: Sun, 20 Jun 2021 03:33:27 GMT

HTTP/1.0 200 OK
Content-Type: text/html; charset=utf-8
Content-Length: 12
Server: Werkzeug/2.0.1 Python/3.6.9
Date: Sun, 20 Jun 2021 03:33:27 GMT

Hello World!
```

### 6. 返回文件

```python
from flask import Flask, send_file

app = Flask(__name__)


@app.route('/peppa')
def index():
    return send_file('Peppa.jpg')

```

`send_file`：打开并返回文件内容。可以自动识别文件类型，在响应头中加入 **Content-Type: 文件类型** 。文件类型是可以被浏览器识别的，如果内容不能被客户端识别，客户端会执行下载处理。

## 三、自定义错误页面

通过`app.errorhandler`装饰器自定义错误页面。

```python
from flask import Flask, render_template

app = Flask(__name__)


@app.route('/')
def index():
    return "Hello World"


@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404


@app.errorhandler(500)
def page_not_found(e):
    return render_template('500.html'), 500

```

