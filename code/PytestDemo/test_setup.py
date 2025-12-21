import pytest
from concurrent.futures import ThreadPoolExecutor, as_completed

class TestSetup:
    def test_setup(self, gaussdb_clusters):
        # 定义要并行执行的函数（封装install_cluster调用）
        def execute_install(cluster):
            try:
                cluster.install_agent()
                cluster.install_cluster()
                return f"Success: {cluster.name} 安装完成"
            except Exception as exc:
                return f"Error: {cluster.name} 安装失败 - {str(exc)}"

        # 1. 创建线程池（max_workers指定并行数，可根据需要调整，如CPU核心数/实例数）
        # max_workers=None 会自动根据系统配置调整
        with ThreadPoolExecutor(max_workers=None) as executor:
            # 2. 提交所有任务到线程池
            future_to_cluster = {
                executor.submit(execute_install, cluster): cluster for cluster in gaussdb_clusters
            }

            # 3. 遍历完成的任务，输出结果（按完成顺序）
            for future in as_completed(future_to_cluster):
                cluster = future_to_cluster[future]
                try:
                    result = future.result()  # 获取任务执行结果
                    print(result)
                except Exception as e:
                    print(f"处理 {cluster.name} 时发生未捕获异常: {str(e)}")

    def test_switchover(self, gaussdb_clusters):
        gaussdb_clusters.app_a.switchover(gaussdb_clusters.app_b)