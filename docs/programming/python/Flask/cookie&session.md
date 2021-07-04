# Cookie&Session

## 一、Cookie

```python
from flask import Flask, make_response, request

app = Flask(__name__)


@app.route('/login')
def login():
    response = make_response("Hello World!")
    response.set_cookie("user", "admin")
    return "ok"


@app.route('/index')
def index():
    return request.cookies.get('user')

```

## 二、Session

```python
from flask import Flask, session

app = Flask(__name__)
app.config['SECRET_KEY'] = 'UxlucZVeYToAjpMULTNOEw=='


@app.route('/login')
def login():
    session['user'] = 'root'
    return "Login"


@app.route('/')
def index():
    return session['user']

```

 

对字典中的二级键修改，不会保存session

```python
SESSION_REFRESH_EACH_REQUEST = True
```

请求到来之后，会将request和session封装成RequestContext对象，通过LocalStack存放到Local对象中，调用open_session方法，将请求cookie中的session赋值给ctx，返回的时候调用save_session方法，读取ctx中session并序列化写入cookie返回，最后从ctx中删除。



















































































