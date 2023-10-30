

### 1、Network Namespace

​    Network Namespace是Linux内核提供的用于实现网络虚拟化的重要功能，它能创建多个隔离的网络空间，每个独立的网络空间内的防火墙、网卡、路由表、邻居表、协议都是独立的。不管是虚拟机还是容器，当运行在独立的命名空间时，就像是一台单独的主机一样。
实例：创建两个Network Namespace，并最终让它们相互连通。

### 1. 创建两个命名空间

```bash
[root@localhost ~]# ip netns add ns1
[root@localhost ~]# ip netns add ns2
[root@localhost ~]# ip netns list
ns2
ns1
[root@localhost ~]# ip netns exec ns1 ip a
1: lo: <LOOPBACK> mtu 65536 qdisc noop state DOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
[root@localhost ~]# ip netns exec ns2 ip a
1: lo: <LOOPBACK> mtu 65536 qdisc noop state DOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
```

### 2. 创建网络接口veth pair

如果要让两个命名空间连通，则需要用到虚拟设备接口技术veth pair。该技术需要一对网络接口分别置于两个命名空间中。
创建一对网络接口veth-ns1与veth-ns2

```bash
[root@localhost ~]# ip link add veth-ns1 type veth peer name veth-ns2
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
       valid_lft 1585sec preferred_lft 1585sec
    inet6 fe80::f4d6:a364:587f:861b/64 scope link noprefixroute 
       valid_lft forever preferred_lft forever
88: veth-ns2@veth-ns1: <BROADCAST,MULTICAST,M-DOWN> mtu 1500 qdisc noop state DOWN group default qlen 1000
    link/ether 22:b2:59:0a:60:20 brd ff:ff:ff:ff:ff:ff
89: veth-ns1@veth-ns2: <BROADCAST,MULTICAST,M-DOWN> mtu 1500 qdisc noop state DOWN group default qlen 1000
    link/ether f2:d0:46:7b:0d:fe brd ff:f f:ff:ff:ff:ff
```

此时通过ip 1查看当前的网络地址情况，可以看到新增了两个相互连通的veth pair它们都具有MAC地址，但它们的状态都是DOWN， 都不具有P

### 3. 命名空间添加veth pair

```bash
[root@localhost ~]# ip link set veth-ns1 netns ns1
[root@localhost ~]# ip link set veth-ns2 netns ns2
[root@localhost ~]# ip netns exec ns1 ip a
1: lo: <LOOPBACK> mtu 65536 qdisc noop state DOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
89: veth-ns1@if88: <BROADCAST,MULTICAST> mtu 1500 qdisc noop state DOWN group default qlen 1000
    link/ether f2:d0:46:7b:0d:fe brd ff:ff:ff:ff:ff:ff link-netnsid 1
[root@localhost ~]# ip netns exec ns2 ip a
1: lo: <LOOPBACK> mtu 65536 qdisc noop state DOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
88: veth-ns2@if89: <BROADCAST,MULTICAST> mtu 1500 qdisc noop state DOWN group default qlen 1000
    link/ether 22:b2:59:0a:60:20 brd ff:ff:ff:ff:ff:ff link-netnsid 0
```

### 4. 为veth接口分配IP

```bash
[root@localhost ~]# ip netns exec ns1 ip a add 172.16.0.1/16 dev veth-ns1
[root@localhost ~]# ip netns exec ns2 ip a add 172.16.0.2/16 dev veth-ns2
[root@localhost ~]# ip netns exec ns1 ip a
1: lo: <LOOPBACK> mtu 65536 qdisc noop state DOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
89: veth-ns1@if88: <BROADCAST,MULTICAST> mtu 1500 qdisc noop state DOWN group default qlen 1000
    link/ether f2:d0:46:7b:0d:fe brd ff:ff:ff:ff:ff:ff link-netnsid 1
    inet 172.16.0.1/16 scope global veth-ns1
       valid_lft forever preferred_lft forever
[root@localhost ~]# ip netns exec ns2 ip a
1: lo: <LOOPBACK> mtu 65536 qdisc noop state DOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
88: veth-ns2@if89: <BROADCAST,MULTICAST> mtu 1500 qdisc noop state DOWN group default qlen 1000
    link/ether 22:b2:59:0a:60:20 brd ff:ff:ff:ff:ff:ff link-netnsid 0
    inet 172.16.0.2/16 scope global veth-ns2
       valid_lft forever preferred_lft forever
```

### 5. 启动veth接口

```bash
[root@localhost ~]# ip netns exec ns1 ip link set dev veth-ns1 up
[root@localhost ~]# ip netns exec ns2 ip link set dev veth-ns2 up
[root@localhost ~]# ip netns exec ns1 ip a
1: lo: <LOOPBACK> mtu 65536 qdisc noop state DOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
89: veth-ns1@if88: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default qlen 1000
    link/ether f2:d0:46:7b:0d:fe brd ff:ff:ff:ff:ff:ff link-netnsid 1
    inet 172.16.0.1/16 scope global veth-ns1
       valid_lft forever preferred_lft forever
    inet6 fe80::f0d0:46ff:fe7b:dfe/64 scope link 
       valid_lft forever preferred_lft forever
[root@localhost ~]# ip netns exec ns2 ip a
1: lo: <LOOPBACK> mtu 65536 qdisc noop state DOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
88: veth-ns2@if89: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default qlen 1000
    link/ether 22:b2:59:0a:60:20 brd ff:ff:ff:ff:ff:ff link-netnsid 0
    inet 172.16.0.2/16 scope global veth-ns2
       valid_lft forever preferred_lft forever
    inet6 fe80::20b2:59ff:fe0a:6020/64 scope link 
       valid_lft forever preferred_lft forever

```

### 6. 验证两个命名空间的联通性

```bash
[root@localhost ~]# ip netns exec ns1 ping 172.16.0.2 -c 1
PING 172.16.0.2 (172.16.0.2) 56(84) bytes of data.
64 bytes from 172.16.0.2: icmp_seq=1 ttl=64 time=1.19 ms

--- 172.16.0.2 ping statistics ---
1 packets transmitted, 1 received, 0% packet loss, time 0ms
rtt min/avg/max/mdev = 1.198/1.198/1.198/0.000 ms
[root@localhost ~]# ip netns exec ns2 ping 172.16.0.1 -c 1
PING 172.16.0.1 (172.16.0.1) 56(84) bytes of data.
64 bytes from 172.16.0.1: icmp_seq=1 ttl=64 time=0.103 ms

--- 172.16.0.1 ping statistics ---
1 packets transmitted, 1 received, 0% packet loss, time 0ms
rtt min/avg/max/mdev = 0.103/0.103/0.103/0.000 ms
```



