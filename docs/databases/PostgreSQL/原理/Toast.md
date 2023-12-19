## Toast技术产生背景

元组不允许跨页面存储

## toast技术特点

1. Toast是超长字段在PG的一个存储方式
2. 全称The OverSized Attribute Storage Technique(超尺寸字段存储技术)
3. 它会将大字段值压缩或者分散为多个物理行来存
4. 对于用户来说不用关注这一技术实现，完全是透明的

## Toast的存储方式

1. PG的部分类型数据支持toast，因为有些字段类型是不会产生大字段数据(比如date,time,boolean等)
2. 支持Toast的数据类型应当是可变长度的(variable-length)
3. 表中任何一个字段有Toast，这个表都会有这一个相关联的Toast表，OID被存储在pg_class.reltoastrelid里
4. 超出的的数值将会被分割成chunks，并且最多toast_max_chunk_size 个byte(缺省是2KB)
5. 当存储的列长度超过toast_tuple_threshold值(通常是2KB)，就会触发toast存储
6. toast将会压缩或者移动字段值直到超出部分比toast_tuple_targer值小(这个值通常也是2KB)。


## 创建Toast表

### 建表时自动创建Toast表

```sql
--创建表
create table toast_t(id int,vname varchar(48),remark text);
--其中remark数据类型是text，列值长度超过2KB则就会自动产生toast表来存储。
```


### 更改表的存储方式为Toast

语法：

```sql
ALTER TABLE toast_t ALTER COLUMN vname
SET STORAGE {PLAIN | EXTENDED | MAIN | EXTERNAL};
```

示例：

```sql
postgres=# create table toast_t1(dd character varying);
CREATE TABLE
postgres=# alter table toast_t1 alter column dd set storage main;
ALTER TABLE
postgres=# \d+ toast_t1
                                      Table "public.toast_t1"
 Column |       Type        | Collation | Nullable | Default | Storage | Stats target | Description 
--------+-------------------+-----------+----------+---------+---------+--------------+-------------
 dd     | character varying |           |          |         | main    |              | 
Access method: heap
postgres=# select relname,relfilenode,reltoastrelid from pg_class where relname='toast_t1';
 relname  | relfilenode | reltoastrelid 
----------+-------------+---------------
 toast_t1 |       16811 |         16814
(1 row)
postgres=# --查看toast表的oid
postgres=# select relname,relfilenode,reltoastrelid from pg_class where relname='toast_t1';
 relname  | relfilenode | reltoastrelid 
----------+-------------+---------------
 toast_t1 |       16811 |         16814
(1 row)
postgres=# --根据toast表oid查看其名字
select relname from pg_class where oid = '16814';
    relname     
----------------
 pg_toast_16811
(1 row)
```


## Toast4种策略

| 策略     | 说明                                                                                                                                                                      |
|----------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| PLAIN    | 避免压缩和行外存储。只有那些不需要TOAST策略就能存放的数据类型允许选择(例如 int 类型)，而对于text这类要求存储长度超过页大小的类型，是不允许采用此策略的。                  |
| MAIN     | 允许压缩，但不许行外存储。不过实际上，为了保证过大数据的存储，行外存储在其它方式(例如压缩)都无法满足需求的情况下，作为最后手段还是会被启动。因此理解为尽量不使用行外存储更贴切。 |
| EXTENDED | 允许行外存储和压缩。一般会先压缩，如果还是太大，就会行外存储                                                                                                                 |
| EXTERNA  | 允许行外存储，但不许压缩。类似字符串这种会对数据的一部分进行操作的字段，采用此策略可能获得更高的性能，因为不需要读取出整行数据再解压。                                         |



## Toast表额外的三个字段

| 字段名     | 属性                                               |
|------------|--------------------------------------------------|
| chunk_id   | 标识TOAST表的OID字段                               |
| chunk_seq  | chunk的序列号，与chunk_id的组合唯一索引可以加速访问 |
| chunk_data | 存储TOAST表的实际数据                              |

```sql
postgres=# select relname,oid,reltoastrelid from pg_class where relname='toast_t1';
 relname  |  oid  | reltoastrelid 
----------+-------+---------------
 toast_t1 | 16811 |         16814
(1 row)

postgres=# --根据toast表oid查看其名字
postgres=# select relname from pg_class where oid = '16814';
    relname     
----------------
 pg_toast_16811
(1 row)

postgres=# --查看toast表结构，toast表属于pg_toast模式
postgres=# \d+ pg_toast.pg_toast_16811
TOAST table "pg_toast.pg_toast_16811"
   Column   |  Type   | Storage 
------------+---------+---------
 chunk_id   | oid     | plain
 chunk_seq  | integer | plain
 chunk_data | bytea   | plain

```

## Toast表的计算

计算一个表的大小时要注意统计Toast的大小，因为对超长字段存储时，在基础表上可能只存了20%，另外的数据都存到了Toast里面去了，计算大小时要结合起来看
索引也是一样，对于表里有extended或者EXTERNA 类型的会创建Toast表，两者的关联是通过pg_class里的OID去关联的

```sql
postgres=# create table toast_t(id int,vname varchar(48),remark text);
CREATE TABLE
postgres=# select relname,oid from pg_class where relname = 'toast_t';
 relname |  oid  
---------+-------
 toast_t | 16817
(1 row)

postgres=# select relname,reltoastrelid from pg_class where relname = 'toast_t';
 relname | reltoastrelid 
---------+---------------
 toast_t |         16820
(1 row)

postgres=# select relname from pg_class where oid = '16820';
    relname     
----------------
 pg_toast_16817
(1 row)

postgres=# --插入数据，此时remark列值长度小于2KB，所以不会触发toast存储
postgres=# insert into toast_t select generate_series(1,4),repeat('kenyon here'||'^_^',2),repeat('^_^ Kenyon is not God,Remark here!!',2000);
INSERT 0 4
postgres=# --查看表中列值大小
postgres=# select pg_column_size(id),pg_column_size(vname),pg_column_size(remark) from toast_t limit 10;
 pg_column_size | pg_column_size | pg_column_size 
----------------+----------------+----------------
              4 |             29 |            851
              4 |             29 |            851
              4 |             29 |            851
              4 |             29 |            851
(4 rows)

postgres=# --查看基础表和 Toast 的大小
postgres=# select pg_size_pretty(pg_relation_size('toast_t'));
 pg_size_pretty 
----------------
 8192 bytes
(1 row)

postgres=# --查看toast表尺寸
select pg_size_pretty(pg_relation_size('16820'));
 pg_size_pretty 
----------------
 0 bytes
(1 row)

postgres=# --此时remark列值长度小于2KB，所以不会触发toast存储
postgres=# --remark列值超过 2kb 左右时触发了toast存储方式
postgres=# insert into toast_t select generate_series(3,4),repeat('kenyon here'||'^_^',2),repeat('^_^ Kenyon is not God,Remark here!!',5500);
INSERT 0 2

postgres=# select pg_size_pretty(pg_relation_size('16820'));
 pg_size_pretty 
----------------
 8192 bytes
(1 row)

postgres=# --查看各列的数据变化，说明在列尺寸超过2k的时候就会把数据存放到toast表中
postgres=# select pg_column_size(id),pg_column_size(vname),pg_column_size(remark) from toast_t;
 pg_column_size | pg_column_size | pg_column_size 
----------------+----------------+----------------
              4 |             29 |            851
              4 |             29 |            851
              4 |             29 |            851
              4 |             29 |            851
              4 |             29 |           2247
              4 |             29 |           2247
(6 rows)

postgres=# --继续插入更多的数据
postgres=# insert into toast_t select generate_series(1,2),repeat('kenyon here'||'^_^',2),repeat('^_^ Kenyon is not God,Remark here!!',10000);
INSERT 0 2

postgres=# --查看toast表大小
postgres=# select pg_size_pretty(pg_relation_size('16820'));
 pg_size_pretty 
----------------
 16 kB
(1 row)

postgres=# --继续插入更多的数据，20000
postgres=# insert into toast_t select generate_series(1,2),repeat('kenyon here'||'^_^',2),repeat('^_^ Kenyon is not God,Remark here!!',20000);
INSERT 0 2
postgres=# --查看toast表大小
postgres=# select pg_size_pretty(pg_relation_size('16820'));
 pg_size_pretty 
----------------
 32 kB
(1 row)

postgres=# --可以看到后插入的数据随着字段内容的增多，toast 段一直在变大。基础表的大小没有变化。这个和 Oracle 存储的大字段内容比较像，Oracle 存储 Blob和clob 类的数据时也是指定另外的 segment 来存储，而不是在原表中存储，当然可以设置 enable storage in row 来指定表中存储
```

## Toast表的优点

1. 可以存储超长超大字段，避免之前不能直接存储的限制
2. 物理上与普通表是分离的，检索查询时不检索到该字段会极大地加快速度
3. 更新普通表时，该表的Toast数据没有被更新时，不用去更新Toast表
4. 使用explain不会统计toast访问部分的代价，需要单独用explain统计访问toast表的代价
## Toast表的缺点

1. 对大字段的索引创建是一个问题，有可能会失败，通常不建议在大字段上创建，全文检索是一个解决方案
2. 大字段的更新会有点慢，其它DB也存在相同问题
