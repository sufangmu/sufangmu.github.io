# 上下文

程序上下文

请求上下文





上下文源码分析

第一阶段 将ctx放到Local

第二阶段 视图函数导入

第三阶段 请求处理完毕，将session保存到cookie，将ctx删除





g对象，只在一个请求对象中存在。

```python
from flask import Flask, g

app = Flask(__name__)


@app.before_request
def before():
    g.x = 5


@app.route('/')
def index():
    print(g.x)  # 5
    return "Hello World"

```

