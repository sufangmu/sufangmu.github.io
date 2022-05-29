## 一、`request`

1. `request.method`：以全大写的字符串返回请求方式。
2. `request.GET`：返回用户提交的GET请求数据 `<QueryDict: {'username': ['admin'], 'password': ['123456']}>`
3. `request.GET.get('key')`： 返回列表中的最后一个元素
4. `request.GET.getlist('key')`：返回列表
5. `request.POST`：返回用户提交的POST请求数据
6. `request.POST.get('key')`
7. `request.POST.getlist('key')`
8. `request.body`
9. `request.path`
10. `request.path_info`
11. `request.get_full_path()`：能过获取完整的url及问号后面的参数，如/login/?username=admin&password=123456
12. `request.FILES`：获取文件数据
13. `request.is_ajax()`：判断当前请求是否是ajax请求 返回布尔值

