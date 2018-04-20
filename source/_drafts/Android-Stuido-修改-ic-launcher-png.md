title: Android Stuido 修改 ic_launcher.png
date: 2015-07-12 16:10:10
categories:
- Android
tags:
- Android Studio
- ic_launcher.png
---

## 1.永久修改(修改模板)

进入路径：

> */Applications/Android Studio.app/Contents/plugins/android/lib/templates/gradle-projects/NewAndroidModule/root/res*

![Alt text](/imgs/as-ic-launcher-1.png)

<!--more-->

在每个 **mipmap-xxx** 文件夹中，把 **ic_launcher.png** 替换成你想要的同名图片文件，在 Android Studio 中新建一个工程，你会发现你的应用 icon 都变成了你自定义的图片了，如果没生效，重启 Android Studio 试试。

**Tips:**

1.这其实是替换了 **AndroidModule** 模板文件，你也可以替换其他模板文件，在Android Studio中建立对应 Module  ，同样会生效。下面是可以替换的模板

> - AndroidWearModule
> - NewAndroidAutoProject
> - NewAndroidModule
> - NewAndroidTVModule
> - NewGlassModule

2.一定要 **备份被替换的源文件** ，Android Studio 升级时，需要把原文件替换回去，因为安装Patch时会校验它们，如果不匹配是无法升级成功的。

***

## 2.即时修改(配置ImageAsset)
> 在 Android Studio 中 **File -> new -> ImageAsset**

![Alt text](/imgs/as-ic-launcher-2.png)
