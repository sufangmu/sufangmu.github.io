## 一、SQL执行统计信息

MySQL 客户端连接成功后，通过`show [session|global] status`命令可以提供服务器状态信息。

session：当前连接的统计计结果。默认为该参数

global：自数据库上次启动至今的统计结果。

下面的命令显示了当前 session 中所有统计参数的值：

```mysql
mysql [(none)]>show status like 'Com_______';
+---------------+-------+
| Variable_name | Value |
+---------------+-------+
| Com_binlog    | 0     |
| Com_commit    | 0     |
| Com_delete    | 0     |
| Com_insert    | 0     |
| Com_repair    | 0     |
| Com_revoke    | 0     |
| Com_select    | 1     |
| Com_signal    | 0     |
| Com_update    | 0     |
| Com_xa_end    | 0     |
+---------------+-------+
10 rows in set (0.01 sec)
```

Com_xxx 表示每个 xxx 语句执行的次数，我们通常比较关心的是以下几个统计参数。

| 参数       | 含义                                                         |
| :--------- | ------------------------------------------------------------ |
| Com_select | 执行 select 操作的次数，一次查询只累加 1。                   |
| Com_insert | 执行 INSERT 操作的次数，对于批量插入的 INSERT 操作，只累加一次。 |
| Com_update | 执行 UPDATE 操作的次数。                                     |
| Com_delete | 执行 DELETE 操作的次数。                                     |

```mysql
mysql [(none)]>show status like 'Innodb_rows_%';
+----------------------+-------+
| Variable_name        | Value |
+----------------------+-------+
| Innodb_rows_deleted  | 0     |
| Innodb_rows_inserted | 0     |
| Innodb_rows_read     | 8     |
| Innodb_rows_updated  | 0     |
+----------------------+-------+
4 rows in set (0.00 sec)
```

| 参数                 | 含义                                                         |
| :------------------- | ------------------------------------------------------------ |
| Innodb_rows_read     | select 查询返回的行数。                                      |
| Innodb_rows_inserted | 执行 INSERT 操作插入的行数。                                 |
| Innodb_rows_updated  | 执行 UPDATE 操作更新的行数。                                 |
| Innodb_rows_deleted  | 执行 DELETE 操作删除的行数。                                 |

## 二、低效率执行SQL定位

可以通过以下两种方式定位执行效率较低的 SQL 语句。

- 慢查询日志 : 通过慢查询日志定位那些执行效率较低的SQL语句，用`--log-slow-queries[=ile_name]`选项启动时，mysqld 写一个包含所有执行时间超过`long_query_time`秒的 SQL 语句的日志文件。
- `show processlist` : 慢查询日志在查询结束以后才纪录，所以在应用反映执行效率出现问题的时候查询慢查询日志并不能定位问题，可以使用`show processlist`命令查看当前MySQL在进行的线程，包括线程的状态、是否锁表等，可以实时地查看 SQL 的执行情况，同时对一些锁表操作进行优化。

```mysql
mysql [(none)]>SHOW PROCESSLIST;
+----+------+-----------+------+---------+------+----------+------------------+
| Id | User | Host      | db   | Command | Time | State    | Info             |
+----+------+-----------+------+---------+------+----------+------------------+
|  2 | root | localhost | NULL | Query   |    0 | starting | show processlist |
+----+------+-----------+------+---------+------+----------+------------------+
1 row in set (0.00 sec)

```

| 列名      | 含义                                                         |
| --------- | ------------------------------------------------------------ |
| `Id`      | 用户登录mysql时，系统分配的·connection_id·，可以使用函数`SELECT connection_id();`查看 |
| `User`    | 显示当前用户。如果不是root，这个命令就只显示用户权限范围的sql语句 |
| `Host`    | 显示这个语句是从哪个ip的哪个端口上发的，可以用来跟踪出现问题语句的用户 |
| `db`      | 显示这个进程目前连接的是哪个数据库                           |
| `Command` | 显示当前连接的执行的命令，一般取值为休眠（sleep），查询（query），连接（connect）等 |
| `Time`    | 显示这个状态持续的时间，单位是秒                             |
| `State`   | `显示使用当前连接的sql语句的状态，很重要的列。state描述的是语句执行中的某一个状态。一个sql语句，以查询为例，可能需要经过`copying to tmp table`、`sorting result`、sending data`等状态才可以完成 |
| `Info`    | 显示这个sql语句，是判断问题语句的一个重要依据                |

## 三、`show profile`分析SQL

`show profiles` 能够在做SQL优化时帮助我们了解时间都耗费到哪里去了。

判断当前MySQL是否支持`profile`

```mysql
mysql [(none)]>select @@profiling;
+-------------+
| @@profiling |
+-------------+
|           0 |
+-------------+
1 row in set, 1 warning (0.00 sec)
```

默认`profiling`是关闭的，可以通过set语句在Session级别开启`profiling`

```mysql
set profiling=1;
```

通过`profile`，我们能够更清楚地了解SQL执行的过程。

首先，我们可以执行一系列的操作命令之后，再执行`show profiles`指令， 来查看SQL语句执行的耗时：

```mysql
mysql [employees]>show profiles;
+----------+------------+--------------------------------------------+
| Query_ID | Duration   | Query                                      |
+----------+------------+--------------------------------------------+
|        1 | 0.00937200 | show databases                             |
|        2 | 0.00908050 | SELECT DATABASE()                          |
|        3 | 0.00044250 | show databases                             |
|        4 | 0.00033250 | show tables                                |
|        5 | 0.00035800 | show tables                                |
|        6 | 0.00056600 | select * from employees where emp_no=10001 |
|        7 | 0.19425375 | select count(*) from employees             |
+----------+------------+--------------------------------------------+
```

通过`show  profile for  query <query_id>`语句可以查看到该SQL执行过程中每个线程的状态和消耗的时间

```mysql
mysql [employees]>show  profile for  query 7;
+----------------------+----------+
| Status               | Duration |
+----------------------+----------+
| starting             | 0.000057 |
| checking permissions | 0.000008 |
| Opening tables       | 0.000017 |
| init                 | 0.000015 |
| System lock          | 0.000009 |
| optimizing           | 0.000012 |
| statistics           | 0.000014 |
| preparing            | 0.000011 |
| executing            | 0.000004 |
| Sending data         | 0.194021 |
| end                  | 0.000017 |
| query end            | 0.000009 |
| closing tables       | 0.000008 |
| freeing items        | 0.000036 |
| cleaning up          | 0.000019 |
+----------------------+----------+
15 rows in set, 1 warning (0.00 sec)
```

> Sending data 表示MySQL线程开始访问数据行并把结果返回给客户端，而不仅仅是返回个客户端。由于在Sending data状态下，MySQL线程往往需要做大量的磁盘读取操作，所以经常是整各查询中耗时最长的状态。

如果想查看更完整的信息可以使用`show  profile all for  query 7;`

## 四、`trace`分析优化器执行计划

MySQL5.6提供了对SQL的跟踪trace, 通过trace文件能够进一步了解为什么优化器选择A计划, 而不是选择B计划。

### 1. 开启`trace `

打开trace，设置格式为 JSON，

```mysql
SET optimizer_trace="enabled=on",end_markers_in_json=on;
```

设置trace最大能够使用的内存大小，避免解析过程中因为默认内存过小而不能够完整展示。

```mysql
SET optimizer_trace_max_mem_size=1000000;
```

### 2. 执行SQL语句 

```mysql
select * from employees where emp_no=10001
```

### 3. 检查`information_schema.optimizer_trace`

检查`information_schema.optimizer_trace`就可以知道MySQL是如何执行SQL的 

```mysql
mysql [employees]>select * from information_schema.optimizer_trace\G;
*************************** 1. row ***************************
                            QUERY: select * from employees where emp_no=10001
                            TRACE: {
  "steps": [
    {
      "join_preparation": {
        "select#": 1,
        "steps": [
          {
            "expanded_query": "/* select#1 */ select `employees`.`emp_no` AS `emp_no`,`employees`.`birth_date` AS `birth_date`,`employees`.`first_name` AS `first_name`,`employees`.`last_name` AS `last_name`,`employees`.`gender` AS `gender`,`employees`.`hire_date` AS `hire_date` from `employees` where (`employees`.`emp_no` = 10001)"
          }
        ] /* steps */
      } /* join_preparation */
    },
    {
      "join_optimization": {
        "select#": 1,
        "steps": [
          {
            "condition_processing": {
              "condition": "WHERE",
              "original_condition": "(`employees`.`emp_no` = 10001)",
              "steps": [
                {
                  "transformation": "equality_propagation",
                  "resulting_condition": "multiple equal(10001, `employees`.`emp_no`)"
                },
                {
                  "transformation": "constant_propagation",
                  "resulting_condition": "multiple equal(10001, `employees`.`emp_no`)"
                },
                {
                  "transformation": "trivial_condition_removal",
                  "resulting_condition": "multiple equal(10001, `employees`.`emp_no`)"
                }
              ] /* steps */
            } /* condition_processing */
          },
          {
            "substitute_generated_columns": {
            } /* substitute_generated_columns */
          },
          {
            "table_dependencies": [
              {
                "table": "`employees`",
                "row_may_be_null": false,
                "map_bit": 0,
                "depends_on_map_bits": [
                ] /* depends_on_map_bits */
              }
            ] /* table_dependencies */
          },
          {
            "ref_optimizer_key_uses": [
              {
                "table": "`employees`",
                "field": "emp_no",
                "equals": "10001",
                "null_rejecting": false
              }
            ] /* ref_optimizer_key_uses */
          },
          {
            "rows_estimation": [
              {
                "table": "`employees`",
                "rows": 1,
                "cost": 1,
                "table_type": "const",
                "empty": false
              }
            ] /* rows_estimation */
          },
          {
            "condition_on_constant_tables": "1",
            "condition_value": true
          },
          {
            "attaching_conditions_to_tables": {
              "original_condition": "1",
              "attached_conditions_computation": [
              ] /* attached_conditions_computation */,
              "attached_conditions_summary": [
              ] /* attached_conditions_summary */
            } /* attaching_conditions_to_tables */
          },
          {
            "refine_plan": [
            ] /* refine_plan */
          }
        ] /* steps */
      } /* join_optimization */
    },
    {
      "join_execution": {
        "select#": 1,
        "steps": [
        ] /* steps */
      } /* join_execution */
    }
  ] /* steps */
}
MISSING_BYTES_BEYOND_MAX_MEM_SIZE: 0
          INSUFFICIENT_PRIVILEGES: 0
1 row in set (0.00 sec)
```

## 五、SQL语句优化

### 1. 大批量导入数据

#### 1. 主键顺序插入

因为`InnoDB`类型的表是按照主键的顺序保存的，所以将导入的数据按照主键的顺序排列，可以有效的提高导入数据的效率。如果`InnoDB`表没有主键，那么系统会自动默认创建一个内部列作为主键，所以如果可以给表创建一个主键，将可以利用这点，来提高导入数据的效率。

#### 2. 关闭唯一性校验

在导入数据前执行`SET UNIQUE_CHECKS=0`，关闭唯一性校验，

在导入结束后执行`SET UNIQUE_CHECKS=1`，恢复唯一性校验，

可以提高导入的效率。

#### 3. 手动提交事务

如果应用使用自动提交的方式，建议在导入前执行`SET AUTOCOMMIT=0`，关闭自动提交；导入结束后再执行`SET AUTOCOMMIT=1`，打开自动提交，也可以提高导入的效率。

### 2. 优化`INSERT`

#### 1. 使用`INSERT`一次插入多个值

```mysql
INSERT INTO tb_test VALUES(1,'Tom'),(2,'Cat')，(3,'Jerry');
```

#### 2. 在事务中插入数据

```mysql
start transaction;
# 如果数据量比较大，可以分段提交
INSERT INTO tb_test VALUES(1,'Tom');
INSERT INTO tb_test VALUES(2,'Cat');
INSERT INTO tb_test VALUES(3,'Jerry');
commit;
```

#### 3. 数据有序插入

```mysql
INSERT INTO tb_test VALUES(1,'Tom');
INSERT INTO tb_test VALUES(2,'Cat');
INSERT INTO tb_test VALUES(3,'Jerry');
INSERT INTO tb_test VALUES(4,'Tim');
INSERT INTO tb_test VALUES(5,'Rose');
```

### 3. 优化`ORDER BY`

```mysql
CREATE TABLE `emp` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `age` int(3) NOT NULL,
  `salary` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4;

INSERT INTO `emp` (`id`, `name`, `age`, `salary`) VALUES('1','Tom','25','2300');
INSERT INTO `emp` (`id`, `name`, `age`, `salary`) VALUES('2','Jerry','30','3500');
INSERT INTO `emp` (`id`, `name`, `age`, `salary`) VALUES('3','Luci','25','2800');
INSERT INTO `emp` (`id`, `name`, `age`, `salary`) VALUES('4','Jay','36','3500');
INSERT INTO `emp` (`id`, `name`, `age`, `salary`) VALUES('5','Tom2','21','2200');
INSERT INTO `emp` (`id`, `name`, `age`, `salary`) VALUES('6','Jerry2','31','3300');
INSERT INTO `emp` (`id`, `name`, `age`, `salary`) VALUES('7','Luci2','26','2700');
INSERT INTO `emp` (`id`, `name`, `age`, `salary`) VALUES('8','Jay2','33','3500');
INSERT INTO `emp` (`id`, `name`, `age`, `salary`) VALUES('9','Tom3','23','2400');
INSERT INTO `emp` (`id`, `name`, `age`, `salary`) VALUES('10','Jerry3','32','3100');
INSERT INTO `emp` (`id`, `name`, `age`, `salary`) VALUES('11','Luci3','26','2900');
INSERT INTO `emp` (`id`, `name`, `age`, `salary`) VALUES('12','Jay3','37','4500');

create index idx_emp_age_salary on emp(age,salary);
```

#### 1. 排序方式

##### 1.1 `filesort`

所有不是通过索引直接返回排序结果的排序都叫`filesort`排序。

```mysql
mysql [test]>EXPLAIN SELECT * from emp ORDER BY age;
+----+-------------+-------+------------+------+---------------+------+---------+------+------+----------+----------------+
| id | select_type | table | partitions | type | possible_keys | key  | key_len | ref  | rows | filtered | Extra          |
+----+-------------+-------+------------+------+---------------+------+---------+------+------+----------+----------------+
|  1 | SIMPLE      | emp   | NULL       | ALL  | NULL          | NULL | NULL    | NULL |   12 |   100.00 | Using `filesort`|
+----+-------------+-------+------------+------+---------------+------+---------+------+------+----------+----------------+
1 row in set, 1 warning (0.00 sec)

mysql [test]>EXPLAIN SELECT * from emp ORDER BY age, salary;
+----+-------------+-------+------------+------+---------------+------+---------+------+------+----------+----------------+
| id | select_type | table | partitions | type | possible_keys | key  | key_len | ref  | rows | filtered | Extra          |
+----+-------------+-------+------------+------+---------------+------+---------+------+------+----------+----------------+
|  1 | SIMPLE      | emp   | NULL       | ALL  | NULL          | NULL | NULL    | NULL |   12 |   100.00 | Using `filesort`|
+----+-------------+-------+------------+------+---------------+------+---------+------+------+----------+----------------+
1 row in set, 1 warning (0.00 sec)
```

##### 1.2 `using index`

通过有序索引顺序扫描直接返回有序数据，这种情况即为 using index，不需要额外排序，操作效率高。

###### 1.2.1 单字段排序

```mysql
# 返回的字段是覆盖索引，
mysql [test]>EXPLAIN SELECT id from emp ORDER BY age;
+----+-------------+-------+------------+-------+---------------+--------------------+---------+------+------+----------+-------------+
| id | select_type | table | partitions | type  | possible_keys | key                | key_len | ref  | rows | filtered | Extra       |
+----+-------------+-------+------------+-------+---------------+--------------------+---------+------+------+----------+-------------+
|  1 | SIMPLE      | emp   | NULL       | index | NULL          | idx_emp_age_salary | 9       | NULL |   12 |   100.00 | Using index |
+----+-------------+-------+------------+-------+---------------+--------------------+---------+------+------+----------+-------------+
1 row in set, 1 warning (0.00 sec)
```

###### 1.2.2 多字段排序

```mysql
# 如果排序方式相同则使用using index
mysql [test]>EXPLAIN SELECT id, age, salary FROM emp ORDER BY age, salary;
+----+-------------+-------+------------+-------+---------------+--------------------+---------+------+------+----------+-------------+
| id | select_type | table | partitions | type  | possible_keys | key                | key_len | ref  | rows | filtered | Extra       |
+----+-------------+-------+------------+-------+---------------+--------------------+---------+------+------+----------+-------------+
|  1 | SIMPLE      | emp   | NULL       | index | NULL          | idx_emp_age_salary | 9       | NULL |   12 |   100.00 | Using index |
+----+-------------+-------+------------+-------+---------------+--------------------+---------+------+------+----------+-------------+
1 row in set, 1 warning (0.00 sec)

# 如果排序方式不同，则出现filesort
mysql [test]>EXPLAIN SELECT id, age, salary FROM emp ORDER BY age, salary desc;
+----+-------------+-------+------------+-------+---------------+--------------------+---------+------+------+----------+-----------------------------+
| id | select_type | table | partitions | type  | possible_keys | key                | key_len | ref  | rows | filtered | Extra                       |
+----+-------------+-------+------------+-------+---------------+--------------------+---------+------+------+----------+-----------------------------+
|  1 | SIMPLE      | emp   | NULL       | index | NULL          | idx_emp_age_salary | 9       | NULL |   12 |   100.00 | Using index; Using `filesort`|
+----+-------------+-------+------------+-------+---------------+--------------------+---------+------+------+----------+-----------------------------+
1 row in set, 1 warning (0.00 sec)

# 如果排序字段和索引字段不一致，则出现filesort
mysql [test]>EXPLAIN SELECT id, age, salary FROM emp ORDER BY salary, age;
+----+-------------+-------+------------+-------+---------------+--------------------+---------+------+------+----------+-----------------------------+
| id | select_type | table | partitions | type  | possible_keys | key                | key_len | ref  | rows | filtered | Extra                       |
+----+-------------+-------+------------+-------+---------------+--------------------+---------+------+------+----------+-----------------------------+
|  1 | SIMPLE      | emp   | NULL       | index | NULL          | idx_emp_age_salary | 9       | NULL |   12 |   100.00 | Using index; Using `filesort`|
+----+-------------+-------+------------+-------+---------------+--------------------+---------+------+------+----------+-----------------------------+
1 row in set, 1 warning (0.00 sec)
```

尽量减少额外的排序，通过索引直接返回有序数据。`WHERE`条件和`order by`使用相同的索引，并且`order by`的顺序和索引顺序相同， 并且`order  by`的字段都是升序，或者都是降序。否则肯定需要额外的操作，这样就会出现`filesort`。

#### 2. `filesort`优化

通过创建合适的索引，能够减少 `filesort`的出现，但是在某些情况下，条件限制不能让`filesort`消失，那就需要加快`filesort`的排序操作。对于`filesort`， MySQL 有两种排序算法：

1） 两次扫描算法 ：MySQL4.1 之前，使用该方式排序。首先根据条件取出排序字段和行指针信息，然后在排序区sort buffer中排序，如果sort buffer不够，则在临时表 temporary table 中存储排序结果。完成排序之后，再根据行指针回表读取记录，该操作可能会导致大量随机I/O操作。

2）一次扫描算法：一次性取出满足条件的所有字段，然后在排序区 sort  buffer 中排序后直接输出结果集。排序时内存开销较大，但是排序效率比两次扫描算法要高。

MySQL 通过比较系统变量`max_length_for_sort_data`的大小和Query语句取出的字段总大小， 来判定是否那种排序算法，如果`max_length_for_sort_data`更大，那么使用第二种优化之后的算法；否则使用第一种。

可以适当提高`sort_buffer_size `和`max_length_for_sort_data`系统变量，来增大排序区的大小，提高排序的效率。

### 4. 优化`GROUP BY`语句

由于`GROUP BY`实际上也同样会进行排序操作，而且与`ORDER BY`相比，`GROUP BY`主要只是多了排序之后的分组操作。当然，如果在分组的时候还使用了其他的一些聚合函数，那么还需要一些聚合函数的计算。所以，在`GROUP BY`的实现过程中，与`ORDER BY`一样也可以利用到索引。

如果查询包含 group by 但是用户想要避免排序结果的消耗， 则可以执行`order by null`禁止排序。如下 ：

```mysql
# 先删除存在的索引
mysql [test]>drop index idx_emp_age_salary on emp;
Query OK, 0 rows affected (0.03 sec)
Records: 0  Duplicates: 0  Warnings: 0
# extra中出现了Using filesort，说明group by底层进行了排序操作
mysql [test]>explain select age,count(*) from emp group by age;
+----+-------------+-------+------------+------+---------------+------+---------+------+------+----------+---------------------------------+
| id | select_type | table | partitions | type | possible_keys | key  | key_len | ref  | rows | filtered | Extra                           |
+----+-------------+-------+------------+------+---------------+------+---------+------+------+----------+---------------------------------+
|  1 | SIMPLE      | emp   | NULL       | ALL  | NULL          | NULL | NULL    | NULL |   12 |   100.00 | Using temporary; Using filesort |
+----+-------------+-------+------------+------+---------------+------+---------+------+------+----------+---------------------------------+
1 row in set, 1 warning (0.00 sec)
# 在SQL后面加order by null，Extra中Using filesort消失
mysql [test]>explain select age,count(*) from emp group by age order by null;
+----+-------------+-------+------------+------+---------------+------+---------+------+------+----------+-----------------+
| id | select_type | table | partitions | type | possible_keys | key  | key_len | ref  | rows | filtered | Extra           |
+----+-------------+-------+------------+------+---------------+------+---------+------+------+----------+-----------------+
|  1 | SIMPLE      | emp   | NULL       | ALL  | NULL          | NULL | NULL    | NULL |   12 |   100.00 | Using temporary |
+----+-------------+-------+------------+------+---------------+------+---------+------+------+----------+-----------------+
1 row in set, 1 warning (0.00 sec)
```

上述的SQL仍然使用了临时表，可以通过创建索引来优化。

```mysql
mysql [test]>create index idx_emp_age_salary on emp(age,salary);
Query OK, 0 rows affected (0.05 sec)
Records: 0  Duplicates: 0  Warnings: 0
mysql [test]>mysql [test]>explain select age,count(*) from emp group by age order by null;
+----+-------------+-------+------------+-------+--------------------+--------------------+---------+------+------+----------+-------------+
| id | select_type | table | partitions | type  | possible_keys      | key                | key_len | ref  | rows | filtered | Extra       |
+----+-------------+-------+------------+-------+--------------------+--------------------+---------+------+------+----------+-------------+
|  1 | SIMPLE      | emp   | NULL       | index | idx_emp_age_salary | idx_emp_age_salary | 9       | NULL |   12 |   100.00 | Using index |
+----+-------------+-------+------------+-------+--------------------+--------------------+---------+------+------+----------+-------------+
1 row in set, 1 warning (0.00 sec)
```

### 5. 优化嵌套查询

Mysql4.1版本之后，开始支持SQL的子查询。这个技术可以使用SELECT语句来创建一个单列的查询结果，然后把这个结果作为过滤条件用在另一个查询中。使用子查询可以一次性的完成很多逻辑上需要多个步骤才能完成的SQL操作，同时也可以避免事务或者表锁死，并且写起来也很容易。但是，有些情况下，子查询是可以被更高效的连接（JOIN）替代。

示例 ，查找有角色的所有的用户信息 : 

```mysql
mysql [test]> explain select * from t_user where id in (select user_id from user_role);
+----+--------------+-------------+------------+--------+---------------+---------------+---------+----------------+------+----------+-------------+
| id | select_type  | table       | partitions | type   | possible_keys | key           | key_len | ref            | rows | filtered | Extra       |
+----+--------------+-------------+------------+--------+---------------+---------------+---------+----------------+------+----------+-------------+
|  1 | SIMPLE       | t_user      | NULL       | ALL    | PRIMARY       | NULL          | NULL    | NULL           |    6 |   100.00 | Using where |
|  1 | SIMPLE       | <subquery2> | NULL       | eq_ref | <auto_key>    | <auto_key>    | 99      | test.t_user.id |    1 |   100.00 | NULL        |
|  2 | MATERIALIZED | user_role   | NULL       | index  | fk_ur_user_id | fk_ur_user_id | 99      | NULL           |    6 |   100.00 | Using index |
+----+--------------+-------------+------------+--------+---------------+---------------+---------+----------------+------+----------+-------------+
3 rows in set, 1 warning (0.00 sec)
```

使用JOIN来优化查询

```mysql
mysql [test]>explain select * from t_user u , user_role ur where u.id = ur.user_id;
+----+-------------+-------+------------+--------+---------------+---------+---------+-----------------+------+----------+-------------+
| id | select_type | table | partitions | type   | possible_keys | key     | key_len | ref             | rows | filtered | Extra       |
+----+-------------+-------+------------+--------+---------------+---------+---------+-----------------+------+----------+-------------+
|  1 | SIMPLE      | ur    | NULL       | ALL    | fk_ur_user_id | NULL    | NULL    | NULL            |    6 |   100.00 | Using where |
|  1 | SIMPLE      | u     | NULL       | eq_ref | PRIMARY       | PRIMARY | 98      | test.ur.user_id |    1 |   100.00 | NULL        |
+----+-------------+-------+------------+--------+---------------+---------+---------+-----------------+------+----------+-------------+
2 rows in set, 1 warning (0.00 sec)
```

连接(Join)查询之所以更有效率一些 ，是因为MySQL不需要在内存中创建临时表来完成这个逻辑上需要两个步骤的查询工作。

### 6. 优化`OR`查询

对于包含OR的查询子句，如果要利用索引，则OR之间的每个条件列都必须用到索引 ， 而且不能使用到复合索引； 如果没有索引，则应该考虑增加索引。

查询`emp`表中的索引

```mysql
mysql [test]>mysql [test]>show index from emp;
+-------+------------+--------------------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+---------------+
| Table | Non_unique | Key_name           | Seq_in_index | Column_name | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment |
+-------+------------+--------------------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+---------------+
| emp   |          0 | PRIMARY            |            1 | id          | A         |          12 |     NULL | NULL   |      | BTREE      |         |               |
| emp   |          1 | idx_emp_age_salary |            1 | age         | A         |          10 |     NULL | NULL   |      | BTREE      |         |               |
| emp   |          1 | idx_emp_age_salary |            2 | salary      | A         |          12 |     NULL | NULL   | YES  | BTREE      |         |               |
+-------+------------+--------------------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+---------------+
3 rows in set (0.00 sec)
```

`OR`之间的每一个字段都需要有索引，否则索引失效，例如：

```mysql
# name字段没有索引，所有字段的索引失效
mysql [test]>EXPLAIN SELECT * FROM emp WHERE id=1 OR name='TOM';
+----+-------------+-------+------------+------+---------------+------+---------+------+------+----------+-------------+
| id | select_type | table | partitions | type | possible_keys | key  | key_len | ref  | rows | filtered | Extra       |
+----+-------------+-------+------------+------+---------------+------+---------+------+------+----------+-------------+
|  1 | SIMPLE      | emp   | NULL       | ALL  | PRIMARY       | NULL | NULL    | NULL |   12 |    17.50 | Using where |
+----+-------------+-------+------------+------+---------------+------+---------+------+------+----------+-------------+
1 row in set, 1 warning (0.00 sec)
```

即使有复合索引，使用了`OR`，复合索引也失效。

```mysql
mysql [test]>mysql [test]>EXPLAIN SELECT * FROM emp WHERE  age=20  OR salary=3500;
+----+-------------+-------+------------+------+--------------------+------+---------+------+------+----------+-------------+
| id | select_type | table | partitions | type | possible_keys      | key  | key_len | ref  | rows | filtered | Extra       |
+----+-------------+-------+------------+------+--------------------+------+---------+------+------+----------+-------------+
|  1 | SIMPLE      | emp   | NULL       | ALL  | idx_emp_age_salary | NULL | NULL    | NULL |   12 |    19.00 | Using where |
+----+-------------+-------+------------+------+--------------------+------+---------+------+------+----------+-------------+
1 row in set, 1 warning (0.00 sec) 
```

建议使用`union`替换`OR`： 

```mysql
mysql [test]>EXPLAIN SELECT * FROM emp WHERE id = 1 OR id = 10;
+----+-------------+-------+------------+-------+---------------+---------+---------+------+------+----------+-------------+
| id | select_type | table | partitions | type  | possible_keys | key     | key_len | ref  | rows | filtered | Extra       |
+----+-------------+-------+------------+-------+---------------+---------+---------+------+------+----------+-------------+
|  1 | SIMPLE      | emp   | NULL       | range | PRIMARY       | PRIMARY | 4       | NULL |    2 |   100.00 | Using where |
+----+-------------+-------+------------+-------+---------------+---------+---------+------+------+----------+-------------+
1 row in set, 1 warning (0.00 sec)
# 上述SQl虽然使用了索引，但是type的值为range，效率不是很高。可以使用UNION替换
mysql [test]>mysql [test]>EXPLAIN SELECT * FROM emp WHERE id = 1 UNION SELECT * FROM emp WHERE id = 10;
+----+--------------+------------+------------+-------+---------------+---------+---------+-------+------+----------+-----------------+
| id | select_type  | table      | partitions | type  | possible_keys | key     | key_len | ref   | rows | filtered | Extra           |
+----+--------------+------------+------------+-------+---------------+---------+---------+-------+------+----------+-----------------+
|  1 | PRIMARY      | emp        | NULL       | const | PRIMARY       | PRIMARY | 4       | const |    1 |   100.00 | NULL            |
|  2 | UNION        | emp        | NULL       | const | PRIMARY       | PRIMARY | 4       | const |    1 |   100.00 | NULL            |
| NULL | UNION RESULT | <union1,2> | NULL       | ALL   | NULL          | NULL    | NULL    | NULL  | NULL |     NULL | Using temporary |
+----+--------------+------------+------------+-------+---------------+---------+---------+-------+------+----------+-----------------+
3 rows in set, 1 warning (0.00 sec)
# 此时type的值为const
```

### 7. 优化分页查询

一般分页查询时，通过创建覆盖索引能够比较好地提高性能。一个常见又非常头疼的问题就是`limit 2000000,10`，此时需要MySQL排序前2000010 记录，仅仅返回2000000 - 2000010的记录，其他记录丢弃，查询排序的代价非常大 。

```mysql
mysql [test]>EXPLAIN SELECT * FROM emp LIMIT 10,2;
+----+-------------+-------+------------+------+---------------+------+---------+------+------+----------+-------+
| id | select_type | table | partitions | type | possible_keys | key  | key_len | ref  | rows | filtered | Extra |
+----+-------------+-------+------------+------+---------------+------+---------+------+------+----------+-------+
|  1 | SIMPLE      | emp   | NULL       | ALL  | NULL          | NULL | NULL    | NULL |   12 |   100.00 | NULL  |
+----+-------------+-------+------------+------+---------------+------+---------+------+------+----------+-------+
1 row in set, 1 warning (0.00 sec)
```

#### 1.  优化思路一

在索引上完成排序分页操作，最后根据主键关联回原表查询所需要的其他列内容。

```mysql
mysql [test]>EXPLAIN SELECT * FROM emp e, ( SELECT id FROM emp ORDER BY id LIMIT 10, 2 ) t WHERE e.id = t.id;
+----+-------------+------------+------------+--------+---------------+---------+---------+------+------+----------+-------------+
| id | select_type | table      | partitions | type   | possible_keys | key     | key_len | ref  | rows | filtered | Extra       |
+----+-------------+------------+------------+--------+---------------+---------+---------+------+------+----------+-------------+
|  1 | PRIMARY     | <derived2> | NULL       | ALL    | NULL          | NULL    | NULL    | NULL |   12 |   100.00 | NULL        |
|  1 | PRIMARY     | e          | NULL       | eq_ref | PRIMARY       | PRIMARY | 4       | t.id |    1 |   100.00 | NULL        |
|  2 | DERIVED     | emp        | NULL       | index  | NULL          | PRIMARY | 4       | NULL |   12 |   100.00 | Using index |
+----+-------------+------------+------------+--------+---------------+---------+---------+------+------+----------+-------------+
3 rows in set, 1 warning (0.00 sec)
```

#### 2. 优化思路二

把`limit`查询转换成某个位置的查询。该方案适用于主键自增的表

```mysql
mysql [test]>mysql [test]>explain select * from emp where id > 10 limit 10;
+----+-------------+-------+------------+-------+---------------+---------+---------+------+------+----------+-------------+
| id | select_type | table | partitions | type  | possible_keys | key     | key_len | ref  | rows | filtered | Extra       |
+----+-------------+-------+------------+-------+---------------+---------+---------+------+------+----------+-------------+
|  1 | SIMPLE      | emp   | NULL       | range | PRIMARY       | PRIMARY | 4       | NULL |    2 |   100.00 | Using where |
+----+-------------+-------+------------+-------+---------------+---------+---------+------+------+----------+-------------+
1 row in set, 1 warning (0.00 sec)
```

### 8. 使用SQL提示

SQL提示，是优化数据库的一个重要手段，简单来说，就是在SQL语句中加入一些人为的提示来达到优化操作的目的。

```mysql
mysql [test]>SHOW INDEX FROM tb_seller;
+-----------+------------+--------------------------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+---------------+
| Table     | Non_unique | Key_name                 | Seq_in_index | Column_name | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment |
+-----------+------------+--------------------------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+---------------+
| tb_seller |          0 | PRIMARY                  |            1 | sellerid    | A         |          12 |     NULL | NULL   |      | BTREE      |         |               |
| tb_seller |          1 | idx_seller_name_sta_addr |            1 | name        | A         |          12 |     NULL | NULL   | YES  | BTREE      |         |               |
| tb_seller |          1 | idx_seller_name_sta_addr |            2 | status      | A         |          12 |     NULL | NULL   | YES  | BTREE      |         |               |
| tb_seller |          1 | idx_seller_name_sta_addr |            3 | address     | A         |          12 |     NULL | NULL   | YES  | BTREE      |         |               |
| tb_seller |          1 | idx_seller_address       |            1 | address     | A         |           2 |     NULL | NULL   | YES  | BTREE      |         |               |
| tb_seller |          1 | idx_seller_name          |            1 | name        | A         |          12 |     NULL | NULL   | YES  | BTREE      |         |               |
| tb_seller |          1 | idx_seller_status        |            1 | status      | A         |           3 |     NULL | NULL   | YES  | BTREE      |         |               |
+-----------+------------+--------------------------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+---------------+
7 rows in set (0.00 sec)
```

#### 1. USE INDEX

在查询语句中表名的后面，添加`use index`来提供希望MySQL去参考的索引列表，就可以让MySQL不再考虑其他可用的索引。

```mysql
# name 列包含了两个索引，但是默认使用了idx_seller_name_sta_addr
mysql [test]>EXPLAIN  SELECT * FROM tb_seller WHERE name = '小米科技';
+----+-------------+-----------+------------+------+------------------------------------------+--------------------------+---------+-------+------+----------+-------+
| id | select_type | table     | partitions | type | possible_keys                            | key                      | key_len | ref   | rows | filtered | Extra |
+----+-------------+-----------+------------+------+------------------------------------------+--------------------------+---------+-------+------+----------+-------+
|  1 | SIMPLE      | tb_seller | NULL       | ref  | idx_seller_name_sta_addr,idx_seller_name | idx_seller_name_sta_addr | 403     | const |    1 |   100.00 | NULL  |
+----+-------------+-----------+------------+------+------------------------------------------+--------------------------+---------+-------+------+----------+-------+
1 row in set, 1 warning (0.00 sec)
# 使用USE INDEX指定期望使用的索引
mysql [test]>EXPLAIN  SELECT * FROM tb_seller USE INDEX (idx_seller_name) WHERE name = '小米科技';
+----+-------------+-----------+------------+------+-----------------+-----------------+---------+-------+------+----------+-------+
| id | select_type | table     | partitions | type | possible_keys   | key             | key_len | ref   | rows | filtered | Extra |
+----+-------------+-----------+------------+------+-----------------+-----------------+---------+-------+------+----------+-------+
|  1 | SIMPLE      | tb_seller | NULL       | ref  | idx_seller_name | idx_seller_name | 403     | const |    1 |   100.00 | NULL  |
+----+-------------+-----------+------------+------+-----------------+-----------------+---------+-------+------+----------+-------+
1 row in set, 1 warning (0.00 sec)

```

#### 2. IGNORE INDEX

如果用户只是单纯的想让MySQL忽略一个或者多个索引，则可以使用`ignore index`作为hint 。

```mysql
mysql [test]>EXPLAIN  SELECT * FROM tb_seller IGNORE INDEX (idx_seller_name) WHERE name = '小米科技';
+----+-------------+-----------+------------+------+--------------------------+--------------------------+---------+-------+------+----------+-------+
| id | select_type | table     | partitions | type | possible_keys            | key                      | key_len | ref   | rows | filtered | Extra |
+----+-------------+-----------+------------+------+--------------------------+--------------------------+---------+-------+------+----------+-------+
|  1 | SIMPLE      | tb_seller | NULL       | ref  | idx_seller_name_sta_addr | idx_seller_name_sta_addr | 403     | const |    1 |   100.00 | NULL  |
+----+-------------+-----------+------------+------+--------------------------+--------------------------+---------+-------+------+----------+-------+
```

#### 3. FORCE INDEX

为强制MySQL使用一个特定的索引，可在查询中使用 force index 作为hint 。 

``` mysql
# MySQL评估使用索引比全表更慢，则不使用索引
mysql [test]>EXPLAIN SELECT * FROM tb_seller WHERE address = '北京市';
+----+-------------+-----------+------------+------+--------------------+------+---------+------+------+----------+-------------+
| id | select_type | table     | partitions | type | possible_keys      | key  | key_len | ref  | rows | filtered | Extra       |
+----+-------------+-----------+------------+------+--------------------+------+---------+------+------+----------+-------------+
|  1 | SIMPLE      | tb_seller | NULL       | ALL  | idx_seller_address | NULL | NULL    | NULL |   12 |    91.67 | Using where |
+----+-------------+-----------+------------+------+--------------------+------+---------+------+------+----------+-------------+
1 row in set, 1 warning (0.00 sec)
# USE INDEX 只是提供一个参考，但是全表扫描更快，并是没有使用索引
mysql [test]>EXPLAIN SELECT * FROM tb_seller USE INDEX(idx_seller_address) WHERE address = '北京市';
+----+-------------+-----------+------------+------+--------------------+------+---------+------+------+----------+-------------+
| id | select_type | table     | partitions | type | possible_keys      | key  | key_len | ref  | rows | filtered | Extra       |
+----+-------------+-----------+------------+------+--------------------+------+---------+------+------+----------+-------------+
|  1 | SIMPLE      | tb_seller | NULL       | ALL  | idx_seller_address | NULL | NULL    | NULL |   12 |    91.67 | Using where |
+----+-------------+-----------+------------+------+--------------------+------+---------+------+------+----------+-------------+
1 row in set, 1 warning (0.00 sec)
# 使用FORCE  INDEX强制mysql使用索引
mysql [test]>EXPLAIN SELECT * FROM tb_seller FORCE  INDEX(idx_seller_address) WHERE address = '北京市';
+----+-------------+-----------+------------+------+--------------------+--------------------+---------+-------+------+----------+-------+
| id | select_type | table     | partitions | type | possible_keys      | key                | key_len | ref   | rows | filtered | Extra |
+----+-------------+-----------+------------+------+--------------------+--------------------+---------+-------+------+----------+-------+
|  1 | SIMPLE      | tb_seller | NULL       | ref  | idx_seller_address | idx_seller_address | 403     | const |   11 |   100.00 | NULL  |
+----+-------------+-----------+------------+------+--------------------+--------------------+---------+-------+------+----------+-------+
1 row in set, 1 warning (0.00 sec)
```





