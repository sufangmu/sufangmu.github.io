## 一、`==`运算符

### 1. `==`的使用

#### 1. 使用在基本数据类型变量和引用数据类型变量中

如果比较的是基本数据类型变量，比较两个变量保存的数据是否相等（类型不一定要相同）

```java
public class HelloWorld {
    public static void main(String[] args) {
        int i = 10;
        int j = 10;
        double k = 10.0;

        System.out.println(i == j); // true
        System.out.println(i == k); // true  自动类型提升
    }
}
```

如果比较的是引用数据类型，比较两个对象的地址值是否相同，即两个引用是否指向同一个对象实体。

```java
public class HelloWorld {
    public static void main(String[] args) {
        Person p1 = new Person("Tom", 8);
        Person p2 = new Person("Tom", 8);
        System.out.println(p1 == p2);  // false
    }
}

class Person {
    private String name;
    private int age;

    public Person() {
    }

    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }
}
```

## 二、`equals()`方法

只适用于引用数据类型。

### 1.`Object`类中`equals()`的定义

```java
    public boolean equals(Object obj) {
        return (this == obj);
    }
// `Object`类中`equals()` 和 == 的作用是相同的：比较两个对象的地址值是否相同
```

String、Date、File、包装类等都重写了`Object`类中的`equals()`方法，重写以后比较的是两个对象的”实体内容”是否相同。

```java
public class HelloWorld {
    public static void main(String[] args) {
        Person p1 = new Person("Tom", 8);
        Person p2 = new Person("Tom", 8);
        System.out.println(p1.equals(p2));  // false

        String str1 = new String("Hello");
        String str2 = new String("Hello");
        System.out.println(str1.equals(str2)); // true
    }
}

class Person {
    private String name;
    private int age;

    public Person() {
    }

    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }
}
```

### 2. 重写`equals()`

重写原则：比较两个对象的“实体内容”是否相同。

```java
import java.util.Objects;

public class HelloWorld {
    public static void main(String[] args) {
        Person p1 = new Person("Tom", 8);
        Person p2 = new Person("Tom", 8);
        System.out.println(p1.equals(p2));  // true
    }
}

class Person {
    private String name;
    private int age;

    public Person() {
    }

    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }


    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }
        if (obj instanceof Person) {
            Person p = (Person) obj;
            // 比较两个对象的每个属性是否相同
            return this.age == p.age && this.name.equals(p.name);
        }
        return false;
    }
}
```

在实际的开发中借助IDE自动生成