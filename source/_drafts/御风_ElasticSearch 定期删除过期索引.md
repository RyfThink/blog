---
title: ElasticSearch 定期删除过期索引
description:
date: 2017-05-23 12:00:00
category: undefined
tags: ELK
comments:
categories:
permalink:
---



# 索引管理工具 curator

安装 curator

```shell
pip install elasticsearch-curator
```

curator 命令

```shell
curator [--config CONFIG.YML] [--dry-run] ACTION_FILE.YML
```

需要配置两个文件 `CONFIG.YML` 和 `ACTION_FILE.YML`， 若果不设置 `--config CONFIG.YML` 则读取默认路径配置 `~/.curator/curator.yml`，`--dry-run` 为调试模式，模拟删除，不做真实处理

下面是两个配置文件的具体内容

_config.yaml_

```yaml
client:
  hosts:
    - 127.0.0.1
  port: 9200
  url_prefix:
  use_ssl: False
  certificate:
  client_cert:
  client_key:
  ssl_no_validate: False
  http_auth:
  timeout:
  master_only: True

logging:
  loglevel: INFO
  logfile:
  logformat: default
```

_action.yaml_

```
---
actions:
  1:
    action: delete_indices
    description: 'Base on index name, delete indices which prefix is logstash-android- and is older than 90 days. ref: https://www.elastic.co/guide/en/elasticsearch/client/curator/current/index.html'
    options:
      ignore_empty_list: True
      timeout_override: 3600
      continue_if_exception: False
      disable_action: False
    filters:
      - filtertype: pattern
        kind: prefix
        value: logstash-android-
        exclude: 
      - filtertype: age
        source: name
        direction: older
        timestring: '%Y.%m.%d'
        unit: days
        unit_count: 90
        exclude:
```

# 定期任务工具 crontab

1.定期任务需要 crontab 命令，执行

```shell
crontab -e 
```
    
2.编写脚本任务 **clean_expired_indices.sh**

```shell
cd `dirname $0`
echo `pwd`
# curator --config config_file.yml --dry-run action_file.yml
curator --config config_file.yml action_file.yml
```

2. 进入 vi 界面后，添加一行命令，每天凌晨 2 点执行清理脚本，保存退出

```shell
0 2 * * *  /bin/sh /path/to/clean_expired_indices.sh >> /var/log/clean_expired_indices.log
```

3. 查看是否生效

```shell
crontab -l 
```

