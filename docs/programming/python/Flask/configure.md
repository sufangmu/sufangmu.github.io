# 配置

## 一、实例化配置

```python
from flask import Flask

app = Flask(__name__, template_folder='templates', static_folder='static', static_url_path='/static')

# template_folder 模板文件路径
# static_folder 静态文件路径
# static_url_path 访问静态文件时使用的路径
# static_host  静态文件访问服务HOST，指向到另一台服务器
@app.route('/')
def index():
    return "Hello World!"

```

## 二、对象配置

配置本质是通过`Flask`对象的`config`属性来配置的。

### 1. 通过字典的方式配置

```python
from flask import Flask

app = Flask(__name__)
app['DEBUG'] = True


@app.route('/')
def index():
    return "Hello World!"
```

使用`update()`方法可以同时配置多个值

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

### 2. 通过Flask对象属性的方式配置

```python
from flask import Flask

app = Flask(__name__)
app.debug = True


@app.route('/')
def index():
    return "Hello World!"
```

### 3. 通过配置文件

通过类的方式将所有的配置写在配置文件中,比如`settings.py`。

```python
class Config(object):
    """Base config, uses staging database server."""
    DEBUG = False
    TESTING = False
    DB_SERVER = '192.168.1.56'

    @property
    def DATABASE_URI(self):  # Note: all caps
        return 'mysql://user@{}/foo'.format(self.DB_SERVER)


class ProductionConfig(Config):
    """Uses production database server."""
    DB_SERVER = '192.168.19.32'


class DevelopmentConfig(Config):
    DB_SERVER = 'localhost'
    DEBUG = True


class TestingConfig(Config):
    DB_SERVER = 'localhost'
    DEBUG = True
    DATABASE_URI = 'sqlite:///:memory:'

```

然后在`app.py`文件中导入配置

```python
from flask import Flask

app = Flask(__name__)
app.config.from_object('settings.DevelopmentConfig')


@app.route('/')
def index():
    return "Hello World!"

```

