---
title: Logstash 插件集成
description:
date: 2017-03-16 12:00:00
category: undefined
tags: ELK
comments:
categories:
permalink:
---


# 1.模板工具生成插件项目

`logstash-plugin generate --type input --name alioss --path ./`
    
目录结构如下:
    
```
|____CHANGELOG.md
|____CONTRIBUTORS
|____DEVELOPER.md
|____Gemfile
|____Gemfile.lock
|____lib
| |____logstash
| | |____inputs
| | | |____alioss.rb
|____LICENSE
|____logstash-input-alioss.gemspec
|____Rakefile
|____README.md
|____spec
| |____inputs
| | |____alioss_spec.rb
```

# 2.安装使用 **jruby**
    
```shell
rvm install jruby-9.1.7.0
rvm use jruby-9.1.7.0 --default
```
    
# 3.安装 **bundler** 

```shell
gem install bundler
```

# 4.**gem** 安装 **aliyun-sdk**

```shell
gem install -v 0.3.6 aliyun-sdk
```

# 5.集成 **aliyun-sdk**，

编辑 _logstash-input-alioss.gemspec_，添加依赖

```shell
s.add_runtime_dependency 'aliyun-sdk', '~> 0.3.6'
```
    
# 6.打包工程 

```shell
bundle install
```

# 7.修改 _logstash/Gemfile_ 
    
```shell
echo 'gem "logstash-input-alioss", :path => "logstash-input-alioss绝对路径"' >> logstash路径/Gemfile
```
    
# 8.安装插件 
    
```shell
logstash-plugin install --no-verify
```

# 9.测试插件
    
```shell
logstash -e 'input { alioss { } } output { stdout {codec=>rubydebug} }'
```


