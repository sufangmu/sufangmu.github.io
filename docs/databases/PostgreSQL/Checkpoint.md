## 检查点

### 1. checkpoint进程

#### 1. checkpoint进程的作用

1. 为数据恢复做准备工作
2. 共享缓冲池上脏页的刷盘

### 2. 触发checkpoint进程执行Checkpoint的情况

1. 达到自上一个检查点到参数checkpoint_timeout配置的时间间隔，默认的时间间隔为300s（5min）。
2. 在9.4及更低版本中，自上一次检查点以来消耗的 WAL 段文件超出了参数checkpoint_segments设置的数量（默认值为3）。
3. 在9.5及更高版本中，pg_xlog（10.0版本之后是pg_wal）中的WAL段文件总大小超过参数max_wal_size设置的值（默认值为1GB,64个段文件）。
4. PostgreSQL服务器以smart或fast模式关闭。

5. 当超级用户手动执行CHECKPOINT命令时，该进程也会启动。

### 3. 数据库恢复时checkpoint流程

![Internal processing of PostgreSQL's checkpoint.](images/fig-9-13.png) 

1. 当checkpoint进程启动时，会将REDO点存储在内存中，REDO点是上次检查点开始时刻XLOG记录的写入位置，也是数据库恢复的开始位置。
2. 该检查点相应的XLOG记录（即检查点记录）会被写入WAL缓冲区，该记录的数据部分是由CheckPoint结构体定义的，包含了一些变量，如步骤（1）中REDO点的位置。另外，写入检查点记录的位置，也按照字面意义叫作检查点。
3. 共享内存中的所有数据（例如，CLOG的内容）都会被刷入持久化存储中。
4. 共享缓冲池中的所有脏页都会被逐渐刷写到存储中。
5. 更新pg_control文件，该文件包含了一些基础信息，如上一次检查点的位置。

checkpoint进程会创建包含REDO点的检查点，并将检查点位置与其他信息存储到 pg_control 文件中。因此，PostgreSQL 能够通过从REDO点回放WAL数据来进行恢复（REDO点是从检查点中获取的）.

### 4. 数据库的恢复

PostgreSQL的恢复功能基于REDO日志实现。如果数据库服务器无法工作，PostgreSQL通过从REDO点依序重放WAL段文件中的XLOG记录来恢复数据库集群。

 ![Details of the recovery process.](images/fig-9-14.png) 

1. PostgreSQL 在启动时读取 pg_control 文件的所有项。如果 state 项是 in production,PostgreSQL将进入恢复模式，因为这意味着数据库没有正常停止；而如果state项是shut down，它就会进入正常的启动模式。
2. PostgreSQL 从合适的 WAL 段文件中读取最近的检查点，该记录的位置写在pg_control 文件中，并从该检查点中获得REDO点。如果最新的检查点是无效的，PostgreSQL就会读取前一个检查点在PostgreSQL 11.0中不会存储前一个检查点）。如果两个记录都不可读，它就会放弃自我恢复。
3. 使用合适的资源管理器按顺序读取并重放XLOG记录，从重做点开始，直到最新WAL段文件的最后位置。当遇到一条属于备份区块的XLOG记录时，无论其LSN如何，都会覆写相应表的页面。在其他情况下，只有当此记录的LSN大于相应页面的pd_lsn时，才会重放该（非备份区块的）XLOG记录。