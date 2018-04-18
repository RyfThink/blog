---
title: Logstash 集成 aliyun/oss 插件
description:
date: 2017-03-24 12:00:00
category: undefined
tags: ELK
comments:
categories:
permalink:
---


# 安装使用 **jruby**
    
```shell
rvm install jruby-9.1.7.0
rvm use jruby-9.1.7.0 --default
```
    
# 安装 **bundler** 

```shell
gem install bundler
```

# 创建项目

用工具生成项目模板

```shell
logstash-plugin generate --type input --name alioss --path ./
```
    
当前目录下创建了一个名为 logstash-input-alioss 的工程，目录结构如下:
    
```shell
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
    
# 安装依赖

使用 **gem** 安装 **aliyun-sdk**、**snappy** 。注意: **aliyun-sdk** 并未使用最新版本，而是使用 0.3.6, 详情戳这里 [issue](https://github.com/aliyun/aliyun-oss-ruby-sdk/issues/40)

```shell
gem install -v 0.3.6 aliyun-sdk
gem install snappy
```

# 集成 **aliyun-sdk**

编辑 _logstash-input-alioss.gemspec_，添加依赖

```shell
s.add_runtime_dependency 'aliyun-sdk', '~> 0.3.6'
s.add_runtime_dependency 'snappy'
```

# 打包工程 

```shell
bundle install
```

# 安装插件

安装插件可以分成两种，开发模式、生产模式。参考[这里](https://github.com/Wondermall/logstash-input-google-cloud-pubsub)

## 1. 开发模式

修改 _logstash/Gemfile_ 
        
```shell
echo 'gem "logstash-input-alioss", :path => "logstash-input-alioss绝对路径"' >> logstash路径/Gemfile
```
        
命令行安装
        
```shell
logstash-plugin install --no-verify
```
    
## 2. 生产模式

执行下面命令，会在工程下生成 _logstash-input-alioss-0.1.0.gem_ 文件

```shell
gem build logstash-input-alioss.gemspec
```

命令行安装 (别急，这个过程可能会需要多等一会)

```shell
logstash-plugin install /path/to/logstash-input-alioss-0.1.0.gem
```

## 3. 检查插件是否安装成功

不论以上哪种方法，安装成功的话都会出现在列表中

```shell
logstash-plugin list --group input
```

# 编写配置文件 
_alioss.logstash.conf_
    
```ruby
input {
    alioss {
        endpoint => 'your endpoint'
        access_key_id => 'your access_key_id'
        access_key_secret => 'your access_key_secret'
        bucket => 'your bucket'
        interval => 60
        codec => json
    }
}

output {
    stdout {
        codec=>rubydebug
    }
}
```

# 测试插件
    
```shell
logstash -f alioss.logstash.conf
```

