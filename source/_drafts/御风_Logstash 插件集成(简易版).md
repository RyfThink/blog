---
title: Logstash 插件集成(简易版)
description:
date: 2017-03-24 12:00:00
category: undefined
tags: ELK
comments:
categories:
permalink:
---


1.切换到插件目录

`cd logstash-5.2.2/vendor/bundle/jruby/1.9/gems/`

2.生成模板插件

`logstash-plugin generate --type filter --name alioss --path ./`

3.配置 **logstash-5.2.2/Gemfile** 文件，添加一条

> gem "logstash-filter-alioss", :path => "vendor/bundle/jruby/1.9/gems/logstash-filter-alioss"

4.验证 `logstash -e 'input { stdin { } } filter { alioss{ } } output { stdout {codec=>rubydebug} }'` 如下输出
    
```ruby
{
		"@timestamp" => 2017-03-14T09:32:23.423Z,
			"@version" => "1",
					"host" => "renyufengdeMacBook-Pro.local",
			 "message" => "Hello World!"
}
```


