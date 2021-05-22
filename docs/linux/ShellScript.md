# Shell脚本基础

## 一、变量

### 1. 变量分类

#### 1.1 环境变量

用来存储有关shell会话和工作环境的信息。在bash shell中环境变量分为全局变量和局部变量。

环境变量：

1. 全局环境变量：对于shell会话和所有生成的子shell都是可见的。

2. 局部环境变量：只对创建它们的shell可见

使用`env`或`printenv`查看全局变量，所有的环境变量名均使用大写字母。

```bash
#!/bin/bash
# 环境变量
echo "User Info:"
echo "user: $USER"
echo "UID : $EUID"
echo "home: $HOME"
echo “$HOSTNAME”
```

常用默认环境变量

| 变量        | 描述                                          |
| ----------- | --------------------------------------------- |
| HOME        | 当前用户主目录                                |
| BASH        | 当前shell的全路径名（/bin/bash）              |
| BASH_SOURCE | 含有当前正在执行的shell函数所在源文件名的数组 |
| FUNCTION    | 当前执行的shell函数的名称                     |
| HOSTNAME    | 当前主机的名称                                |
| LINENO      | 当前执行的脚本的行号                          |
| PWD         | 当前工作目录                                  |

#### 1.2  用户变量

变量命名规则：

1. 由字母、数字和下划线组成大小写敏感
2. 大小写敏感

用户变量的分类：

1. 局部用户变量
2. 全局环境变量：使用`export 变量名`将局部变量导出到全局环境中。

```bash
#!/bin/bash
# 用户变量
var1=100
var2=hello
var3="hello world"
echo "$var1 $var2 $var3"
```

#### 1.3 特殊变量

| 变量 | 含义                                                         |
| ---- | ------------------------------------------------------------ |
| `$0` | 当前脚本的文件名                                             |
| `$n` | 传递给脚本或函数的参数。n 是一个数字                         |
| `$#` | 传递给脚本或函数的参数个数。                                 |
| `$*` | 传递给脚本或函数的所有参数。                                 |
| `$@` | 传递给脚本或函数的所有参数                                   |
| `$?` | 上个命令的退出状态，或函数的返回值。                         |
| `$$` | 当前Shell进程ID。对于 Shell 脚本，就是这些脚本所在的进程ID。 |

```bash
#!/bin/bash
echo "Total Number of Parameters : $#"
echo "File Name: $0"
echo "First Parameter : $1"
echo "First Parameter : $2"
echo "Quoted Values: $@"
echo "Quoted Values: $*"
echo "PID $$"
echo "$?"
```

$@ 与 $* 的区别

$* 和 $@ 都表示传递给函数或脚本的所有参数，不被双引号(" ")包含时，都以"$1" "$2" … "$n" 的形式输出所有参数。

但是当它们被双引号(" ")包含时，"$*" 会将所有的参数作为一个整体，以"$1 $2 … $n"的形式输出所有参数；"$@" 会将各个参数分开，以"$1" "$2" … "$n" 的形式输出所有参数。

```bash
#!/bin/bash
echo '$@:'
for i in $@;do
    echo $i
done
echo '"$@:"'
for i in "$@";do
    echo $i
done
echo '$*:'
for i in $*;do
    echo $i
done
echo '"$*:"'
for i in "$*";do
    echo $i
done
结果：
$@:
1
2
3
"$*":
1
2
3
$@:
1
2
3
"$*":
1 2 3
```

### 2.变量定义

#### 1. 只读变量

```bash
root@localhost:~# cat file.sh
#!/bin/bash
readonly hours_per_day=24
hours_per_day=12
```

更改变量会触发异常

```bash
root@localhost:~# ./file.sh
./file.sh: line 3: hours_per_day: readonly variable
```

### 3. 变量替换

| 语法                           | 说明                                                       |
| ------------------------------ | ---------------------------------------------------------- |
| `${变量名#匹配规则}`           | 从变量开头进行规则匹配，将符合最短的数据删除               |
| `${变量名##匹配规则}`          | 从变量开头进行规则匹配，将符合最长的数据删除               |
| `${变量名%匹配规则}`           | 从变量尾部进行规则匹配，将符合最短的数据删除               |
| `${变量名%%匹配规则}`          | 从变量尾部进行规则匹配，将符合最长的数据删除               |
| `${变量名/旧字符串/新字符串}`  | 变量内容符合旧字符串规则，则第一个旧字符串会被新字符串取代 |
| `${变量名//旧字符串/新字符串}` | 变量内容符合旧字符串规则，则全部的旧字符串会被新字符串取代 |

### 4. 变量测试（不常用）

| 运算符                | 用途                                                                                                                 |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `${varname:-word}`    | 如果变量存在且非null，则返回其值；否则返回word                                                                       |
| `${varname:=word}`    | 如果变量存在且非null，则返回其值；否则设置它的值为word并返回                                                         |
| `${varname:+word}`    | 如果变量存在且非null，则返回word;否则返回null                                                                        |
| `${varname:?message}` | 如果变量存在且非null,则返回其值；否则显示message，并退出当前脚本或命令; message默认信息为：parameter null or not set |

### 5.字符串处理

#### 5.1 计算字符串长度

方法1：`${#string}`

方法2：`expr length "$string"`

#### 5.2 获取字符在字符串中的索引位置

`expr index $string substring`

#### 5.3 计算子串长度

`expr match $string substr`

```bash
expr match "hello world" .*w  # 7
```

#### 5.4 抽取子串

| 语法                                   | 说明                             |
| -------------------------------------- | -------------------------------- |
| `${string:position}`                   | 从string中的position开始         |
| `${string:position:length}`            | 从position开始，匹配长度为length |
| `${string:-position}`                  | 从右边开始匹配                   |
| `${string:(position)}`                 | 从左边开始匹配                   |
| `expr substr $string $postion $length` | 从position开始，匹配长度为length |

注意：使用expr索引计数从1开始；使用${:}，索引计数从1开始。

### 6. 命令替换

把命令的执行结果赋给变量

```bash
#!/bin/bash
# 方法1
time=`date +%y%m%d`
# 方法2    推荐使用
time=$(date +%y%m%d)
```

### 7.有类型变量

使用`declare`或`typeset`定义变量类型

| 参数 | 含义                               |
| ---- | ---------------------------------- |
| `-r` | 将变量设为只读                     |
| `-i` | 将变量设为整数                     |
| `-a` | 将变量定义为数组                   |
| `-f` | 显示此脚本前定义过得所有函数及内容 |
| `-F` | 仅显示此脚本前定义过得函数名       |
| `-x` | 将变量声明为环境变量               |

## 二、数组

### 1. 数组的定义

1.1 方法一：

```bash
arr=(1 2 3 4 5)
```

1.2 方法二：

```bash
arr[0]=1
arr[1]=2
arr[2]=3
```

### 2. 输出数组中的值

```bash
root@localhost:~# arr=(1 2 3 4 5)
root@localhost:~# echo ${arr[2]}
3
root@localhost:~# echo ${arr[*]}
1 2 3 4 5
root@localhost:~# echo ${arr[@]}
1 2 3 4 5
```

### 3. 关联数组

普通数组只能使用整数作为索引值，而关联数组可以使用任意文本作为索引值（有点类似于Python中的字典），关联数组只在bash 4.0以上支持。

```bash
root@localhost:~# declare -A person
root@localhost:~# person=([name]="Wang" [age]=18)
root@localhost:~# echo ${person[name]}
Wang
root@localhost:~# echo ${person[age]}
18
root@localhost:~# echo ${person[*]}
Wang 18
```

## 三、数学计算

### 1. `let`

let命令可以直接执行基本的算数操作，并且变量名之前不需要添加`$`。

```bash
gp@gp:~$ a=2
gp@gp:~$ b=3
gp@gp:~$ let c=a+b
gp@gp:~$ echo $c
5
# let 还可以执行自加自减操作
gp@gp:~$ let a++
gp@gp:~$ let b--
gp@gp:~$ echo $a $b
3 2
```

### 2. `expr`

```bash
#!/bin/bash
# expr 和 = 之间要有一个空格
var= expr 1 + 2
echo $var
```

`expr`操作符对照表

| 操作符         | 含义                                    |
| -------------- | --------------------------------------- |
| `num1 | num2`  | num1不为空且非0，返回num1；否则返回num2 |
| `num1 & num2`  | num1不为空且非0，返回num1；否则返回0    |
| `num1 < num2`  | num1小于num2，返回1；否则返回0          |
| `num1 <= num2` | num1小于等于num2，返回1；否则返回0      |
| `num1 = num2`  | num1等于num2，返回1；否则返回0          |
| `num1 != num2` | num1不等于num2，返回1；否则返回0        |
| `num1 > num2`  | num1大于num2，返回1；否则返回0          |
| `num1 >= num2` | num1大于等于num2，返回1；否则返回0      |
| `num1 + num2`  | 求和                                    |
| `num1 - num2`  | 求差                                    |
| `num1 * num2`  | 求积                                    |
| `num1 / num2`  | 求商                                    |
| `num1 % num2`  | 求余                                    |

使用时要对特殊字符进行转义`expr 5 \* 2`

### 3. `[ ]` 与 `(( ))`

```bash
#!/bin/bash
var=$[ 1 + 2 ]
var=$(( 3 + 4 ))
```

### 4. `bc`

上述两种只能计算整数，对于浮点数需要使用`bc`
在脚本中使用`bc`的格式：

```bash
variable=`echo "option; expression" |bc`
```

```bash
#!/bin/bash
var=`echo "scale=2;5/3" | bc`
echo $var
```

## 四、逻辑控制

### 1. if

#### 1.1  if-then

格式：

```bash
if command
then
    command
fi
```

例：

```bash
#!/bin/bash
if date
then
    echo "command is succeed"
fi
```

#### 1.2 if-then-else

格式：

```bash
if command
then
    command
else
     command
fi
```

例：

```bash
#!/bin/bash
# 查找系统中是否存在httpd用户
if grep httpd /etc/passwd
then
    echo "httpd is exist"
else
    echo "httpd not find"
fi
```

#### 1.3 if嵌套

格式：

```bash
if command
then
    command
elif command
    command
else
     command
fi
```

### 2. test

功能：

1. 数值比较
2. 字符串比较
3. 文件比较

格式：

```bash
test condition
或
[ command ]  
```

#### 2.1 数值比较

| 比较  | 描述     |
| ----- | -------- |
| `-eq` | 等于     |
| `-ge` | 大于等于 |
| `-gt` | 大于     |
| `-le` | 小于等于 |
| `-lt` | 小于     |
| `-ne` | 不等于   |

例：

```bash
#!/bin/bash
date
if [ $? -eq 0 ];then
   echo "command is succeed"
fi
# 或
if test date;then
   echo "command is succeed"
fi
```

#### 2.2 字符串比较

| 比较           | 描述              | 例                                            |
| -------------- | ----------------- | --------------------------------------------- |
| `str1 = str2`  | 字符串是否相同    |
| `str1 != str2` | 字符串是否不同    |
| `str1 < str2`  | str1是否比str2小  |
| `str1 > str2`  | str1是否比str2大  | `[ b \> a  ] && echo "true"`（注意>需要转义） |
| `-n str`       | 字符串长度非0为真 | `[ -n "str" ] && echo "str is not null"`      |
| `-z str`       | 字符串长度为0为真 | `[ -z "" ] && echo "str is null"`             |

#### 2.3 文件比较

| 比较              | 描述                                     |
| ----------------- | ---------------------------------------- |
| `-d file`         | 检查file是否存在并是一个目录             |
| `-f file`         | 检查file是否存在并是一个目录             |
| `-e file`         | 检查file是否存在                         |
| `-r file`         | 检查file是否存在并可读                   |
| `-s file`         | 检查file是否存在并非空                   |
| `-w file`         | 检查file是否存在并可写                   |
| `-x file`         | 检查file是否存在并可执行                 |
| `-O file`         | 检查file是否存在并属当前用户所有         |
| `-G file`         | 检查file是否存在并且默认组与当前用户相同 |
| `file1 -nt file2` | file1是否比file2新                       |
| `file1 -ot file2` | file1是否比file2旧                       |

#### 2.4 复合条件

```bash
[ condition1 ] && [ condition2 ]
[ condition1 ] || [ condition2 ]
```

### 3. case

格式：

```bash
case variable in
    pattern1 | pattern2) command1;;
    pattern3) command2;;
    *) default command;;
esca
```

例：

```bash
#!/bin/bash
read -p "input something: " var
case $var in
[0-9])
    echo "number";;
[a-z])
    echo "character";;
*)
    echo "other";;
esac
```

### 4. for

#### 4.1 bash中的for

格式：

```bash
for var in list
do
    command
done
```

例1：查看服务状态

```bash
#!/bin/bash
for service in apache2 mysqld zabbix-server zabbix-agent
do
    status=$(systemctl status mysql | awk '/Active/ {print $2,$3}')
    echo $service $status
done
```

例2：使用通配符

```bash
#!/bin/bash
# 注意在$file上加“”，否则如果出现带空格的目录名，脚本会出错
for file in /tmp/*
do
    if [ -d "$file" ]
    then
        echo "$file" is a directory
    elif [ -f "$file" ]
    then
        echo "$file" is a file
    fi
done
```

#### 4.2 C 语言风格的for

例：

```bash
#!/bin/bash
for (( i=1; i<=10; i++ ))
do
    echo $i
done

#!/bin/bash
# 单变量
for (( i=1; i<=10; i++ ))
do
    echo $i
done
# 多变量
for (( i=1,j=10; i<=10; i++,j-- ))
do
    echo $i $j
done
```

### 5. while

例：检测站点状态

```bash
#!/bin/bash

urls="
https://www.baidu.com
https://www.taobao.com
https://www.jd.com/abc
https://www.12306.cn/index/
192.168.1.111
"
for url in $urls;do
    count=0
    while [ $count -lt 3 ];do
       STATUS=$(curl -I -m 10 -o /dev/null -s -w %{http_code} $url)

       if [ $STATUS -eq 200 ];then
          echo "$url  OK"
          break 1
       fi
       count=$(($count+1))
    done
    if [ $count -eq 3 ];then
       echo "$url Error"
    fi
done

```

### 6. until

```bash
#!/bin/bash
var=10
until [ $var -eq 0 ];do
    var=$[$var-2]
    echo $var
done
```

## 7. 控制循环

### 7.1 break

```bash
#!/bin/bash
# break 跳出当前循环
# break n 跳出n层循环
for (( i=0; i<10; i++ ));do
    if [ $i -eq 5 ];then
       break
    fi
    echo $i
done
```

### 7.2 continue

## 五、输入

### 1. 命令行参数

例1：

```bash
#!/bin/bash
echo $1+$2=$[$1+$2]

./add.sh  3 4
3+4=7
```

例2：`shift`

```bash
#!/bin/bash
# 把变量的位置向左移
while [ -n "$1" ];do
    echo $1
    shift
done
```

### 2.getopts

格式：`getopts optstring variable`

optstring:  选项字母，如果字母要求有参数就加一个`:`，要去掉错误消息的话可以在optstring前加一个`:`

variable: 保存当前参数

```bash
#!/bin/bash
# getopts的用法
# opt 会保存输入的参数，如 r i
# OPTARG保存参数值
# 参数需要一个值就在参数后面加一个: 如i:
while getopts ri: opt
do
    case "$opt" in
    i) echo "install service $OPTARG";;
    r) echo "remove all service";;
    *) echo "Unknown option: $opt";;
    esac
done
root@localhost:/# ./getopts.sh -i apache2
install service apache2
root@localhost:/# ./getopts.sh -r
remove all service
root@localhost:/# ./getopts.sh -a
./getopts.sh: illegal option -- a
Unknown option: ?
```

### 3. 获得用户输入 read

#### 3.1 普通用法

```bash
#!/bin/bash
read name
echo $name
```

#### 3.2 指定提示符

```bash
#!/bin/bash
read -p "Enter your name: " name
echo "Hello $name "
```

#### 3.3 指定超时时间

```bash
#!/bin/bash
if read -t 5 -p  "Enter your name: " name
then
    echo "Hello $name"
else
    echo "TIME OUT"
fi
```

#### 3.4 隐藏数据

```bash
#!/bin/bash
read -s -p "Enter passwd: " passwd
echo "$passwd"
```

#### 3.5 限制输入长度

```bash
#!/bin/bash
read -n1 -p "Do you want continue[Y/N]?" answer
echo
echo "$answer"
```

## 六、输出

显示脚本输出的方法：

1. 在显示器上显示
2. 将输出重定向到文件

| 描述符 | 缩写   | 描述     |
| ------ | ------ | -------- |
| 0      | STDIN  | 标准输入 |
| 1      | STDOUT | 标准输出 |
| 2      | STDERR | 标准错误 |

### 1. 在脚本中重定向

#### 1. 临时重定向

使用场景：在脚本中生成错误消息

```bash
#!/bin/bash
echo "This is an error message" >&2
echo "This is normal output"
```

默认情况下Linux 会将STDERR定向到STDOUT

```bash
$./error.sh
This is an error message
This is normal output
```

在执行脚本的时候重定向STDERR，ERR文本就会被重定向

```bash
$ ./error.sh  2> error.log
This is normal output
$ cat error.log
This is an error message
```

#### 2. 永久重定向

用exec命令告诉shell在执行脚本期间重定向某个特定文件描述符

```bash
#!/bin/bash
exec 2>errout
echo "This is error"
exec 1>testout
echo "testout"
echo "testout  to errout" >&2
```

```bash
$ ./test.sh
This is error
$ cat errout
testout  to errout
$ cat testout
testout
```

### 2. 记录消息

tee : 将输出一边发送到显示器一边发送到日志文件
tee 默认会覆盖原来的文件，可以使用-a追加

```bash
$ date | tee -a date.txt
Fri Nov 23 11:03:15 CST 2018
$ cat date.txt
Fri Nov 23 11:03:07 CST 2018
Fri Nov 23 11:03:15 CST 2018
```

## 七、函数

### 1.函数定义

```bash
#!/bin/bash
# 定义方式1
function foo
{
    echo "This is a func"
}
# 定义方式2
bar()
{
   echo "This is another func"
}
```

### 2. 函数调用

直接使用函数名调用

### 3.返回值

#### 3.1 默认退出状态码

```bash
#!/bin/bash
function foo {
    echo "This is a func"
}
foo
echo "Exit status is $?"
```

#### 3.2 使用return命令

```bash
#!/bin/bash
function foo {
    echo "Hello world"
    return 2
}
foo
echo "Exit status is $?"
```

```bash
 ./func.sh
Hello world
Exit status is 2
```

#### 3.3 使用函数输出

```bash
#!/bin/bash
function foo {
    echo "Hello world"
}
foo
# 把函数的输出赋值给变量
result=`foo`
echo "Exit status is $result"
```

```bash
 $./func.sh
Hello world
Exit status is Hello world
```

### 4. 参数

#### 4.2 参数传递

```bash
#!/bin/bash
function status {
    systemctl status $1
}
status sshd
```

#### 4.2 局部变量与全局变量

```bash
#!/bin/bash
# 定义全局变量
hostname="web"
function foo {
      str="hello"
      # 使用 local 定义局部变量
      local  user="http"
      # 可以在函数内使用全局变量
      echo "$hostname"
      echo "$user"
}
foo
# 在函数中定义的局部变量不能在全局使用
echo "$str $user"
```

#### 4.3 数组变量

如果将数组变量作为函数参数，函数只会取数组变量的第一个值

```bash
#!/bin/bash
function foo {
     arr=$1
     echo "The received array is ${arr[*]}"
}
myarr=(1 2 3 4 5)
foo $myarr

# The received array is 1
```

解决方法

```bash
#!/bin/bash
function foo {
     arr=$@
     echo "The received array is ${arr[*]}"
}
myarr=(1 2 3 4 5)
# 将该数组变量的值分解成单个的值，然后将这些值作为函数参数使用。
foo ${myarr[*]}

# The received array is 1 2 3 4 5
```

## 八、输出格式化

### 1. C语言风格的格式化

```bash
#!/bin/bash
printf "%-5s %-10s %-4s\n" NO. Name Mark
printf "%-5s %-10s %-4.2f\n" 1 Sarath 80.3456
printf "%-5s %-10s %-4.2f\n" 2 James 90.9989
```

```bash
root@localhost:/tmp# ./test.sh
NO.   Name       Mark
1     Sarath     80.35
2     James      91.00
```

### 2. echo

#### 2.1 不换行

`echo -n "hello world"`

#### 2.2 转义

`echo -e "hello\t\tworld"`

#### 2.3 彩色输出

| 颜色   | 重置 | 黑  | 红  | 绿  | 黄  | 蓝  | 紫  | 青  | 白  |
| ------ | ---- | --- | --- | --- | --- | --- | --- | --- | --- |
| 前景色 | 0    | 30  | 31  | 32  | 33  | 34  | 35  | 36  | 37  |
| 背景色 | 0    | 40  | 41  | 42  | 43  | 44  | 45  | 46  | 47  |

```bash
echo -e "\e[1;31m This is red test \e[0m"
# 或
echo -e  "\033[47;31m This is red test \033[0m"
```

## 九、shell 脚本的执行

### 1. 脚本执行的4种方法

```bash
#!/bin/bash
# test.sh
# 这里借助SHLVL这个变量，SHLVL可以显示shell的层级，
# 每启动一个shell，这个值就加1
echo "shell level :$SHLVL"
echo "hello world!"
```

#### 1.1 切换到shell脚本所在目录执行

```bash
root@localhost:/# cd /tmp/
root@localhost:/tmp# chmod +x test.sh
root@localhost:/tmp# ./test.sh
shell level :2
hello world!
```

#### 1.2 以绝对路径执行

```bash
root@localhost:~# chmod +x /tmp/test.sh
root@localhost:~# /tmp/test.sh
shell level :2
hello world!
```

#### 1.3 直接使用bash或sh 来执行bash shell脚本

```bash
root@localhost:/tmp# bash test.sh
shell level :2
hello world!
root@localhost:/tmp# sh test.sh
shell level :1
hello world!
```

#### 1.4 在当前shell 环境中执行

```bash
root@localhost:/tmp# . test.sh
shell level :1
hello world!
root@localhost:/tmp# source  test.sh
shell level :1
hello world!
```

总结：注意看SHLVL的值，前3种方式都在子shell中执行（sh除外），第4种在当前shell种执行。

### 2.调试脚本

`bash -x script.sh` 跟踪调试shell脚本

例：

```bash
root@localhost:/tmp# bash -x test.sh
+ echo 'shell level :2'
shell level :2
+ echo 'hello world!'
hello world!
```

-x 打印所执行的每一行命令以及当前状态

set  -x : 在执行时显示参数和命令
set +x : 禁止调试
set -v : 当命令进行读取时显示输入
set +v : 禁止打印输入

## 十、控制脚本

### 1.处理信号

#### 1.1查看Linux信号

```bash
kill -l
 1) SIGHUP       2) SIGINT       3) SIGQUIT      4) SIGILL       5) SIGTRAP
 6) SIGABRT      7) SIGBUS       8) SIGFPE       9) SIGKILL     10) SIGUSR1
11) SIGSEGV     12) SIGUSR2     13) SIGPIPE     14) SIGALRM     15) SIGTERM
16) SIGSTKFLT   17) SIGCHLD     18) SIGCONT     19) SIGSTOP     20) SIGTSTP
21) SIGTTIN     22) SIGTTOU     23) SIGURG      24) SIGXCPU     25) SIGXFSZ
26) SIGVTALRM   27) SIGPROF     28) SIGWINCH    29) SIGIO       30) SIGPWR
31) SIGSYS      34) SIGRTMIN    35) SIGRTMIN+1  36) SIGRTMIN+2  37) SIGRTMIN+3
38) SIGRTMIN+4  39) SIGRTMIN+5  40) SIGRTMIN+6  41) SIGRTMIN+7  42) SIGRTMIN+8
43) SIGRTMIN+9  44) SIGRTMIN+10 45) SIGRTMIN+11 46) SIGRTMIN+12 47) SIGRTMIN+13
48) SIGRTMIN+14 49) SIGRTMIN+15 50) SIGRTMAX-14 51) SIGRTMAX-13 52) SIGRTMAX-12
53) SIGRTMAX-11 54) SIGRTMAX-10 55) SIGRTMAX-9  56) SIGRTMAX-8  57) SIGRTMAX-7
58) SIGRTMAX-6  59) SIGRTMAX-5  60) SIGRTMAX-4  61) SIGRTMAX-3  62) SIGRTMAX-2
63) SIGRTMAX-1  64) SIGRTMAX
```

在Linux编程时会遇到的最常见的Linux系统信号

| 信 号 | 值      | 描 述                          | 触发     |
| ----- | ------- | ------------------------------ | -------- |
| 1     | SIGHUP  | 挂起进程                       |          |
| 2     | SIGINT  | 终止进程                       | Ctrl + C |
| 3     | SIGQUIT | 停止进程                       |          |
| 9     | SIGKILL | 无条件终止进程                 |          |
| 15    | SIGTERM | 尽可能终止进程                 |          |
| 17    | SIGSTOP | 无条件停止进程，但不是终止进程 |          |
| 18    | SIGTSTP | 停止或暂停进程，但不终止进程   | Ctrl+Z   |
| 19    | SIGCONT | 继续运行停止的进程             |          |

#### 1.2 捕捉信号

格式：`trap command signals`
例

```bash
#!/bin/bash
trap "echo 'You Enter Ctrl + C'" SIGINT
for (( i=0; i<10; i++ ));do
    echo $i
    sleep 1
done
```

```bash
# ./signal.sh
0
1
^CYou Enter Ctrl + C
2
^CYou Enter Ctrl + C
```

### 2. 退出状态

可以使用`$?`查看上一个命令的退出状态码

| 状态码 | 含义                 |
| ------ | -------------------- |
| 0      | 命令成功结束         |
| 1      | 通用未知错误         |
| 2      | 误用shell命令        |
| 126    | 命令不可执行         |
| 127    | 没有找到命令         |
| 128+x  | Linux信号x的严重错误 |
| 130    | 命令通过Ctrl+C终止   |
| 255    | 退出状态码越界       |
