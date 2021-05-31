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
from flask import Flask, session

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

```



#### 2. `before_first_request`

#### 3. `after_request`

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



## 请求扩展

1. `@app.before_request`

可以有返回

```python
func(*args, **kwargs)
    pass
```



```python
# 设置白名单
if request.path == '/login':
    return None
```

可以叠加多个，执行顺序按代码顺序执行



`@app.before_first_request`



2.`@app.after_request`

```python
func(response):
    pass
    return response
```

可以叠加多个，执行顺序按代码顺序倒序执行。

请求拦截后所有的response都会执行。



 

  

定制404

```python
@app.errorhander(404)
def error_404(arg):
    return "404了。。。"
```

