import random
import string

import pytest
import time

class AppInstaller:
    def __init__(self, name, ip_list):
        self.name = name
        self.ip_list = ip_list

    def install_agent(self):
        print("install agent", self.name)
        return True

    def install_cluster(self):
        print("install cluster", self.name)
        return True

    def switchover(self, peer_cluster):
        print("{} switchover {}".format(self.name, peer_cluster.name))
        return True

class AppContainer:
    def __init__(self):
        # 存储所有App实例，便于内部管理
        self._apps = []

    def add_app(self, app_obj):
        idx = len(self._apps)
        attr_name = f"app_{string.ascii_lowercase[idx]}"
        # 动态添加属性
        setattr(self, attr_name, app_obj)
        self._apps.append(getattr(self, attr_name))

    def __getattr__(self, name: str):
        """
        处理动态属性的获取，告诉PyCharm这些属性是AppInstaller类型
        """
        if name.startswith("app_") and len(name) == 5 and name[4] in string.ascii_lowercase:
            return self._apps[string.ascii_lowercase.index(name[4])]
        raise AttributeError(f"'AppContainer' object has no attribute '{name}'")

    # 核心新增：实现迭代方法，让AppContainer支持遍历
    def __iter__(self):
        # 直接返回内部_apps列表的迭代器
        return iter(self._apps)


# 1. 初始化容器
app_objects = AppContainer()


@pytest.fixture(scope="package")
def gaussdb_clusters():
    print("Gaussdb Clusters init")
    # 2. 加载配置并添加App实例
    app_configs = [
        {"name": "app111", "ip_list": ["192.168.1.1", "192.168.1.1"]},
        {"name": "app222", "ip_list": ["192.168.2.1", "192.168.2.1"]}
    ]
    for app_info in app_configs:
        app_objects.add_app(AppInstaller(**app_info))
    return app_objects