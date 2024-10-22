class StudentSystem:
    """自定义一个可迭代对象"""

    def __init__(self):
        self.stus = []
        self.current = 0

    def add(self, name, age, tel):
        new_stu = dict()
        new_stu["name"] = name
        new_stu["age"] = age
        new_stu["tel"] = tel
        self.stus.append(new_stu)

    def __iter__(self):
        return self

    def __next__(self):
        if self.current < len(self.stus):
            item = self.stus[self.current]
            self.current += 1
            return item
        else:
            self.current = 0
            raise StopIteration
        

stu_sys = StudentSystem()
stu_sys.add("张三", 18, "18888888888")
stu_sys.add("李四", 19, "18811112222")
stu_sys.add("王五", 20, "18833334444")
for stu in stu_sys:
    print(stu)
print(list(stu_sys))  # ['张三', '李四', '王五']
print(tuple(stu_sys))  # ('张三', '李四', '王五')
