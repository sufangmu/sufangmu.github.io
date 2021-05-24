# 配置

配置本质是通过`Flask`对象的`config`属性来配置的。





## 一、通过字典的方式配置

```python
from flask import Flask

app = Flask(__name__)
app['DEBUG'] = True


@app.route('/')
def index():
    return "Hello World!"
```

使用`update()`方法同时配置多个值

```python
from flask import Flask

app = Flask(__name__)
app.config.update(
    DEBUG=True,
    SECRET_KEY='_5#y2L"F4Q8z\n\xec]/',
)


@app.route('/')
def index():
    return "Hello World!"
```



## 二、通过Flask对象属性的方式配置

有少数的几个配置项可以通过Flask对象属性的方式配置

```python
from flask import Flask

app = Flask(__name__)
app.debug = True


@app.route('/')
def index():
    return "Hello World!"
```

