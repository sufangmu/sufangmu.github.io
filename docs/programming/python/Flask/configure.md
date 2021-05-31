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

## 二、通过Flask对象属性的方式配置

```python
from flask import Flask

app = Flask(__name__)
app.debug = True


@app.route('/')
def index():
    return "Hello World!"
```

## 三、通过配置文件

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

