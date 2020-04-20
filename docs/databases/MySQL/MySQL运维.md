# MySQL基础运维

## 一、安装

安装环境

```bash
root@gp:~# cat /etc/os-release
NAME="Ubuntu"
VERSION="18.04.4 LTS (Bionic Beaver)"
ID=ubuntu
ID_LIKE=debian
PRETTY_NAME="Ubuntu 18.04.4 LTS"
VERSION_ID="18.04"
HOME_URL="https://www.ubuntu.com/"
SUPPORT_URL="https://help.ubuntu.com/"
BUG_REPORT_URL="https://bugs.launchpad.net/ubuntu/"
PRIVACY_POLICY_URL="https://www.ubuntu.com/legal/terms-and-policies/privacy-policy"
VERSION_CODENAME=bionic
UBUNTU_CODENAME=bionic
```

### 1. 下载二进制包

官方下载地址：[https://downloads.mysql.com/archives/community/](https://downloads.mysql.com/archives/community/)

清华源下载地址：[https://mirrors.tuna.tsinghua.edu.cn/mysql/downloads/MySQL-5.7/](https://mirrors.tuna.tsinghua.edu.cn/mysql/downloads/MySQL-5.7/)

下载版本：`mysql-5.7.28-linux-glibc2.12-x86_64.tar.gz`

### 2. 解压

```bash
root@gp:~# mkdir /app
root@gp:~# tar -zxf  /opt/mysql-5.7.28-linux-glibc2.12-x86_64.tar.gz -C /app/
root@gp:/app# mv mysql-5.7.28-linux-glibc2.12-x86_64 mysql
```

### 3. 添加环境变量

```bash
root@gp:/app/mysql# echo "export PATH=/app/mysql/bin:$PATH" >> /etc/profile
root@gp:/app/mysql# source /etc/profile
```

### 4. 创建mysql用户

```bash
root@gp:/app/mysql# groupadd mysql
root@gp:/app/mysql# useradd -r -g mysql -s /bin/false mysql
```

### 5. 创建数据目录并授权

```bash
root@gp:/app/mysql# mkdir -p /data/mysql
root@gp:/app/mysql# chown -R mysql:mysql /app/mysql/
root@gp:/app/mysql# chown -R mysql:mysql /data/mysql/
```

### 6. 初始化数据库

```bash
root@gp:/app/mysql# mysqld --initialize --user=mysql --basedir=/app/mysql --datadir=/data/mysql
2020-04-18T14:15:51.460386Z 0 [Warning] TIMESTAMP with implicit DEFAULT value is deprecated. Please use --explicit_defaults_for_timestamp server option (see documentation for more details).
2020-04-18T14:15:51.680889Z 0 [Warning] InnoDB: New log files created, LSN=45790
2020-04-18T14:15:51.757967Z 0 [Warning] InnoDB: Creating foreign key constraint system tables.
2020-04-18T14:15:51.837056Z 0 [Warning] No existing UUID has been found, so we assume that this is the first time that this server has been started. Generating a new UUID: 1bf93e5f-817f-11ea-8a04-000c2915b150.
2020-04-18T14:15:51.837759Z 0 [Warning] Gtid table is not ready to be used. Table 'mysql.gtid_executed' cannot be opened.
2020-04-18T14:15:52.595839Z 0 [Warning] CA certificate ca.pem is self signed.
2020-04-18T14:15:52.847476Z 1 [Note] A temporary password is generated for root@localhost: X&1.-FxfVaaW
# 数据目录结构
root@gp:/data/mysql# tree -LF 1 /data/mysql
/data/mysql
├── auto.cnf
├── ca-key.pem
├── ca.pem
├── client-cert.pem
├── client-key.pem
├── ib_buffer_pool
├── ibdata1
├── ib_logfile0
├── ib_logfile1
├── mysql/
├── performance_schema/
├── private_key.pem
├── public_key.pem
├── server-cert.pem
├── server-key.pem
└── sys/
```

### 7. 安装出现的错误

```bash
root@gp:/app/mysql# mysqld --initialize --user=mysql --basedir=/app/mysql --datadir=/data/mysql
mysqld: error while loading shared libraries: libaio.so.1: cannot open shared object file: No such file or directory
# 解决方法
root@gp:/app/mysql# apt -y install libaio-dev
```

### 8. 配置文件

```bash
root@gp:~# cat /etc/my.cnf
[mysqld]
user=mysql
basedir=/app/mysql
datadir=/data/mysql
server_id=1
port=3306
socket=/tmp/mysql.sock
[mysql]
socket=/tmp/mysql.sock
prompt=3306 [\\d]>
```

### 9. 启动与停止

```bash
root@gp:/app/mysql/support-files# ./mysql.server start
root@gp:/app/mysql/support-files# ./mysql.server stop
```

### 10. 设置密码

```bash
root@gp:~# mysqladmin -u root -p password
```

## 11. MySQL5.7的特点

引入了新的安全机制

1. 初始化完成后会生成临时密码
2. 密码复杂度：长度超过12位
3. 密码过期时间180天

## 二、用户管理

### 1. 账户管理

#### 1.1 查看当前用户

```bash
3306 [(none)]>select user,authentication_string,host from mysql.user;
+---------------+-------------------------------------------+-----------+
| user          | authentication_string                     | host      |
+---------------+-------------------------------------------+-----------+
| root          | *81F5E21E35407D884A6CD4A731AEBFB6AF209E1B | localhost |
| mysql.session | *THISISNOTAVALIDPASSWORDTHATCANBEUSEDHERE | localhost |
| mysql.sys     | *THISISNOTAVALIDPASSWORDTHATCANBEUSEDHERE | localhost |
+---------------+-------------------------------------------+-----------+
3 rows in set (0.00 sec)
```

#### 1.2 用户白名单

支持的方式：

```sql
username@'10.0.0.%'
username@'%'
username@'10.0.0.100'
username@'localhost'
username@'www.example.com'
username@'10.0.0.5%'
username@'10.0.0.%'
username@'10.0.0.0/255.255.254.0'
```

#### 1.3 用户创建

```mysql
3306 [(none)]>create user yuanzhi@'10.0.0.%' identified by '123456';
Query OK, 0 rows affected (0.00 sec)
```

#### 1.4 修改用户密码

```mysql
3306 [(none)]>alter user yuanzhi@'10.0.0.%' identified by 'yuanzhi';
Query OK, 0 rows affected (0.00 sec)
```

#### 1.5 删除用户

```mysql
3306 [(none)]>drop user yuanzhi@'10.0.0.%';
Query OK, 0 rows affected (0.00 sec)
```

### 2. 权限管理

#### 2.1 授权

1 授予所有权限

```mysql
3306 [(none)]>grant all on *.* to root@'10.0.0.%' identified by 'root';
Query OK, 0 rows affected, 1 warning (0.01 sec)
```

2 授予指定权限

```mysql
3306 [(none)]>grant select,update,insert,delete on wordpress.* to wordpress@'10.0.0.%' identified by 'wordpress';
Query OK, 0 rows affected, 1 warning (0.00 sec)
```

#### 2.2 查看权限

```bash
3306 [(none)]>show grants for 'wordpress'@'10.0.0.%';
+---------------------------------------------------------------------------------+
| Grants for wordpress@10.0.0.%                                                   |
+---------------------------------------------------------------------------------+
| GRANT USAGE ON *.* TO 'wordpress'@'10.0.0.%'                                    |
| GRANT SELECT, INSERT, UPDATE, DELETE ON `wordpress`.* TO 'wordpress'@'10.0.0.%' |
+---------------------------------------------------------------------------------+
2 rows in set (0.00 sec)
```

#### 2.3 回收权限

```mysql
3306 [(none)]>revoke delete on wordpress.* from wordpress@'10.0.0.%';
Query OK, 0 rows affected (0.00 sec)
```

### 3. root密码丢失处理

```bash
# 1.关闭数据库服务
root@gp:/app/mysql/support-files# ./mysql.server stop
Shutting down MySQL
.... *
# 2.mysqld_safe 启动（关闭认证，关闭TCP/IP连接）
root@gp:/app/mysql/support-files# mysqld_safe --skip-grant-tables --skip-networking &
[1] 3991
root@gp:/app/mysql/support-files# 2020-04-20T15:32:55.026585Z mysqld_safe Logging to '/data/mysql/gp.err'.
2020-04-20T15:32:55.060397Z mysqld_safe Starting mysqld daemon with databases from /data/mysql
# 3.修改密码
root@gp:/app/mysql/support-files# mysql -uroot
...
3306 [(none)]>flush privileges;
Query OK, 0 rows affected (0.01 sec)

3306 [(none)]>alter user root@'localhost' identified by 'root';
Query OK, 0 rows affected (0.00 sec)
```

## 三、MySQL连接

#### 1. socket连接

```bash
# 默认使用socket连接 -S /tmp/mysql.sock可以不加
root@gp:/app/mysql/support-files# mysql -uroot -p -S /tmp/mysql.sock
```

#### 2. TCP/IP连接

```bash
root@gp:~# mysql -h 10.0.0.131 -P 3306 -uroot -p
```

#### 3. 免交互执行SQL语句

```bash
root@gp:~# mysql -u root -proot -e "show databases;"
```

## 四、初始化配置

#### 1.初始化配置的方法：

1. 预编译
2. **配置文件**
3. 命令行（仅限于mysqld和mysqld_safe）

#### 2. 初始化配置文件

配置文件读取顺序

```bash
root@gp:~# mysqld --help --verbose | grep my.cnf
/etc/my.cnf /etc/mysql/my.cnf /usr/local/mysql/etc/my.cnf ~/.my.cnf
                      my.cnf, $MYSQL_TCP_PORT, /etc/services, built-in default
```

如果--defaults-file指定了配置文件，以上文件都不会被读取。

参考：

老男孩MySQL视频学习笔记（ https://www.bilibili.com/video/BV1qJ411R7CW?p=5 ）