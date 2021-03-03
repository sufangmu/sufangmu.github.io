servlet：类库，容器，能让基于servlet开发的程序能在servlet上运行。
JSP：类库，能将java写的程序嵌入html中。
tomcat=JDK+servlet+jsp  java EE的不完整实现，tomcat是一个web container。


## 一、Tomcat 介绍

### 1. Tomcat 来历

　　Sun 早期为了能为早期提出的各种规范做一个演示，对Servlet 提供了一个参考性实现叫 Java Web Server； ASF也创建了一个叫JServ。后来合并叫Tomcat 3.0, Tomcat 4.0，有一个项目名称叫Catalina,后来的Tomcat发型版中默认的Service就叫Catalina。

### 2. JDK 种类

   Oracle：JDK

   Oracle：JRockit

   Open：  OpenJDK

### 3. Java EE Application Servers

#### 1. 商业软件

1. Websphere  IBM
2. Weblogic   Oracle
3. JBoss      Redhat
4. oc4j       Oracle

#### 2. 开源软件

1. Jetty   
2. Tomcat     Apache
3. Resin

## 4. Tomcat的组件

1. 顶级组件：位于整个配置的顶层
2. 容器类组件：可以包含其他组件 
3. 连接器组件：连接用户请求至Tomcat
4. 被嵌套类组件：位于一个容器中，不能包含其他组件

### 4.1 容器类
1. engine：核心容器：Catalina引擎。通过connector接受用户请求
2. host:类似于apache的虚拟主机。支持基于FQDN的虚拟主机
3. context：最内层的容器类组件，一个context代表一个web应用程序，配置context的主要目的是webapp的根目录。还能配置一些额外的属性，如部署方式。
4. service：将连接器关联至engine，一个Service内部只能有一个engine，可以有多个connector。

### 4.2 顶级组件
1. server:一个运行与JVM中的Tomcat实例

### 4.3 嵌套类组件
1. valve：拦截请求，并在将其转至对应的webapp之间进行魔种处理操作。可用于任何容器中
   1. access log valve：
   2. remote address filter vlave：基于IP做访问控制

2. logger：日志记录器，用于记录组件内部的状态信息；可用于除context之外的任何容器中。

3. realm：可用于任何容器类组件中。关联一个用户认证库，实现认证和授权。

	1. UserDatabaseRealm：基于JNDI自定义的用户认证

	2. MemoryRealm:tomcat-users.xml

	3. JDBCRealm：基于JDBC连接至数据库中查找用户

## 二、Tomcat 安装





## 三、Tomcat 目录结构



```
apache-tomcat-8.5.35/
├── bin 　　　　　　　　启动和关闭Tomcat的脚本文件
├── BUILDING.txt
├── conf　　　　　　　　Tomcat的配置文件
├── CONTRIBUTING.md
├── lib　　　　　　　　 存放Tomcat运行需要的库文件
├── LICENSE
├── logs　　　　　　　　存放Tomcat执行时的log文件
├── NOTICE
├── README.md 
├── RELEASE-NOTES
├── RUNNING.txt
├── temp              存放Tomcat执行时的LOG文件
├── webapps           存放Tomcat的应用文件
└── work              存放Tomcat运行时产生的class文件
```





bin目录结构

　　　bin下的脚本主要有两种，一种以.bat结尾的是在Windows环境下运行的，一种以.sh结尾的是在Linux环境下运行的。这里以Linux介绍脚本的用途

```
bin
├── catalina.sh　　　　Tomcat的主要脚本，会执行java命令以调用Tomcat的启动和停止类
├── configtest.sh
├── daemon.sh
├── digest.sh　　　　　生产Tomcat密码的加密摘要值，用于生成加密过的密码
├── setclasspath.sh　　唯一用于系统内部以设定Tomcat的classpath及许多其他环境变量的脚本　　
├── shutdown.sh　　　　运行catalina以停止Tomcat运行
├── startup.sh　　　　　运行catalina以启动Tomcat运行
├── tool-wrapper.sh　　用于digest脚本系统内部，用于封装可用与设置环境变量的脚本，并调用Classpath中设置的完全符合设定的主要方法
└── version.sh　　　　　输出Tomcat的版本信息
```



conf目录结构

　　存放Tomcat相关的配置文件
```
conf/
├── Catalina　　　　　　　用于存储自定义部署Web应用的路径
│   └── localhost
├── catalina.policy
├── catalina.properties
├── context.xml
├── jaspic-providers.xml
├── jaspic-providers.xsd
├── logging.properties
├── server.xml
├── tomcat-users.xml
├── tomcat-users.xsd
└── web.xml
```
## 四、Tomcat生命周期管理

### 1.启动



###　2. 关闭



### 3.进程管理

通过java自带的jps命令查找Tomcat的JVM上是否保留Tomcat进程

```shell
$ jps  | grep Bootstrap
```





## 五、配置文件解释

```xml
<?xml version='1.0' encoding='utf-8'?>
<Server port="8005" shutdown="SHUTDOWN">
  <Listener className="org.apache.catalina.startup.VersionLoggerListener" />
  <Listener className="org.apache.catalina.security.SecurityListener" />
  <Listener className="org.apache.catalina.core.AprLifecycleListener" SSLEngine="on" />
  <Listener className="org.apache.catalina.core.JreMemoryLeakPreventionListener" />
  <Listener className="org.apache.catalina.mbeans.GlobalResourcesLifecycleListener" />
  <Listener className="org.apache.catalina.core.ThreadLocalLeakPreventionListener" />

  <!-- 全局命名资源-->
  <GlobalNamingResources>
    <Resource name="UserDatabase" auth="Container"
              type="org.apache.catalina.UserDatabase"
              description="User database that can be updated and saved"
              factory="org.apache.catalina.users.MemoryUserDatabaseFactory"
              pathname="conf/tomcat-users.xml" />
                <!--加载conf/tomcat-users.xml中的内容-->
  </GlobalNamingResources>

   <Service name="Catalina">
  <!--定义一个HTTP类型的连接器，端口为8080，等待客户端发送请求的超时时间，单位为毫秒-->
     <Connector port="8080" protocol="HTTP/1.1"
               connectionTimeout="20000"
               redirectPort="8443" />
  <!--定义一个AJP类型的连接器-->
     <Connector port="8009" protocol="AJP/1.3" redirectPort="8443" />
  <!--定义当前引擎的名字和默认主机-->
    <Engine name="Catalina" defaultHost="localhost">
  <!--定义对当前容器应用程序的访问认证方式-->
      <Realm className="org.apache.catalina.realm.LockOutRealm">
        <Realm className="org.apache.catalina.realm.UserDatabaseRealm"
               resourceName="UserDatabase"/>
                        <!--通过UserDatabase进行认证 -->
      </Realm>
        <!--定义主机名， 应用程序的目录（e.g:/web）,默认安装目录下的webapps
        uppackWaRs定义是不是子自动解压war包，autoDeploy定义是够自动部署webapps下的应用-->
      <Host name="localhost"  appBase="webapps"
            unpackWARs="true" autoDeploy="true">
        <!--可选：定义别名-->
        <Alisa>www.example.com</Alisa>
		<!--更改访问默认路径-->
		<Context path="" docBase="/web/sample" reloadable="true" />
        <!--   定义一个Valve组件，用来记录tomcat的访问日志，日志存放目录为安装tomcat下的logs,后缀为.txt-->
        <Valve className="org.apache.catalina.valves.AccessLogValve" directory="logs"
               prefix="localhost_access_log" suffix=".txt"
               pattern="%h %l %u %t &quot;%r&quot; %s %b" />
    <Valve className="org.apache.catalina.valves.RemoteAddrValve" allow="192.168.1.*" /> 
        <!--   定义远程地址访问策略，仅允许192.168.1.*网段访问该主机，其他的将被拒绝访问  -->
      </Host>
      <Host name='www.gaoyuanzhi.xyz' appBase='/www/webapps'
            unpackWARs="true" autoDeploy="true">
          <Valve className="org.apache.catalina.valves.AccessLogValve" directory="logs"
               prefix="gaoyuanzhi.xyz_access_log" suffix=".txt"
               pattern="%h %l %u %t &quot;%r&quot; %s %b" />
      </Host>
    </Engine>
  </Service>
</Server>
```






Tomcat优化
内存空间优化：

-x
-XX 

jinfo




-Xmx ：堆内存空间的最大值
-Xms  堆内存初始化大小


定义在堆内部如何使用内存空间
-XX:NewSize: 新生代初始化大小
-XX MaxNewSize :新生代空间最大值
老年代初始化空间=-Xms --XX:NewSize
-XX:SurvivorRatio：年轻代中Eden区与Survivor区的大小比值

-XX PermSize: 持久代初始化值
-XX MaxPermSize: 持久代最大值


监控：
jstat gc <pid>  <interval>
jstat -gc 1576 1000

jconsole
visualvm
jprofiler
janalyzer

## 六、tomcat APR模式配置

### 1. 环境

操作系统：Ubutnu 14

```bash
ubuntu@ubuntu:~$ uname -a
Linux ubuntu 4.4.0-31-generic #50~14.04.1-Ubuntu SMP Wed Jul 13 01:07:32 UTC 2016 x86_64 x86_64 x86_64 GNU/Linux
```

JDK 1.8

```bash
ubuntu@ubuntu:~$ java -version
java version "1.8.0_141"
Java(TM) SE Runtime Environment (build 1.8.0_141-b15)
Java HotSpot(TM) 64-Bit Server VM (build 25.141-b15, mixed mode)
ubuntu@ubuntu:~$ whereis java
java: /usr/local/java /usr/share/java
```


Tomcat 8.5.35

```bash
root@ubuntu:~# /var/www/demo/bin/version.sh
Using CATALINA_BASE:   /var/www/demo
Using CATALINA_HOME:   /var/www/demo
Using CATALINA_TMPDIR: /var/www/demo/temp
Using JRE_HOME:        /usr/local/java/jre
Using CLASSPATH:       /var/www/demo/bin/bootstrap.jar:/var/www/demo/bin/tomcat-juli.jar
Server version: Apache Tomcat/8.5.35
Server built:   Nov 3 2018 17:39:20 UTC
Server number:  8.5.35.0
OS Name:        Linux
OS Version:     4.4.0-31-generic
Architecture:   amd64
JVM Version:    1.8.0_141-b15
JVM Vendor:     Oracle Corporation
```


### 2. 安装

####　1. 安装编译需要的环境

```bash
$ sudo apt install gcc make
```

#### 2. 安装 native　编译所需要的依赖包

```bash
# apache apr
$ sudo apt install libapr1-dev
# openssl,自带的 openssl版本较低，需要编译安装
$ wget https://www.openssl.org/source/openssl-1.1.1a.tar.gz
$ sudo mkdir /usr/local/openssl
$ tar zxf openssl-1.1.1a.tar.gz
$ ./config --prefix=/usr/local/openssl
$ make
$ sudo make install
```

#### 3.下载安装native

```bash
$ wget http://mirrors.hust.edu.cn/apache/tomcat/tomcat-connectors/native/1.2.19/source/tomcat-native-1.2.19-src.tar.gz
$ cd tomcat-native-1.2.19-src/native/
$ ./configure  --with-ssl=/usr/local/openssl
$ make
$ sudo make install
```


### 3. 配置Tomcat

```bash
root@ubuntu:/var/www/demo# cat bin/setenv.sh 
export JAVA_OPTS="$JAVA_OPTS -Djava.library.path=/usr/local/apr/lib"
```

```bash
    <Connector port="8080" 
               protocol="org.apache.coyote.http11.Http11AprProtocol"
               connectionTimeout="20000"
               redirectPort="8443" />
    ...
    <!--<Connector port="8009" protocol="AJP/1.3" redirectPort="8443" /> -->

```

### 4. 启动Tomcat

```bash
root@ubuntu:/var/www/demo# bin/catalina.sh run
.....
28-Jan-2019 15:55:09.140 INFO [localhost-startStop-1] org.apache.catalina.startup.HostConfig.deployDirectory Deployment of web application directory [/var/www/demo/webapps/docs] has finished in [13] ms
28-Jan-2019 15:55:09.153 INFO [main] org.apache.coyote.AbstractProtocol.start Starting ProtocolHandler ["http-apr-8080"]
28-Jan-2019 15:55:09.172 INFO [main] org.apache.catalina.startup.Catalina.start Server startup in 803 ms
```

### 5. 编译方式安装apr

#### 1. 安装编译需要的环境

```bash
$ sudo apt install -y gcc make  libtool  libexpat1-dev
```

#### 2. 安装Apache Portable Runtime (apr)

官方地址：https://apr.apache.org/compiling_unix.html

##### 1. 编译安装apr

```bash
wget http://mirrors.shu.edu.cn/apache//apr/apr-1.6.5.tar.gz
tar zxf apr-1.6.5.tar.gz
cd apr-1.6.5/
./configure --prefix=/usr/local/apache-apr
make
sudo make install
```

##### 2. 编译安装apr-iconv

```bash
wget http://mirrors.shu.edu.cn/apache//apr/apr-iconv-1.2.2.tar.gz
tar zxf apr-iconv-1.2.2.tar.gz
cd apr-iconv-1.2.2/
./configure --prefix=/usr/local/apache-apr-iconv --with-apr=/usr/local/apache-apr
make
sudo make install
```

##### 3. 编译安装apr-util

```bash
wget http://mirrors.shu.edu.cn/apache//apr/apr-util-1.6.1.tar.gz
ubuntu@ubuntu:~/apr-util-1.6.1$ ./configure --prefix=/usr/local/apache-apr-util --with-apr=/usr/local/apache-apr --with-apr-iconv=/usr/local/apache-apr-iconv/bin/apriconv
tar zxf apr-util-1.6.1.tar.gz
cd apr-util-1.6.1/
make
sudo make install
```

#### 3. 编译安装openssl

```bash
wget https://www.openssl.org/source/openssl-1.1.1a.tar.gz
$ sudo mkdir /usr/local/openssl
$ tar zxf openssl-1.1.1a.tar.gz
$ ./config --prefix=/usr/local/openssl
cd openssl-1.1.1a
$ make
$ sudo make install
```

#### 4. 编译安装native

```bash
wget http://mirrors.hust.edu.cn/apache/tomcat/tomcat-connectors/native/1.2.19/source/tomcat-native-1.2.19-src.tar.gz
tar zxf tomcat-native-1.2.19-src.tar.gz
$ cd tomcat-native-1.2.19-src/native/
$ ./configure --prefix=/usr/local/native --with-ssl=/usr/local/openssl --with-apr=/usr/local/apache-apr/bin/apr-1-config
$ make
$ sudo make install
```