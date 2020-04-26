# 常用SQL

mysql官方提供的实例数据库 https://dev.mysql.com/doc/index-other.html 

https://downloads.mysql.com/docs/world.sql.zip

## 一、DDL

### 1.库

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

## 二、DML

对表的增删改查

### 1. 插入

#### 1.1 为表的所有字段插入数据

```mysql
INSERT INTO 表名 VALUES (值1,值2,...值n);
```

#### 1.2 为表的指定字段插入数据

```mysql
# 要保证每个插入的值得类型和对应类的数据类型匹配
INSERT INTO 表名(字段1,字段2,...字段n) VALUES (值1,值2,...值n);
```

#### 1.3 同时插入多条记录

```mysql
INSERT INTO 表名(字段1,字段2,...字段n) VALUES (值1,值2,...值n),(值1,值2,...值n);
```

### 2. 更新

```mysql
UPDATE students SET name='zhangsan' WHERE id=3;
```

必须要加where条件

### 3. 删除

#### 3.1 按条件删除

```mysql
DELETE FROM students WHERE age=0;
```

只是逻辑删除，不会回收物理空间

#### 3.2 全表删除

```mysql
DELETE FROM students;
```

DML操作，逻辑性删除，逐行删除，速度慢

```mysql
TRUNCATE TABLE students;
```

DDL操作，表段保留，数据页被清空，速度快

#### 3.3 伪删除

添加一个状态字段，用来标识是否删除

```mysql
# 添加状态字段
ALTER TABLE students ADD state TINYINT NOT NULL DEFAULT 1;
# 用UPDATE代替DELETE
UPDATE students SET state=0 WHERE id=6;
# 业务查询
SELECT * FROM students WHERE state=1;
```

## 三、DQL

### 1. 单表查询

#### 1.1 SELECT单独使用

##### 1.1.1 查看系统参数

```mysql
 SELECT @@port;
 SELECT @@basedir;
 SELECT @@datadir;
 SELECT @@socket;
```

##### 1.1.2 使用内置函数

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

### 1.2  单表子句 -- FROM

##### 1.2.1 查询所有字段

```mysql
SELECT * FROM 表名;
```

不要对大表进行操作

##### 1.2.2 查询指定字段

```mysql
SELECT 字段名 FROM 表名;
```

##### 1.2.3 查询多个字段

```mysql
SELECT 字段名1,字段名2,...字段名n FROM 表名;
```

### 1.3 单表子句 -- WHERE

格式：

```mysql
SELECT 字段名1,字段名2,...字段名n 
FROM 表名
WHERE 查询条件;
```

##### 1.3.1 WHERE配合等值查询（=）

```mysql
# 查询中国的城市
SELECT * FROM city WHERE CountryCode='CHN';
# 查询湖北的城市
SELECT * FROM city WHERE District='HuBei';
```

##### 1.3.2 WHERE配合比较操作符（<> 、!=、 <、 <=、 >、 >=）

```mysql
# 查询人口小于100的城市
SELECT * FROM city WHERE Population < 100;
```

##### 1.3.3 WHERE配合逻辑运算符（AND、OR）

```mysql
# 查询中国人口大于500万的城市
SELECT * FROM city WHERE CountryCode='CHN' AND Population > 5000000;
# 查询中国和美国的城市信息
SELECT * FROM city WHERE CountryCode='CHN' OR CountryCode='USA';
```

##### 1.3.4 WHERE配合模糊查询（LIKE）

```mysql
# 名字以guang开头的省
SELECT * FROM city WHERE District LIKE 'guang%'
```

`%`不能放在前面，因为不走索引

##### 1.3.5 WHERE配置`IN`语句

```mysql
# 查询中国和美国的城市信息,与OR类似
SELECT * FROM city WHERE CountryCode IN ('CHN','USA');
```

##### 1.3.6 WHERE配合`BETREEN AND`

```mysql
# 查询人口大于100万小于200万城市信息
SELECT * FROM city WHERE Population BETWEEN 1000000 AND 2000000;
```

### 2. 分组查询

分组查询是对数据安装某个或多个字段进行分组，字段中值相等的为一组。mysql中实用GROUP BY 关键字对数据进行分组，通常和集合函数(MAX(),MIN(),COUTN(),SUM(),AVG)一起使用。

#### 2.1 单表子句-GROUP BY

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

#### 2.2 单表子句-HAVING

后过滤，用在GROUP BY之后，HAVING条件是不走索引的，一般可以用临时表解决。

例1：统计中国每个省的总人口数，只打印总人口数小于100w的信息

```mysql
SELECT district, SUM(Population)
FROM city
WHERE CountryCode='CHN'
GROUP BY District
HAVING SUM(Population)<1000000;
```

#### 2.3 单表子句-ORDER BY

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

#### 2.4 单表子句-LIMIT

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

#### 2.5 去重-DISTINCT

```mysql
SELECT DISTINCT(countrycode) FROM city;
```

#### 2.6 联合查询-UNION [ALL]

把两个结果集合并

```mysql
SELECT * FROM city WHERE CountryCode='CHN'
UNION ALL
SELECT * FROM city WHERE CountryCode='USA';
```

一般情况下，将IN或OR的语句改写成UNION ALL来提高性能。

UNION :去重复

UNION ALL：不去重

































































































#### 1.3 聚合函数查询
1. COUNT()
统计数据表中包含记录行的总数
```mysql
# 统计用户总数
SELECT COUNT(username) AS total_user FROM accounts;
```
2. SUM()
返回指定列的总和
```mysql
SELECT SUM(age) FROM accounts; 
```
3. AVG()
求平均值
```mysql
 SELECT AVG(age) FROM accounts;
```
4. MAX()
返回列中的最大值
```mysql
SELECT MAX(age) FROM accounts;
```

5. MIN()
返回列中的最小值
```mysql
SELECT MIN(age) FROM accounts;
```

#### 1.4 连接查询

##### 1.4.1 内连接查询

使用比较运算符进行表见某些列数据的比较操作，并列出表中与连接条件相匹配的数据，组合成新记录。在内连接查询中，只有满足条件的记录才能出现在结果关系中。

```mysql
SELECT hostname,machines.asset_id,name,size FROM machines,disks where disks.asset_id = machines.asset_id; 
#或
SELECT hostname,machines.asset_id,name,size FROM machines INNER JOIN disks ON disks.asset_id = machines.asset_id;  
```

##### 1.4.2 外连接查询

左连接：返回包括左表中所有记录和右表中连接字段相等的记录
右连接：返回包括右表中所有记录和左表中连接字段相等的记录

1. 左连接（LEFT  OUTER JOIN）
```mysql
SELECT hostname,machines.asset_id,name,size FROM machines LEFT  OUTER JOIN disks ON disks.asset_id = machines.asset_id; 
```

2. 右连接（RIGHT  OUTER JOIN）
```mysql
 SELECT hostname,machines.asset_id,name,size FROM machines RIGHT  OUTER JOIN disks ON disks.asset_id = machines.asset_id;
```
##### 1.4.3 复合条件连接查询
在连接查询的过程中，添加过滤条件，限制查询的结果，使查询的结果更加准确。
```mysql
SELECT hostname,machines.asset_id,name,size FROM machines INNER JOIN disks ON disks.asset_id = machines.asset_id AND size > 200; 
```
#### 1.5 子查询

子查询是指一个查询语句嵌套在另一个查询语句内部的查询。在SELECT子句中先计算子查询，子查询的结果作为外层另一个查询的过滤条件，查询可以基于一个表或者多个表。

1. 带ANY、SOME关键字的子查询
   ANY和SOME关键词是同义词，表示满足其中任一条件，她们运行创建一个表达式对子查询的返回值列表进行比较，只要满足内查询中的任何一个比较条件，就返回一个结果作为外层查询的条件
```mysql
mysql>SELECT * FROM computer_stu WHERE score>=ANY (SELECT score FROM scholarship);
```

2. 带ALL关键词的子查询
使用ALL时需要同时满足所有内层查询的条件
```mysql
mysql>SELECT * FROM computer_stu WHERE score>=ALL (SELECT score FROM scholarship);
```

3. 带EXISTS关键字的子查询
EXISTS关键字后面的参数是一个任意的子查询，系统对子查询进行运算以判断它是否返回行，如果至少返回一行，那么EXISTS的结果为true，此时外层查询语句将进行查询，如果子查询没有返回任何行，那么EXISTS返回的结果是false，此时外层语句将不进行查询
```mysql
mysql>SELECT * FROM employee WHERE EXISTS ( SELECT d_name FROM department WHERE d_id=103);
```

4. 带IN关键字的子查询
内层查询语句仅仅返回一个数据列，这个数据列里的值将提供给外层查询语句进行比较
```mysql
mysql>SELECT * FROM employee WHERE d_id IN ( SELECT d_id FROM department);
```

5. 带比较运算符的子查询
<、 <=、 =、 >=、 !=
```mysql
mysql>SELECT id,score FROM computer_stu WHERE score>= (SELECT score FROM scholarship WHERE level=1 );
```
#### 1.6 合并查询结果

把多个SELECT的结果组合成单个结果集，合并时，两个表对应的列和数据类型必须相同。

语法规则
```mysql
SELECT 字段1,字段2,... FROM 表1
UNION [ALL]
SELECT 字段1,字段2,... FROM 表2;
```

UNION：执行的时候删除重复的记录，返回的行都是唯一的
UNION ALL：不删除重复的行，也不对结果进行自动排序

#### 1.7 使用正则表达式查询
```mysql
mysql>SELECT * FROM info WHERE name REGEXP '^L';
```

#### 1.8 为表和字段取别名

1. 为表取别名
语法规则
```mysql
表名 [AS] 表别名
```
```mysql
mysql>SELECT * FROM department d WHERE d.d_id=1001;
```

2. 为字段取别名
语法规则
```mysql
字段名 [AS] 字段别名
```
```mysql
SELECT d_id AS department, d_name AS department_name FROM department;
```

### 2. 插入


#### 2.4 将查询结果插入到表中

```mysql
INSERT INTO 表名1(字段1,字段2,...字段n)
SELECT 字段1,字段2,...字段n
FROM 表2;
```



## 四、索引

### 1. 索引介绍

索引是一个单独的、存在磁盘上的数据库结构，它们包含着对数据表里所有记录的引用指针。使用索引可以快速的找出某个或多个列中有一特定值的行如果没有索引，MySQL必须从第一行开始读完整个表，直到找出相关的行。表越大，花费的时间越多。。
### 2. 索引优缺点

**优点：**
1. 通过创建唯一索引，可以保证数据库中每一行数据的唯一性
2. 可以大大加快数据的查询速度，这是创建索引的最主要原因
3. 在实现数据的参考完整性方面，可以加快表和表之间的连接
4. 可使用分组查询和排序子句之间进行数据查询时，可以减少查询中分组和排序的时间

**缺点：**
1. 创建索引和维护索引需要耗费时间，并且随着数据量的增加，所消耗的时间也会增加
2. 索引需要占磁盘空间
3. 对表中的数据进行增加、删除、修改时，索引也要动态的维护，降低了数据的维护速度

### 3. 索引的分类

1. 普通索引
	基本索引类型，允许在定义索引的列中插入重复值和空值，其作用只是加快数据的访问速度。
2. 唯一索引
	索引列的值必须唯一，可以允许有空值，可以减少查询索引列操作的时间，尤其是对比较庞大的数据表
3. 单列索引
	一个索引只包含单个列，一个表可以有多个单列索引
4. 组合索引
	在表的多个字段上组个创建索引，只有在查询条件中使用了这些字段的左边字段时，索引才会被使用
5. 全文索引
	只能在MyISAM存储引擎支持
6. 空间索引
	只能在MyISAM存储引擎支持
	
### 4. 设计原则

1. 索引不是越多越好，一个表中如有大量的索引，不仅占用磁盘空间，而且会影响INSERT、DELETE、UPDATE等语句的性能
2. 避免对经常更新的表进行过多的索引。并且索引中的列尽可能少
3. 数据量小的表最好不要使用索引。
4. 当唯一性时某种数据本身的特征时，指定唯一索引

### 5. 创建索引

#### 1. 创建表的时候创建索引

语法规则
```mysql
CREATE TABLE 表名(字段名 数据类型 [完整性约束条件],
[UNIQUE | FULLTEXT | SPATIAL ] INDEX | KEY 
[别名] (字段名 [(长度)] [ASC | DESC ] )
);
						
UNIQUE:唯一性索引
FULLTEXT：全文索引
SPATIAL：空间索引
INDEX|KEY ：作用相同，用来执行创建索引
长度：指定索引的长度
ASC | DESC ： 升序或降序的索引值存储
```

1. 创建普通索引
```mysql
CREATE TABLE accounts( 
            id int PRIMARY KEY AUTO_INCREMENT,
            username VARCHAR(20), 
            password VARCHAR(20), 
            INDEX(username) 
            );                                
```

2. 创建唯一索引
```mysql
CREATE TABLE accounts( 
            id int PRIMARY KEY AUTO_INCREMENT, 
            username VARCHAR(20), 
            password VARCHAR(20), 
            UNIQUE INDEX(username) 
            );                                 
```

3. 创建单列索引
```mysql
CREATE TABLE accounts( 
            id int PRIMARY KEY AUTO_INCREMENT,
            username VARCHAR(20), 
            password VARCHAR(20), 
            UNIQUE INDEX user(username) 
            );                                
```

4. 创建组合索引
```mysql
CREATE TABLE accounts( 
username VARCHAR(20), 
email VARCHAR(50), 
password VARCHAR(20), 
INDEX user(username,email)
);                        
```

#### 2.  在已经存在的表上创建索引

1. 使用ALTER TABLE语句创建索引
语法规则
```mysql
ALTER TABLE 表名 ADD [UNIQUE|FULLTEXT|SPATIAL] [INDEX|KEY] [索引名] (字段名[(长度)] [ASC|DESC])
```
例：
```mysql
ALTER TABLE accounts ADD INDEX user (username);
```


2. 使用CREATE INDEX创建索引
语法规则
```mysql
CREATE [UNIQUE|FULLTEXT|SPATIAL] INDEX 索引名 ON 表名 (字段名 [(长度)] [ASC|DESC])
```
```mysql
CREATE UNIQUE INDEX user on accounts (username);
```

### 6. 删除索引

#### 6.1 使用ALTER TABLE删除索引

语法规则

```mysql
ALTER TABLE 表名 DROP INDEX 索引名;
```

#### 6.2 使用DROP INDEX语句删除索引

```mysql
DROP INDEX 索引名 ON 表名;
```



## 五、视图







## 六、存储过程与函数

存储过程：一条或者多条SQL语句的集合





## 七、触发器







## 八、优化