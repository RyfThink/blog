---
title: Logstash pipeline 配置概要
description:
date: 2017-05-16 12:00:00
category: undefined
tags: ELK
comments:
categories:
permalink:
---


# 常用参数

- **-e** 立即执行配置

```shell
logstash -e 'input { stdint{} } output { stdout {codec=>rubydebug} }'
```

- **-f** 指定配置文件
    
```shell
logstash -f xxx.logstash.conf
```
    
- **-t** 测试配置语法并退出
    
```shell
logstash -f test2.logstash.conf -t
```
    
- **-l** logstash 默认将日志输出到标准错误，生产环境可指定日志输出位置
    
```shell
logstash -l /var/logs/logstash.log
```
    
- **-w** 过滤器线程数量
    
```shell
logstash -w 5
```

- **-r** 更改配置文件后自动重启
    
```shell
logstash -f xxx.logstash.conf -r
```
    
# DSL

logstash 设计了一套自己的 DSL 语法，包括以下部分

## 区段

一个标准配置有三个区段，其中 **stdin, mutate, stdout** 都是标准插件，想要自定义一个插件可以参考这篇文章 [Logstash 集成 aliyun/oss 插件]()

```shell
input{
    stdin{}
}

filter{
    mutate{}
}

output{
    sdtout{}
}
```

## 支持的数据类型

- array
- boolean
- bytes
- Codec
- hash
- number
- password
- path
- string

## 引用字段

[filed] 即引用了一个字段，如果是顶级字段可以省略 [] 即 filed，如果是嵌套字段需要这样写[outer_filed][inner_filed]

像下面的数据结构引用 **ip** 字段: `[ip] 或 ip` ，引用 **os** 字段: `[ua][os]`

```shell
{
  "agent": "Mozilla/5.0 (compatible; MSIE 9.0)",
  "ip": "192.168.24.44",
  "request": "/index.html"
  "response": {
    "status": 200,
    "bytes": 52353
  },
  "ua": {
    "os": "Windows 7"
  }
}
```

## 环境变量引用

如下，引用环境变量 `${TCP_PORT}` , 可以添加默认值 `${TCP_PORT:3100}`

```shell
input {
    tcp {
        port => "${TCP_PORT:3100}"
    }
}
```

## sprintf 格式

引用的字段可以应用于 **sprintf** 格式，如下 `%{}` 包装字段引用

```shell
filter{
	mutate {
		add_tag => "new tag %{[field]}"
	}
}	
output {
  file {
    path => "/var/log/%{type}.%{+yyyy.MM.dd.HH}"
  }
}
```

## 条件判断

使用条件判断可以控制在区段内处理特定的事件，条件判断语法如下：

```shell
if EXPRESSION {
  ...
} else if EXPRESSION {
  ...
} else {
  ...
}
```

常见操作有

- **==, !=, <, >, <=, >=** 等于操作
- **=~, !~**  正则匹配
- **in, not in** 包含
- **and, or, nand, xor** 与或非
- **!** 取反

举个例子

```shell
# 在过滤器中，action 字段为 login 时，删除 secret
filter {
    if [action] == "login" {
        mutate { remove => "secret" }
    }
}
output {
    # 发送消息到 pagerduty
    if [loglevel] == "ERROR" and [deployment] == "production" {
        pagerduty {
        }
    }
}
```

*注意: 字段引用、sprintf 格式、条件判断只能用于 filter 和 output，不能用于input*

## @metadata

最常见的用法是在 filter 中指定 **@metadata**，控制输出逻辑，**@metadata** 作为元数据并不会随数据一并输出，可视为临时变量

```shell
input { stdin { } }

filter {
    mutate { add_field => { "show" => "This data will be in the output" } }
    mutate { add_field => { "[@metadata][output]" => "stdout" } }
    mutate { add_field => { "[@metadata][output]" => "file" } }
}

output {
    if [@metadata][output] == "stdout" {
        stdout { codec => rubydebug }
    } else if [@metadata][output] == "file" {
        file {}
    }
}
```

若想输出 **@metadata** 字段，需要设置 `metadata => true`

```shell
stdout { codec => rubydebug { metadata => true } }
```
