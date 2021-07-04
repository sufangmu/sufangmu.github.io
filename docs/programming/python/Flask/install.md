# 简介与安装

## 一、简介

官方文档：[https://flask.palletsprojects.com/](https://flask.palletsprojects.com/)

```bash
$ pip install flask==1.1.2
$ pipdeptree -p flask
Flask==1.1.2
  - click [required: >=5.1, installed: 7.0]
  - itsdangerous [required: >=0.24, installed: 1.1.0]
  - Jinja2 [required: >=2.10.1, installed: 2.10.3]
    - MarkupSafe [required: >=0.23, installed: 1.1.1]
  - Werkzeug [required: >=0.15, installed: 1.0.1]
```

各组件的作用：

- Werkzeug （德语：工具）用于实现 WSGI ，应用和服务之间的标准 Python 接口。 
- Jinja 用于渲染页面的模板语言。 
- MarkupSafe 与 Jinja 共用，在渲染页面时用于避免不可信的输入，防止注入攻击。 
- ItsDangerous 保证数据完整性的安全标志数据，用于保护 Flask 的 session cookie. 
- Click 是一个命令行应用的框架。用于提供 flask 命令，并允许添加自定义管理命令。 

通过werkzeug启动一个http服务：

```python
#!/usr/bin/env python3
# _*_ coding:utf-8 _*_
# filename: test.py
from werkzeug.serving import run_simple
from werkzeug.wrappers import Response, Request


@Request.application
def app(request):
    print(request)  # <Request 'http://localhost:8000/' [GET]>
    print(type(request))  # <class 'werkzeug.wrappers.request.Request'>
    return Response("Hello World!")


if __name__ == '__main__':
    run_simple('localhost', 8000, app)

```

## 二、第一个Flask程序

### 1. 创建虚拟环境

#### 1.1 操作系统

```bash
$ lsb_release  -a
No LSB modules are available.
Distributor ID:	Ubuntu
Description:	Ubuntu 18.04.5 LTS
Release:	18.04
Codename:	bionic
```

#### 1.2 安装`python3-venv`

```bash
sudo apt-get install python3-venv -y
```

#### 1.3 创建项目文件夹和虚拟环境

```bash
$ mkdir flaskproject
$ cd flaskproject/
$ python3 -m venv venv
```

#### 1.4 激活虚拟环境

```bash
$ . venv/bin/activate
(venv) gp@ubuntu:~/flaskproject$
```

### 2. 安装Flask

```bash
(venv) gp@ubuntu:~/flaskproject$ pip3 install Flask==1.1.2
```

### 3. 创建flask应用

```python
#!/usr/bin/env python3
# filename: hello.py
from flask import Flask

app = Flask(__name__)  # __name__的值是hello,当前文件的文件名。 
# __name__是主模块或包的名称。用来确定程序的位置，从而找到模板文件和静态文件的位置。

@app.route('/')  # 路由
def hello_world():  # 与路由绑定的视图函数，试图函数名尽可能唯一
    return 'Hello, World!'

```

Flask应用必须创建一个应用实例，这个实例就是Flask类的对象。就是这里的`app`。Web服务器通过WSGI协议，把接收自客户端的所有请求都交给这个对象处理。

### 4. 启动Flask应用

```bash
(venv) gp@ubuntu:~/flaskproject$ export FLASK_APP=hello.py
(venv) gp@ubuntu:~/flaskproject$ export FLASK_ENV=development  # 打开所有开发功能，包括调试模式
(venv) gp@ubuntu:~/flaskproject$ flask run --host=0.0.0.0  # 监听所有操作系统公开的IP
 * Serving Flask app "hello.py" (lazy loading)
 * Environment: development
 * Debug mode: on
 * Running on all addresses.
   WARNING: This is a development server. Do not use it in a production deployment.
 * Running on http://10.0.0.128:5000/ (Press CTRL+C to quit)
 * Restarting with stat
 * Debugger is active!
 * Debugger PIN: 380-155-360
```

### 5. 访问Flask应用

```bash
$ curl -s http://10.0.0.128:5000/
Hello, World!
```

