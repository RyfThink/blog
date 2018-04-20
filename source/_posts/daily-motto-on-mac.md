---
title: Mac 终端每日格言
categories: mac
date: 2017-03-03 12:00:00
description: 在自己的终端上配置个格言玩玩~
---

# 1.用 brew 安装 fortune

```shell
$ brew install fortune
```

# 2.安装语言库

```shell
$ git clone git@github.com:ruanyf/fortunes.git
```

# 3. 生成索引文件

```shell
$ strfile fortunes/data/fortunes
$ strfile fortunes/data/chinese
$ strfile fortunes/data/tang300
$ strfile fortunes/data/song100
```


# 4. 编辑 **~/.zshrc** 
那么每次启动 shell 窗口，就会自动跳出一句格言。

```shell
echo
echo "=============== Quote Of The Day ==============="
echo
fortune 25% fortunes/data/fortunes 25% fortunes/data/chinese 25% fortunes/data/tang300 25% fortunes/data/song100
echo
echo "================================================"
echo
```

# 5. 制作语言包
[参考](http://www.ruanyifeng.com/blog/2015/04/fortune.html)

