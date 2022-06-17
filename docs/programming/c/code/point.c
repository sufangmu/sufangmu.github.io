#include <stdio.h>
int main(int argc, char const *argv[])
{
    int *p;
    int i = 3;
    p = &i;
    printf("%p\n", p);  // 0x7ffff3688088
    return 0;
}