---
title: AndroidStudio Option 快捷键失效
categories: Chore
date: 2015-08-15 12:00:00
description: 疑难咋整了解一下~
---

问题由来
---
前些天把将 Mac 从 Yosemite 升级到 EI Capitan 后，Android Studio 和 IntelliJ IDEA中 option 快捷键 （按住 option + 任意字符）都失效了，只能输出一些特殊字符：

![Alt text](http://assets.septenary.cn/user/1/image/06847cc6-0dee-44f7-e981-6c912e878428)

<!--more-->

以 `（option + / ）`为例（博主从Eclipse转到AS 的，习惯了用 option + / ）， 在 AS 中配置 Key Map，在编辑器中键入快捷键时，本来因该是代码会自动提示，但却输出了 `÷`

![Alt text](http://assets.septenary.cn/user/1/image/60dbb31b-ed9f-4402-b03e-88c54a0a4605)


解决方法一
---
首先下载一个制作自定义输入法的工具 **Ukelele** ，
打开 **Ukelele** -> **File** -> **New From Current Input Source**  出现下面窗口

![Alt text](http://assets.septenary.cn/user/1/image/bf7fa070-9f16-404b-887d-a59127179fb3)

打开 **U.S.**

![Alt text](http://assets.septenary.cn/user/1/image/397a94ba-6055-4831-d724-ad6d5804d6ea)

按住 option 你会看到

![Alt text](http://assets.septenary.cn/user/1/image/fbf93aa6-6439-45b9-85b4-835b1babab97)

这里就是 **U.S.** 的默认键位映射，修改 `÷` 为 `/` 

然后 **File** -> **Save**(**File Formate** 选择 **Keyboard Layout** ) -> 保存文件到 **~/Library/Keyboard Layouts** 文件夹下 -> 打开输入法偏好设置 -> 添加 -> 其它 -> 选择并切换到该输入法, 你的 IDE 快捷键就会生效啦。


解决方法二（11月9日更新）
---
**V2EX** 有一同学讲到: [链接](http://www.v2ex.com/t/234678)
> 是 jdk 的问题， jdk7 之后就有这个问题，先试试新版（自带 jre 的），如果最后还是不行，可以换个映射，然后通过 karabiner 把之前的热键（ OPT+/）映射成新的热键

我的Mac上是 "java version 1.8.0_05" 最新版本，同样失效，看来最新JRE 并没有解决该问题，换映射并不习惯，用上面讲到的方法替换输入法也有局限性，那就试试替换成旧版JAVA的吧。

要了解一下 Android Studio 中的两种 JDK ，[戳这里](http://tools.android.com/tech-docs/configuration/osx-jdk) 官网有详细解释。
- **Project JDK** （编译项目工程使用的 JDK版本）
- **IDE JDK** （IDE使用的JDK版本）

知道了这些看来只需要更换 IDE 的 JDK 就能解决了，按照以下步骤：


1.下载旧版 [JAVA 6 下载链接](https://support.apple.com/kb/DL1572?locale=zh_CN) ,  退出所有使用JAVA 的应用程序进行安装

2.在终端中配置环境变量 `export STUDIO_JDK=/Library/Java/JavaVirtualMachines/1.6.0.jdk`

3.生效后,打开 Android Studio，IDE JDK 换成了1.6，快捷键 **option+/** 便生效了

 ![Alt text](http://assets.septenary.cn/user/1/image/2435861c-e7e1-408d-a40d-9378920fb8bb)