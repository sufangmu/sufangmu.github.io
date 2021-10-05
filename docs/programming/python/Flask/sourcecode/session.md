## Session源码分析

Flask程序启动之后，如果有请求到来，就是执行app中的`__call__()`方法。

```python
class Flask(_PackageBoundObject):
    def __call__(self, environ, start_response):
        return self.wsgi_app(environ, start_response)
```



1. 请求到来之后，执行app对象的`__call__()`方法

   ```python
   class Flask(_PackageBoundObject):
       def __call__(self, environ, start_response):
           # 请求到来之后调用wsgi_app
           return self.wsgi_app(environ, start_response)
   ```

2. 调用`request_context(environ)` 处理请求数据

   ```python
   class Flask(_PackageBoundObject):
       def wsgi_app(self, environ, start_response):
           ctx = self.request_context(environ)  # 对接收到的请求进行处理
           error = None
           ...
   ```

3. 返回`RequestContext`类的实例

   ```python
       def request_context(self, environ):
   		# self就是创建的app实例
           return RequestContext(self, environ)
   ```

4. 在`RequestContext`类中，调用`Request`实例化

   ```python
   class RequestContext(object):
       def __init__(self, app, environ, request=None, session=None):
           self.app = app
           if request is None:  
               # 实例化时request并没有传入，所有走这一步
               # 在
               # class Flask(_PackageBoundObject):
               #     request_class = Request
               # 由此得出：
               # request = Request(environ)
               request = app.request_class(environ)
            ...
   
   ```

5. 请求处理完之后执行`ctx.push()`

   ```python
   class Flask(_PackageBoundObject):
       def wsgi_app(self, environ, start_response):
           ctx = self.request_context(environ)
           # 请求内容被封装
           error = None
           try:
               try:
                   ctx.push()
                   response = self.full_dispatch_request()
               except Exception as e:
                   error = e
                   response = self.handle_exception(e)
               except:  # noqa: B001
                   error = sys.exc_info()[1]
                   raise
               return response(environ, start_response)
           finally:
               if self.should_ignore_error(error):
                   error = None
               ctx.auto_pop(error)
   ```

6. 执行`SecureCookieSessionInterface`中的`open_session()`方法

   ```python
   class RequestContext(object):
    def push(self):
           ...
           if self.session is None:
               # session_interface = SecureCookieSessionInterface()
               session_interface = self.app.session_interface
               self.session = session_interface.open_session(self.app, self.request)
   
               if self.session is None:
                   self.session = session_interface.make_null_session(self.app)
   
           if self.url_adapter is not None:
               self.match_request()
   
   ```

7. 第一次请求时cookie中没有session，返回一个session类。

   ```python
   class SecureCookieSessionInterface(SessionInterface):
       def open_session(self, app, request):
           s = self.get_signing_serializer(app)
           if s is None:
               return None
           val = request.cookies.get(app.session_cookie_name)
           # 第一次请求中，cookie中没有session，所以val是空
           if not val:
               return self.session_class() 
           # session_class = SecureCookieSession
           # SecureCookieSession(CallbackDict, SessionMixin) ,这个类继承了dict，所以这个类构造了一个特殊的字典
           max_age = total_seconds(app.permanent_session_lifetime)
           try:
               data = s.loads(val, max_age=max_age)
               return self.session_class(data)
           except BadSignature:
               return self.session_class()
   ```

8. 视图函数中，通过在ctx中获取构造的session字典

   ```python
   from flask import Flask, session
   
   app = Flask(__name__)
   app.config['SECRET_KEY'] = 'UxlucZVeYToAjpMULTNOEw=='
   
   
   @app.route('/login')
   def login():
       # 从ctx中获取session
       session['user'] = 'root'
       return "Login"
   
   
   @app.route('/')
   def index():
       return session['user']
   
   ```

   9.`save_session`

   ```python
       def full_dispatch_request(self):
           return self.finalize_request(rv)
   ```

   ```python
       def finalize_request(self, rv, from_error_handler=False):
           response = self.make_response(rv)
           try:
               response = self.process_response(response) # 调用process_response
               request_finished.send(self, response=response)
           except Exception:
               if not from_error_handler:
                   raise
               self.logger.exception(
                   "Request finalizing failed with an error while handling an error"
               )
           return response
   ```

   ```python
       def process_response(self, response):
           ctx = _request_ctx_stack.top
           bp = ctx.request.blueprint
           funcs = ctx._after_request_functions
           if bp is not None and bp in self.after_request_funcs:
               funcs = chain(funcs, reversed(self.after_request_funcs[bp]))
           if None in self.after_request_funcs:
               funcs = chain(funcs, reversed(self.after_request_funcs[None]))
           for handler in funcs:
               response = handler(response)
           if not self.session_interface.is_null_session(ctx.session):
               self.session_interface.save_session(self, ctx.session, response) # 执行save_session
           return response
   ```

   ```python
       def save_session(self, app, session, response):
           val = self.get_signing_serializer(app).dumps(dict(session))  # 把session转为字典
           # 通过set_cookie方法，把session放在cookie中
           response.set_cookie(
               app.session_cookie_name,
               val,
               expires=expires,
               httponly=httponly,
               domain=domain,
               path=path,
               secure=secure,
               samesite=samesite,
           )
   ```

   

![](images/FlaskSession.svg)

