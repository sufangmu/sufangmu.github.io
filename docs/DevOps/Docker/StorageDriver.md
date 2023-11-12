联合文件系统（Union File System，Unionfs）是一种分层的轻量级文件系统，它可以把多个目录内容联合挂载到同一目录下，从而形成一个单一的文件系统，这种特性可以让使用者像是使用一个目录一样使用联合文件系统。

　　那联合文件系统可以说是 Docker 镜像和容器的基础，因为它可以使 Docker 可以把镜像做成分层的结构，从而使得镜像的每一层可以被共享。例如两个业务镜像都是基于CentOS7镜像构建的，那么这两个业务镜像在物理机上只需要存储一次CentOS7这个基础镜像即可，从而节省大量存储空间。

　　联合文件系统在主机上使用多层目录存储，但最终呈现给用户的则是一个普通单层的文件系统，我们把多层以单一层的方式呈现出来的过程叫作联合挂载。

　　联合文件系统只是一个概念，真正实现联合文件系统才是关键，Docker 中最常用的联合文件系统有三种：AUFS、Devicemapper 和 OverlayFS。

　　AUFS目前并未被合并到 Linux 内核主线，因此只有Ubuntu和Debian等少数操作系统支持AUFS。它在主机上使用多层目录存储。

　　相比对文件系统加锁的机制，Devicemapper工作在块级别，因此可以实现同时修改和读写层中的多个块设备，比AUFS文件系统效率更高。

　　通常情况下， overlay2会比AUFS和Devicemapper性能更好，而且更加稳定，因为overlay2在inode 优化上更加高效。因此在生产环境中推荐使用overlay2作为Docker的文件驱动。

## 一  AUFS 

AUFS是Docker最早使用的文件系统驱动，多用于Ubuntu和 Debian系统中。在Docker早期，OverlayFS和Devicemapper相对不够成熟，AUFS是最早也是最稳定的文件系统驱动 

使用以下命令查看系统是否支持 AUFS：

```
$ grep aufs /proc/filesystems
nodev   aufs
```

执行以上命令后，如果输出结果包含aufs，则代表当前操作系统支持AUFS。AUFS推荐在Ubuntu或Debian操作系统下使用

### 1. AUFS工作原理

AUFS 是联合文件系统，意味着它在主机上使用多层目录存储，每一个目录在AUFS中都叫作分支，而在Docker中则称之为层（layer），但最终呈现给用户的则是一个普通单层的文件系统，我们把多层以单一层的方式呈现出来的过程叫作联合挂载。

![Layers of an Ubuntu container](images/aufs_layers.jpg) 

每一个镜像层和容器层都是/var/lib/docker下的一个子目录，镜像层和容器层都在aufs/diff目录下，每一层的目录名称是镜像或容器的ID值，联合挂载点在aufs/mnt目录下，mnt目录是真正的容器工作目录。

```bash
root@ubuntu:/var/lib/docker/aufs# tree -L 3
.
├── diff
│   └── db42bf0ae2bf105e70c2aef7702b18b9256723cd8fa2cfe88e1d91d23e8225de
│       ├── bin
│       ├── boot
│       ├── dev
│       ├── etc
│       ├── home
│       ├── lib
│       ├── lib64
│       ├── media
│       ├── mnt
│       ├── opt
│       ├── proc
│       ├── root
│       ├── run
│       ├── sbin
│       ├── srv
│       ├── sys
│       ├── tmp
│       ├── usr
│       └── var
├── layers
│   └── db42bf0ae2bf105e70c2aef7702b18b9256723cd8fa2cfe88e1d91d23e8225de
└── mnt
    └── db42bf0ae2bf105e70c2aef7702b18b9256723cd8fa2cfe88e1d91d23e8225de

24 directories, 1 file
```

当一个镜像未生成容器时，AUFS的存储结构如下。

- diff 文件夹：存储镜像内容，每一层都存储在以镜像层ID命名的子文件夹中。
- layers文件夹：存储镜像层关系的元数据，在diif文件夹下的每个镜像层在这里都会有一个文件，文件的内容为该层镜像的父级镜像的ID。
- mnt文件夹：联合挂载点目录，未生成容器时，该目录为空。

```bash
root@ubuntu:/var/lib/docker/aufs# docker run -itd --name ubuntu ubuntu:18.04
c66dfb480910564ee54d668c4a44ecedd92c32bf028f83bf02483d75dd89ad70
root@ubuntu:/var/lib/docker/aufs# tree -L 3
.
├── diff
│   ├── 8daeb1a08fb3e942d0de8a17dd9524d90fd03e407c15e3466138ef300a200262
│   ├── 8daeb1a08fb3e942d0de8a17dd9524d90fd03e407c15e3466138ef300a200262-init
│   │   ├── dev
│   │   └── etc
│   └── db42bf0ae2bf105e70c2aef7702b18b9256723cd8fa2cfe88e1d91d23e8225de
│       ├── bin
│       ├── boot
│       ├── dev
│       ├── etc
│       ├── home
│       ├── lib
│       ├── lib64
│       ├── media
│       ├── mnt
│       ├── opt
│       ├── proc
│       ├── root
│       ├── run
│       ├── sbin
│       ├── srv
│       ├── sys
│       ├── tmp
│       ├── usr
│       └── var
├── layers
│   ├── 8daeb1a08fb3e942d0de8a17dd9524d90fd03e407c15e3466138ef300a200262
│   ├── 8daeb1a08fb3e942d0de8a17dd9524d90fd03e407c15e3466138ef300a200262-init
│   └── db42bf0ae2bf105e70c2aef7702b18b9256723cd8fa2cfe88e1d91d23e8225de
└── mnt
    ├── 8daeb1a08fb3e942d0de8a17dd9524d90fd03e407c15e3466138ef300a200262
    │   ├── bin
    │   ├── boot
    │   ├── dev
    │   ├── etc
    │   ├── home
    │   ├── lib
    │   ├── lib64
    │   ├── media
    │   ├── mnt
    │   ├── opt
    │   ├── proc
    │   ├── root
    │   ├── run
    │   ├── sbin
    │   ├── srv
    │   ├── sys
    │   ├── tmp
    │   ├── usr
    │   └── var
    ├── 8daeb1a08fb3e942d0de8a17dd9524d90fd03e407c15e3466138ef300a200262-init
    └── db42bf0ae2bf105e70c2aef7702b18b9256723cd8fa2cfe88e1d91d23e8225de

49 directories, 3 files
```

当一个镜像已经生成容器时，AUFS 存储结构会发生如下变化。

- diff文件夹：当容器运行时，会在diff目录下生成容器层。
- layers文件夹：增加容器层相关的元数据。
- mnt文件夹：容器的联合挂载点，这和容器中看到的文件内容一致。



```bash
root@ubuntu:~# mount -t aufs
none on /var/lib/docker/aufs/mnt/8daeb1a08fb3e942d0de8a17dd9524d90fd03e407c15e3466138ef300a200262 type aufs (rw,relatime,si=e5aaa9ec4fb54aab,dio,dirperm1)
```



### 2. AUFS读写原理

#### 2.1 读取文件

当我们在容器中读取文件时，可能会有以下场景。

- 文件在容器层中存在时：当文件存在于容器层时，直接从容器层读取。
- 当文件在容器层中不存在时：当容器运行时需要读取某个文件，如果容器层中不存在时，则从镜像层查找该文件，然后读取文件内容。
- 文件既存在于镜像层，又存在于容器层：当我们读取的文件既存在于镜像层，又存在于容器层时，将会从容器层读取该文件。(由于写时复制，所以此时肯定是修改过的文件才会复制到容器层，所以应该读取容器层的文件)

#### 2.2 修改文件或目录

AUFS对文件的修改采用的是写时复制的工作机制，这种工作机制可以最大程度节省存储空间。

具体的文件操作机制如下。

- 第一次修改文件：当我们第一次在容器中修改某个文件时，AUFS会触发写时复制操作，AUFS首先从镜像层复制文件到容器层，然后再执行对应的修改操作。

> AUFS写时复制的操作将会复制整个文件，如果文件过大，将会大大降低文件系统的性能，因此当我们有大量文件需要被修改时，AUFS可能会出现明显的延迟。好在，写时复制操作只在第一次修改文件时触发，对日常使用没有太大影响。

- 删除文件或目录：当文件或目录被删除时，AUFS并不会真正从镜像中删除它，因为镜像层是只读的，AUFS会创建一个特殊的文件或文件夹，这种特殊的文件或文件夹会阻止容器的访问。

### 3. AUFS演示

##### 3.1 准备演示目录和文件

首先我们在 /tmp 目录下创建 aufs 目录：

```bash
ubuntu@ubuntu:~$ cd /tmp
ubuntu@ubuntu:/tmp$ mkdir aufs
```

准备挂载点目录：

```bash
ubuntu@ubuntu:/tmp$ cd aufs
ubuntu@ubuntu:/tmp/aufs$ mkdir mnt
```

接下来准备容器层内容：

```bash
# 创建容器层目录
ubuntu@ubuntu:/tmp/aufs$ mkdir container1
# 在容器层目录下准备一个文件
ubuntu@ubuntu:/tmp/aufs$ echo Hello, Container layer! > container1/container1.txt
```

最后准备镜像层内容：

```bash
# 创建两个镜像层目录
ubuntu@ubuntu:/tmp/aufs$ mkdir image1 image2
# 分别写入数据
ubuntu@ubuntu:/tmp/aufs$ echo Hello, Image layer1! > image1/image1.txt
ubuntu@ubuntu:/tmp/aufs$ echo Hello, Image layer2! > image2/image2.txt
```

准备好的目录和文件结构如下：

```bash
ubuntu@ubuntu:/tmp/aufs$ tree .
.
├── container1
│   └── container1.txt
├── image1
│   └── image1.txt
├── image2
│   └── image2.txt
└── mnt

4 directories, 3 files
```

##### 3.2 创建 AUFS 联合文件系统

使用 mount 命令可以创建 AUFS 类型的文件系统，命令如下：

```bash
sudo mount -t aufs -o dirs=./container1:./image2:./image1  none ./mnt
```

mount命令创建AUFS类型文件系统时，这里要注意，冒号是分隔符，dirs参数第一个目录默认为读写权限，后面的目录均为只读权限，与Docker容器使用AUFS的模式一致。

执行完上述命令后，mnt变成了AUFS的联合挂载目录，我们可以使用mount命令查看一下已经创建的 AUFS 文件系统：

```bash
ubuntu@ubuntu:/tmp/aufs$ mount -t aufs
none on /tmp/aufs/mnt type aufs (rw,relatime,si=e5aaa9ec4cc9d2ab)
```

我们每创建一个 AUFS 文件系统，AUFS 都会为我们生成一个 ID，这个 ID 在 /sys/fs/aufs/ 会创建对应的目录，在这个 ID 的目录下可以查看文件挂载的权限。

```bash
ubuntu@ubuntu:/tmp/aufs$ cat /sys/fs/aufs/si_e5aaa9ec4cc9d2ab/*
/tmp/aufs/container1=rw
/tmp/aufs/image2=ro
/tmp/aufs/image1=ro
64
65
66
/tmp/aufs/container1/.aufs.xino
ubuntu@ubuntu:/tmp/aufs$ ls -l /sys/fs/aufs/si_e5aaa9ec4cc9d2ab
total 0
-r--r--r-- 1 root root 4096 Oct 31 15:12 br0
-r--r--r-- 1 root root 4096 Oct 31 15:12 br1
-r--r--r-- 1 root root 4096 Oct 31 15:12 br2
-r--r--r-- 1 root root 4096 Oct 31 15:12 brid0
-r--r--r-- 1 root root 4096 Oct 31 15:12 brid1
-r--r--r-- 1 root root 4096 Oct 31 15:12 brid2
-r--r--r-- 1 root root 4096 Oct 31 15:12 xi_path
```

可以看到container1目录的权限为rw（代表可读写），image1和image2的权限为ro（代表只读）。

为了验证 mnt 目录下可以看到 container1、image1 和 image2 目录下的所有内容，我们使用 ls 命令查看一下 mnt 目录：

```bash
ubuntu@ubuntu:/tmp/aufs$ ls -l mnt/
total 12
-rw-rw-r-- 1 ubuntu ubuntu 24 Oct 31 15:09 container1.txt
-rw-rw-r-- 1 ubuntu ubuntu 21 Oct 31 15:10 image1.txt
-rw-rw-r-- 1 ubuntu ubuntu 21 Oct 31 15:10 image2.txt
```

可以看到 mnt 目录下已经出现了我们准备的所有镜像层和容器层的文件。

##### 3.3 验证 AUFS 的写时复制

AUFS的写时复制是指在容器中，只有需要修改某个文件时，才会把文件从镜像层复制到容器层，下面我们通过修改联合挂载目录 mnt 下的内容来验证下这个过程。

我们使用以下命令修改 mnt 目录下的 image1.txt 文件：

```bash
/tmp/aufs$ echo Hello, Image layer1 changed! > mnt/image1.txt
```

然后我们查看下 image1/image1.txt 文件内容：

```bash
ubuntu@ubuntu:/tmp/aufs$ echo Hello, Image layer1 changed! > mnt/image1.txt
ubuntu@ubuntu:/tmp/aufs$ cat image1/image1.txt
Hello, Image layer1!
```

发现“镜像层”的 image1.txt 文件并未被修改。
然后我们查看一下"容器层"对应的 image1.txt 文件内容：

```bash
ubuntu@ubuntu:/tmp/aufs$ ls -l container1/
total 8
-rw-rw-r-- 1 ubuntu ubuntu 24 Oct 31 15:09 container1.txt
-rw-rw-r-- 1 ubuntu ubuntu 29 Oct 31 15:13 image1.txt
ubuntu@ubuntu:/tmp/aufs$ cat container1/image1.txt
Hello, Image layer1 changed!
```

发现 AUFS 在“容器层”自动创建了 image1.txt 文件，并且内容为我们刚才写入的内容。我们在第一次修改镜像内某个文件时，AUFS 会复制这个文件到容器层，然后在容器层对该文件进行修改操作，这就是 AUFS 最典型的特性写时复制。

## 二、Overlay2

OverlayFS 的发展分为两个阶段。2014 年，OverlayFS第一个版本被合并到Linux内核3.18版本中，此时的OverlayFS在Docker中被称为overlay文件驱动。由于第一版的overlay文件系统存在很多弊端（例如运行一段时间后Docker 会报 "too many links problem" 的错误）， Linux内核在4.0版本对overlay做了很多必要的改进，此时的OverlayFS被称之为overlay2。

因此，在 Docker 中 OverlayFS 文件驱动被分为了两种，一种是早期的overlay，不推荐在生产环境中使用，另一种是更新和更稳定的overlay2，推荐在生产环境中使用。下面的内容我们主要围绕overlay2展开。

### 1. 使用 overlay2 的先决条件

overlay2虽然很好，但是它的使用是有一定条件限制的。

- 要想使用overlay2，Docker 版本必须高于 17.06.02。
- 如果你的操作系统是RHEL或CentOS，Linux内核版本必须使用`3.10.0-514`或者更高版本，其他 Linux 发行版的内核版本必须高于4.0（例如Ubuntu或Debian），你可以使用`uname -a`查看当前系统的内核版本。
- overlay2最好搭配xfs文件系统使用，并且使用xfs作为底层文件系统时，d_type必须开启，可以使用以下命令验证 d_type 是否开启：

```bash
[root@localhost ~]# xfs_info /var/lib/docker | grep ftype
naming   =version 2              bsize=4096   ascii-ci=0 ftype=1
```

当输出结果中有 ftype=1 时，表示 d_type 已经开启。如果你的输出结果为 ftype=0，则需要重新格式化磁盘目录，命令如下：

```bash
mkfs.xfs -f -n ftype=1 /path/to/disk
```

另外，在生产环境中，推荐挂载`/var/lib/docker`目录到单独的磁盘或者磁盘分区，这样可以避免该目录写满影响主机的文件写入，并且把挂载信息写入到`/etc/fstab`，防止机器重启后挂载信息丢失。

挂载配置中推荐开启pquota，这样可以防止某个容器写文件溢出导致整个容器目录空间被占满。写入到 `/etc/fstab`中的内容如下：

```bash
$UUID /var/lib/docker xfs defaults,pquota 0 0
```

其中UUID为/var/lib/docker所在磁盘或者分区的UUID或者磁盘路径。

> 通常情况下， overlay2会比AUFS和Devicemapper性能更好，而且更加稳定，因为overlay2在 inode 优化上更加高效。因此在生产环境中推荐使用overlay2作为Docker的文件驱动。

### 2. overlay2工作原理

 ![How Docker constructs map to OverlayFS constructs](https://docs.docker.com/storage/storagedriver/images/overlay_constructs.webp) 

#### 2.1 overlay2是如何存储文件的

overlay2和AUFS类似，它将所有目录称之为层（layer），overlay2的目录是镜像和容器分层的基础，而把这些层统一展现到同一的目录下的过程称为联合挂载（union mount）。overlay2把目录的下一层叫作lowerdir，上一层叫作upperdir，联合挂载后的结果叫作merged。

总体来说，overlay2是这样储存文件的：overlay2将镜像层和容器层都放在单独的目录，并且有唯一ID，每一层仅存储发生变化的文件，最终使用联合挂载技术将容器层和镜像层的所有文件统一挂载到容器中，使得容器中看到完整的系统文件。

> overlay2文件系统最多支持128个层数叠加，也就是说你的Dockerfile最多只能写128行，不过这在日常使用中足够了。

下面我们通过拉取一个Ubuntu操作系统的镜像来看下overlay2是如何存放镜像文件的。

首先，我们通过以下命令拉取Ubuntu镜像：

```bash
$ docker --version
Docker version 18.09.9, build 039a7df9ba
$ docker pull ubuntu:16.04
16.04: Pulling from library/ubuntu
58690f9b18fc: Pull complete 
b51569e7c507: Pull complete 
da8ef40b9eca: Pull complete 
fb15d46c38dc: Pull complete 
Digest: sha256:1f1a2d56de1d604801a9671f301190704c25d604a416f59e03c04f5c6ffee0d6
Status: Downloaded newer image for ubuntu:16.04
```

可以看到镜像一共被分为四层拉取，拉取完镜像后我们查看一下overlay2的目录：

```bash
$ ls -l /var/lib/docker/overlay2/
total 0
drwx------. 3 root root     30 Nov 12 21:25 0df618e818f09a3420989495cdb3c5fc9bb5c2623c7f523ecc6e8fee41eec1c1
drwx------. 4 root root     55 Nov 12 21:25 923c3563222a069f138a383448f1fc5ab4ef01026b3aee12bd69f3c4f0ccb950
drwx------. 4 root root     55 Nov 12 21:25 b1acf1f3788eca03ca64ac6fd25643c93f4665f2d509f65162bf84651c8446d9
brw-------. 1 root root 253, 0 Nov 12 21:12 backingFsBlockDev
drwx------. 4 root root     55 Nov 12 21:25 c558a491fd13d3023d1196eb16ce303010e1216ee480b17e27e6115daa268c4f
drwx------. 2 root root    142 Nov 12 21:25 l
```

可以看到overlay2目录下出现了四个镜像层目录和一个l目录，我们首先来查看一下l目录的内容：

```bash
$ ls -l /var/lib/docker/overlay2/l
total 0
lrwxrwxrwx. 1 root root 72 Nov 12 21:25 4WOL22ELV2PGPPXHCK7LKD5TEO -> ../b1acf1f3788eca03ca64ac6fd25643c93f4665f2d509f65162bf84651c8446d9/diff
lrwxrwxrwx. 1 root root 72 Nov 12 21:25 BCREAASVZ4I54L5EVXPIJUEFG3 -> ../0df618e818f09a3420989495cdb3c5fc9bb5c2623c7f523ecc6e8fee41eec1c1/diff
lrwxrwxrwx. 1 root root 72 Nov 12 21:25 EZ4C2MA53DQFJ46GJZUJZASYX6 -> ../923c3563222a069f138a383448f1fc5ab4ef01026b3aee12bd69f3c4f0ccb950/diff
lrwxrwxrwx. 1 root root 72 Nov 12 21:25 HI543YYQQUURRL3MEIUFYTTGO2 -> ../c558a491fd13d3023d1196eb16ce303010e1216ee480b17e27e6115daa268c4f/diff
```

可以看到l目录是一堆软连接，把一些较短的随机串软连到镜像层的diff文件夹下，这样做是为了避免达到mount命令参数的长度限制。

下面我们查看任意一个镜像层下的文件内容：

```bash
$ ls -l /var/lib/docker/overlay2/c558a491fd13d3023d1196eb16ce303010e1216ee480b17e27e6115daa268c4f
total 8
drwxr-xr-x. 3 root root 17 Nov 12 21:25 diff
-rw-r--r--. 1 root root 26 Nov 12 21:25 link
-rw-r--r--. 1 root root 86 Nov 12 21:25 lower
drwx------. 2 root root  6 Nov 12 21:25 work
```

镜像层的link文件内容为该镜像层的短ID，diff文件夹为该镜像层的改动内容，lower文件为该层的所有父层镜像的短ID，多个镜像用冒号分割。

```bash
$ cat /var/lib/docker/overlay2/c558a491fd13d3023d1196eb16ce303010e1216ee480b17e27e6115daa268c4f/link 
HI543YYQQUURRL3MEIUFYTTGO2
$ cat /var/lib/docker/overlay2/c558a491fd13d3023d1196eb16ce303010e1216ee480b17e27e6115daa268c4f/lower 
l/EZ4C2MA53DQFJ46GJZUJZASYX6:l/4WOL22ELV2PGPPXHCK7LKD5TEO:l/BCREAASVZ4I54L5EVXPIJUEFG3
```

我们可以通过`docker image inspect`命令来查看某个镜像的层级关系，例如我想查看刚刚下载的Ubuntu镜像之间的层级关系，可以使用以下命令：

```bash
$ docker image inspect ubuntu:16.04
...省略部分输出
        "GraphDriver": {
            "Data": {
                "LowerDir": "/var/lib/docker/overlay2/923c3563222a069f138a383448f1fc5ab4ef01026b3aee12bd69f3c4f0ccb950/diff:/var/lib/docker/overlay2/b1acf1f3788eca03ca64ac6fd25643c93f4665f2d509f65162bf84651c8446d9/diff:/var/lib/docker/overlay2/0df618e818f09a3420989495cdb3c5fc9bb5c2623c7f523ecc6e8fee41eec1c1/diff",
                "MergedDir": "/var/lib/docker/overlay2/c558a491fd13d3023d1196eb16ce303010e1216ee480b17e27e6115daa268c4f/merged",
                "UpperDir": "/var/lib/docker/overlay2/c558a491fd13d3023d1196eb16ce303010e1216ee480b17e27e6115daa268c4f/diff",
                "WorkDir": "/var/lib/docker/overlay2/c558a491fd13d3023d1196eb16ce303010e1216ee480b17e27e6115daa268c4f/work"
            },
            "Name": "overlay2"
        },
...省略部分输出
```

其中MergedDir代表当前镜像层在overlay2存储下的目录，LowerDir代表当前镜像的父层关系，使用冒号分隔，冒号最后代表该镜像的最底层。

下面我们将镜像运行起来成为容器：

```bash
$ docker run --name=ubuntu -d ubuntu:16.04 sleep 3600
```

我们使用docker inspect命令来查看一下容器的工作目录：

```bash
$ docker inspect ubuntu
...省略部分输出
        "GraphDriver": {
            "Data": {
                "LowerDir": "/var/lib/docker/overlay2/c36895c9b4a4de011c85b69b548d5fddebe3175a3597d489386a6fef71c932b2-init/diff:/var/lib/docker/overlay2/c558a491fd13d3023d1196eb16ce303010e1216ee480b17e27e6115daa268c4f/diff:/var/lib/docker/overlay2/923c3563222a069f138a383448f1fc5ab4ef01026b3aee12bd69f3c4f0ccb950/diff:/var/lib/docker/overlay2/b1acf1f3788eca03ca64ac6fd25643c93f4665f2d509f65162bf84651c8446d9/diff:/var/lib/docker/overlay2/0df618e818f09a3420989495cdb3c5fc9bb5c2623c7f523ecc6e8fee41eec1c1/diff",
                "MergedDir": "/var/lib/docker/overlay2/c36895c9b4a4de011c85b69b548d5fddebe3175a3597d489386a6fef71c932b2/merged",
                "UpperDir": "/var/lib/docker/overlay2/c36895c9b4a4de011c85b69b548d5fddebe3175a3597d489386a6fef71c932b2/diff",
                "WorkDir": "/var/lib/docker/overlay2/c36895c9b4a4de011c85b69b548d5fddebe3175a3597d489386a6fef71c932b2/work"
            },
            "Name": "overlay2"
        },
...省略部分输出
```

MergedDir 的内容即为容器层的工作目录，LowerDir 为容器所依赖的镜像层目录。 然后我们查看下 overlay2 目录下的内容：

```bash
$ ls -l /var/lib/docker/overlay2/
total 0
drwx------. 3 root root     30 Nov 12 21:25 0df618e818f09a3420989495cdb3c5fc9bb5c2623c7f523ecc6e8fee41eec1c1
drwx------. 4 root root     55 Nov 12 21:25 923c3563222a069f138a383448f1fc5ab4ef01026b3aee12bd69f3c4f0ccb950
drwx------. 4 root root     55 Nov 12 21:25 b1acf1f3788eca03ca64ac6fd25643c93f4665f2d509f65162bf84651c8446d9
brw-------. 1 root root 253, 0 Nov 12 21:12 backingFsBlockDev
drwx------. 5 root root     69 Nov 12 21:38 c36895c9b4a4de011c85b69b548d5fddebe3175a3597d489386a6fef71c932b2
drwx------. 4 root root     55 Nov 12 21:38 c36895c9b4a4de011c85b69b548d5fddebe3175a3597d489386a6fef71c932b2-init
drwx------. 4 root root     55 Nov 12 21:25 c558a491fd13d3023d1196eb16ce303010e1216ee480b17e27e6115daa268c4f
drwx------. 2 root root    210 Nov 12 21:38 l
```

运行容器后生成了两个新的层，其中一个为iit层，这是用来存储和容器环境相关内容的只读层，由于这些环境在每台机器上都可能不同，docker的策略是放在init层，每个镜像生成容器时去生成环境相关的配置。我们在`docker commit`时，不提交init层的内容。

```bash
$ tree /var/lib/docker/overlay2/c36895c9b4a4de011c85b69b548d5fddebe3175a3597d489386a6fef71c932b2-init/
/var/lib/docker/overlay2/c36895c9b4a4de011c85b69b548d5fddebe3175a3597d489386a6fef71c932b2-init/
├── diff
│   ├── dev
│   │   └── console
│   └── etc
│       ├── hostname
│       ├── hosts
│       ├── mtab -> /proc/mounts
│       └── resolv.conf
├── link
├── lower
└── work
    └── work

6 directories, 7 files
```



可以看到 overlay2 目录下增加了容器层相关的目录，我们再来查看一下容器层下的内容：

```bash
$ ls -l /var/lib/docker/overlay2/c36895c9b4a4de011c85b69b548d5fddebe3175a3597d489386a6fef71c932b2
total 8
drwxr-xr-x. 2 root root   6 Nov 12 21:38 diff
-rw-r--r--. 1 root root  26 Nov 12 21:38 link
-rw-r--r--. 1 root root 144 Nov 12 21:38 lower
drwxr-xr-x. 1 root root   6 Nov 12 21:38 merged
drwx------. 3 root root  18 Nov 12 21:38 work
```

link和lower文件与镜像层的功能一致，link文件内容为该容器层的短ID，lower文件为该层的所有父层镜像的短ID 。diff目录为容器的读写层，容器内修改的文件都会在diff中出现，merged目录为分层文件联合挂载后的结果，也是容器内的工作目录。

```bash
mount | grep overlay
overlay on /var/lib/docker/overlay2/c36895c9b4a4de011c85b69b548d5fddebe3175a3597d489386a6fef71c932b2/merged type overlay (rw,relatime,seclabel,
lowerdir=/var/lib/docker/overlay2/l/DTOYMUCW6MGKJF32MJ6L427QC5:
/var/lib/docker/overlay2/l/HI543YYQQUURRL3MEIUFYTTGO2:
/var/lib/docker/overlay2/l/EZ4C2MA53DQFJ46GJZUJZASYX6:
/var/lib/docker/overlay2/l/4WOL22ELV2PGPPXHCK7LKD5TEO:
/var/lib/docker/overlay2/l/BCREAASVZ4I54L5EVXPIJUEFG3,
upperdir=/var/lib/docker/overlay2/c36895c9b4a4de011c85b69b548d5fddebe3175a3597d489386a6fef71c932b2/diff,
workdir=/var/lib/docker/overlay2/c36895c9b4a4de011c85b69b548d5fddebe3175a3597d489386a6fef71c932b2/work)
```

总体来说，overlay2是这样储存文件的：overlay2将镜像层和容器层都放在单独的目录，并且有唯一ID，每一层仅存储发生变化的文件，最终使用联合挂载技术将容器层和镜像层的所有文件统一挂载到容器中，使得容器中看到完整的系统文件。

#### 2.2 overlay2如何读取、修改文件？

overlay2的工作过程中对文件的操作分为读取文件和修改文件。

##### 2.2.1 读取文件

容器内进程读取文件分为以下三种情况。

- 文件在容器层中存在：当文件存在于容器层并且不存在于镜像层时，直接从容器层读取文件；
- 当文件在容器层中不存在：当容器中的进程需要读取某个文件时，如果容器层中不存在该文件，则从镜像层查找该文件，然后读取文件内容；
- 文件既存在于镜像层，又存在于容器层：当我们读取的文件既存在于镜像层，又存在于容器层时，将会从容器层读取该文件。(由于写时复制，所以此时肯定是修改过的文件才会复制到容器层，所以应该读取容器层的文件)

##### 2.2.2 修改文件或目录

overlay2对文件的修改采用的是写时复制的工作机制，这种工作机制可以最大程度节省存储空间。具体的文件操作机制如下。

- 第一次修改文件：当我们第一次在容器中修改某个文件时，overlay2会触发写时复制操作，overlay2 首先从镜像层复制文件到容器层，然后在容器层执行对应的文件修改操作。

> overlay2写时复制的操作将会复制整个文件，如果文件过大，将会大大降低文件系统的性能，因此当我们有大量文件需要被修改时，overlay2可能会出现明显的延迟。好在，写时复制操作只在第一次修改文件时触发，对日常使用没有太大影响。

- 删除文件或目录：当文件或目录被删除时，overlay2并不会真正从镜像中删除它，因为镜像层是只读的，overlay2会创建一个特殊的文件或目录，这种特殊的文件或目录会阻止容器的访问。

### 3. Overlay2演示

#### 3.1 准备演示目录和文件

创建对应的目录和文件

```bash
[root@host151 ~]# mkdir -p overlay2/{lower1,lower2,merged,upper,work}
[root@host151 ~]# tree overlay2
overlay2
├── lower1
├── lower2
├── merged
├── upper
└── work

5 directories, 0 files
[root@host151 overlay2]# echo "I'm file1, belong to lower1" > lower1/file1.txt
[root@host151 overlay2]# echo "I'm file2, belong to lower2" > lower2/file2.txt
[root@host151 overlay2]# echo "I'm file3, belong to upper" > upper/file3.txt 
```

现在lower和upper都有各自的文件

```bash
[root@host151 overlay2]# tree
.
├── lower1
│   └── file1.txt
├── lower2
│   └── file2.txt
├── merged
├── upper
│   └── file3.txt
└── work

5 directories, 3 files
```

#### 3.2 创建overlay2文件系统

```bash
[root@host151 overlay2]# mount | grep overlay
[root@host151 overlay2]# mount -t overlay overlay -olowerdir=lower1:lower2,upperdir=upper,workdir=work merged
[root@host151 overlay2]# mount | grep overlay
overlay on /root/overlay2/merged type overlay (rw,relatime,seclabel,lowerdir=lower1:lower2,upperdir=upper,workdir=work)
```

查看当前目录结构

```bash
[root@host151 overlay2]# tree
.
├── lower1
│   └── file1.txt
├── lower2
│   └── file2.txt
├── merged
│   ├── file1.txt
│   ├── file2.txt
│   └── file3.txt
├── upper
│   └── file3.txt
└── work
    └── work
```

#### 3.3 验证写时复制

修改lowerdir中的内容

```bash
[root@host151 overlay2]# echo 'file1 has been changed' > merged/file1.txt
[root@host151 overlay2]# cat merged/*
file1 has been changed
I'm file2, belong to lower2
I'm file3, belong to upper
[root@host151 overlay2]# cat lower1/file1.txt
I'm file1, belong to lower1
[root@host151 overlay2]# tree
.
├── lower1
│   └── file1.txt
├── lower2
│   └── file2.txt
├── merged
│   ├── file1.txt
│   ├── file2.txt
│   └── file3.txt
├── upper
│   ├── file1.txt
│   └── file3.txt
└── work
    └── work

6 directories, 7 files
```

可以看到merged目录中的文件被修改了，但是lower1中的文件内容没有变化，在upper下新生成了一个file1.txt.

删除lower2中的file2.txt

```bash
[root@host151 overlay2]# rm merged/file2.txt 
rm: remove regular file ‘merged/file2.txt’? y
[root@host151 overlay2]# tree
.
├── lower1
│   └── file1.txt
├── lower2
│   └── file2.txt
├── merged
│   ├── file1.txt
│   └── file3.txt
├── upper
│   ├── file1.txt
│   ├── file2.txt
│   └── file3.txt
└── work
    └── work

6 directories, 7 files
[root@host151 overlay2]# cat merged/*
file1 has been changed
I'm file3, belong to upper
[root@host151 overlay2]# ls -l upper/
total 8
-rw-r--r--. 1 root root   23 Nov 12 22:05 file1.txt
c---------. 1 root root 0, 0 Nov 12 22:08 file2.txt
-rw-r--r--. 1 root root   27 Nov 12 21:58 file3.txt
```

在merged目录下已经看不到file2.txt，但在upperdir中，可以看到生成一个特殊的字符设备文件。