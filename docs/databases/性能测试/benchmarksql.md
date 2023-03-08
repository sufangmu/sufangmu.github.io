环境准备

```bash
root@ubuntu:~# python --version
Python 2.7.17
root@ubuntu:~# ant -version
Apache Ant(TM) version 1.9.16 compiled on July 10 2021
root@ubuntu:~# java -version
java version "1.8.0_301"
Java(TM) SE Runtime Environment (build 1.8.0_301-b09)
Java HotSpot(TM) 64-Bit Server VM (build 25.301-b09, mixed mode)
root@ubuntu:~# R --version
R version 3.4.4 (2018-03-15) -- "Someone to Lean On"
```

安装benchmarksql

```bash
wget https://nchc.dl.sourceforge.net/project/benchmarksql/benchmarksql-5.0.zip
unzip benchmarksql-5.0.zip 
cd benchmarksql-5.0/
ant
```

创建tpcc用户及数据库

```sql
create user tpcc with password 'tpcc@123'create database benchmark owner=tpcc
create database benchmark owner=tpcc
```

配置benchmarksql

```bash
db=postgres
driver=org.postgresql.Driver
conn=jdbc:postgresql://localhost:5432/benchmark
user=tpcc
password=tpcc@123

warehouses=10
loadWorkers=4

terminals=1
//To run specified transactions per terminal- runMins must equal zero
runTxnsPerTerminal=0
//To run for specified minutes- runTxnsPerTerminal must equal zero
runMins=5
//Number of total transactions per minute
limitTxnsPerMin=300

//Set to true to run in 4.x compatible mode. Set to false to use the
//entire configured database evenly.
terminalWarehouseFixed=true

//The following five values must add up to 100
//The default percentages of 45, 43, 4, 4 & 4 match the TPC-C spec
newOrderWeight=45
paymentWeight=43
orderStatusWeight=4
deliveryWeight=4
stockLevelWeight=4

// Directory name to create for collecting detailed result data.
// Comment this out to suppress.
resultDirectory=my_result_%tY-%tm-%td_%tH%tM%tS
osCollectorScript=./misc/os_collector_linux.py
osCollectorInterval=1
//osCollectorSSHAddr=user@dbhost
osCollectorDevices=net_ens33 blk_sda
```

建表并插入数据

```bash
postgres@ubuntu:~/benchmarksql-5.0/run$ bash runDatabaseBuild.sh props.pg 
# ------------------------------------------------------------
# Loading SQL file ./sql.common/tableCreates.sql
# ------------------------------------------------------------
create table bmsql_config (
cfg_name    varchar(30) primary key,
cfg_value   varchar(50)
);
create table bmsql_warehouse (
w_id        integer   not null,
w_ytd       decimal(12,2),
w_tax       decimal(4,4),
w_name      varchar(10),
w_street_1  varchar(20),
w_street_2  varchar(20),
w_city      varchar(20),
w_state     char(2),
w_zip       char(9)
);
create table bmsql_district (
d_w_id       integer       not null,
d_id         integer       not null,
d_ytd        decimal(12,2),
d_tax        decimal(4,4),
d_next_o_id  integer,
d_name       varchar(10),
d_street_1   varchar(20),
d_street_2   varchar(20),
d_city       varchar(20),
d_state      char(2),
d_zip        char(9)
);
create table bmsql_customer (
c_w_id         integer        not null,
c_d_id         integer        not null,
c_id           integer        not null,
c_discount     decimal(4,4),
c_credit       char(2),
c_last         varchar(16),
c_first        varchar(16),
c_credit_lim   decimal(12,2),
c_balance      decimal(12,2),
c_ytd_payment  decimal(12,2),
c_payment_cnt  integer,
c_delivery_cnt integer,
c_street_1     varchar(20),
c_street_2     varchar(20),
c_city         varchar(20),
c_state        char(2),
c_zip          char(9),
c_phone        char(16),
c_since        timestamp,
c_middle       char(2),
c_data         varchar(500)
);
create sequence bmsql_hist_id_seq;
create table bmsql_history (
hist_id  integer,
h_c_id   integer,
h_c_d_id integer,
h_c_w_id integer,
h_d_id   integer,
h_w_id   integer,
h_date   timestamp,
h_amount decimal(6,2),
h_data   varchar(24)
);
create table bmsql_new_order (
no_w_id  integer   not null,
no_d_id  integer   not null,
no_o_id  integer   not null
);
create table bmsql_oorder (
o_w_id       integer      not null,
o_d_id       integer      not null,
o_id         integer      not null,
o_c_id       integer,
o_carrier_id integer,
o_ol_cnt     integer,
o_all_local  integer,
o_entry_d    timestamp
);
create table bmsql_order_line (
ol_w_id         integer   not null,
ol_d_id         integer   not null,
ol_o_id         integer   not null,
ol_number       integer   not null,
ol_i_id         integer   not null,
ol_delivery_d   timestamp,
ol_amount       decimal(6,2),
ol_supply_w_id  integer,
ol_quantity     integer,
ol_dist_info    char(24)
);
create table bmsql_item (
i_id     integer      not null,
i_name   varchar(24),
i_price  decimal(5,2),
i_data   varchar(50),
i_im_id  integer
);
create table bmsql_stock (
s_w_id       integer       not null,
s_i_id       integer       not null,
s_quantity   integer,
s_ytd        integer,
s_order_cnt  integer,
s_remote_cnt integer,
s_data       varchar(50),
s_dist_01    char(24),
s_dist_02    char(24),
s_dist_03    char(24),
s_dist_04    char(24),
s_dist_05    char(24),
s_dist_06    char(24),
s_dist_07    char(24),
s_dist_08    char(24),
s_dist_09    char(24),
s_dist_10    char(24)
);
Starting BenchmarkSQL LoadData

driver=org.postgresql.Driver
conn=jdbc:postgresql://localhost:5432/benchmark
user=tpcc
password=***********
warehouses=10
loadWorkers=4
fileLocation (not defined)
csvNullValue (not defined - using default 'NULL')

Worker 000: Loading ITEM
Worker 001: Loading Warehouse      1
Worker 002: Loading Warehouse      2
Worker 003: Loading Warehouse      3
Worker 000: Loading ITEM done
Worker 000: Loading Warehouse      4
Worker 002: Loading Warehouse      2 done
Worker 002: Loading Warehouse      5
Worker 001: Loading Warehouse      1 done
Worker 001: Loading Warehouse      6
Worker 003: Loading Warehouse      3 done
Worker 003: Loading Warehouse      7
Worker 000: Loading Warehouse      4 done
Worker 000: Loading Warehouse      8
Worker 001: Loading Warehouse      6 done
Worker 001: Loading Warehouse      9
Worker 002: Loading Warehouse      5 done
Worker 002: Loading Warehouse     10
Worker 003: Loading Warehouse      7 done
Worker 000: Loading Warehouse      8 done
Worker 001: Loading Warehouse      9 done
Worker 002: Loading Warehouse     10 done
# ------------------------------------------------------------
# Loading SQL file ./sql.common/indexCreates.sql
# ------------------------------------------------------------
alter table bmsql_warehouse add constraint bmsql_warehouse_pkey
primary key (w_id);
alter table bmsql_district add constraint bmsql_district_pkey
primary key (d_w_id, d_id);
alter table bmsql_customer add constraint bmsql_customer_pkey
primary key (c_w_id, c_d_id, c_id);
create index bmsql_customer_idx1
on  bmsql_customer (c_w_id, c_d_id, c_last, c_first);
alter table bmsql_oorder add constraint bmsql_oorder_pkey
primary key (o_w_id, o_d_id, o_id);
create unique index bmsql_oorder_idx1
on  bmsql_oorder (o_w_id, o_d_id, o_carrier_id, o_id);
alter table bmsql_new_order add constraint bmsql_new_order_pkey
primary key (no_w_id, no_d_id, no_o_id);
alter table bmsql_order_line add constraint bmsql_order_line_pkey
primary key (ol_w_id, ol_d_id, ol_o_id, ol_number);
alter table bmsql_stock add constraint bmsql_stock_pkey
primary key (s_w_id, s_i_id);
alter table bmsql_item add constraint bmsql_item_pkey
primary key (i_id);
# ------------------------------------------------------------
# Loading SQL file ./sql.common/foreignKeys.sql
# ------------------------------------------------------------
alter table bmsql_district add constraint d_warehouse_fkey
foreign key (d_w_id)
references bmsql_warehouse (w_id);
alter table bmsql_customer add constraint c_district_fkey
foreign key (c_w_id, c_d_id)
references bmsql_district (d_w_id, d_id);
alter table bmsql_history add constraint h_customer_fkey
foreign key (h_c_w_id, h_c_d_id, h_c_id)
references bmsql_customer (c_w_id, c_d_id, c_id);
alter table bmsql_history add constraint h_district_fkey
foreign key (h_w_id, h_d_id)
references bmsql_district (d_w_id, d_id);
alter table bmsql_new_order add constraint no_order_fkey
foreign key (no_w_id, no_d_id, no_o_id)
references bmsql_oorder (o_w_id, o_d_id, o_id);
alter table bmsql_oorder add constraint o_customer_fkey
foreign key (o_w_id, o_d_id, o_c_id)
references bmsql_customer (c_w_id, c_d_id, c_id);
alter table bmsql_order_line add constraint ol_order_fkey
foreign key (ol_w_id, ol_d_id, ol_o_id)
references bmsql_oorder (o_w_id, o_d_id, o_id);
alter table bmsql_order_line add constraint ol_stock_fkey
foreign key (ol_supply_w_id, ol_i_id)
references bmsql_stock (s_w_id, s_i_id);
alter table bmsql_stock add constraint s_warehouse_fkey
foreign key (s_w_id)
references bmsql_warehouse (w_id);
alter table bmsql_stock add constraint s_item_fkey
foreign key (s_i_id)
references bmsql_item (i_id);
# ------------------------------------------------------------
# Loading SQL file ./sql.postgres/extraHistID.sql
# ------------------------------------------------------------
-- ----
-- Extra Schema objects/definitions for history.hist_id in PostgreSQL
-- ----
-- ----
--      This is an extra column not present in the TPC-C
--      specs. It is useful for replication systems like
--      Bucardo and Slony-I, which like to have a primary
--      key on a table. It is an auto-increment or serial
--      column type. The definition below is compatible
--      with Oracle 11g, using a sequence and a trigger.
-- ----
-- Adjust the sequence above the current max(hist_id)
select setval('bmsql_hist_id_seq', (select max(hist_id) from bmsql_history));
-- Make nextval(seq) the default value of the hist_id column.
alter table bmsql_history
alter column hist_id set default nextval('bmsql_hist_id_seq');
-- Add a primary key history(hist_id)
alter table bmsql_history add primary key (hist_id);
# ------------------------------------------------------------
# Loading SQL file ./sql.postgres/buildFinish.sql
# ------------------------------------------------------------
-- ----
-- Extra commands to run after the tables are created, loaded,
-- indexes built and extra's created.
-- PostgreSQL version.
-- ----
vacuum analyze;
```

运行tpcc

```bash
postgres@ubuntu:~/benchmarksql-5.0/run$ bash runBenchmark.sh props.pg
14:40:50,112 [main] INFO   jTPCC : Term-00, 
14:40:50,114 [main] INFO   jTPCC : Term-00, +-------------------------------------------------------------+
14:40:50,115 [main] INFO   jTPCC : Term-00,      BenchmarkSQL v5.0
14:40:50,115 [main] INFO   jTPCC : Term-00, +-------------------------------------------------------------+
14:40:50,115 [main] INFO   jTPCC : Term-00,  (c) 2003, Raul Barbosa
14:40:50,116 [main] INFO   jTPCC : Term-00,  (c) 2004-2016, Denis Lussier
14:40:50,120 [main] INFO   jTPCC : Term-00,  (c) 2016, Jan Wieck
14:40:50,120 [main] INFO   jTPCC : Term-00, +-------------------------------------------------------------+
14:40:50,121 [main] INFO   jTPCC : Term-00, 
14:40:50,122 [main] INFO   jTPCC : Term-00, db=postgres
14:40:50,126 [main] INFO   jTPCC : Term-00, driver=org.postgresql.Driver
14:40:50,127 [main] INFO   jTPCC : Term-00, conn=jdbc:postgresql://localhost:5432/benchmark
14:40:50,128 [main] INFO   jTPCC : Term-00, user=tpcc
14:40:50,128 [main] INFO   jTPCC : Term-00, 
14:40:50,134 [main] INFO   jTPCC : Term-00, warehouses=10
14:40:50,136 [main] INFO   jTPCC : Term-00, terminals=1
14:40:50,140 [main] INFO   jTPCC : Term-00, runMins=5
14:40:50,140 [main] INFO   jTPCC : Term-00, limitTxnsPerMin=300
14:40:50,143 [main] INFO   jTPCC : Term-00, terminalWarehouseFixed=true
14:40:50,145 [main] INFO   jTPCC : Term-00, 
14:40:50,147 [main] INFO   jTPCC : Term-00, newOrderWeight=45
14:40:50,150 [main] INFO   jTPCC : Term-00, paymentWeight=43
14:40:50,151 [main] INFO   jTPCC : Term-00, orderStatusWeight=4
14:40:50,152 [main] INFO   jTPCC : Term-00, deliveryWeight=4
14:40:50,152 [main] INFO   jTPCC : Term-00, stockLevelWeight=4
14:40:50,153 [main] INFO   jTPCC : Term-00, 
14:40:50,153 [main] INFO   jTPCC : Term-00, resultDirectory=my_result_%tY-%tm-%td_%tH%tM%tS
14:40:50,154 [main] INFO   jTPCC : Term-00, osCollectorScript=./misc/os_collector_linux.py
14:40:50,156 [main] INFO   jTPCC : Term-00, 
14:40:50,183 [main] INFO   jTPCC : Term-00, copied props.pg to my_result_2023-03-01_144050/run.properties
14:40:50,184 [main] INFO   jTPCC : Term-00, created my_result_2023-03-01_144050/data/runInfo.csv for runID 3
14:40:50,187 [main] INFO   jTPCC : Term-00, writing per transaction results to my_result_2023-03-01_144050/data/result.csv
14:40:50,194 [main] INFO   jTPCC : Term-00, osCollectorScript=./misc/os_collector_linux.py
14:40:50,195 [main] INFO   jTPCC : Term-00, osCollectorInterval=1
14:40:50,196 [main] INFO   jTPCC : Term-00, osCollectorSSHAddr=null
14:40:50,197 [main] INFO   jTPCC : Term-00, osCollectorDevices=net_ens33 blk_sda
14:40:50,323 [main] INFO   jTPCC : Term-00,
14:40:50,430 [main] INFO   jTPCC : Term-00, C value for C_LAST during load: 199
14:40:50,430 Term-00, Running Average tpmTOTAL: 295.26    Current tpmTOTAL: 9780    Memory Usage: 6MB / 30MB                                                 14:45:50,798 [Thread-1] INFO   jTPCC : Term-00,                                                                                                              14:45:50,799 [Thread-1] INFO   jTPCC : Term-00,                                                        
14:45:50,800 [Thread-1] INFO   jTPCC : Term-00, Measured tpmC (NewOrders) = 132.85
14:45:50,804 [Thread-1] INFO   jTPCC : Term-00, Measured tpmTOTAL = 295.07
14:45:50,811 [Thread-1] INFO   jTPCC : Term-00, Session Start     = 2023-03-01 14:40:50
14:45:50,812 [Thread-1] INFO   jTPCC : Term-00, Session End       = 2023-03-01 14:45:50
14:45:50,813 [Thread-1] INFO   jTPCC : Term-00, Transaction Count = 147
```

生成报告

```bash
postgres@ubuntu:~/benchmarksql-5.0/run$ bash ./generateReport.sh my_result_2023-03-01_144050
Generating my_result_2023-03-01_144050/tpm_nopm.png ... OK
Generating my_result_2023-03-01_144050/latency.png ... OK
Generating my_result_2023-03-01_144050/cpu_utilization.png ... OK
Generating my_result_2023-03-01_144050/dirty_buffers.png ... OK
Generating my_result_2023-03-01_144050/blk_sda_iops.png ... OK
Generating my_result_2023-03-01_144050/blk_sda_kbps.png ... OK
Generating my_result_2023-03-01_144050/net_ens33_iops.png ... OK
Generating my_result_2023-03-01_144050/net_ens33_kbps.png ... OK
Generating my_result_2023-03-01_144050/report.html ... OK
```

查看html报告

![1677684166119](../images/1677684166119.png)

