

模板中使用函数

```python
from flask import Flask, render_template_string

app = Flask(__name__)


def say_hello(name):
    return "Hello %s" % name


@app.route('/')
def index():
    return render_template_string("<h1> {{ func('张三') }} </h1>", func=say_hello)


if __name__ == '__main__':
    app.run()

```





```python
# 模板中定制方法
@app.template_global()

@app.template_filter()
```

