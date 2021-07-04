# Flask-Session

```python
import os
from flask import Flask, session, request
from flask_session import Session
from redis import StrictRedis

class Config():
    #session存储格式为redis
    SESSION_TYPE="redis"
    # 设置redis的ip,port,有效时间
    REDIS_HOST = "127.0.0.1"
    REDIS_PORT = "6379"
    REDIS_DB= 0
    #session长期有效，则设定session生命周期，整数秒
    ERMANENT_SESSION_LIFETIME = 24*60*60
    #是否强制加盐，混淆session
    SESSION_USE_SIGNER = True
    #如果加盐，那么必须设置的安全码，盐
    SECRET_KEY = "123456"
    #sessons是否长期有效，false，则关闭浏览器，session失效
    SESSION_PERMANENT = False
    SESSION_REDIS = StrictRedis(host=REDIS_HOST, port=REDIS_PORT)
    
def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    Session(app)
```

