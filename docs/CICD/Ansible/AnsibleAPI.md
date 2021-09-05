## 一、官方示例

Ansible 2.7 API文档：https://docs.ansible.com/ansible/2.7/dev_guide/developing_api.html

官方提供的示例代码：

```python
#!/usr/bin/env python

import json
import shutil
from collections import namedtuple
from ansible.parsing.dataloader import DataLoader
from ansible.vars.manager import VariableManager
from ansible.inventory.manager import InventoryManager
from ansible.playbook.play import Play
from ansible.executor.task_queue_manager import TaskQueueManager
from ansible.plugins.callback import CallbackBase
import ansible.constants as C

class ResultCallback(CallbackBase):
    """A sample callback plugin used for performing an action as results come in

    If you want to collect all results into a single object for processing at
    the end of the execution, look into utilizing the ``json`` callback plugin
    or writing your own custom callback plugin
    """
    def v2_runner_on_ok(self, result, **kwargs):
        """Print a json representation of the result

        This method could store the result in an instance attribute for retrieval later
        """
        host = result._host
        print(json.dumps({host.name: result._result}, indent=4))

# since API is constructed for CLI it expects certain options to always be set, named tuple 'fakes' the args parsing options object
Options = namedtuple('Options', ['connection', 'module_path', 'forks', 'become', 'become_method', 'become_user', 'check', 'diff'])
options = Options(connection='local', module_path=['/to/mymodules'], forks=10, become=None, become_method=None, become_user=None, check=False, diff=False)

# initialize needed objects
loader = DataLoader() # Takes care of finding and reading yaml, json and ini files
passwords = dict(vault_pass='secret')

# Instantiate our ResultCallback for handling results as they come in. Ansible expects this to be one of its main display outlets
results_callback = ResultCallback()

# create inventory, use path to host config file as source or hosts in a comma separated string
inventory = InventoryManager(loader=loader, sources='localhost,')

# variable manager takes care of merging all the different sources to give you a unifed view of variables available in each context
variable_manager = VariableManager(loader=loader, inventory=inventory)

# create datastructure that represents our play, including tasks, this is basically what our YAML loader does internally.
play_source =  dict(
        name = "Ansible Play",
        hosts = 'localhost',
        gather_facts = 'no',
        tasks = [
            dict(action=dict(module='shell', args='ls'), register='shell_out'),
            dict(action=dict(module='debug', args=dict(msg='{{shell_out.stdout}}')))
         ]
    )

# Create play object, playbook objects use .load instead of init or new methods,
# this will also automatically create the task objects from the info provided in play_source
play = Play().load(play_source, variable_manager=variable_manager, loader=loader)

# Run it - instantiate task queue manager, which takes care of forking and setting up all objects to iterate over host list and tasks
tqm = None
try:
    tqm = TaskQueueManager(
              inventory=inventory,
              variable_manager=variable_manager,
              loader=loader,
              options=options,
              passwords=passwords,
              stdout_callback=results_callback,  # Use our custom callback instead of the ``default`` callback plugin, which prints to stdout
          )
    result = tqm.run(play) # most interesting data for a play is actually sent to the callback's methods
finally:
    # we always need to cleanup child procs and the structres we use to communicate with them
    if tqm is not None:
        tqm.cleanup()

    # Remove ansible tmpdir
    shutil.rmtree(C.DEFAULT_LOCAL_TMP, True)
```

## 二、开发环境准备

### 1. 安装`ansible`

```bash
pip3 install ansible==2.7.18
```

### 2. 安装`sshpass`

```bash
sudo apt install sshpass
```

如果环境上没有sshpass，会在执行时出现如下的抱错信息

```bash
FAILED! => {"msg": "to use the 'ssh' connection type with passwords, you must install the sshpass program"}
```

### 3. 客户端机器准备

客户端需要存在`/usr/bin/python`

## 三、核心类

### 1. 核心类介绍

```python
from ansible.parsing.dataloader import DataLoader  # 从文件或者字符串中解析YAML或JSON格式的内容
from ansible.vars.manager import VariableManager  # 主机和主机组的变量管理器
from ansible.inventory.manager import InventoryManager  # 创建和管理inventory
from ansible.playbook.play import Play  # 用于执行 Ad-hoc 的类 ,需要传入相应的参数
from ansible.executor.task_queue_manager import TaskQueueManager  # 底层用到的任务队列管理器
from ansible.executor.playbook_executor import PlaybookExecutor  # 执行playbook的核心类
from ansible.plugins.callback import CallbackBase  # 处理任务执行后返回的状态
from ansible.inventory.host import Host, Group  # 操作单个主机和主机组
```

### 2. `InventoryManager`对象

在脚本路径下创建一个hosts文件

```shell
[nginx]
10.0.0.128 ansible_ssh_user=root ansible_ssh_pass='root'
```

```python
#!/usr/bin/env python3

from ansible.parsing.dataloader import DataLoader
from ansible.inventory.manager import InventoryManager

# 数据解析器，解析yaml, json 和 ini 文件
loader = DataLoader()

# 返回资产相关的实例对象
# sources可以是1  [配置文件路径,] 2 用逗号分隔的主机字符串
inventory = InventoryManager(loader=loader, sources=['hosts', ])

# InventoryManager对象常用方法
# 查看主机组资源
print(inventory.get_groups_dict())  # {'all': ['10.0.0.128'], 'ungrouped': [], 'nginx': ['10.0.0.128']}
print(inventory.get_hosts())  # [10.0.0.128]

# 添加一个主机组
inventory.add_group('mysql')
# 添加一个主机到主机组
inventory.add_host(host='10.0.0.131', group='mysql')

print(inventory.get_groups_dict())  # {'all': ['10.0.0.128'], 'ungrouped': [], 'nginx': ['10.0.0.128'], 'mysql': ['10.0.0.131']}
print(inventory.get_hosts())  # [10.0.0.128]

# 获取主机对象
host = inventory.get_host('10.0.0.128')  # 没有找到返回None
```

### 3. `VariableManager`对象

```python
#!/usr/bin/env python3

from ansible.parsing.dataloader import DataLoader
from ansible.inventory.manager import InventoryManager
from ansible.vars.manager import VariableManager

loader = DataLoader()
inventory = InventoryManager(loader=loader, sources=['hosts', ])
variable_manager = VariableManager(loader=loader, inventory=inventory)

# 查看变量
print(variable_manager.get_vars())
# {
# 'playbook_dir': '/home/sufangmu/PycharmProjects/AnsibleApi',
# 'ansible_playbook_python': '/home/sufangmu/PycharmProjects/AnsibleApi/venv/bin/python',
# 'groups': {'all': ['10.0.0.128'], 'ungrouped': [], 'nginx': ['10.0.0.128']},
# 'omit': '__omit_place_holder__9b6cf1a7b8c467643be6b872df9d5a2f9339deb5'
# }

# 查看主机变量
print(variable_manager.get_vars(host=inventory.get_host('10.0.0.128')))
# {
# 'inventory_file': '/home/sufangmu/PycharmProjects/AnsibleApi/hosts',
# 'inventory_dir': '/home/sufangmu/PycharmProjects/AnsibleApi',
# 'ansible_ssh_user': 'root',
# 'ansible_ssh_pass': 'root',
# 'inventory_hostname': '10.0.0.128',
# 'inventory_hostname_short': '10',
# 'group_names': ['nginx'],
# 'ansible_facts': {},
# 'playbook_dir': '/home/sufangmu/PycharmProjects/AnsibleApi',
# 'ansible_playbook_python': '/home/sufangmu/PycharmProjects/AnsibleApi/venv/bin/python',
# 'groups': {'all': ['10.0.0.128'], 'ungrouped': [], 'nginx': ['10.0.0.128']},
# 'omit': '__omit_place_holder__a0e7d6a9b4c638536744031013463f4014bc9235'
# }

# 设置主机变量
variable_manager.set_host_variable(host=inventory.get_host('10.0.0.128'), varname='ansible_ssh_pass', value='123456')

# 添加扩展变量
extra_vars = {'webdir': '/data/www'}
variable_manager.extra_vars = extra_vars
```

### 4. 执行`Ad-hoc`命令

```python
#!/usr/bin/env python3
from collections import namedtuple

from ansible.executor.task_queue_manager import TaskQueueManager
from ansible.parsing.dataloader import DataLoader
from ansible.inventory.manager import InventoryManager
from ansible.playbook.play import Play
from ansible.vars.manager import VariableManager

loader = DataLoader()
inventory = InventoryManager(loader=loader, sources=['hosts', ])
variable_manager = VariableManager(loader=loader, inventory=inventory)
Options = namedtuple('Options',
                     ['connection',
                      'module_path',
                      'forks',
                      'become',
                      'become_method',
                      'become_user',
                      'check',
                      'diff']
                     )

options = Options(connection='smart',  # local 连接本地机器 smart 连接远程机器
                  module_path=None,
                  forks=10,
                  become=None,
                  become_method=None,
                  become_user=None,
                  check=False,
                  diff=False)

# 创建task
play_source = dict(
    name="Ansible Play",  # 任务的名称
    hosts='all',  # 执行任务的目标主机 组名或主机，或all
    gather_facts='no',
    tasks=[
        dict(action=dict(module='shell', args='ls'), register='shell_out'),
        dict(action=dict(module='debug', args=dict(msg='{{shell_out.stdout}}')))
    ]
)
# 创建play对象
play = Play().load(play_source, variable_manager=variable_manager, loader=loader)

passwords = dict()
tqm = TaskQueueManager(
    inventory=inventory,
    variable_manager=variable_manager,
    loader=loader,
    options=options,
    passwords=passwords,
)
result = tqm.run(play)

```

执行结果

```bash
PLAY [Ansible Play] ************************************************************

TASK [shell] *******************************************************************
changed: [10.0.0.128]

TASK [debug] *******************************************************************
ok: [10.0.0.128] => {
    "msg": "hello.txt\nhelloworld.txt\npackages"
}

Process finished with exit code 0
```

### 5. 执行`playbook`命令

创建playbook

```yaml
---
- hosts: all
  remote_user: root
  vars:
    filename: helloworld.txt
  tasks:
    - name: create new file
      file: name={{ filename }} state=touch
```

执行脚本

```python
#!/usr/bin/env python3
# _*_ coding:utf-8 _*_
# Playbook方式
from collections import namedtuple
from ansible.parsing.dataloader import DataLoader
from ansible.vars.manager import VariableManager
from ansible.inventory.manager import InventoryManager
from ansible.executor.playbook_executor import PlaybookExecutor
import ansible.constants as C

C.HOST_KEY_CHECKING = False

loader = DataLoader()
inventory = InventoryManager(loader=loader, sources=['hosts'])
variable_manager = VariableManager(loader=loader, inventory=inventory)
Options = namedtuple('Options',
                     ['connection',
                      'module_path',
                      'forks',
                      'become',
                      'become_method',
                      'become_user',
                      'listhosts',
                      'listtasks',
                      'listtags',
                      'syntax',
                      'check',
                      'diff']
                     )

options = Options(connection='smart',
                  module_path=None,
                  forks=10,
                  become=None,
                  become_method=None,
                  become_user=None,
                  listhosts=None,
                  listtasks=None,
                  listtags=None,
                  syntax=None,
                  check=False,
                  diff=False)

passwords = dict()
playbook = PlaybookExecutor(
    playbooks=['my_playbook.yml'],
    inventory=inventory,
    variable_manager=variable_manager,
    loader=loader,
    options=options,
    passwords=passwords,
)
result = playbook.run()
```

执行结果

```bash
PLAY [all] *********************************************************************

TASK [Gathering Facts] *********************************************************
ok: [10.0.0.128]

TASK [create new file] *********************************************************
changed: [10.0.0.128]

PLAY RECAP *********************************************************************
10.0.0.128                 : ok=2    changed=1    unreachable=0    failed=0   
```

### 6. 重写回调插件

#### 6.1重写Ad-hoc的执行结果处理

```python
#!/usr/bin/env python3

import json
from collections import namedtuple
from ansible.parsing.dataloader import DataLoader
from ansible.vars.manager import VariableManager
from ansible.inventory.manager import InventoryManager
from ansible.playbook.play import Play
from ansible.executor.task_queue_manager import TaskQueueManager
from ansible.plugins.callback import CallbackBase
import ansible.constants as C

C.HOST_KEY_CHECKING = False


class ResultCallback(CallbackBase):
    # 回调插件：当结果出现时执行一些操作
    def __init__(self, *args, **kwargs):
        super(ResultCallback, self).__init__(*args, **kwargs)
        self.host_ok = {}
        self.host_failed = {}
        self.host_unreachable = {}

    def v2_runner_on_ok(self, result, **kwargs):
        self.host_ok[result._host.name] = result

    def v2_runner_on_failed(self, result, ignore_errors=False):
        self.host_failed[result._host.name] = result

    def v2_runner_on_unreachable(self, result):
        self.host_unreachable[result._host.name] = result


loader = DataLoader()
inventory = InventoryManager(loader=loader, sources=['hosts'])
variable_manager = VariableManager(loader=loader, inventory=inventory)
Options = namedtuple('Options',
                     ['connection',
                      'module_path',
                      'forks',
                      'become',
                      'become_method',
                      'become_user',
                      'check',
                      'diff']
                     )

options = Options(connection='smart',  # local 连接本地机器 smart 连接远程机器
                  module_path=None,
                  forks=10,
                  become=None,
                  become_method=None,
                  become_user=None,
                  check=False,
                  diff=False)

play_source = dict(
    name="Ansible Play",
    hosts='all',
    gather_facts='no',
    tasks=[
        dict(action=dict(module='shell', args='ls packages/readme.md'), register='shell_out'),

    ]
)

play = Play().load(play_source, variable_manager=variable_manager, loader=loader)

passwords = dict()
results_callback = ResultCallback()
tqm = TaskQueueManager(
    inventory=inventory,
    variable_manager=variable_manager,
    loader=loader,
    options=options,
    passwords=passwords,
    stdout_callback=results_callback,
)

result = tqm.run(play)

result_raw = {"ok": {}, 'failed': {}, "unreachable": {}}

for host, result in results_callback.host_ok.items():
    result_raw["ok"][host] = result._result
for host, result in results_callback.host_failed.items():
    result_raw["failed"][host] = result._result
for host, result in results_callback.host_unreachable.items():
    result_raw["unreachable"][host] = result._result
# 格式化输出结果
print(json.dumps(result_raw, indent=4))
```

执行结果

```bash
/home/sufangmu/PycharmProjects/AnsibleApi/venv/bin/python /home/sufangmu/PycharmProjects/AnsibleApi/main5.py
{
    "ok": {
        "10.0.0.128": {
            "cmd": "ls packages/readme.md",
            "stdout": "packages/readme.md",
            "stderr": "",
            "rc": 0,
            "start": "2021-09-05 15:49:44.308900",
            "end": "2021-09-05 15:49:44.312274",
            "delta": "0:00:00.003374",
            "changed": true,
            "invocation": {
                "module_args": {
                    "_raw_params": "ls packages/readme.md",
                    "_uses_shell": true,
                    "warn": true,
                    "argv": null,
                    "chdir": null,
                    "executable": null,
                    "creates": null,
                    "removes": null,
                    "stdin": null
                }
            },
            "_ansible_parsed": true,
            "stdout_lines": [
                "packages/readme.md"
            ],
            "stderr_lines": [],
            "_ansible_no_log": false
        }
    },
    "failed": {
        "10.0.0.131": {
            "end": "2021-09-05 15:49:43.944436",
            "stdout": "",
            "cmd": "ls packages/readme.md",
            "delta": "0:00:00.003367",
            "changed": true,
            "start": "2021-09-05 15:49:43.941069",
            "msg": "non-zero return code",
            "stderr": "ls: cannot access 'packages/readme.md': No such file or directory",
            "rc": 2,
            "invocation": {
                "module_args": {
                    "_uses_shell": true,
                    "_raw_params": "ls packages/readme.md",
                    "removes": null,
                    "executable": null,
                    "stdin": null,
                    "warn": true,
                    "argv": null,
                    "creates": null,
                    "chdir": null
                }
            },
            "_ansible_parsed": true,
            "stdout_lines": [],
            "stderr_lines": [
                "ls: cannot access 'packages/readme.md': No such file or directory"
            ],
            "_ansible_no_log": false
        }
    },
    "unreachable": {
        "10.0.0.129": {
            "unreachable": true,
            "msg": "Failed to connect to the host via ssh: ssh: connect to host 10.0.0.129 port 22: No route to host",
            "changed": false
        }
    }
}

Process finished with exit code 0

```

#### 6.2 重写playbook的执行结果处理

```python
#!/usr/bin/env python3
# _*_ coding:utf-8 _*_
# Playbook方式
import json
from collections import namedtuple
from ansible.parsing.dataloader import DataLoader
from ansible.plugins.callback import CallbackBase
from ansible.vars.manager import VariableManager
from ansible.inventory.manager import InventoryManager
from ansible.executor.playbook_executor import PlaybookExecutor
import ansible.constants as C

C.HOST_KEY_CHECKING = False


class PlaybookResultCallback(CallbackBase):
    # 回调插件：当结果出现时执行一些操作
    def __init__(self, *args, **kwargs):
        super(PlaybookResultCallback, self).__init__(*args, **kwargs)
        self.task_ok = {}
        self.task_failed = {}
        self.task_unreachable = {}
        self.task_skipped = {}
        self.task_stats = {}
    def v2_runner_on_ok(self, result, **kwargs):
        self.task_ok[result._host.name] = result

    def v2_runner_on_failed(self, result, ignore_errors=False):
        self.task_failed[result._host.name] = result

    def v2_runner_on_unreachable(self, result):
        self.task_unreachable[result._host.name] = result

    def v2_runner_on_skipped(self, result):
        self.task_skipped[result._host.name] = result

    def v2_playbook_on_stats(self, stats):
        hosts = stats.processed.keys()
        for host in hosts:
            t = stats.summarize(host)
            self.task_stats[host] = {
                "ok":t['ok'],
                "failed":t["failures"],
                "unreachable":t["unreachable"],
                "skipped":t["skipped"],
                "changed":t["changed"]
            }

loader = DataLoader()
inventory = InventoryManager(loader=loader, sources=['hosts'])
variable_manager = VariableManager(loader=loader, inventory=inventory)
Options = namedtuple('Options',
                     ['connection',
                      'module_path',
                      'forks',
                      'become',
                      'become_method',
                      'become_user',
                      'listhosts',
                      'listtasks',
                      'listtags',
                      'syntax',
                      'check',
                      'diff']
                     )

options = Options(connection='smart',
                  module_path=None,
                  forks=10,
                  become=None,
                  become_method=None,
                  become_user=None,
                  listhosts=None,
                  listtasks=None,
                  listtags=None,
                  syntax=None,
                  check=False,
                  diff=False)

passwords = dict()
playbook = PlaybookExecutor(
    playbooks=['my_playbook.yml'],
    inventory=inventory,
    variable_manager=variable_manager,
    loader=loader,
    options=options,
    passwords=passwords,
)

results_callback = PlaybookResultCallback()
playbook._tqm._stdout_callback = results_callback
result = playbook.run()

result_raw = {"ok": {}, 'failed': {}, "unreachable": {}, "skipped": {},"stats":{}}

for host, result in results_callback.task_ok.items():
    result_raw["ok"][host] = result._result
for host, result in results_callback.task_failed.items():
    result_raw["failed"][host] = result._result
for host, result in results_callback.task_unreachable.items():
    result_raw["unreachable"][host] = result._result
for host, result in results_callback.task_skipped.items():
    result_raw["skipped"][host] = result._result
for host, result in results_callback.task_stats.items():
    result_raw["stats"][host] = result
print(json.dumps(result_raw, indent=4))
```

执行结果

```bash
{
    "ok": {
        "10.0.0.128": {
            "cmd": "echo hello world",
            "stdout": "hello world",
            "stderr": "",
            "rc": 0,
            "start": "2021-09-05 16:51:49.568878",
            "end": "2021-09-05 16:51:49.572153",
            "delta": "0:00:00.003275",
            "changed": true,
            "invocation": {
                "module_args": {
                    "_raw_params": "echo hello world",
                    "_uses_shell": true,
                    "warn": true,
                    "argv": null,
                    "chdir": null,
                    "executable": null,
                    "creates": null,
                    "removes": null,
                    "stdin": null
                }
            },
            "_ansible_parsed": true,
            "stdout_lines": [
                "hello world"
            ],
            "stderr_lines": [],
            "_ansible_no_log": false
        },
        "10.0.0.131": {
            "invocation": {
                "module_args": {
                    "warn": true,
                    "_raw_params": "echo hello world",
                    "stdin": null,
                    "argv": null,
                    "creates": null,
                    "chdir": null,
                    "removes": null,
                    "executable": null,
                    "_uses_shell": true
                }
            },
            "end": "2021-09-05 16:51:49.623818",
            "changed": true,
            "delta": "0:00:00.003706",
            "rc": 0,
            "stdout": "hello world",
            "stderr": "",
            "start": "2021-09-05 16:51:49.620112",
            "cmd": "echo hello world",
            "_ansible_parsed": true,
            "stdout_lines": [
                "hello world"
            ],
            "stderr_lines": [],
            "_ansible_no_log": false
        }
    },
    "failed": {},
    "unreachable": {
        "10.0.0.129": {
            "unreachable": true,
            "msg": "Failed to connect to the host via ssh: ssh: connect to host 10.0.0.129 port 22: No route to host",
            "changed": false
        }
    },
    "skipped": {
        "10.0.0.131": {
            "changed": false,
            "skip_reason": "Conditional result was False",
            "_ansible_no_log": false
        }
    },
    "stats": {
        "10.0.0.128": {
            "ok": 3,
            "failed": 0,
            "unreachable": 0,
            "skipped": 0,
            "changed": 2
        },
        "10.0.0.131": {
            "ok": 2,
            "failed": 0,
            "unreachable": 0,
            "skipped": 1,
            "changed": 1
        },
        "10.0.0.129": {
            "ok": 0,
            "failed": 0,
            "unreachable": 1,
            "skipped": 0,
            "changed": 0
        }
    }
}
```

