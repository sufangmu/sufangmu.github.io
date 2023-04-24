## pg_control文件



### 1. 文件位置

pg_control文件位于`$PGDATA/global/`目录下，pg_control文件物理大小是8K，其内容尽量保持小于512字节。

```bash
postgres@ubuntu:~$ ls -l $PGDATA/global/pg_control
-rw------- 1 postgres postgres 8192 Apr 24 22:55 /opt/software/postgresql/12.13/data/global/pg_control
```

### 2. 文件内容

#### 1. initdb时生成的静态信息

```bash
pg_control version number:            1201
Catalog version number:               201909212
Database system identifier:           7225634509658546764
Maximum data alignment:               8
Database block size:                  8192
Blocks per segment of large relation: 131072
WAL block size:                       8192
Bytes per WAL segment:                16777216
Maximum length of identifiers:        64
Maximum columns in an index:          32
Maximum size of a TOAST chunk:        1996
Size of a large-object chunk:         2048
Date/time type storage:               64-bit integers
Float4 argument passing:              by value
Float8 argument passing:              by value
```

#### 2. `postgresql.conf`文件中的信息

```bash
wal_level setting:                    replica
wal_log_hints setting:                off
max_connections setting:              100
max_worker_processes setting:         8
max_wal_senders setting:              10
max_prepared_xacts setting:           0
max_locks_per_xact setting:           64
track_commit_timestamp setting:       off
```

#### 3. WAL及checkpoint的动态信息

```bash
Latest checkpoint location:           0/15CD000
Latest checkpoint's REDO location:    0/15CD000
Latest checkpoint's REDO WAL file:    000000010000000000000001
Latest checkpoint's TimeLineID:       1
Latest checkpoint's PrevTimeLineID:   1
Latest checkpoint's full_page_writes: on
Latest checkpoint's NextXID:          0:486
Latest checkpoint's NextOID:          12676
Latest checkpoint's NextMultiXactId:  1
Latest checkpoint's NextMultiOffset:  0
Latest checkpoint's oldestXID:        479
Latest checkpoint's oldestXID's DB:   1
Latest checkpoint's oldestActiveXID:  0
Latest checkpoint's oldestMultiXid:   1
Latest checkpoint's oldestMulti's DB: 1
Latest checkpoint's oldestCommitTsXid:0
Latest checkpoint's newestCommitTsXid:0
Time of latest checkpoint:            Mon 24 Apr 2023 11:12:14 PM CST
Fake LSN counter for unlogged rels:   0/3E8
Minimum recovery ending location:     0/0
Min recovery ending loc's timeline:   0
Backup start location:                0/0
Backup end location:                  0/0
End-of-backup record required:        no
```

### 3. pg_control的维护

1. 固定部分：初始化数据库时产生，固定不变
2. 随时更新的信息：发生检查点、备份、日志切换等操作自动更新
3. postgresql.conf相关参数被更新，也会自动更新
4. 数据库备份时会一起备份
5. 不能手动改修改该文件
6. 启动和恢复数据库时需要此文件

### 4. pg_control重建

使用pg_resetwal命令进行重建，需要使用下面4个参数

```bash
-l     set minimum starting location for new WAL
-m     set next and oldest multitransaction ID
-O     set next multitransaction offset
-x     set next transaction ID
```

#### 1.  -l参数

找到pg_wal下最大的日志文件，编号加1，确定`-l`的参数为0000000400000000000000D2

```bash
postgres@ubuntu:~$ ls -rt1 $PGDATA/pg_wal/ | grep -v archive_status | tail
0000000400000000000000F0
000000040000000100000009
00000004000000010000000B
000000040000000100000007
00000004000000010000000C
00000004000000010000000D
00000004000000010000000E
0000000400000000000000CF
0000000400000000000000D0
0000000400000000000000D1
```

#### 2.-O参数

在pg_multixact/members目录下取最大值加1乘以65535后转换为16进制，然后末尾添加4个0

```bash
postgres@ubuntu:~$ ls $PGDATA/pg_multixact/members/
0000
```

得到-O的值为0x1000000000

#### 3.-m参数

在pg_multixact/offsets目录下找到最大的文件编号加1，后面跟上4个0

```bash
postgres@ubuntu:~$ ls $PGDATA/pg_multixact/offsets
0000
```

得到-m的值为0x00010000,0x00010000

#### 4.-x参数

在pg_xact下面，找到最大的文件编号加1，后面跟上5个0

```bash
postgres@ubuntu:~$ ls $PGDATA/pg_xact
0000
```

得到-x的值为0x000100000

#### 5.执行

执行重建pg_control文件语句

```bash
postgres@ubuntu:~$ touch $PGDATA/global/pg_control
postgres@ubuntu:~$ pg_resetwal -f $PGDATA -x 0x000100000 -m 0x00010000,0x00010000 -O 0x1000000000 -l 0000000400000000000000D2
Write-ahead log reset
```

