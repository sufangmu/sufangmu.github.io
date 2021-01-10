# 模型层

## 一、连接数据库

### 1. 创建数据库

```mysql
CREATE DATABASE test CHARSET utf8;
# 授权
GRANT ALL ON test.* TO 'admin'@'10.0.0.%' IDENTIFIED BY 'admin@123';
```

### 2. 修改配置文件

#### 1. 在setting.py文件中指定mysql数据库的相关信息

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'test',
        'USER': 'admin',
        'PASSWORD': 'admin@123',
        'HOST': '10.0.0.128',
        'PORT': 3306,
        'CHARSET': 'utf8'
    }
}
```

#### 2. 修改默认的mysql模块

在setting.py文件同级的的`__init__.py`中修改连接mysql的模块（`mysite/mysite/__init__.py`）

```python
import pymysql

pymysql.install_as_MySQLdb()
```

#### 3. 安装pymysql模块

```python
pip install pymysql
```

### 3. 创建表

```python
#filename: models.py
from django.db import models


# Create your models here.
class User(models.Model):
    id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=32)
    age = models.IntegerField()
```

### 4.  迁移数据库

```python
# 于在该app下建立migrations目录，并记录所有的关于modes.py的改动
比如0001_initial.py， 但是这个改动还没有作用到数据库文件
python manage.py makemigrations
# 将对数据库的更改在数据库中真实执行。
python manage.py migrate
```

## 二、创建表

### 1. 独立表

```python
#filename: models.py
from django.db import models


# Create your models here.
class User(models.Model):
    id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=32)
    age = models.IntegerField()
```

### 2.关系表

表与表之间的关系：

1. 一对一：`models.OneToOneField()`
2. 一对多：`models.ForeignKey()`
3. 多对多：`models.ManyToManyField()`
4. 没有关系

创建表关系先将基表创建出来，然后再添加外键字段。

![1610157707017](images/1610157707017.png)

```python
#filename: models.py
class Book(models.Model):
    title = models.CharField(max_length=32, verbose_name="书名")
    price = models.DecimalField(max_digits=8, decimal_places=2, verbose_name="价格")
    # 图书和出版社是一对多，并且书是多的一方，所以外键字段放在Book表里面
    # 默认就是与出版社表的主键字段做外键关联
    # 如果字段对应的是ForeignKey 那么会orm会自动在字段的后面加_id，如果自己加了_id那么orm还是会在后面继续加_id
    publish = models.ForeignKey(to='Publish')

    # 图书和作者是多对多的关系，外键字段建在任意一方均可，但是推荐建在查询频率较高的一方
    # authors是一个虚拟字段，并不会在数据库中创建这个字段，主要是用来告诉orm书籍表和作者表是多对多关系，让orm自动帮你创建第三张关系表
    authors = models.ManyToManyField(to='Author')


class Publish(models.Model):
    name = models.CharField(max_length=32, verbose_name="出版社名称")
    addr = models.CharField(max_length=64, verbose_name="通讯地址")


class Author(models.Model):
    name = models.CharField(max_length=32, verbose_name="作者姓名")
    age = models.IntegerField(verbose_name="年龄")
    # 作者与作者详情是一对一的关系,外键字段建在任意一方都可以,但是推荐建在查询频率较高的表中
    # OneToOneField也会自动给字段加_id后缀
    author_detail = models.OneToOneField(to='AuthorDetail')


class AuthorDetail(models.Model):
    email = models.EmailField(verbose_name="邮箱")
    addr = models.CharField(max_length=32, verbose_name="通讯地址")
```







> 在django1.X版本中外键默认都是级联更新删除的

## 三、ORM操作

### 1. 增

#### 1.1 单表

##### 1.1.1 方法一：`create()`

```python
# 方式1：直接传值
	models.User.objects.create(username='Eric', age=16)
# 方式2：传入一个字典
    user = {
        'username': 'Ron',
        'age': 18,
    }
    models.User.objects.create(**user)
```

##### 1.1.2 方法二：`save()`

```python
# 方式1：创建对象时赋值
    user_obj = models.User(username='Jack', age=16)
    user_obj.save()
# 方式2：先创建对象，然后赋值保存
    user_obj = models.User()
    user_obj.username = 'John'
    user_obj.age = 17
    user_obj.save()
```



### 2. 查

返回的结果是一个querySet对象，可以把它看成是一个列表套数据对象。支持索引和切片操作，但是不支持负数，并且不推荐使用索引。

#### 2.1 单表查询

##### 2.1.1 查询所有数据

```python
# 方式1：    
    user_obj = models.User.objects.filter()
    print(user_obj)
# 方式2：    
    user_obj = models.User.objects.all()
    print(user_obj)
```



`filter`括号内可以写多个参数，查询的时候默认是and关系

```python
    user_obj = models.User.objects.filter(age=16)
    print(user_obj) # <QuerySet [<User: User object>, <User: User object>]>
```



### 3. 改

#### 3.1 方法一：`update()`

```python
    # user_obj 是 <class 'django.db.models.query.QuerySet'>
    user_obj = models.User.objects.filter(username='John')
    user_obj.update(age=20)
```

#### 3.2 方法二：`save()`

```python
    # user_obj 是 <class 'app.models.User'>
    user_obj = models.User.objects.filter(username='John').first()
    user_obj.age = 21
    user_obj.save()
```

### 4. 删

```python
    user_obj = models.User.objects.filter(username='Jack')
    user_obj.delete()
```



