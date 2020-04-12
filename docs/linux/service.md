# Linux中常用的服务

## 一、FTP

### 1. 介绍

FTP 是 File Transfer Protocol （文件传输协议）的缩写 ，在 Unix/Linux 系统中常用的免费 FTP 服务器软件主要是 VSFTP，vsftp的官方地址：http://vsftpd.beasts.org

#### 1. FTP 的工作模式

FTP工作时会开两个端口，一个命令端口（TCP:21），一个数据端口(TCP:20)

1.1 主动模式 （Active FTP）

服务器主动连接客户端

FTP 客户端随机开启一个大于1024 的端口 N 向服务器的 21 号端口发起连接，然后开放 N+1 号端口进行监听，并向服务器发出PORT N+1 命令。服务器接收到命令后，会用其本地的 FTP 数据端口（通常是 20 ）来连接客户端指定的端口 N+1 ，进行数据传输

```
         client                           server

命令控制    1088         ------>             21

数据传输    1089         <------     　　　　 20
```

1.2 被动模式（Passive FTP）

客户端主动链接服务器端

FTP 客户端随机开启一个大于1024 的端口 N 向服务器的 21 号端口发起连接，同时会开启 N+1 号端口。然后向服务器发送PASV 命令，通知服务器自己处于被动模式。服务器收到命令后，会开放一个大于 1024 的端口 P 进行监听，然后用 PORT P 命令通知客户端，自己的数据端口是 P 。客户端收到命令后，会通过 N+1号端后连接服务器的端口 P ，然后在两个端口之间进行数据传输

```
            client                      server
命令控制     1088      ---------->         21
数据传输     1089      -- PASV -->        1099
```

关于两者的区别参考：http://slacksite.com/other/ftp.html

#### 2.用户认证方式

##### 1.匿名用户：ftp

##### 2.系统用户：Linux系统用户

##### 3.虚拟用户：多个虚拟用户映射到一个系统用户

### 2.安装

ubuntu14.04

```bash
$ sudo dpkg -i vsftpd_3.0.2-1ubuntu2.14.04.1_amd64.deb
$ netstat  -lant | grep 21
tcp        0      0 0.0.0.0:21              0.0.0.0:*               LISTEN
```

### 3. 配置文件

- 用户认证配置文件:/etc/pam.d/vsftpd
- 主配置文件:/etc/vsftpd.conf

- 匿名用户（映射为系统用户ftp ）共享文件位置：/srv/ftp

```bash
anonymous_enable=NO             # 是否允许匿名用户登陆，模式不允许
local_enable=YES                # 允许系统用户登陆
#write_enable=YES               # 允许登陆用户进行写操作，默认不允许
#local_umask=022                #　用户登陆后创建文件的umask值
#anon_upload_enable=YES         #　允许匿名用户上传文件
#anon_mkdir_write_enable=YES    #　允许匿名用户创建目录
dirmessage_enable=YES           #　是否显示目录说明文件, 需要收工创建.message文件
use_localtime=YES               #　使用本地时间
xferlog_enable=YES              #　开启上传下载日志
connect_from_port_20=YES        #　数据传输端口
#chown_uploads=YES              # 是否改变上传文件的属主  
#chown_username=whoever     ·   # 如果是需要输入一个系统用户名
#xferlog_file=/var/log/vsftpd.log   ＃　日志文件的路径
#xferlog_std_format=YES # 是否使用标准的ftp xferlog模式
#idle_session_timeout=600   # session超时时间
#data_connection_timeout=120　　 # 设置数据传输超时时间
#nopriv_user=ftpsecure          # 运行vsftpd需要的非特权系统用户默认是nobody
#async_abor_enable=YES          # 是否允许运行特殊的ftp命令async ABOR
#ascii_upload_enable=YES        # 是否使用ascii码方式上传文件
#ascii_download_enable=YES      # 是否使用ascii码方式下载文件
#ftpd_banner=Welcome to blah FTP service. # 定制欢迎信息
#deny_email_enable=YES          # 是否允许禁止匿名用户使用某些邮件地址
#banned_email_file=/etc/vsftpd.banned_emails    # 禁止邮件地址的文件路径
#chroot_local_user=YES          # 本地用户禁锢在宿主目录中
#chroot_list_enable=YES         # 是否将系统用户限止在自己的home目录下
#chroot_list_file=/etc/vsftpd.chroot_list   # 列出的是不chroot的用户的列表
#ls_recurse_enable=YES          # 是否允许使用ls -R等命令
secure_chroot_dir=/var/run/vsftpd/empty
pam_service_name=vsftpd         # pam的配置文件名称 /etc/pam.d/vsftpd
rsa_cert_file=/etc/ssl/certs/ssl-cert-snakeoil.pem
rsa_private_key_file=/etc/ssl/private/ssl-cert-snakeoil.key
```

### 4. 用户管理

#### １. 匿名用户

##### 1.1 允许匿名用户登陆

修改配置文件

```bash
$ sudo vim /etc/vsftpd.conf
nonymous_enable=YES
$ sudo service vsftpd restart
```

测试：

```bash
shuowei@gaopeng:~$ ftp 172.16.10.101
Connected to 172.16.10.101.
220 (vsFTPd 3.0.2)
Name (172.16.10.101:shuowei): ftp   # 登陆用户为ftp
331 Please specify the password.
Password:                           # 密码随意，可以为空
230 Login successful.
Remote system type is UNIX.
Using binary mode to transfer files.
ftp> ls
200 PORT command successful. Consider using PASV.
150 Here comes the directory listing.
-rw-r--r--    1 0        0               0 Jan 25 11:12 test.txt
226 Directory send OK.
ftp> get test.txt                   # 有下载的权限
local: test.txt remote: test.txt
200 PORT command successful. Consider using PASV.
150 Opening BINARY mode data connection for test.txt (0 bytes).
226 Transfer complete.
ftp> delete test.txt                # 没有写的权限
550 Permission denied.
ftp>
```

##### 1.2 允许匿名用户上传和建立目录

修改配置文件

```bash
$ sudo vim /etc/vsftpd.conf
nonymous_enable=YES
write_enable=YES
anon_upload_enable=YES
anon_mkdir_write_enable=YES
$ sudo service vsftpd restart
```

```bash
$ sudo mkdir /srv/ftp/pub
$ sudo chown ftp. /srv/ftp/pub/
$ sudo chmod 777  /srv/ftp/pub/
```

```bash
shuowei@gaopeng:~$ ftp 172.16.10.101
Connected to 172.16.10.101.
220 (vsFTPd 3.0.2)
Name (172.16.10.101:shuowei): ftp
331 Please specify the password.
Password:
230 Login successful.
Remote system type is UNIX.
Using binary mode to transfer files.
ftp> ls
200 PORT command successful. Consider using PASV.
150 Here comes the directory listing.
drwxrwxrwx    2 105      112          4096 Jan 25 11:33 pub
-rw-r--r--    1 0        0               0 Jan 25 11:12 test.txt
226 Directory send OK.
ftp> cd pub             # 进入pub目录
250 Directory successfully changed.
ftp> ls
200 PORT command successful. Consider using PASV.
150 Here comes the directory listing.
226 Directory send OK.
ftp> mkdir testdir      # 文件创建成功
257 "/pub/testdir" created
ftp> put zabbix-3.0.tar.gz  # 可以上传文件
local: zabbix-3.0.tar.gz remote: zabbix-3.0.tar.gz
200 PORT command successful. Consider using PASV.
150 Ok to send data.
226 Transfer complete.
15653160 bytes sent in 0.10 secs (143.7224 MB/s)
ftp> ls
200 PORT command successful. Consider using PASV.
150 Here comes the directory listing.
drwx------    2 105      112          4096 Jan 25 11:36 testdir
-rw-------    1 105      112      15653160 Jan 25 11:42 zabbix-3.0.tar.gz
226 Directory send OK.

```

#### 2. 系统用户

##### 1. 系统用户登陆

```bash
shuowei@gaopeng:~$ ftp 172.16.10.101
Connected to 172.16.10.101.
220 (vsFTPd 3.0.2)
Name (172.16.10.101:shuowei): ubuntu    # 系统用户名
331 Please specify the password.
Password:                               # 系统用户的密码
230 Login successful.
Remote system type is UNIX.
Using binary mode to transfer files.
ftp> ls
200 PORT command successful. Consider using PASV.
150 Here comes the directory listing.
-rw-r--r--    1 1000     1000       111462 Jan 25 10:30 vsftpd_3.0.2-1ubuntu2.14.04.1_amd64.deb
226 Directory send OK.
ftp> pwd
257 "/home/ubuntu"  # 登陆后在自己的家目录
ftp> get vsftpd_3.0.2-1ubuntu2.14.04.1_amd64.deb# 有下载的权限
local: vsftpd_3.0.2-1ubuntu2.14.04.1_amd64.deb remote: vsftpd_3.0.2-1ubuntu2.14.04.1_amd64.deb
200 PORT command successful. Consider using PASV.
150 Opening BINARY mode data connection for vsftpd_3.0.2-1ubuntu2.14.04.1_amd64.deb (111462 bytes).
226 Transfer complete.
111462 bytes received in 0.00 secs (52.1582 MB/s)
ftp> delete vsftpd_3.0.2-1ubuntu2.14.04.1_amd64.deb	# 没有写的权限　需要开启write_enable=YES
550 Permission denied.
```

#### 3.虚拟用户

VSFTP 一个称为安全的保证是采用了虚拟用户的认证方式，它靠对 /etc/pam.d/ 目录下指定的一个认证文件对用户进行认证，认证成功后再把虚拟用户映射为本地用户，该本地用户由服务器配置文件里的语句 ftp_username 的值指定。使用虚拟用户认证，则原有系统账户将不再可用。

所有虚拟用户会统一映射为一个指定的系统普通账号：访问共享位置，即为此系统普通用户的家目录，当然每个虚拟用户也可被赋予不同的访问权限，通过匿名用户的权限控制参数进行指定

为了实现虚拟用户我们需要准备的环境

1. 一个不可登陆的系统账户，并为这个系统创建一个家目录。虚拟账户就在这个家目录里活动。
2. 创建虚拟账户名单，并为这些用户创建一个认证数据库

##### 3.1 创建虚拟用户

###### 3.1.１. 创建本地系统用户

```bash
$ sudo mkdir /data
$ sudo useradd -m  -d /data/ftp -s /bin/false  ftpadmin
$ sudo chwon -R  ftpadmin /data/ftp
```

###### 3.1.2. 建立虚拟账户名单

```bash
ubuntu@node1:~$ sudo mkdir /etc/vsftpd/
ubuntu@node1:~$ sudo vim /etc/vsftpd/ftpusers.txt
jdyyy
123456
yuanzhi
123456
```

###### 3.1.３.生成虚拟账户的数据库

创建数据库文件需要安装db-util

```bash
$ sudo dpkg -i db5.3-util_5.3.28-3ubuntu3.1_amd64.deb  db-util_1%3a5.3.21~exp1ubuntu1_all.deb
```

生成认证数据库文件

```bash
ubuntu@node1:~$ sudo db_load -T -t hash -f /etc/vsftpd/ftpusers.txt  /etc/vsftpd/ftpusers.db
# -T: 允许使用文本文件信息加载到数据库中
# -t : 指定加密算法
# -f : 指定文件
ubuntu@node1:~$ sudo chmod  600 /etc/vsftpd/ftpusers.db
```

创建数据库的pam文件

```bash
# 备份原来的pam文件
$ sudo cp /etc/pam.d/vsftpd  /etc/pam.d/vsftpd.bak
# 拷贝pam模板文件到/etc/pam.d/
$ sudo cp /usr/share/doc/vsftpd/examples/VIRTUAL_USERS/vsftpd.pam /etc/pam.d/vsftpd
# 编译新的pam文件
# 注意pam_userdb.so的位置，模板中/lib/security/pam_userdb.so是找不到的
# 根据系统的情况改，db=/etc/vsftpd/ftpusers ftpuser是认证数据库文件的文件名，这里不需要加后缀
$ sudo vim /etc/pam.d/vsftpd
auth required /lib/x86_64-linux-gnu/security/pam_userdb.so db=/etc/vsftpd/ftpusers
account required /lib/x86_64-linux-gnu/security/pam_userdb.so db=/etc/vsftpd/ftpusers

```

###### 3.1.4.修改配置文件

```bash
# 激活虚拟用户
guest_enable=YES
# 虚拟用户映射到系统用户的用户名称(系统用户的名称)
guest_username=ftpadmin
# 虚拟用户拥有与系统用户相同的权限
virtual_use_local_privs=YES

```

###### 3.1.5.重启服务

异常处理

如果配置文件中没有加：virtual_use_local_privs=YES

登陆报错：500 OOPS: vsftpd: refusing to run with writable root inside chroot()

```bash
shuowei@gaopeng:~$ ftp 172.16.10.101
Connected to 172.16.10.101.
220 (vsFTPd 3.0.2)
Name (172.16.10.101:shuowei): jdyyy
331 Please specify the password.
Password:
500 OOPS: vsftpd: refusing to run with writable root inside chroot()
Login failed.
ftp>

```

去除系统用户家目录写权限

```bash
$ sudo chmod a-w /data/ftp/
```

但是又没有写的权限了。

###### 3.1.6. 最终配置

```bash
listen=YES
anonymous_enable=NO
local_enable=YES
write_enable=YES
dirmessage_enable=YES
use_localtime=YES
xferlog_enable=YES
connect_from_port_20=YES
xferlog_file=/var/log/vsftpd.log
secure_chroot_dir=/var/run/vsftpd/empty
pam_service_name=vsftpd
rsa_cert_file=/etc/ssl/certs/ssl-cert-snakeoil.pem
rsa_private_key_file=/etc/ssl/private/ssl-cert-snakeoil.key
guest_enable=YES
guest_username=ftpadmin
virtual_use_local_privs=YES

```

这样虚拟用户读写删权限都有

##### 3.2. 实现虚拟用户不同权限

###### 3.2.1 修改FTP主配置文件

```bash
$ sudo vim /etc/vsftpd.conf
user_config_dir=/etc/vsftpd_user_conf
```

###### 3.2.2 给每个虚拟用户创建一个独立的权限配置文件-版本1

```bash
$ sudo mkdir /data/ftp/jdyyy
$ sudo mkdir /etc/vsftpd_user_conf
$ sudo vim /etc/vsftpd_user_conf/jdyyy
# 只有上传权限，没有下载权限
write_enable=YES
virtual_use_local_privs=NO
anon_upload_enable=YES
anon_world_readable_only=YES
anon_mkdir_write_enable=YES
anon_other_write_enable=NO

$ sudo vim /etc/vsftpd_user_conf/yuanzhi
# 只有下载权限
write_enable=NO
virtual_use_local_privs=NO
anon_upload_enable=NO
anon_world_readable_only=NO
anon_mkdir_write_enable=NO
anon_other_write_enable=NO

# 注意ftp文件夹的权限
ubuntu@node1:/$ ll /data/
total 12
drwxr-xr-x  3 root     root     4096 Jan 25 16:17 ./
drwxr-xr-x 23 root     root     4096 Jan 25 16:17 ../
drwxr-xr-x  4 ftpadmin ftpadmin 4096 Jan 25 17:50 ftp/
# 主配置文件
ubuntu@node1:/$ grep -Ev "(^#|^$)" /etc/vsftpd.conf  
listen=YES
anonymous_enable=NO
local_enable=YES
dirmessage_enable=YES
use_localtime=YES
xferlog_enable=YES
connect_from_port_20=YES
xferlog_file=/var/log/vsftpd.log
chroot_local_user=YES
secure_chroot_dir=/var/run/vsftpd/empty
pam_service_name=vsftpd
rsa_cert_file=/etc/ssl/certs/ssl-cert-snakeoil.pem
rsa_private_key_file=/etc/ssl/private/ssl-cert-snakeoil.key
guest_enable=YES
guest_username=ftpadmin
virtual_use_local_privs=YES
allow_writeable_chroot=YES
user_config_dir=/etc/vsftpd_user_conf


```



###### 3.2.3 给每个虚拟用户创建一个独立的权限配置文件-版本2

| 权限     | upload | download | admin |
| -------- | ------ | -------- | ----- |
| 下载     | -      | +        | +     |
| 上传     | +      | -        | +     |
| 创建目录 | +      | -        | +     |
| 删除     | -      | -        | +     |

```bash
root@node1:~# ls -ld /data/ftp/*
drwxr-xr-x 2 ftpadmin ftpadmin 4096 Jan 28 18:50 /data/ftp/download
drwxr-xr-x 3 ftpadmin ftpadmin 4096 Jan 28 18:54 /data/ftp/upload

vsftpd服务的主配置文件
ubuntu@node1:~$ grep -Ev "(^#|^$)" /etc/vsftpd.conf 
listen=YES
anonymous_enable=NO
local_enable=YES
dirmessage_enable=YES
use_localtime=YES
xferlog_enable=YES
connect_from_port_20=YES
xferlog_file=/var/log/vsftpd.log
chroot_local_user=YES
secure_chroot_dir=/var/run/vsftpd/empty
pam_service_name=vsftpd
rsa_cert_file=/etc/ssl/certs/ssl-cert-snakeoil.pem
rsa_private_key_file=/etc/ssl/private/ssl-cert-snakeoil.key
guest_enable=YES
guest_username=ftpadmin
allow_writeable_chroot=YES
user_config_dir=/etc/vsftpd_user_conf
```

创建不同用户各自的的配置文件

```bash
root@node1:~# ls /etc/vsftpd_user_conf/
admin  download  upload

ubuntu@node1:~$ cat /etc/vsftpd_user_conf/download 
write_enable=NO
anon_upload_enable=NO
anon_world_readable_only=NO
anon_mkdir_write_enable=NO
anon_other_write_enable=NO
local_root=/data/ftp/download

ubuntu@node1:~$ cat /etc/vsftpd_user_conf/upload 
write_enable=YES
anon_upload_enable=YES
anon_world_readable_only=YES
anon_mkdir_write_enable=YES
anon_other_write_enable=NO
local_root=/data/ftp/upload


ubuntu@node1:~$ cat /etc/vsftpd_user_conf/admin
write_enable=YES
anon_upload_enable=YES
anon_world_readable_only=NO
anon_mkdir_write_enable=YES
anon_other_write_enable=YES
```

生成用户数据库文件

```bash
ubuntu@node1:~$ cat  /etc/vsftpd/ftpusers.txt upload
123456
download
123456
admin
admin
ubuntu@node1:~$ sudo db_load -T -t hash -f /etc/vsftpd/ftpusers.txt  /etc/vsftpd/ftpusers.db
```

重启服务

## 二、SSH

### 1. 执行命令

#### 1. 执行单条命令

```bash
    ubuntu@node1:~$ ssh ubuntu@172.16.10.102 hostname
    ubuntu@172.16.10.102's password: 
    node2
```

#### 2. 执行带参数的命令

```bash
    ssh ubuntu@172.16.10.102 grep root /etc/passwd
    ubuntu@172.16.10.102's password: 
    root:x:0:0:root:/root:/bin/bash
```

#### 3. 执行多条命令

执行多条命令时，只要用分号把命令分割开就可以了，但是要把多条命令用引号引起来，否则分号后面的命令就是在本地执行的。

```bash
    # 不加分号
    ubuntu@node1:~$ ssh ubuntu@172.16.10.102 cat /etc/hostname;hostname -I
    node2
    172.16.10.101
```

```bash
    # 加分号
    ubuntu@node1:~$ ssh ubuntu@172.16.10.102 "cat /etc/hostname;hostname -I"
    node2
    172.16.10.102
```

#### 4. 执行多行命令

用单引号或双引号开头，然后写上几行命令，最后再用相同的引号来结束。

```bash
    ubuntu@node1:~$ ssh   ubuntu@172.16.10.102 "
    > hostname -I
    > uname -r
    > uptime
    > "
    ubuntu@172.16.10.102's password: 
    172.16.10.102 
    4.4.0-31-generic
    15:39:13 up  6:28,  2 users,  load average: 0.00, 0.00, 0.00
```

#### 5. 执行交互命令

```bash
    ubuntu@node1:~$ ssh ubuntu@172.16.10.102 "sudo apt install nginx"
    ubuntu@172.16.10.102's password: 
    sudo: no tty present and no askpass program specified
```

默认情况下，当你执行不带命令的 ssh 连接时，会为你分配一个 TTY。因为此时你应该是想要运行一个 shell 会话。

但是当你通过 ssh 在远程主机上执行命令时，并不会为这个远程会话分配 TTY。此时 ssh 会立即退出远程主机，所以需要交互的命令也随之结束。

这时需要用 -t 参数显式的告诉 ssh，我们需要一个 TTY 远程 shell 进行交互，添加 -t 参数后，ssh 会保持登录状态，直到你退出需要交互的命令。

```bash
    ubuntu@node1:~$ ssh -t  ubuntu@172.16.10.102 "sudo apt install nginx"
    ubuntu@172.16.10.102's password:
    [sudo] password for ubuntu:
    Reading package lists... Done
    Building dependency tree
    Reading state information... Done
    The following extra packages will be installed:
    fontconfig-config fonts-dejavu-core libfontconfig1 libgd3 libjbig0
    libjpeg-turbo8 libjpeg8 libtiff5 libvpx1 libxpm4 libxslt1.1 nginx-common
    nginx-core
    Suggested packages:
    libgd-tools fcgiwrap nginx-doc
    The following NEW packages will be installed:
    fontconfig-config fonts-dejavu-core libfontconfig1 libgd3 libjbig0
    libjpeg-turbo8 libjpeg8 libtiff5 libvpx1 libxpm4 libxslt1.1 nginx
    nginx-common nginx-core
    0 upgraded, 14 newly installed, 0 to remove and 8 not upgraded.
    Need to get 2,681 kB of archives.
    After this operation, 9,073 kB of additional disk space will be used.
    Do you want to continue? [Y/n] n
    Abort.
    Connection to 172.16.10.102 closed.
```

#### 6. 使用本地变量

```bash
    ubuntu@node1:~$ name="nginx"
    ubuntu@node1:~$ ssh ubuntu@172.16.10.102 "echo "Install $name""
    ubuntu@172.16.10.102's password: 
    Install nginx
```

### 2. ssh执行脚本

#### 1. 执行远程不带参数的脚本

```bash
    #远程脚本文件内容
    ubuntu@node2:~$ cat hello.sh
    #!/bin/bash
    echo "hello world"
```

```bash
    ubuntu@node1:~$ ssh ubuntu@172.16.10.102 "$HOME/hello.sh"
    ubuntu@172.16.10.102's password:
    hello world
```

#### 2. 执行远程需要参数的脚本

```bash
    # 远程脚本文件内容
    ubuntu@node2:~$ cat script.sh
    #!/bin/bash
    name=$1
    echo "install $name"
    echo "installed succeed!"
```

```bash
    ubuntu@node1:~$ name=nginx
    ubuntu@node1:~$ ssh ubuntu@172.16.10.102   "$HOME/script.sh $name"
    ubuntu@172.16.10.102's password:
    install nginx
    installed succeed!
```

#### 3. 执行本地不带参数的脚本

```bash
    ubuntu@node1:~$ cat hello.sh
    #!/bin/bash
    hostname
    touch hello.txt
    ls

    ubuntu@node1:~$ ssh ubuntu@172.16.10.102 < hello.sh
    Pseudo-terminal will not be allocated because stdin is not a terminal.
    ubuntu@172.16.10.102's password:
    node2
    hello.txt
```

#### 4. 执行本地需要参数的脚本文件

```bash
    # 脚本内容，需要传入一个参数
    ubuntu@node1:~$ cat script.sh
    #!/bin/bash
    name=$1
    echo "install $name"
    echo "installed succeed!"
    # 需要加上bash -s
    ubuntu@node1:~$ ssh ubuntu@172.16.10.102 "bash -s" < script.sh nginx
    ubuntu@172.16.10.102's password:
    install nginx
    installed succeed!
```
