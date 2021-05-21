# 请求

## 请求扩展

1. `@app.before_request`

可以有返回

```python
func(*args, **kwargs)
    pass
```



```python
# 设置白名单
if request.path == '/login':
    return None
```

可以叠加多个，执行顺序按代码顺序执行



`@app.before_first_request`



2.`@app.after_request`

```python
func(response):
    pass
    return response
```

可以叠加多个，执行顺序按代码顺序倒序执行。

请求拦截后所有的response都会执行。



 



定制404

```python
@app.errorhander(404)
def error_404(arg):
    return "404了。。。"
```

