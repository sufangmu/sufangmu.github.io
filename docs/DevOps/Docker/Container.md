## 常用命令

### 1. 容器运行

#### 1.1 交换方式运行

```bash
$ docker run -it ubuntu /bin/bash
root@a55772d7ac7f:/#
# -t 终端
# -i 交互方式
```

#### 1.2 交换方式运行并指定暴露端口

```bash
$ docker run -it -p 8080:8080 tomcat:8.5.49
$ docker ps
CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS              PORTS                    NAMES
6b6fba4ce3d7        tomcat:8.5.49       "catalina.sh run"   3 minutes ago       Up 3 minutes        0.0.0.0:8080->8080/tcp   flamboyant_greider
```

#### 1.3 后台运行

```bash
$ docker run -d -p 8080:8080 tomcat:8.5.49
3844bd1a8e04f4a528317f45090c4105d3636112f0b9860b3bb4bdd7229da814
$ docker run -itd ubuntu
41614d76e2d0fbb86af50b52c7e7c0ea5b62929154e88f954c5e42b13e41b9b7
```

### 2. 容器退出

1. `exit`
2. `CTRL`+`p`+`q`

### 3. 进入容器

#### 3.1 exec方式

进入时创建一个新终端，`exit`退出后容器不退出

```bash
$ docker exec -it 3846540d5ac1 /bin/bash
root@3846540d5ac1:/# 
```

执行容器中的命令

```bash
$ docker exec -it 3846540d5ac1 hostname
3846540d5ac1
```

>注意：同时使用docker attach命令同时在多个终端运行时，所有的终端窗口将同步显示相同内容，当某个命令行窗口的命令阻塞时，其它命令行窗口同样也无法操作

#### 3.2 attach方式

进入容器正在执行的终端，`exit`后容器也退出。退出时使用`CTRL`+`p`+`q`可以使容器不退出。

```bash
docker attach 3846540d5ac1
```

### 4. 容器的启停

#### 4.1 启动

```bash
$ docker start [容器]
$ docker restart [容器]
```

#### 4.2 停止

```bash
$ docker stop [容器]
$ docker kill [容器]
```

### 5. docker top

```bash
$ docker top 3196d88f30fa
# 可以配置ps命令的参数使用
$ docker top 3196d88f30fa -o pid,comm
PID                 COMMAND
17179               java
```

### 6. docker logs

```bash
# 和tail -f相同
$ docker logs -f 3196d88f30fa
# 输出后10行日志
$ docker logs --tail 10 3196d88f30fa
# 按时间筛选
docker logs --since="2023-10-16T20:50:39Z"  --until="2023-10-16T20:50:40Z" 3196d88f30fa
```

### 7. docker cp

```bash
$ docker cp hello.txt myubuntu:/root/
```

### 8. docker rm

删除容器

```bash
docker rm [容器]
docker rm -f [容器]
```

### 9. docker commit

将容器生成为一个镜像

```bash
docker commit c3f279d17e0a  svendowideit/testimage:version3
```

### 10. 容器的导入导出

#### 10.1 导出

```bash
docker export -o myubuntu.tar myubunt
```

#### 10.2 导入

将导出的容器导入为镜像

```bash
docker import myubuntu.tar myubuntu:v1
```

### 11. 容器暂停与恢复

pause暂停容器对外提供服务

```bash
$ docker pause tomcat
```

恢复

```bash
$ docker unpause tomcat
```

### 12 创建容器

只创建，不运行

```bash
$ docker create  -p 8080:8080 --name tomcat tomcat:8.5.49
$ docker ps -a
CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS              PORTS               NAMES
f974989ed804        tomcat:8.5.49       "catalina.sh run"   5 seconds ago       Created                                 tomcat
```



