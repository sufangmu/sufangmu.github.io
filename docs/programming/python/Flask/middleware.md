# 中间件

```python
from flask import Flask


class MyMiddleWare(object):
    def __init__(self, old_wsgi_app):
        # 服务启动时自动执行
        self.old_wsgi_app = old_wsgi_app

    def __call__(self, environ, start_response):
        # 每次有用户请求到来时执行
        print("before")
        obj = self.old_wsgi_app(environ, start_response)
        print("after")
        return obj


app = Flask(__name__)
app.wsgi_app = MyMiddleWare(app.wsgi_app)
app.config['SECRET_KEY'] = 'UxlucZVeYToAjpMULTNOEw=='


@app.route('/')
def index():
    print("视图函数")
    return "Hello World"

```

