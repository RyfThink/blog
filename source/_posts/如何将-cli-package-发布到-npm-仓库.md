---
title: 如何将 cli package 发布到 npm 仓库
date: 2018-03-18 14:47:33
categories: node
tags: cli
---

好奇一些第三方的 node 命令行工具是如何制作与发布的，于是研究了下以便以后发布自己的命令行工具作为参考

<!--more-->

## 定义 `package.json` 需要的字段

- cli名称 `sepcontacto`
- 版本号 `1.0.0`
- 指定 cli 入口 `"bin": "./contact.js"`
- preferGlobal

```javascript
{
  "name": "sepcontacto",
  "version": "1.0.0",
  "license": "MIT",
  "description": "A command-line contact management system",
  "preferGlobal": true,
  "bin": "./contact.js",
  "dependencies": {
    "commander": "^2.15.1",
    "inquirer": "^5.2.0",
    "mongoose": "^4.9.2"
  }
}
```

## 注册账号

在 npmjs.com 注册账号后

在 https://www.npmjs.com/~septenary 可以查看自己账号下发布的 package

## 给 npm 配置账号信息

```javascript
npm adduser
```

## 发布 package

cd 到要发布的 package 目录下，执行

```javascript
npm publish
```

再去 https://www.npmjs.com/~septenary 可以看到 package 已经发布成功

## 验证

发布成功后，就可以想普通 package 那样安装自己的包了

```javascript
npm install sepcontacto -g
```

你会看到 我们的 cli 添加到了 /usr/local/bin 中

> /usr/local/bin/sepcontacto

接下来就可以愉快玩耍 cli 了

-------------

参考: 

- https://docs.npmjs.com/getting-started/publishing-npm-packages
- https://scotch.io/tutorials/build-an-interactive-command-line-application-with-nodejs