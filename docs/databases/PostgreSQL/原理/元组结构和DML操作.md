## 一、元组结构

![Tuple structure.](images/fig-5-02.png)

元组结构：HeapTupleHeaderData结构、空值位图及用户数据

HeapTupleHeaderData结构：
- t_xmin保存插入此元组的事务的txid。
- t_xmax保存删除或更新此元组的事务的txid。如果尚未删除或更新此元组，则t_xmax设置为0，即无效。
- t_cid保存命令标识（command id,cid）,cid的意思是在当前事务中，执行当前命令之前执行了多少SQL命令，从零开始计数。例如，假设我们在单个事务中执行了3条INSERT命令BEGIN;INSERT;INSERT;INSERT;COMMIT;。如果第一条命令插入此元组，则该元组的t_cid会被设置为0。如果第二条命令插入此元组，则其t_cid会被设置为1，以此类推。
- t_ctid保存着指向自身或新元组的元组标识符（tid）。tid用于标识表中的元组。在更新该元组时，t_ctid会指向新版本的元组，否则t_ctid会指向自己。
