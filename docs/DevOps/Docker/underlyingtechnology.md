## 一、Namespace

Namespace是Linux内核的一项功能，该功能对内核资源进行分区，以使一组进程看到一组资源，而另一组进程看到另一组资源。Namespace的工作方式通过为一组资源和进程设置相同的Namespace而起作用，但是这些Namespace引用了不同的资源。资源可能存在于多个Namespace中。这些资源可以是进程ID、主机名、用户ID、文件名、与网络访问相关的名称和进程间通信。

 Linux 5.6 内核中提供了 8 种类型的 Namespace：

| Namespace                          | 作用                                 | 内核版本 |
| ---------------------------------- | ------------------------------------ | -------- |
| Mount（mnt）                       | 隔离挂载点                           | 2.4.19   |
| Process ID（pid）                  | 隔离进程ID                           | 2.6.24   |
| Network(net）                      | 隔离网络设备，端口号等               | 2.6.29   |
| Interprocess Communication （ipc） | 隔离SystemVIPC和POSIX message queues | 2.6.19   |
| UTS Namespace(uts）                | 隔离主机名和域名                     | 2.6.19   |
| User Namespace(user）              | 隔离用户和用户组                     | 3.8      |
| Control group (cgroup) Namespace   | 隔离Cgroups根目录                    | 4.6      |
| Time Namespace                     | 隔离系统时间                         | 5.6      |

 虽然 Linux 内核提供了8种 Namespace，但是最新版本的 Docker 只使用了其中的前6 种，分别为Mount Namespace、PID Namespace、Net Namespace、IPC Namespace、UTS Namespace、User Namespace。 

从3.8版本的内核开始，用户可以在/proc/[pid]/ns目录下看到指向不同namespace的文件，效果如下图，形如[4026531839]者即为namespace号。

```bash
[root@localhost ~]# ls -l /proc/1061/ns
total 0
lrwxrwxrwx. 1 root root 0 Oct 29 23:12 ipc -> ipc:[4026531839]
lrwxrwxrwx. 1 root root 0 Oct 29 23:12 mnt -> mnt:[4026531840]
lrwxrwxrwx. 1 root root 0 Oct 29 23:12 net -> net:[4026531956]
lrwxrwxrwx. 1 root root 0 Oct 29 23:12 pid -> pid:[4026531836]
lrwxrwxrwx. 1 root root 0 Oct 29 23:12 user -> user:[4026531837]
lrwxrwxrwx. 1 root root 0 Oct 29 23:12 uts -> uts:[4026531838]
```

如果两个进程指向的namespace编号相同，就说明它们在同一个namespace下，否则便在不同namespace里面。 

### 1. Mount Namespace

Mount Namespace 是 Linux 内核实现的第一个 Namespace，从内核的 2.4.19 版本开始加入。它可以用来隔离不同的进程或进程组看到的挂载点。通俗地说，就是可以实现在不同的进程中看到不同的挂载目录。使用 Mount Namespace 可以实现容器内只能看到自己的挂载信息，在容器内的挂载操作不会影响主机的挂载目录。

Mount Namespace演示

> unshare 是 util-linux 工具包中的一个工具，CentOS 7 系统默认已经集成了该工具，使用 unshare 命令可以实现创建并访问不同类型的 Namespace。

首先我们使用以下命令创建一个 bash 进程并且新建一个 Mount Namespace：

```bash
unshare --mount --fork /bin/bash
```

执行完上述命令后，这时我们已经在主机上创建了一个新的 Mount Namespace，并且当前命令行窗口加入了新创建的 Mount Namespace。

在独立的 Mount Namespace 内创建挂载目录是不影响主机的挂载目录的。

```bash
[root@localhost ~]# mkdir /tmp/tmpfs
[root@localhost ~]# # 使用 mount 命令挂载一个 tmpfs 类型的目录
[root@localhost ~]# mount -t tmpfs -o size=20m tmpfs /tmp/tmpfs
[root@localhost ~]# df -h
Filesystem               Size  Used Avail Use% Mounted on
/dev/mapper/centos-root   37G  2.5G   35G   7% /
devtmpfs                 898M     0  898M   0% /dev
tmpfs                    910M     0  910M   0% /dev/shm
tmpfs                    910M     0  910M   0% /sys/fs/cgroup
tmpfs                    910M  9.6M  901M   2% /run
tmpfs                    182M     0  182M   0% /run/user/0
/dev/sda1               1014M  151M  864M  15% /boot
tmpfs                     20M     0   20M   0% /tmp/tmpfs
```

可以看到 /tmp/tmpfs 目录已经被正确挂载。

新打开一个命令行窗口，同样执行 df -h命令查看主机的挂载信息：

```text
[root@localhost ~]# df -h
Filesystem               Size  Used Avail Use% Mounted on
devtmpfs                 898M     0  898M   0% /dev
tmpfs                    910M     0  910M   0% /dev/shm
tmpfs                    910M  9.6M  901M   2% /run
tmpfs                    910M     0  910M   0% /sys/fs/cgroup
/dev/mapper/centos-root   37G  2.5G   35G   7% /
/dev/sda1               1014M  151M  864M  15% /boot
tmpfs                    182M     0  182M   0% /run/user/0
```

通过上面输出可以看到主机上并没有挂载 /tmp/tmpfs，可见我们独立的 Mount Namespace 中执行 mount 操作并不会影响主机。

我们继续在当前命令行窗口查看一下当前进程的 Namespace 信息，命令如下：

```text
[root@localhost ~]# ls -l /proc/$$/ns/
total 0
lrwxrwxrwx. 1 root root 0 Oct 29 23:21 ipc -> ipc:[4026531839]
lrwxrwxrwx. 1 root root 0 Oct 29 23:21 mnt -> mnt:[4026532494]
lrwxrwxrwx. 1 root root 0 Oct 29 23:21 net -> net:[4026531956]
lrwxrwxrwx. 1 root root 0 Oct 29 23:21 pid -> pid:[4026531836]
lrwxrwxrwx. 1 root root 0 Oct 29 23:21 user -> user:[4026531837]
lrwxrwxrwx. 1 root root 0 Oct 29 23:21 uts -> uts:[4026531838]
```

然后新打开一个命令行窗口，使用相同的命令查看一下主机上的 Namespace 信息：

```text
[root@localhost ~]# ls -l /proc/$$/ns/
total 0
lrwxrwxrwx. 1 root root 0 Oct 29 23:22 ipc -> ipc:[4026531839]
lrwxrwxrwx. 1 root root 0 Oct 29 23:22 mnt -> mnt:[4026531840]
lrwxrwxrwx. 1 root root 0 Oct 29 23:22 net -> net:[4026531956]
lrwxrwxrwx. 1 root root 0 Oct 29 23:22 pid -> pid:[4026531836]
lrwxrwxrwx. 1 root root 0 Oct 29 23:22 user -> user:[4026531837]
lrwxrwxrwx. 1 root root 0 Oct 29 23:22 uts -> uts:[4026531838]
```

通过对比两次命令的输出结果，我们可以看到，除了 Mount Namespace 的 ID 值不一样外，其他Namespace 的 ID 值均一致。

通过以上结果我们可以得出结论，使用 unshare 命令可以新建 Mount Namespace，并且在新建的 Mount Namespace 内 mount 是和外部完全隔离的。

### 2. PID Namespace

PID Namespace 的作用是用来隔离进程。在不同的 PID Namespace 中，进程可以拥有相同的 PID 号，利用 PID Namespace 可以实现每个容器的主进程为 1 号进程，而容器内的进程在主机上却拥有不同的PID。例如一个进程在主机上 PID 为 122，使用 PID Namespace 可以实现该进程在容器内看到的 PID 为 1。

创建一个 bash 进程，并且新建一个 PID Namespace：

```bash
unshare --pid --fork --mount-proc /bin/bash
```


执行完上述命令后，我们在主机上创建了一个新的 PID Namespace，并且当前命令行窗口加入了新创建的 PID Namespace。在当前的命令行窗口使用 ps aux 命令查看一下进程信息：

```bash
root@localhost ~]# ps aux
USER        PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root          1  0.0  0.1 115548  2096 pts/0    S    23:24   0:00 /bin/bash
root         12  0.0  0.0 155452  1856 pts/0    R+   23:24   0:00 ps aux
```

通过上述命令输出结果可以看到当前 Namespace 下 bash 为 1 号进程，而且我们也看不到主机上的其他进程信息。

### 3. UTS Namespace

UTS Namespace 主要是用来隔离主机名的，它允许每个 UTS Namespace 拥有一个独立的主机名。例如我们的主机名称为 docker，使用UTS Namespace可以实现在容器内的主机名称为 mydocker或者其他任意自定义主机名。

使用 unshare 命令来创建一个 UTS Namespace：

```bash
unshare --uts --fork /bin/bash
```

创建好 UTS Namespace 后，当前命令行窗口已经处于一个独立的 UTS Namespace 中，使用 hostname 命令设置一下主机名：

```bash
[root@localhost ~]# hostname -b docker
[root@localhost ~]# hostname
docker
```

通过上面命令的输出，我们可以看到当前UTS Namespace 内的主机名已经被修改为docker。然后我们新打开一个命令行窗口，使用相同的命令查看一下主机的 hostname：

```bash
[root@localhost ~]# hostname
localhost
```

可以看到主机的名称仍然为 localhost，并没有被修改。可见UTS Namespace可以用来隔离主机名。

### 4. IPC Namespace

IPC Namespace 主要是用来隔离进程间通信的。例如 PID Namespace 和 IPC Namespace 一起使用可以实现同一 IPC Namespace 内的进程彼此可以通信，不同 IPC Namespace 的进程却不能通信。

使用 unshare 命令来创建一个 IPC Namespace：

```bash
unshare --ipc --fork /bin/bash
```

查看系统间通信队列列表

```bash
[root@localhost ~]# ipcs -q

------ Message Queues --------
key        msqid      owner      perms      used-bytes   messages 
```

创建系统间通信队列

```bash
[root@localhost ~]# ipcmk -Q
Message queue id: 0
```

再次查看当前IPC Namespace下的系统通信队列列表：

```bash
[root@localhost ~]# ipcs -q

------ Message Queues --------
key        msqid      owner      perms      used-bytes   messages    
0x255268e0 0          root       644        0            0 
```

当前已经成功创建了一个系统通信队列。新打开一个命令行窗口，使用ipcs -q 命令查看一下主机的系统通信队列：

```bash
[root@192 ~]# ipcs -q 

------ Message Queues --------
key        msqid      owner      perms      used-bytes   messages
```

在单独的 IPC Namespace内创建的系统通信队列在主机上无法看到。即 IPC Namespace 实现了系统通信队列的隔离。

### 5. User Namespace

User Namespace主要是用来隔离用户和用户组的。一个比较典型的应用场景就是在主机上以非root用户运行的进程可以在一个单独的User Namespace中映射成root用户。使用User Namespace可以实现进程在容器内拥有 root 权限，而在主机上却只是普通用户。

创建一个 User Namespace：

```bash
[centos@localhost ~]$ unshare --user -r /bin/bash
[root@localhost ~]# 
```

> CentOS7 默认允许创建的 User Namespace 为 0，如果执行上述命令失败（ unshare 命令返回的错误为 unshare: unshare failed: Invalid argument ），需要使用以下命令修改系统允许创建的 User Namespace 数量，命令为：echo 65535 > /proc/sys/user/max_user_namespaces，然后再次尝试创建 User Namespace。

然后执行 id 命令查看一下当前的用户信息：

```bash
[root@localhost ~]# id
uid=0(root) gid=0(root) groups=0(root) context=unconfined_u:unconfined_r:unconfined_t:s0-s0:c0.c1023
```

通过上面的输出可以看到在新的User Namespace内已经是root用户了。使用只有主机root用户才可以执行的reboot命令来验证一下，在当前命令行窗口执行 reboot 命令：

```bash
[root@localhost ~]# reboot
Failed to open /dev/initctl: Permission denied
Failed to talk to init daemon.
```

可以看到，在新创建的User Namespace内虽然是 root 用户，但是并没有权限执行reboot命令。这说明在隔离的User Namespace中，并不能获取到主机的root权限，也就是说User Namespace实现了用户和用户组的隔离。

### 6. Net Namespace

Net Namespace 是用来隔离网络设备、IP 地址和端口等信息的。Net Namespace 可以让每个进程拥有自己独立的 IP 地址，端口和网卡信息。例如主机 IP 地址为 172.16.4.1 ，容器内可以设置独立的 IP 地址为 192.168.1.1。

同样用实例验证，我们首先使用 ip a 命令查看一下主机上的网络信息：

```
[root@localhost ~]# ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host 
       valid_lft forever preferred_lft forever
2: ens33: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
    link/ether 00:0c:29:a8:63:dc brd ff:ff:ff:ff:ff:ff
    inet 192.168.1.136/24 brd 192.168.1.255 scope global noprefixroute dynamic ens33
       valid_lft 1092sec preferred_lft 1092sec
    inet6 fe80::f4d6:a364:587f:861b/64 scope link noprefixroute 
       valid_lft forever preferred_lft forever
3: docker0: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc noqueue state DOWN group default 
    link/ether 02:42:42:44:05:d1 brd ff:ff:ff:ff:ff:ff
    inet 172.17.0.1/16 brd 172.17.255.255 scope global docker0
       valid_lft forever preferred_lft forever
```

创建一个 Net Namespace：

```
unshare --net --fork /bin/bash
```

使用 ip a 命令查看一下网络信息：

```
[root@localhost ~]# ip a
1: lo: <LOOPBACK> mtu 65536 qdisc noop state DOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
```

可以看到，宿主机上有 lo、eth0、docker0 等网络设备，而新建的 Net Namespace 内则与主机上的网络设备不同。

使用不同的 Namespace，可以实现容器中的进程看不到别的容器的资源，但是有一个问题你是否注意到？容器内的进程仍然可以任意地使用主机的 CPU 、内存等资源，如果某一个容器使用的主机资源过多，可能导致主机的资源竞争，进而影响业务。那如果我们想限制一个容器资源的使用（如 CPU、内存等）应该如何做呢？

这里就需要用到 Linux 内核的另一个核心技术cgroups。

## 二、cgroups

cgroups（全称：control groups）是 Linux 内核的一个功能，它可以实现限制进程或者进程组的资源（如 CPU、内存、磁盘 IO 等）。

> 在 2006 年，Google 的工程师（ Rohit Seth 和 Paul Menage 为主要发起人） 发起了这个项目，起初项目名称并不是cgroups，而被称为进程容器（process containers）。在 2007 年cgroups代码计划合入Linux 内核，但是当时在 Linux 内核中，容器（container）这个词被广泛使用，并且拥有不同的含义。为了避免命名混乱和歧义，进程容器被重名为cgroups，并在 2008 年成功合入 Linux 2.6.24 版本中。cgroups目前已经成为 systemd、Docker、Linux Containers（LXC） 等技术的基础。

cgroups 主要提供了如下功能：

1. 资源限制： 限制资源的使用量，例如我们可以通过限制某个业务的内存上限，从而保护主机其他业务的安全运行。
2. 优先级控制：不同的组可以有不同的资源（ CPU 、磁盘 IO 等）使用优先级。
3. 审计：计算控制组的资源使用情况。
4. 控制：控制进程的挂起或恢复。

cgroups功能的实现依赖于三个核心概念：子系统、控制组、层级树。

1. 子系统（subsystem）：是一个内核的组件，一个子系统代表一类资源调度控制器。例如内存子系统可以限制内存的使用量，CPU 子系统可以限制 CPU 的使用时间。

2. 控制组（cgroup）：表示一组进程和一组带有参数的子系统的关联关系。例如，一个进程使用了 CPU 子系统来限制 CPU 的使用时间，则这个进程和 CPU 子系统的关联关系称为控制组。

3. 层级树（hierarchy）：是由一系列的控制组按照树状结构排列组成的。这种排列方式可以使得控制组拥有父子关系，子控制组默认拥有父控制组的属性，也就是子控制组会继承于父控制组。比如，系统中定义了一个控制组c1，限制了CPU可以使用1核，然后另外一个控制组c2想实现既限制CPU 使用1核，同时限制内存使用2G，那么c2就可以直接继承c1，无须重复定义CPU限制。

cgroups 的三个核心概念中，子系统是最核心的概念，因为子系统是真正实现某类资源的限制的基础。

### 1. cgroups 子系统实例

mount 命令查看一下当前系统已经挂载的cgroups信息：

```
[root@localhost ~]# mount -t cgroup
cgroup on /sys/fs/cgroup/systemd type cgroup (rw,nosuid,nodev,noexec,relatime,seclabel,xattr,release_agent=/usr/lib/systemd/systemd-cgroups-agent,name=systemd)
cgroup on /sys/fs/cgroup/freezer type cgroup (rw,nosuid,nodev,noexec,relatime,seclabel,freezer)
cgroup on /sys/fs/cgroup/net_cls,net_prio type cgroup (rw,nosuid,nodev,noexec,relatime,seclabel,net_prio,net_cls)
cgroup on /sys/fs/cgroup/perf_event type cgroup (rw,nosuid,nodev,noexec,relatime,seclabel,perf_event)
cgroup on /sys/fs/cgroup/devices type cgroup (rw,nosuid,nodev,noexec,relatime,seclabel,devices)
cgroup on /sys/fs/cgroup/cpu,cpuacct type cgroup (rw,nosuid,nodev,noexec,relatime,seclabel,cpuacct,cpu)
cgroup on /sys/fs/cgroup/pids type cgroup (rw,nosuid,nodev,noexec,relatime,seclabel,pids)
cgroup on /sys/fs/cgroup/hugetlb type cgroup (rw,nosuid,nodev,noexec,relatime,seclabel,hugetlb)
cgroup on /sys/fs/cgroup/memory type cgroup (rw,nosuid,nodev,noexec,relatime,seclabel,memory)
cgroup on /sys/fs/cgroup/cpuset type cgroup (rw,nosuid,nodev,noexec,relatime,seclabel,cpuset)
cgroup on /sys/fs/cgroup/blkio type cgroup (rw,nosuid,nodev,noexec,relatime,seclabel,blkio)
```

通过输出，可以看到当前系统已经挂载了我们常用的cgroups子系统，例如 cpu、memory、pids 等我们常用的cgroups子系统。

这些子系统中，cpu 和 memory 子系统是容器环境中使用最多的子系统。

#### 1.1 cpu 子系统

##### 第一步：在 cpu 子系统下创建 cgroup

在相应的子系统下创建目录即可

```bash
mkdir /sys/fs/cgroup/cpu/mydocker
```

查看一下新创建的目录变化

```
[root@localhost ~]# ls -l /sys/fs/cgroup/cpu/mydocker
total 0
-rw-r--r--. 1 root root 0 Oct 30 22:41 cgroup.clone_children
--w--w--w-. 1 root root 0 Oct 30 22:41 cgroup.event_control
-rw-r--r--. 1 root root 0 Oct 30 22:41 cgroup.procs
-r--r--r--. 1 root root 0 Oct 30 22:41 cpuacct.stat
-rw-r--r--. 1 root root 0 Oct 30 22:41 cpuacct.usage
-r--r--r--. 1 root root 0 Oct 30 22:41 cpuacct.usage_percpu
-rw-r--r--. 1 root root 0 Oct 30 22:41 cpu.cfs_period_us
-rw-r--r--. 1 root root 0 Oct 30 22:41 cpu.cfs_quota_us
-rw-r--r--. 1 root root 0 Oct 30 22:41 cpu.rt_period_us
-rw-r--r--. 1 root root 0 Oct 30 22:41 cpu.rt_runtime_us
-rw-r--r--. 1 root root 0 Oct 30 22:41 cpu.shares
-r--r--r--. 1 root root 0 Oct 30 22:41 cpu.stat
-rw-r--r--. 1 root root 0 Oct 30 22:41 notify_on_release
-rw-r--r--. 1 root root 0 Oct 30 22:41 tasks
```

由上可以看到我们新建的目录下被自动创建了很多文件，其中 cpu.cfs_quota_us 文件代表在某一个阶段限制的 CPU 时间总量，单位为微秒。例如，我们想限制某个进程最多使用 1 核 CPU，就在这个文件里写入 100000（100000 代表限制 1 个核） ，tasks 文件中写入进程的 ID 即可（如果要限制多个进程 ID，在 tasks 文件中用换行符分隔即可）。

此时，我们所需要的 cgroup 就创建好了。

##### 第二步：创建进程，加入 cgroup

把当前运行的 shell 进程加入 cgroup，然后在当前 shell 运行 cpu 耗时任务（这里利用到了继承，子进程会继承父进程的 cgroup）。

使用以下命令将 shell 进程加入 cgroup 中：

```
[root@localhost ~]# cd /sys/fs/cgroup/cpu/mydocker
[root@localhost mydocker]# echo $$ > tasks
[root@localhost mydocker]# cat tasks
1727
1777
```

其中第一个进程 ID 为当前 shell 的主进程，也就是说，当前 shell 主进程为 1727。

##### 第三步：执行 CPU 耗时任务，验证 cgroup 是否可以限制 cpu 使用时间

下面，我们使用以下命令制造一个死循环，来提升 cpu 使用率：

```bash
while true;do echo;done;
```

执行完上述命令后，我们新打开一个 shell 窗口，使用 top -p 命令查看当前 cpu 使用率，-p 参数后面跟进程 ID，我这里是 3485。

```bash
[root@localhost ~]# top -p 1727
top - 22:46:43 up 29 min,  2 users,  load average: 0.89, 0.22, 0.11
Tasks:   1 total,   1 running,   0 sleeping,   0 stopped,   0 zombie
%Cpu(s): 34.6 us,  7.7 sy,  0.0 ni, 57.7 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
KiB Mem :  1863032 total,  1339788 free,   275472 used,   247772 buff/cache
KiB Swap:  2097148 total,  2097148 free,        0 used.  1434404 avail Mem 

   PID USER      PR  NI    VIRT    RES    SHR S  %CPU %MEM     TIME+ COMMAND                                                         
  1727 root      20   0  115672   2140   1660 R 100.0  0.1   0:24.58 bash 
```

通过上面输出可以看到1727这个进程被限制到了只能使用100 % 的 cpu，也就是1个核。说明我们使用 cgroup来限制cpu使用时间已经生效。此时，执行while循环的命令行窗口可以使用Ctrl+C退出循环。

为了进一步证实cgroup限制cpu的准确性，我们修改cpu限制时间为 0.5 核，命令如下：

```bash
[root@localhost ~]# cd /sys/fs/cgroup/cpu/mydocker
[root@localhost mydocker]# echo 50000 > cpu.cfs_quota_us
```

同样使用上面的命令来制造死循环：

```bash
# while true;do echo;done;
```

保持当前窗口，新打开一个 shell 窗口，使用 top -p 参数查看 cpu 使用率：

```
[root@localhost ~]# top -p 1727
top - 22:49:42 up 31 min,  2 users,  load average: 0.31, 0.42, 0.22
Tasks:   1 total,   1 running,   0 sleeping,   0 stopped,   0 zombie
%Cpu(s): 15.3 us,  5.1 sy,  0.0 ni, 79.3 id,  0.0 wa,  0.0 hi,  0.4 si,  0.0 st
KiB Mem :  1863032 total,  1337872 free,   277124 used,   248036 buff/cache
KiB Swap:  2097148 total,  2097148 free,        0 used.  1432736 avail Mem 

   PID USER      PR  NI    VIRT    RES    SHR S  %CPU %MEM     TIME+ COMMAND                                                         
  1727 root      20   0  115672   2152   1672 R  50.0  0.1   1:27.29 bash   
```

通过上面输出可以看到，此时 cpu 使用率已经被限制到了 50%，即 0.5 个核。
验证完 cgroup 限制 cpu，我们使用相似的方法来验证 cgroup 对内存的限制。

#### 1.2 memroy 子系统

##### 第一步：在 memory 子系统下创建 cgroup

```bash
mkdir /sys/fs/cgroup/memory/mydocker
```

查看一下新创建的目录

```
[root@localhost ~]# ls -l /sys/fs/cgroup/memory/mydocker
total 0
-rw-r--r--. 1 root root 0 Oct 30 22:51 cgroup.clone_children
--w--w--w-. 1 root root 0 Oct 30 22:51 cgroup.event_control
-rw-r--r--. 1 root root 0 Oct 30 22:51 cgroup.procs
-rw-r--r--. 1 root root 0 Oct 30 22:51 memory.failcnt
--w-------. 1 root root 0 Oct 30 22:51 memory.force_empty
-rw-r--r--. 1 root root 0 Oct 30 22:51 memory.kmem.failcnt
-rw-r--r--. 1 root root 0 Oct 30 22:51 memory.kmem.limit_in_bytes
-rw-r--r--. 1 root root 0 Oct 30 22:51 memory.kmem.max_usage_in_bytes
-r--r--r--. 1 root root 0 Oct 30 22:51 memory.kmem.slabinfo
-rw-r--r--. 1 root root 0 Oct 30 22:51 memory.kmem.tcp.failcnt
-rw-r--r--. 1 root root 0 Oct 30 22:51 memory.kmem.tcp.limit_in_bytes
-rw-r--r--. 1 root root 0 Oct 30 22:51 memory.kmem.tcp.max_usage_in_bytes
-r--r--r--. 1 root root 0 Oct 30 22:51 memory.kmem.tcp.usage_in_bytes
-r--r--r--. 1 root root 0 Oct 30 22:51 memory.kmem.usage_in_bytes
-rw-r--r--. 1 root root 0 Oct 30 22:51 memory.limit_in_bytes
-rw-r--r--. 1 root root 0 Oct 30 22:51 memory.max_usage_in_bytes
-rw-r--r--. 1 root root 0 Oct 30 22:51 memory.memsw.failcnt
-rw-r--r--. 1 root root 0 Oct 30 22:51 memory.memsw.limit_in_bytes
-rw-r--r--. 1 root root 0 Oct 30 22:51 memory.memsw.max_usage_in_bytes
-r--r--r--. 1 root root 0 Oct 30 22:51 memory.memsw.usage_in_bytes
-rw-r--r--. 1 root root 0 Oct 30 22:51 memory.move_charge_at_immigrate
-r--r--r--. 1 root root 0 Oct 30 22:51 memory.numa_stat
-rw-r--r--. 1 root root 0 Oct 30 22:51 memory.oom_control
----------. 1 root root 0 Oct 30 22:51 memory.pressure_level
-rw-r--r--. 1 root root 0 Oct 30 22:51 memory.soft_limit_in_bytes
-r--r--r--. 1 root root 0 Oct 30 22:51 memory.stat
-rw-r--r--. 1 root root 0 Oct 30 22:51 memory.swappiness
-r--r--r--. 1 root root 0 Oct 30 22:51 memory.usage_in_bytes
-rw-r--r--. 1 root root 0 Oct 30 22:51 memory.use_hierarchy
-rw-r--r--. 1 root root 0 Oct 30 22:51 notify_on_release
-rw-r--r--. 1 root root 0 Oct 30 22:51 tasks
```

其中`memory.limit_in_bytes`文件代表内存使用总量，单位为 byte。

例如，这里我希望对内存使用限制为 1G，则向 memory.limit_in_bytes 文件写入 1073741824，命令如下：

```
[root@localhost ~]# cd /sys/fs/cgroup/memory/mydocker
[root@localhost mydocker]# cat memory.limit_in_bytes
9223372036854771712
[root@localhost mydocker]# echo 1073741824 > memory.limit_in_bytes
[root@localhost mydocker]# cat memory.limit_in_bytes
1073741824
```

##### 第二步：创建进程，加入 cgroup

同样把当前 shell 进程 ID 写入 tasks 文件内：

```
[root@localhost mydocker]# cd /sys/fs/cgroup/memory/mydocker
[root@localhost mydocker]# echo $$ > tasks
[root@localhost mydocker]# cat tasks
2033
2049
```

##### 第三步，执行内存测试工具，申请内存

需要安装工具 memtester

```
[root@localhost mydocker]# memtester 1500M 1
memtester version 4.3.0 (64-bit)
Copyright (C) 2001-2012 Charles Cazabon.
Licensed under the GNU General Public License version 2 (only).

pagesize is 4096
pagesizemask is 0xfffffffffffff000
want 1500MB (1572864000 bytes)
got  1500MB (1572864000 bytes), trying mlock ...Killed
```

该命令会申请 1500 M 内存，并且做内存测试。由于上面我们对当前 shell 进程内存限制为 1 G，当 memtester 使用的内存达到 1G 时，cgroup 便将 memtester 杀死。

上面最后一行的输出结果表示 memtester 想要 1500 M 内存，但是由于 cgroup 限制，达到了内存使用上限，被杀死了，与我们的预期一致。

我们可以使用以下命令，降低一下内存申请，将内存申请调整为 500M：

```
[root@localhost mydocker]# memtester 500M 1
memtester version 4.3.0 (64-bit)
Copyright (C) 2001-2012 Charles Cazabon.
Licensed under the GNU General Public License version 2 (only).

pagesize is 4096
pagesizemask is 0xfffffffffffff000
want 500MB (524288000 bytes)
got  500MB (524288000 bytes), trying mlock ...locked.

Loop 1/1:
  Stuck Address       : ok
  Random Value        : ok
  Compare XOR         : ok
  Compare SUB         : ok
  Compare MUL         : ok
  Compare DIV         : ok
  Compare OR          : ok
  Compare AND         : ok
  Sequential Increment: ok
  Solid Bits          : ok
  Block Sequential    : ok
  Checkerboard        : ok
  Bit Spread          : ok
  Bit Flip            : ok
  Walking Ones        : ok
  Walking Zeroes      : ok
  8-bit Writes        : ok
  16-bit Writes       : ok
Done.
```

这里可以看到，此时 memtester 已经成功申请到 500M 内存并且正常完成了内存测试。

上面创建的cgroups如果不想使用了，直接删除创建的文件夹即可。

### 2. Docker是如何使用cgroups

首先，我们使用以下命令创建一个 nginx 容器：

```bash
[root@localhost ~]# docker run -itd -m=1g busybox
3444837506a982a90ff805a1974242a1e2357ceac52307c7dbac8898f985c3c1
```

上述命令创建并启动了一个 nginx 容器，并且限制内存为 1G。然后我们进入cgroups内存子系统的目录，使用 ls 命令查看一下该目录下的内容：

```
[root@localhost ~]# ls -l /sys/fs/cgroup/memory/docker/ | head
total 0
drwxr-xr-x. 2 root root 0 Oct 30 23:21 3444837506a982a90ff805a1974242a1e2357ceac52307c7dbac8898f985c3c1
-rw-r--r--. 1 root root 0 Oct 30 23:18 cgroup.clone_children
--w--w--w-. 1 root root 0 Oct 30 23:18 cgroup.event_control
-rw-r--r--. 1 root root 0 Oct 30 23:18 cgroup.procs
-rw-r--r--. 1 root root 0 Oct 30 23:18 memory.failcnt
--w-------. 1 root root 0 Oct 30 23:18 memory.force_empty
-rw-r--r--. 1 root root 0 Oct 30 23:18 memory.kmem.failcnt
-rw-r--r--. 1 root root 0 Oct 30 23:18 memory.kmem.limit_in_bytes
-rw-r--r--. 1 root root 0 Oct 30 23:18 memory.kmem.max_usage_in_bytes
```

可以看到 docker 的目录下有一个一串随机 ID 的目录，该目录即为我们上面创建的 busybox容器的 ID。然后我们进入该目录，查看一下该容器的 memory.limit_in_bytes 文件的内容。

```
[root@localhost ~]# cd /sys/fs/cgroup/memory/docker/3444837506a982a90ff805a1974242a1e2357ceac52307c7dbac8898f985c3c1
[root@localhost 3444837506a982a90ff805a1974242a1e2357ceac52307c7dbac8898f985c3c1]# cat memory.limit_in_bytes
1073741824
```

可以看到内存限制值正好为 1G。
事实上，Docker 创建容器时，Docker 会根据启动容器的参数，在对应的 cgroups 子系统下创建以容器 ID 为名称的目录, 然后根据容器启动时设置的资源限制参数, 修改对应的 cgroups 子系统资源限制文件, 从而达到资源限制的效果。

cgroups 虽然可以实现资源的限制，但是不能保证资源的使用。例如，cgroups 限制某个容器最多使用 1 核 CPU，但不保证总是能使用到 1 核 CPU，当 CPU 资源发生竞争时，可能会导致实际使用的 CPU 资源产生竞争。








