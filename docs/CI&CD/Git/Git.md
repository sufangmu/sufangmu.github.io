# Git

2014由Linus Torvalds开发的分支管理系统。

## 一、git基本概念

### 1. 3个区域

1. 工作区：`.git`版本库所在的目录
2. 暂存区：也叫缓存区，或索引(`.git/index`)。是一个文件，保存了下次将提交的文件列表信息，一般在 Git 仓库目录中
3. 版本库：用来保存项目的元数据和对象数据库的地方，`.git`目录就是版本库。

### 2. 3个对象

1. git对象
2. 树对象
3. 提交对象

### 3. 3种状态

1. 已修改（modified）：表示修改了文件，但还没保存到数据库中。
2. 已暂存（staged）：表示对一个已修改文件的当前版本做了标记，使之包含在下次提交的快照中。
3. 已提交（committed）：表示数据已经安全的保存在本地数据库中。

### 4. Git基本的工作流程

1. 在工作目录中修改文件。
2. 暂存文件，将文件的快照放入暂存区域。
3. 提交更新，找到暂存区域的文件，将快照永久性存储到 Git 仓库目录。

### 5. Git工作区目录

```bash
$ tree -FL 1 .git
.git
├── branches/
├── config      # 项目特有的配置项
├── description # 对仓库的描述信息
├── HEAD        # 目前被检出的分支
├── hooks/      # 包含客户端或服务端的钩子脚本
├── info/       # 包含全局性的排出文件
├── objects/    # 存储所有的数据内容
├── index       # 包含文件索引的目录树，记录了文件名和文件的状态信息（时间戳和文件长度等）
└── refs/       # 存储指向数据（分支）提交对象的指针
```

## 二、Git配置

### 1. Git配置文件

配置文件的三个存储位置

1. `/etc/gitconfig` ：针对所有用户的通用配置，使用`git config --system`配置
2. `~/.gitconfig` 或 `~/.config/git/config` ：针对当前用户，使用`git config --global`配置
3. `.git/config`：针对本仓库，使用`git config --local`配置

> 这三个配置文件的优先级由低到高

### 2. 查看git当前配置

```bash
git config --list
```

### 3. 常用配置

#### 1. 用户名称与邮件地址

```bash
git config --global user.name 'yuanzhigao'
git config --global user.email 'gaopeng0214@126.com
```

#### 2. 配置默认文本编辑器

```bash
git config --global core.editor vim
```

#### 3. 查看具体某一项配置

```bash
$ git config user.name
yuanzhigao
```

#### 4. 别名

```bash
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
```

#### 5. 其他配置

```bash
# 解决中文名的显示问题
git config --global core.quotepath false
# 输出中开启颜色显示
git config --global color.ui true
```

## 三、仓库管理

### 1. 新建Git仓库

#### 1. 在当前目录初始化Git仓库

```bash
git init
```

#### 2. 新建一个目录并将其初始化为Git仓库

```bash
git init Demo
```

#### 3. 克隆一个Git仓库

```bash
# git协议
git clone git@gitee.com:gaoyuanzhi/Demo.git
# https协议
git clone https://gitee.com/gaoyuanzhi/python3-notes.git
```

## 四、文件管理

![文件状态](../../assets/images/git/filestatus.png)

### 1. 查看当前文件状态

```bash
# 详细状态
$ git status
# 简短状态
$ git status -s
M README            # 文件被修改了并放入了暂存区
A lib/git.rb        # 新添加到暂存区中的文件
 M lib/simplegit.rb # 文件被修改了但是还没放入暂存区
?? LICENSE.txt      # 新添加的未跟踪文件
```

`git status` 的几种状态

1. changes to be commited(被提交的修改)：下次提交中被纳入版本库中的被修改的文件。
2. changed but not updated(不会被更新的修改)：已经被修改但尚未注册到下次提交中的文件。
3. untracked files(未被跟踪的文件)：新增文件

> 当执行`git status` 或`git diff`扫描工作区改动的时候，先依据.git/index文件中记录的时间戳，长度等信息判断工作区文件是否改变，如果工作区文件的时间戳改变了，说明文件的内容可能被变了，需要打开文件，读取文件内容，与更改前的原始文件相比较，判断文件是否改变。如果文件内容没有改变，则将文件新的时间戳记录到.git/index文件中。

### 2. 添加内容到暂存区

```bash
# 添加指定文件到暂存区，一次可以添加多个文件
$ git add [file1] [file2]
# 添加指定目录到暂存区
$ git add [dir]
# 添加当前目录下的所有文件到暂存区
$ git add .
```

#### 清除工作区

```bash
# 清除工作区当前的改动
git clean -df
```

### 3. 忽略文件

一般我们总会有些文件无需纳入 Git 的管理，也不希望它们总出现在未跟踪文件列表。 通常 都是些自动生成的文件，比如日志文件，或者编译过程中创建的临时文件等。 在这种情况 下，我们可以创建一个名为 .gitignore 的文件，列出要忽略的文件模式。

文件 .gitignore 的格式规范如下：

1. 所有空行或者以 `＃`开头的行都会被 Git 忽略。
2. 可以使用shell 所使用的简化了的正则表达式的模式匹配。
3. 匹配模式可以以（`/`）开头防止递归。
4. 匹配模式可以以（`/`）结尾指定目录。
5. 要忽略指定模式以外的文件或目录，可以在模式前加上惊叹号（`!`）取反。

>https://github.com/github/gitignore 有十种项目及语言的 .gitignore 文件列表

### 差异

```bash
# 工作区和暂存区中的差异
git diff
# 暂存区和版本库中的差异
git diff --cached
# 工作区和HEAD（当前工作分支）的差异
git diff HEAD
```

### 4. 移除文件

```bash
# 同时删除暂存区和工作区的文件
$ git rm [file]
# 从暂存区域移除但是在工作区保留
$ git rm --cached [file]
```

### 5. 移动文件

```bash
# 重命名或移动文件
$ git mv <src> <dest>
```

### 保存工作进度

```bash
$ git stash

```

## 五、提交更新

### 1. 提交更新

```bash
# 启动文本编辑器以便输入本次提交的说明
$ git commit
# 将提交信息与命令放在同一行
$ git commit -m "Story 182: Fix benchmarks for speed"
# 把所有已经跟踪过的文件暂存起来一并提交，从而跳过 git add 步骤
$ git commit -a -m 'added new benchmarks'
# 从新提交
$ git commit --amend
```



### 2. 查看历史提交

```bash
# 查看历史提交
$ git log
```

常用选项

| 选项                   | 说明                                                         |
| ---------------------- | ------------------------------------------------------------ |
| `-p`                   | 按补丁格式显示每个更新之间的差异                             |
| `--stat`               | 显示每次更新的文件修改统计信息。                             |
| `--shortstat`          | 只显示 --stat 中最后的行数修改添加移除统计                   |
| `--name-only`          | 仅在提交信息后显示已修改的文件清单。                         |
| `--name- status`       | 显示新增、修改、删除的文件清单                               |
| `--relative-date`      | 使用较短的相对时间显示（比如，“2 weeks ago”）                |
| `--graph`              | 显示 ASCII 图形表示的分支合并历史                            |
| `--pretty`             | 使用其他格式显示历史提交信息。可用的选项包括 oneline，short， full，fuller 和 format（后跟指定格式） |
| `--decorate`           | 查看各个分支当前所指的对象                                   |
| `-(n)`                 | 仅显示最近的 n 条提交                                        |
| `--since` ,`--after`  | 仅显示指定时间之后的提交                                     |
| `--until` , `--before` | 仅显示指定时间之前的提交                                     |
| `--author`             | 仅显示指定作者相关的提交                                     |
| `--committer`          | 仅显示指定提交者相关的提交                                   |
| `--grep`               | 仅显示含指定关键字的提交                                     |
| `-S`                   | 仅显示添加或移除了某个关键字的提交                           |

```bash
# 例
$ git log --since='2020-2-10' --until='2020-2-15' --pretty=oneline
```

## 六、远程仓库

### 1. 查看远程仓库

```bash
$ git remote
# 显示远程仓库URL
$ git remote -v
# 查看更多信息，URL和分支等
$ git remote show origin
```

### 2. 添加远程仓库

```bash
# 添加远程仓库并起一个别名
$ git remote add python3-notes git@gitee.com:gaoyuanzhi/python3-notes.git

```

### 3. 拉取远程仓库

```bash
# 方法一
$ git pull
# 方法二
$ git fetch <remote_name>
$ git merge
```

>两种方式的区别：
>
>1. 当 `git fetch` 命令从服务器上抓取本地没有的数据时，它并不会修改工作目录中的内容。 它只会获取数据然后让你自己合并。2.
>2. `git pull` 在大多数情况下它的含义是一个 `git fetch` 紧接着一个 `git merge` 命令，`git pull` 会查找当前分支所跟踪的服务器与分支，从服务器上抓取数据然后尝试合并入那个远程分支。

### 4. 推送到远程仓库

```bash
$ git push origin <分支名称>
# git会将<分支名称>展开refs/heads/<分支名称>:refs/heads/<分支名称>
# 如果本地分支和远程分支名字不同，可以写成如下方式
$ git push origin <本地分支名称>:<远程分支名称>

```

### 5. 重命名远程仓库

```bash
git remote rename old_name new_name
```

### 6. 删除远程仓库

```bash
git remote rm python3-notes
```

## 七、标签

### 1. 标签的分类

1. 轻量标签：一个轻量标签很像一个不会改变的分支，它只是一个特定提交的引用
2. 附注标签：存储在Git数据库中的一个完整对象

> 附注标签包含打标签者的名字、电子邮件地址、日期时间；还有一个标签信息；并且可以使用 GNU Privacy Guard （GPG）签名与验证。
> 轻量标签本质上是将提交校验和存储到一个文 件中 - 没有保存任何其他信息

### 2. 查看标签

```bash
# 列出所有标签
$ git tag
# 查看标签的详细信息
git show v1.4
```

### 3. 创建标签

```bash
# 创建附注标签
$ git tag -a v1.4 -m 'my version 1.4'
# 创建轻量标签
git tag v1.4-lw
# 给之前的提交打标签
$ git tag -a v1.2 9fceb02
```

### 4. 共享标签

```bash
# 把指定标签推送的远程仓库
$ git push origin [tagname]
# 推送所有不在远程仓库服务器上的标签
$ git push origin --tags
```

### 5. 检出标签

```bash
# 并不能真的检出一个标签，只能在特定的标签上创建一个新分支
$ git checkout -b version2 v2.0.0
```

## 八、分支

### 1. 本地分支

#### 1. 创建分支

```bash
# 创建分支
$ git branch <分支名称> # 在当前所在的提交对象上创建一个指针
```

#### 2. 查看分支列表

```bash
$ git branch
  gh-pages
* master # `*`表示当前分支
# 查看每一个分支的最后一次提交
$ git branch -v
# 要查看哪些分支已经合并到当前分支
$ git branch --merged
# 查看所有包含未合并工作的分支
$ git branch --no-merged
```

#### 3. 切换分支

```bash
$ git checkout <分支名称> # HEAD 指向当前分支
# 新建一个分支并 同时切换到那个分支上
$ git checkout -b iss53
```

> `git checkout master`做了两件事：1.是使 HEAD 指回 master 分支，2、将工作目录恢复成 master 分支所指向的快照内容

#### 4. 合并分支

```bash
$ git merge <分支名称>
# 合并远程分支到当前分支
$ git merge origin/<远程分支名称>
```

#### 5. 删除分支

```bash
# 删除分支
$ git branch -d <分支名称>
```

### 2.远程分支

远程引用：是对远程仓库的引用（指针），包括分支、标签等等。

远程跟踪分支：是远程分支状态的引用，以 `(remote)/(branch)` 形式命名

#### 1. 查看远程分支

```bash
$ git remote
# 查看所有的跟踪分支
$ git branch -vv
```

#### 2. 更新远程仓库的引用

```bash
# 从远处仓库拉取
$ git fetch <远程仓库名>
```

#### 3. 合并分支

```bash
# 合并分支
$ git merge origin/<远程分支名>
```

#### 4. 基于远程跟踪分支创建本地分支

```bash
$ git checkout -b <分支名称> origin/<分支名称>
# 或者使用
$ git checkout --track origin/<分支名称>
```

#### 5. 修改正在跟踪的上游分支或设置已有的本地分支跟踪一个刚刚拉取下来的远程分支

```bash
#
$ git branch -u origin/<分支名称>
```

#### 6. 删除远程分支

```bash
# 删除远程分支
$ git push origin --delete <分支名称>
```

### 3.合并分支

#### 1. 合并算法

1. 递归算法
2. 3路算法
3. “octpus”算法

## 变基

将提交到某一分支上的所有修改都移至另一分支上

## Git原理

git的核心是一个对象数据库，该数据库可以用来存储文本或二进制数据。

### 底层命名

#### 1. `git rev-parse`

```bash
# 显示版本库目录所在位置
$ git rev-parse --git-dir
E:/notes/python3-notes/.git
# 显示工作区根目录
$ git rev-parse --show-toplevel
E:/notes/python3-notes
# 显示相对于跟目录的相对目录
$ git rev-parse --show-prefix
docs/img/
# 显示从当前目录后退到工作目录的深度
$ git rev-parse --show-cdup
../../

```

执行`git add`操作时，暂存区的目录树将被更新，同时工作区修改的文件内容会被写入到对象库中的一个新的对象中。

当执行`git commit`时，暂存区的目录树会写入到版本库中，master分支会做相应的更新，即master最新指向的目录树就是提交时原暂存区的目录树。

当执行`git reset HEAD`时，暂存区的目录树会被重新，会被master分支指向的目录树所替换，工作区不受影响。

当执行`git rm --cached <file>`时，会直接从暂存区删除文件，工作区则不做出改变。

当执行`git checkout .`或`git checkout -- <file>`时，会用暂存区全部的文件或指定的文件替换工作区的文件。

当执行`git checkout HEAD .`或`git checkout HEAD <file>`时，会用HEAD指向的master分支中的全部或部分文件替换暂存区和工作区中的文件。

```bash
# 显示HEAD指向的目录树
$ git ls-tree -l HEAD
100644 blob 4eeb754bb5131ccbe8de9cd73907a5215901aa15      15    .gitignore
040000 tree 46fee821db1551e8341cf406271062eff4718c64       -    docs
100644 blob 38d625ec66862f756ebe09b4af1a9b057f226e54    1249    mkdocs.yml
#文件属性 blob对象 SHA1格式的ID值                         文件大小  文件名
```

```bash
# 显示暂存区目录树
$ git ls-files -s
100644 4eeb754bb5131ccbe8de9cd73907a5215901aa15 0       .gitignore
100644 5c53539c2d6ec00fe3335ba9b86339ab2cdbc705 0       docs/about.md
                                            暂存区编号
```

Git对象

## Git LFS
