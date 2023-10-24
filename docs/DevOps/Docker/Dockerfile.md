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

## 二、Dockerfile

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

### 10 ENTRYPOINT

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