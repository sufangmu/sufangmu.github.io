## 一、`File`

`File`类的一个对象，代表一个文件或目录.

`File`类中涉及到关于文件或目录的创建、删除、重命名、修改时间、文件大小等方法，并未涉及到写入或读取文件内容的操作，如果需要读取或写入文件内容，必须使用IO流来完成。

`File`类的对象常会作为参数传递到流的构造器中。

### 1. 实例化

```java
import java.io.File;

public class FileTest {
    public static void main(String[] args) {
        // 创建File类的实例

        // 构造器1
        // 1. 相对路径
        File file1 = new File("hello.txt");
        System.out.println(file1);
        // 2. 绝对路径
        File file2 = new File("C:\\hello.txt");
        System.out.println(file2);

        // 构造器2
        File file3 = new File("C:", "project");
        System.out.println(file3);

        // 构造器3
        File file4 = new File(file3, "hello.txt");
        System.out.println(file4);
    }
}
```

### 2.常用方法

```java
import java.io.File;
import java.io.IOException;

public class FileTest {
    public static void main(String[] args) {
        File file = new File("hello.txt");

        // 获取相对路径
        System.out.println(file.getPath());  // hello.txt

        // 获取绝对路径
        System.out.println(file.getAbsolutePath());  // E:\project\IDEA-workspace\1217\hello.txt

        // 获取文件名
        System.out.println(file.getName());  // hello.txt

        // 获取上层目录路径，若无，返回null
        System.out.println(file.getParent());  // null

        // 获取文件长度（字节数）
        System.out.println(file.length());  // 12

        // 获取最后一次修改时间 毫秒
        System.out.println(file.lastModified());  // 1639750041765

        // 获取指定目录下的所有文件或文件目录的名称数组
        String[] list = new File("C:\\Windows\\System32\\drivers\\etc").list();

        // 获取指定目录下的所有文件或文件目录的File数组
        File[] listFiles = new File("C:\\Windows\\System32\\drivers\\etc").listFiles();


        // 判断是否是目录
        System.out.println(file.isDirectory());

        // 判断是否是文件
        System.out.println(file.isFile());

        // 判断文件是否存在
        System.out.println(file.exists());

        // 判断是否可读
        System.out.println(file.canRead());

        // 判断是否可写
        System.out.println(file.canWrite());

        // 判断是否隐藏
        System.out.println(file.isHidden());


        // 把文件重命名为指定的文件路径
        // 需要保证源文件存在，且目的文件不存在，才会返回true
        boolean rename = file.renameTo(new File("C:\\hello.txt"));
        System.out.println(rename);


        // 创建文件。若文件存在，则不创建，返回false
        try {
            System.out.println(file.createNewFile());
        } catch (IOException e) {
            e.printStackTrace();
        }

        // 创建目录，若目录存在，则不创建
        File dir = new File("C:\\project\\java");
        System.out.println(dir.mkdir());

        // 创建文件，如果上层目录不存在，一并创建
        System.out.println(dir.mkdirs());

        // 删除文件或文件目录，
        System.out.println(dir.delete());
    }
}
```

## 二、IO流

### 1. 分类

1. 按操作数据单位分：字节流、字符流
2. 按数据的流程：数据流、输出流
3. 按流的角色：节点流、处理流

### 2. 体系结构

Java的IO流一共涉及40多个类，他们都是从如下四个抽象基类派生的。由这四个类派生出来的子类名称都是以其父类名作为子类名后缀。

| 抽象基类 | 字节流         | 字符流   |
| -------- | -------------- | -------- |
| 输入流   | `InputStream`  | `Reader` |
| 输出流   | `OutputStream` | `Writer` |

## 三、文件流

### 1. `FileReader`

#### 1.1 每次读一个字符

```java
//抽象基类        节点流(文件流)
//InputStream     FileInputStream
//OutputStream    FileOutputStream
//Reader          FileReader
//Writer          FileWriter

import java.io.File;
import java.io.FileReader;
import java.io.IOException;

public class FileReaderTest {
    public static void main(String[] args) {
        FileReader reader = null;
        // 为了保证流资源一定可以执行关闭操作，需要使用try-catch-finally来处理异常
        try {
            // 1. 实例化File类的对象, 此文件一定要存在
            File file = new File("hello.txt");
            // 2. 提供具体的流
            reader = new FileReader(file);
            // 3. 数据的读入
            // read() 返回读入的字符，如果达到文件末尾，返回-1
            int data = reader.read();
            while (data != -1) {
                System.out.print((char) data);
                data = reader.read();
            }
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            try {
                // 3.流的关闭操作
                if (reader != null) {
                    reader.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }

    }
}
```

#### 1.2 每次读多个字符

```java
import java.io.File;
import java.io.FileReader;
import java.io.IOException;

public class FileReaderTest {
    public static void main(String[] args) {
        FileReader reader = null;
        // 为了保证流资源一定可以执行关闭操作，需要使用try-catch-finally来处理异常
        try {
            // 1. 实例化File类的对象, 此文件一定要存在
            File file = new File("hello.txt");
            // 2. 提供具体的流
            reader = new FileReader(file);
            // 3. 数据的读入

            char[] cbuf = new char[5];  // 每次读取cbuf中的字符个数，如果达到文件末尾，返回-1
            int len;
            while ((len = reader.read(cbuf)) != -1) {
                for (int i = 0; i < len; i++) {
                    System.out.print(cbuf[i]);
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            try {
                // 3.流的关闭操作
                if (reader != null) {
                    reader.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
}
```

### 2. `FileWriter`

```java
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;

public class FileWriterTest {
    public static void main(String[] args) {
        FileWriter writer = null;
        try {
            // 1. 实例化File类的对象, 此文件可以不存在
            File file = new File("hello.txt");
            // 2. 提供FileWriter对象，用于数据的写出
            //  会覆盖原有的文件
            writer = new FileWriter(file);
            //  追加文件
            // FileWriter writer = new FileWriter(file, true);

            // 3. 写出的操作
            writer.write("Hello World!");
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            try {
                if (writer != null) {
                    // 4. 流资源的关闭
                    writer.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
}
```

### 3. `FileInputStream`和`FileOutputStream`

对于文本文件使用字符流处理；对于非文本文件使用字节流处理。

```java
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;

public class FileInputOutputStream {
    public static void main(String[] args) {
        FileInputStream inputStream = null;
        FileOutputStream outputStream = null;
        try {
            File srcFile = new File("image.jpg");
            File destFile = new File("image.bak.jpg");

            inputStream = new FileInputStream(srcFile);
            outputStream = new FileOutputStream(destFile);

            byte[] buffer = new byte[5];
            int len;
            while ((len = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, len);

            }
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            if (inputStream != null) {
                try {
                    inputStream.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
            if (outputStream != null) {
                try {
                    outputStream.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    }
}
```

## 四、缓存流

内部提供了一个缓存区，提高流的读取和写入的速度。

### 1. `BufferedInputStream`和`BufferedOutputStream`

```java
import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;

public class BufferedInputOutputStreamTest {
    public static void main(String[] args) {
        BufferedInputStream bufferedInputStream = null;
        BufferedOutputStream bufferedOutputStream = null;
        try {
            File secFile = new File("image.jpg");
            File destFile = new File("image.bak.jpg");
            // 节点流
            FileInputStream inputStream = new FileInputStream(secFile);
            FileOutputStream outputStream = new FileOutputStream(destFile);
            // 缓冲流
            bufferedInputStream = new BufferedInputStream(inputStream);
            bufferedOutputStream = new BufferedOutputStream(outputStream);

            byte[] buffer = new byte[1024];
            int len;
            while ((len = bufferedInputStream.read(buffer)) != -1) {
                bufferedOutputStream.write(buffer, 0, len);
            }
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            // 资源关闭
            // 先关闭外层的流，再关闭内层的流
            // 在关闭外层流食，内层流也会自动关闭
            if (bufferedInputStream != null){
                try {
                    bufferedInputStream.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
            if (bufferedOutputStream != null) {
                try {
                    bufferedOutputStream.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    }
}
```

### 2. `BufferedReader`和`BufferedWriter`

```java
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;

public class BufferedReaderWriterTest {
    public static void main(String[] args) {
        BufferedReader bufferedReader = null;
        BufferedWriter bufferedWriter = null;
        try {
            bufferedReader = new BufferedReader(new FileReader(new File("hello.txt")));
            bufferedWriter = new BufferedWriter(new FileWriter(new File("hello.bak.txt")));
            // 方式1
            /*
            char[] buffer = new char[1024];
            int len;
            while ((len = bufferedReader.read()) != -1) {
                bufferedWriter.write(buffer, 0, len);
            }
            */
            
            // 方式2
            String data;
            while ((data = bufferedReader.readLine()) != null){
                bufferedWriter.write(data); // data中不包含换行符
                bufferedWriter.newLine();
            }
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            if (bufferedReader != null) {
                try {
                    bufferedReader.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
            if (bufferedWriter != null) {
                try {
                    bufferedWriter.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }


    }
}
```

## 五、转换流

提供了字节流和字符流之间的转换，属于字符流

1. `InputStreamReader`：将一个字节的输入流转换为字符的输入流
2. `OutputStreamWriter`：将一个字符的输处流转换为字节的输出流

```java
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;

public class InputStreamReaderOutputStreamWriterTest {
    public static void main(String[] args) {
        InputStreamReader inputStreamReader = null;
        OutputStreamWriter outputStreamWriter = null;
        try {
            File file1 = new File("hello.txt");
            File file2 = new File("hello.bak.txt");

            FileInputStream fileInputStream = new FileInputStream(file1);
            FileOutputStream fileOutputStream = new FileOutputStream(file2);

            inputStreamReader = new InputStreamReader(fileInputStream, "UTF-8");
            outputStreamWriter = new OutputStreamWriter(fileOutputStream, "GBK");

            char[] buffer = new char[1024];
            int len;
            while ((len = inputStreamReader.read(buffer)) != -1) {
                outputStreamWriter.write(buffer, 0, len);
            }
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            if (inputStreamReader != null) {
                try {
                    inputStreamReader.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
            if (outputStreamWriter != null) {
                try {
                    outputStreamWriter.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }

    }
}
```

## 六、对象流

### 1. `ObjectInputStream`和`ObjectOutputStream`

用于读取和存储基本数据类型数据或对象的处理流。

```java
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;

public class ObjectInputOutputStreamTest {
    public static void main(String[] args) {
        // 序列化
        ObjectOutputStream objectOutputStream = null;
        try {
            objectOutputStream = new ObjectOutputStream(new FileOutputStream("hello.txt"));
            objectOutputStream.writeObject(new String("Hello, 北京"));
            objectOutputStream.flush();
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            if (objectOutputStream != null) {
                try {
                    objectOutputStream.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
        // 反序列化
        ObjectInputStream objectInputStream = null;
        try {
            objectInputStream = new ObjectInputStream(new FileInputStream("hello.txt"));
            Object object = objectInputStream.readObject();
            String str = (String) object;
            System.out.println(str);
        } catch (IOException e) {
            e.printStackTrace();
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        } finally {
            if (objectInputStream != null) {
                try {
                    objectInputStream.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    }
}
```

### 2. 自定义类的序列化和反序列化

```java
import java.io.*;

public class ObjectInputOutputStreamTest {
    public static void main(String[] args) {
        // 序列化
        ObjectOutputStream objectOutputStream = null;
        try {
            objectOutputStream = new ObjectOutputStream(new FileOutputStream("hello.txt"));
            objectOutputStream.writeObject(new Person("Tom", 18));
            objectOutputStream.flush();
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            if (objectOutputStream != null) {
                try {
                    objectOutputStream.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
        // 反序列化
        ObjectInputStream objectInputStream = null;
        try {
            objectInputStream = new ObjectInputStream(new FileInputStream("hello.txt"));
            Object object = objectInputStream.readObject();
            System.out.println(object);
        } catch (IOException e) {
            e.printStackTrace();
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        } finally {
            if (objectInputStream != null) {
                try {
                    objectInputStream.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    }
}

// 自定义类需要满足如下的要求方可序列化
// 1. 实现Serializable接口
// 2. 当前类提供一个全局常量 serialVersionUID
// 3. 除了当前类需要实现Serializable接口以外，还必须保证其内部所有属性也必须是可序列化的
// 4. 不能序列化static和transient修饰的成员变量
class Person implements Serializable {
    public static final long serialVersionUID = 3141592657L;
    String name;
    int age;

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

    @Override
    public String toString() {
        return "Person{" +
                "name='" + name + '\'' +
                ", age=" + age +
                '}';
    }
}
```

