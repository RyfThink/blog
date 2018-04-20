---
title: Android Studio 支持NDK的 实验插件
categories: Android
date: 2015-07-18 12:00:00
description: NDK 插件是啥，是不是写 c/c++ 代码就方便很多啦
---

# 实验插件是啥
在 Android Studio 1.3.0 中 Google 为支持NDK ，添加了 **实验插件 (experimental-plugin)** ，想要在 Android Studio 中完成 Native 的编译构建工作，就必须要用到该插件。

<font size="3" face="Aria" color="red">注意:</font> 该插件仍然处于实验阶段， 并非 Google 为在 Android Studio 上支持 NDK 开发的最终版本，将来可能还会改动。

# 使用该插件有三个要求
1. Gradle 版本必须是2.5
2. Andr​​oid NDK r10e
3. SDK build tool 19.0.0 以上

<!--more-->

# 实验插件和传统插件的异同

实验插件和传统插件有三处不同，接下来分别对每处不同进行比较。
## 1. /gradle/wrapper/gradle-wrapper.properties
该文件中有一属性`distributionUrl`，标识内置 **gradle** 版本 必须是 **2.5**

```groovy
distributionUrl=https\://services.gradle.org/distributions/gradle-2.5-bin.zip
```


## 2. project ==>/build.gradle
传统插件的构建脚本依赖 **classpath** 是 `com.android.tools.build:gradle:1.3.0`

```groovy
buildscript {
    repositories {
        jcenter()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:1.3.0'
    }
}
```

而实验插件 构建脚本指定的 **classpath** 却是 `com.android.tools.build:gradle-experimental:0.2.0`，目前实验插件最新版本是 **0.2.0**

```groovy
buildscript {
    repositories {
       jcenter()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle-experimental:0.2.0'
    }
}
```

## 3. module ==>/app/build.gradle

传统 build.gradle 脚本，大致结构是这样的:

```groovy
apply plugin: 'com.android.application'
android {
    compileSdkVersion 22
    buildToolsVersion "22.0.1"
    defaultConfig {
       ...
    }
    buildTypes {
        ...
    }
    productFlavors{
        ...
    }
}
dependencies {
    ...
}
```

然而对于实验插件， build.gradle 脚本却是下面这种格式:

```groovy
apply plugin: 'com.android.model.application'
model {
    android {
        compileSdkVersion = 22
        buildToolsVersion = "22.0.1"
        defaultConfig.with {
            ...
        }
    }
    android.ndk {
        ...
    }
    android.sources {
        ...
    }
    android.productFlavors {
        ...
    }
}
dependencies {
    ...
}
```

首先导入的插件是 `apply plugin: 'com.android.model.application'` ，然后所有配置由 **model** 模块包装，其中又嵌入了 **android、android.ndk 、android.sources、android.productFlavors** 等模块，项目依赖 **dependencies** 与 **model** 模块同级，接下来看一下各个模块的语法。

**android.ndk** 这个模块必须声明 **moduleName** ，构建时会以 **moduleName** 命名所需要生成的so库，所有对native的配置都在该模块下进行

```groovy
android.ndk {
    moduleName = "native"
    toolchain = "clang"
    toolchainVersion = "3.5"
    CFlags += "-DCUSTOM_DEFINE"
    cppFlags += "-DCUSTOM_DEFINE"
    ldFlags += "-L/custom/lib/path"
    ldLibs += "log"
    stl = "stlport_static"
}
```

**android.sources** 配置 **JNI** 源代码路径

```groovy
android.sources {
    main {
        java {
            source {
                srcDirs 'src/main/jni'
            }
        }
    }
}
```

**android.productFlavors** 配置构建项目时需要生成的不同平台 **abi** 的 **so** 库

```groovy
android.productFlavors {
    create ("arm7") {
        ndk.abiFilters += "armeabi-v7a"
    }
    create ("arm8") {
        ndk.abiFilters += "arm64-v8a"
    }
    create ("x86-32") {
        ndk.abiFilters += "x86"
    }
    // all 表示生成所有平台的 so 库
    create("all")
}
```

**android** 这个模块和上述的其他模块 ，我们看到所有属性的配置都改用 `=` 号连接，其中又嵌套了 **defaultConfig** 模块，同样用 `=` 号配置

```groovy
android {
    compileSdkVersion = 22
    buildToolsVersion = "22.0.1"
    defaultConfig.with {
        applicationId = "com.sample.teapot"
        minSdkVersion.apiLevel = 17
        targetSdkVersion.apiLevel = 21
    }
}
```

## 4.Samples
关于 Android Studio 上开发 JNI ,  有很多官方提供的例子，[戳这里Github](https://github.com/googlesamples/android-ndk)