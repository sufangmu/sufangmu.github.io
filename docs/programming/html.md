# 一、HTML

## 一、基本概念

1. HTML：超文本标记语言（HyperText Markup Language）是一种用于创建网页的标准标记语言。
2. HTML文档的后缀名：.html 或 .htm
3. 标签：由尖括号包围的关键词，比如 `<html>`
4. 元素：从开始标签（start tag）到结束标签（end tag）的所有代码。比如：`<p>hello world</p>`
5. 空元素：在开始标签中进行关闭。例如：换行 `<br/>`
6. 基本格式：

```html
<!DOCTYPE html> <!--声明HTML5文档-->
<html>  <!--根元素-->
    <head>
            <!-- 元数据 -->
    </head>
    <body>
            <!-- 页面内容 -->
    </body>
</html>
```

7.注释格式：

```html
<!-- 注释内容 -->
```

## 二、HTML属性

属性可以在元素中添加附加信息，一般位于开始标签，以键值对的形式存在。

例如：`<a href="http://www.baidu.com">百度一下</a>`

常用属性：

1. class  为html元素定义一个或多个类名（classname）(类名从样式文件引入)
2. id     定义元素的唯一id
3. style 规定元素的行内样式（inline style）
4. title 描述了元素的额外信息 (作为工具条使用)

## 三、`<head>`标签

### 1.`<title>`

```html
<title>我是标题</title>
```

`<title>`标签的作用：

1.显示在浏览器工具栏上
2.网页被收藏时默认的名字

### 2.`<base>` 指定了HTML文档中所有的链接标签的默认链接:

### 3.`<link>` 链接到样式表

例：从外部文件引入css样式

```html
<link rel="stylesheet" type="text/css" href="css.css">
```

### 4.`<style>` 添加css样式

5.`<meta>` 元数据

5.1 为搜索引擎添加关键词，通过浏览器搜索这些关键词就能找到这个HTML文档

例：

```html
<meta name="keywords" content="HTML, CSS, XML, XHTML, JavaScript">
```

5.2 描述网页的内容

例：

```html
<meta name="keywords" content="HTML, CSS, XML, XHTML, JavaScript">
```

5.3 定义网页的作者

例：

```html
<meta name="author" content="Name">
```

5.4 编码格式

例：

```html
<meta charset="utf-8">
```

6.`<script>` 定义JavaScript脚本

## 四、`<body>`标签

1.`<h>` 标签：标题

6个级别：`<h1> - <h6>`

```html
<!DOCTYPE html>
<html>
<head>
    <title>    </title>
</head>
<body>
    <h1>标题1</h1>
    <h2>标题2</h2>
    <h3>标题3</h3>
    <h4>标题4</h4>
    <h5>标题5</h5>
    <h6>标题6</h6>
</body>
</html>
```

2.`<hr>` 标签:水平线

3.`<br>` 标签:换行

4.`<p>` 标签：段落

5.文本格式化

```html
<b>加粗文本</b><br>
<strong>加粗文本</strong><br>
<big>文本放大</big><br>
<small>文本缩小</small><br>
<i>斜体文本</i><br>
<em>斜体文本</em><br>
<sub>下</sub>标<br>
标<sup>上</sup><br>
<pre>空   格</pre>
<del>删除效果</del>

<!-- 计算机/编程代码样式 -->
<code>计算机输出</code><br>
<kbd>键盘输入</kbd><br>
<tt>打字机文本</tt><br>
<samp>计算机代码样本</samp><br>
<var>计算机变量</var><br>

<address>
    地址：石家庄 河北 中国
</address>
<p><bdo dir="rtl">倒叙显示</bdo></p>
```

6.`<a>` 标签：链接

```html
<a href="http://www.baidu.com">百度一下</a>
```

属性：在新窗口打开

```html
<a href="http://www.baidu.com/" target="_blank">百度一下</a>
```

`<a>`标签的作用：

1. 链接：<a href="http://www.baidu.com">百度一下</a>
2. 锚：<a href="#tips">转到id为tips的部分</a>

7.`<img>` 标签：图像

```html
<img src="mayun.jpg" title="马云" alt="Ma Yun" height="140" width="121" >
```

title属性：当鼠标放在图片上的时候显示的内容
alt 属性：当图片加载失败的时候显示的属性
height width属性：设置图片的高和宽

8.`<table>` 标签：表格

```html
    <table border="1">
        <caption>表格标题</caption>
        <tr>
            <th>姓名</th>
            <th>性别</th>
        </tr>
        <tr>
            <td>曹操</td>
            <td>男</td>
        </tr>
        <tr>
            <td>貂蝉</td>
            <td>女</td>
        </tr>
    </table>
```

常用标签:

1. `<table>` 定义表格
2. `<caption>` 定义表格标题
3. `<th>` 定义表头(文本加粗)
4. `<tr>` 定义行
5. `<td>` 定义内容

常用属性：

1. border="1" 定义表格边框
2. colspan="2" 跨2行
3. rowspan="2" 跨2列

## 9 `<ul>` `<ol>` 标签：列表

9.1 `<ul>` 无序列表：用点标记顺序

```html
       <ul>
       　　 <li>咖啡</li>
       　　 <li>牛奶</li>
    　　</ul>
```

9.2 `<ol>` 有序列表：用阿拉伯数字标记顺序

```html
    <ol>
        <li>绿茶</li>
        <li>红茶</li>
    </ol>
```

`<ol>` 属性：type="A"|"a"|"I"|"i"

9.3 `<dl>` 自定义列表

```html
    <dl>
        <dt>一级内容</dt>
        <dd>二级内容</dd>
    </dl>
```

10.`<div>` 标签

`<div>` 元素没有特定的含义，常用于文档布局。

11.`<span>` 标签
没有特定的含义，用于为部分文本设置样式属性

12.`<form>` 标签:表单

12.1 `<input>`

```html
　　　　<form>
　　　　　<!-- 文本 -->   <!-- value 属性值为文本框中的默认值 -->  
        username:<input type="text" name="username" value="请输入用户名"><br>
        <!-- 密码 -->
        password:<input type="password" name="password"><br>
        <!-- 单选 -->
        <input type="radio" name="sex" value="male">男<br>
        <input type="radio" name="sex" value="femail">女<br>
        <!-- 复选 -->
        <input type="checkbox" name="language" value="Bike">Java<br>
        <input type="checkbox" name="language" value="Car">Python<br>
        <input type="checkbox" name="language" value="Car">JavaScript<br>
        <!-- 提交 -->
        <input type="submit" value="提交">
        <!-- 重置 -->
        <input type="reset" value="重置">
    </form>
```

12.2 `<select>`

```html
        <select name="city">
            <option value="beijing">北京</option>
            <option value="shanghai">上海</option>
            <option value="shenzhen">深圳</option>
            <option value="xian" selected>西安</option>
    　　</select>
```

13 `<textarea>` 多行文本

```html
        <textarea rows="10" cols="10">
        　　默认文本内容
    　　</textarea>
```

14 `<iframe>` 标签:框架

可以在同一个浏览器窗口插入其他HTML页面

```html
<iframe src="http://www.baidu.com" width="900" height="300" frameborder="0"></iframe>
```

四、块级标签与内联标签

1.块级标签：自动地在元素的前后添加空行

```html
  　　 <div></div> <p></p> <h1></h1> <ul></ul> <ol></ol> <dl></dl>
```

2.内联标签：

```html
 　　<a></a> <img> <input> <span></span> <select></select> <textarea></textarea>
```