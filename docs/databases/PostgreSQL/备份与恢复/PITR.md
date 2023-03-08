PITR(Point-in-Time Recovery)，基于时间点的恢复，可以恢复basebackup时，由pg_backup_start创建点REDO点到之后任意时间的数据。 

![Fig. 10.2. Basic concept of PITR.](https://www.interdb.jp/pg/img/fig-10-02.png)

## 一、PIRT的恢复流程

1. 使用内部函数read_backup_label 从backup_label文件中读取CHECKPOINT LOCATION的值。
2. 从postgresql.conf中读取restore_command和recovery_target_time的值。
3. 用从CHECKPOINT LOCATION获取的REDO点重放 WAL 数据，执行restore_command中配置的命令，将归档日志从归档区域复制到临时区域，并从中读取 WAL 数据，复制到临时区域中的日志文件会在使用后被删除。
    如果参数recovery_target_time设置了时间戳，会从REDO点读取并重放WAL数据，直到设置的时间戳为止。如果postgresql.conf中没有配置recovery_target，则将重放至归档日志的末尾。
4. 当恢复过程完成时，会在pg_wal中创建时间线历史文件，如00000002.history。如果启用了日志归档功能，则还会在归档目录中创建相同的命名文件。

PIRT的恢复过程与常规的完全恢复过程基本一致，区别有两点：

1. 读取WAL/归档日志的位置不同：常规的恢复模式下，从数据目录下的pg_wal中读取，PITR模式下，从 archive_command 指定的归档目录下获取
2. 读取checkpoint的位置不同：常规的恢复模式下，从pg_control中读取，PITR模式下从backup_label文件中获取。

例如在上一次的全量恢复后，在12:15:00时间点又犯了一个错误，错误发生在时间线ID为2的数据库集簇上。在这种情况下，为了恢复数据库，需要在postgresql.conf中指定参数 recovery_target_time和recovery_target_timeline。重启PostgreSQL服务器并进入PITR模式，数据库会沿着时间线标识2进行恢复。

```bash
recovery_target_time = "2023-2-1 12:15:00 GMT"
recovery_target_timeline = 2
```

 ![Fig. 10.5. Recover the database at 12:15:00 along the timelineId 2.](https://www.interdb.jp/pg/img/fig-10-05.png) 

- (1) PostgreSQL reads the value of ‘*CHECKPOINT LOCATION*’ from the backup_label file.
- (2) Some values of parameters are read from the recovery.conf; in this example, *restore_command*, *recovery_target_time*, and *recovery_target_timeline*.
- (3) PostgreSQL reads the timeline history file ‘00000002.history’ which is corresponding to the value of the parameter *recovery_target_timeline*.
- (4) PostgreSQL does replaying WAL data by the following steps:
    - \1. From the REDO point to the LSN ‘0/A000198’ which is written in the 00000002.history file, PostgreSQL reads and replays WAL data of appropriate archive logs whose timelineId is 1.
    - \2. From the one after LSN ‘0/A000198’ to the one before the timestamp ‘2023-2-1 12:15:00’, PostgreSQL reads and replays WAL data (of appropriate archive logs) whose timelineId is 2.
- (5) When the recovery process completes, the current timelineId will advance to 3, and new timeline history file named *00000003.history* is created in the pg_xlog subdirectory (pg_wal subdirectory if version 10 or later) and the archival directory.
- ```
    postgres> cat /home/postgres/archivelogs/00000003.history
    1         0/A000198     before 2023-2-1 12:05:00.861324+00
    
    2         0/B000078     before 2023-2-1 12:15:00.927133+00
    ```

When you do PITR more than once, you should explicitly set a timelineId for using the appropriate timeline history file.

## 二、PITR的恢复实验

基于上一篇已经恢复过一次的数据库进行操作。

准备数据

```sql
postgres=# create table tbl(id int, name varchar(20));
CREATE TABLE
postgres=# insert into tbl values(1,'a'),(2,'b'),(3,'c');
INSERT 0 3
```

### 1. recovery_target_time

recovery_target_time(timestramp)：指定按时间戳恢复。

#### 1. 删除数据

```sql
postgres=# select current_timestamp;
       current_timestamp       
-------------------------------
 2023-02-02 23:26:59.785955+08
(1 row)

postgres=# delete from tbl;
DELETE 3
postgres=# select * from tbl;
 id | name 
----+------
(0 rows)

postgres=# select pg_switch_wal(); -- 切换日志，保证wal日志同步到归档目录
 pg_switch_wal 
---------------
 0/70134A0
(1 row)
```

#### 2. 恢复数据

清理当前数据

```bash
postgres@ubuntu:~$ pg_ctl stop
postgres@ubuntu:~$ rm -rf $PGDATA/*
```

恢复数据并指定recovery_target_time

```bash
postgres@ubuntu:~$ touch $PGDATA/recovery.signal
postgres@ubuntu:~$ tar xf backup.tar/base.tar.gz -C $PGDATA
postgres@ubuntu:~$ tar xf backup.tar/pg_wal.tar.gz -C $PGDATA
postgres@ubuntu:~$ echo "recovery_target_time = '2023-02-02 23:26:59.785955+08'" >> $PGDATA/postgresql.conf
```

#### 3. 启动数据库

```bash
postgres@ubuntu:~$ pg_ctl start
waiting for server to start....2023-02-02 23:30:06.035 CST [5328] LOG:  starting PostgreSQL 12.13 on x86_64-pc-linux-gnu, compiled by gcc (Ubuntu 7.5.0-3ubuntu1~18.04) 7.5.0, 64-bit
2023-02-02 23:30:06.036 CST [5328] LOG:  listening on IPv4 address "127.0.0.1", port 5432
2023-02-02 23:30:06.054 CST [5328] LOG:  listening on Unix socket "/tmp/.s.PGSQL.5432"
2023-02-02 23:30:06.095 CST [5329] LOG:  database system was interrupted; last known up at 2023-01-30 22:52:08 CST
2023-02-02 23:30:06.126 CST [5329] LOG:  restored log file "00000002.history" from archive
cp: cannot stat '/home/postgres/archive/00000003.history': No such file or directory
2023-02-02 23:30:06.131 CST [5329] LOG:  starting point-in-time recovery to 2023-02-02 23:26:59.785955+08
2023-02-02 23:30:06.146 CST [5329] LOG:  restored log file "00000002.history" from archive
2023-02-02 23:30:06.189 CST [5329] LOG:  restored log file "000000010000000000000004" from archive
2023-02-02 23:30:06.231 CST [5329] LOG:  redo starts at 0/4000028
2023-02-02 23:30:06.248 CST [5329] LOG:  consistent recovery state reached at 0/4000138
2023-02-02 23:30:06.249 CST [5328] LOG:  database system is ready to accept read only connections
2023-02-02 23:30:06.302 CST [5329] LOG:  restored log file "000000010000000000000005" from archive
 done
server started
postgres@ubuntu:~$ 2023-02-02 23:30:06.380 CST [5329] LOG:  restored log file "000000020000000000000006" from archive
2023-02-02 23:30:06.441 CST [5329] LOG:  restored log file "000000020000000000000007" from archive
2023-02-02 23:30:06.471 CST [5329] LOG:  recovery stopping before commit of transaction 488, time 2023-02-02 23:27:19.159422+08
2023-02-02 23:30:06.471 CST [5329] LOG:  recovery has paused
2023-02-02 23:30:06.471 CST [5329] HINT:  Execute pg_wal_replay_resume() to continue.
```

连接到数据库验证数据是否恢复

```sql
postgres=# select * from tbl; -- 删除的数据恢复成功
 id | name 
----+------
  1 | a
  2 | b
  3 | c
(3 rows)
```

接触暂停状态

```sql
postgres=# select pg_wal_replay_resume();
 pg_wal_replay_resume 
----------------------
 
(1 row)
```

### 2. recovery_target_name

recovery_target_name(string)：从pg_create_restore_point()所创建恢复点，进行恢复。

#### 1. 创建还原点

```sql
postgres=# select * from tbl;
 id | name 
----+------
  1 | a
  2 | b
  3 | c
(3 rows)

postgres=# select pg_create_restore_point('rp1'); -- 创建还原点
 pg_create_restore_point 
-------------------------
 0/7013400
(1 row)

postgres=# drop table tbl;
DROP TABLE
postgres=# select pg_switch_wal();
 pg_switch_wal 
---------------
 0/701AD88
(1 row)

```

#### 2. 恢复数据

```bash
postgres@ubuntu:~$ touch $PGDATA/recovery.signal
postgres@ubuntu:~$ tar xf backup.tar/base.tar.gz -C $PGDATA
postgres@ubuntu:~$ tar xf backup.tar/pg_wal.tar.gz -C $PGDATA
postgres@ubuntu:~$ echo "recovery_target_name = 'rp1'" >> $PGDATA/postgresql.conf
```

#### 3. 启动数据库

```bash
postgres@ubuntu:~$ pg_ctl start
waiting for server to start....2023-02-02 23:48:09.528 CST [81978] LOG:  starting PostgreSQL 12.13 on x86_64-pc-linux-gnu, compiled by gcc (Ubuntu 7.5.0-3ubuntu1~18.04) 7.5.0, 64-bit
2023-02-02 23:48:09.559 CST [81978] LOG:  listening on IPv4 address "127.0.0.1", port 5432
2023-02-02 23:48:09.584 CST [81978] LOG:  listening on Unix socket "/tmp/.s.PGSQL.5432"
2023-02-02 23:48:09.648 CST [81979] LOG:  database system was interrupted; last known up at 2023-01-30 22:52:08 CST
2023-02-02 23:48:09.669 CST [81979] LOG:  restored log file "00000002.history" from archive
2023-02-02 23:48:09.674 CST [81979] LOG:  restored log file "00000003.history" from archive
cp: cannot stat '/home/postgres/archive/00000004.history': No such file or directory
2023-02-02 23:48:09.678 CST [81979] LOG:  starting point-in-time recovery to "rp1"
2023-02-02 23:48:09.684 CST [81979] LOG:  restored log file "00000003.history" from archive
2023-02-02 23:48:09.720 CST [81979] LOG:  restored log file "000000010000000000000004" from archive
2023-02-02 23:48:09.744 CST [81979] LOG:  restored log file "00000002.history" from archive
2023-02-02 23:48:09.805 CST [81979] LOG:  redo starts at 0/4000028
2023-02-02 23:48:09.821 CST [81979] LOG:  consistent recovery state reached at 0/4000138
2023-02-02 23:48:09.822 CST [81978] LOG:  database system is ready to accept read only connections
 done
server started
postgres@ubuntu:~$ 2023-02-02 23:48:09.857 CST [81979] LOG:  restored log file "000000010000000000000005" from archive
2023-02-02 23:48:09.915 CST [81979] LOG:  restored log file "000000020000000000000006" from archive
2023-02-02 23:48:09.952 CST [81979] LOG:  restored log file "000000030000000000000007" from archive
2023-02-02 23:48:09.975 CST [81979] LOG:  recovery stopping at restore point "rp1", time 2023-02-02 23:44:09.828934+08
2023-02-02 23:48:09.975 CST [81979] LOG:  recovery has paused
2023-02-02 23:48:09.975 CST [81979] HINT:  Execute pg_wal_replay_resume() to continue.
```

连接到数据库验证数据是否恢复

```sql
postgres=# select * from tbl; -- 删除的数据恢复成功
 id | name 
----+------
  1 | a
  2 | b
  3 | c
(3 rows)
```

接触暂停状态

```sql
postgres=# select pg_wal_replay_resume();
 pg_wal_replay_resume 
----------------------
 
(1 row)
```

此时数据库时间线为4

```bash
postgres@ubuntu:~$ cat $PGDATA/pg_wal/00000004.history 
1	0/6000000	no recovery target specified

2	0/70132E8	before 2023-02-02 23:27:19.159422+08


3	0/7013400	at restore point "rp1"
```

### 3. recovery_target_xid

recovery_target_xid(string)：按事物ID进行恢复。

### 4. revovery_target_lsn

revovery_target_lsn(lsn_log)：按继续进行的WAL日志位置的LSN进行恢复。

