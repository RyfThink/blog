---
title: WeakHandler 技术分析
description:
date: 2015-08-07 12:00:00
category: undefined
tags: Android
comments:
categories:
permalink:
---


# Handler 导致的 Context Leak
先看下面这段代码

```java
public class SampleActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Post a message and delay its execution for 10 minutes.
        new Handler().postDelayed(new Runnable() {
            @Override
            public void run() { /* ... */ }
        }, 1000 * 60 * 10);
        // Go back to the previous Activity.
        finish();
    }
}
```

<!--more-->

Android Lint 会提示我们内存泄露风险
> in Android, Handler classes should be static or leaks might occur.

代码中，在 Activity 的 onCreate 方法里创建了一个 Handler，然后延时执行一个消息，在这段延时时间内，如果 Activity 销毁，会导致 Activity 的泄露，原因在于 Handler 将消息提交到 MessageQueue 中，而 MessageQueue 是跟随 App 整个生命周期存在的，这个匿名 Runnable 却隐式的持有了 Activity 的引用，从而导致了内存泄露。

关于更多 Context Leak 的详细内容，可以查看这个连接 [How to Leak a Context](http://www.androiddesignpatterns.com/2013/01/inner-class-handler-memory-leak.html)

文中的解决方案是用 WeakReference 来包装 Activity，这种方式可以解决 Context 的泄露，但是在实际开发中，每个的 Handler 都要用 WeakReference 来包装，略显臃肿。

<!-- more -->

# 用 WeakHandler 替换 Handler

WeakHandler 的[源码](https://github.com/badoo/android-weak-handler)托管在 Github 上，我们来具体分析一下 WeakHandler 是如何解决 MemoryLeak 的。

WeakHandler 并没有继承自 Handler , 而是定义了一个静态内部类 ExecHandler，所有的消息发送都是由 ExecHandler 接管的，下面是 ExecHandler 的实现

```java
private static class ExecHandler extends Handler {
    private final WeakReference<Handler.Callback> mCallback;

    ExecHandler() {
        mCallback = null;
    }

    ExecHandler(WeakReference<Handler.Callback> callback) {
        mCallback = callback;
    }

    ExecHandler(Looper looper) {
        super(looper);
        mCallback = null;
    }

    ExecHandler(Looper looper, WeakReference<Handler.Callback> callback) {
        super(looper);
        mCallback = callback;
    }

    @Override
    public void handleMessage(@NonNull Message msg) {
        if (mCallback == null) {
            return;
        }
        final Handler.Callback callback = mCallback.get();
        if (callback == null) { // Already disposed
            return;
        }
        callback.handleMessage(msg);
    }
}
```

ExecHandler 用弱引用 WeakReference 包装了 Handler.Callback , 而 Handler.Callback 则是由 WeakHandler 传入的，通过它解决了 Handler.Callback 的 leak  风险 。

我们知道用 Handler 发送消息有两种方式，接下来分别来看下 WeakHandler 是如何实现的。

## sendMessage(Message)
当我们用 WeakHandler 发送消息时，实际上调用了 ExecHandler 的 sendMessage(...) 方法
```java
public final boolean sendMessage(Message msg) {
    return mExec.sendMessage(msg);
}
```
处理消息时需要实现 Handler.Callback  接口的 handleMessage(Message) 方法，然后在 WeakHandler 构造器中传入 。

## post(Runnable)
看一下 WeakHandler 的 post 方法
```java
public final boolean postDelayed(Runnable r, long delay) {
    return mExec.postDelayed(wrapRunnable(r), delay);
}
```
同样是由 ExecHandler 处理的，但 Runnable 被 `wrapRunnable(r)` 包装了一下 

```java
private WeakRunnable wrapRunnable(@NonNull Runnable r) {
    ...
    final ChainedRef hardRef = new ChainedRef(mLock, r);
    mRunnables.insertAfter(hardRef);
    return hardRef.wrapper;
}
```

mRunnables 维护了一个简单的双向链表，用 ChainedRef 代表链表节点，插入到 mRunnables 的链表中，下面是 ChainedRef 的代码

```java
static class ChainedRef {
    @Nullable
    ChainedRef next;
    @Nullable
    ChainedRef prev;
    @NonNull
    final Runnable runnable;
    @NonNull
    final WeakRunnable wrapper;

    @NonNull
    Lock lock;

    public ChainedRef(@NonNull Lock lock, @NonNull Runnable r) {
        this.runnable = r;
        this.lock = lock;
        this.wrapper = new WeakRunnable(new WeakReference<>(r), new WeakReference<>(this));
    }

    public WeakRunnable remove() {
        lock.lock();
        try {
            if (prev != null) {
                prev.next = next;
            }
            if (next != null) {
                next.prev = prev;
            }
            prev = null;
            next = null;
        } finally {
            lock.unlock();
        }
        return wrapper;
    }

    public void insertAfter(@NonNull ChainedRef candidate) {
        lock.lock();
        try {
            if (this.next != null) {
                this.next.prev = candidate;
            }

            candidate.next = this.next;
            this.next = candidate;
            candidate.prev = this;
        } finally {
            lock.unlock();
        }
    }

    @Nullable
    public WeakRunnable remove(Runnable obj) {
        lock.lock();
        try {
            ChainedRef curr = this.next; // Skipping head
            while (curr != null) {
                if (curr.runnable == obj) { // We do comparison exactly how Handler does inside
                    return curr.remove();
                }
                curr = curr.next;
            }
        } finally {
            lock.unlock();
        }
        return null;
    }
}
```

ChainedRef 的构造器中用 WeakReference 将 Runnable 包装在 WeakRunnable 中避免了 leak 的风险, 当我们像Handler.removeCallback() 那样移除回调时，除了移除 ExecHandler 中的 WeakRunnable ，也要把链表中的 Runnable 移除掉。

```java
/**
 * Remove any pending posts of Runnable r that are in the message queue.
 */
public final void removeCallbacks(Runnable r) {
    final WeakRunnable runnable = mRunnables.remove(r);
    if (runnable != null) {
        mExec.removeCallbacks(runnable);
    }
}
```

## WeakHandler 的缺点
上面介绍的 WeakHandler 的实现可以看到，想要处理 handleMessage() 只能由 Handler.Callback 传入 WeakHandler 的构造器中,与 Handler 的实现相比没有那么灵活 (Handler 的构造器可以传递 Handler.Callback ，也可以按照下面的方法实现)，并且 WeakHandler 中并且没有实现 obtainMessage() 

android.os.Handler 的实现:

```java
new Handler(){
    @override
    public void handleMessage(Message msg){
        
    }
}.sendEmptyMessage(0);
```

WeakHandler 的实现:

```java
Handler.Callback mCallback = new Handler.Callback (){
    @override
    public void handleMessage(Message msg){
        
    }
} 
WeakHandler mHandler = new WeakHandler(mCallback);
```

# 优化后的 WeakHandler

1. 改写 ExecHandler

```java
private static class ExecHandler extends Handler {
    private final WeakReference<WeakHandler> mBase;

    ExecHandler(WeakHandler base) {
        super();
        mBase = new WeakReference<>(base);
    }

    ExecHandler(WeakHandler base, Looper looper) {
        super(looper);
        mBase = new WeakReference<>(base);
    }

    @Override
    public void handleMessage(@NonNull Message msg) {
        WeakHandler base = mBase.get();
        if (base != null) {
            if (base.mCallback != null) {
                base.mCallback.handleMessage(msg);
            } else {
                base.handleMessage(msg);
            }
        }
    }
}
```

在 ExecHandler 的构造器中将 WeakHandler 用软引用包装

2. 添加 obtainMessage() 函数

```java
public final Message obtainMessage() {
    return mExec.obtainMessage();
}
```

通过这两处优化，使得 WeakHandler 的用法与 android.os.Handler 的用法完全一致了, Handler 怎么用，WeakHandler 就怎么用, 
同时也不用担心 MemoryLeak 啦~ ：)

```java
new WeakHandler(){
    @override
    public void handleMessage(Message msg){
        
    }
}.sendEmptyMessage(0);
```

最后附上优化后的 WeakHandler [源码](https://github.com/Ryfthink/android-weak-handler)