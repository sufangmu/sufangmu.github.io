# sysbench
## 一、安装

```bash
yum -y install make automake libtool pkgconfig libaio-devel git
git clone https://github.com/akopytov/sysbench.git
cd sysbench
./autogen.sh
./configure  --with-pgsql --without-mysql --prefix=/home/postgres/tools/sysbench
make -j
make install
```

```bash
[postgres@host136 sysbench]$ tree -L 3
.
├── bin
│   └── sysbench
└── share
    └── sysbench
        ├── bulk_insert.lua
        ├── oltp_common.lua
        ├── oltp_delete.lua
        ├── oltp_insert.lua
        ├── oltp_point_select.lua
        ├── oltp_read_only.lua
        ├── oltp_read_write.lua
        ├── oltp_update_index.lua
        ├── oltp_update_non_index.lua
        ├── oltp_write_only.lua
        ├── select_random_points.lua
        ├── select_random_ranges.lua
        └── tests

4 directories, 13 files
```


## 创建用户
```sql
postgres=# create database sysbenchdb;
CREATE DATABASE
postgres=# CREATE USER sysbench_user SUPERUSER PASSWORD '123456'; 
CREATE ROLE
```

## prepare

```bash
[postgres@host136 sysbench]$ ./bin/sysbench ./share/sysbench/oltp_read_write.lua --db-driver=pgsql --pgsql-host=127.0.0.1 --pgsql-port=5432 --pgsql-user=sysbench_user --pgsql-password='123456' --pgsql-db=sysbenchdb --tables=10 --table-size=1000000 --threads=10 --time=300  --report-interval=10 prepare
sysbench 1.1.0-de18a03 (using bundled LuaJIT 2.1.0-beta3)

Initializing worker threads...

Creating table 'sbtest1'...
Creating table 'sbtest2'...
Creating table 'sbtest3'...
Creating table 'sbtest6'...
Creating table 'sbtest8'...
Inserting 1000000 records into 'sbtest3'
Inserting 1000000 records into 'sbtest2'
Creating table 'sbtest9'...
Creating table 'sbtest5'...
Inserting 1000000 records into 'sbtest1'
Creating table 'sbtest10'...
Creating table 'sbtest7'...Creating table 'sbtest4'...

Inserting 1000000 records into 'sbtest6'
Inserting 1000000 records into 'sbtest8'
Inserting 1000000 records into 'sbtest5'
Inserting 1000000 records into 'sbtest9'
Inserting 1000000 records into 'sbtest7'
Inserting 1000000 records into 'sbtest4'
Inserting 1000000 records into 'sbtest10'
Creating a secondary index on 'sbtest9'...
Creating a secondary index on 'sbtest7'...
Creating a secondary index on 'sbtest1'...
Creating a secondary index on 'sbtest3'...
Creating a secondary index on 'sbtest4'...
Creating a secondary index on 'sbtest5'...
Creating a secondary index on 'sbtest6'...
Creating a secondary index on 'sbtest10'...
Creating a secondary index on 'sbtest8'...
Creating a secondary index on 'sbtest2'...

```

## run

```bash
[postgres@host136 sysbench]$ ./bin/sysbench ./share/sysbench/oltp_read_write.lua --db-driver=pgsql --pgsql-host=127.0.0.1 --pgsql-port=5432 --pgsql-user=sysbench_user --pgsql-password='123456' --pgsql-db=sysbenchdb --tables=10 --table-size=1000000 --threads=10 --time=60  --report-interval=10 run
sysbench 1.1.0-de18a03 (using bundled LuaJIT 2.1.0-beta3)

Running the test with following options:
Number of threads: 10
Report intermediate results every 10 second(s)
Initializing random number generator from current time


Initializing worker threads...

Threads started!

[ 10s ] thds: 10 tps: 214.05 qps: 4292.16 (r/w/o: 3006.47/856.59/429.10) lat (ms,95%): 77.19 err/s: 0.00 reconn/s: 0.00
[ 20s ] thds: 10 tps: 205.24 qps: 4103.69 (r/w/o: 2872.65/820.56/410.48) lat (ms,95%): 81.48 err/s: 0.00 reconn/s: 0.00
[ 30s ] thds: 10 tps: 196.67 qps: 3932.76 (r/w/o: 2751.92/787.49/393.35) lat (ms,95%): 86.00 err/s: 0.00 reconn/s: 0.00
[ 40s ] thds: 10 tps: 173.60 qps: 3474.43 (r/w/o: 2432.85/694.39/347.19) lat (ms,95%): 102.97 err/s: 0.00 reconn/s: 0.00
[ 50s ] thds: 10 tps: 197.83 qps: 3956.17 (r/w/o: 2769.40/791.11/395.66) lat (ms,95%): 89.16 err/s: 0.00 reconn/s: 0.00
[ 60s ] thds: 10 tps: 195.72 qps: 3917.27 (r/w/o: 2741.93/783.89/391.45) lat (ms,95%): 86.00 err/s: 0.00 reconn/s: 0.00
SQL statistics:
    queries performed:
        read:                            165802
        write:                           47372
        other:                           23686
        total:                           236860
    transactions:                        11843  (196.93 per sec.)
    queries:                             236860 (3938.53 per sec.)
    ignored errors:                      0      (0.00 per sec.)
    reconnects:                          0      (0.00 per sec.)

Throughput:
    events/s (eps):                      196.9265
    time elapsed:                        60.1392s
    total number of events:              11843

Latency (ms):
         min:                                    6.97
         avg:                                   50.72
         max:                                  406.61
         95th percentile:                       87.56
         sum:                               600676.82

Threads fairness:
    events (avg/stddev):           1184.3000/16.27
    execution time (avg/stddev):   60.0677/0.05


```