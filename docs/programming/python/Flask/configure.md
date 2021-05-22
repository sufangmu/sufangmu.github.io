# 配置文件

## 方式一

```python
from flask import Flask

app = Flask(__name__)
# 配置方式一
app.config['debug'] = True

@app.route('/')
def hello_world():
    return 'Hello, World!'


if __name__ == '__main__':
    app.run()
```

## 方式二

```python
from flask import Flask

app = Flask(__name__)

# 从外部文件导入
app.config.from_pyfile('settings.py')

@app.route('/')
def hello_world():
    return 'Hello, World!'


if __name__ == '__main__':
    app.run()
```

```python
# filename: settings.py
debug = True
```

## 方式三

```python
from flask import Flask

app = Flask(__name__)

app.config.from_object('settings.DevelopmentConfig')


@app.route('/')
def hello_world():
    return 'Hello, World!'


if __name__ == '__main__':
    app.run()
```

```python
# filename: settings.py
class Config(object):
    DEBUG = False
    TESTING = False
    DATABASE_URI = 'sqlite:///:memory:'


class ProductionConfig(Config):
    DATABASE_URI = 'mysql://user@localhost/foo'


class DevelopmentConfig(Config):
    DEBUG = True


class TestingConfig(Config):
    TESTING = True

```

