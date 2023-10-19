

## 一、镜像结构

镜像是分层的结构，每个层都是只读的，所有对分层的修改都是以新分层的形式出现，并不会破坏原分层内容。分层可以实现不同镜像间的资源共享，即不同镜像对相同下层镜像的复用。对于docker pull命令，在其拉取之前会先获取到其要拉取镜像的所有ImageID，然后在本地查找是否存在这些分层，如果存在，则不再拉取，而是共享本地的该分层，大大节省了节点的存储空间和网络带宽，提升了拉取效率。

```bash
$ docker pull redis
Using default tag: latest
latest: Pulling from library/redis
a378f10b3218: Pull complete 
3c75410c1f8b: Pull complete 
667874757cc1: Pull complete 
7150b93d249d: Pull complete 
Digest: sha256:4ca2a277f1dc3ddd0da33a258096de9a1cf5b9d9bd96b27ee78763ee2248c28c
Status: Downloaded newer image for redis:latest
```

### 1. 镜像层的构成

每个镜像层由两部分构成，镜像文件系统与镜像json文件。这两部分具有相同的ImageID，镜像文件系统是对镜像战友的磁盘空间进行管理的文件系统，拥有该进行所有镜像层的数据内容。而镜像json文件时用于描述镜像的相关属性的集合，通过`docker inspect [镜像名]`查看

### 2. 镜像文件系统构成

一个docker镜像的文件系统由多个只读镜像层构成，每层都完成了特定的功能。这些只读镜像层根据其位置与功能不同可以分为基础镜像层和扩展镜像层。

#### 2.1 基础镜像层

所有镜像的最下层都具有一个可以看得到的基础镜像层Base Image，基础镜像层的文件系统称为根文件系统rootfs。而rootfs则是建立在Linux系统中看不到的引导文件系统bootfs之上。

#### 2.2 扩展进行层

在基础镜像层之上的镜像层称为扩展镜像层，在Dockerfile中，每条指令都是用于完成某项特定功能的，每条指令都会生成一个扩展镜像层。

#### 2.3 容器层

一旦镜像运行起来就形成了容器，而容器就是一个运行中的Linux系统，其也具有文件系统。容器的文件系统就是在Docker镜像最外层之上加了一个可读写的容器层，对文件的任何修改都只存在于容器层，因此任何对容器的操作都不会影响到镜像本身。

容器层如果要修改某个文件，系统会从容器层开始向下一层层的查找该文件，直到找到位置。任何对于文件的操作都会记录在容器层，例如要修改某文件，容器层会首先把在镜像层找到的文件copy到容器层，然后再进行修改。

可以看出容器就是一个叠加后的文件系统，而这个容器层称为Union File System。

### 3. 镜像摘要

摘要是镜像内容的一个Hash值，只要镜像内容发生变更，其摘要就一定会发生变化。Docker默认采用SHA256算法，其Hash值时一个长度256位的二进制，Docker使用16进制表示，即长度为64的字符串。

摘要的主要作用是用来区分相同`<repository>:<tag>`的不同镜像。

在push或pull镜像时，都会对镜像进行压缩以较少网络带宽和传输时长，但压缩会改变镜像内容，导致经过网络传输后镜像内容与其digest不符。为了避免该问题，docker又为镜像配置了Distribution Hash，在镜像被压缩后立即计算分发散列值，然后使该值随压缩过的镜像一同进行发送，在接收方收到后，立即计算压缩镜像的分发散列值，再与携带的分发散列值进行对比，如果相同说明传输没有问题。

## 二、常用命令

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

#### 2.9 格式化显示

```bash
$ docker images --format "table {{.ID}}: {{.Repository}}: {{.Tag}}: {{.Digest}}: {{.CreatedSince}}: {{.CreatedAt}}: {{.Size}}"
IMAGE ID: REPOSITORY: TAG: DIGEST: CREATED: CREATED AT: SIZE
bc649bab30d1: nginx: latest: sha256:b4af4f8b6470febf45dc10f564551af682a802eda1743055a7dfc8332dffa595: 4 days ago: 2023-10-12 11:14:44 +0800 CST: 187MB
a416a98b71e2: busybox: latest: sha256:3fbc632167424a6d997e74f52b878d7cc478225cffac6bc977eedfe51c7f4e79: 2 months ago: 2023-07-19 07:19:33 +0800 CST: 4.26MB
9c7a54a9a43c: hello-world: latest: sha256:88ec0acaa3ec199d3b7eaf73588f4518c25f9d34f58ce9a0df68429c5af48e8d: 5 months ago: 2023-05-05 01:37:03 +0800 CST: 13.3kB

# table 是标题
```

>更多用法：https://docs.docker.com/engine/reference/commandline/images/

### 3. docker search

#### 3.1 查找镜像

```bash
$ docker search busybox
NAME                                DESCRIPTION                                     STARS               OFFICIAL            AUTOMATED
busybox                             Busybox base image.                             3115                [OK]                
radial/busyboxplus                  Full-chain, Internet enabled, busybox made f…   54                                      [OK]
...
```

>AUTOMATED表示Docker Hub连接了一个包含Dockerfile文件的GitHub仓库或者BitBucket仓库，Docker Hub会自动构建镜像，通过这种方式构建出来的镜像会被标记为Automated Build，也称之为受信构建（Trusted Build），这种构建方式构建出来的镜像，其他人在使用时可以自由的查看Dockerfile内容，知道该镜像是怎么来的，同时，由于构建过程是自动的，所以能够确保仓库中的镜像都是最新的。

#### 3.2 按条件筛选

```bash
$ docker search -f stars=3 -f is-automated=false -f is-official=true busybox --limit 1
NAME                DESCRIPTION           STARS               OFFICIAL            AUTOMATED
busybox             Busybox base image.   3115                [OK]                
```

#### 3.3 格式化显示

```bash
docker search --format "table {{.Name}}\t{{.StarCount}}\t{{.IsAutomated}}\t{{.IsOfficial}}\t{{.Description}}" nginx
```

### 4. docker rmi

#### 4.1 删除镜像时指定镜像名

```bash
$ docker rmi hello-world:latest
```

4.2 删除镜像时指定镜像ID

```bash
$ docker rmi a416a98b71e2
```

4.3 强制删除

```bash
$ docker rmi -f bc649bab30d1
```

### 5. 镜像导入导出

#### 5.1 导出

```bash
$ docker save -o busybox.tar busybox:latest
# 或
$ docker save busybox:latest > busybox.tar
```

#### 5.2 导入

```bash
$ docker load -i busybox.tar 
3d24ee258efc: Loading layer [==================================================>]  4.492MB/4.492MB
Loaded image: busybox:latest
# 或
$ docker load < busybox.tar 
```

