---
title: MEAN 栈实践之 在 CVM、AWS 上部署小记
tags: devOps
categories: devOps
date: 2017-03-02 12:00:00
---

简单记录了当初考虑在 **腾讯云** 还是 **AWS** 部署服务的小记，虽然最终还是在 阿里云上部署。。。

<!--more-->


# Ⅰ. 腾讯云 CVM 部署
考虑数据库与服务器配置在同一主机上，勾选磁盘空间

## 配置 ssh 公钥
1.本地 `ssh-keygen` 生成密钥, 在 `~/.ssh/config` 中添访问配置
    
	```shell
	Host qcloud
		HostName 公网IP
		User root
		Port 22
		IdentityFile ~/.ssh/qcloud_rsa
	```

2.在云主机配置公钥
3.连接云主机 `ssh qcloud`

## MongoDB 的安装
1.连接云主机

2.编辑 `/etc/yum.repos.d/mongodb-org-3.4.repo` 文件

```shell
[mongodb-org-3.4]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/$releasever/mongodb-org/3.4/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-3.4.asc
```

3.执行 `sudo yum install -y mongodb-org` 进行安装

4.对于类 **SELinux** 系统 ，需要置成 **disabled**

5.**mongod** 操作: `sudo service mongod` + `start` , `stop` , `restart`

6.配置开机自启动 `sudo chkconfig mongod on`

---


# Ⅱ. AWS 部署
## 安全组配置
| 类型 | 协议 | 端口范围 | 来源 |
| --- | --- | --- | --- |
| HTTP | TCP | 80 | 0.0.0.0/0 |
| 所有 ICMP | 全部 | 不适用 | 0.0.0.0/0 |

## 退出 SSH 继续运行程序

1. 执行 `screen` 进入子界面
2. 执行程序 `sudo node ./bin/www`
3. `ctrl + A` 后键入 `D` 退出子界面
4. 退出 SSH，程序会继续运行
5. 再次连接 SSH，执行 `screen -ls` 查看由screen维护的进程id

	```shell
	There is a screen on:
	20232.pts-0.ip-172-31-30-2	(01/19/17 07:24:36)(Detached)
	1 Socket in /var/run/screen/S-ubuntu.
	```

6. `screen -r 20232.pts-0.ip-172-31-30-2` 进入子界面管理 node 进程

## 使用PM2管理程序

1. 安装pm2 `[sudo] npm install pm2 -g`
2. 创建一个apps.json，然后通过pm2 start apps.json来启动apps.json里面定义的apps，该文件就是一个json格式的配置文件，告诉pm2该怎么去启动app，启动哪些app。比如：

	```shell
	[{
		"name":"your app name",
		"script":"the script to start your app",
		"cwd":"change working directory", // 指定该app工作目录，这样pm2会相对这个目录去找脚本之类的。
		"error_file":"app-err.log",
		"out_file":"app-out.log",
		"pid_file":"app.pid",
		"one_launch_only":"true",
		"env": {
			"NODE_ENV":"production"
		}
	}]
	```

3. [参考](http://www.jianshu.com/p/fdc12d82b661)

## 保证 mongod 在 nodejs 前启动
[Link](http://antrikshy.com/blog/run-mongodb-automatically-nodejs-project)




