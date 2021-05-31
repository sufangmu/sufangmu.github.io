# 视图

## 一、FBV

```python
from flask import Flask

app = Flask(__name__)


@app.route('/', methods=['GET', 'POST'], endpoint='root')
def index():
    return "Hello World!"

```

## 二、CBV

```python
from flask import Flask, views
from functools import wraps
app = Flask(__name__)


def auth(func):
    @wraps(func)
    def inner(*args, **kwargs):
        result = func(*args, **kwargs)
        return result
    return inner


class IndexView(views.MethodView):
    methods = ['GET', 'POST']
    decorators = [auth, ]

    def get(self):
        return 'Index GET'

    def post(self):
        return 'Index POST'


app.add_url_rule('/', view_func=IndexView.as_view(name='index'))

if __name__ == '__main__':
    app.run()

```


