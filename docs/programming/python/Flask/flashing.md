# 闪现

工作方式：在且只在下一个请求中访问上一个请求结束时记录的消息。

```python
from flask import Flask, flash, get_flashed_messages

app = Flask(__name__)
app.config['SECRET_KEY'] = 'UxlucZVeYToAjpMULTNOEw=='


@app.route('/login')
def login():
    # 消息可以存入多次
    flash("登录成功", 'info')
    flash("登录失败", 'error')
    return "Login"


@app.route('/')
def index():
    # 过滤闪现消息
    messages = get_flashed_messages(category_filter=['info'])
    data = ";".join(messages)
    return data

# 登录成功;登录成功;登录成功
```

在模板文件中使用

```html
{% with errors = get_flashed_messages(category_filter=["error"]) %}
    {% if errors %}
        <div class="alert-message block-message error">
            <a class="close" href="#">×</a>
            <ul>
                {%- for msg in errors %}
                	<li>{{ msg }}</li>
                {% endfor -%}
            </ul>
        </div>
    {% endif %}
{% endwith %}
```

返回消息类别

```python
@app.route('/')
def index():
    print(get_flashed_messages(with_categories=True)) # [('info', '登录成功'), ('error', '登录失败')]
    return "xx"
```



