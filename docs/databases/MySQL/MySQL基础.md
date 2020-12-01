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

### 1.库

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

### 2.表

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





## 四、数据类型

### 1. 整数类型

mysql中整数型数据类型

| 类型名称  | 存储需求 | 有符号                                      | 无符号                   |
| :-------: | :------: | ------------------------------------------- | ------------------------ |
|  TINYINT  | 1个字节  | -128 ~ 127                                  | 0 ~ 255                  |
| SMALLINT  | 2个字节  | -32768 ~ 32767                              | 0 ~ 65535                |
| MEDIUMINT | 3个字节  | -8388608 ~ 8388607                          | 0 ~ 16777215             |
|    INT    | 4个字节  | -2147483648  ~ 2147483647                   | 0 ~ 4294967295           |
|  BIGINT   | 8个字节  | -9223372036854775808 ~ 92233720368547758077 | 0 ~ 18446744073709551615 |

### 2. 浮点数类型和定点数类型

| 类型名称          | 存储需求  | 无符号                                               | 有符号                                              |
| ----------------- | --------- | ---------------------------------------------------- | --------------------------------------------------- |
| FLOAT             | 4个字节   | 0和1.175494351E-38 ~ 3.402823466E+38                 | -3.402823466E+38 ~ -1.175494351E-38                 |
| DOUBLE            | 8个字节   | 0和2.2250738585072014E-308 ~ 1.7976931348623157E+308 | -1.7976931348623157E+308 ~ -2.2250738585072014E-308 |
| DECIMAL(M,D), DEC | M+2个字节 | 同DOUBLE                                             | 同DOUBLE                                            |

M：精度，表示总共的位数

N：标度，小数的位数

DECIMAL是以字符串的形式存放的，默认精度为(10,0)，在对精度要求较高的时候，建议使用DECIMAL。

### 3. 日期和时间

| 类型名称  | 日期格式                       | 日期范围                                                |
| --------- | ------------------------------ | ------------------------------------------------------- |
| YEAR      | YYYY                           | 1901 ~ 2155                                             |
| TIME      | HH:MM:SS[.fraction]            | -838:59:59.000000 ~ 838:59:59.000000                    |
| DATE      | YYYY-MM-DD                     | 1000-01-01 ~ 9999-12-31                                 |
| DATETIME  | YYYY-MM-DD HH:MM:SS[.fraction] | 1000-01-01 00:00:00.000000 ~ 9999-12-31 23:59:59.999999 |
| TIMESTAMP | YYYYMMDDHHMMSS                 | 1970-01-01 00:00:01.000000 ~ 2038-01-19 03:14:07.999999 |

### 4. 文本字符串类型

| 类型名称   | 存储需求                                             |
| ---------- | ---------------------------------------------------- |
| CHAR(M)    | M字节,1<=M<=255（M表示列长度）                       |
| VARCHAR(M) | L+1字节，L<=M，1<=M<=65535                           |
| TINYTEXT   | L+1字节，L<2^8                                       |
| TEXT       | L+2字节，L<2^16                                      |
| MEDIUMTEXT | L+3字节，L<2^24                                      |
| LONGTEXT   | L+4字节，L<2^32                                      |
| ENUM       | 1或2个字节，取决于枚举值的数据(最大值65535)          |
| SET        | 1,2,3,4或8个字节，取决于集合成员的数量(最多64个成员) |

L：列值的实际长度

### 5. 二进制字符串

| 类型名称     |                                            | 存储需求          |
| ------------ | ------------------------------------------ | ----------------- |
| BIT(M)       | M位二进制数，最大值为64，默认为1           | 大约(M+7)/8个字节 |
| BINARY(M)    | 字节数为M，允许长度为0-M的定长二进制字符串 | M个字节           |
| VARBINARY(M) | 允许长度为0-M的变长二进制字符串            | M+1个字节         |
| TINYBLOB     | 可边长二进制数据，最多255个字节            | L+1字节，L<2^8    |
| BLOB         | 可边长二进制数据，最多2^16-1个字节         | L+2字节，L<2^16   |
| MEDIUMBLOB   | 可边长二进制数据，最多2^24-1个字节         | L+3字节，L<2^24   |
| LONGBLOB     | 可边长二进制数据，最多2^32-1个字节         | L+4字节，L<2^32   |

数据类型的选择：

1. 如果要对小数进行数值比较，最好用DECIMAL
2. float(M,D)是非标准SQL定义，尽量不要使用

3. 对于存储不大，但在速度上有要求的用CHAR，反之用VARCHAR

## 五、表属性

### 1. 列的属性

常用约束：一般建表时加

```txt
PRIMARY KEY：主键约束，主键在一个表中只能有一个
NOT NULL：非空约束，列值不能为空
UNIQUE KEY：唯一键
UNSIGNED：无符号，针对数字列
```

其他属性：根据需要后期加

```txt
KEY：索引
DEFAULT：默认值
AUTO_INCREMENT：针对数字列，顺序的自动填充数据（默认从1开始）
COMMENT：注释
```

### 2. 表的属性

1. 存储引擎：InnoDB（默认值）

2. 字符集：utf8

### 3. 字符集和校对规则

#### 3.1 字符集

1. utf8
2. utf8mb4：支持emoji

#### 3.2 校对规则（排序规则）

大小写是否敏感

## 六、视图库

存放了一些元数据

### 1. information_schema

#### 1.1 TABLES表

数据库中表的属性

例1：查询整个数据库中所有库和对应的表信息

```mysql
SELECT TABLE_SCHEMA, GROUP_CONCAT(TABLE_NAME)
FROM information_schema.TABLES
GROUP BY TABLE_SCHEMA;
```

例2：统计所有库下表的个数

```mysql
SELECT TABLE_SCHEMA, COUNT(TABLE_NAME)
FROM information_schema.TABLES
GROUP BY TABLE_SCHEMA;
```

例3：查询所有InnoDB引擎的表及所在库

```mysql
SELECT TABLE_SCHEMA, TABLE_NAME, ENGINE
FROM information_schema.`TABLES`
WHERE `ENGINE`='innoDB';
```

例4：统计world库下每张表的磁盘空间占用

```mysql
SELECT table_schema, table_name, TABLE_ROWS*AVG_ROW_LENGTH+INDEX_LENGTH
FROM information_schema.TABLES
WHERE TABLE_SCHEMA='world;
```

例5：统计所有数据库的总的磁盘占用

```mysql
SELECT table_schema, table_name, TABLE_ROWS*AVG_ROW_LENGTH+INDEX_LENGTH
FROM information_schema.TABLES;
```

## 第二部分 SQL

对数据库进行查询和修改操作的语言叫SQL(Structured Quary Language, 结构化查询语言)。

SQL主要有三个标准

1. ANSI SQL
2. SQL-92
3. SQl-99

SQL主要包含以下4个部分：

1. 数据定义语言（DDL）：DROP、CREATE、ALTER等
2. 数据操作语言（DML）：INSERT、UPDATE、DELETE
3. 数据查询语言（DQL）：SELECT
4. 数据控制语言（DCL）：GRANT、REOVKE、COMMIT、ROLLBACK等

mysql官方提供的实例数据库 https://dev.mysql.com/doc/index-other.html 

https://downloads.mysql.com/docs/world.sql.zip

### 一、DDL

### 1. 库

#### 1.1 数据库创建

```mysql
mysql> CREATE DATABASE 数据库名称;
# 或
mysql> CREATE SCHEMA 数据库名称;
# 创建数据时同时指定字符集
mysql> CREATE DATABASE 数据库名称 CHARSET utf8;
# 创建数据库是指定校对规则
mysql> CREATE DATABASE test CHARSET utf8mb4 COLLATE utf8mb4_bin;
```

查看支持的字符集

```mysql
mysql> SHOW CHARSET;
+----------+---------------------------------+---------------------+--------+
| Charset  | Description                     | Default collation   | Maxlen |
+----------+---------------------------------+---------------------+--------+
| big5     | Big5 Traditional Chinese        | big5_chinese_ci     |      2 |
| dec8     | DEC West European               | dec8_swedish_ci     |      1 |
| cp850    | DOS West European               | cp850_general_ci    |      1 |
| hp8      | HP West European                | hp8_english_ci      |      1 |
| koi8r    | KOI8-R Relcom Russian           | koi8r_general_ci    |      1 |
| latin1   | cp1252 West European            | latin1_swedish_ci   |      1 |
| latin2   | ISO 8859-2 Central European     | latin2_general_ci   |      1 |
| swe7     | 7bit Swedish                    | swe7_swedish_ci     |      1 |
| ascii    | US ASCII                        | ascii_general_ci    |      1 |
| ujis     | EUC-JP Japanese                 | ujis_japanese_ci    |      3 |
| sjis     | Shift-JIS Japanese              | sjis_japanese_ci    |      2 |
| hebrew   | ISO 8859-8 Hebrew               | hebrew_general_ci   |      1 |
| tis620   | TIS620 Thai                     | tis620_thai_ci      |      1 |
| euckr    | EUC-KR Korean                   | euckr_korean_ci     |      2 |
| koi8u    | KOI8-U Ukrainian                | koi8u_general_ci    |      1 |
| gb2312   | GB2312 Simplified Chinese       | gb2312_chinese_ci   |      2 |
| greek    | ISO 8859-7 Greek                | greek_general_ci    |      1 |
| cp1250   | Windows Central European        | cp1250_general_ci   |      1 |
| gbk      | GBK Simplified Chinese          | gbk_chinese_ci      |      2 |
| latin5   | ISO 8859-9 Turkish              | latin5_turkish_ci   |      1 |
| armscii8 | ARMSCII-8 Armenian              | armscii8_general_ci |      1 |
| utf8     | UTF-8 Unicode                   | utf8_general_ci     |      3 |
| ucs2     | UCS-2 Unicode                   | ucs2_general_ci     |      2 |
| cp866    | DOS Russian                     | cp866_general_ci    |      1 |
| keybcs2  | DOS Kamenicky Czech-Slovak      | keybcs2_general_ci  |      1 |
| macce    | Mac Central European            | macce_general_ci    |      1 |
| macroman | Mac West European               | macroman_general_ci |      1 |
| cp852    | DOS Central European            | cp852_general_ci    |      1 |
| latin7   | ISO 8859-13 Baltic              | latin7_general_ci   |      1 |
| utf8mb4  | UTF-8 Unicode                   | utf8mb4_general_ci  |      4 |
| cp1251   | Windows Cyrillic                | cp1251_general_ci   |      1 |
| utf16    | UTF-16 Unicode                  | utf16_general_ci    |      4 |
| utf16le  | UTF-16LE Unicode                | utf16le_general_ci  |      4 |
| cp1256   | Windows Arabic                  | cp1256_general_ci   |      1 |
| cp1257   | Windows Baltic                  | cp1257_general_ci   |      1 |
| utf32    | UTF-32 Unicode                  | utf32_general_ci    |      4 |
| binary   | Binary pseudo charset           | binary              |      1 |
| geostd8  | GEOSTD8 Georgian                | geostd8_general_ci  |      1 |
| cp932    | SJIS for Windows Japanese       | cp932_japanese_ci   |      2 |
| eucjpms  | UJIS for Windows Japanese       | eucjpms_japanese_ci |      3 |
| gb18030  | China National Standard GB18030 | gb18030_chinese_ci  |      4 |
+----------+---------------------------------+---------------------+--------+
41 rows in set (0.00 sec)
```

collation末尾带ci的字符集都是大小写不敏感的。使用`SHOW COLLATION;`可以查询大小写名的字符集。

数据库命令规则：

1. 库名不能大写
2. 不能以数字开头
3. 建库时需要加字符集

#### 1.2 数据库修改

1 查看数据库创建语句

```mysql
mysql> SHOW CREATE DATABASE 数据库名称;
```

```mysql
mysql> ALTER DATABASE 数据库名称 CHARSET utf8;
```

修改前的字符集应该是修改后字符前的子集

#### 1.3 数据库删除

```mysql
mysql> DROP DATABASE 数据库名称;
```

### 2. 表

#### 2.1 表定义

```mysql
CREATE TABLE 表名(
            字段名1 数据类型[完整的约束条件] [默认值],
            字段名2 数据类型[完整的约束条件] [默认值],
            ...
            [表级别的约束条件]
            );
```

实例：

```mysql
CREATE TABLE students(
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '学号',
    name VARCHAR(255) NOT NULL COMMENT '姓名',
    age TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '年龄',
    sex ENUM('f','m','n') NOT NULL DEFAULT 'n' COMMENT '性别',
    id_card CHAR(18) NOT NULL UNIQUE COMMENT '身份证',
    enrollment_time TIMESTAMP NOT NULL DEFAULT NOW() COMMENT '报名时间'
) ENGINE=INNODB CHARSET=utf8 COMMENT '学生表'
```

建表规范：

1. 表名小写
2. 不能数字开头
3. 注意字符集和存储引擎
4. 表名和业务有关
5. 每个列都要有注释
6. 选择合适的数据类型

#### 2.2 修改表

DDL会引起数据库锁表，可以使用在线DDL工具pt-osc(pt-online-schema-change)解决

##### 1. 添加字段

1.2.1 在末尾添加字段

```mysql
ALTER TABLE students ADD qq VARCHAR(20) NOT NULL UNIQUE COMMENT 'QQ号';
```

1.2.2 在指定字段后添加字段

```mysql
ALTER TABLE students ADD wechat VARCHAR(20) NOT NULL UNIQUE COMMENT '微信号' AFTER name;
```

1.2.3 在第一列前添加字段

```mysql
ALTER TABLE students ADD num INT NOT NULL  COMMENT '数字' FIRST;
```

##### 2. 删除字段

```mysql
ALTER TABLE students DROP num;
```

##### 3. 修改字段属性

修改时把所有需要的属性都加上

```mysql
ALTER TABLE students MODIFY name VARCHAR(128) NOT NULL;
```

##### 4. 修改字段名称

名称和属性都可以修改

```mysql
ALTER TABLE students CHANGE qq email VARCHAR(125);

```

#### 2.3 删除表

```mysql
DROP TABLE 表名;

```

#### 2.4 查看表

1 查看表结构

```mysql
mysql> DESC students;
+-----------------+---------------------+------+-----+-------------------+----------------+
| Field           | Type                | Null | Key | Default           | Extra          |
+-----------------+---------------------+------+-----+-------------------+----------------+
| id              | int(11)             | NO   | PRI | NULL              | auto_increment |
| name            | varchar(255)        | NO   |     | NULL              |                |
| age             | tinyint(3) unsigned | NO   |     | 0                 |                |
| sex             | enum('f','m','n')   | NO   |     | n                 |                |
| id_card         | char(18)            | NO   | UNI | NULL              |                |
| enrollment_time | timestamp           | NO   |     | CURRENT_TIMESTAMP |                |
+-----------------+---------------------+------+-----+-------------------+----------------+
6 rows in set (0.00 sec)

```

2 查看建表语句

```mysql
mysql> SHOW CREATE TABLE students\G;
*************************** 1. row ***************************
       Table: students
Create Table: CREATE TABLE `students` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '学号',
  `name` varchar(255) NOT NULL COMMENT '姓名',
  `age` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '年龄',
  `sex` enum('f','m','n') NOT NULL DEFAULT 'n' COMMENT '性别',
  `id_card` char(18) NOT NULL COMMENT '身份证',
  `enrollment_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '报名时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_card` (`id_card`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='学生表'
1 row in set (0.00 sec)

ERROR:
No query specified
```

### 二、DML

对表的增删改查

#### 1. 插入

##### 1.1 为表的所有字段插入数据

```mysql
INSERT INTO 表名 VALUES (值1,值2,...值n);
```

##### 1.2 为表的指定字段插入数据

```mysql
# 要保证每个插入的值得类型和对应类的数据类型匹配
INSERT INTO 表名(字段1,字段2,...字段n) VALUES (值1,值2,...值n);
```

##### 1.3 同时插入多条记录

```mysql
INSERT INTO 表名(字段1,字段2,...字段n) VALUES (值1,值2,...值n),(值1,值2,...值n);
```

#### 2. 更新

```mysql
UPDATE students SET name='zhangsan' WHERE id=3;
```

必须要加where条件

#### 3. 删除

##### 3.1 按条件删除

```mysql
DELETE FROM students WHERE age=0;
```

只是逻辑删除，不会回收物理空间

##### 3.2 全表删除

```mysql
DELETE FROM students;
```

DML操作，逻辑性删除，逐行删除，速度慢

```mysql
TRUNCATE TABLE students;
```

DDL操作，表段保留，数据页被清空，速度快

##### 3.3 伪删除

添加一个状态字段，用来标识是否删除

```mysql
# 添加状态字段
ALTER TABLE students ADD state TINYINT NOT NULL DEFAULT 1;
# 用UPDATE代替DELETE
UPDATE students SET state=0 WHERE id=6;
# 业务查询
SELECT * FROM students WHERE state=1;
```

### 三、DQL

#### 1. 单表查询

##### 1.1 `SELECT`单独使用

###### 1.1.1 查看系统参数

```mysql
 SELECT @@port;
 SELECT @@basedir;
 SELECT @@datadir;
 SELECT @@socket;
```

###### 1.1.2 使用内置函数

```mysql
SELECT USER();
SELECT NOW();
SELECT CONCAT(USER,"@",HOST) FROM mysql.user;
+-------------------------+
| CONCAT(USER,"@",HOST)   |
+-------------------------+
| root@10.0.0.%           |
| wordpress@10.0.0.%      |
| root@192.168.1.%        |
| mysql.session@localhost |
| mysql.sys@localhost     |
| root@localhost          |
+-------------------------+
6 rows in set (0.00 sec)

#显示为一行
SELECT GROUP_CONCAT(USER,"@",HOST) FROM mysql.user;
+--------------------------------------------------------------------------------------------------------------+
| GROUP_CONCAT(USER,"@",HOST)                                                                                  |
+--------------------------------------------------------------------------------------------------------------+
| root@10.0.0.%,wordpress@10.0.0.%,root@192.168.1.%,mysql.session@localhost,mysql.sys@localhost,root@localhost |
+--------------------------------------------------------------------------------------------------------------+
1 row in set (0.00 sec)
```

##### 1.2  单表子句 -- `FROM`

###### 1.2.1 查询所有字段

```mysql
SELECT * FROM 表名;
```

不要对大表进行操作

###### 1.2.2 查询指定字段

```mysql
SELECT 字段名 FROM 表名;
```

###### 1.2.3 查询多个字段

```mysql
SELECT 字段名1,字段名2,...字段名n FROM 表名;
```

##### 1.3 单表子句 -- `WHERE`

格式：

```mysql
SELECT 字段名1,字段名2,...字段名n
FROM 表名
WHERE 查询条件;
```

###### 1.3.1 WHERE配合等值查询（=）

```mysql
# 查询中国的城市
SELECT * FROM city WHERE CountryCode='CHN';
# 查询湖北的城市
SELECT * FROM city WHERE District='HuBei';
```

###### 1.3.2 WHERE配合比较操作符（<> 、!=、 <、 <=、 >、 >=）

```mysql
# 查询人口小于100的城市
SELECT * FROM city WHERE Population < 100;
```

###### 1.3.3 WHERE配合逻辑运算符（AND、OR）

```mysql
# 查询中国人口大于500万的城市
SELECT * FROM city WHERE CountryCode='CHN' AND Population > 5000000;
# 查询中国和美国的城市信息
SELECT * FROM city WHERE CountryCode='CHN' OR CountryCode='USA';
```

###### 1.3.4 WHERE配合模糊查询（LIKE）

```mysql
# 名字以guang开头的省
SELECT * FROM city WHERE District LIKE 'guang%'
```

`%`不能放在前面，因为不走索引

###### 1.3.5 WHERE配合`IN`语句

```mysql
# 查询中国和美国的城市信息,与OR类似
SELECT * FROM city WHERE CountryCode IN ('CHN','USA');
```

###### 1.3.6 WHERE配合`BETREEN AND`

```mysql
# 查询人口大于100万小于200万城市信息
SELECT * FROM city WHERE Population BETWEEN 1000000 AND 2000000;
```

#### 2. 分组查询

分组查询是对数据安装某个或多个字段进行分组，字段中值相等的为一组。mysql中实用GROUP BY 关键字对数据进行分组，通常和集合函数(MAX(),MIN(),COUTN(),SUM(),AVG)一起使用。

##### 2.1 单表子句-`GROUP BY`

例1：统计city表中每个国家的总人口数

```mysql
SELECT CountryCode, SUM(Population)
FROM city
GROUP BY CountryCode;
```

例2：统计中国每个省的总人口数

```mysql
SELECT District, SUM(Population)
FROM city
WHERE CountryCode='CHN'
GROUP BY District;
```

例3：统计世界上每个国家的城市个数

```mysql
SELECT CountryCode, COUNT(name)
FROM city
GROUP BY CountryCode;

```

例4：统计中国每个省的城市名字列表

```mysql
SELECT District, GROUP_CONCAT(name)
FROM city
WHERE CountryCode='CHN'
GROUP BY District;

```

##### 2.2 单表子句-`HAVING`

后过滤，用在GROUP BY之后，HAVING条件是不走索引的，一般可以用临时表解决。

例1：统计中国每个省的总人口数，只打印总人口数小于100w的信息

```mysql
SELECT district, SUM(Population)
FROM city
WHERE CountryCode='CHN'
GROUP BY District
HAVING SUM(Population)<1000000;

```

##### 2.3 单表子句-`ORDER BY`

用来排序，用在HAVING之后

例1：查询中国的城市信息，并按人口数量从大到小排序

```mysql
SELECT * FROM city
WHERE CountryCode='CHN'
ORDER BY Population DESC;

```

例2：统计中国每个省的总人口，找出大于500w的，并按总人口从大到小排序。

```mysql
SELECT district, SUM(Population)
FROM city
WHERE CountryCode='CHN'
GROUP BY District
HAVING SUM(Population)<1000000;

```

##### 2.4 单表子句-`LIMIT`

例1：统计中国每个省的总人口，找出大于500w的，并按总人口从大到小排序。显示前3名

```mysql
SELECT  District, SUM(Population) FROM city
WHERE CountryCode='CHN'
GROUP BY District
HAVING SUM(Population) > 5000000
ORDER BY SUM(Population) DESC
LIMIT 3;

```

例2：统计中国每个省的总人口，找出大于500w的，并按总人口从大到小排序。显示6到10名

```mysql
SELECT  District, SUM(Population) FROM city
WHERE CountryCode='CHN'
GROUP BY District
HAVING SUM(Population) > 5000000
ORDER BY SUM(Population) DESC
LIMIT 5,5; # 跳过5行，显示5行

```

##### 2.5 去重-`DISTINCT`

```mysql
SELECT DISTINCT(countrycode) FROM city;

```

##### 2.6 联合查询-`UNION [ALL]`

把两个结果集合并

```mysql
SELECT * FROM city WHERE CountryCode='CHN'
UNION ALL
SELECT * FROM city WHERE CountryCode='USA';

```

一般情况下，将IN或OR的语句改写成UNION ALL来提高性能。

UNION :去重复

UNION ALL：不去重

#### 3. 连接查询

例1：查找世界上人口数量小于100人的城市所在国家名和国土面积

```mysql
SELECT city.name, country.name, country.SurfaceArea
FROM city JOIN country
ON city.countrycode=country.code
WHERE city.Population<100;

```

#### 4. 别名

##### 4.1 字段别名

```mysql
SELECT
city.name AS 城市,
country.name AS 国家,
country.SurfaceArea  AS 面积,
city.Population AS 城市人口
FROM city JOIN country
ON city.CountryCode=country.Code
WHERE  .name='shenyang';

```

##### 4.2 表别名

```mysql
SELECT
a.name AS 城市,
b.name AS 国家,
b.SurfaceArea  AS 面积,
a.Population AS 城市人口
FROM city AS a JOIN country AS b
ON a.CountryCode=b.Code
WHERE a.name='shenyang';

```

### 四 SHOW语句

常用SHOW命令

```mysql
SHOW DATABASES;
SHOW TABLES;
SHOW CREATE DATABASE world;
SHOW CREATE TABLE city;
SHOW CHARSET;
show COLLATION;
SHOW ENGINES;
SHOW PROCESSLIST;
SHOW VARIABLES;
SHOW VARIABLES LIKE '%log%';
SHOW STATUS;
SHOW STATUS LIKE '%lock%';
SHOW INDEX FROM world.city;
SHOW ENGINE INNODB IN 'xxx';
SHOW BINARY LOGS;
SHOW BINLOG EVENTS IN 'xxx';
SHOW MASTER STATUS;
SHOW SLAVE STATUS\G;
SHOW GRANTS FOR root@'localhost';
```

