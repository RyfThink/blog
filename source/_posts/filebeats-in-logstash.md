---
title: Logstash 之 filebeats
tags: ELK
categories: devOps
date: 2017-03-17 12:00:00
description: filebeats 大法好，看看怎么配置它来帮助我们收集主机上的日志数据
---

# 简单流程

1. [Download filebeats](https://www.elastic.co/downloads/beats/filebeat)

2. 配置 filebeat.yml

	```ruby
	filebeat.prospectors:
		- input_type: log
	paths:
		- /var/log/simple.log
	output.logstash:
		hosts: ["localhost:5043"]
	```
3. 执行 `sudo ./filebeat -e -c filebeat.yml -d "publish"`， **filebeat** 会一直尝试连接 5043 端口

4. 配置 logstash.conf
    
	```ruby
	input {
		beats {
				port => "5043"
		}
	}
	output {
		stdout { codec => rubydebug }
	}
	```
5. 验证配置是否合法 `logstash -f logstash.conf --config.test_and_exit`

6. 启动 Logstash `logstash -f logstash.conf --config.reload.automatic`，这时会看到 **simple.log** 的日志被逐个输出 
   添加 `--config.reload.automatic` 参数，当修改 `logstash.conf` 时，logstash 会自动重启

7. 向 **simple.log** 追加一条日志 `echo "这是一条追加日志" >> logstash-tutorial.log`，可以看到 logstash 输出了新追加的内容

# Apache 日志加工

1. 配置 logstash.conf

	```ruby
	input {
		beats {
				port => "5043"
		}
	}

	filter {
		# apache 日志过滤
		grok {
			match => { "message" => "%{COMBINEDAPACHELOG}"}
		}
		# 通过 ip 确认经纬度
		geoip {
			source => "clientip"
		}
	}

	output {
		stdout { codec => rubydebug }
	}
	```

2. 停止 filebeat ，删除 filebeat/data 文件，该文件记录了之前读取记录，所以需要删除掉

3. 重新启动 filebeat `sudo ./filebeat -e -c filebeat.yml -d "publish"`

4. 向 **simple.log** 追加一条 apache 日志    

	```
	10.63.9.126 - - [04/Jan/2016:05:13:42 +0000] "PUT /septenary/api/user/update HTTP/1.1" 200 203023 "http://septenary.cn/" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.77 Safari/537.36"
	```
5. logstash 输出类似以下内容

```ruby
{
	"request" => "/presentations/logstash-monitorama-2013/images/kibana-search.png",
	"agent" => "\"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.77 Safari/537.36\"",
	"geoip" => {
		"timezone" => "Europe/Moscow",
		"ip" => "83.149.9.216",
		"latitude" => 55.7485,
		"continent_code" => "EU",
		"city_name" => "Moscow",
		"country_code2" => "RU",
		"country_name" => "Russia",
		"country_code3" => "RU",
		"region_name" => "Moscow",
		"location" => [
			[0] 37.6184,
			[1] 55.7485
		],
		"postal_code" => "101194",
		"longitude" => 37.6184,
		"region_code" => "MOW"
	},
	"offset" => 650,
	"auth" => "-",
	"ident" => "-",
	"input_type" => "log",
	"verb" => "GET",
	"source" => "/Users/renyufeng/Documents/ES/practice-logstash/log/simple.log",
	"message" => "83.149.9.216 - - [04/Jan/2015:05:13:42 +0000] \"GET /presentations/logstash-monitorama-2013/images/kibana-search.png HTTP/1.1\" 200 203023 \"http://semicomplete.com/presentations/logstash-monitorama-2013/\" \"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.77 Safari/537.36\"",
	"type" => "log",
	"tags" => [
		[0] "beats_input_codec_plain_applied"
	],
	"referrer" => "\"http://semicomplete.com/presentations/logstash-monitorama-2013/\"",
	"@timestamp" => 2017-03-10T08:09:49.065Z,
	"response" => "200",
	"bytes" => "203023",
	"clientip" => "83.149.9.216",
	"@version" => "1",
	"beat" => {
		"hostname" => "renyufengdeMacBook-Pro.local",
		"name" => "renyufengdeMacBook-Pro.local",
		"version" => "5.2.2"
	},
	"host" => "renyufengdeMacBook-Pro.local",
	"httpversion" => "1.1",
	"timestamp" => "04/Jan/2015:05:13:42 +0000"
}
```
    
# 索引日志到 ElasticSearch 中

1. 配置 logstash.conf

	```ruby
	input {
		beats {
			port => "5043"
		}
	}

	filter {
		grok {
			match => { "message" => "%{COMBINEDAPACHELOG}"}
		}
		geoip {
			source => "clientip"
		}
	}

	output {
		stdout { codec => rubydebug }
			elasticsearch {
				hosts => [ "localhost:9200" ]
			}
	}
	```

2. 启动以下服务
    * 重启 filebeat
    * 启动 elasticsearch
    * 启动 kibana

3. 此时运行的服务如下图
![](http://assets.septenary.cn/user/1/image/0759c26c-01f2-4867-dd9d-6d4917eee384)

4. 查看 elasticsearch 所有索引 `curl -XGET 'localhost:9200/_cat/indices?v&pretty'`

5. 通过索引名查询入库的日志 `curl -XGET 'localhost:9200/logstash-2017.03.10/_search?pretty'`

6. 同样可以在 kibana 上查看

[官方指南](https://www.elastic.co/guide/en/logstash/current/advanced-pipeline.html)


