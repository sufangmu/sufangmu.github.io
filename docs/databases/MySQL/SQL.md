SQL

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
	1. 单行注释：`# 注释文字`	
	2. 单行注释：`-- 注释文字（要有空格）`
	3. 多行注释：`/* 注释文字 */`

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
mysql> CREATE DATABASE IF NOT EXISTS 数据库名称;
# 或
mysql> CREATE SCHEMA 数据库名称;
# 创建数据时同时指定字符集
mysql> CREATE DATABASE 数据库名称 CHARSET utf8;
# 创建数据库是指定校对规则
mysql> CREATE DATABASE test CHARSET utf8mb4 COLLATE utf8mb4_bin;
```

查看支持的字符集

```mysql
SHOW CHARSET;
```

collation末尾带ci的字符集都是大小写不敏感的。使用`SHOW COLLATION;`可以查询大小写名的字符集。

数据库命令规则：

1. 库名不能大写
2. 不能以数字开头
3. 建库时需要加字符集

#### 1.2 数据库修改

```mysql
ALTER DATABASE 数据库名称 CHARSET utf8;
```

修改前的字符集应该是修改后字符前的子集

#### 1.3 数据库删除

```mysql
DROP DATABASE IF EXISTS 数据库名称;
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
) ENGINE=INNODB CHARSET=utf8 COMMENT '学生表';
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

#### 2.5 复制表

##### 2.5.1 仅复制表结构

```mysql
CREATE TABLE stu1 LIKE students;
```

##### 2.5.2 复制表结构和全部数据

```mysql
CREATE TABLE stu2 SELECT * FROM students;
```

##### 2.5.2 复制表结构和部分数据

```mysql
CREATE TABLE stu3 SELECT * FROM students WHERE id > 5;
```

## 二、DML

对表的增删改

### 1. 插入

#### 1.1方式一

##### 1.1.1 为表的所有字段插入数据

```mysql
INSERT INTO 表名 VALUES (值1,值2,...值n);
```

##### 1.1.2 为表的指定字段插入数据

```mysql
# 要保证每个插入的值得类型和对应类的数据类型匹配
INSERT INTO 表名(字段1,字段2,...字段n) VALUES (值1,值2,...值n);
```

##### 1.1.3 同时插入多条记录

```mysql
INSERT INTO 表名(字段1,字段2,...字段n) VALUES (值1,值2,...值n),(值1,值2,...值n);
```

#### 1.2 方式二

##### 1.2.1  为表的指定字段插入数据

```mysql
INSERT INTO 表名 SET 字段1 = 值1,
字段2 = 值2,
字段3 = 值3;
```

两种方式的区别：

1.  方式1支持插入多行，但是方式2不支持 
2.  方式1支持子查询，方式2不支持 

### 2. 修改

#### 2.1 修改单表的记录

```mysql
UPDATE 表名
SET 列=新值，列=新值…
WHERE 筛选条件；
```

#### 2.2 修改多表的记录

sql92语法

```mysql
UPDATE 表1 别名，表2 别名
SET 列=值…
WHERE 筛选条件
AND 筛选条件；
```

 sql99语法： 

```mysql
UPDATE 表1 别名
[INNER|LEFT|RIGHT] JOIN 表2 别名
ON 连接条件
SET 列=值，…
WHERE 筛选条件；
```

### 3. 删除

#### 3.1 `DELETE`

##### 3.1.1 单表删除

```mysql
DELETE FROM 表名 WHERE 筛选条件;
```

##### 3.1.2 多表删除

sql92语法

```mysql
DELETE 别名（要删哪个表就写哪个表的别名，都删就都写）
FROM 表1 别名，表2 别名
WHERE 连接条件
AND 筛选条件
LIMIT 条目数；
```

 sql99语法

```mysql
DELETE 别名（要删哪个表就写哪个表的别名，都删就都写）
FROM 表1 别名
[INNER|LEFT|RIGHT] JOIN 表2 别名 
ON 连接条件
WHERE 筛选条件
LIMIT 条目数；
```

##### 3.1.2 全表删除

语法：

```mysql
DELETE FROM students;
# DML操作，逻辑性删除，逐行删除，速度慢
```

#### 3.2 `TRUNCATE`

语法：

```mysql
TRUNCATE TABLE students;
# DDL操作，表段保留，数据页被清空，速度快
```

`DELETE`和`TRUNCATE`的区别：

1. delete可以加where条件，truncate不可以
2. truncate删除效率高一些
3. 假如要删除的表中有自增长列，如果用delete删除后，再插入数据，自增长列的值从断点开始，而truncate删除后，再插入数据，自增长列的值从1开始。
4. truncate删除没有返回值，delete删除有返回值
5. truncate删除不能回滚，delete删除可以回滚

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
SELECT子句 分组函数，列（要求出现在group by的后面）
FROM 表
[WHERE 筛选条件]
GROUP BY 分组列表
[HAVING 分组后的筛选]
[ORDER BY 排序列表]
# 执行顺序：FROM->WHERE->GROUP BY子句->HAVING子句->SELECT子句->ORDER BY子句
```

 注意：查询列表比较特殊，要求是分组函数和group by后出现的字段 

特点：

1. 分组查询中的筛选条件分为两类：

	- 分组前筛选 基于原始表筛选，在`group by`子句的前面，使用关键词`where`

	- 分组后筛选 基于分组后的结果集筛选，在`group by`子句的后面 使用关键词`having`

2. 分组函数做条件肯定是放在having子句中

3. 能用分组前筛选的，就优先考虑使用分组前筛选

4. group by子句支持单个字段分组，多个字段分组（多个字段之间用逗号隔开没有顺序要求），表达式或函数（用得较少）

5. 也可以添加排序（排序放在整个分组查询最后位置）

#### 4.1 简单分组

例  查询每个工种的最高工资

```mysql
SELECT 
  MAX(salary),
  job_id 
FROM
  employees 
GROUP BY job_id ;
```

#### 4.2 分组前筛选

例 查询每个领导手下有奖金的员工的平均工资

```mysql
SELECT AVG(salary) 平均工资,manager_id
FROM employees
WHERE commission_pct IS NOT NULL
GROUP BY manager_id;
```

查询结果

```mysql
+--------------+------------+
| 平均工资     | manager_id |
+--------------+------------+
| 12200.000000 |        100 |
|  8500.000000 |        145 |
|  8500.000000 |        146 |
|  7766.666667 |        147 |
|  8650.000000 |        148 |
|  8333.333333 |        149 |
+--------------+------------+
```

#### 4.3 分组后筛选

后过滤，用在GROUP BY之后，HAVING条件是不走索引的，一般可以用临时表解决。

例1 查询哪个部门的员工个数>5

```mysql
SELECT COUNT(*) 员工个数,department_id
FROM employees
GROUP BY department_id
HAVING  COUNT(*)>5;
```

查询结果

```mysql
+--------------+---------------+
| 员工个数     | department_id |
+--------------+---------------+
|            6 |            30 |
|           45 |            50 |
|           34 |            80 |
|            6 |           100 |
+--------------+---------------+
```

例2 每个工种有奖金的员工的最高工资>12000的工种编号和最高工资

```mysql
SELECT job_id,MAX(salary)
FROM employees
WHERE commission_pct  IS NOT NULL
GROUP BY job_id
HAVING MAX(salary)>12000;
```

查询结果

```mysql
+--------+-------------+
| job_id | MAX(salary) |
+--------+-------------+
| SA_MAN |    14000.00 |
+--------+-------------+
```

#### 4.4  分组后排序

例 查询没有奖金的员工的最高工资>6000的工种编号和最高工资,按最高工资升序

```mysql
# 第一步：按工种分组，查询每个工种有奖金的员工的最高工资
SELECT MAX(salary) 最高工资,job_id
FROM employees
WHERE commission_pct IS  NULL
GROUP BY job_id
HAVING MAX(salary)>6000   # 第二步：筛选刚才的结果，看哪个最高工资>6000
ORDER BY MAX(salary) ASC; # 第三步：按最高工资升序
```

查询结果

```mysql
+--------------+------------+
| 最高工资     | job_id     |
+--------------+------------+
|      6500.00 | HR_REP     |
|      8200.00 | ST_MAN     |
|      8300.00 | AC_ACCOUNT |
|      9000.00 | FI_ACCOUNT |
|      9000.00 | IT_PROG    |
|     10000.00 | PR_REP     |
|     11000.00 | PU_MAN     |
|     12000.00 | FI_MGR     |
|     12000.00 | AC_MGR     |
|     13000.00 | MK_MAN     |
|     17000.00 | AD_VP      |
|     24000.00 | AD_PRES    |
+--------------+------------+
```

#### 4.5 按多个字段分组

例  查询每个部门每个工种的员工的平均工资 

```mysql
SELECT 
  AVG(salary),
  department_id,
  job_id 
FROM
  employees 
GROUP BY department_id, job_id ;
```

#### 4.6  按表达式或函数分组 

例  按员工姓名的长度分组，查询每一组的员工个数，筛选员工个数>5的有哪些

```mysql
SELECT 
  COUNT(*) 员工个数,
  LENGTH(last_name) 姓名长度 
FROM
  employees 
GROUP BY 姓名长度     # 查询每个长度的员工个数 
HAVING 员工个数 > 5 ; # 添加筛选条件
```

查询结果

```mysql
+--------------+--------------+
| 员工个数     | 姓名长度     |
+--------------+--------------+
|           11 |            4 |
|           29 |            5 |
|           28 |            6 |
|           15 |            7 |
|            7 |            8 |
|            8 |            9 |
+--------------+--------------+
```

### 3. 连接查询

又称多表查询，当查询的字段来自于多个表时，就会用到连接查询。

**笛卡尔积现象**：当两张表进行连接查询的时候，没有任何条件进行限制，最终的查询结果条数是两张表记录条数的乘积。

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

###### 1.7 三表连接

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
SELECT e.employee_id,e.last_name,m.employee_id,m.last_name
FROM employees e,employees m
WHERE e.`manager_id`=m.`employee_id`;
```



#### 3.3 SQL99语法

SQL92和SQL99的区别：

​        SQL99，使用JOIN关键字代替了之前的逗号，并且将连接条件和筛选条件进行了分离，提高阅读性

语法：

```mysql
SELECT  查询列表
FROM  表1 别名 [连接类型]
JOIN 表2 别名
ON   连接条件
[WHERE  筛选条件]
[GROUP BY 分组]
[HAVING  筛选条件]
[ORDER BY 排序列表]
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

当一个查询语句中又嵌套了另一个完整的select语句，则被嵌套的select语句称为子查询或内查询，外面的select语句称为主查询或外查询。

分类：

1. 按子查询出现的位置：

    - select后面：要求子查询的结果为单行单列（称为标量子查询）
    - from后面：要求子查询的结果可以为多行多列
    - where或having后面：要求子查询的结果必须为单列（单列又分为单行子查询和多行子查询）
    - exists后面（相关子查询）：要求子查询结果必须为单列（相关子查询）

2. 按功能、结果集的行列数不同：

    - 标量子查询（结果集只有一行一列）
    - 列子查询（结果集只有一列多行）
    - 行子查询（结果集有一行多列）
    - 表子查询（结果集一般为多行多列）

特点：

1. 子查询放在条件中，要求必须放在条件的右侧
2. 子查询一般放在小括号中
3. 子查询的执行优先于主查询
4. 单行子查询搭配单行操作符：`> < >= <= = <>`
5. 多行子查询搭配多行操作符：`any/some  all in   `

#### 4.1 where或HAVING后面

##### 4.1.1 标量子查询（单行子查询）

例1：谁的工资比 Abel 高

```mysql
SELECT last_name,salary
FROM employees
WHERE salary>(
	SELECT salary
	FROM employees
	WHERE last_name  = 'Abel'

);
```

例2：返回job_id与141号员工相同，salary比143员工多的员工，姓名，job_id，工资 

①查询141号员工的job_id

```mysql
SELECT job_id
FROM employees
WHERE employee_id = 141;
```

查询结果

```mysql
+----------+
| job_id   |
+----------+
| ST_CLERK |
+----------+
```

②查询143号员工的salary

```mysql
SELECT salary
FROM employees
WHERE employee_id = 143;
```

查询结果

```mysql
+---------+
| salary  |
+---------+
| 2600.00 |
+---------+
```

③查询job_id=① and salary>②的信息

```mysql
SELECT last_name,job_id,salary
FROM employees
WHERE job_id = (
	SELECT job_id
	FROM employees
	WHERE employee_id = 141
) AND salary>(

	SELECT salary
	FROM employees
	WHERE employee_id = 143
);
```

查询结果

```mysql
+-------------+----------+---------+
| last_name   | job_id   | salary  |
+-------------+----------+---------+
| Nayer       | ST_CLERK | 3200.00 |
| Mikkilineni | ST_CLERK | 2700.00 |
| Bissot      | ST_CLERK | 3300.00 |
| Atkinson    | ST_CLERK | 2800.00 |
| Mallin      | ST_CLERK | 3300.00 |
| Rogers      | ST_CLERK | 2900.00 |
| Ladwig      | ST_CLERK | 3600.00 |
| Stiles      | ST_CLERK | 3200.00 |
| Seo         | ST_CLERK | 2700.00 |
| Rajs        | ST_CLERK | 3500.00 |
| Davies      | ST_CLERK | 3100.00 |
+-------------+----------+---------+
```

例3：返回公司工资最少的员工的last_name,job_id和salary

```mysql
SELECT last_name,job_id,salary
FROM employees
WHERE salary=(
	SELECT MIN(salary)
	FROM employees
);
```

例4：查询最低工资大于50号部门最低工资的部门id和其最低工资

```mysql
SELECT MIN(salary),department_id
FROM employees
GROUP BY department_id
HAVING MIN(salary)>(

	SELECT MIN(salary)
	FROM employees
	WHERE department_id = 50
);
```

##### 4.1.2 列子查询（多行子查询）

 多行比较操作符： 

1. `IN`/`NOT IN`：等于列表中的任意一个

2. `ANY`|`SOME`：和子查询返回的某一个值比较，用的较少

3. `ALL`：和子查询返回的所有值比较

其中IN和NOT IN用的比较多，其他两个用的比较少，因为其可读性较差，可以用其他方式来替代。比如以下：

```mysql
# 1. any/some:判断某字段的值是否满足其中任意一个
x>any(10,30,50) 可以用 x>min(10,30,50) 替代
x=any(10,30,50) 可以用 x in(10,30,50) 替代

# 2. all:判断某字段的值是否满足里面所有的
x >all(10,30,50) 可以用 x >max(10,30,50) 替代
```

例1：返回location_id是1400或1700的部门中的所有员工姓名

```mysql
SELECT last_name
FROM employees
WHERE department_id IN(
	SELECT DISTINCT department_id
	FROM departments
	WHERE location_id IN(1400,1700)
);
```

 例2：返回其他工种中比job_id为‘IT_PROG’工种任一工资低的员工的员工号、姓名、job_id以及salary 

```mysql
SELECT employee_id,last_name,job_id,salary
FROM employees
WHERE salary<ANY(
	SELECT DISTINCT salary
	FROM employees
	WHERE job_id = 'IT_PROG'
);
# 用max代替any
SELECT employee_id,last_name,job_id,salary
FROM employees
WHERE salary<(
	SELECT MAX(salary)
	FROM employees
	WHERE job_id = 'IT_PROG'
);
```

 例3：返回其他工种中比job_id为‘IT_PROG’工种所有工资都低的员工的员工号、姓名、job_id以及salary 

```mysql
SELECT employee_id,last_name,job_id,salary
FROM employees
WHERE salary<ALL(
	SELECT DISTINCT salary
	FROM employees
	WHERE job_id = 'IT_PROG'
);
# 用min代替all
SELECT employee_id,last_name,job_id,salary
FROM employees
WHERE salary<(
	SELECT MIN(salary)
	FROM employees
	WHERE job_id = 'IT_PROG'
);
```

##### 4.1.3 行子查询（一行多累或多行多列）

 例1：查询员工编号最小并且工资最高的员工信息 

```mysql
SELECT 
  * 
FROM
  employees 
WHERE (employee_id, salary) = (
    SELECT MIN(employee_id),MAX(salary) 
    FROM employees
) ;
```

用的情况较少

#### 4.2 select后面

 例1：查询每个部门的员工个数 

```mysql
SELECT d.*,
  (SELECT COUNT(*) 
  FROM  employees e 
  WHERE e.department_id = d.department_Id) 个数 
FROM
  departments d ;
```

#### 4.3 from后面

例：查询每个部门的平均工资的工资级别

```mysql
SELECT 
  ag_dep.*,
  g.`grade_level` 
FROM
  (SELECT 
    AVG(salary) ag,
    department_id 
  FROM
    employees 
  GROUP BY department_id) ag_dep 
  INNER JOIN job_grades g 
    ON ag_dep.ag BETWEEN g.`lowest_sal` 
    AND g.`highest_sal` ;
```

 将子查询结果充当一张表，要求必须起别名 

#### 4.4 exists后面

语法：` exists（完整的查询语句） `，查询有结果返回1，否则返回0

 例1：查询有员工的部门名 

```mysql
SELECT 
  department_name 
FROM
  departments d 
WHERE EXISTS 
  (SELECT 
    * 
  FROM
    employees e 
  WHERE d.`department_id` = e.`department_id`) ;
# 用in更简单
SELECT 
  department_name 
FROM
  departments d 
WHERE d.`department_id` IN 
  (SELECT 
    department_id 
  FROM
    employees e) ;
```

> 可以用其他方式代替，用的较少

### 5. 分页查询

应用场景：当要显示的数据，一页显示不全，需要分页提交sql请求 

语法：

```mysql
select 查询列表
from 表
[join type] join 表2
on 连接条件
where 筛选条件
group by 分组字段
having 分组后的筛选
order by 排序的字段】
limit [offset，] size；
# offset：要显示条目的起始索引（不写从0开始）
# size：要显示的条目个数
```

公式：

```mysql
select 查询列表
from 表
limit (page - 1)* size， size；
# 要显示的页数page，每页的条目数size
```

 例1：查询前5条员工信息 

```mysql
SELECT * FROM employees LIMIT 0, 5;
或者
SELECT * FROM employees LIMIT 5;
```

例2：查询第11条-第25条

```mysql
SELECT * FROM employees LIMIT 10, 15;
```

### 6. 联合查询

`union`：将多条查询语句的结果合并成一个结果 

语法：

```mysql
查询语句1
union [ALL]
查询语句2
```

 应用场景：要查询的结果来自于多个表，且多个表没有直接的连接关系，但查询的信息一致 。

特点：

1. 要求多条查询语句的查询列数是一致的
2. 要求多条查询语句的查询的每一列的类型和顺序最好是一致的
3. union关键字默认去重，如果使用union all可以包含重复项

 例：查询部门编号>90或邮箱包含a的员工信息 

```mysql
SELECT 
  * 
FROM
  employees 
WHERE email LIKE "%a%" 
UNION
SELECT 
  * 
FROM
  employees 
WHERE department_id > 90;
```

### 7. 别名

作用：

1.  提高语句的简洁度 
2.  区分多个重名的字段 
3.  如果为表起了别名，则查询 的字段就不能使用原始的表明去限定 

#### 7.1 字段别名

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

#### 7.2 表别名

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

## 四、TCL

### 1. 事务

#### 1.1 事务的含义

 一个或一组sql语句组成一个执行单元，这个执行单元要么全部执行，要么全部不执行。

#### 1.2  事务的ACID属性 

1. 原子性（Atomicity）：原子性是指事务是一个不可分割的工作单位，事务中的操作要么都发生，要么都不发生。
2. 一致性（Consistency）：事务必须使数据库从一个一致性状态变换到另外一个一致性状态。
3. 隔离性（Isolation）：事务的隔离性是指一个事务的执行不能被其他事务干扰，即一个事务内部的操作及使用的数据对并发的其他事务是隔离的，并发执行的各个事务之间不能互相干扰。
4. 持久性（Durability）：持久性是指一个事务一旦被提交，它对数据库中数据的改变就是永久性的，接下来的其他操作和数据库故障不应该对其有任何影响。

### 1.2 事务的分类

1. 隐式事务：事务没有明显的开启和结束的标记。比如insert、update、delete语句
2. 显式事务：事务具有明显的开启和结束的标记

### 1.3 事务的创建

##### 1.3.1  开启事务

```mysql
SET autocommit=0; # 先设置自动提交功能为禁用 
START TRANSACTION;（可选）
```

##### 1.3.2  编写事务中的sql语句

包括`select`，`insert`，`update`，`delete`（只有增删改查，不包括DDL语言）

##### 1.3.3 结束事务

有两种结束事务的方式

1. `commit`；提交事务
2. `rollback`；回滚事务

#### 1.4  设置保存点

`savepoint 结点名`

```mysql

```



### 2. 数据库的隔离级别

#### 2.1 没有隔离带来的问题

对于同时运行的多个事务，当这些事务访问数据库中相同的数据时，如果没有采取必要的隔离机制，就会导致各种并发问题： 

1. **脏读**：对于两个事务T1，T2。T1读取了已经被T2更新但还没有被提交的字段之后，若T2回滚，T1读取的内容就是临时且无效的。主要是其他事务**更新**的数据
2. **不可重复读**：对于两个事务T1，T2。T1读取了一个字段，然后T2更新了该字段之后，T1再次读取同一个字段，值就不同了。
3. **幻读**：对于两个事务T1，T2。T1从一个表中读取了一个字段，然后T2在该表中插入了一些新的行之后，如果T1再次读取同一个表，就会多出几行。主要是其他事务**插入**的数据

**数据库事务的隔离性**：数据库系统必须具有隔离并发运行各个事务的能力，使他们不会相互影响，避免各种并发问题。

#### 2.2 隔离级别

**一个事务与其他事务隔离的程度称为隔离级别。**数据库规定了多种事务隔离级别，不同隔离级别对应不同的干扰程度，隔离级别越高，数据一致性就越好，但并发性弱。

 **数据库提供的4种事务隔离级别：**

| 隔离级别                       | 描述                                                         |
| ------------------------------ | ------------------------------------------------------------ |
| READ UNCOMMITTED(读未提交数据) | 允许事务读取未被其他事务提交的变更。脏读，不可重复读和幻读的问题都会出现。 |
| READ COMMITED(读已提交数据)    | 只允许事务读取已经被其他事务提交的变更。可以避免脏读，但不可重复读和幻读问题仍然可能出现。 |
| REPEATABLE READ(可重复读)      | 确保事务可以多次从一个字段中读取相同的值。在这个事务持续期间，禁止其他事务对这个字段进行更新。可以避免脏读和不可重复读，但幻读的问题仍然存在。 |
| SERIALLIZABLE(串行化)          | 确保事务可以从一个表中读取相同的行，在这个事务持续期间，禁止其他事务对该表执行插入，更新和删除操作。所有并发问题都可以避免，但性能十分低下。 |

Oracle支持2种事务隔离级别：READ COMMITED，SERIALIZABLE。Oracle默认的事务隔离级别是：READ COMMITED。

Mysql支持4种事务隔离级别。Mysql默认的事务隔离级别为：REPEATABLE READ。

每启动一个mysql程序，就会获得一个单独的数据库连接，每个数据库连接都有一个全局变量`@@tx_isolation`，表示当前事务隔离级别。

查看当前的隔离级别：`select @@tx_isolation;`

设置当前mysql连接的隔离级别：`set transaction isolation level read committed;`

设置数据库系统的全局的隔离级别：`set global transaction isolation level read committed;`

## 五、常见约束

含义：一种限制，用于限制表中的数据，为了保证表中的数据的准确和可靠性

#### 1. 分类

##### 1.1  按作用分类

1. not null：非空，用于保证该字段的值不能为空。比如姓名、学号等。
2. default：默认，用于保证该字段有默认值。比如性别。
3. primary key：主键，用于保证该字段的值具有唯一性，并且非空。比如学号、员工编号等。
4. unique：唯一，用于保证该字段的值具有唯一性，可以为空。比如座位号。
5. check：检查约束（**mysql中不支持**）。比如年龄、性别。
6. foreign key：外键，用于限制两个表的关系，用于保证该字段的值必须来自于主表的关联列的值。在从表添加外键约束，用于应用主表中某列的值。比如学生表的专业编号，员工表的部门编号，员工表的工种编号。

##### 1.2 按位置分类

1.  列级约束：六大约束语法上都支持，但外键约束没有效果 
2.  表级约束：除了非空、默认，其他的都支持 

| 约束类型 | 位置         | 支持的约束类型               | 是否可以起约束名                        |
| -------- | ------------ | ---------------------------- | --------------------------------------- |
| 列级约束 | 列的后面     | 语法都支持，但外键没有效果   | 不可以                                  |
| 表级约束 | 所有列的下面 | 默认和非空不支持，其他都支持 | 可以（主键没有效果，默认名字是PRIMARY） |

##### 主键和唯一的区别

| 约束 | 保证唯一性 | 是否允许为空 | 一个表中可以有多少个 | 是否允许组合（多个列组合成一个主键/唯一） |
| ---- | ---------- | ------------ | -------------------- | ----------------------------------------- |
| 主键 | 是         | 否           | 至多一个             | 可以，但不推荐                            |
| 唯一 | 是         | 是           | 可以有多个           | 可以，但不推荐                            |

##### 外键特点

1. 要求在从表设置外键关系

2. 从表的外键列的类型和主表的关联列的类型要求一致或兼容，名称无要求

3. 主表的关联列必须是一个key（一般是主键或唯一）

4. 插入数据时，先插入主表，再插入从表

5. 删除数据时，先删除从表，再删除主表

方式一：级联删除

```mysql
ALTER TABLE stuinfo ADD CONSTRAINT fk_stu_major FOREIGN KEY(majorid) REFERENCES major(id) ON DELETE CASCADE;
```

方式二：级联置空

```mysql
ALTER TABLE stuinfo ADD CONSTRAINT fk_stu_major FOREIGN KEY(majorid) REFERENCES major(id) ON DELETE SET NULL;
# 删除的时候，主表对应的行被删除了，从表引入的地方变为空值null。
```

#### 2. 添加约束

##### 2.1 创建表时添加约束

###### 2.1.1 添加列级约束

语法：

```mysql
直接在字段名和类型后面追加约束类型即可。
只支持：默认、非空、主键、唯一（除了外键都支持）
```

```mysql
CREATE DATABASE students;
USE students;

CREATE TABLE stuinfo (
  id INT PRIMARY KEY,
  stuname VARCHAR (20) NOT NULL,	# 非空
  gender CHAR(1) CHECK (gender = '男' 
    OR gender = '女'),  # CHECK在mysql中不生效
  seat INT UNIQUE,	# 唯一
  age INT DEFAULT 18,	# 默认
  majorID INT REFERENCES major (id) # 语法不报错，但是没有效果
) ;

CREATE TABLE major (
  id INT PRIMARY KEY,
  majorName VARCHAR (20)
) ;

DESC stuinfo; # 查看表结构
SHOW INDEX FROM stuinfo;
```

###### 2.1.2 添加表级约束

语法：

```mysql
# 在各个字段的最下面
[ CONSTRAINT  约束名] 约束类型 (字段名)
# 除了非空、默认，其他的都支持
```

```mysql
CREATE TABLE stuinfo(
id INT,
stuname VARCHAR(20),
gender CHAR(1),
seat INT,
age INT,
majorid INT,

CONSTRAINT pk PRIMARY KEY(id), # 主键的名字是PRIMARY，起别名没效果
CONSTRAINT uq UNIQUE(seat),
CONSTRAINT ck CHECK(gender='男' OR gender='女'),
CONSTRAINT fk_stuinfo_major FOREIGN KEY(majorid) REFERENCES major(id)
);

SHOW INDEX FROM stuinfo;
```

查询结果

```mysql
+---------+------------+------------------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+---------------+
| Table   | Non_unique | Key_name         | Seq_in_index | Column_name | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment |
+---------+------------+------------------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+---------------+
| stuinfo |          0 | PRIMARY          |            1 | id          | A         |           0 |     NULL | NULL   |      | BTREE      |         |               |
| stuinfo |          0 | uq               |            1 | seat        | A         |           0 |     NULL | NULL   | YES  | BTREE      |         |               |
| stuinfo |          1 | fk_stuinfo_major |            1 | majorid     | A         |           0 |     NULL | NULL   | YES  | BTREE      |         |               |
+---------+------------+------------------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+---------------+

```

###### 2.1.3 通用写法

```mysql
CREATE TABLE IF NOT EXISTS stuinfo (
  id INT PRIMARY KEY,
  stuname VARCHAR (20) NOT NULL,
  gender CHAR(1),
  seat INT UNIQUE,
  age INT DEFAULT 18,
  majorID INT,
  CONSTRAINT fk_stuinfo_major FOREIGN KEY (majorid) REFERENCES major (id)
) ;
```

##### 2.2 修改表时添加约束

###### 2.2.1  添加非空约束 

```mysql
ALTER TABLE stuinfo MODIFY COLUMN stuname VARCHAR(20) NOT NULL;
```

###### 2.2.2 添加默认约束

```mysql
ALTER TABLE stuinfo MODIFY COLUMN age INT DEFAULT 18;
```

###### 2.2.3 添加主键约束

```mysql
# 列级约束的写法
ALTER TABLE stuinfo MODIFY COLUMN id INT PRIMARY KEY;
# 表级约束的写法
ALTER TABLE stuinfo ADD PRIMARY KEY(id);
```

2.2.4 添加唯一约束

```mysql
# 列级约束的写法
ALTER TABLE stuinfo MODIFY COLUMN seat INT UNIQUE;
# 表级约束的写法
ALTER TABLE stuinfo ADD UNIQUE(seat);
```

###### 2.2.5 添加外键约束

```mysql
ALTER TABLE (CONSTRAINT fk_stuinfo_major) stuinfo ADD FOREIGN KEY(majorid) REFERENCES major(id);
```

#### 3. 删除约束

##### 3.1 修改表时删除约束

###### 3.1.1 删除非空约束

```mysql
ALTER TABLE stuinfo MODIFY COLUMN stuname VARCHAR(20) NULL;
```

###### 3.1.2 删除默认约束

```mysql
ALTER TABLE stuinfo MODIFY COLUMN age INT;
```

###### 3.1.3 删除主键

```mysql
ALTER TABLE stuinfo DROP PRIMARY KEY;
```

###### 3.1.4 删除唯一

```mysql
ALTER TABLE stuinfo DROP INDEX seat;
```

###### 3.1.5 删除外键

```mysql
ALTER TABLE stuinfo DROP FOREIGN KEY fk_stuinfo_major;
```

#### 4. 标识列

##### 4.1 含义

又称为自增长列,可以不用手动的插入值，系统提供默认的序列值

##### 4.2 特点

1. 标识列必须和主键搭配吗？不一定，但要求是一个key。
2. 一个表可以有几个标识列？至多一个。
3. 标识列的类型？只能是数值型（int（一般是int），float，double）
4. 标识列可以通过`SET auto_increment_increment = 1;`设置步长；可以通过手动插入值设置起始值。

##### 4.3  创建表时设置标识列

语法：

```mysql
CREATE TABLE 表(
  字段名 字段类型 约束 AUTO_INCREMENT
);
```

例：

```mysql
CREATE TABLE tab_identity (
  id INT PRIMARY KEY AUTO_INCREMENT,
  NAME VARCHAR(20)
) ;
```

##### 4.4  创建表时设置标识列

```mysql
ALTER TABLE tab_identity MODIFY COLUMN id INT PRIMARY KEY AUTO_INCREMENT;
```

##### 4.5  修改表时删除标识列 

```mysql
ALTER TABLE tab_identity MODIFY COLUMN id INT;
```

##### 4.6 设置标识列的步长

```mysql
SHOW VARIABLES LIKE '%auto_increment%';
SET auto_increment_increment = 3;
```

## 

用到的数据库：

[myemployees](./example/myemployees.sql)数据库

