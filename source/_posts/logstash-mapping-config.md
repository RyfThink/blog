---
title: Logstash Mapping 配置
tags: ELK
categories: devOps
date: 2017-05-23 12:00:00
description: 如何配置 Logstash 的 mapping，使其友好地上传到 ElasticSearch 上呢?
---

现在有两组 JSON 日志需要上报到 Elasticsearch
    
- 下载失败日志
    
```json
{
 "Topic": "download_failed",
 "Source": "192.168.1.158",
 "FailCode": "0500",
 "Title": "多米尼克大战",
 "Space": 0,
 "Time": 1494023823,
 "Speed": "84.82267",
}
```
    
- 下载成功日志
    
```json
{
 "Topic": "download_success",
 "Source": "192.168.1.158",
 "Title": "爱送书",
 "Space": 1028,
 "Time": 1494090811,
 "Speed": "120.82",
}
```

# filter配置
    
配置好 **logstash pipeline**：
    
```shell
input {
   stdin{
       codec => json
   }
}
    
filter{  
   # @timestamp 取 stdin 传入的 __time__ 字段
   date {
       match => ["Time", "UNIX"]
   }
   
   # 经纬度转换
   geoip { 
       source => "Source" 
   }
}
    
output {
   elasticsearch {
       hosts => ["http://localhost:9200"]
       index => "logstash-android-%{+YYYY.MM.dd}"
       document_type => "%{Topic}"
   }
}
```
    
1.上面看到 投递到 Elasticsearch 的索引是 logstash- 为前缀，是为了让 geoIp 处理后的经纬度符合 geopint 类型，相关参考: https://github.com/elastic/logstash/issues/3137
    
2.将这两条日志通过 pipeline 投递到 Elasticsearch 时会自动创建 mapping，可以在 **kibana** > **Dev Tools** 通过命令查看 mapping
    
```shell
GET logstash-android-*/_mapping
```
    
如果你的 mapping 类型和你预期的不符合，可以调整filter，比如 原始数据 Speed 字段是 string 类型，而你想要 float 类型
    
```shell
mutate {
convert => {
	"Space" => "integer"
}
}
```
    
# template 配置
    
- [x] TODO
    
