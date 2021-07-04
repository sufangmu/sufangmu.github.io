# 路由

## 一、路由的作用

用来处理URL和函数之间的关系。

## 二、路由的创建

### 1. 通过装饰器创建

```python
from flask import Flask

app = Flask(__name__)


@app.route('/')
def index():
    return "Hello World!"

```

`app.route()`源码分析

```python
class Flask(_PackageBoundObject):

    def route(self, rule, **options):
        def decorator(f):
            # 通过route方法，把rule和options参数传递进来，进行一些处理（绑定路由关系）
            endpoint = options.pop("endpoint", None)
            self.add_url_rule(rule, endpoint, f, **options)
            return f # 将被装饰的视图函数原封不动的返回

        return decorator
```

```python
@app.route('/', methods=['GET', 'POST'], endpoint='index')
def index():
    return "Hello World!"

# ==> index=app.route('/', methods=['GET', 'POST'], endpoint='index')(index)
# ==> index=decorator(index)
```

### 2. 通过`add_url_rule()`方法创建

通过分析`route()`装饰器的源码可知，路由关系其实是通过`add_url_rule()`方法来创建的。

```python
from flask import Flask

app = Flask(__name__)


def index():
    return "Hello World!"


app.add_url_rule('/', 'index', index, methods=['GET', 'POST'])

```

## 三、`url_for()`

用途：反向生成URL

```python
from flask import Flask, url_for

app = Flask(__name__)


@app.route('/', methods=['GET', 'POST'], endpoint='root')
def index():
    return "Hello World!"


@app.route('/page')
def page():
    print("root path: %s" % format(url_for('root')))
    return "page"
```

## 四、`route()`参数

1. `endpoint`：对应视图函数，默认是视图函数名
2. `methods`：允许请求的方式。`methods = ["GET","POST"]`

1. `defaults`：给视图函数提供默认参数。`defaults={'page':1}`
2. `strict_slashes`：对URL后的`/`是否严格要求。strict_slashes=False`
3. `redirect_to`：308永久重定向，没有进入视图，直接跳转。`redirect_to='http://www.baidu.com'`
4. `subdomain`：获取被访问URL的子域名。`subdomain='<subdomain_name>'`

> 完整参数在werkzeug.routing.Rule



##   五、动态路由

### 1. 内置转换器

| 类型   | 作用                             |
| ------ | -------------------------------- |
| string | 缺省值，接收任何不包含斜杠的文本 |
| int    | 接收正整数                       |
| float  | 接受正浮点数                     |
| path   | 类似string，但可以包含斜杠       |
| uuid   | 接受UUID字符串                   |

```python
from flask import Flask, url_for

app = Flask(__name__)


@app.route('/', methods=['GET', 'POST'], endpoint='root')
def index():
    return "Hello World!"


@app.route('/user/<int:id>')
def user(id):
    user_id = str(id)
    print(type(id)) # <class 'int'>
    return str(user_id)
```

### 2. 自定义转换器

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
        使用url_for反向生成URL时，传递的参数经过该方法处理，返回的值用于生成URL中的参数
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

