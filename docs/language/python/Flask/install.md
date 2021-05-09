# 简介与安装

## 一、简介

官方文档：[https://flask.palletsprojects.com/](https://flask.palletsprojects.com/)

相比于Django这种大而全的框架，Flask短小精悍，有很强可扩展性以及丰富的第三方组件。

```bash
$ pip install flask
$ pipdeptree -p flask
Flask==1.1.2
  - click [required: >=5.1, installed: 7.0]
  - itsdangerous [required: >=0.24, installed: 1.1.0]
  - Jinja2 [required: >=2.10.1, installed: 2.10.3]
    - MarkupSafe [required: >=0.23, installed: 1.1.1]
  - Werkzeug [required: >=0.15, installed: 1.0.1]
```

各组件的作用：

- Werkzeug 用于实现 WSGI ，应用和服务之间的标准 Python 接口。 
- Jinja 用于渲染页面的模板语言。 
- MarkupSafe 与 Jinja 共用，在渲染页面时用于避免不可信的输入，防止注入攻击。 
- ItsDangerous 保证数据完整性的安全标志数据，用于保护 Flask 的 session cookie. 
- Click 是一个命令行应用的框架。用于提供 flask 命令，并允许添加自定义管理命令。 

```python
from werkzeug.serving import run_simple
from werkzeug.wrappers import Response, Request


@Request.application
def index(request):
    return Response("Hello World!")


if __name__ == '__main__':
    run_simple('localhost', 8000, index)
```



## 二、安装

```python
from flask import Flask

app = Flask(__name__)  # app是一个Flask类的对象


@app.route('/')
def hello_world():
    return 'Hello, World!'


if __name__ == '__main__':
    app.run()
```

