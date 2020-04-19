# MySQL基础知识

## 一、SQL语句的执行过程

### 1. 连接层

1. 提供连接协议：TCP/IP，SOCKET
2. 提供验证：用户、密码、IP、SOCKET
3. 提供专用连接线程：接收用户SQL，返回结果

### 2. SQL层

1. 接收上层传送的SQL语句
2. 语法验证
3. 语义检查：判断SQL语句的类型
4. 权限检查：用户对库、表有没有权限
5. 解析器：进行SQL预处理，产生执行计划
6. 优化器：根据解析器得出的多种执行计划进行判断，选择最优的执行计划代价模式
7. 执行器：根据最优执行计划，执行SQL语句，产生执行结果
8. 提供查询缓存（默认不开启）
9. 提供日志记录（默认不开启）

### 3. 存储引擎层

负责根据SQL层执行的结果，从磁盘上拿数据

## 二、MySQL的逻辑结构

### 1. 库

### 2. 表

## 三、MySQL的物理结构

### 1. 库

用文件系统的目录来存储

```bash
root@gp:/data/mysql# tree -FL 1
.
├── auto.cnf
├── ca-key.pem
├── ca.pem
├── client-cert.pem
├── client-key.pem
├── gp.err
├── ib_buffer_pool
├── ibdata1
├── ib_logfile0
├── ib_logfile1
├── mysql/
├── performance_schema/
├── private_key.pem
├── public_key.pem
├── server-cert.pem
├── server-key.pem
└── sys/

```

### 2. 表

#### 2.1 MYISAM表的存储

```bash
root@gp:/data/mysql/mysql# ls user.* -lF
-rw-r----- 1 mysql mysql 10816 Apr 18 22:15 user.frm # 存储列信息
-rw-r----- 1 mysql mysql   384 Apr 18 23:07 user.MYD # 存储数据行
-rw-r----- 1 mysql mysql  4096 Apr 18 23:26 user.MYI # 存储索引

```

#### 2.2 InnoDB表的存储

```bash
root@gp:/data/mysql/mysql# ls time_zone.* -l
-rw-r----- 1 mysql mysql  8636 Apr 18 22:15 time_zone.frm # 存储列信息
-rw-r----- 1 mysql mysql 98304 Apr 18 22:15 time_zone.ibd # 存数据和索引
```



## 一、存储引擎

数据库存储引擎是数据库底层软件组件，数据库管理系统使用存储引擎进行创建、查询、更新和删除数据操作。不同的存储引擎提供不同的存储机制、索引技巧、锁定水平等功能。

## 二、MySQL存储引擎

查看mysql支持的存储引擎
```sql
mysql> SHOW ENGINES;
+--------------------+---------+----------------------------------------------------------------+--------------+------+------------+
| Engine             | Support | Comment                                                        | Transactions | XA   | Savepoints |
+--------------------+---------+----------------------------------------------------------------+--------------+------+------------+
| InnoDB             | DEFAULT | Supports transactions, row-level locking, and foreign keys     | YES          | YES  | YES        |
| MRG_MYISAM         | YES     | Collection of identical MyISAM tables                          | NO           | NO   | NO         |
| MEMORY             | YES     | Hash based, stored in memory, useful for temporary tables      | NO           | NO   | NO         |
| BLACKHOLE          | YES     | /dev/null storage engine (anything you write to it disappears) | NO           | NO   | NO         |
| MyISAM             | YES     | MyISAM storage engine                                          | NO           | NO   | NO         |
| CSV                | YES     | CSV storage engine                                             | NO           | NO   | NO         |
| ARCHIVE            | YES     | Archive storage engine                                         | NO           | NO   | NO         |
| PERFORMANCE_SCHEMA | YES     | Performance Schema                                             | NO           | NO   | NO         |
| FEDERATED          | NO      | Federated MySQL storage engine                                 | NULL         | NULL | NULL       |
+--------------------+---------+----------------------------------------------------------------+--------------+------+------------+
```

### 1. InnoDB存储引擎

事务型数据库首选引擎，支持事物安全表，支持行锁定和外键

#### 1. 表空间文件组成结构

1. 段
2. 簇：一个簇是物理上连续分配的一段空间，一般是64个页面
3. 页：一个页面默认16KB，是段所管理的最小单位，数据库文件管理的最小单位，也是文件中空间分配的最小单位。



#### 主要特性

1. 提供了具有提交、回滚和崩溃恢复能力的事物安全存储引擎
2. 为处理巨大数据量的最大性能设计
3. 在主内存中缓存数据和索引来维持它自己的缓冲池，InnoDB将它的表和索引存储在一个逻辑表空间中，表空间可以包含数个文件
4. 支持外键完整性约束(FOREIGN KEY)
5. 被用在众多需要高性能的大型数据库站点上

使用InnoDB时，MySQL将在数据目录下创建一个名为ibdata1的10M大小的自动扩展数据文件，以及两个名为ib_logfile0和ib_logfile1的5M大小的日志文件。

```bash
[root@localhost ~]# ls /var/lib/mysql/ib*
/var/lib/mysql/ib_buffer_pool  /var/lib/mysql/ib_logfile1 /var/lib/mysql/ibdata1         /var/lib/mysql/ibtmp1 /var/lib/mysql/ib_logfile0
```

### 2. MyISAM存储引擎
MyISAM拥有较高的插入、查询速度，但不支持事物
主要特性：
1. 支持大文件
2. 每个字符列可以有不同的字符集
...

使用MyISAM引擎创建数据库，将产生3个文件。文件的名字以表的名字开始，扩展名指出文件类型：frm文件存储表定义，数据文件扩展名为.MYData，索引文件的扩展名是.MyISAM


### 3. MEMORY存储引擎
把表中的数据存储到内存中，为查询和引用其他表的数据提供快速访问。
主要特性：
1. 每个表可以达32个索引，每个索引16列，以及500B的最大键长度
2. 可以在一个MEMORY表中有非唯一键



## 三、数据类型与运算符

## 1. 数据类型

### 1. 整数类型

mysql中整数型数据类型

| 类型名称  | 存储需求 | 有符号                                   | 无符号                 |
| :-------: | :------: | ---------------------------------------- | ---------------------- |
|  TINYINT  | 1个字节  | -128~127                                 | 0~255                  |
| SMALLINT  | 2个字节  | -32768~32767                             | 0~65535                |
| MEDIUMINT | 3个字节  | -8388608~8388607                         | 0~16777215             |
|    INT    | 4个字节  | -2147483648~2147483647                   | 0~4294967295           |
|  BIGINT   | 8个字节  | -9223372036854775808~9223372036854775807 | 0~18446744073709551615 |

使用格式

```mysql
数据类型(显示宽度)
```



### 2.浮点数类型和定点数类型

| 类型名称          | 存储需求  | 无符号                                             | 有符号                                           |
| ----------------- | --------- | -------------------------------------------------- | ------------------------------------------------ |
| FLOAT             | 4个字节   | 0和1.175494351E-38~3.40282346E+38                  | -3.40282346E+38~-1.175494351E-38                 |
| DOUBLE            | 8个字节   | 0和2.2250738585072014E-308~1.7976931348623157E+308 | -1.7976931348623157E+308~2.2250738585072014E-308 |
| DECIMAL(M,D), DEC | M+2个字节 | 同DOUBLE                                           | 同DOUBLE                                         |

M：精度，表示总共的位数

N：标度，小数的位数

DECIMAL是以字符串的形式存放的，默认精度为(10,0)，在对精度要求较高的时候，建议使用DECIMAL。



### 3. 日期和时间



| 类型名称  | 日期格式            | 日期范围                                | 存储需求 |
| --------- | ------------------- | --------------------------------------- | -------- |
| YEAR      | YYYY                | 1901~2155                               | 1字节    |
| TIME      | HH:MM:SS            | -838:59:59~838:59:59                    | 3字节    |
| DATE      | YYYY-MM-DD          | 1000-01-01~9999-12-31                   | 3字节    |
| DATETIME  | YYYY-MM-DD HH:MM:SS | 1000-01-01 00:00:00~9999-12-31 23:59:59 | 8字节    |
| TIMESTAMP | YYYYMMDDHHMMSS      | 19700101000001~20380119031407           | 4字节    |

### 4. 文本字符串类型

| 类型名称   | 存储需求                                               |
| ---------- | ------------------------------------------------------ |
| CHAR(M)    | M字节,1<=M<=255                                        |
| VARCHAR(M) | L+1字节，L<=M，1<=M<=255                               |
| TINYTEXT   | L+1字节，L<2^8                                         |
| TEXT       | L+2字节，L<2^16                                        |
| MEDIUMTEXT | L+3字节，L<2^24                                        |
| LONGTEXT   | L+4字节，L<2^32                                        |
| ENUM       | 1或2个字节，取决于枚举值的数据(最大值65535)            |
| SET        | 1,2,3,4，或8个字节，取决于集合成员的数量(最多64个成员) |

L：列值得实际长度



#### 1. ENUM类型

只能从给定的值中选一个

语法格式

```mysql
字段名 ENUM('值1','值2',...'值n')
```

实例

```mysql
# 插入时出现错误，原因为数据库编码格式不正确
mysql> ALTER TABLE accounts ADD sex ENUM('男','女');
ERROR 1291 (HY000): Column 'sex' has duplicated value '?' in ENUM
# 修改数据库和表的编码
mysql> ALTER DATABASE  test_db CHARACTER SET utf8;
mysql> ALTER TABLE accounts CHARACTER SET utf8; 
# 重新插入
mysql> ALTER TABLE accounts ADD sex ENUM('男','女');
Query OK, 1 row affected (0.00 sec)
Records: 1  Duplicates: 0  Warnings: 0
```

#### 2. SET

可以从定义的列值中选多个

语法规则

```mysql
SET('值1','值2',...'值n')
```



### 5. 二进制字符串

| 类型名称      | 存储需求          |
| ------------- | ----------------- |
| BIT(M)        | 大约(M+7)/8个字节 |
| BINARY(M)     | M个字节           |
| VARBINARY(M)  | M+1个字节         |
| TINYBLOB(M)   | L+1字节，L<2^8    |
| BLOB(M)       | L+2字节，L<2^16   |
| MEDIUMBLOB(M) | L+3字节，L<2^24   |
| LONGBLOB(M)   | L+4字节，L<2^32   |



数据类型的选择：

1. 如果要对小数进行数值比较，最好用DECIMAL
2. float(M,D)是非标准SQL定义，尽量不要使用

3. 对于存储不大，但在速度上有要求的用CHAR，反之用VARCHAR





## 2. 运算符



### 1. 算数运算符

| 运算符 | 作用 |
| ------ | ---- |
| +      | 加   |
| -      | 减   |
| *      | 乘   |
| /      | 除   |
| %      | 取余 |



### 2. 比较运算符

| 运算符      | 作用                                               |
| ----------- | -------------------------------------------------- |
| =           | 等于                                               |
| <=>         | 安全的等于，可以对NULL进行判读                     |
| <>(!=)      | 不等于                                             |
| <=          | 小于等于                                           |
| >=          | 大于等于                                           |
| >           | 大于                                               |
| IS NULL     | 判断一个值是否为空                                 |
| ISNULL      | 判断一个值是否为空                                 |
| IS NOT NULL | 判断一个值是否不为空                               |
| LEAST       | 当有两个或两个以上参数时，返回最小值               |
| GREATEST    | 当有两个或两个以上参数时，返回最大值               |
| BETWEEN AND | 判断一个值是否落在两个值之间                       |
| IN          | 判读一个值是IN列表中的任意一个值                   |
| NOT IN      | 判读一个值不是IN列表中的任意一个值                 |
| LIKE        | 通配符匹配，%：匹配任意数目的字符；_：匹配一个字符 |
| REGEXP      | 正则匹配                                           |



### 3. 逻辑运算符

| 运算符     | 作用     |
| ---------- | -------- |
| NOT 或 !   | 逻辑非   |
| AND 或 &&  | 逻辑与   |
| OR 或 \|\| | 逻辑或   |
| XOR        | 逻辑异或 |



### 4. 位操作运算符

| 运算符 | 作用   |
| ------ | ------ |
| \|     | 位或   |
| &      | 位与   |
| ^      | 位异或 |
| <<     | 位左移 |
| >>     | 位右移 |
| ~      | 位取反 |



## 四、函数



## 1. 数学函数



| 函数          | 作用                                         | 示例                    |
| ------------- | -------------------------------------------- | ----------------------- |
| ABS(x)        | 返回x的绝对值                                | SELECT ABS(-3);         |
| PI()          | 返回圆周率π                                  | SELECT PI();            |
| SQRT(x)       | 返回x的二次平方根                            | SELECT SQRT(9);         |
| MOD(x)        | 求余函数                                     | SELECT MOD(10,3);       |
| CEIL(x)       | 返回不小于x的最小整数                        | SELECT CEIL(3.35);      |
| CEILING(x)    | 返回不小于x的最小整数                        | SELECT CEILING(3.35);   |
| RANG(x)       | 返回一个随机浮点数[0,1.0]，x为随机种子(可选) | SELECT RAND(4);         |
| ROUND(x)      | 返回接近x的整数，对x值进行四舍五入           | SELECT ROUND(4.3);      |
| ROUND(x,y)    | 结果保留小数点后y位                          | SELECT ROUND(3.1415,2); |
| TRUNCATE(x,y) | 返回被舍去至小数点后y位的数字x               |                         |
| SIGN(x)       | 返回参数的符号。结果为-1或0或1               |                         |
| POW(x,y)      | 返回x的y次方的结果值                         |                         |
| POWER(x,y)    | 返回x的y次方的结果值                         |                         |
| EXP(x)        | 返回e的x乘方后的值                           |                         |
| LOG(x)        | 返回x的自然对数                              |                         |
| LOG10(x)      | 返回x的基数为10的对数                        |                         |
| RADIANS(x)    | 角度转化为弧度                               |                         |
| DEGREES(x)    | 弧度转化为角度                               |                         |
| SIN(x)        | 返回x正弦                                    |                         |
| ASIN(x)       | 返回x的反正弦                                |                         |
| COS(x)        | 返回x的余弦                                  |                         |
| ACOS(x)       | 返回x的反余弦                                |                         |
| TAN(x)        | 返回x的正切                                  |                         |
| ATAN(x)       | 返回x的反正切                                |                         |
| COT(x)        | 返回x的余切                                  |                         |

## 2. 字符串函数

| 函数                   | 作用                                      | 示例                                   |
| ---------------------- | ----------------------------------------- | -------------------------------------- |
| CHAR_LENGTH(str)       | 返回字符串个数                            | SELECT CHAR_LENGTH('hello');           |
| CONCAT(s1,s2,...)      | 拼接字符串                                | SELECT CONCAT('hello','world');        |
| CONCAT_WS(x,s1,s2,...) | 指定拼接分隔符                            | SELECT CONCAT_WS('+','hello','world'); |
| INSERT(s1,x,len,s2)    | 用s2替换s1从x开始len长度的字符            |                                        |
| LOWER(str)             | 大写转小写                                |                                        |
| LCASE(str)             | 大写转小写                                |                                        |
| UPPER(str)             | 小写转大写                                |                                        |
| UCASE(str)             | 小写转大写                                |                                        |
| LEFT(s,n)              | 返回字符串s最左边的n个字符                |                                        |
| RIGHT(s,n)             | 返回字符串s最右边的n个字符                |                                        |
| LPAD(s1,len,s2)        | 指定字符串s1长度为len，不够用s2在左边填充 |                                        |
| RPAD(s1,len,s2)        | 指定字符串s1长度为len，不够用s2在右边填充 |                                        |
| LTRIM(s)               | 删除字符串左边空格                        |                                        |
| RTRIM(s)               | 删除字符串右边空格                        |                                        |
| TRIM(s)                | 删除字符串两边空格                        |                                        |
| 。。。                 |                                           |                                        |



## 3. 日期和时间函数

| 函数            | 作用                    | 示例 |
| --------------- | ----------------------- | ---- |
| CURRENT_DATE()  | 返回当前日期:YYYY-MM-DD |      |
| CUR_DATE()      | 返回当前日期:YYYY-MM-DD |      |
| CURRENT_TIME(); | 返回当前时间 :HH:MM:SS  |      |
| CUR_TIME();     |                         |      |
|                 |                         |      |
|                 |                         |      |
|                 |                         |      |
|                 |                         |      |
|                 |                         |      |



## 4. 条件判断函数



### 5. 系统信息函数

| 函数                         | 作用                   |
| ---------------------------- | ---------------------- |
| SELECT VERSION();            | 查看数据库版本         |
| SELECT CONNECTION_ID();      | 查看当前用户的连接数   |
| SHOW PROCESSLIST;            | 查看当前用户的连接信息 |
| SELECT SYSTEM_USER(),USER(); | 获取用户名             |
| SELECT LAST_INSERT_ID();     | 最后一条记录的ID       |

### 6.加密/解密函数

| 函数            | 作用 | 示例                           |
| --------------- | ---- | ------------------------------ |
| PASSWORD('pwd') |      | SELECT PASSWORD('Admin@123!'); |
|                 |      |                                |
|                 |      |                                |
|                 |      |                                |



