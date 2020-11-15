Jenkins安装

1. 出现的问题

Please wait while Jenkins is getting ready to work...

```bash
ubuntu@jenkins:~$ cat .jenkins/hudson.model.UpdateCenter.xml
<?xml version='1.1' encoding='UTF-8'?>
<sites>
  <site>
    <id>default</id>
    <url>https://mirrors.huaweicloud.com/jenkins/updates/stable-2.222/update-center.json</url>
  </site>
</sites>
```


安装插件时：

ubuntu@jenkins:~/.jenkins/updates$ cat /home/ubuntu/.jenkins/secrets/initialAdminPassword
23c8d7503d1449ab8734c384db8a4c60

sed -i 's#updates.jenkins-ci.org/download#mirrors.huaweicloud.com/jenkins#g' .jenkins/updates/default.json