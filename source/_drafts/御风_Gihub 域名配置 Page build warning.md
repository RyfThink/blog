---
title: Gihub 域名配置 Page build warning
description:
date: 2015-08-01 12:00:00
category: undefined
tags: github
comments:
categories:
permalink:
---


Github 域名配置 "Page build warning"

最近两周总是收到Github 关于域名配置警告的邮件，内容如下：

>   The page build completed successfully, but returned the following warning:
Your site's DNS settings are using a custom subdomain, www.septenary.cn, that's set up as an A record. We recommend you change this to a CNAME record pointing at Ryfthink.github.io. Instructions on configuring a subdomain for use with GitHub Pages can be found at: https://help.github.com/articles/setting-up-a-custom-domain-with-github-pages/ 
For information on troubleshooting Jekyll see:
https://help.github.com/articles/using-jekyll-with-pages#troubleshooting
If you have any questions you can contact us by replying to this email.

<!--more-->

大概意思是虽然我用 **A** 记录 配置 [www.septenary.cn](www.septenary.cn) 指向我的 Github Page ，但是它建议最好用 **CNAME** 记录 指向 [Ryfthink.github.io](Ryfthink.github.io) 来加快解析速度。
我是在 [万网](www.net.cn) 购买域名并配置解析的，如果你用DNSPod 帮你配置解析，同样也可以生效。

查看原来的 配置是这样的
![Alt text](http://assets.septenary.cn/user/1/image/970d47c1-9a52-467d-caf2-041aaff90545)

将 A 记录 配置暂停，然后添加一个 **CNAME** 记录：
![Alt text](http://assets.septenary.cn/user/1/image/3959438a-f2c4-42ea-b0ea-5f0e463a689c)

启用后稍等几分钟，你新创建的域名解析就会生效。这样提高了域名解析速度，以后也不会收到这恼人的 **Page build warning** 警告邮件了。
