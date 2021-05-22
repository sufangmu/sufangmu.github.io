# Jinja2

Jinja2是基于python的模板引擎。他的设计思想来源于[Django](https://baike.baidu.com/item/Django/61531)的模板引擎，并扩展了其语法和一系列强大的功能。

## 一、基本元素

### 1.字面量

用单引号或双引号括起来的。如`'hello'`或`"hello"`

### 2.列表

一对中括号括起来的东西是一个列表。列表用于存储和迭代序列化的数据。

`['a', 'b', 'c']`

### 3.元组

元组与列表类似，只是元组不能修改。如果元组中只有一个项，需要以逗号结尾。

`(‘tuple’, ‘of’, ‘values’)`

### 4.字典

字典在模板中很少用

`{'dict'：'of'，'key'：'and'，'value'：'pairs'}`

### 5. 运算符

#### 5.1. 算数运算符

| 运算符 | 描述                  |
| ------ | --------------------- |
| `+`    | `{{ 1 + 1 }}` -->2    |
| `-`    | `{{ 3 - 2 }}` -->1    |
| `/`    | `{{ 1 / 2 }}` --> 0.5 |
| `//`   | `{{ 20 // 7 }}` --> 2 |
| `%`    | `{{ 11 % 7 }}`-->4    |
| `*`    | `{{ 2 * 2 }}`-->4     |
| `**`   | `{{ 2**3 }}`-->8      |

#### 5.2. 比较运算符

| 运算符 | 描述                               |
| ------ | ---------------------------------- |
| `==`   | 比较两个对象是否相等               |
| `!=`   | 比较两个对象是否不等               |
| `>`    | 如果左边大于右边，返回 true        |
| `>=`   | 如果左边大于等于右边，返回 true    |
| `<`    | 如果左边小于右边，返回 true 。     |
| `<=`   | 如果左边小于等于右边，返回 true 。 |

#### 5.3. 逻辑运算符

| 运算符 | 描述     |
| ------ | -------- |
| `and`  | 与       |
| `or`   | 或       |
| `not`  | 非       |
| `()`   | 表达式组 |

#### 5.4. 其他运算符

| 运算符 | 描述                                                         |
| ------ | ------------------------------------------------------------ |
| `in`   | `{{ 1 in[1,2,3] }}` 返回true                                 |
| `is`   | 测试                                                         |
| `~`    | 把所有的操作数转换为字符串，并且连接它们，`{{ "Hello " ~ name ~ "!" }}`-->Hello John! |

### 6.变量

#### 6.1. 变量属性的访问方式

```jinja2
{{ foo.bar }}
{{ foo['bar']}
```

两者在Python 层中的区别：

 foo.bar

- 检查 foo 上是否有一个名为 bar 的属性（`getattr(foo, 'bar')`）
- 如果没有，检查 foo 中是否有一个 'bar' 项（`foo.__getitem__('bar')`）
- 如果没有，返回一个未定义对象

foo['bar']

- 检查在 foo 中是否有一个 'bar' 项（`foo.__getitem__('bar')`）
- 如果没有，检查 foo 上是否有一个名为 bar 的属性（`getattr(foo, 'bar')`）
- 如果没有，返回一个未定义对象

#### 6.2. 变量赋值

##### 6.2.1. 变量赋值`set`

`{% set username='admin' %}`

##### 6.2.2. 变量作用域`with`

使用with可以修改变量作用域，只有在with块中可以使用定义的变量

```jinja2
{% with foo = 42 %}
    {{ foo }}
{% endwith %}
{#等价于#}
{% with %}
    {% set foo = 42 %}
    {{ foo }}
{% endwith %}
```

### 7. 模板组成

模板中包括变量、表达式、标签

`{% ... %}`: 语句（for 循环和赋值等语句）

`{{ ... }}`: 表达式

### 8. 注释

`{# ... #}`

## 二、模板渲染

### 1. 字符串

```python
>>> from jinja2 import Template
>>> template = Template("hello {{ name }}!")
>>> template.render(name="张三")
'hello 张三!'
```

### 2. 模板加载器

```bash
└─mysite
    │  test.py
    │  __init__.py
    │
    ├─templates
           index.html
```

#### 2.1.  通过模块加载

```python
# __file__: test.py
import os,sys
from jinja2 import Environment, PackageLoader
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

env = Environment(loader=PackageLoader('mysite', 'templates'))
template = env.get_template('index.html')
print(template.render(name="张三"))
```

#### 2.2. 通过文件系统加载

```python
# __file__: test.py
import os
from jinja2 import FileSystemLoader, Environment

template_path = os.path.join(os.path.dirname(__file__), 'templates')
env = Environment(loader = FileSystemLoader(template_path))
template = env.get_template('index.html')
print(template.render(name="张三"))
```

## 三、控制结构

### 1. For

#### 1.1. 迭代一个列表

```jinja2
<ul>
{% for user in users %}
  <li>{{ user.username|e }}</li>
{# |e 表示转义 #}
{% endfor %}
</ul>
```

#### 1.2. 迭代一个字典

```jinja2
{% for key, value in my_dict.items() %}
    <dt>{{ key|e }}</dt>
    <dd>{{ value|e }}</dd>
{% endfor %}
```

#### 1.3. 如果序列是空，可以使用 else 渲染一个用于替换的块

```jinja2
如果因序列是空或者过滤移除了序列中的所有项目而没有执行循环，你可以使用 else 渲染一个用于替换的块
{% for user in users %}
    <li>{{ user.username|e }}</li>
{% else %}
    <li><em>no users found</em></li>
{% endfor %}
```

循环块中可以访问的特殊的变量

| 变量           | 描述                                  |
| -------------- | ------------------------------------- |
| loop.index     | 当前循环迭代的次数（从 1 开始）       |
| loop.index0    | 当前循环迭代的次数（从 0 开始）       |
| loop.revindex  | 到循环结束需要迭代的次数（从 1 开始） |
| loop.revindex0 | 到循环结束需要迭代的次数（从 0 开始） |
| loop.first     | 如果是第一次迭代，为 True 。          |
| loop.last      | 如果是最后一次迭代，为 True 。        |
| loop.length    | 序列中的项目数。                      |

特殊变量的用法：

```python
import os
from jinja2 import FileSystemLoader, Environment

template_path = os.path.join(os.path.dirname(__file__), 'templates')
env = Environment(loader = FileSystemLoader(template_path))
template = env.get_template('index.html')
letters = ['A', 'B', 'C']
print(template.render(letters=letters))
```

```jinja2
{% for letter in letters -%}
    {{ loop.index  }} : {{ letter }}
{% endfor %}
```

执行结果：

1 : A
2 : B
3 : C

**注意：**jinja2中不可以使用`continue`和`break`表达式控制循环

### 2. IF

`if`语句与python中的类似，可以使用>、>=、<、<=、==、!=来进行判断，也可以使用and、or、not、()进行逻辑合并操作。

```jinja2
{% if kenny.sick %}
    Kenny is sick.
{% elif kenny.dead %}
    You killed Kenny!  You bastard!!!
{% else %}
    Kenny looks okay --- so far
{% endif %}
```

### 3. 宏

宏类似常规编程语言中的函数，可以传递参数，但不能有返回值。

#### 3.1. 定义一个宏

```jinja2
{# 定义一个宏 #}
{% macro input(name, value='', type='text', size=20) -%}
    <input type="{{ type }}" name="{{ name }}" value="{{ value|e }}" size="{{ size }}">
{%- endmacro %}
```

#### 3.2. 调用宏

```jinja2
{# 调用宏 #}
<p>{{ input('username') }}</p>
<p>{{ input('password', type='password') }}</p>
```

#### 3.3. 导入宏`import`

通常会把所有的宏定义在一个模板中，如果其他模板需要使用，就需要先导入。

##### 3.3.1. 导入整个模板

```jinja2
{% import 'forms.html' as forms %}
<dl>
    <dt>Username</dt>
    {# 使用的时候要加别名作为前缀 #}
    <dd>{{ forms.input('username') }}</dd>
    <dt>Password</dt>
    <dd>{{ forms.input('password', type='password') }}</dd>
</dl>
<p>{{ forms.textarea('comment') }}</p>
```

##### 3.3.2. 从模板中导入指定的宏名称到当前的命名空间

```jinja2
{% from 'forms.html' import input as input_field, textarea %}
<dl>
    <dt>Username</dt>
    {# 使用的时候要使用别名 #}
    <dd>{{ input_field('username') }}</dd>
    <dt>Password</dt>
    <dd>{{ input_field('password', type='password') }}</dd>
</dl>
<p>{{ textarea('comment') }}</p>
```

##### 3.3.3. `with context`传递上下文到模板

```jinja2
{# 如果想要在导入宏的时候就把当前模板的一些参数传递给宏所在的模板，就应该在导入的时候使用 with context #}
{% from 'forms.html' import input with context %}
```

#### 4. 包含`include`

`include` 语句用于包含一个模板，并在当前命名空间中返回那个文件的内容渲染结果。

```jinja2
<html>
    <head>
        <meta charset="UTF-8">
        <title>include的用法</title>
    </head>
    <body>
        {% include 'header.html' %} {# 相当于把header.html的内容拷贝到这里 #}
            Body
        {% include 'footer.html' %}
    </body>
</html>
```

**注意**：模板路径相对于`templates`目录

#### 6. 宏特殊变量

| 变量    | 描述                                                         |
| ------- | ------------------------------------------------------------ |
| varargs | 如果有多于宏接受的参数个数的位置参数被传入，它们会作为列表的值保存在 varargs变量上。 |
| kwargs  | 同 varargs ，但只针对关键字参数。所有未使用的关键字参数会存储在 这个特殊变量中。 |
| caller  | 如果宏通过 [*call*](http://docs.jinkan.org/docs/jinja2/templates.html#call) 标签调用，调用者会作为可调用的宏被存储在这个 变量中。 |

#### 7. 宏对象属性

| 属性          | 描述                                                         |
| ------------- | ------------------------------------------------------------ |
| name          | 宏的名称。 {{ input.name }} 会打印 input 。                  |
| arguments     | 一个宏接受的参数名的元组。                                   |
| defaults      | 默认值的元组。                                               |
| catch_kwargs  | 如果宏接受额外的关键字参数（也就是访问特殊的 kwargs 变量），为 true 。 |
| catch_varargs | 如果宏接受额外的位置参数（也就是访问特殊的 varargs 变量），为 true 。 |
| caller        | 如果宏访问特殊的 caller 变量且由 [*call*](http://docs.jinkan.org/docs/jinja2/templates.html#call) 标签调用，为 true 。 |

### 4. 调用call

#### 4.1. 无参数调用

```jinja2
{% macro render_dialog(title, class='dialog') -%}
    <div class="{{ class }}">
        <h2>{{ title }}</h2>
        <div class="contents">
            {{ caller() }}
        </div>
    </div>
{%- endmacro %}

{# 宏调用 #}
{% call render_dialog('Hello World') %}
    This is a simple dialog rendered by using a macro and
    a call block.
{% endcall %}
```

渲染结果

```html
    <div class="dialog">
            <h2>Hello World</h2>
            <div class="contents">

        This is a simple dialog rendered by using a macro and
        a call block.

            </div>
    </div>
```

#### 4.2. 带参数调用

```jinja2
{% macro dump_users(users) -%}
    <ul>
    {%- for user in users %}
        <li><p>{{ user.username|e }}</p>{{ caller(user) }}</li>
    {%- endfor %}
    </ul>
{%- endmacro %}

{% call(user) dump_users(list_of_user) %}
    <dl>
        <dl>Realname</dl>
        <dd>{{ user.realname|e }}</dd>
        <dl>Description</dl>
        <dd>{{ user.description }}</dd>
    </dl>
{% endcall %}
```

## 四、过滤器

过滤器可以用来修改变量，过滤器由竖线符号（`|`）与变量分开，可以链接多个过滤器。一个滤波器的输出将应用于下一个。

`{{ num|abs }}`

### 1. 内置过滤器

| 过滤器        | 功能                                                         |
| ------------- | ------------------------------------------------------------ |
| `abs()`       | 返回一个数的绝对值                                           |
| `escape()`    | 对某一个字符转义,别名`e`                                     |
| `safe()`      | 关闭一个字符串的自动转义, 禁用转义                           |
| `default()`   | `{{ value | default('默认值')`                               |
| `first()`     | 返回序列的第一个元素                                         |
| `last()`      | 返回序列的最后一个元素                                       |
| `format()`    | 格式化字符串`{{ "%s, %s!" | format(greeting, name) }}`       |
| `length()`    | 返回一个序列类型的长度                                       |
| `join()`      | 将一个序列，用指定的参数拼接成字符串,`{{ [1, 2, 3]|join('|')` -->1\|2\|3 |
| `int()`       | 将值转换为 int 类型                                          |
| `float()`     | 将值转换为 float 类型                                        |
| `string()`    | 将变量转换为字符串                                           |
| `lower()`     | 将字符串转换为小写                                           |
| `upper()`     | 将字符串转换为大写                                           |
| `replace()`   | 替换字符串，`{{ "Hello World"|replace("Hello", "Goodbye") }}`-->Goodbye World |
| `truncate()`  | 截取指定长度的字符串，  `{{ "foo bar baz qux"|truncate(9) }}` |
| `striptags()` | 删除字符串中所有的HTML标签，如果出现多个空格，将替换成一个空格 |
| `trim()`      | 去除开头和结尾字符                                           |
| `wordcount()` | 计算一个长字符串中单词的个数                                 |

### 2. 自定义过滤器

```python
import os
from jinja2 import FileSystemLoader, Environment

# 定义一个过滤器函数
def say_hello(name):
    return name + ' hello'
template_path = os.path.join(os.path.dirname(__file__), 'templates')
env = Environment(loader = FileSystemLoader(template_path))
# 将函数添加到过滤器字典中
env.filters['say_hello'] = say_hello
template = env.get_template('index.html')
print(template.render(name="张三"))
```

```jinja2
# __file__ : index.html
# 使用自定义的过滤器
{{ name|say_hello }}
```

## 五、测试

测试一个变量或表达式

例如：`{% if loop.index is divisibleby 3 %}`

### 1. 内置测试函数

| 函数          | 功能                           |
| ------------- | ------------------------------ |
| `defined()`   | `{% if variable is defined %}` |
| `divisibleby()` |  检查变量是否可被数字整除。|
| `escaped()` | 检查该值是否转义 |
| `even()` | 如果变量为偶数，则返回true |
| `iterable()` | 检查是否可以迭代对象。 |
| `lower()`    |  如果变量是小写的，则返回true  |
| `number()`      |  如果变量是数字，则返回true    |
| `odd()`    | 如果变量为奇数，则返回true   |
| `sequence()`    | 如果变量是序列，则返回true|
| `string()` | 如果对象是字符串，则返回true|

### 2. 自定义测试

```jinja2
# __file__:index.html
{% if num is prime %}
    {{ num }} is a prime number
{% else %}
    {{ num }} is not a prime number
{% endif %}
```

```python
import os
from jinja2 import FileSystemLoader, Environment
import math

# 定义一个测试函数
def is_prime(n):
    if n == 2:
        return True
    for i in range(2, int(math.ceil(math.sqrt(n))) + 1):
        if n % i == 0:
            return False
    return True

template_path = os.path.join(os.path.dirname(__file__), 'templates')
env = Environment(loader = FileSystemLoader(template_path))

# 将函数添加到测试字典中
env.tests['prime'] = is_prime
template = env.get_template('index.html')
print(template.render(num=11))
# 运行结果
11 is a prime number
```

## 六、模板继承

模板继承可以把一部分公用的代码抽取出来放到一个父模板中，以后子模板直接继承就可以使用了。

### 1. 父模板

把相同部分都放在父模板中`base.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    {% block head %}
    <link rel="stylesheet" href="style.css" />
    <title>{% block title %}{% endblock %} - My Webpage</title>
    {% endblock %}
</head>
<body>
    <div id="content">{% block content %}{% endblock %}</div>
    <div id="footer">
        {% block footer %}
        &copy; Copyright 2008 by <a href="http://domain.invalid/">you</a>.
        {% endblock %}
    </div>
</body>
</html>
```

### 2. 子模板

先用`extends`继承父模板，把个性部分放在`block`块中

```html
{% extends "base.html" %}
{% block title %}Index{% endblock %}
{% block head %}
    {{ super() }}
    <style type="text/css">
        .important { color: #336699; }
    </style>
{% endblock %}
{% block content %}
    <h1>Index</h1>
    <p class="important">
      Welcome to my awesome homepage.
    </p>
{% endblock %}
```

### 3. 使用父模板中的内容`super()`

默认情况在子模板内容会覆盖父模板块中的内容，可以通过

`{{ super() }}`保留父块的内容。例子同上。

### 4. 调用另一个block中的代码`self.其他块的名字()`

```jinja2
{% block title %}
    Hello World!
{% endblock %}

{% block body %}
    {{ self.title() }}
{% endblock %}
```

### 5. 块中变量的作用域

默认的块不允许访问块外作用域中的变量，加`scoped`修改作用域

```jinja2
{% for item in seq %}
    <li>{% block loop_item scoped %}{{ item }}{% endblock %}</li>
{% endfor %}
```

## 七、空白控制

使用下面的模板渲染，

```jinja2
<div>
    {% if True %}
        yay
    {% endif %}
</div>
```

生成的结果会有空行

```html
<div>

        yay

</div>
```

### 1. 使用减号（`-`）删除空行

```jinja2
<div>
    {% if True -%}
        {{ name }}
    {%- endif %}
</div>
```

## 八、转义

### 1. 部分转义

使用变量分隔符

`{{ '{{' }}`

### 2. 块转义`raw`

用`raw`标记

```jinja2
{% raw %}
    <ul>
    {% for item in seq %}
        <li>{{ item }}</li>
    {% endfor %}
    </ul>
{% endraw %}
```

### 3. 自动转义`autoescape`

```jinja2
{% autoescape true %}
自动转义在这块文本中是开启的。
{% endautoescape %}

{% autoescape false %}
自动转义在这块文本中是关闭的。
{% endautoescape %}
```
