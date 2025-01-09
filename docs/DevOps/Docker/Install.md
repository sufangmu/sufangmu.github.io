## 一、环境准备

```bash
CentOS Linux release 7.9.2009 (Core)
```

## 二、卸载老版本

```bash
yum remove docker \
                  docker-client \
                  docker-client-latest \
                  docker-common \
                  docker-latest \
                  docker-latest-logrotate \
                  docker-logrotate \
                  docker-engine
```

## 三、添加YUM源

```bash
yum install -y yum-utils
# 官方的源，访问受限
# yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
# 阿里云的源
yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
```

## 四、查询可安装的版本

```bash
yum list docker-ce --showduplicates | sort -r
```

## 五、安装docker

### 1. 安装指定版本

```bash
yum install -y docker-ce-18.09.9-3.el7  docker-ce-cli-18.09.9-3.el7 containerd.io docker-buildx-plugin docker-compose-plugin
```

### 2. 启动docker

```bash
systemctl start docker
```

### 3. 确认docker是否启动成功

运行hello-world容器

```bash
docker run hello-world
```



> https://docs.docker.com/engine/install/centos/

> https://developer.aliyun.com/mirror/docker-ce





