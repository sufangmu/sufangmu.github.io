#include <stdio.h>
#define OK 1
#define ERROR 0
#define TRUE 1
#define FALSE 0
typedef int ElemType;
typedef int Status;
// 结点有存放数据元素的数据域和存放后继结点地址的指针与组成
typedef struct Node
{
    ElemType data;
    struct Node *next;   
} Node;
typedef struct Node *LinkList;  // 定义LinkList


// 单链表的读取
// 获取链表中第i个元素的算法思路
// 1. 声明一个结点p指向链表第一个结点，初始化j从1开始
// 2. 当j<1时，就遍历链表，让p的指针向后移动，不断指向下一个结点，j累加1
// 3. 若到链表末尾p为空，则说明第i个元素不存在
// 4. 否则查找成功，返回结点p的数据

// 用e返回L中第i个数据元素的值
Status GetElem(LinkList L, int i, ElemType *e)
{
    int j;
    LinkList p;  // 声明一个结点p
    p = L->next;  // 让p指向链表L的第一个结点
    j = 1;  // j为计数器
    while ( p && j < 1)  // p不为空或者计数器j还没有等于i是，循环继续
    {
        p = p->next; // 让p指向下一个结点
        ++j;
    }
    if (!p || j>1)
        return ERROR;  // 第i个元素不存在
    *e = p->data;  // 取第i个元素的数据
    return OK;
    
    
}