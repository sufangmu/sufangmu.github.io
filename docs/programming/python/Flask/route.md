# 路由

```python
from flask import Flask

app = Flask(__name__)


@app.route('/', methods=['GET', 'POST'], endpoint='root')
def hello_world():
    return 'Hello, World!'


if __name__ == '__main__':
    app.run()

```



```python
① @app.route('/', methods=['GET', 'POST'], endpoint='root')
    # route源码
    def route(self, rule, **options):
        # rule = '/'
        # options = {methods=['GET', 'POST'], endpoint='root'}
        def decorator(f):
            endpoint = options.pop("endpoint", None)
            self.add_url_rule(rule, endpoint, f, **options) # 核心
            return f

        return decorator
        # decorator = app.route('/', methods=['GET', 'POST'], endpoint='root')
② @decorator
	decorator(index)
```



```python
from flask import Flask

app = Flask(__name__)


def login():
    return 'Login'


app.add_url_rule('/login', 'lgn', login, methods=['GET', 'POST'])

if __name__ == '__main__':
    app.run()

```



路由本质是通过add_url_rule来实现的。



CBV

```python
from flask import Flask, views

app = Flask(__name__)


def auth(func):
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


app.add_url_rule('/index', view_func=IndexView.as_view(name='index'))

if __name__ == '__main__':
    app.run()

```



```python
add_url_rule(options)
参数：https://werkzeug.palletsprojects.com/en/1.0.x/routing/#werkzeug.routing.Rule
    
defaults
subdomain
strict_slashes
redirect_to
```



自定义转换器

```python
from flask import Flask, views
from werkzeug.routing import BaseConverter

app = Flask(__name__)


# 1.自定义类,继承自BaseConverter
class RegexConverter(BaseConverter):

    def __init__(self, map, regex):
        super(RegexConverter, self).__init__(map)
        self.regex = regex

    def to_python(self, value):
        """
        路由匹配成功后传递给视图函数中参数的值
        :param value:
        :return:
        """
        return int(value)

    def to_url(self, value):
        """
        使用url_for反向生成URL时，传递的参数经过该方法处理，反之的值用于生成URL中的参数
        :param value:
        :return:
        """
        val = super(RegexConverter, self).to_url(value)
        return val


# 2.将自定义转换器类,添加到默认的转换列表中
app.url_map.converters['regex'] = RegexConverter


@app.route('/index/<regex("\d+"):uid>')
def index(uid):
    return "Hello World! %s" % uid


if __name__ == '__main__':
    app.run()

```

