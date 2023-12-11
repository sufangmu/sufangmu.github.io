## autovacuum

Autovacuum是启动PostgresQL时自动启动的后台实用程序进程之一
在生产系统中不应该将其设置为关闭

```bash
autovacuum= on #（ON by default）
track_counts= on #（ON by default）
```

## autovacuum作用

1. 需要vacuum来移除死元组
2. 防止死元组膨胀
3. 更新表的统计信息进行分析，以便提供优化器使用
4. autovacuum launcher使用Stats Collector的后台进程收集的信息来确定autovacuum的候选表列表

## 记录autovacuum

```bash
log_autovacuum_min_duration
    -1  表示不记录
    0：表示记录所有的
    250ms # or 1s，1min，1h，1d:表示记录真空操作时间大于此值的操
```

## 什么时候做autovacuum?

1. Autovacuum操作的实际内容:
   1. vacuum;
   2. Analyze
2. Autovacuum vacuum触发条件(如果由于更新和删除，表中的实际死元组数超过此有效阈值，则该表将成为autovacuum的候选表)：
`Autovacuum VACUUM thresold for a table = autovacuum_vacuum_scale_factor * number of tuples + autovacuum_vacuum_threshold`
3. Autovacuum ANALYZE触发条件(自上次分析以来插入/删除/更新总数超过此阈值的任何表都有资格进行autovacuum分析)：`Autovacuum ANALYZE threshold for a table = autovacuum_analyze_scale_factor * number of tuples + autovacuum_analyze_threshold`

例如表Employee有1000行
以上述数学公式为参考：
当满足`Total number of Obsolete records = (0.2 * 1000) + 50 = 250`的条件时，employee成为autovacuum Vacuum的候选者。
当满足`Total number of Inserts/Deletes/Updates = (0.1 * 1000) + 50 = 150`的条件时，employee成为autovacuum ANALYZE的候选者。

上述参数值有一个问题：
当Table1有100行，其触发分析和vacuum的阈值分别是：60和70。
当Table2有100万行，其触发分析和vacuum的阈值分别是：100050和200050。
如果两张表都做同样数量的dml操作，T1触发autovacuum是T2的2857倍!



## 如何确定需要调整其autovacuum setting的表?

为了单独调整表的autovacuum，必须知道一段时间内表上的插入/删除/更新数。

```sql
SELECT n_tup_ins as "inserts",n_tup_upd as "updates",n_tup_del as "deletes",n_live_tup as "live_tuples", n_dead_tup as "dead_tuples"
FROM pg_stat_user_tables
WHERE schemaname = 'scott' and relname = 'employee';
inserts | updates | deletes | live_tuples | dead_tuples
---------+---------+---------+-------------+-------------
30 | 40 | 9 | 21 | 49
```


## 调整表的autovacuum setting的设置

可以通过设置单个表的存储参数来重写此行为，这样会忽略全局设置。
```sql
postgres=# alter table percona.employee set (autovacuum_vacuum_threshold = 100);
postgres=# alter table percona.employee set (autovacuum_vacuum_scale_factor=0);
postgres=# \d+ percona.employee
Table "percona.employee"
Column | Type | Collation | Nullable | Default | Storage | Stats target | Description
--------+---------+-----------+----------+---------+---------+--------------+-------------
id | integer | | | | plain | |
Options: autovacuum_vacuum_threshold=100, autovacuum_vacuum_scale_factor = 0
```

只要有超过100条过时的记录,运行autovacuum vacuum.



## autovacuum_max_workers

一次可以运行多少个autovacuum过程

1、在可能包含多个数据库的实例/群集上，一次运行的autovacuum进程数不能超过下面参数设置的值：

```bash
autovacuum_max_workers = 3 (Default)
```

2、启动下一个autovacuum之前的等待时间：

```bash
autovacuum_naptime = 1min
(autovacuum_naptime/N) 其中N是实例中数据库的总数
```

autovacuum可以看作是一种清洁工作，是一个IO密集型操作。可以设置一些参数来最小化autovacuum对IO的影响。

```
autovacuum_vacuum_cost_limit : autovacuum可达到的总成本限制(结合所有autovacuum作业)
autovacuum_vacuum_cost_delay : 当一个清理工作达到autovacuum_vacuum_cost_limit指定的成本限制时，autovacuum将休眠数毫秒
vacuum_cost_page_hit : 读取已在共享缓冲区中且不需要磁盘读取的页的成本.
vacuum_cost_page_miss : 获取不在共享缓冲区中的页的成本.
vacuum_cost_page_dirty : 在每一页中发现死元组时写入该页的成本.
```

如果上面参数默认的值设置如下：

```conf
autovacuum_vacuum_cost_limit = 200
autovacuum_vacuum_cost_delay = 20ms
vacuum_cost_page_hit = 1
vacuum_cost_page_miss = 10
vacuum_cost_page_dirty = 20
```

一秒（1000毫秒）内，在读取延迟为0毫秒的最佳情况下，autovacuum可以唤醒并进入睡眠50次(1000毫秒/20毫秒)，因为唤醒之间的延迟需要20毫秒。` second = 1000 milliseconds = 50 * autovacuum_vacuum_cost_delay`
由于在共享缓冲区中每次读取一个页面的相关成本是1，因此在每个唤醒中可以读取200个页面(因为上面把总成本限制设置为200)，在50个唤醒中可以读取50*200个页面。
如果在共享缓冲区中找到了所有具有死元组的页，并且autovacuum代价延迟为20毫秒，则它可以在每一轮中读取：((200/ vacuum_cost_page_hit)*8)KB，这需要等待autovacuum代价延迟时间量。

因此，考虑到块大小为8192字节，autovacuum最多可以读取：50*200*8kb=78.13mb/s(如果在共享缓冲区中已经找到块)。
如果块不在共享缓冲区中，需要从磁盘提取，则autovacuum可以读取：50*(200/ vacuum_cost_page_miss)*8)KB=7.81 MB/秒。

为了从页/块中删除死元组，写操作的开销是：vacuum_cost_page_dirty，默认设置为20
一个autovacuum每秒最多可以写/脏：50*(200/ vacuum_cost_page_dirty)*8)KB=3.9mb/秒。



## autovacuum_max_workers的调整

通常，autovacuum_vacuum_cost_limit成本平均分配给实例中运行的所有autovacuum过程的autovacuum_max_workers数。
因此，增加autovacuum_max_workers可能会延迟当前运行的autovacuum workers的autovacuum执行。
而增加autovacuum_vacuum_cost_limit可能会导致IO瓶颈。
可以通过设置单个表的存储参数来重写此行为，这样会忽略全局设置。

原文：https://www.percona.com/blog/tuning-autovacuum-in-postgresql-and-autovacuum-internals/