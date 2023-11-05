## 一、Docker网络的组成

### 1. CNM

CNM， Container Netwyork Model，容器网络模型，其是一种网络连接的解决方案，是一种设计规范、设计标准，其规定了Docker网络的基础组成要素。
CNM中定义了三个基本要素：沙盒Sandbox，终端Endpoint与网络Network。

1. 沙盒：一个独立的网络栈，其中包括以太网接口、端口号、路由表、DNS配置等。Linux Network Namespace是沙盒的标准实现。
2. 终端：虚拟网络接口，主要负责创建连接，即将沙盒连接到网络上。一个终端只能接入某一个网络。
3. 网络：802.1d网桥的软件实现，是需要交互的终端的集合。

```bash
$ docker inspect busybox
...
        "NetworkSettings": {
            "Bridge": "",
            "SandboxID": "60c7abc71309c2711b4d55e9729cd3becff2701a21158add723c5785b58ea020",
            "HairpinMode": false,
            "LinkLocalIPv6Address": "",
            "LinkLocalIPv6PrefixLen": 0,
            "Ports": {},
            "SandboxKey": "/var/run/docker/netns/60c7abc71309",
            "SecondaryIPAddresses": null,
            "SecondaryIPv6Addresses": null,
            "EndpointID": "cafa17b4fc516fc2e800fbb5bdf9bae8e2b6921a54f7ae41c3c3707f6fb15537",
            "Gateway": "172.17.0.1",
            "GlobalIPv6Address": "",
            "GlobalIPv6PrefixLen": 0,
            "IPAddress": "172.17.0.2",
            "IPPrefixLen": 16,
            "IPv6Gateway": "",
            "MacAddress": "02:42:ac:11:00:02",
            "Networks": {
                "bridge": {
                    "IPAMConfig": null,
                    "Links": null,
                    "Aliases": null,
                    "NetworkID": "9759401112f20439cac9e5441a88203fa3088b020eb026b96c07809d066d807c",
                    "EndpointID": "cafa17b4fc516fc2e800fbb5bdf9bae8e2b6921a54f7ae41c3c3707f6fb15537",
                    "Gateway": "172.17.0.1",
                    "IPAddress": "172.17.0.2",
                    "IPPrefixLen": 16,
                    "IPv6Gateway": "",
                    "GlobalIPv6Address": "",
                    "GlobalIPv6PrefixLen": 0,
                    "MacAddress": "02:42:ac:11:00:02",
                    "DriverOpts": null
                }
            }
...
[root@localhost ~]# ls -l /var/run/docker/netns
total 0
-r--r--r--. 1 root root 0 Oct 17 13:53 60c7abc71309
```

### 2. Libnetwork

​     CNM是设计规范，而Libnetwork是开源的、由Go语言编写的、跨平台的CNM的标准实现。
​     Libnetwork除了实现了CNM的三个组件，还实现了本地服务发现、容器负载均衡，以及网络控制层与管理层功能。

### 3. Driver

每种不同的网络类型都有对应的不同的底层Driver，这些Driver负责在主机上真正实现需要的网络功能，例如创建veth pair设备等。
不过，无论哪种网络类型，其工作方式都是类似的。通过调用Docker引擎API发出请求，然后由Libnetwork做出框架性的处理，然后将请求转发给相应的Driver。
通过`docker network ls`命令可以查看当前主机所连接的网络及网络类型。

```bash
$ docker network ls
NETWORK ID          NAME                DRIVER              SCOPE
9759401112f2        bridge              bridge              local
5f276e46d24d        host                host                local
53ce2abc7503        none                null                local
```

## 二、Docker网络驱动

### 1. bridge

#### 1.1 Docker0网桥

bridge网络模式中具有一个默认的虚拟网桥dockero，通过`ip a`或`ifconfig`命令都可查看

```bash
[root@localhost ~]# ifconfig docker0
docker0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 172.17.0.1  netmask 255.255.0.0  broadcast 172.17.255.255
        inet6 fe80::42:16ff:fe66:8da  prefixlen 64  scopeid 0x20<link>
        ether 02:42:16:66:08:da  txqueuelen 0  (Ethernet)
        RX packets 104  bytes 87724 (85.6 KiB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 94  bytes 10682 (10.4 KiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
```

在Linux主机上，Docker的bridge网络由Bridge驱动创建，其在创建时会创建一个默认的网桥dockero0。容器与网桥间是通过veth pair技术实现的连接，网桥与外网间是通过“网络地址转换NAT技术”实现的连接，即将通信的数据包中的内网地址转换为外网地址。Bridge驱动的底层是基于Linux内核的LinuxBridge技术。

```bash
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
       valid_lft 1359sec preferred_lft 1359sec
    inet6 fe80::f4d6:a364:587f:861b/64 scope link noprefixroute 
       valid_lft forever preferred_lft forever
3: docker0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default 
    link/ether 02:42:16:66:08:da brd ff:ff:ff:ff:ff:ff
    inet 172.17.0.1/16 brd 172.17.255.255 scope global docker0
       valid_lft forever preferred_lft forever
    inet6 fe80::42:16ff:fe66:8da/64 scope link 
       valid_lft forever preferred_lft forever
91: vethebd420b@if90: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue master docker0 state UP group default 
    link/ether 12:05:94:bd:9e:45 brd ff:ff:ff:ff:ff:ff link-netnsid 2
    inet6 fe80::1005:94ff:febd:9e45/64 scope link 
       valid_lft forever preferred_lft forever
[root@localhost ~]# docker exec  busybox ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
90: eth0@if91: <BROADCAST,MULTICAST,UP,LOWER_UP,M-DOWN> mtu 1500 qdisc noqueue 
    link/ether 02:42:ac:11:00:02 brd ff:ff:ff:ff:ff:ff
    inet 172.17.0.2/16 brd 172.17.255.255 scope global eth0
       valid_lft forever preferred_lft forever
```

宿主机的91号接口与容器中的90号接口为一对veth pair。

```bash
[root@localhost ~]# brctl show
bridge name	bridge id		STP enabled	interfaces
docker0		8000.0242166608da	no		vethebd420b
```

网卡`91: vethebd420b@if90`属于`docker0`网桥。

bridge网络，也称为单机桥接网络，是Docker默认的网络模式。该网络模式只能存在于单个Docker主机上，其只能用于连接所在Docker主机上的容器。

#### 1.2 创建网桥

创建一个网桥

```bash
[root@localhost ~]# docker network create -d bridge bridge2
b5a98b1b2f8565b2d8b95ed7a2e4a8a81ed47fa771122f6ca6628450a7f7c002
[root@localhost ~]# docker network ls
NETWORK ID          NAME                DRIVER              SCOPE
c101138aa733        bridge              bridge              local
b5a98b1b2f85        bridge2             bridge              local
5f276e46d24d        host                host                local
53ce2abc7503        none                null                local
[root@localhost ~]# brctl show
bridge name	bridge id		STP enabled	interfaces
br-b5a98b1b2f85		8000.02423a222e46	no		
docker0		8000.0242cb20dcd7	no	
```

创建两个容器分别属于两个不同的网络

```bash
[root@localhost ~]# docker run -itd --name busybox1 busybox
b76bbd92872a57fcd29245bab390616be19cf24d2890367f7168aa3c7f8b9216
[root@localhost ~]# docker run -itd --name busybox2 --network bridge2 busybox
755ebadaaaa53c2520ef7c4e45433bd5d6bbd270d52b7ab75462dfefd7c089ed
[root@localhost ~]# docker exec -it busybox1 ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
9: eth0@if10: <BROADCAST,MULTICAST,UP,LOWER_UP,M-DOWN> mtu 1500 qdisc noqueue 
    link/ether 02:42:ac:11:00:02 brd ff:ff:ff:ff:ff:ff
    inet 172.17.0.2/16 brd 172.17.255.255 scope global eth0
       valid_lft forever preferred_lft forever
[root@localhost ~]# docker exec -it busybox2 ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
11: eth0@if12: <BROADCAST,MULTICAST,UP,LOWER_UP,M-DOWN> mtu 1500 qdisc noqueue 
    link/ether 02:42:ac:12:00:02 brd ff:ff:ff:ff:ff:ff
    inet 172.18.0.2/16 brd 172.18.255.255 scope global eth0
       valid_lft forever preferred_lft forever
```

将busybox1添加到bridge2网络中

```bash
[root@localhost ~]# docker network connect bridge2 busybox1
[root@localhost ~]# docker exec -it busybox1 ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
9: eth0@if10: <BROADCAST,MULTICAST,UP,LOWER_UP,M-DOWN> mtu 1500 qdisc noqueue 
    link/ether 02:42:ac:11:00:02 brd ff:ff:ff:ff:ff:ff
    inet 172.17.0.2/16 brd 172.17.255.255 scope global eth0
       valid_lft forever preferred_lft forever
13: eth1@if14: <BROADCAST,MULTICAST,UP,LOWER_UP,M-DOWN> mtu 1500 qdisc noqueue 
    link/ether 02:42:ac:12:00:03 brd ff:ff:ff:ff:ff:ff
    inet 172.18.0.3/16 brd 172.18.255.255 scope global eth1
       valid_lft forever preferred_lft forever
[root@localhost ~]# brctl show
bridge name	bridge id		STP enabled	interfaces
br-b5a98b1b2f85		8000.02423a222e46	no		veth8b12f44
							vethff75d14
docker0		8000.0242cb20dcd7	no		vethfe81d3f

```

自定义网桥网络中容器可以使用容器名作为域名ping，默认网桥不可以

### 2. none

none网络，即没有网络。容器仍是一个独立的Network Namespace，但没有网络接口，没有IP。

```bash
[root@localhost ~]# docker run -itd --name busybox --network none busybox
dd32c1c7780982184de6b120a9479d7cb86232f4e72fd59f75ebb120175abac0
[root@localhost ~]# docker exec  busybox ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
```

### 3. host

host网络，即与宿主机host共用一个Network Namespace。该网络类型的容器没有独立的网络空间，没有独立的IP，全部与host共用。

```bash
[root@localhost ~]# docker run -itd --name busybox --network host busybox
dc70395908bb810e3a81593a63bc01cd7a5dc6821dfcff4422490d1b9fd36628
[root@localhost ~]# docker exec  busybox ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host 
       valid_lft forever preferred_lft forever
2: ens33: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast qlen 1000
    link/ether 00:0c:29:a8:63:dc brd ff:ff:ff:ff:ff:ff
    inet 192.168.1.136/24 brd 192.168.1.255 scope global dynamic noprefixroute ens33
       valid_lft 1438sec preferred_lft 1438sec
    inet6 fe80::f4d6:a364:587f:861b/64 scope link noprefixroute 
       valid_lft forever preferred_lft forever
3: docker0: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc noqueue 
    link/ether 02:42:cb:20:dc:d7 brd ff:ff:ff:ff:ff:ff
    inet 172.17.0.1/16 brd 172.17.255.255 scope global docker0
       valid_lft forever preferred_lft forever
    inet6 fe80::42:cbff:fe20:dcd7/64 scope link 
       valid_lft forever preferred_lft forever
```

