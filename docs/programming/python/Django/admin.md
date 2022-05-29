# Admin后台管理

```python
class User(models.Model):
  	...
    class Meta:
        verbose_name_plural = '用户表'  # 修改admin后台管理默认的表名
        # verbose_name = '用户表'  # 末尾还是会自动加s
```

在admin.py中注册

```python
from django.contrib import admin
from app import models
# Register your models here.

admin.site.register(models.User)
```

admin会给每一个注册了的模型表自动生成增删改查四条url

```html
http://127.0.0.1:8000/admin/app/user/ 查
http://127.0.0.1:8000/admin/app/user/add/ 增
http://127.0.0.1:8000/admin/app/user/1/change/ 改
http://127.0.0.1:8000/admin/app/user/1/delete/ 删
```



