---
title: 再谈LruCache
description:
date: 2015-06-08 12:00:00
category: undefined
tags: Android Java
comments:
categories:
permalink:
---


# Java中的LRU

最近最久未使用（**LRU**）算法是一种很常用的内存管理方式，为实现该算法，有两方面要做：

1. **实现最近使用：**
可以用链表完成，在使用链表时将最近索引到的元素从当前位置移除然后放置在链表头部，这样最久未使用的就被逐渐移到了链表尾部

2. **实现快速检索:**
想要快速的检索到对应元素可以 通过哈希表完成,通过key值查找到对应的value

JDK中强大的 **Collection** 向我们提供的 `LinkedHashMap` 满足以上两种需求。

<!--more-->

###LruCache 的使用

Anroid中对内存的管理，在早期有一种较为常见的缓存实现，用 **软引用** 或 **弱引用** (  `SoftReference` or `WeakReference` )存储在 `Map` 中，然而在 **API 9** 之后，**Dalvik** 的内存回收机制做了改变，非强引用的对象很容易被GC清理。

`LruCache` 则顺势而生，它的使用场景大部分都是缓存 `Bimtap` 时用到的，（用以保证内存合理、有效的使用），下面是 `LruCache` 的简单使用

``` java
// 初始化LruCache
private void initCache(Context context) {
    // 系统可用内存的1/4
    int memClass = ((ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE)).getMemoryClass();
    int cacheSize = 1024 * 1024 * memClass / 4;
    mCache = new LruCache<String, Bitmap>(cacheSize) {
        @Override
        protected int sizeOf(String key, Bitmap value) {
            // 一张位图所占内存大小
            return value.getRowBytes() * value.getHeight();
        }
        
        @Override
        protected void entryRemoved(boolean evicted, String key, Bitmap oldValue, Bitmap newValue) {
        super.entryRemoved(evicted, key, oldValue, newValue);
        // 回收最久未使用的bitmap
        if (oldValue != null) {
            oldValue.recycle();
        } 
    }
}

//存放数据
private void putBitmap(String key,Bitmap bmp){
     mCache.put(key,bitmap);
}
//访问
private Bitmap getBitmap(String key){
     Bitmap bmp = mCache.get(key);
     return bmp;
}
```

# LrcCache 简单分析

接下来介绍下 `LruCache` 的几段重要代码
`LruCache` 的构造器:

``` java
public LruCache(int maxSize) {
        if (maxSize <= 0) {
            throw new IllegalArgumentException("maxSize <= 0");
        }
        this.maxSize = maxSize;
        // 初始化一个LinkedHashMap实例，所有元素都存在这个map中
        this.map = new LinkedHashMap<K, V>(0, 0.75f, true);
}
```

构造器中实际上初始化了一个 `LinkedHashMap` ，接下来所有元素操作(存储和索引)都是基于该 map 进行的

我们再来看下LruCache的

-  get方法
  
``` java
public final V get(K key) {
    ......
    V mapValue;
    synchronized (this) {
        // 从map中获取元素   
        mapValue = map.get(key);
        if (mapValue != null) {
            hitCount++;
            return mapValue;
        }
         missCount++;
    }
    // 未命中尝试创建一个value
    V createdValue = create(key);
    ......
    // 添加到map中
    synchronized (this) {
            createCount++;
            mapValue = map.put(key, createdValue);
            ......
        }
    }
```

- put方法

```java
public final V put(K key, V value) {
    ......
    V previous;
    synchronized (this) {
        putCount++;
        size += safeSizeOf(key, value);
        previous = map.put(key, value);
        if (previous != null) {
            size -= safeSizeOf(key, previous);
        }
    }
    .....
    // 重新计算内存占用情况
    trimToSize(maxSize);
    return previous;
}
```
 其中`trimToSize(maxSize) `这个方法实现了内存大小的控制

```java
// 重新计算集合元素大小
public void trimToSize(int maxSize) {
    while (true) {
        K key;
        V value;
        synchronized (this) {
            ......
            // 从map中取得最久未被使用的元素
            Map.Entry<K, V> toEvict = map.eldest();
            ......
            key = toEvict.getKey();
            //从map中移除，并重新计算总大小，直到小余maxSize为止
            map.remove(key);
            size -= safeSizeOf(key, value);
            ......
            }
        }
    } 
```
那么问题来了，为什么 执行 `get` 的时候 **map** 中的元素就被重新排列了， **eldest** 元素又是如何给出的呢， 原因都在 `LinkedHashMap` 



# LruCache 的发动机

`LinkedHashMap` 实现了 **LRU算法** ， 它是在 `LruCache` 的构造器中初始化的

```java
this.map = new LinkedHashMap<K, V>(0, 0.75f, true);
```
		
所有数据都存储在这个 **map** 中
注意初始化  `LinkedHashMap` 的第三个参数 `accessOrder` 
- *true*  随机访问重新排序
- *false*  插入元素时重新排序

它决定了如何 控制 **map** 的 **ordering**

在来看下LinkedHashMap的源码，其中声明了一个常量 **header**

```java
/ **
* A dummy entry in the circular linked list of entries in the map.
* The first real entry is header.nxt, and the last is header.prv.
* If the map is empty, header.nxt == header && header.prv == header.
*/
transient LinkedEntry<K, V> header;
```

这个header记录了链表的首位元素


我们看下对 **map** 进行操作的几个方法

- 添加元素时，**relink**

```java
@Override 
void addNewEntry(K key, V value, int hash, int index) {
        LinkedEntry<K, V> header = this.header;
        ...
        // 对header首尾元素的指针重新指向
        LinkedEntry<K, V> oldTail = header.prv;
        LinkedEntry<K, V> newTail = new LinkedEntry<K,V>(
                key, value, hash, table[index], header, oldTail);
        table[index] = oldTail.nxt = header.prv = newTail;
}
```
 
 - 删除元素时，**relink**
```java
@Override void postRemove(HashMapEntry<K, V> e) {
        // 对header首尾元素的指针重新指向
        LinkedEntry<K, V> le = (LinkedEntry<K, V>) e;
        le.prv.nxt = le.nxt;
        le.nxt.prv = le.prv;
        le.nxt = le.prv = null; // Help the GC (for performance)
}
```


访问元素, `accessOrder` 判断是否调用 `makeTail()` 方法
```java
@Override public V get(Object key) {
        ...
        int hash = secondaryHash(key);
        HashMapEntry<K, V>[] tab = table;
        for (HashMapEntry<K, V> e = tab[hash & (tab.length - 1)];
                e != null; e = e.next) {
            K eKey = e.key;
            if (eKey == key || (e.hash == hash && key.equals(eKey))) {
                if (accessOrder)
                    makeTail((LinkedEntry<K, V>) e);
                return e.value;
            }
        }
        return null;
    }
```

就是这个 `makeTail()` 方法控制了从 **map** 中访问数据时 `header` 的指针 被重置

```java
@Override public V get(Object key) {
/ **
  * Relinks the given entry to the tail of the list. Under access ordering,
  * this method is invoked whenever the value of a  pre-existing entry is
  * read by Map.get or modified by Map.put.
  */
    private void makeTail(LinkedEntry<K, V> e) {
        // Unlink e
        e.prv.nxt = e.nxt;
        e.nxt.prv = e.prv;
        // Relink e as tail
        LinkedEntry<K, V> header = this.header;
        LinkedEntry<K, V> oldTail = header.prv;
        e.nxt = header;
        e.prv = oldTail;
        oldTail.nxt = header.prv = e;
        modCount++;
    }
```

对 **map** 的所有操作都会改变 `header` 的指针，这样我们就可以知道 **eldest** 的那个元素是谁了, 这也证明了 `LruCache` 的 **LRU** 算法实现 由 `LinkedHashMap` 完成
