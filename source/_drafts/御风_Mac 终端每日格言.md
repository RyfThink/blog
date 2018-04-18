---
title: Mac 终端每日格言
description:
date: 2017-03-03 12:00:00
category: undefined
tags: Mac
comments:
categories:
permalink:
---


# 1.用 brew 安装 fortune

> $ brew install fortune

# 2.安装语言库

> $ git clone git@github.com:ruanyf/fortunes.git

# 3. 生成索引文件

> $ strfile fortunes/data/fortunes<br>
> $ strfile fortunes/data/chinese<br>
> $ strfile fortunes/data/tang300<br>
> $ strfile fortunes/data/song100<br>


# 4. 编辑 **~/.zshrc** 
那么每次启动 shell 窗口，就会自动跳出一句格言。

> echo<br>
> echo "=============== Quote Of The Day ==============="<br>
> echo<br>
> fortune 25% fortunes/data/fortunes 25% fortunes/data/chinese 25% fortunes/data/tang300 25% fortunes/data/song100<br>
> echo<br>
> echo "================================================"<br>
> echo<br>


# 5. 制作语言包
[参考](http://www.ruanyifeng.com/blog/2015/04/fortune.html)



