---
title: 关于应用程序的初始化代码在哪里配置的问题
tags:
  - App init
categories: 它山之石
date: 2015-07-25 14:40:54
---


讨论一下 Android 程序中初始化问题

<!--more-->

问题由来
---

我有这样一段代码在应用程序中:

应用启动时，所有代码只运行一次，有一部分代码会周期性的运行，而且有可能会阻塞UI线程，用什么方法解决比较合适呢？


主 Activity 的 onCreate 方法中
---
这是执行初始化代码最简单的地方，却也会导致一些问题，代码在UI线程中运行，用 **AsyncTask** 可以解决这个问题，但视图和应用的逻辑也需要在初始化完成后继续执行，显然在 **onCreate** 方法中不太合适。

启动 Activity 的 onCreate 方法中
---
解决上面的问题，可以用欢迎界面 (Splash Activity) 执行初始化，在一切准备完成后再去启动主**Activity**，但现在的问题是，这段代码只需要运行一次，如果用户旋转屏幕，**Activity** 销毁后又重新创建，用户重新回到启动界面，**onCreate** 又被执行一遍，虽然可以用一个静态变量标识，但这种方式看起来也不怎么好。

Application 的 onCreate 方法中
---
在这里做，可以真正的让代码只执行一次，可是仍然在 UI 线程中，用户第一次启动的应用的时候可能会看到黑屏界面，所以这种方式仍然有问题

Application 的 onCreate 中调用 AsyncTask
---
我们知道，比较好的方式是后台线程异步执行一次初始化操作，但是有部分代码是要定期执行的，除此之外，还需要一种方式通信，告诉启动界面初始化完成，销毁自己并启动主 **Activity**

Service 中
---
在服务中执行初始化操作，首先在 Application onCreate  中启动服务，然后用 ScheduledExecutor 执行定期任务，如果是用 IntentService 可以在 Intent Extras 中传递 flags ，然后用 LocalBroadcastManager 告诉 UI 初始化完成。

Final Answer 
---
大概的流程是这样子的:
* 在 Application 派生类的 onCreate 中:
    - 启动 Service ，用 flags 传递 告诉 Service 执行 初始化代码
    - 用 Executor 定期执行任务
* SplashActivity 启动并等待消息
* Service 向 SplashActivity 发送初始化完成的消息
* SplashActivity 接收消息后，销毁自己，启动 MainAcitivty
* 每隔一段时间，服务执行周期任务

[**原文链接**](http://innodroid.com/blog/post/where-to-put-android-app-init-code/)