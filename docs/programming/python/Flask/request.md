# 请求和响应

## 一、请求

### 1.请求方法

```python
from flask import Flask, request

app = Flask(__name__)


@app.route('/', methods=['GET', 'POST'], endpoint='root')
def index():
    print(request.args)  # ImmutableMultiDict([('user', 'admin')])
    print(request.method)  # GET
    print(request.form)  # ImmutableMultiDict([])
    print(request.cookies)  # ImmutableMultiDict([])
    print(request.headers)
    print(request.files)  # ImmutableMultiDict([])
    print(request.path)  # /
    print(request.values)  # CombinedMultiDict([ImmutableMultiDict([('user', 'admin')]), ImmutableMultiDict([])])
    print(request.full_path)  # /?user=admin
    print(request.base_url)  # http://127.0.0.1:5000/
    print(request.url)  # http://127.0.0.1:5000/?user=admin
    print(request.url_root)  # http://127.0.0.1:5000/
    print(request.host_url)  # http://127.0.0.1:5000/
    return "Hello World!"
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

如果`before_request`装饰的函数中有`return`，跳过后续的`before_request`和视图函数，`after_request`

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
from flask import Flask, make_response, render_template

app = Flask(__name__)


@app.route('/')
def index():
    response = make_response(render_template('index.html'))
    response.set_cookie('user', 'admin')
    return response
```

### 4. 返回json

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

