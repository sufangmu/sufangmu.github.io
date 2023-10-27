Dockerfile是用来构建Docker镜像的文件，有一系列执行构成，通过docker build命令构建镜像时，Dockerfile中的指令会由上到下一次执行，每条指令都会创建出一个镜像。这就是镜像分层。指令越多，层就越多，效率就越低。

1. 指令大小写不敏感，按惯例全部大小
2. 指令后至少携带一个参数
3. `#`开头为行注释

## 一、创建自己的hello world镜像

### 1. 编写自己的程序

```bash
# yum install -y gcc glibc-static
$ cat hello.c 
#include<stdio.h>
int main()
{
    printf("hello docker!\n");
    return 0;
}
$ gcc --static -o hello hello.c
$ ./hello 
hello docker!

```

### 2. 编写Dockfile

```dockerfile
FROM scratch
ADD hello /
CMD ["/hello"]
```

### 3. 构建镜像

```bash
$ docker build -t hello-docker .
Sending build context to Docker daemon  865.3kB
Step 1/3 : FROM scratch
 ---> 
Step 2/3 : ADD hello /
 ---> aa3daa94007d
Step 3/3 : CMD ["/hello"]
 ---> Running in 53429e43da09
Removing intermediate container 53429e43da09
 ---> d9ea27607729
Successfully built d9ea27607729
Successfully tagged hello-docker:latest
```

### 4. 运行docker

```bash
$ docker run hello-docker
hello docker!
```

## 二、镜像的构建过程

```dockerfile
FROM centos:7
LABEL auth=Tom
COPY hello.log /var/log/
RUN yum -y install vim
CMD /bin/bash
```

FROM指令是Dockerfile中唯一不可缺少的命令，它为最终构建出的镜像设定了一个基础镜像（Baselmage）。该语句并不会产生新的像层，它是使用指定的像作为基础镜像层的。`docker build`命令解析Dockerfile的FROM指令时，可以立即获悉在哪一个镜像基础上完成下一条指令镜像层构建。Docker Daemon首先从基础镜像的文件系统获取到镜像的ID，然后再根据像ID提取出镜像的json文件内容，以备下一条指令像层构建时使用。

LABEL指令仅修改上一步中提取出的镜像json文件内容，在json中添加LABEL信息后，无需新镜像文件系统。但也会生成一个新的镜像层，只不过该镜像层中只记录了json文件内容的修改变化，没有文件系统的变化。如果该指令就是最后一条指令，那么此时形成的镜像的文件系统其实就是原来FROM后指定镜像的文件系统，只是json文件发生了变化。但由于json文件内容发生了变化，所以产生了新的镜像层。

COPY指令会将宿主机中的指定文件复制到容器中的指定目录，所以会改变该镜像层文件系统大小，并生成新的镜像层文件系统内容。所以json文件中的镜像ID也就发生了变化，产生了新的镜像层。

RUN指令本身并不会改变镜像层文件系统大小，但如果RUN的命令是安装或者其他增加文件内容的命令，所以导致RUN命令最终改变了镜像层文件系统大小，就生成了新的镜像层文件系统内容。所以json文件中的镜像ID也就发生变化，产生了新的镜像层。

对于CMD或ENTRYPOINT指令，其是不会改变镜像层文件系统大小的，因为其不会在`docker build`过程中执行。所以该条指令没有改变镜像层文件系统大小。但对于CMD或ENTRYPOINT指令，由于其将来容器启动后要执行的命令，所以会将该条指令写入到json文件中，会引发json文件的变化。所以json文件中的镜像ID也就发生了变化，产生了新的像层。

## 三、Dockerfile

### 1. scratch镜像

scratch镜像是一个空镜像，是所有镜像的Baselmage（相当于面向对象编程中的Object类）。scratch镜像只能在Dockerfile中被继承不能通过pull命令拉取，不能run，也没有tag，并且它也不会生成镜像中的文件系统层。在Docker中，scratch是一个保留字，用户不能作为自己的镜像名称使用。

### 2. ADD

```dockerfile
# 语法一
ADD <src> <dest>
# 语法二
ADD ["<src>", "<dest>"]
```

该指令将复制当前宿主机中指定文件src到容器中的指定目录dest中。src可以是宿主机中的绝对路径，也可以时相对路径。但相对路径是相对于`docker build`命令所指定的路径的。src指定的文件可以是一个压缩文件，压缩文件复制到容器后会自动解压为目录；src也可以是一个URL，此时的ADD指令相当于wget命令；src最好不要是目录，其会将该目录中所有内容复制到容器的指定目录中。dest是一个绝对路径，其最后面的路径必须要加上斜杠，否则系统会将最后的目录名称当做是文件名。

ADD和COPY还可支持正则和修改文件权限和属主

```dockerfile
ADD --chown=myuser:mygroup --chmod=655 files* /somedir/
```



### 3. COPY

功能与ADD指令相同，只不过src不能是URL。若src为压缩文件，复制到容器后不会自动解压。

### 4. MAINTAINER

```dockerfile
MAINTAINER <name>
```

参数填写的一般是维护者姓名和信箱。不过，该指令官方已不建议使用，而是使用LABEL指令代。

### 5. LABEL

```dockerfile
LABEL <key>=<value> <key>=<value> <key>=<value> ...
```


LABEL指令中可以以键值对的方式包含任意镜像的元数据信息，用于替代MAINTAINER指令，通过`docker inspect`可查到LABEL与MAINTAINER的内容。

### 6. ENV

```dockerfile
# 语法一
ENV <key> <value>
# 语法二
ENV <key>=<value> <key>=<value> ...
```

用于指定环境变量，这些环境变量，后续可以被RUN指令使用，容器运行运行之后，也可以在容器中获取这些环境变量。 

### 7. WORKDIR

```dockerfile
WORKDIR /path/to/workdir
```

容器打开后默认进入的目录，一般在续的RUN、CMD、ENTRYPOINT、ADD等指令中会引用该目录。可以设置多个WORKDIR指令。后续WORKDIR指令若用的是相对路径，则会基于之前WORKDIR指令指定的路径。在使用`docker run`运行容器时，可以通过-w参数盖构建时所设置的工作目录。

### 8. RUN

```dockerfile
# 语法一
RUN <command>
# 语法二
RUN ["executable", "param1", "param2"]
```

语法一的`<command>`就是shell命令。`docker build`执行过程中，会使用shell运行指定的command。

语法二在`docker build`运行过程中，会调用第一个参数"executable"指定的应用程序运行并使用后面第二、三等参数作为应用程序的运行参数。

### 9. CMD

```dockerfile
# 语法一
CMD command param1 param2 (shell form)
# 语法二
CMD ["executable","param1","param2"]
# 语法三
CMD ["param1","param2"]
```

语法一中的command就是shell命令。在容器启动后会立即运行指定的shell命令。

语法二在容器启动后，即在执行完`docker run`后会立即调用执行"executable"指定的可执行文件，并使用后面第二、三等参数作为应用程序的运行参数。

语法三是提供给ENTRYPOINT的默认参数。

Dockerfile中定义的CMD**可以**被执行`docker run`时指定的[COMMAND]替换。执行时不能添加`[ARG]`

### 10. ENTRYPOINT

```dockerfile
# 语法一
ENTRYPOINT command param1 param2
# 语法二
ENTRYPOINT ["executable", "param1", "param2"]
```

语法一中的command就是shell命令。在容器启动后会立即运行指定的shell命令。

语法二在容器启动后，即在执行完`docker run`后会立即调用执行"executable"指定的可执行文件，并使用后面第二、三等参数作为应用程序的运行参数。

Dockerfile中定义的ENTRYPOINT**不能**被执行`docker run`时指定的COMMAND替换。

ENTRYPOINT和CMD使用

```dockerfile
FROM busybox:latest
CMD ["-c", "1", "www.baidu.com"]
ENTRYPOINT ["ping"]
```

```bash
$ docker build  -t mybox:v1  .
Sending build context to Docker daemon  2.048kB
Step 1/3 : FROM busybox:latest
 ---> a416a98b71e2
Step 2/3 : CMD ["-c", "1", "www.baidu.com"]
 ---> Running in a31cb0ed0cb3
Removing intermediate container a31cb0ed0cb3
 ---> 9f87d23edad7
Step 3/3 : ENTRYPOINT ["ping"]
 ---> Running in 423c246fdd0b
Removing intermediate container 423c246fdd0b
 ---> 87fef6276cb3
Successfully built 87fef6276cb3
Successfully tagged mybox:v1
```

使用CMD定义的参数

```bash
$ docker run mybox:v1 
PING www.baidu.com (36.155.132.31): 56 data bytes
64 bytes from 36.155.132.31: seq=0 ttl=127 time=27.617 ms

--- www.baidu.com ping statistics ---
1 packets transmitted, 1 packets received, 0% packet loss
round-trip min/avg/max = 27.617/27.617/27.617 ms
```

执行docker run时指定参数

```bash
# www.taobao.com -c 2 作为参数传递给ENTRYPOINT
$ docker run mybox:v1  www.taobao.com -c 2
PING www.taobao.com (117.176.244.213): 56 data bytes
64 bytes from 117.176.244.213: seq=0 ttl=127 time=20.445 ms
64 bytes from 117.176.244.213: seq=1 ttl=127 time=20.115 ms

--- www.taobao.com ping statistics ---
2 packets transmitted, 2 packets received, 0% packet loss
round-trip min/avg/max = 20.115/20.280/20.445 ms
```

### 11. ARG

```dockerfile
ARG <name>[=<default value>]
```

定义一个变量，该变量将会使用于镜像构建运行时。若要定义多个变量，则需要定义多个ARG指令。

```dockerfile
FROM ubuntu
ARG CONT_IMG_VER
ENV CONT_IMG_VER=${CONT_IMG_VER:-v1.0.0}
RUN echo $CONT_IMG_VER
```

### 12. ONBUILD

```dockerfile
ONBUILD INSTRUCTION
```

该指令用于指定当前镜像的子镜像进行构建时要执行的指令。

```dockerfile
# 父镜像Dockerfile中定义，子镜像Dockerfile中执行
ONBUILD RUN yum install -y wget
```

### 13. VOLUME

```dockerfile
VOLUME ["/data"]
```

该指令可以在容器中创建可以挂载数据卷的挂载点。其参数可以是字符串数组也可以是使用空格隔开的多个纯字符串。例如：`VOLUME ["/var/www“，"/etc/apache”]`或`VOLUME /var/www /etc/apache`

### 14. EXPOSE

```dockerfile
EXPOSE <port> [<port>/<protocol>...]
```

指定容器准各对外暴露的端口号，但该端口号并不会真正的对外暴露。若要真正暴露，则需要在执行docker run命令时使用-p来指定要真正暴露出的端口号。

## 四、构建缓存

### 1. build cache机制

Docker Daemnon通过Dockerfile构建镜像时，当发现即将新构建出的镜像（层）与本地已存在的某镜像（层）重复时，默认会复用已存在镜像（层）而不是重新构建新的像（层），这种机制称为docker build cache机制。该机制不仅加快了镜像的构建过程，同时也大量节省了Docker宿主机的空间。
     docker build cache并不是占用内存的cache，而是一种对磁盘中相应镜像层的检索、复用机制。所以无论是关闭Docker引擎，还是重启Docker宿主机，只要该镜像（层）存在于本地，那么就会复用。

### 2. build cache失效

​      docker build cache在以下几种情况下会失效。

#### 2.1 Dockerfile文件发生变化

当Dockerfile文件中某个指令内容发生变化，那么从发生变化的这个指令层开始的所有镜像层cache全部失效。即从该指令行开始的镜像层将构建出新的镜像层，而不再使用build cache，即使后面的指令并未发生变化。因为镜像关系本质上是一种树状关系，只要其上层节点变了，那么该发生变化节点的所有下层节点也就全部变化了。

#### 2.2 ADD或COPY指令内容变化

Dockerfile文件内容没有变化，但ADD或COPY指令所复制的文件内容发生了变化，同样会使从该指令镜像层开始的后面所有镜像层的build cache失效。

#### 2.3 RUN指令外部依赖变化

与ADD/COPY指令相似。Dockerfile文件内容没有变化，但RUN命令的外部依赖发生了变化，例如安装的软件源发生了变更（版本变化、下载地址变化等），那么从发生变化的这个指令层开始的所有镜像层cache全部失效。

#### 2.4 指定不使用buildcache

有些时候为了确保在镜像构建过程中使用到新的数据，在镜像构建docker build时，通过`--no-cache`选项指定不使用build cache。

#### 2.5 清理dangling build cache

​     dangling build cache，即悬虚buildcache，指的是无法使用的build cache。一般为悬虚镜像dangling image所产生的build cache通过docker system prune命令可以清除。