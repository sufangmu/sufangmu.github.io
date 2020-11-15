# Nginx负载均衡


Nginx支持七层负载（HTTP）和四层负载（TCP and UDP），这里主要介绍HTTP负载

实现方法：利用Nginx反向代理的功能实现后端服务的负载均衡

指令：proxy_pass、upstream



## 一、负载均衡策略

Nginx负载均衡模式有6种（开源版4种+Plus版2种）

1. 轮询(Round Robin)
   默认方式，请求在后端服务器依次轮询，通过weights参数改变轮询的权重。

```bash
upstream backend {
   server backend1.example.com;
   server backend2.example.com;
}
```

2. 最少连接数(Least Connections)
   客户端请求发给连接数最少的服务器，同时可以通过weight指定权重

```bash
upstream backend {
    least_conn;
    server backend1.example.com;
    server backend2.example.com;
}
```

3. IP哈希(IP Hash)
   根据客户端的IP地址觉得发给后端的哪个服务器，同一IP地址的请求都发给后端的同一服务器，除非后端服务器不可用。

```bash
upstream backend {
    ip_hash;
    server backend1.example.com;
    server backend2.example.com;
}

```

4. 自定义哈希(Generic Hash,1.7.2以上)

```bash
upstream backend {ea
    hash $request_uri consistent;
    server backend1.example.com;
    server backend2.example.com;
}
```

5. 最短响应时间(Least Time,1.7.10以上)
   请求发给响应时间最短和连接数最少的服务器。

6. 随机选择(Random，1.15.1以上)
   根据随机策略选择后端服务器

## 二、后端服务器配置

    upstream name {
        server address [parameters];
    }

```
参数：
    weight： 设置服务器权重，默认为1。例：weight=1；
    max_fails:设置与被代理服务器连接失败的次数，默认为1。例：max_fails=3
    fail_timeout：连接超时时间，默认为10s。例：fail_timeout=5
    backup：把被代理服务器标记为备份服务器，当主服务器宕机之后启用
    down：把被代理服务器标记为不可用状态
    slow_start：慢启动，服务在启动后经过一段时间才标记为可用，默认为0（禁用）**注意**：不能与hash和ip_hash一起使用
    max_conns（1.29~1.11.5，商业版中）：限制和被代理服务器的最大活动连接，默认为0，不限制。例：max_conns=25
```

## 三、配置实例

1. 对所有请求实现一般轮询规则的负载均衡。

```bash
upstream patapi{
    server 192.168.1.130:9900;
    server 192.168.1.131:9901;
}

server {
        listen 9988;
        location / {
                proxy_pass http://patapi;
                ...
        }

}

```

2. 对所有请求实现加权轮询规则的负载均衡

```bash
upstream patapi{
    server 192.168.1.130:9900 weight=5;
    server 192.168.1.131:9901 weight=2;
}

server {
        listen 9988;
        location / {
                proxy_pass http://patapi;
                ...
        }

}







https://docs.nginx.com/nginx/admin-guide/load-balancer/http-load-balancer/#metho_hasj
```

# Nginx rewrite 

官方链接：http://nginx.org/en/docs/http/ngx_http_rewrite_module.html#rewrite

模块：ngx_http_rewrite_module
功能：实现URL重写
依赖：依赖PCRE(Perl Compatible Regular Expressions)


## 转发与重写的区别：

|            区别            |             重写             |       转发       |
| :------------------------: | :--------------------------: | :--------------: |
| 客户端浏览器地址栏中的地址 | 改变(变为真实提供服务的地址) |       不变       |
|          请求次数          |             两次             |       一次       |
|            位置            |           没有限制           |  同一站点项目内  |
|   转发到的页面路径名表示   |         完整的路径名         | 可以不用全路径名 |
|  request范围内属性的传递   |            不可以            | 可以传递给新页面 |
|            速度            |              慢              |        块        |



## 配置指令



### 1. if

位置：server, location

语法：	if (condition) { ... }

condition的格式：

1. 变量名：如果变量的值为空字符串或“ `0`”，则为false ;

2. 使用“ =”和“ !=”运算符比较变量和字符串;

```
if  ($request_method = POST){
     return 405
}
```

3. 变量与正则表达式匹配

   ~:区分大小写的匹配，匹配成功为true

   ~*:不区分大小写的匹配，匹配成功为true

   !~:区分大小写的匹配，匹配失败为true

   !~*:不区分大小写的匹配，匹配失败为true

   在正则表达式中可以用小括号对变量进行截取，在花括号中使用$1-$9引用截取的值。如果正则表达式包含“ `}`”或“ `;`”字符，则整个表达式应包含在单引号或双引号中。

   ```bash
    if ($request_uri ~ /a/b/c/d) {
                           return 200 "$request_method $request_uri";
                   }
   ```



4. 使用“ -f”和“ !-f”运算符检查文件是否存在;
5. 使用“ -d”和“ !-d”运算符检查目录是否存在;
6. 使用“ -e”和“ !-e”运算符检查文件，目录或符号链接是否存在;
7. 使用“ -x”和“ !-x”运算符检查可执行文件。















### 2.break

作用：stops processing the current set of ngx_http_rewrite_module directives;

　　　中断当前相同作用域中其他Nginx配置，位于它前面的指令配置生效，位于后面的指令配置无效。服务器在根据配置处理请求的过程中遇到该指令时。回到上一层作用域继续向下读取配置。

位置：server, location, if

语法：break;

实例：

###  3.return

作用：完成对请求的处理，直接向客户端返回响应状态码。处于该指令后的所有Nginx配置都是无效的。

位置：server，location，if

语法：

return *code*  *[ text ];* 
return *code URL* ; 
return *URL* ;

实例：

```bash
default_type  application/json;
if ($http_appversion != ""){
	return 200 '{"code":-2, "message":"版本过旧，需要强制升级"}';
}
```



### 4.rewrite

作用：通过正则表达式来改变URI。可以同时存在一个或多个指令，按照顺序依次对URL进行匹配和处理。

位置：server`，`location`，`if

语法：rewrite *regex* *replacement* *[flag]*;

​	**regex****：用于匹配URI的正则表达式。使用()标记要截取的内容

​	**replacement**：匹配成功后用于替换URI中被截取内容的字符串。默认情况下如果该字符串由“http://”，“https://”或“$scheme” 开头，则处理停止并将重定向返回给客户端。

​	**flag**：用来设置rewrite对URI的处理行为。

​		last：终止继续在**本location**中处理接收到的URI，并将此处重写的URI作为新的URI。使用各location块进行处理。该标识将重写后的URI重新咋server块中执行，为重写后的URI提供了转入其他location块的机会。

​		实例：

```bash
location /  {
    rewrite ^(/download/.*)/media/(.*)\..*$ $1/mp3/$2.mp3 last; # 匹配成功后后面的不执行
    rewrite ^(/download/.*)/audio/(.*)\..*$ $1/mp3/$2.ra  last;
}
```

​		break：将此处重写的URI作为新的URI，在本块中继续进行处理。该标识后将重写后的地址在当前的location块中继续执行，不会将新的URI转向到其他location块。

​		实例：

```bash
location /download  {
    rewrite ^(/download/.*)/media/(.*)\..*$ $1/mp3/$2.mp3 break; # 匹配成功后使用进入第3行
    rewrite ^(/download/.*)/audio/(.*)\..*$ $1/mp3/$2.ra  break;
}
```

​		如果把break替换为last，重写后的URI还可能会被该location匹配到，Nginx在这种情况下回尝试10此循环后返回错误状态码500.

​		redirect：将重写后的URI返回给客户端，状态代码为302。主要用在replacement变量不是以“http://”，“https://”开头的情况下。

​		permanent：将重写后的URI返回给客户端，状态码是301.指明是永久重定向。

注意：①rewrite接收到的URI不包含host地址；②不包含URL中的请求指令（不包含?arg1=value1&arg2=value2）

实例1：域名跳转

```
server {
        listen 9988;# default_server;
        server_name localhost;
        charset utf-8;
        rewrite_log on;
        rewrite ^/ http://www.baidu.com/;
        }

```





### 5.rewrite_log

作用：配置是否开启URL重写日志的输出功能，日志将以notice级别输出到error_log

语法：rewrite_log on|off;

### 6.set

作用：设置一个新的变量

语法：set var vaule;

实例：



```bash
   set $newIp "";
   if ($http_appversion = "1.0.16"){	
   	set $newIp "192.168.1.11:8080";
   }
   proxy_pass "http://$newIp";     	
```









### 7.uninitialized_variable_warn

作用：配置使用未初始化的变量时，是否记录警告日志

语法：uninitialized_variable_warn on|off;  默认on



**rewrite常用全局变量**

所有Nginx变量：http://nginx.org/en/docs/varindex.html



http://nginx.org/en/docs/http/ngx_http_proxy_module.html

# 一、正向代理

不常用

# 二、反向代理

模块：ngx_http_proxy_module
特点：高效、
最大连接数＝worker_processes * worker_connection/4
配置：一般单独配置一个server块
基本设置：

1. proxy_pass URL
   作用：设置被代理服务器的地址
   格式：主机名、IP地址:端口号、URI
   协议：http、https、UNIX-domain socket
   　　例：

```bash
    proxy_pass http://localhost:8000/uri/;
    proxy_pass http://unix:/tmp/backend.socket:/uri/;
```

    如果被代理服务器是一组服务器，可以使用upstream指令配置后端服务器组。

例：

```bash

```

2. proxy_hide_header

   作用：用于设置Nginx在发送HTTP响应是，隐藏一些头域信息

   位置：http、server、location

   语法：proxy_hide_header *field*



3. proxy_pass_header

   作用：默认情况下，Nginx在发送响应报文时，报文头中不包含”Date“,"Server",”X-Accel-...“等来自被代理服务器的头域信息，该指令可以设置这些头域信息一被发送。

   语法：proxy_pass_header *field*

4. proxy_pass_request_body

   作用：配置是否将请求的请求体发送给代理服务器，默认为 on

   语法：proxy_pass_request_body on|off;

5. proxy_pass_request_headers

   作用：配置是否将请求的请求头发送给代理服务器，默认为 on

   语法：proxy_pass_request_header on|off;

6. proxy_set_header

   作用：更改Nginx服务器接收到的客户端请求的头信息，然后将信息的请求头发给被代理服务器

   语法： proxy_set_header *field* *value*;

   默认配置：	

```
        proxy_set_header Host $proxy_host;
        proxy_set_header Connection close;
```

7. proxy_set_body

   作用：更改Nginx服务器接收到的客户端强求的请求体信息，然后将新的请求体发送给被代理服务器

   语法：proxy_set_body value;

8. proxy_connect_timeout

   作用：配置Nginx服务器与后端代理服务器尝试建立连接的超时时间，默认60s。

   语法：proxy_connect_timeout time;

9. proxy_read_timeout

   作用：配置Nginx服务器与后端代理发出read请求后，等待响应的超时时间。默认60s。

   语法：proxy_read_timeout time;

10. proxy_send_timeout

    作用：配置Nginx服务器与后端代理发出write请求后，等待响应的超时时间。默认60s。

    语法：proxy_send_timeout time;


11. proxy_http_verson

    作用：配置Nginx服务器提供代理服务的HTTP协议版本，默认1.0

    语法：proxy_http_verson 1.0|1.1;

12. proxy_method

    作用：设置Nginx服务器请求被代理服务器时使用的请求方法，设置了该指令，客户端请求的方法被忽略

    语法：proxy_method method;

13. proxy_ignore_client_abort

    作用：设置在客户端中断网络请求时，Nginx服务器是否中断被代理服务器的请求,默认off(中断)

    语法：proxy_ignore_client_abort on|off

14. proxy_redirect

    作用： 与proxy_pass配合使用，修改被代理服务器返回的响应头中的Location头域和Refresh头域

    语法： 

    ```bash
        proxy_redirect default;(默认)
        proxy_redirect off;
        proxy_redirect redirect replacement;
    ```