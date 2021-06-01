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

### 3. 指定蓝图的静态文件和模板文件位置

```python
from flask import Flask, Blueprint

admin = Blueprint('admin', __name__, static_folder='static', template_folder='templates')


@admin.route('/')
def index():
    return "Admin Index"


app = Flask(__name__)
app.register_blueprint(admin, url_prefix='/admin')

```

