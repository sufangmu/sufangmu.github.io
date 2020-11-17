# shell 脚本规范
# 一、背景
## 1.使用哪一种shell？
必须使用bash shell
## 2.什么时候使用shell？
1. 数量相等较少的操作
2. 脚本文件少于100行
## 3.脚本文件扩展名是什么？
shell脚本不要求有扩展名，或者以.sh结尾，库文件必须以.sh结尾，并且不可执行。
# 二、环境
## STDOUT vs STDERR
所有的错误信息都应该被导向STDERR。
```bash
err() {
    echo "[$(date +'%Y-%m-%dT%H:%M:%S%z')]: $@" >&2
}

if ! do_something; then
    err "Unable to do_something"
    exit "${E_DID_NOTHING}"
fi
```

# 三、注释
## 1.文件头注释
每一个文件的开头必须对文件进行描述
基本格式：
```bash
#!/bin/bash
# Date  :
# Auth  :
# E-mail:
# 功能描述

```
## 2.功能注释
任何函数及库函数无论长短都必须注释。

## 3.实现部分注释
注释较复杂、不易阅读、重要的部分

# 四、格式

## 1. 缩进
    缩进4个空格，不允许使用制表符
## 2. 行的长度
    每行最大长度为80个字符
## 3. 管道
    如果一行容不下整个管道，把整个管道分割成每一行一个管道。
    该规则同样适用于 || 和 &&
```bash
# Long commands
command1 \
  | command2 \
  | command3 \
  | command4
```
## 4.循环
    将 ; do , ; then 和 while , for , if 放在同一行，else单独一行。
```bash
if condition ;then
    command
else	
    command
fi
```
## 5.case

如果命令只有一行，命令可以和;放在一行，其他情况下;单独一行。
```bash
case "${expression}" in
    a)
        command
        ;;
    absolute)
        command
        ;;
    *)
        command
        ;;
esac
```
## 6.变量
    除了单个字符的特殊变量和定位变量之外，其他变量在引用时必须用{}括起来
    除了特殊情况下使用$*，其他情况都必须使用$@

# 五、特性和BUG
## 1. 命令替换
    使用 $(command) 而不是`command`
## 2. test，[和[[
必须使用[[ 

    在 [[ 和 ]] 之间不会有路径名称扩展或单词分割发生，所以使用 [[ ... ]] 能够减少错误。而且 [[ ... ]] 允许正则表达式匹配，而 [ ... ] 不允许

## 3.测试字符串
   使用 -z 或 -n 测试，不要使用 [[ "${my_var}" = "" ]]
## 4. eval
    避免使用eval
# 六 命名规范
## 1.函数
1. 函数名小写，并使用下划线分割单词
2. 函数名和() 没有空格
3. 大括号和函数名位于同一行
## 2.变量名
同函数名
## 3.常量和环境变量名
1. 全部大写
2. 下划线分割
## 4.源文件名
1. 小写
2. 需要分割使用下划线进行分割
## 5.只读变量
使用 readonly 或者 declare -r 来确保变量只读
## 6.本地变量
    使用 local 声明特定功能的变量。声明和赋值应该在不同行。
## 7. 函数位置
    所有函数放在常量下面
## 8.主函数，main
    文件最后一行
```bash
main "$@"
```

# 七 命令调用
## 1.检查返回值
对于非管道命令，使用 $? 或直接通过一个 if 语句来检查以保持其简洁。
```bash
if ! mv "${file_list}" "${dest_dir}/" ; then
  echo "Unable to move ${file_list} to ${dest_dir}" >&2
  exit "${E_BAD_MOVE}"
fi

# Or
mv "${file_list}" "${dest_dir}/"
if [[ "$?" -ne 0 ]]; then
  echo "Unable to move ${file_list} to ${dest_dir}" >&2
  exit "${E_BAD_MOVE}"
fi
```
参考：
https://google.github.io/styleguide/shell.xml
