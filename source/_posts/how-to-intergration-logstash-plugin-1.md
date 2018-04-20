---
title: Logstash 插件集成(简易版)
tags: ELK
categories:: devOps
date: 2017-03-14 12:00:00
description: Logstash 插件是个好东西，这里记录下怎么快速集成一个简单的插件
---


1.切换到插件目录

```bash
cd logstash-5.2.2/vendor/bundle/jruby/1.9/gems/
```

2.生成模板插件

```shell
logstash-plugin generate --type filter --name alioss --path ./
```

3.配置 **logstash-5.2.2/Gemfile** 文件，添加一条

```shell
gem "logstash-filter-alioss", :path => "vendor/bundle/jruby/1.9/gems/logstash-filter-alioss"
```

4.验证 

```shell
logstash -e 'input { stdin { } } filter { alioss{ } } output { stdout {codec=>rubydebug} }'
```

会得到如下结果
    
```ruby
{
	"@timestamp" => 2017-03-14T09:32:23.423Z,
	"@version" => "1",
	"host" => "renyufengdeMacBook-Pro.local",
	"message" => "Hello World!"
}
```


