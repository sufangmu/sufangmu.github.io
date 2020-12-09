# SQL

## SQL简介

对数据库进行查询和修改操作的语言叫SQL(Structured Quary Language, 结构化查询语言)。

### 1. SQL标准

1. ANSI SQL
2. SQL-92
3. SQL-99

### 2. SQL分类

1. 数据定义语言（DDL, Data Definition Language）：DROP、CREATE、ALTER等
2. 数据操作语言（DML, Data Manipulation Language）：INSERT、UPDATE、DELETE
3. 数据查询语言（DQL, Data Query Language）：SELECT
4. 数据控制语言（DCL, Data Control Language）: GRANT、REOVKE、
5. 事务控制语言（TCL, Tansaction Control Language）：COMMIT、ROLLBACK等

### 3. 语法规范

1. 不区分大小写，建议关键字大写，表名、列名小写
2. 每句话用`;`或`\g`结尾
3. 每条命令根据需要，各子句一般分行写，关键字不能缩写也不能分行
4. 注释
   - 单行注释：`# 注释文字`
   - 单行注释：`-- 注释文字（要有空格）`
   - 多行注释：`/* 注释文字 */`

### 4. SQL语句的执行过程

#### 1. 连接层

1. 提供连接协议：TCP/IP，SOCKET
2. 提供验证：用户、密码、IP、SOCKET
3. 提供专用连接线程：接收用户SQL，返回结果

#### 2. SQL层

1. 接收上层传送的SQL语句
2. 语法验证
3. 语义检查：判断SQL语句的类型
4. 权限检查：用户对库、表有没有权限
5. 解析器：进行SQL预处理，产生执行计划
6. 优化器：根据解析器得出的多种执行计划进行判断，选择最优的执行计划代价模式
7. 执行器：根据最优执行计划，执行SQL语句，产生执行结果
8. 提供查询缓存（默认不开启）
9. 提供日志记录（默认不开启）

#### 3. 存储引擎层

负责根据SQL层执行的结果，从磁盘上拿数据

## 一、DDL

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

###### 1.2.1 在末尾添加字段

```mysql
ALTER TABLE students ADD qq VARCHAR(20) NOT NULL UNIQUE COMMENT 'QQ号';
```

###### 1.2.2 在指定字段后添加字段

```mysql
ALTER TABLE students ADD wechat VARCHAR(20) NOT NULL UNIQUE COMMENT '微信号' AFTER name;
```

###### 1.2.3 在第一列前添加字段

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

##### 1 查看表结构

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

##### 2 查看建表语句

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

以官方提供的[world数据库](./example/world.sql.zip)为例。下载地址：https://downloads.mysql.com/docs/world.sql.zip。另外mysql官方还提供了其他示例数据库，在 https://dev.mysql.com/doc/index-other.html 可以下载到。

### 1. 基础查询

语法：

```mysql
SELECT 查询列表
from 表名;
```

特点：

1. 查询列表可以是表中的字段、常量、表达式、函数

2. 查询的结果是一个虚拟的表格



#### 1.1 `SELECT`单独使用

##### 1.1.1 查看系统参数

```mysql
mysql [(none)]>SELECT @@port;
+--------+
| @@port |
+--------+
|   3306 |
+--------+
1 row in set (0.00 sec)
```

##### 1.1.2 使用内置函数

```mysql
mysql [(none)]>SELECT NOW();
+---------------------+
| NOW()               |
+---------------------+
| 2020-12-07 22:30:03 |
+---------------------+
1 row in set (0.00 sec)
```

##### 1.1.3 查询表达式

```mysql
mysql [(none)]>SELECT 3*5;
+-----+
| 3*5 |
+-----+
|  15 |
+-----+
1 row in set (0.00 sec)
```

#### 1.2  单表子句 - `FROM`

##### 1.2.1 查询所有字段

```mysql
mysql [world]>SELECT * FROM country;
# 不要对大表进行操作
```

##### 1.2.2 查询指定字段

```mysql
mysql [world]>SELECT name FROM country;
```

##### 1.2.3 查询多个字段

```mysql
mysql [world]>SELECT name, population FROM country;
```

### 2. 条件查询 - `WHERE`

语法：

```mysql
SELECT 字段名1,字段名2,...字段名n
FROM 表名
WHERE 查询条件;
```

#### 2.1 按条件表达式筛选（=、<> 、!=、 <、 <=、 >、 >=）

```mysql
# 查询湖北的城市
SELECT * FROM city WHERE District='HuBei';
# 查询人口小于100的城市
SELECT * FROM city WHERE Population < 100;
```

#### 2.2 按逻辑逻辑表达式筛选（AND、OR）

主要作用：用于连接条件表达式

```mysql
# 查询中国人口大于500万的城市
SELECT * FROM city WHERE CountryCode='CHN' AND Population > 5000000;
# 查询中国和美国的城市信息
SELECT * FROM city WHERE CountryCode='CHN' OR CountryCode='USA';
```

#### 2.3 模糊查询

##### 2.3.1 WHERE配合`LIKE`语句

1.  一般和通配符搭配使用，可以判断字符型数值或数值型
2. `%`匹配任意多个字符，包含0个字符
3. `_`匹配任意单个字符

```mysql
# 名字以guang开头的省
SELECT * FROM city WHERE District LIKE 'guang%'
```

> `%`不能放在前面，因为不走索引

##### 2.3.2 WHERE配合`IN`语句

1. 含义：判断某字段的值是否属于`IN`列表中的某一项 
2.  使用`IN`提高语句简洁度 
3.  `IN`相当于等于，所以不支持通配符（`like`才支持） 

```mysql
# 查询中国和美国的城市信息,与OR类似
SELECT * FROM city WHERE CountryCode IN ('CHN','USA');
```

##### 2.3.4 WHERE配合`BETREEN AND`

1.  使用between and可以提高语句的简洁度
2.  包含临界值； 
3.  两个临界值不能替换顺序； 

```mysql
# 查询人口大于100万小于200万城市信息
SELECT * FROM city WHERE Population BETWEEN 1000000 AND 2000000;
```

##### 2.3.5 WHERE配合`IS [NOT] NULL`

1. 用于判断`null`值 
2.  `=`或者`<>`不能用于判断`null`值 

```mysql
SELECT name FROM country WHERE indepyear IS NULL;
```

### 3. 排序查询

语法

```mysql
SELECT 查询列表
FROM 表
[WHERE 筛选条件]
ORDER BY 排序列表 [ASC|DESC]
```

1. `ASC`代表的是升序，`DESC` 代表的是降序，如果不写，默认是升序
2. `ORDER BY`子句中可以支持单个字段、多个字段、表达式、函数、别名 
3.  `ORDER BY`子句一般是放在查询语句的最后面，但`limit`子句除外 

```mysql
# 查询中国的城市信息，并按人口数量从大到小排序
SELECT * FROM city
WHERE CountryCode='CHN'
ORDER BY Population DESC;
```

### 4. 分组查询

**语法**

```mysql
select 分组函数，列（要求出现在group by的后面）
from 表
[where 筛选条件]
group by 分组的列表
[having 分组后的筛选]
[order by 子句]
```

 注意：查询列表比较特殊，要求是分组函数和group by后出现的字段 

特点：

1. 分组查询中的筛选条件分为两类：

 数据源 位置 关键字

分组前筛选 原始表 group by子句的前面 where

分组后筛选 分组后的结果集 group by子句的后面 having

- 分组函数做条件肯定是放在having子句中
- 能用分组前筛选的，就优先考虑使用分组前筛选
- group by子句支持单个字段分组，多个字段分组（多个字段之间用逗号隔开没有顺序要求），表达式或函数（用得较少）
- 也可以添加排序（排序放在整个分组查询最后位置）





#### 2.1 单表子句-`GROUP BY`

**语法**

```mysql

```

1. 


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

#### 2.2 单表子句-`HAVING`

后过滤，用在GROUP BY之后，HAVING条件是不走索引的，一般可以用临时表解决。

例1：统计中国每个省的总人口数，只打印总人口数小于100w的信息

```mysql
SELECT district, SUM(Population)
FROM city
WHERE CountryCode='CHN'
GROUP BY District
HAVING SUM(Population)<1000000;

```

#### 2.3 单表子句-`ORDER BY`

用来排序，用在HAVING之后

例1：

```mysql


```

例2：统计中国每个省的总人口，找出大于500w的，并按总人口从大到小排序。

```mysql
SELECT district, SUM(Population)
FROM city
WHERE CountryCode='CHN'
GROUP BY District
HAVING SUM(Population)<1000000;

```

#### 2.4 单表子句-`LIMIT`

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

#### 2.5 去重-`DISTINCT`

```mysql
SELECT DISTINCT(countrycode) FROM city;
```

#### 2.6 联合查询-`UNION [ALL]`

把两个结果集合并

```mysql
SELECT * FROM city WHERE CountryCode='CHN'
UNION ALL
SELECT * FROM city WHERE CountryCode='USA';
```

一般情况下，将IN或OR的语句改写成UNION ALL来提高性能。

UNION :去重复

UNION ALL：不去重

### 3. 连接查询

又称多表查询，当查询的字段来自于多个表时，就会用到连接查询。

**笛卡尔积现象**：当两张表进行连接查询的时候，没有任何条件进行限制，最终的查询结果条数是两张表记录条数的乘积。

使用[myemployees](./example/myemployees.sql)数据库作为实例

#### 3.1 分类

1. 按年代分类
   - SQL92标准： 仅支持内连接 
   - SQL99标准：推荐使用，支持内连接、外连接（左外和右外）、交叉连接
2. 按连接方式分类
   1. 内连接
      1. 等值连接
      2. 非等值连接
      3. 自连接
   2. 外连接
      1. 左外连接
      2. 右外连接
      3. 全外连接（MySQL不支持）
   3. 交叉连接

#### 3.2 SQL92语法

##### 1. 等值连接

特点：

1. 多表等值连接的结果为多表的交集部分

2. n表连接，至少需要n-1个连接条件

3. 多表的顺序没有要求

4. 一般需要为表起别名

5. 可以搭配前面介绍的所有子句使用，比如排序、分组、筛选

###### 1.1 简单查询

```mysql
SELECT 
  last_name,
  department_name 
FROM
  employees,
  departments 
WHERE employees.`department_id` = departments.`department_id` ;
```

###### 1.2 为表起别名

```mysql
# 查询员工名、工种号、工种名
SELECT 
  last_name,
  e.`job_id`,
  job_title 
FROM
  employees e,
  jobs j 
WHERE e.`job_id` = j.`job_id` ;
```

###### 1.3 表的顺序可以调换

```mysql
# 查询员工名、工种号、工种名
SELECT 
  last_name,
  e.`job_id`,
  job_title 
FROM
  jobs j ,
  employees e
WHERE e.`job_id` = j.`job_id` ;
```

###### 1.4 加筛选条件

```mysql
# 查询有奖金的员工名、部门名
SELECT 
  last_name,
  department_name 
FROM
  employees AS e,
  departments AS d 
WHERE e.`department_id` = d.`department_id` 
  AND e.`commission_pct` IS NOT NULL ;
```

###### 1.5 加分组

```mysql
# 查询每个城市的部门个数
SELECT 
  COUNT(*) 个数,
  city 
FROM
  departments d,
  locations l 
WHERE d.`location_id` = l.`location_id` 
GROUP BY city ;
```

查询结果

```mysql
+--------+---------------------+
| 个数   | city                |
+--------+---------------------+
|      1 | London              |
|      1 | Munich              |
|      1 | Oxford              |
|     21 | Seattle             |
|      1 | South San Francisco |
|      1 | Southlake           |
|      1 | Toronto             |
+--------+---------------------+
7 rows in set (0.00 sec)
```

###### 1.6 加排序

```mysql
# 查询每个工种的工种名和员工的个数，并且按员工个数降序
SELECT 
  job_title,
  COUNT(*) AS 个数 
FROM
  employees e,
  jobs j 
WHERE e.`job_id` = j.`job_id` 
GROUP BY job_title 
ORDER BY 个数 DESC ;
```

1.7 三表连接

```mysql
# 查询员工名、部门名和所在的城市
SELECT 
  last_name,
  department_name,
  city 
FROM
  employees e,
  departments d,
  locations l 
WHERE e.`department_id` = d.`department_id` 
  AND d.`location_id` = l.`location_id` ;
```

##### 2. 非等值连接

```mysql
# 查询员工的工资和工资级别
SELECT 
  salary,
  grade_level 
FROM
  employees e,
  job_grades g 
WHERE salary BETWEEN g.lowest_sal 
  AND g.highest_sal ;
```

##### 3. 自连接

```mysql
# 查询员工名和上级的名称
```



#### 3.3 SQL99语法

语法：

```mysql
select 查询列表
from 表1 别名 [连接类型]
join 表2 别名
on 连接条件
[where 筛选条件]
[group by 分组]
[having 筛选条件]
[order by 排序列表]
# 连接类型
# 内连接：inner
# 外连接
#    左外：left  [outer]
#    右外：right [outer]
#    全外：full  [outer]
# 交叉连接：cross
```

##### 1. 内连接

特点：

1. 添加排序、分组、筛选
2. inner可以省略
3. 筛选条件放在where后面，连接条件放在on后面，提高分离性，便于阅读
4. inner join连接和sql92语法中的等值连接效果是一样的，都是查询多表的交集

###### 1.1 等值连接

例1 查询员工名、部门名 

```mysql
SELECT 
  last_name,
  department_name 
FROM
  employees e 
  INNER JOIN departments d 
    ON e.`department_id` = d.`department_id` ;
```

查询结果

```mysql
+-------------+-----------------+
| last_name   | department_name |
+-------------+-----------------+
| Whalen      | Adm             |
...
| Higgins     | Acc             |
| Gietz       | Acc             |
+-------------+-----------------+
106 rows in set (0.01 sec)
```

例2  查询哪个部门的部门员工个数>3的部门名和员工个数，并按个数降序排序 

```mysql
SELECT 
  department_name,
  COUNT(*) 员工个数 
FROM
  departments d 
  INNER JOIN employees e 
    ON d.`department_id` = e.`department_id` 
GROUP BY d.`department_id` 
HAVING 员工个数 > 3 
ORDER BY 员工个数 DESC ;
```

查询结果

```mysql
+-----------------+--------------+
| department_name | 员工个数     |
+-----------------+--------------+
| Shi             |           45 |
| Sal             |           34 |
| Fin             |            6 |
| Pur             |            6 |
| IT              |            5 |
+-----------------+--------------+
5 rows in set (0.01 sec)
```

###### 1.2 非等值连接

例1  查询员工的工资级别 

```mysql
SELECT 
  salary,
  grade_level 
FROM
  employees e 
  INNER JOIN job_grades g 
    ON e.`salary` BETWEEN g.`lowest_sal` 
    AND g.`highest_sal` ;
```

例2  查询每个工资级别>20的个数，并且按工资级别降序 

```mysql
SELECT 
  COUNT(*),
  grade_level 
FROM
  employees e 
  INNER JOIN job_grades g 
    ON e.`salary` BETWEEN g.`lowest_sal` 
    AND g.`highest_sal` 
GROUP BY grade_level 
HAVING COUNT(*) > 20 
ORDER BY grade_level DESC ;
```

查询结果

```mysql
+----------+-------------+
| COUNT(*) | grade_level |
+----------+-------------+
|       38 | C           |
|       26 | B           |
|       24 | A           |
+----------+-------------+
3 rows in set (0.01 sec)
```

###### 1.3 自连接

例1  查询员工的名字、上级的名字

```mysql
SELECT 
  e.last_name,
  m.last_name 
FROM
  employees e 
INNER JOIN employees m 
  ON e.`manager_id` = m.`employee_id` ;
```

##### 2. 外连接

 应用场景：用于查询一个表中有，另一个表没有的记录 

 特点： 

1. 外连接的查询结果为主表中的所有记录，如果从表中有和它匹配的，则显示匹配的值，如果从表中没有和它匹配的，则显示null

2. 外连接查询结果=内连接结果+主表中有而从表中没有的记录

3. 左外连接：left join左边的是主表

4. 右外连接：right join右边的是主表

5. 左外和右外交换两个表的顺序，可以实现同样的效果

6. 全外连接=内连接的结果+表1中有但表2中没有的+表2中有但表1中没有的

###### 2.1 左外连接

```mysql
# 查询哪个部门没有员工
SELECT 
  d.*,
  e.employee_id 
FROM
  departments d 
  LEFT OUTER JOIN employees e 
    ON d.`department_id` = e.`department_id` 
WHERE e.`employee_id` IS NULL ;
```

###### 2.2 右外连接

```mysql
SELECT 
  d.*,
  e.employee_id 
FROM
  employees e 
  RIGHT OUTER JOIN departments d 
    ON d.`department_id` = e.`department_id` 
WHERE e.`employee_id` IS NULL ;
```

###### 3.3 全外连接（mysql不支持）

##### 3. 交叉连接（笛卡尔乘积）



### 4.子查询

1. 含义：出现在其他语句中的select语句，称为子查询或内查询；外部的查询语句，称为主查询或外查询 。

2. 嵌套在其他语句内部的select语句称为子查询或内查询

3. 外面的语句可以是insert、update、delete、select等，一般select作为外面语句较多

4. 外面如果为select语句，则此语句称为外查询或主查询

### 4. 别名

作用：

1.  提高语句的简洁度 
2.  区分多个重名的字段 
3.  如果为表起了别名，则查询 的字段就不能使用原始的表明去限定 

#### 4.1 字段别名

```mysql
SELECT
city.name AS 城市,
country.name AS 国家,
country.SurfaceArea  AS 面积,
city.Population AS 城市人口
FROM city JOIN country
ON city.CountryCode=country.Code
WHERE  city.name='shenyang';
```

查询结果

```mysql
+----------+--------+------------+--------------+
| 城市     | 国家   | 面积       | 城市人口     |
+----------+--------+------------+--------------+
| Shenyang | China  | 9572900.00 |      4265200 |
+----------+--------+------------+--------------+
1 row in set (0.01 sec)
```

#### 4.2 表别名

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

查询结果
```mysql
+----------+--------+------------+--------------+
| 城市     | 国家   | 面积       | 城市人口     |
+----------+--------+------------+--------------+
| Shenyang | China  | 9572900.00 |      4265200 |
+----------+--------+------------+--------------+
1 row in set (0.01 sec)
```

> AS 可以省略
>
> 如果别名有特殊符号要加双引号

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

### 2. 分组查询

**语法**

```mysql
SELECT 分组函数，列（要求出现在group by的后面）
FROM 表
[WHERE 筛选条件]
GROUP BY 分组的列表
[HAVING 分组后的筛选]
[GROUP BY 子句]
```

**注意**： 查询列表比较特殊，要求是分组函数和group by后出现的字段 

**特点**：

1.  分组查询中的筛选条件分为两类： 
    - 分组前筛选：原始表`group by`子句的前面 `where`

    - 分组后筛选：分组后的结果集`group by`子句的后面`having`

2.  分组函数做条件肯定是放在`having`子句中 
3.  能用分组前筛选的，就优先考虑使用分组前筛选 
4.  group by子句支持单个字段分组，多个字段分组（多个字段之间用逗号隔开没有顺序要求），表达式或函数（用得较少）
5.  也可以添加排序（排序放在整个分组查询最后位置） 