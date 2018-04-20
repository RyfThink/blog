---
title: Android 盒子适配解决办法汇总
date: 2015-12-10 12:00:00
description:
categories: Android
tags: Android
---

虽然现在大部分盒子和智能电视都是1080P或720P的分辨率，但考虑到有些山寨厂商的分辨率并没有按照标准执行，我们通常用 dp 在不同分辨率上做的适配方案所达到的适配效果在部分盒子上并不理想，而且工程量也大。这就产生了怎么样做好一次布局，多处适配的方案。下面分别介绍一下我收集到的三种适配方案，以及各自的优劣之处。

<!--more-->

## 集中适配 LayoutCompat

设计师通常会按照某一特定分辨率进行UI设计，以 **1920x1080** 的标注图为例，在 **res/layout** 文件夹下创建UI视图，参照标注图的尺寸，所有UI视图都按照 **像素px** 为单位配置 （ TextView 的 textSize也不例外）。

写好了所有的 **layout.xml** 布局后，要介绍一下 `LayoutCompat` 这个工具类的使用。`LayoutCompat` 首先按照当前设备的分辨率 与 **1920x1080** 比较计算出一个缩放因子 `scaleFactor`，然后遍历根视图下所有子View，按照 `scaleFactor` 重新计算子View的 `LayoutParams`, `padding`, `margin`, `textSize` 等等，然后重新配置给子View。你只需要在 `Activity` 中调用 `setContent()` 后执行下面语句，就完成了所有设备的适配工作。

```java
LayoutCompat.init(this);
LayoutCompat.L1080P.compat(this);
```

其中静态常量 `L1080P` 是 `LayoutComat` 预设好的设计方案，如果是按照其他分辨率的标准设计，以 **1280x720** 为例，可以这样写：

```java
LayoutCompat.init(this);
LayoutCompat.obtain(1280,720).compat(this);
```

下面介绍一下 `LayoutCompat` 工具类部分核心代码，获取源代码，戳这里[Github源码](https://github.com/Ryfthink/LayoutCompat)找到它

计算缩放因子 

```java
private float baseScale() {
    return sBaseScaleByW ? (1f * sScreenSize.x / mDesignWidth) : (1f * sScreenSize.y / mDesignHeight);
}
```

适配Activity

```java
public void compatActivity(Activity activity) {
    // 找到Activity 的 rootView进行适配
    compatViewImpl(activity.findViewById(android.R.id.content));
}
```

适配View

```java
public void compatViewImpl(View view){
    if (view == null) {
         return;
    }
    if (sScreenSize == null || sScreenSize.x == 0 || sScreenSize.y == 0) {
        init(view.getContext());
    }
    ViewGroup.LayoutParams params = view.getLayoutParams();
    // 计算 width ，height ，margin
    if (params != null) {
        if (params.width > 0) {
            params.width = w(params.width);
        }
        if (params.height > 0) {
            params.height = h(params.height);
        }
        if (params instanceof MarginLayoutParams) {
            MarginLayoutParams mParams = (MarginLayoutParams) params;
            mParams.leftMargin = w(mParams.leftMargin);
            ...
        }
    }
    // 计算 padding
    view.setPadding(w(view.getPaddingLeft()), h(view.getPaddingTop()), w(view.getPaddingRight()), h(view.getPaddingBottom()));

    // 计算 TextView 的 size
    if (view instanceof TextView) {
        TextView tv = (TextView) view;
        tv.setTextSize(TypedValue.COMPLEX_UNIT_PX, w((int) tv.getTextSize()));
        ...
    }
    // 遍历子View 并适配
    if (view instanceof ViewGroup) {
        ViewGroup vg = (ViewGroup) view;
        final int count = vg.getChildCount();
        for (int i = 0; i < count; i++) {
            compactViewImpl(vg.getChildAt(i));
        }
    }
}
```

优缺点
- 优点：轻量级适配，代码量少，方便快捷 
- 缺点：不能适配 res/drawable 下的资源


## 自定义 AutoLayout

这种方式重写了部分 ViewGroup:（`LinearLayout`，`RelativeLayout`，`FrameLayout`），配合工具类 `AutoUtils` ，按照特定分辨率用 px 单位配置 **layout**，然后重新计算 `padding，margin， size` 等，戳这里[Github](https://github.com/hongyangAndroid/AndroidAutoLayout)找到项目

优缺点
- 轻量级适配
- 不能适配 res/drawable 下的资源，源码相对一号方案还很臃肿，需要外部引入的方式，扩展性不理想，必须使用给定的 ViewGroup ，自由度下降


## 多分辨率 dimens value

**优酷TV版** 采取的适配方案，逆向该工程可以看到，有以下资源
![values-nodpi-x](/imgs/post-151210-1.png) 


再来看一下某一个 layout 文件
![values-nodpi-x](/imgs/post-151210-2.png) 


其中除了 `fill_parent` 和 `wrap_content`，都是引用 **dimens** 的值来配置，上图已经列出大多数分辨率的 **values**，这些**dimens** 在每个 **values-nodpi-x** 文件夹下都有一份 **dimens.xml** ，接下来看一下其中一个 **dimens.xml** 文件记录的值：
![dimens.xml](/imgs/post-151210-3.png) 


可以看到，该文件针对于与之对应的分辨率（ **values-nodpi-x**） 做了适配.

优缺点
-优点：适配完全交给了framework，不需要开发者配置任何代码
-缺点：分辨率列出的有限，工程略臃肿。

上图列出的  **values-nodpi-x** 由脚本生成，通过它可以帮开发者解决些这么多values-xx 的麻烦事情，戳这里[链接](http://blog.csdn.net/lmj623565791/article/details/45460089)，参考 `GenerateValueFiles` 自动生成 values 文件程序