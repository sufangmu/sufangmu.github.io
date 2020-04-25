# 一、iptables概念

## 1.iptable与Netfilter

1. **Netfilter**是用来实现Linux内核中防火墙的Linux内核空间程序代码段。
2. **Hook potnt**: 数据包在Netfilter中的挂载点
3. **iptables**是用户管理Netfilter防火墙的用户程序。

![1587213311645](../assets/images/netfilter_iptables.png)

### 2.iptables的组成

#### 1. 表

1. raw 仅用于配置数据包，以便它们免于连接跟踪。
2. filter 是默认表，决定是否允许数据包到达目的地。
3. nat用于网络地址转换（例如端口转发）。
4. mangle 用于数据包更改。
5. security用于强制访问控制网络规则（例如SELinux

#### 2. 链

表是由几个默认链组成的。

1. PREROUTING：存在于raw,mangle,nat
2. INPUT:存在于mangle,filter,nat
3. OUTPUT: 存在于mangle,filter
4. FORWARD: 存在于raw,mangle,nat,filter
5. POSTROUTING :存在于mangle，nat
6. 自定义链

#### 3. 规则

包的过滤是基于规则的。规则由条件和target组成。很据匹配条件来匹配每一个流经此处的报文，一旦匹配成功则交给后面的target进行处理。

##### 1. 条件

包的来源、类型(ICMP、TCP、UDP)、目标端口

##### 2. 目标

1. 内建target

    - ACCEPT
    - DROP
    - QUEUE
    - RETURN

2. 扩展target

    - REJECT
    - LOG

3. 自定义链

3 自定义链

#### 4. 数据经过iptables的流程

![iptables工作流程](https://www.frozentux.net/iptables-tutorial/images/tables_traverse.jpg)

## 二、iptables操作

## 1. 查

### 1. 查看表的规则

语法：iptables -t 表名 -L

```bash
# iptables -t filter -L
Chain INPUT (policy ACCEPT)
target     prot opt source               destination

Chain FORWARD (policy ACCEPT)
target     prot opt source               destination

Chain OUTPUT (policy ACCEPT)
target     prot opt source               destination
```

### 2. 查看表中指定链的规则

语法：iptables -t 表名 -L 链名

```bash
# iptables -t filter -L INPUT
Chain INPUT (policy ACCEPT)
target     prot opt source               destination 
```

### 3. 查看更详细的信息：-v

```bash
# iptables -t filter -vL INPUT
Chain INPUT (policy ACCEPT 379 packets, 26956 bytes)
 pkts bytes target     prot opt in     out     source               destination
    0     0 ACCEPT     udp  --  virbr0 any     anywhere             anywhere             udp dpt:domain
```

各字段的含义：

pkts：对应规则匹配到的报文数
bytes：对应规则匹配到的报文包大小
target：规则对应的target
prot：规则对应的协议
opt：规则对应的选项
in：数据包从哪个接口流入
out：数据包从哪个接口流出
source：源地址
destination：目标地址

-n：不对IP地址反解

```bash
# iptables -t filter -vnL INPUT
Chain INPUT (policy ACCEPT 24M packets, 12G bytes)
 pkts bytes target     prot opt in     out     source               destination
    0     0 ACCEPT     udp  --  virbr0 *       0.0.0.0/0            0.0.0.0/0            udp dpt:53
```

-x: 显示精确数值

```bash
# iptables -t filter -vnL INPUT --line-number -x
Chain INPUT (policy ACCEPT 24568391 packets, 11707358586 bytes)
num      pkts      bytes target     prot opt in     out     source               destination
1           0        0 ACCEPT     udp  --  virbr0 *       0.0.0.0/0            0.0.0.0/0            udp dpt:53
```

### 4. 显示规则编号

```bash
# iptables -t filter -vnL INPUT --line-number
Chain INPUT (policy ACCEPT 24M packets, 12G bytes)
num   pkts bytes target     prot opt in     out     source               destination
1        0     0 ACCEPT     udp  --  virbr0 *       0.0.0.0/0            0.0.0.0/0            udp dpt:53
2        0     0 ACCEPT     tcp  --  virbr0 *       0.0.0.0/0            0.0.0.0/0            tcp dpt:53
3        0     0 ACCEPT     udp  --  virbr0 *       0.0.0.0/0            0.0.0.0/0            udp dpt:67
4        0     0 ACCEPT     tcp  --  virbr0 *       0.0.0.0/0            0.0.0.0/0            tcp dpt:67
```

## 2. 增

1. 插入一条规则(默认插入到第一行)

语法：iptables -t 表名 -I 链名 匹配条件 -j 动作

```bash
# iptables -t filter -I INPUT -s 172.16.10.102 -j DROP
```

-t：操作的表
-I：插入指定的链
-s：源地址
-j：匹配条件满足后执行的target(动作)

指定插入到某一行

```bash
# iptables -t filter -A INPUT 3 -s 172.16.10.103 -j ACCEPT
```

2. 追加一条规则(追加到最后一行)

``` 
语法：iptables -t 表名 -A 链名 匹配条件 -j 动作
```

```bash
# iptables -t filter -A INPUT -s 172.16.10.102 -j ACCEPT
```

此时filter表的状态

```bash
# iptables -nvL INPUT
Chain INPUT (policy ACCEPT 27 packets, 2764 bytes)
 pkts bytes target     prot opt in     out     source               destination
  203 17052 DROP       all  --  *      *       172.16.10.102        0.0.0.0/0
    0     0 ACCEPT     all  --  *      *       172.16.10.102        0.0.0.0/0  
```

**规则匹配顺序**：从上到下匹配，如果前面的规则匹配成功就不会执行后面的规则了。

## 3. 删

```

语法：iptables -t 表名 -D 链名 匹配条件 -j 动作

```

1. 根据规则的编号删除

```

    语法：# iptables -t filter -D INPUT 编号

```
示例：
```bash
# 删除第3条规则
# iptables -t filter -D INPUT 3
```

2. 根据具体的匹配条件与target删除

```bash
# iptables -t filter -D INPUT -s 172.16.10.102 -j DROP
```

删除指定表中某条链的所有规则

```bash
# iptables -t filter -F INPUT
```

-F:flush 冲刷(删除)指定链中的所有规则

## 4. 改

``` 
语法：iptables -t 表名 -R 链名 规则序号 规则原来的匹配条件 -j 动作
```

1. 修改规则

```bash
# iptables -t filter -R INPUT 1 -s 172.16.10.100 -j ACCEPT
```

-R：修改指定的链
注意：必须要指定源地址

2. 修改链的默认策略

```bash
root@node1:~# iptables -L
Chain INPUT (policy ACCEPT)
target     prot opt source               destination         

Chain FORWARD (policy ACCEPT)
target     prot opt source               destination         

Chain OUTPUT (policy ACCEPT)
target     prot opt source               destination   
# 将表中 FORWARD 中链的策略修改为 DROP     
root@node1:~# iptables -t filter -P FORWARD DROP
root@node1:~# iptables -L
Chain INPUT (policy ACCEPT)
target     prot opt source               destination         

Chain FORWARD (policy DROP)
target     prot opt source               destination         

Chain OUTPUT (policy ACCEPT)
target     prot opt source               destination 
```

5. 保存规则

ubuntu系统参考：https://help.ubuntu.com/community/IptablesHowTo

# 三、匹配条件 

## 1. 基本匹配

### 1.1. 源地址 -s

1. 指定IP 

```bash
# iptables -t filter -I INPUT -s 172.16.10.100,172.16.10.102 -j DROP
```

2. 指定网段

```bash
# iptables -t filter -I INPUT -s 172.16.10.0/24 -j DROP
```

3. 取反

```bash
# iptables -t filter -I INPUT ! -s 172.16.10.102 -j DROP
```

### 1.2. 目标地址 -d

```bash
# iptables -t filter -I INPUT -d 172.16.10.101 -j DROP
```

### 1.3. 协议类型 -p

```bash
# iptables -t filter -I INPUT -s 172.16.10.102 -d 172.16.10.101 -p tcp -j REJECT
```

-p [tcp|udp|icmp|udplite|icmpv6|ah|sctp]

### 1.4. 网卡接口 -i/-o

```bash
# iptables -t filter -I INPUT  -i eth0  -p icmp -j REJECT
```

-i: 只能用于PREROUING、INPUT、FORWARD
-o: 只能用于FORWARD、OUTPUT、POSTROUTING

## 2. 扩展匹配

扩展匹配条件使用时需要依赖一些扩展模块

### 2.1 tcp模块

1. 目标端口 --dport

```bash
# iptables -t filter -I INPUT -s 172.16.10.102 -m tcp -p tcp --dport 22 -j REJECT
```

-m: 扩展模块名
-p: 协议名称

2. 源端口 --sport

```bash
# iptables -t filter -I INPUT -s 172.16.10.102 -m tcp -p tcp --sport 22 -j ACCEPT
```

3. 同时指定多个端口(连续的端口)

```bash
# iptables -t filter -I INPUT -s 172.16.10.102 -m tcp -p tcp --sport 22:25 -j ACCEPT
```

4. --tcp-flags

```bash
# iptables -t filter -I INPUT -s 172.16.10.102 -m tcp -p tcp --dport 22 --tcp-flags SYN,ACK,FIN,RST,URG,PSH SYN -j REJECT
或
# iptables -t filter -I INPUT -s 172.16.10.102 -m tcp -p tcp --dport 22 --tcp-flags ALL SYN -j REJECT
```

--tcp-flags 需要两个参数 
--tcp-flags SYN, ACK, FIN, RST, URG, PSH    SYN
--tcp-flags 需要匹配TCP头中的哪些标志位    在第一部分的标志位列表中，哪些标志位必须为1

### 2.2 multiport模块(多个不连续的端口)

```bash
# iptables -t filter -I INPUT -s 172.16.10.102 -m multiport -p tcp --dport 22,80,8080 -j ACCEPT
```

### 2.3 udp扩展

```bash
# iptables -t filter -I INPUT -m udp -p udp --dport 137 -j ACCEPT
# iptables -t filter -I INPUT -m udp -p udp --sport 138 -j ACCEPT
```

### 2.4 icmp扩展

```bash
# 别的主机ping不进来，自己向外请求回复的报文也无法进入防火墙
# iptables -t filter -I INPUT -p icmp -j REJECT
```

只禁止被人ping

```bash
# iptables -t filter -I INPUT -m icmp -p icmp --icmp-type 8/0 -j REJECT
# 或
# iptables -t filter -I INPUT -m icmp -p icmp --icmp-type "echo-request" -j REJECT
```

### 2.5 state扩展

state模块可以实现连接追踪机制

连接状态：NEW、ESTABLISHED、RELATED、INVALID、UNTRACKED

1. NEW：连接中的第一个包，状态就是NEW
2. ESTABLISHED：NEW状态后面的包的状态
3. RELATED：一个服务建立了两个连接，连个连接中的某些报文直接有关系
4. INVALID：包无法被识别
5. UNTRACKED：报文未被追踪

实现只允许回应的报文通过防火墙(只能访问别人，别人不能访问自己)

```bash
# iptables -t filter -I INPUT -m state --state  RELATED,ESTABLISHED -j ACCEPT
# iptables -t filter -A INPUT -j REJECT
```

# 四、黑白名单

白名单：放行匹配规则的包
黑名单：拒绝匹配规则的包

白名单的实现：

```bash
# 放行22端口
# iptables -I INPUT -p tcp --dport 22 -j ACCEPT
# INPUT链的默认策略改为DROP
# iptables -P INPUT DROP
```

不建议把默认策略设置为DROP，一旦执行iptables -F，任何包都进不去，ssh就会断开

优化方法

```bash
# 放行22端口
# iptables -I INPUT -p tcp --dport 22 -j ACCEPT
# 其他都拒绝
# iptables -A INPUT -j REJECT
```

# 五、自定义链

1. 自定义链的意义： 便于分类管理
2. 自定义链不能直接使用，需要被默认链引用才可以使用

## 1. 创建

```bash
# iptables -t filter -N IN_WEB
# iptables -L
Chain INPUT (policy ACCEPT)
target     prot opt source               destination         

Chain FORWARD (policy DROP)
target     prot opt source               destination         

Chain OUTPUT (policy ACCEPT)
target     prot opt source               destination         

Chain IN_WEB (0 references) # 引用计数为0
target     prot opt source               destination 
```

-n： 自定义链的名称

## 2. 给自定义链添加规则

```bash
root@node1:~# iptables -I IN_WEB -s 172.16.10.100 -j REJECT
root@node1:~# iptables -t filter -nvL IN_WEB
Chain IN_WEB (0 references)
 pkts bytes target     prot opt in     out     source               destination         
    0     0 REJECT     all  --  *      *       172.16.10.100        0.0.0.0/0            reject-with icmp-port-unreachable
```

## 3. 引用自定义链

```bash
# iptables -I INPUT -p tcp --dport 80 -j IN_WEB
# iptables -L
Chain INPUT (policy ACCEPT)
target     prot opt source               destination         
IN_WEB     tcp  --  anywhere             anywhere             tcp dpt:http

Chain FORWARD (policy DROP)
target     prot opt source               destination         

Chain OUTPUT (policy ACCEPT)
target     prot opt source               destination         

Chain IN_WEB (1 references)
target     prot opt source               destination         
REJECT     all  --  172.16.10.100        anywhere             reject-with icmp-port-unreachable
```

## 4. 重命名自定义链

```bash
# iptables -E IN_WEB WEB
```

## 5. 删除

删除条件

1. 自定义链没有被任何默认链引用，即自定义链的引用计数为0
2. 自定义链中没有任何规则

```bash
# iptables -D INPUT 1
# iptables -t filter -F WEB
# iptables -X WEB
```

# 六、动作(target)

## 1. 基础动作

### 1. ACCEPT

### 2. DROP

## 2. 扩展动作

### 2.1. REJECT

常用选项：--reject-with　可以设置对方被拒绝时的提示信息

值：
icmp-port-unreachable 默认
icmp-net-unreachable
icmp-host-unreachabe
icmp-proto-unreachabe
icmp-net-prohibited
icmp-admin-prohibited

### 2.2. LOG

将符合条件的报文的相关信息记录到日志中

可用选项：

--log-level: [emerg|alert|crit|error|warning|notice|info|debug]
--log-prefix: 信息前缀（29个字符以内）

```bash
# 把想要主动连接22端口的报文及相关信息记录到日志中
# iptables -I INPUT -p tcp --dport 22 -m state --state NEW -j LOG --log-prefix "want-in-from-port-22"
```

### 2.3 SNAT

```bash
# iptables -t nat -A POSTROUTING -s 10.1.0.0/16 -j SNAT --to-source 172.16.0.101
```

-t: 操作nat表
-A: 将规则添加到POSTROUTING链末尾
-s: 源地址
-j: 使用 SNAT 动作
--to-source: 把匹配到的报文修改为指定地址

### 2.4 SNAT

```bash
# iptables -t nat -I PREROUTING -d 172.16.10.101 -p tcp --dport 3389 -j DNAT --to-destination 10.1.1.6:3389
```

### 2.5 MASQUERADE

与SNAT类似，但是可以动态的将源地址转换为可用的IP地址

```bash
# iptables -t nat -A POSTROUTING -s 10.1.0.0/16 -o eth0 -j MASQUERADE
```

### 2.6 REDIRECT

在本机进程端口映射

```bash
# iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-ports 8080
```

使用NAT需要开启转发：

```bash
# echo 1 > /proc/sys/net/ipv4/ip_forward
```

---

参考：

https://wiki.archlinux.org/index.php/iptables

## 拒绝与禁止一个数据包的区别

拒绝：丢弃数据包的同时给发送者返回一会ICMP错误消息

丢弃：数据包直接丢弃不返回任何通知

为了安全，通常直接丢弃，原因有3：

1. 发送错误消息会使通信量加倍
2. 响应的数据包可能是拒绝服务工具
3. 即使一个错误的消息都会给攻击者提供潜在的有用信息

