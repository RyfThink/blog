---
title: Android 异步处理队列消息分析
categories: Android
date: 2016-01-09 12:00:00
tags:
description:
---


试想我们有一连串的异步任务需要交给工作线程来做，这种 **“生产者消费者模式”** 可以通过传统 Java API 的 `BlockingQueue` 来实现，也可以用 Android API 提供的 `Handler` 和 `Looper` 来实现，我来简单分析下~

<!--more-->

****

Blocking Queue
===
`BlockingQueue` 是线程安全的阻塞队列，开启多个线程可以同时竞争 `BlockingQueue` 的资源而不用担心并发导致的死锁问题，以 **Volley** 分发网络请求的的源代码为例，讲解一下 `BlockingQueue` 的使用

1. 声明一个处理异步任务的线程 `NetworkDispatcher`，在其构造器中，传递一个 `BlockingQueue<Request<?>>` 参数，

    ```java
    public class NetworkDispatcher extends Thread {
        public NetworkDispatcher(BlockingQueue<Request<?>> queue,Network network, Cache cache,ResponseDelivery delivery) {
            mQueue = queue;
            ...
        }
    }
    ```

2. `run()` 方法中定义一个死循环不断的从队列中拿数据并进行处理

    ```java
    public void run() {
        while(true) {
            request = (Request)this.mQueue.take();
            try {
                    // Take a request from the queue.
                    request = mQueue.take();
                } catch (InterruptedException e) {
                    if (mQuit) {
                        return;
                    }
                continue;
            }
            NetworkResponse resonse = this.mNetwork.performRequest(request);
            ...
        }
    }        
    ```

3. 执行完所有的异步任务需要停止线程，释放资源，这里需要用到线程的中断操作，此时 `mQueue` 会抛出 `InterruptedException` 异常，从而使线程结束运行

    ```java
    public void quit() {
        mQuit = true;
        interrupt();
    }
    ```

4. 定义 **length** 个 `NetworkDispatcher` 实例，将一个阻塞队列 `mNetworkQueue`分别传递给他们的构造函数，让工作线程竞争队列资源并执行接下来的请求

    ```java
    // Create network dispatchers (and corresponding threads) up to the pool size.
    for (int i = 0; i < mDispatchers.length; i++) {
        NetworkDispatcher networkDispatcher = new NetworkDispatcher(mNetworkQueue, mNetwork,
                mCache, mDelivery);
        mDispatchers[i] = networkDispatcher;
        networkDispatcher.start();
    }
    ```

**Volley** 的网络请求的分发基本上就是这样实现的，用多个线程处理同一个队列的消息，优先考虑用 `BlockingQueue`  来实现，这种方式是 **1 对 N** 的处理方式

****

Handler & Looper
===
有一种应用场景：我们要将用户的按键操作用日志形式记录下来，考虑的文件的写操作，需要用异步完成，而记录按键操作则是将一连串的 **KeyEvent**  交给异步线程来做，用上面讲到的 `BlockingQueue` 是可以实现的，但在这里我介绍一下 `Handler & Looper` 是如何帮助我们实现的。

我们知道 `Handler` 和 `Looper` 是 **Android API** 提供的类，创建一个支持 `Handler` 的异步线程代码如下：

```java
public class MyThread extends Thread {
    public Handler mHandler;
    
    public void run () {
        Looper.prepare();
        Process.setThreadPriority(mPriority);
        Looper.loop();
    }
    
    public Handler getHandler(){
        if (!isAlive()) {
            return null;
        }
        if(mHandler == null){
            mHandler = new Handler(Looper.myLooper());      
        }
        return mHandler;
    }
}
```

想要向 `MyThread` 发送消息，只需要调用 `getHandler().sendMessage()` 就可以，处理完所有消息后仍需要终止线程，释放资源：

```java
public void quit() {
    Looper looper = getLooper();
    if (looper != null) {
        looper.quit();

    }
}   
```

实际上 **Android API** 已经封装了类似的线程 `android.os.HandlerThread`，它可以帮助我们很好地异步处理队列消息。我们可以将 **Handler** 交给其它 N 个线程来发送消息，最后由有 `HandlerThread` 消化处理，这是一种 **N 对 1** 的方式。

**根据不同的应用场景来选择以上哪种实现方式是我们应该关注的。**