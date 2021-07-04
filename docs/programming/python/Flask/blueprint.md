# 蓝图

作用：对flask程序进行目录结构的划分

## 1. 基本使用

```bash
from flask import Flask, Blueprint

admin = Blueprint('admin', __name__)


@admin.route('/')
def index():
    return "Admin Index"


app = Flask(__name__)
# 注册蓝图
app.register_blueprint(admin)

```

## 2. 给路由加前缀

```python
from flask import Flask, Blueprint

admin = Blueprint('admin', __name__)


@admin.route('/')
def index():
    return "Admin Index"


app = Flask(__name__)
app.register_blueprint(admin, url_prefix='/admin')
```

## 3. 指定蓝图的静态文件和模板文件位置

```python
from flask import Flask, Blueprint

admin = Blueprint('admin', __name__, static_folder='static', template_folder='templates')


@admin.route('/')
def index():
    return "Admin Index"


app = Flask(__name__)
app.register_blueprint(admin, url_prefix='/admin')

```

## 4.使用蓝图拆分app

目录结构如下

```bash
$ tree flaskproject -L 3
flaskproject
├── admin
│   ├── templates
│   │   └── login.html
│   └── views.py
├── app.py
├── hello.py
├── templates
    └── index.html
```

### 4.1 创建单独的`app`目录以及视图函数文件

创建`admin`目录

```bash
mkdir flaskproject/admin
```

创建视图函数文件`views.py`

```python
#!/usr/bin/env python3
# _*_ coding:utf-8 _8_
# filename: views.py

from flask import Blueprint, render_template

# 不能被run的Flask实例，蓝图名称不能重复，保证在app中时唯一的
admin = Blueprint("admin", __name__, url_prefix='/admin', template_folder="templates")


# url_prefix URL前缀，用于隔离相同URL
@admin.route("/login")
def login():
    return render_template('login.html')

```

创建给`admin`使用的templates目录及文件`templates/login.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Admin Login</title>
</head>
<body>
<p>Admin Login</p>
</body>
</html>
```

### 4.2 在主`app.py`中注册蓝图

```python
from flask import Flask, render_template
from admin.views import admin

app = Flask(__name__)

app.register_blueprint(admin)


@app.route('/')
def index():
    return render_template("index.html")

```

```bash
$ curl -s  http://10.0.0.128:5000/admin/login
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Admin Login</title>
</head>
<body>
<p>Admin Login</p>
</body>
</html>
```

## 5.项目目录结构

### 5.1 简单项目的目录结构

```bash
flaskproject/
├── blog
│   ├── __init__.py
│   ├── static
│   ├── templates
│   └── views
│       ├── admin.py
│       └── user.py
└── manage.py

```

在`admin.py`中写蓝图

```python
#!/usr/bin/env python3
# _*_ coding:utf-8 _*_
# filename: admin.py

from flask import Blueprint

admin = Blueprint("admin", __name__, url_prefix='/admin')


@admin.route("/login")
def login():
    return "Login"

```

在`blog/__init__.py`中创建`Flask app`并导入蓝图

```python
#!/usr/bin/env python3
# _*_ coding:utf-8 _*_
# filename: __init__.py
from flask import Flask
from .views.admin import admin
from .views.user import user

app = Flask(__name__)
app.register_blueprint(admin)
app.register_blueprint(user)

```

在`manage.py`中启动Flask程序

```python
#!/usr/bin/env python3
# _*_ coding:utf-8 _*_
# filename: manage.py
from blog import app

if __name__ == '__main__':
    app.run(host='0.0.0.0')
```



### 5.2 大型项目的目录结构

```bash
flaskproject
├── blog
│   ├── admin
│   │   ├── __init__.py
│   │   ├── static
│   │   ├── templates
│   │   └── views.py
│   ├── __init__.py
│   └── user
│       ├── __init__.py
│       ├── static
│       ├── templates
│       └── views.py
└── manage.py
```

创建子应用目录，在子应用的`__init__.py`文件中创建蓝图

```python
#!/usr/bin/env python3
# _*_ coding:utf-8 _*_
# filename: __init__.py
#!/usr/bin/env python3
# _*_ coding:utf-8 _*_
# filename: __init__.py
from flask import Blueprint

admin = Blueprint('admin',
                  __name__,
                  url_prefix="/admin",
                  template_folder="templates",
                  static_folder="static")
# 必须等蓝图创建以后再导入视图函数
from . import views  

```

创建子应用的视图函数`blog/views.py`

```python
#!/usr/bin/env python3
# _*_ coding:utf-8 _*_
# filename: views.py

from . import user


@user.route('/')
def index():
    return "user index"

```

在`blog/__init__.py`实例化Flask并注册蓝图

```python
#!/usr/bin/env python3
# _*_ coding:utf-8 _*_
# filename: __init__.py

from flask import Flask

from .admin import admin
from .user import user

app = Flask(__name__)
app.register_blueprint(admin)
app.register_blueprint(user)
```

在`manage.py`中启动Flask程序

```python
#!/usr/bin/env python3
# _*_ coding:utf-8 _*_
# filename: manage.py
from blog import app

if __name__ == '__main__':
    app.run(host='0.0.0.0')
```

