# auth模块

跟用户相关的登陆、注册、校验、修改密码、注销、验证用户是否登陆

创建超级用户(管理员)

```bash
$ python3 manage.py createsuperuser
```

## 一、常用方法

`from django.contrib import auth`

### 1. 比对用户名和密码是否正确

```python
user_obj = auth.authenticate(request,username=username,password=password)
# 括号内必须同时传入用户名和密码
print(user_obj)  # 用户对象  admin   数据不符合则返回None
print(user_obj.username)  # admin
print(user_obj.password)  # 密文
```

### 2. 保存用户状态

```python
auth.login(request,user_obj)  # 类似于request.session[key] = user_obj
# 只要执行了该方法，就可以在任何地方通过request.user获取到当前登陆的用户对象
```

### 3. 判断当前用户是否登陆

```python
request.user.is_authenticated()
```

### 4. 获取当前登陆用户

```python
request.user
```

### 5. 校验用户是否登陆装饰器

#### 5.1 局部配置

```python
from django.contrib.auth.decorators import login_required
# 局部配置:用户没有登陆跳转到login_user后面指定的网址
@login_required(login_url='/login/')
def home(request):
    return HttpResponse('home')
```

#### 5.2 全局配置

在配置文件中配置全局登录地址

```python
LOGIN_URL = '/login/'
```

```python
from django.contrib.auth.decorators import login_required
# 全局配置
@login_required
def home(request):
    return HttpResponse('home')
```

### 6. 对比原密码

```python
# 校验老密码对不对
is_right = request.user.check_password(old_password)  # 自动加密比对密码
```

### 7. 修改密码

```python
request.user.set_password(new_password) # 仅仅是在修改对象的属性
request.user.save() # 这一步才是真正的操作数据库
```

### 8. 注销

```python
auth.logout(request) 
```

### 9. 注册

```python
# 操作auth_user表写入数据
User.objects.create(username=username,password=password)  # 写入数据  不能用create 密码没有加密处理
# 创建普通用户
User.objects.create_user(username=username,password=password)
```

## 二、扩展auth_user表

```python
from django.db import models
from django.contrib.auth.models import User,AbstractUser
# Create your models here.

# 第一种:一对一关系  不推荐
# class UserDetail(models.Model):
#     phone = models.BigIntegerField()
#     user = models.OneToOneField(to='User')


# 第二种:面向对象的继承
class UserInfo(AbstractUser):
    """
    如果继承了AbstractUser
    那么在执行数据库迁移命令的时候auth_user表就不会再创建出来了
    而UserInfo表中会出现auth_user所有的字段外加自己扩展的字段
    这么做的好处在于你能够直接点击你自己的表更加快速的完成操作及扩展
    
    前提:
        1.在继承之前没有执行过数据库迁移命令
            auth_user没有被创建，如果当前库已经创建了那么你就重新换一个库
        2.继承的类里面不要覆盖AbstractUser里面的字段名
            表里面有的字段都不要动，只扩展额外字段即可
        3.需要在配置文件中告诉django你要用UserInfo替代auth_user(******)
            AUTH_USER_MODEL = 'app.UserInfo'
                                '应用名.表名'
    """
    phone = models.BigIntegerField()
    
    
"""
你如果自己写表替代了auth_user那么
auth模块的功能还是照常使用，参考的表页由原来的auth_user变成了UserInfo
"""
```

