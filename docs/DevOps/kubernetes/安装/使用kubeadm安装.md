## 一、安装环境

| OS                                   | kernel                 | hostname   | IP            |
| ------------------------------------ | ---------------------- | ---------- | ------------- |
| CentOS Linux release 7.9.2009 (Core) | 3.10.0-1160.el7.x86_64 | k8s-master | 192.168.1.131 |
| CentOS Linux release 7.9.2009 (Core) | 3.10.0-1160.el7.x86_64 | k8s-hode1  | 192.168.1.132 |
| CentOS Linux release 7.9.2009 (Core) | 3.10.0-1160.el7.x86_64 | k8s-hode2  | 192.168.1.133 |

## 二、环境准备

### 1. 修改主机名

在master执行

```bash
[root@localhost ~]# hostnamectl set-hostname k8s-master
```

在node1执行

```bash
[root@localhost ~]# hostnamectl set-hostname k8s-node1
```

在node2执行

```bash
[root@localhost ~]# hostnamectl set-hostname k8s-node2
```

### 2. 配置域名解析

修改3个结点的`/etc/hosts`，添加以下内容

```shell
192.168.1.131 k8s-master
192.168.1.132 k8s-node1
192.168.1.133 k8s-node2
```

### 3. 关闭防火墙

所有节点关闭`firewalld`

```bash
systemctl stop firewalld && systemctl disable firewalld
```

所有节点关闭`selinux`

```bash
# 永久关闭，需要重启
sed -i 's/SELINUX=enforcing/SELINUX=disabled/g' /etc/selinux/config
# 临时关闭，重启失效
setenforce 0
```

### 4. 禁用`swap`

所有节点禁用`swap`

```bash
# 永久关闭，重启生效 
sed -i /swap/'s/^/#/g' /etc/fstab
# 临时关闭重启失效
swapoff -a
```

### 5. 修改yum源

```bash
curl -o /etc/yum.repos.d/CentOS-Base.repo https://mirrors.aliyun.com/repo/Centos-7.repo
sed -i -e '/mirrors.cloud.aliyuncs.com/d' -e '/mirrors.aliyuncs.com/d' /etc/yum.repos.d/CentOS-Base.repo
yum makecache
```

### 6. 添加docker源

```bash
# 安装必要的一些系统工具
yum install -y yum-utils device-mapper-persistent-data lvm2
# 添加软件源信息
yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
sed -i 's+download.docker.com+mirrors.aliyun.com/docker-ce+' /etc/yum.repos.d/docker-ce.repo
# 更新并安装Docker-CE
yum makecache fast
# 查找Docker-CE版本
yum list docker-ce.x86_64 --showduplicates | sort -r
# 安装指定版本Docker-CE
yum install -y docker-ce-20.10.9-3.el7
# 启动docker并设置开机自启
systemctl start docker && systemctl enable docker
```

> 参考：https://developer.aliyun.com/mirror/docker-ce?spm=a2c6h.13651102.0.0.43cc1b11BaC9Fz

### 7. 设置cgroup驱动为systemd

```bash
cat << EOF > /etc/docker/daemon.json
{
   "exec-opts": ["native.cgroupdriver=systemd"]
}
EOF
```

### 8. 修改内核参数

```bash
cat > /etc/sysctl.d/k8s.conf << EOF
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
net.ipv4.ip_forward = 1
EOF
sysctl --system
```

### 9. 重启服务器

```bash
reboot
```

## 三、安装`kubernetes`

### 1. 导入`kubernetes`源

所有节点配置阿里源

```bash
cat <<EOF > /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64/
enabled=1
gpgcheck=0
repo_gpgcheck=0
gpgkey=https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg https://mirrors.a
EOF
yum makecache
```

> 参考： https://developer.aliyun.com/mirror/kubernetes?spm=a2c6h.13651102.0.0.43cc1b11Vw0aXX

### 2. 安装指定版本的kubeadm、 kubelet和kubectl

所有节点安装

```bash
yum install -y kubeadm-1.22.11 kubectl-1.22.11 kubelet-1.22.11
```

所以结点启动kubelet

```bash
systemctl start kubelet && systemctl enable kubelet
```



### 3. 获取默认初始化参数文件并修改

在master节点用kubeadm获取默认参数并保存到文件中

```bash
kubeadm config print init-defaults > init-default.yaml
```

修改默认参数为如下

```yaml
apiVersion: kubeadm.k8s.io/v1beta3
bootstrapTokens:
- groups:
  - system:bootstrappers:kubeadm:default-node-token
  token: abcdef.0123456789abcdef
  ttl: 24h0m0s
  usages:
  - signing
  - authentication
kind: InitConfiguration
localAPIEndpoint:
  advertiseAddress: 192.168.1.131  # master节点IP
  bindPort: 6443
nodeRegistration:
  criSocket: /var/run/dockershim.sock
  imagePullPolicy: IfNotPresent
  name: k8s-master  # master节点主机名
  taints: null
---
apiServer:
  timeoutForControlPlane: 4m0s
apiVersion: kubeadm.k8s.io/v1beta3
certificatesDir: /etc/kubernetes/pki
clusterName: kubernetes
controllerManager: {}
dns: {}
etcd:
  local:
    dataDir: /var/lib/etcd
imageRepository: daocloud.io/daocloud  # 镜像仓库
kind: ClusterConfiguration
kubernetesVersion: 1.22.0
networking:
  dnsDomain: cluster.local
  podSubnet: 172.168.0.0/16  # 添加pod子网
  serviceSubnet: 10.96.0.0/12
scheduler: {}
```

### 4. 提前拉取需要的镜像

```bash
kubeadm  config images pull --config=init-default.yaml
```

### 5. 初始化master

```bash
kubeadm init --config=init-default.yaml
```

> 如果初始化失败，执行kubeadm reset后重新初始化

初始化成功日志如下：

```bash
[init] Using Kubernetes version: v1.22.0
[preflight] Running pre-flight checks
[preflight] Pulling images required for setting up a Kubernetes cluster
[preflight] This might take a minute or two, depending on the speed of your internet connection
[preflight] You can also perform this action in beforehand using 'kubeadm config images pull'
[certs] Using certificateDir folder "/etc/kubernetes/pki"
[certs] Generating "ca" certificate and key
[certs] Generating "apiserver" certificate and key
[certs] apiserver serving cert is signed for DNS names [k8s-master kubernetes kubernetes.default kubernetes.default.svc kubernetes.default.svc.cluster.local] and IPs [10.96.0.1 192.168.1.131]
[certs] Generating "apiserver-kubelet-client" certificate and key
[certs] Generating "front-proxy-ca" certificate and key
[certs] Generating "front-proxy-client" certificate and key
[certs] Generating "etcd/ca" certificate and key
[certs] Generating "etcd/server" certificate and key
[certs] etcd/server serving cert is signed for DNS names [k8s-master localhost] and IPs [192.168.1.131 127.0.0.1 ::1]
[certs] Generating "etcd/peer" certificate and key
[certs] etcd/peer serving cert is signed for DNS names [k8s-master localhost] and IPs [192.168.1.131 127.0.0.1 ::1]
[certs] Generating "etcd/healthcheck-client" certificate and key
[certs] Generating "apiserver-etcd-client" certificate and key
[certs] Generating "sa" key and public key
[kubeconfig] Using kubeconfig folder "/etc/kubernetes"
[kubeconfig] Writing "admin.conf" kubeconfig file
[kubeconfig] Writing "kubelet.conf" kubeconfig file
[kubeconfig] Writing "controller-manager.conf" kubeconfig file
[kubeconfig] Writing "scheduler.conf" kubeconfig file
[kubelet-start] Writing kubelet environment file with flags to file "/var/lib/kubelet/kubeadm-flags.env"
[kubelet-start] Writing kubelet configuration to file "/var/lib/kubelet/config.yaml"
[kubelet-start] Starting the kubelet
[control-plane] Using manifest folder "/etc/kubernetes/manifests"
[control-plane] Creating static Pod manifest for "kube-apiserver"
[control-plane] Creating static Pod manifest for "kube-controller-manager"
[control-plane] Creating static Pod manifest for "kube-scheduler"
[etcd] Creating static Pod manifest for local etcd in "/etc/kubernetes/manifests"
[wait-control-plane] Waiting for the kubelet to boot up the control plane as static Pods from directory "/etc/kubernetes/manifests". This can take up to 4m0s
[apiclient] All control plane components are healthy after 8.003986 seconds
[upload-config] Storing the configuration used in ConfigMap "kubeadm-config" in the "kube-system" Namespace
[kubelet] Creating a ConfigMap "kubelet-config-1.22" in namespace kube-system with the configuration for the kubelets in the cluster
[upload-certs] Skipping phase. Please see --upload-certs
[mark-control-plane] Marking the node k8s-master as control-plane by adding the labels: [node-role.kubernetes.io/master(deprecated) node-role.kubernetes.io/control-plane node.kubernetes.io/exclude-from-external-load-balancers]
[mark-control-plane] Marking the node k8s-master as control-plane by adding the taints [node-role.kubernetes.io/master:NoSchedule]
[bootstrap-token] Using token: abcdef.0123456789abcdef
[bootstrap-token] Configuring bootstrap tokens, cluster-info ConfigMap, RBAC Roles
[bootstrap-token] configured RBAC rules to allow Node Bootstrap tokens to get nodes
[bootstrap-token] configured RBAC rules to allow Node Bootstrap tokens to post CSRs in order for nodes to get long term certificate credentials
[bootstrap-token] configured RBAC rules to allow the csrapprover controller automatically approve CSRs from a Node Bootstrap Token
[bootstrap-token] configured RBAC rules to allow certificate rotation for all node client certificates in the cluster
[bootstrap-token] Creating the "cluster-info" ConfigMap in the "kube-public" namespace
[kubelet-finalize] Updating "/etc/kubernetes/kubelet.conf" to point to a rotatable kubelet client certificate and key
[addons] Applied essential addon: CoreDNS
[addons] Applied essential addon: kube-proxy

Your Kubernetes control-plane has initialized successfully!

To start using your cluster, you need to run the following as a regular user:

  mkdir -p $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config

Alternatively, if you are the root user, you can run:

  export KUBECONFIG=/etc/kubernetes/admin.conf

You should now deploy a pod network to the cluster.
Run "kubectl apply -f [podnetwork].yaml" with one of the options listed at:
  https://kubernetes.io/docs/concepts/cluster-administration/addons/

Then you can join any number of worker nodes by running the following on each as root:

kubeadm join 192.168.1.131:6443 --token abcdef.0123456789abcdef \
	--discovery-token-ca-cert-hash sha256:d69ebb8ea99fa9933bf12cbe024e143bd2f44e1bd6ff72a2f3e725a619e020ee
```

### 6. 安装calico

下载配置文件

```bash
curl https://docs.projectcalico.org/manifests/calico.yaml  -O
```

修改CIDR

```shell
   4442             - name: CALICO_IPV4POOL_CIDR
   4443               value: "172.168.0.0/16"
```

部署calico

```bash
kubectl apply -f calico.yaml
```

### 7. node结点加入集群

分别在node1和node2执行

```bash
kubeadm join 192.168.1.131:6443 --token abcdef.0123456789abcdef \
	--discovery-token-ca-cert-hash sha256:d69ebb8ea99fa9933bf12cbe024e143bd2f44e1bd6ff72a2f3e725a619e020ee
```

> 添加成功后在master查看节点状态kubectl get nodes

### 8. 部署Metrics

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

### 9. 部署buboard

```bash
kubectl apply -f https://addons.kuboard.cn/kuboard/kuboard-v3.yaml
```

