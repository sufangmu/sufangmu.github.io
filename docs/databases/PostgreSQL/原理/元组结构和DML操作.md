## 一、元组结构

![Tuple structure.](images/fig-5-02.png)

元组结构：HeapTupleHeaderData结构、空值位图及用户数据

HeapTupleHeaderData结构：
- t_xmin保存插入此元组的事务的txid。
- t_xmax保存删除或更新此元组的事务的txid。如果尚未删除或更新此元组，则t_xmax设置为0，即无效。
- t_cid保存命令标识（command id,cid）,cid的意思是在当前事务中，执行当前命令之前执行了多少SQL命令，从零开始计数。例如，假设我们在单个事务中执行了3条INSERT命令BEGIN;INSERT;INSERT;INSERT;COMMIT;。如果第一条命令插入此元组，则该元组的t_cid会被设置为0。如果第二条命令插入此元组，则其t_cid会被设置为1，以此类推。
- t_ctid保存着指向自身或新元组的元组标识符（tid）。tid用于标识表中的元组。在更新该元组时，t_ctid会指向新版本的元组，否则t_ctid会指向自己。

行结构

![Tuple structure.](images/fig-5-03.png)

PostgreSQL自带了一个第三方贡献的扩展模块pageinspect，可用于检查数据库页面的具体内容。


## 2. DML

### 1. INSERT

![Tuple INSERT.](images/fig-5-04.png)

假设元组是由txid=99的事务插入页面中的，在这种情况下，被插入元组的首部字段会依以下步骤设置。
Tuple_1：
- t_xmin设置为99，因为此元组由txid=99的事务所插入。
- t_xmax设置为0，因为此元组尚未被删除或更新。
- t_cid设置为0，因为此元组是由txid=99的事务所执行的第一条命令插入的。
- t_ctid设置为(0,1)，指向自身，因为这是该元组的最新版本。

```sql
postgres=# CREATE EXTENSION pageinspect;
CREATE EXTENSION
postgres=# CREATE TABLE tbl (data text);
CREATE TABLE
postgres=# INSERT INTO tbl VALUES('A');
INSERT 0 1
postgres=# SELECT lp as tuple, t_xmin, t_xmax, t_field3 as t_cid, t_ctid FROM heap_page_items(get_raw_page('tbl', 0));
 tuple | t_xmin | t_xmax | t_cid | t_ctid 
-------+--------+--------+-------+--------
     1 | 448834 |      0 |     0 | (0,1)
(1 row)
```


### 2. DELETE

![Tuple DELETE.](images/fig-5-05.png)

在删除操作中，目标元组只是在逻辑上被标记为删除。目标元组的t_xmax字段将被设置为执行DELETE命令事务的txid。
假设Tuple_1被txid=111的事务删除。在这种情况下，Tuple_1的首部字段t_xmax被设为111。
如果txid=111的事务已经提交，就不一定要Tuple_1。通常不需要的元组在PostgreSQL中被称为死元组（dead tuple）。

### 3. UPDATE

![Tuple UPDATE.](images/fig-5-06.png)

在更新操作中，PostgreSQL在逻辑上实际执行的是删除最新的元组，并插入一条新的元组。
假设由txid=99的事务插入的行，被txid=100的事务更新两次。
当执行第一条UPDATE命令时，Tuple_1的t_xmax被设为txid=100，在逻辑上被删除，然后Tuple_2被插入，接下来重写Tuple_1的t_ctid以指向Tuple_2。Tuple_1和Tuple_2的头部字段设置如下。

Tuple_1：
  - t_xmax被设置为100。
  - t_ctid从(0,1)被改写为(0,2)。

Tuple_2：
  - t_xmin被设置为100。
  - t_xmax被设置为0。
  - t_cid被设置为0。
  - t_ctid被设置为(0,2)。


当执行第二条UPDATE命令时，和第一条UPDATE命令类似，Tuple_2被逻辑删除，Tuple_3被插入。Tuple_2和Tuple_3的首部字段设置如下。

Tuple_2：
  - t_xmax被设置为100。
  - t_ctid从(0,2)被改写为(0,3)。

Tuple_3：
  - t_xmin被设置为100。
  - t_xmax被设置为0。
  - t_cid被设置为1。
  - t_ctid被设置为(0,3)。

```sql
postgres=# CREATE TABLE tbl (data text);
CREATE TABLE
postgres=# INSERT INTO tbl VALUES('A');
INSERT 0 1
postgres=# SELECT lp as tuple, t_xmin, t_xmax, t_field3 as t_cid, t_ctid FROM heap_page_items(get_raw_page('tbl', 0));
 tuple | t_xmin | t_xmax | t_cid | t_ctid 
-------+--------+--------+-------+--------
     1 | 448838 |      0 |     0 | (0,1)
(1 row)

postgres=# BEGIN;
BEGIN
postgres=# update tbl set data='B';
UPDATE 1
postgres=# SELECT lp as tuple, t_xmin, t_xmax, t_field3 as t_cid, t_ctid FROM heap_page_items(get_raw_page('tbl', 0));
 tuple | t_xmin | t_xmax | t_cid | t_ctid 
-------+--------+--------+-------+--------
     1 | 448838 | 448839 |     0 | (0,2)
     2 | 448839 |      0 |     0 | (0,2)
(2 rows)

postgres=# update tbl set data='C';
UPDATE 1
postgres=# SELECT lp as tuple, t_xmin, t_xmax, t_field3 as t_cid, t_ctid FROM heap_page_items(get_raw_page('tbl', 0));
 tuple | t_xmin | t_xmax | t_cid | t_ctid 
-------+--------+--------+-------+--------
     1 | 448838 | 448839 |     0 | (0,2)
     2 | 448839 | 448839 |     0 | (0,3)
     3 | 448839 |      0 |     1 | (0,3)
(3 rows)

postgres=# END;
```

## 块空间的清理

块中被删除的行的是逻辑上删除，物理上还保留在块中，如果长时间不清理，会造成垃圾空间膨胀，设想，如果一个块中有50%垃圾，那么就浪费50%的存储空间如果读到内存，也会浪费50%的内存空间，所以需要定期的清理，而清理的工作由AutoVacuum来操作，或者我们也可以手动操作。
pg_freespacemap插件可以很好的监测块中空间的使用情况，可当作`full vacuum`操作的参考信息。

```sql
postgres=# CREATE EXTENSION pg_freespacemap;
CREATE EXTENSION
postgres=# SELECT *, round(100 * avail/8192 ,2) as "freespace ratio" FROM pg_freespace('tbl');
 blkno | avail | freespace ratio 
-------+-------+-----------------
     0 |     0 |            0.00
(1 row)
```