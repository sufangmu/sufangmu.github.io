## 1 docker system df

```bash
$ docker system df
TYPE                TOTAL               ACTIVE              SIZE                RECLAIMABLE
Images              4                   1                   926.4MB             848.5MB (91%)
Containers          1                   1                   28B                 0B (0%)
Local Volumes       0                   0                   0B                  0B
Build Cache         0                   0                   0B                  0B
```

## 2. docker system events

获取docker daemon时间

```bash
$ docker system events
2023-10-17T06:18:35.991401205+08:00 container kill 27d70becba3afdbfdf51ce7b879bf3dc9276332b7db8c537baf683cdf01f50d1 (image=ubuntu, name=myubuntu, org.opencontainers.image.ref.name=ubuntu, org.opencontainers.image.version=22.04, signal=15)
```

## 3. docker system info

```bash
$ docker system info
Containers: 1
 Running: 0
 Paused: 0
 Stopped: 1
Images: 4
Server Version: 18.09.9
Storage Driver: overlay2
 Backing Filesystem: xfs
 Supports d_type: true
 Native Overlay Diff: true
Logging Driver: json-file
Cgroup Driver: cgroupfs
Plugins:
 Volume: local
 Network: bridge host macvlan null overlay
 Log: awslogs fluentd gcplogs gelf journald json-file local logentries splunk syslog
Swarm: inactive
Runtimes: runc
Default Runtime: runc
Init Binary: docker-init
containerd version: 61f9fd88f79f081d64d6fa3bb1a0dc71ec870523
runc version: N/A
init version: fec3683
Security Options:
 seccomp
  Profile: default
Kernel Version: 3.10.0-1160.el7.x86_64
Operating System: CentOS Linux 7 (Core)
OSType: linux
Architecture: x86_64
CPUs: 2
Total Memory: 1.777GiB
Name: host136
ID: HP3F:VDSB:UNQB:RFI2:VIOV:H6UG:TQ6M:T6DE:XVIP:XDM7:DNVD:OOAH
Docker Root Dir: /var/lib/docker
Debug Mode (client): false
Debug Mode (server): false
Registry: https://index.docker.io/v1/
Labels:
Experimental: false
Insecure Registries:
 127.0.0.0/8
Live Restore Enabled: false
Product License: Community Engine

WARNING: bridge-nf-call-iptables is disabled
WARNING: bridge-nf-call-ip6tables is disabled
```

## 4. docker system prune

强制删除所有未使用的容器和镜像

```bash
$ docker system prune -a -f
```

