---
title: 深入理解 Android Package Manager 与 Package Installer
tags:
  - Package Manager
  - Package Installer
categories: 它山之石
date: 2015-12-20 15:14:34
---

我们总是在安装、卸载apk，然而对于以下几个问题，你知道如何解答吗?

1. Package Manager 和 Package Installer 都是什么？
2. 在 Android 中 APK 文件存储在哪里？
3. 你知道 APK 安装的具体步骤吗？
4. Package Manager 是如何存储数据的？
5. 在哪里可以找到 Package Manager 和 PackageInstaller 的源码？

<!--more-->


什么是 Package Manager、Package Installer?
---
`PackageInstaller` 是安装普通应用的默认系统应用，它提供了一个接口来管理应用包，并调用 `InstallAppProgress` Activity 来接收用户指令，`InstallAppProgress` 会访问  **Package Manager Service** 查看包安装信息，可以在 `<Android Source>/packages/apps/PackageInstaller` 找到源码

Package Manager 实际上是管理应用安装、卸载的一个 API，当我们安装 APK 文件时，Package Manager 会解析 APK 文件来显示一些应用信息。当按下 OK 键时，Package Manager 调用方法 `installPackage（）`  并传递四个参数 : 

- uri
- installFlags
- observer
- installPackageName

此时，Package Manager 会开启一个名为 **package** 的服务，其它任务都由这个服务来完成。在  PackageInstaller 的源码中，可以查看 **PackageInstallerActivity.java** 和 **InstallAppProgress.java** 这两个类，系统在启动时，会将 Package Manager Service 运行在系统进程中，而安装行为则由原生进程（native process）执行。

***

Where are APK Files Stored in Android?
---
- a. 预装应用 （相机、日历、浏览器等）APK 存储在 `/system/app/`
- b. 用户应用（微博、微信等）APK 存储在 `/data/app/`
- c. Package Manager 会为每个应用创建一个目录 `/data/data/<package-name>/` 来存储数据库数据，shared preference 数据，本地库（native lib）和 缓存数据。

You might see an apk file and *.odex file for the same APK. The ODEX file is totally a different discussion and purpose.

***

APK 安装内幕
---
以下介绍了 Package Manager Service 具体执行步骤
- 等待
- 将一个 package 添加到安装队列
- 确定应用安装的合适位置
- 确定是安装还是更新
- 将 apk 拷贝到指定路径下
- 给 app 分配 UID
- 请求安装进程
- 创建应用程序的目录，设置权限
- 解压dex文件到缓存路径
- 列出包的具体信息并映射到 `/system/data/packages.xml` 中，// To reflect and packages.list / system / data / packages.xml the latest status 
- 广播安装进度 `Intent.ACTION_PACKAGE_ADDED` 或 `Intent.ACTION_PACKAGE_REPLACED`

![安装步骤](/imgs/post-151221-1.png)

***

Package Manager 如何存储数据?
---

Package Manager 将应用信息存储在 `/data/system` 文件夹下的三个文件中，以 Android 4.0 Ice Cream Sandwich 模拟器镜像为例：

### 1. packages.xml 
该文件列出了所有包的权限

```xml
<packages>
<last-platform-version external="15" internal="15">
<permission-trees>
<permissions>
<item name="android.permission.CHANGE_WIFI_MULTICAST_STATE" package="android" protection="1">
<item name="android.permission.CLEAR_APP_USER_DATA" package="android" protection="2">
...
</item></item></permissions>

<package codepath="/system/app/Contacts.apk" flags="1" ft="136567b3990" it="136567b3990" name="com.android.contacts" nativelibrarypath="/data/data/com.android.contacts/lib" shareduserid="10001" ut="136567b3990" version="15">
<sigs count="1">
<cert index="2">
</cert></sigs>
</package>

... 

<package codepath="/data/app/com.project.t2i-2.apk" flags="0" ft="13a837c2068" it="13a83704ea3" name="com.project.t2i" nativelibrarypath="/data/data/com.project.t2i/lib" userid="10040" ut="13a837c2ecb" version="1">
<sigs count="1">
<cert index="3" key="308201e530820...c5c7a">
</cert></sigs>
<perms>
<item name="android.permission.WRITE_EXTERNAL_STORAGE">
</item></perms>
</package>

...

</permission-trees></last-platform-version></packages>
```

这个 XML 文件存储了两类数据:
 
#### a.permission
permission 存储在 `<permissions>` 标签下，每个 **permission** 有三个属性：
- **name**  我们在 AndroidManifest.xml 中用到的权限名
- **package**  指明权限所属，大部分情况下都是默认值 **android**
- **protection**  指定权限安全等级


#### b.packages(application)
packages 标签下有10个属性和一些子属性

| 序      |     属性名   |   描述   |
| :-------- | :-------- | :------ |
|1  |name|  package name|
|2  |codePath|  APK 文件的安装位置 (`/system/app/` 或 `/data/app/`)|
|3  |nativeLibraryPath| 本地库 (*.so 文件)路径， 默认路径是 `/data/data/<package name>/lib/`
|4  |flag|  ApplicationInfo Flags [参考更多](http://developer.android.com/reference/android/content/pm/ApplicationInfo.html)|
|5  |ft|    hex 格式的时间戳 |
|6  |lt|    首次安装时间戳，hex 格式 |
|7  |ut|    最后更新时间戳，hex 格式 |
|8  |version| AndroidManifest.xml文件中的 Version Code [参考更多](http://developer.android.com/guide/topics/manifest/manifest-element.html#vcode)|
|9  |sharedUserId|它会与其他有相同 sharedUserID 的程序共享数据，这个 id 与我们在 AndroidManifest 中定义 sharedUserID 的相同 [参考更多](http://developer.android.com/guide/topics/manifest/manifest-element.html#uid)|
|10 |userId |Linux用户ID|

**子属性**

-  **sigs**  签名信息, count 属性代表证书标签数量
-  **cert**  全球认证证书
-  **perms**  发行许可

### 2. packages.list 
简单的文本文件，列出了 **package name**、**user id**、**flag** 和 **data** 路径（我并没有找到比较完美的描述，但我猜想 **packages.list** 只保留一些重要的信息，是为了用来快速检索）

```xml
com.android.launcher 10013 0 /data/data/com.android.launcher
com.android.quicksearchbox 10033 0 /data/data/com.android.quicksearchbox
com.android.contacts 10001 0 /data/data/com.android.contacts
com.android.inputmethod.latin 10006 0 /data/data/com.android.inputmethod.latin
```

### 3. packages-stoped.xml 
这个文件列出了哪些 package 是 stopped 状态，stopped 状态的应用程序不会接收到任何广播  [参考更多](http://droidyue.com/blog/2014/01/04/package-stop-state-since-android-3-dot-1/)


```xml
<stopped-packages>
<pkg name="com.android.widgetpreview" nl="1"></pkg>
<pkg name="com.example.android.livecubes" nl="1"></pkg>
<pkg name="com.android.gesture.builder" nl="1"></pkg>
<pkg name="com.example.android.softkeyboard" nl="1"></pkg>
</stopped-packages>
```

***

Where I Can Find the Source Code of Package Manager and Package Installer?
---
**Package Manager**
- [frameworks/base/services/java/com/android/server/pm/Settings.java](https://android.googlesource.com/platform/frameworks/base/+/483f3b06ea84440a082e21b68ec2c2e54046f5a6/services/java/com/android/server/pm/Settings.java)
- [frameworks/base/services/java/com/android/server/pm/PackageManagerService.java](https://android.googlesource.com/platform/frameworks/base/+/483f3b06ea84440a082e21b68ec2c2e54046f5a6/services/java/com/android/server/pm/PackageManagerService.java)
- [frameworks/base/services/java/com/android/server/pm/IPackageManager.aidl](https://android.googlesource.com/platform/frameworks/base/+/483f3b06ea84440a082e21b68ec2c2e54046f5a6/core/java/android/content/pm/IPackageManager.aidl)
- [frameworks/base/services/java/com/android/server/pm/PackageSignatures.java](https://android.googlesource.com/platform/frameworks/base/+/483f3b06ea84440a082e21b68ec2c2e54046f5a6/services/java/com/android/server/pm/PackageSignatures.java)
- [frameworks/base/services/java/com/android/server/pm/PreferredActivity.java](https://android.googlesource.com/platform/frameworks/base/+/483f3b06ea84440a082e21b68ec2c2e54046f5a6/services/java/com/android/server/pm/PreferredActivity.java)
- [frameworks/services/java/com/android/server/PreferredComponent.java](https://android.googlesource.com/platform/frameworks/base/+/483f3b06ea84440a082e21b68ec2c2e54046f5a6/services/java/com/android/server/PreferredComponent.java)
- [frameworks/core/java/android/content/IntentFilter.java](https://android.googlesource.com/platform/frameworks/base/+/483f3b06ea84440a082e21b68ec2c2e54046f5a6/core/java/android/content/IntentFilter.java)
- [frameworks/base/core/java/android/content/pm/PackageParser.java](https://android.googlesource.com/platform/frameworks/base/+/483f3b06ea84440a082e21b68ec2c2e54046f5a6/core/java/android/content/pm/PackageParser.java)
- [frameworks/base/services/java/com/android/server/pm/Installer.java](https://android.googlesource.com/platform/frameworks/base/+/483f3b06ea84440a082e21b68ec2c2e54046f5a6/services/java/com/android/server/pm/Installer.java)
- [frameworks/base/core/java/com/android/internal/app/IMediaContainerService.aidl](https://android.googlesource.com/platform/frameworks/base/+/483f3b06ea84440a082e21b68ec2c2e54046f5a6/core/java/com/android/internal/app/IMediaContainerService.aidl)
- [frameworks/base/packages/DefaultContainerService/src/com/android/defcontainer/DefaultContainerService.java](https://android.googlesource.com/platform/frameworks/base/+/483f3b06ea84440a082e21b68ec2c2e54046f5a6/packages/DefaultContainerService/src/com/android/defcontainer/DefaultContainerService.java)

**Package Installer**
- [packages/apps/PackageInstaller/src/com/android/packageinstaller/PackageInstallerActivity.java](https://android.googlesource.com/platform/packages/apps/PackageInstaller/+/47fe118e0178e9d72c98073ff588ee5cf353258e/src/com/android/packageinstaller/PackageInstallerActivity.java)
- [packages/apps/PackageInstaller/src/com/android/packageinstaller/PackageUtil.java](https://android.googlesource.com/platform/packages/apps/PackageInstaller/+/47fe118e0178e9d72c98073ff588ee5cf353258e/src/com/android/packageinstaller/PackageUtil.java)
- [packages/apps/PackageInstaller/src/com/android/packageinstaller/InstallAppProgress.java](https://android.googlesource.com/platform/packages/apps/PackageInstaller/+/47fe118e0178e9d72c98073ff588ee5cf353258e/src/com/android/packageinstaller/InstallAppProgress.java)



[原文链接](https://dzone.com/articles/depth-android-package-manager)
