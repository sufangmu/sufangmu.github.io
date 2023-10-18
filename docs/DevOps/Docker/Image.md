## 常用命令

### 1. docker pull

#### 1.1 拉取最新镜像

```bash
$ docker pull busybox

Using default tag: latest
latest: Pulling from library/busybox
3f4d90098f5b: Pull complete 
Digest: sha256:3fbc632167424a6d997e74f52b878d7cc478225cffac6bc977eedfe51c7f4e79
Status: Downloaded newer image for busybox:latest

```

#### 1.2 拉取指定tag的镜像

```bash
docker pull ubuntu:22.04
```

#### 1.3 拉取指定Digest的镜像

```bash
docker pull busybox@sha256:3fbc632167424a6d997e74f52b878d7cc478225cffac6bc977eedfe51c7f4e79
```

> 更多用法：https://docs.docker.com/engine/reference/commandline/pull/

### 2. docker images

#### 2.1 列出本地所有镜像

```bash
$ docker images
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
busybox             latest              a416a98b71e2        2 months ago        4.26MB
hello-world         latest              9c7a54a9a43c        5 months ago        13.3kB
```

#### 2.2 显示镜像的degests

```bash
$ docker images --digests
REPOSITORY          TAG                 DIGEST                                                                    IMAGE ID            CREATED             SIZE
busybox             latest              sha256:3fbc632167424a6d997e74f52b878d7cc478225cffac6bc977eedfe51c7f4e79   a416a98b71e2        2 months ago        4.26MB
hello-world         latest              sha256:88ec0acaa3ec199d3b7eaf73588f4518c25f9d34f58ce9a0df68429c5af48e8d   9c7a54a9a43c        5 months ago        13.3kB
```

#### 2.3 显示完整镜像ID

```bash
$ docker images --no-trunc
REPOSITORY          TAG                 IMAGE ID                                                                  CREATED             SIZE
busybox             latest              sha256:a416a98b71e224a31ee99cff8e16063554498227d2b696152a9c3e0aa65e5824   2 months ago        4.26MB
hello-world         latest              sha256:9c7a54a9a43cca047013b82af109fe963fde787f63f9e016fdc3384500c2823d   5 months ago        13.3kB
```

#### 2.4 只显示镜像ID

```bash
$ docker images -q
a416a98b71e2
9c7a54a9a43c
```

#### 2.5 列出指定名称和tag的镜像

```bash
$ docker images busybox:latest
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
busybox             latest              a416a98b71e2        2 months ago        4.26MB
```

#### 2.6 列出所有悬虚（没有tag）镜像

```bash
docker images --filter "dangling=true"
```

#### 2.7 按时间过滤镜像

```bash
$ docker images
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
nginx               latest              bc649bab30d1        4 days ago          187MB
busybox             latest              a416a98b71e2        2 months ago        4.26MB
hello-world         latest              9c7a54a9a43c        5 months ago        13.3kB
$ docker images -f before=busybox
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
hello-world         latest              9c7a54a9a43c        5 months ago        13.3kB
$ docker images -f since=busybox
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
nginx               latest              bc649bab30d1        4 days ago          187MB

```

#### 2.8 正则匹配查找镜像

```bash
$ docker images -f reference=*x:*
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
nginx               latest              bc649bab30d1        4 days ago          187MB
busybox             latest              a416a98b71e2        2 months ago        4.26MB
```



>更多用法：https://docs.docker.com/engine/reference/commandline/images/

