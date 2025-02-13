在容器层的UnionFs（联合文件系统）中对文件/目录的任何修改，无论是手工修改还是容器在运行过程中的修改，在该容器丢失或被除后这些修改将全部丢失。即这些修改是无法保存下来的。若要保存下来这些修改，通常有两种方式：

1. 定制镜像持久化：将这个修改过的容器生成一个新的镜像，让这些修改变为只读的镜像。
2. 数据卷持久化：将这些修改通过数据卷同步到宿主机。

 Docker提供了三种实时同步（宿主机与容器FS间数据的同步）方式：

1. 数据卷
2. bind mounts（绑定挂载）
3. tmpfs（临时文件系统）
![Volumes on the Docker host](images/types-of-mounts-volume.png) 

## 1. 数据卷概述

### 1.1 数据卷简介

数据卷是宿主机中的一个特殊的文件/目录，这个文件/目录与容器中的另一个文件/目录进行了直接关联，在任何一端对文件/目录的写操作，在另一端都会同时发生相应变化。在宿主中的这个文件/目录就称为数据卷而容器中的这个关联文件/目录则称为该数据卷在该容器中的挂载点。
数据卷的设计目的就是为了实现数据持久化，其完全独立于容器的生命周期，属于宿主机文件系统，但不属于UnionFs。因此，容器被除时，不会除其挂的数据卷。

### 1.2 数据卷的特性

数据卷具有如下明显特性：

1. 数据卷在容器启动时初始化，如果容器启动后容器本身已经包含了数据，那么，这些数据会在容器启动后直接出现在数据卷中，反之亦然
2. 可以对数据卷或挂载点中的内容直接修改，修改后对方立即可看到
3. 数据卷会一直存在，即使挂载数据卷的容器已经被删除
4. 数据卷可以在容器之间共享和重用

## 2. 数据卷的创建

数据卷是在使用docker run启动容器时指定的，其语法格式为：

### 1. 读写权限

```dockerfile
docker run -it -v /宿主机目录绝对路径:/容器内目录绝对路径镜像
```

无论是宿主机中的数据卷还是容器中的挂载点，如果指定的目录不存在，那么docker引都会自动创建。即使是多级目录不存在。

### 2. 只读权限

只读数据卷，指的是容器对挂载点的操作权限是只读的。宿主机对数据卷的操作权限始终是读写的。
有些情况下，为了防止容器在运行过程中对文件产生修改，就需要创建只读数据卷。

```dockerfile
docker run -it -v /宿主机目录绝对路径:/容器内目录绝对路径:ro 镜像
```

### 3. 数据卷共享

当一个容器与另一个容器使用相同的数据卷时，就称这两个容器实现了“数据卷共享”。

数据卷容器是实现数据卷共享的一种非常有效的方案。
当一个容器C启动运行时创建并挂载了数据卷，若其它容器也需要共享该容器C挂载的数据卷，这些容器只需在`docker run`动时通过`--volumes-from [容器C]`选项即可实现数据卷共享。此时容器C就称为数据卷容器。

### 4. Dockerfile创建持久化数据卷

创建Dockerfile

```dockerfile
FROM busybox
VOLUME /opt/xxx
CMD /bin/sh
```

创建镜像

```bash
docker build -t vol:v1 .
```

启动容器，检查路径是否创建

```bash
$ docker run --name myvol -it vol:v1 
/ # 
/ # ls /opt/
xxx
/ # exit
```

查看数据卷的位置

```bash
$ docker inspect myval
...
        "Mounts": [
            {
                "Type": "volume",
                "Name": "9a89d604cfc3743f1d9219bb575e1cd76f45465b6c409038759d7eb5403d7082",
                "Source": "/var/lib/docker/volumes/9a89d604cfc3743f1d9219bb575e1cd76f45465b6c409038759d7eb5403d7082/_data",
                "Destination": "/opt/xxx",
                "Driver": "local",
                "Mode": "",
                "RW": true,
                "Propagation": ""
            }
        ],
...
```



