## 一、Docker网络的组成

### 1. CNM

CNM， Container Netwyork Model，容器网络模型，其是一种网络连接的解决方案，是一种设计规范、设计标准，其规定了Docker网络的基础组成要素。
CNM中定义了三个基本要素：沙盒Sandbox，终端Endpoint与网络Network。

1. 沙盒：一个独立的网络栈，其中包括以太网接口、端口号、路由表、DNS配置等。LinuxNetworkNamespace是沙盒的标准实现。
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

## 二、Docker0网桥

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

