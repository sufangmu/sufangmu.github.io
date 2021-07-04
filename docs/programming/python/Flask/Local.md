# Local

不使用local

```python
from threading import Thread
import time

x = 1


def task(arg):
    global x
    x = arg
    time.sleep(2)
    print(x)


for i in range(10):
    t = Thread(target=task, args=(i,))
    t.start()

```

执行结果

```python
9
9
9
9
9
9
9
9
9
9
```

使用local ：为每个线程开辟一个空间进行数据存储

```python
from threading import Thread, local
import time

x = local()


def task(arg):
    # 给每一个线程都开辟一个空间写入值
    x.value = arg
    time.sleep(2)
    print(x.value)


for i in range(10):
    t = Thread(target=task, args=(i,))
    t.start()
```

执行结果

```python
2
0
1
5
6
4
3
9
7
8
```

自定义Local

基于函数

```python
from threading import get_ident, Thread
import time

# 创建一个字典，用来存储每一个线程对应的数据
storage = {}


def _set(k, v):
    # 获取线程的唯一表示
    ident = get_ident()
    if ident in storage:
        storage[ident][k] = v
    else:
        storage[ident] = {k: v}


def _get(k):
    ident = get_ident()
    return storage[ident][k]


def task(arg):
    _set('value', arg)
    time.sleep(1)
    v = _get('value')
    print(v)


for i in range(10):
    t = Thread(target=task, args=(i,))
    t.start()
print(storage)

```

执行结果

```python
{27168: {'value': 0}, 25784: {'value': 1}, 28264: {'value': 2}, 14952: {'value': 3}, 25952: {'value': 4}, 25012: {'value': 5}, 27860: {'value': 6}, 7112: {'value': 7}, 27020: {'value': 8}, 11648: {'value': 9}}
3
4
1
0
2
5
7
6
8
9

```

基于面向对象

版本一

```python
from threading import get_ident, Thread
import time

class Local(object):
    storage = {}

    def __setattr__(self, key, value):
        ident = get_ident()
        if ident in Local.storage:
            Local.storage[ident][key] = value
        else:
            Local.storage[ident] = {key: value}

    def __getattr__(self, item):
        ident = get_ident()
        time.sleep(2)
        return Local.storage[ident][item]


local = Local()


def task(arg):
    local.value = arg
    print(local.value)


for i in range(10):
    t = Thread(target=task, args=(i,))
    t.start()

```

版本二：

```python
from threading import get_ident, Thread
import time


class Local(object):

    def __init__(self):
        object.__setattr__(self, 'storage', {})

    def __setattr__(self, key, value):
        ident = get_ident()
        if ident in self.storage:
            self.storage[ident][key] = value
        else:
            self.storage[ident] = {key: value}

    def __getattr__(self, item):
        ident = get_ident()
        time.sleep(2)
        return self.storage[ident][item]


local = Local()


def task(arg):
    local.value = arg
    print(local.value)


for i in range(10):
    t = Thread(target=task, args=(i,))
    t.start()

```

协程

```python
from threading import Thread
import time

try:
    # 基于协程
    from greenlet import getcurrent as get_ident
except Exception as exc:
    from threading import get_ident


class Local(object):

    def __init__(self):
        object.__setattr__(self, 'storage', {})

    def __setattr__(self, key, value):
        ident = get_ident()
        if ident in self.storage:
            self.storage[ident][key] = value
        else:
            self.storage[ident] = {key: value}

    def __getattr__(self, item):
        ident = get_ident()
        time.sleep(2)
        return self.storage[ident][item]


local = Local()


def task(arg):
    local.value = arg
    print(local.value)


for i in range(10):
    t = Thread(target=task, args=(i,))
    t.start()

```

Flask 的Local()

```python
class Local(object):
    __slots__ = ("__storage__", "__ident_func__")

    def __init__(self):
        object.__setattr__(self, "__storage__", {})
        object.__setattr__(self, "__ident_func__", get_ident)

    def __iter__(self):
        return iter(self.__storage__.items())

    def __call__(self, proxy):
        """Create a proxy for a name."""
        return LocalProxy(self, proxy)

    def __release_local__(self):
        self.__storage__.pop(self.__ident_func__(), None)

    def __getattr__(self, name):
        try:
            return self.__storage__[self.__ident_func__()][name]
        except KeyError:
            raise AttributeError(name)

    def __setattr__(self, name, value):
        ident = self.__ident_func__()
        storage = self.__storage__
        try:
            storage[ident][name] = value
        except KeyError:
            storage[ident] = {name: value}

    def __delattr__(self, name):
        try:
            del self.__storage__[self.__ident_func__()][name]
        except KeyError:
            raise AttributeError(name)

```

