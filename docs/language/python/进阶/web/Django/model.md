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

### 3. 迁移数据库

```python
# 于在该app下建立migrations目录，并记录所有的关于modes.py的改动
比如0001_initial.py， 但是这个改动还没有作用到数据库文件
python manage.py makemigrations
# 将对数据库的更改在数据库中真实执行。
python manage.py migrate
```

## 二、创建表

