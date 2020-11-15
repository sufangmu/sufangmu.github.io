

Ansible是主流的自动化运维工具之一，类似产品还有Chef、Puppet、SaltStack等。第一个版本是0.0.1,发布于2012年3月9日。

## 一、Ansible简介

### 1、Ansible架构

1. 引擎：Ansible
2. 模块：
3. 核心模块（core modules）:自带模块
   自定义模块（custom modules）

4. 插件（plugins）:模块功能的补充，借助插件完成记录日志、邮件功能
5. 剧本（playbooks）:任务配置文件，可以包含多个任务。
6. 连接插件（connectior plugins）:通过连接插件连接到被管理主机，默认使用SSH。还支持Zeromq、local连接方式
7. 主机清单（host inventory）:定义被管理节点

### 2、Ansible实现原理

Ansible执行命令时，通过其底层传输模块，将一个或多个文件，或者定义一个Play或Command命令传输到远程服务器的/tmp目录的临时文件，并在远程执行这些Play/Command，然后删除临时文件并返回命令的执行结果

Ansible的通信发展史：

1. 使用Paramiko
2. OpenSSH(1.3默认使用)
3. accelerate加速模式
4. Faster OpenSSH in Ansible 1.5+(pipelining加速方式)

### 3、Ansible特点

1. 语法简单：基于YAML
2. 无客户端：不需要安装客户端，通过SSH连接被管理主机
3. Push退送
4. 大量内置模块：“ansible-doc -l”可以查看已有的模块
5. 等幂性（idempotent）：已经在被管理端执行过的剧本不会再执行


### 4、主要用途

1. 应用部署
2. 配置管理
3. 任务流编排


### 5、安装

在Ubuntu上安装

```bash
sudo apt update
sudo apt-get install software-properties-common
sudo apt-add-repository --yes  ppa:ansible/ansible:2.7.6
sudo apt update
sudo apt-get install ansible
```

### 6、目录结构

1. 配置目录：/etc/ansible，功能：Inventory主机信息配置，Ansible工具配置
2. 执行目录：/usr/bin/，功能：ansible默认命令存放目录
3. lib库依赖目录:/usr/lib/python2.7/dist-packages/ansible/*
4. 帮助文档目录：/usr/share/doc/ansible/*
5. man文档目录：/usr/share/man/man1/

### 7、与其他工具的对比

| 工具 | Ansible  | Puppet | Chef | SaltStack |
| ---- | -------- | ------ | ---- | --------- |
| 语言 | Python   | Ruby   | Ruby | Python    |
| 架构 | 无Client | C/S    | C/S  | C/S       |

### 8、Ansible的配置文件读取

1. 环境变量中的ANSIBLE_CONFIG
2. 当前目录下的ansible.cfg
3. ~/.ansible.cfg
4. /etc/ansible/ansible.cfg

## 二、基本用法

### 1、Ansible命令执行方式：

1. Ad-Doc   用于执行临时命令
2. Ansible-playbooks
3. Tower（图形化，商业版）

使用前先认证：

```bash
ubuntu@server:~$ ssh-copy-id ubuntu@172.16.10.101
/usr/bin/ssh-copy-id: ERROR: No identities found
ubuntu@server:~$ ssh-keygen 
Generating public/private rsa key pair.
Enter file in which to save the key (/home/ubuntu/.ssh/id_rsa): 
Created directory '/home/ubuntu/.ssh'.
Enter passphrase (empty for no passphrase): 
Enter same passphrase again: 
Your identification has been saved in /home/ubuntu/.ssh/id_rsa.
Your public key has been saved in /home/ubuntu/.ssh/id_rsa.pub.
The key fingerprint is:
c6:31:74:1b:03:56:63:00:24:1f:45:10:79:60:cf:e8 ubuntu@server
The key's randomart image is:
+--[ RSA 2048]----+
|    ..OOB+B      |
|     +.B.o =     |
|      o.= .      |
|     . . o       |
|      E S        |
|       .         |
|                 |
|                 |
|                 |
+-----------------+
ubuntu@server:~$ ssh-copy-id ubuntu@172.16.10.101
The authenticity of host '172.16.10.101 (172.16.10.101)' can't be established.
ECDSA key fingerprint is cd:f2:2a:0b:33:25:ba:94:36:6b:43:f7:02:e4:1c:d2.
Are you sure you want to continue connecting (yes/no)? yes
/usr/bin/ssh-copy-id: INFO: attempting to log in with the new key(s), to filter out any that are already installed
/usr/bin/ssh-copy-id: INFO: 1 key(s) remain to be installed -- if you are prompted now it is to install the new keys
ubuntu@172.16.10.101's password: 

Number of key(s) added: 1

Now try logging into the machine, with:   "ssh 'ubuntu@172.16.10.101'"
and check to make sure that only the key(s) you wanted were added.

```

### 2、ansible系列命令

1. ansible

   使用场景：临时一次性操作、二次开发接口调用

2. ansible-galaxy

   使用场景：从 https://galaxy.ansible.com 下载Roles

3. ansible-pull 

   使用场景：需要配置的机器数量巨大

4. ansible-doc

   使用场景：查看ansible模块的说明 

   查看支持的模块：

   ```bash
   ubuntu@server:~$ ansible-doc -l | wc -l
   2080
   ```

5. ansible-playbook   

   使用场景：读取预先编写的playbook文件实现批量管理

6. ansible-vault 

   使用场景：配置文件加密

```bash
  # 加密yml文件
  ansible-vault encrypt example.yml
```

7. ansible-console

   使用场景：交互式使用ansible命令

### 3、 Ansible Inventory配置

Inventory是Ansible配置主机信息的配置文件。默认存放在/etc/ansible/hosts,使用时可以使用-i指定文件

```bash
# 1. 直接为IP地址
192.168.1.100
# 2. 主机名方式
mysql.company.com
# 3. ssh端口不是22的主机定义
mysql.company.com:2222
# 4. 有规律的主机
192.168.1.[101:103] # 表示101 102 103
mysql[abc].company.com  # mysqla mysqlb mysqlc
# 5. 定义组
[web]
web1.company.com
web2.company.com
web3.company.com
# 6. 组嵌套
[nginx]
node1.company.com
node2.company.com
[tomcat]
node4.company.com
node5.company.com
[web:children]
nginx
tomcat

```

### 4. 变量

变量检索顺序

1. Inventory配置文件
2. Playbook中var定义的区域
3. Roles中vars目录下的文件
4. Roles同级目录group_vars和hosts_vars目录下的文件

```bash
# 1. 主机变量
[web]
host1 http_port=80

# 2. 组变量
[web:vars]
ntp_server=ntp.atlanta.example.com


```

### 5. Ad-Hoc使用

基本模块使用：

执行sudo

ansible sw3 -m command  -b  -K -a "docker images"
ansible all -m command -i hosts -a "free -h"

使用场景

1. 对服务器进行健康检查
2. 其中一个或一组主机进行更改




## 三、Playbook

ansible的任务配置文件称为playbook(剧本)，每一个剧本都包含一系列的play。

### 1. 格式

ansible采用YAML语法编写，有两种格式：

1. 多行缩进(建议使用)

官方示例：

```yaml
---                     # 需要以---开始，且要顶行首写
# 可以在这里简要说明playbook的功能(可选)
- hosts: webservers     # 选择在哪些主机执行下面的play
  vars:                 # 定义的变量
    http_port: 80
    max_clients: 200
  remote_user: root
  tasks:                # 指定一系列将要运行的任务
  - name: ensure apache is at the latest version
    yum:
      name: httpd
      state: latest
  - name: write the apache config file
    template:
      src: /srv/httpd.j2
      dest: /etc/httpd.conf
    notify:
    - restart apache
  - name: ensure apache is running
    service:
      name: httpd
      state: started
  handlers:
    - name: restart apache
      service:
        name: httpd
        state: restarted
```

2. 单行缩写


### 2. Handler：

#### 1.notify 触发handler

```yaml
  tasks:
    - name: 开启apache rewrite
      apache2_module:
        name: rewrite
        state: present
  handlers:
    - name: restart apache
      service:
        name: httpd
        state: restarted
```

##### 2.handler 调用 handler

```yaml
  handlers:
    - name: restart apache
      service:
        name: httpd
        state: restarted
      notify: restart memcached

    - name: restart memcached
      service:
        name: memcached
        state: restarted
     
```

注意： 

1. handler只有在其所在的任务被执行时，才会被运行
2. handler只会在play的末尾运行一次


### 3. 变量

#### 1.命名规则

1. 以英文大小写字母开头
2. 中间可以包含下划线(_)和数字

#### 2.变量的定义

##### 1.在vars代码块定义变量

```yaml
---
- hosts: test
  vars:
    foo: bar
  tasks:
    - debug: msg="var foo is set to {{ foo }}"
```

##### 2. 把变量定义到单独的文件中

```bash
$ cat vars.yml
---
foo: bar
```

```yaml
---
- hosts: test
  vars_files:
    - vars.yml
  tasks:
    - debug: msg="var foo is set to {{ foo }}"
```

##### 3. 在Inventory文件中定义变量（不建议）

1. 为某台主机指定变量

```yaml
app1.example.com proxy_state=present
```

2. 为主机组定义变量

```yaml
[web]
node1
node2
[web:vars]
http_port: 80
```

在执行ansible命令时，ansible默认会从/etc/ansible/host_vars和/etc/ansible/group_vars两个目录下读取变量定义，可以在
这两个目录中创建与hosts文件中主机名或组名同名的文件来定义变量，例如：

```bash
$ cat /etc/ansible/group_vars/web
---
http_port: 80

```

#### 4. 注册变量

将操作的结果，包括标准输出和标准错误输出保存到变量中，这个过程中用来保存操作结果的变量就叫**注册变量**。
在playbook中使用register来声明一个变量为注册变量。

```yaml
- shell: my_command_here
  register: my_command_result

```

使用stdout方法来读取标准输出内容：my_command_result.stdout
使用stderr方法来读取错误输出内容：my_command_result.stderr


#### 5. facts信息

在运行任何一个playbook之前，ansible默认会先抓取playbook中所指定的所有主机的系统信息，这些信息称为facts。

```bash
ubuntu@server:~/test$ ansible-playbook test.yml

PLAY [web] *************************************************************************************************************************************************************************************************************************

TASK [Gathering Facts] *************************************************************************************************************************************************************************************************************
ok: [172.16.10.100]

TASK [debug] ***********************************************************************************************************************************************************************************************************************
ok: [172.16.10.100] => {
    "msg": "var http_port is set to 80"
}

PLAY RECAP *************************************************************************************************************************************************************************************************************************
172.16.10.100              : ok=2    changed=0    unreachable=0    failed=0
```

facts信息的获取

```bash
$ ansible web -m setup
172.16.10.100 | SUCCESS => {
    "ansible_facts": {
        "ansible_all_ipv4_addresses": [
            "172.16.10.100",
            "10.0.3.15"
        ],
        "ansible_all_ipv6_addresses": [
            "fe80::a00:27ff:fe15:7966",
            "fe80::a00:27ff:fef4:8f74"
        ],
```

常用的facts变量：ansible_os_family,ansible_hostname,ansible_memtotal_mb。

如果需要在执行playbook之前跳过收集facts信息这一不可以在playbook中设置gather_facts：

```yaml
---
- hosts: web
  gather_facts: no
```

**本地facts变量**

在远程主机本地定义facts变量

需要把定义的变量写进一个以.fact结尾的文件中（放在/etc/ansible/facts.d/），这个文件可以是json或ini文件，或者是可以返回json代码的可执行文件



#### 6. 变量的优先级

由高到低排序

1. 在命令行中定义的变量(即用-e定义的变量)
2. 在Inventory中定义的连接变量，如ansible_ssh_user
3. 大多数其他变量(play中的变量，included中的变量，role中的变量)
4. 在Inventory中定义的变量
5. 由系统通gather_facts方法发现的变量
6. role默认变量


### 4. 流程控制 if/then/when

## when 

在特定的条件下执行任务

```yaml
---
- hosts: web
  tasks:
    - name: 测试php是否安装
      shell: php --version
      register: php_version
    - name: 如果安装就执行下面的操作
      debug:
        msg: "php 安装了"
      when: "'7.0' in php_version.stdout"
```

## changed_when、failed_when

根据任务运行返回结果判断任务的运行结果是否真的符合我们的预期



### 5. 任务间流程控制

#### 1.任务暂停

一些服务的运行需要等待一些状态的恢复，比如一台主机或应用刚重启，需要等待它上面的端口开启，此时
就不得不将正在运行的任务暂停，直到状态满足我们的需求

```yaml
---
- hosts: web
  tasks:
    - name: 等待web重启
      local_action:
        module: wait_for
        host: nginx
        port: 80
        delay: 10
        timeout: 300
        state: started
    - name: 重启后继续
      debug:
         msg:  "重启后执行后续操作"
```

### 6. 交互式提示

vars_prompt模块会在所有play执行前先执行，其优先级高于Gathering Facts。

```yaml
---
- hosts: web
  vars_prompt:
    - name: username
      prompt: "username"
      default: "root"   # 设置默认值
    - name: password
      prompt: "password"
      private: yes     # 输入密码不可见
      confirm: yes     # 要求输入两次
  tasks:
    - name: 输出密码
      debug:
        msg: "{{ username }} {{ password }}"
```

### 7. 标签

标签功能可以给角色、文件、单独的任务打上标签，然后利用标签来指定要运行playbook中的个别任务或不执行指定的任务。

```yaml
- hosts: rabbitmq
  tags: rabbitmq
  roles:
    - rabbitmq
```

执行带指定标签的任务

```bash
ansible-playbook --tags "rabbitmq" test.yml
```

跳过带指定标签的任务

```bash
ansible-playbook --skip-tags "rabbitmq" test.yml
```

可以加多个标签

```yaml
tags:
  - one
  - two

# or

tags: ['one', 'two']
```



### 8. block块

2.0以后的版本引入，块功能可以将任务进行分组，并且可以在块级别上应用任务变量。块还可以块内部的任务异常

#### 1.示例 

```yaml
 tasks:
   - name: Install Apache
     block:
       - yum:
           name: "{{ item }}"
           state: installed
         with_items:
           - httpd
           - memcached
       - template:
           src: templates/src.j2
           dest: /etc/foo.conf
       - service:
           name: bar
           state: started
           enabled: True
     when: ansible_facts['distribution'] == 'CentOS'
     become: true
     become_user: root
```

#### 2.错误处理

```yaml
- name: Attempt and graceful roll back demo
  block:
    - debug:
        msg: 'I execute normally'
    - name: i force a failure
      command: /bin/false
    - debug:
        msg: 'I never execute, due to the above task failing, :-('
  rescue:  # 出错时执行
    - debug:
        msg: 'I caught an error'
    - name: i force a failure in middle of recovery! >:-)
      command: /bin/false
    - debug:
        msg: 'I also never execute :-('
  always: # 无论结果如何都执行
    - debug:
        msg: "This always executes"
```

### 9. Include

#### 1. 基本用法

```yaml
tasks:
- include: other.yml
```

#### 2. 动态加载

在满足一定条件时加载Include 

```yaml
- include: test.yml
  when: 
```