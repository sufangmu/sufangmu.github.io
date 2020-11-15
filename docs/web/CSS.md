## 一、CSS 简介：

　　CSS 指层叠样式表 (Cascading Style Sheets)，用来设置HTML的格式。

　　语法：`选择器 {属性:值;属性:值}`

　　注释：`//注释内容` 或`/*注释内容*/`

## 二、CSS的引入方式：行内嵌、嵌入式、链接式、导入式

### 1.行内嵌：

```css
<body>
    <p style="color: red">hello world</p>
</body>
```

### 2.嵌入式：

```html
<!DOCTYPE html>
<html>
    <head>
        <style>
            p {
            	color: green;
            }
        </style>
    </head>
    <body>
   		<p>hello world</p>
    </body>
</html>
```

### 3. 链接式：

```html
<!DOCTYPE html>
<html>
    <head>
    	<link rel="stylesheet" type="text/css" href="mystyle.css">
    </head>
    <body>
    	<p>hello world</p>
    </body>
</html>
```

css文件中的内容

```css
p {
	color: red;
}
```

### 4. 导入式：

```html
<!DOCTYPE html>
<html>
    <head>
        <style>
        	@import "mystyle.css";
        </style>
    </head>
    <body>
        <p>hello world</p>
    </body>
</html>
```

**样式优先级：**
　　（内联样式）Inline style > （内部样式）Internal style sheet >（外部样式）External style sheet > 浏览器默认样式

## 三、选择器

### 1.基本选择器

#### 1.1 通用选择器

```html
<!DOCTYPE html>
<html>
    <head>
        <style>
            * {
            	color: red;
            }
        </style>
    </head>
    <body>
        <h>hello</p>
        <p>world</p>
    </body>
</html>
```

 

#### 1.2 标签选择器

```html
<!DOCTYPE html>
<html>
    <head>
    <style>
        p {
        	color: red;
        }
        </style>
    </head>
    <body>
        <h1>hello</h1>
        <p>world</p>
    </body>
</html>
```

####   1.3 ID选择器

```html
<!DOCTYPE html>
<html>
    <head>
    <style>
        #name {
        	color: red;
        }
        </style>
    </head>
    <body>
        <p>hello</p>
        <p id="name">诸葛孔明</p>
    </body>
</html> 
```

 

####  1.4 class选择器

```html
<!DOCTYPE html>
<html>
    <head>
        <style>
            .name {
            	color: red;
            }
        </style>
    </head>
    <body>
        <p class="name">诸葛孔明</p>
        <p class="name">诸葛子瑜</p>
        <p class="name">诸葛公休</p>
    </body>
</html>
```

 

### 2.组合选择

#### 2.1 后代选择器

```html
<!DOCTYPE html>
<html>
    <head>
        <style type="text/css">
            #food p{
            	color: green;
            }
            #food div{
            	font-size: 20px; 
            }
        </style>
    </head>
    <body>
        <div id="food">
            <div class="fruits">
                <p>苹果</p>
                <p>香蕉</p>
            </div>
            <div class="dessert">
                <p>蛋糕</p>
                <p>巧克力</p>
            </div>
        </div>
    </body>
</html>
```

####  2.2 子代选择器

```html
<!DOCTYPE html>
<html>
    <head>
        <style type="text/css">
            #food>p{
            	color: green;
            }
            #food>div{
            	font-size: 20px; 
            }
        </style>
    </head>
    <body>
        <div id="food">
            <div class="fruits">
                <p>苹果</p>
                <p>香蕉</p>
            </div>
            <div class="dessert">
                <p>蛋糕</p>
                <p>巧克力</p>
            </div>
        </div>
    </body>
</html>
```

 

#### 2.3 变形选择器

```html
<!DOCTYPE html>
<html>
    <head>
        <style type="text/css">
        	#fav, .fruits{
        		color: red;
        	}
        </style>
    </head>
    <body>
        <p id="fav">Favourite</p>
        <div id="food">
            <div class="fruits">
                <p>苹果</p>
                <p>香蕉</p>
            </div>
            <div class="dessert">
                <p>蛋糕</p>
                <p>巧克力</p>
            </div>
        </div>
    </body>
</html>
```

#### 2.4  毗邻选择器

紧接在另一元素后的元素，且二者有相同父元素。

```html
<!DOCTYPE html>
<html>
    <head>
        <style type="text/css">
            div+p{
            	color: red;
            }
        </style>
    </head>
    <body>
        <p>p 1</p>
        <div>
            <p>div1</p>
        </div>
        <p>p 2</p>
        <p>p 3</p>
    </body>
</html>
```

### 3. 属性选择器

```css
[attribute]            [target]    选择所有带有target属性元素    
[attribute=value]    [target=-blank]    选择所有使用target="-blank"的元素    
[attribute~=value]    [title~=flower]    选择标题属性包含单词"flower"的所有元素    
[attribute|=language]    [lang|=en]    选择一个lang属性的起始值="EN"的所有元素    
[attribute^=value]    a[src^="https"]    选择每一个src属性的值以"https"开头的元素    
[attribute$=value]    a[src$=".pdf"]    选择每一个src属性的值以".pdf"结尾的元素    
[attribute*=value]    a[src*="runoob"]    选择每一个src属性的值包含子字符串"runoob"的元素    
```

### 4. 伪类

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Title</title>
    <style>
        a:link{    /* 没有访问过的连接 */
            color: red;
        }
        a:visited{ /* 已经访问过的颜色 */
            color: green;
        }
        a:hover{ /* 鼠标放上的颜色 */
            color: yellow;
        }
        a:active{ /* 鼠标点击时的颜色 */
            color: blue;
        }
        p:after{ /* 位于元素之后的格式 */
            content: ' world';
        }
        p:before{ /* 位于元素之前的格式 */
            content: "你好 世界";
            color: green;
        }
    </style>
</head>
<body>

<a href="https://www.baidu.com">百度一下</a>
<p>hello</p>
</body>
</html>
```

 

# 四、属性

### 1. 背景属性

```html
<!DOCTYPE html>
<html>
    <head>
    <title>Title</title>
        <style type="text/css">
            div {
                height: 1000px;
                background-color: gray;
                background-image: url("mayun.jpg");
                background-repeat: no-repeat;
                background-size: 200px, 300px;
                background-position:center;
                /* background-attachment:fixed; */
                //可以简写为下面的格式
                //background: url("mayun.jpg") gray no-repeat center;
            }
        </style>
    </head>
    <body>
    	<div></div>
    </body>
</html>
```

### 2. 颜色属性

```html
<!DOCTYPE html>
<html>
    <head>
        <title>Title</title>
        <style type="text/css">
            h1 {
                color:     #87CEEB;
                /* color: red; */
                /* color: rgb(255,255,0); */
                /* color:rgba(255,0,0,0.2); */
                opacity: 0.5  /* 透明度 */
            }
        </style>
    </head>
    <body>
    	<h1>hello world</h1>
    </body>
</html>
```

### 3. 字体属性

```html
<!DOCTYPE html>
<html>
    <head>
        <title>Title</title>
        <style type="text/css">
            h1 {
                font-family:"Times New Roman", Times, serif;
                font-size: 30px;
                font-style: italic;
                font-weight:lighter;
            }
        </style>
    </head>
    <body>
    	<h1>hello world</h1>
    </body>
</html>    
```

font-weight的属性值

1. `normal`	默认值。定义标准的字符。

2. `bold`	定义粗体字符。

3. `bolder`	定义更粗的字符。

4. `lighter`	定义更细的字符。

5. `100-900` 定义由粗到细的字符。400 等同于 normal，而 700 等同于 bold。

### 4. 文本属性

```html
<!DOCTYPE html>
<html>
    <head>
        <title>Title</title>
        <style type="text/css">
            p {
                color: green;                      /* 字体颜色 */
                direction: ltr;                  /* 字体方向 rtl */
                letter-spacing: 5px;             /* 字母间隔 */
                word-spacing:30px;                /* 单词间隔 */
                line-height: 30px;                 /* 行距 */
                text-align: center;              /* 位置：left|right|justify */
                text-decoration:line-through;     /* 删除线：overline | underline */
                text-transform:capitalize;      /* 大小写：uppercase|lowercase */    
            }
        </style>
    </head>
    <body>
    	<p>life is short, <br>you need python.</p>
    </body>
</html>
```

###  5. 内外边距

#### 1. 外边距

```css
margin:10px 5px 15px 20px;
//上边距是 10px
//右边距是 5px
//下边距是 15px
//左边距是 20px
margin:10px 5px 15px;
//上边距是 10px
//右边距和左边距是 5px
//下边距是 15px
margin:10px 5px;
//上边距和下边距是 10px
//右边距和左边距是 5px
margin:10px; 
//所有四个边距都是 10px
```

`margin-bottom` 设置元素的下外边距
`margin-left` 设置元素的左外边距
`margin-right` 设置元素的右外边距
`margin-top` 设置元素的上外边距

#### 2. 内边距

`padding` 与`margin`相同

### 6.边框

```html
<!DOCTYPE html>
<html>
    <head>
        <title>Title</title>
        <style type="text/css">
            div {
                height: 200px;
                width: 200px;
                /* border:red solid 5px; */
                border-bottom:red solid 5px;
                border-top: green dotted 5px;
                border-left: blue dashed 5px;
                border-right: gray  double 5px;
                border-radius:20%;
            }
        </style>
    </head>
    <body>
        <div>
        </div>
    </body>
</html>
```

 

### 7. 宽高设置

`height`    	设置元素的高度。
`line-height`  设置行高。
`max-height`    设置元素的最大高度。
`min-height`    设置元素的最小高度。
`width`    		设置元素的宽度。
`max-width`       设置元素的最大宽度。
`min-width`       设置元素的最小宽度。

### 8. display

`none`                     此元素不会被显示。
`block`                   此元素将显示为块级元素，此元素前后会带有换行符。
`inline`                 默认。此元素会被显示为内联元素，元素前后没有换行符。
`inline-bloc`k    行内块元素。（CSS2.1 新增的值）

##  五、元素位置

### 1.正常文档流

将元素（标签）在进行排版布局的时候按从左到右，从上到下的顺序进行排版

### 2. 脱离文档流

将元素（标签）从文档流中取出进行覆盖，其他元素会按文档流中不存在该元素重新进行布局
**非完全脱离**：float（浮动）
**完全脱离：**position（定位）中的absolute,fixed

#### 1. float

float 使元素向左或向右移动，其周围的元素也会重新排列 属性值：left | right
clear 指定不允许元素周围有浮动元素。 属性值：left | right | both

#### 2.position

##### 2.1`static`：默认值

##### 2.2`relative`：相对其正常位置

```html
<!DOCTYPE html>
<html>
    <head>
        <title></title>
        <style type="text/css">
            #p2{
                position: relative;
                left: 20px;
            }
        </style>
    </head>
    <body>
        <p id="p1">hello world</p>
        <p id="p2">hello world</p>
    </body>
</html>    
```

##### 2.3 `fixed`:位置相对于浏览器窗口是固定位置

```html
<!DOCTYPE html>
<html>
    <head>
        <title></title>
        <style type="text/css">
            a{
                position: fixed;
                right: 100px;
                bottom: 100px;
            }
        </style>
    </head>
    <body>
        <div id="top" style="height: 50px;background-color: green"></div>
        <div id="content" style="height: 1000px; background-color: gray">
        </div>
        <a href="#top">返回顶部</a>
    </body>
</html>    
```

#### 2.4 `absolute`

如果其父级的position设置为非static，则按照父级的位置进行移动，如果没有就继续向上找，如果都没有就按html的位置进行移动.
在下面的例子中，如果div1没有设置position的属性，那么div2就会按照HTML的相对位置进行定位，如果设置了div1的relative，那么div2才会按照div1的位置进行定位。

```html
<!DOCTYPE html>
<html>
    <head>
        <style type="text/css">
            /*         #div1{
            position: relative;
            } */
            #div2{
                position: absolute;
                top: 100px;

            }
        </style>
    </head>
    <body>
        <div style="width: 300px;height: 200px;background-color: gray"></div>
        <div id="div1" style="width: 300px;height: 200px;background-color: green">
            <div id="div2" style="width: 300px;height: 100px;background-color: red"></div>
        </div>
	</body>
</html>
```

 

#### 2.5 sticky

```html
<!DOCTYPE html>
<html>
    <head>
        <title></title>
        <style type="text/css">
            #div2{
                position: -webkit-sticky;
                position: sticky;
                top: 0;
        	}
        </style>
    </head>
    <body>
        <div id="div1" style="height: 200px;background-color: gray"></div>
        <div id="div2" style="height: 100px;background-color: green"></div>
        <div id="div3" style="height: 800px;background-color: gray"></div>
    </body>
</html>
```

 

# 六、导航栏

```html
<!DOCTYPE html>
<html>
<head>
    <title>我的主页</title>
    <style type="text/css">
        /* 全局设置，取消外边框 */
        * {
            margin: 0;
            padding: 0;
        }
        /* 顶部的高度 和背景颜色*/
        .head{
            height: 44px;
            background-color: #2459a2;
        }
        .head-content {
            position: relative;
            margin: auto;
            width: 1024px;
            height: 44px;
            line-height: 44px;
            background-color: #2459a2;
            /* background-color: red; */
        }

        .menu {
            margin-left: 50px;
        }


        .menu ul li, .login a{
            list-style-type: none;
            display: inline-block;
            float: left;
            padding: 0 15px;    

        }

        .head-content a{
            text-decoration: none;    
            color: white;
        }

        .active{
            background-color: #006400;
        }

        .menu li:hover:not(.active),.login a:hover{
                background-color: gray;
        }

        .login {
            /* background-color: blue; */
            float: right;
            margin-right: 50px;
        }
    </style>
</head>
<body>
    <div class="head">
        <div class="head-content">
            <div class="menu">
                <ul>
                    <li class="active" ><a href="#home">主页</a></li>
                    <li><a href="#news">新闻</a></li>
                    <li><a href="#blog">博客</a></li>
                    <li><a href="#bbs">论坛</a></li>
                    <li><a href="#contact">联系</a></li>
                    <li><a href="#about">关于</a></li>    
                </ul>                                    
            </div>
            <div class="login">
                <a href="#login">注册</a>
                <a href="#register">登录</a>    
            </div>
        </div>
    </div>
</body>
</html>
```



# 七、下拉菜单

 