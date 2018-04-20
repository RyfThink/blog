---
title: 'android:onClick 怎样做到监听点击事件的'
categories: Android
date: 2014-12-12 12:00:00
description: onClick 内幕了解下~
---

`android:onClick` 是定义在 **attrs.xml** 中的一个属性：

```xml
<!-- Name of the method in this View's context to invoke when the view is
	clicked. This name must correspond to a public method that takes
	exactly one parameter of type View. For instance, if you specify
	<code>android:onClick="sayHello"</code>, you must declare a
	<code>public void sayHello(View v)</code> method of your context
	(typically, your Activity). -->
<attr name="onClick" format="string" />
```

注释告诉我们，它的命名规则必须是，在 `Context` 中的 `public` 方法，并且必须传递一个 `View` 参数：

```java
public void sayHello(View v){
	...
}
```

那么完成监听onClick事件实现在哪里呢，我们需要考虑到以下两点

1. 这个属性在代码中是由 `R.styleable.View_onClick` 找到的，而通常把属性设置到代码中都是 View 的构造函数完成的
2. 设置 View 的点击监听通常是调用 `setOnClickListener()` 方法

<!--more-->

查看 View 的源代码(API23)，在其构造方法中，有这样一段代码：

```java
case R.styleable.View_onClick:
	final String handlerName = a.getString(attr);
	if (handlerName != null) {
		setOnClickListener(new DeclaredOnClickListener(this, handlerName));
	}
break;
```

果然是设置了一个特殊的监听器 `DeclaredOnClickListener`：

```java
/**
 * An implementation of OnClickListener that attempts to lazily load a
 * named click handling method from a parent or ancestor context.
 */
private static class DeclaredOnClickListener implements OnClickListener {
		private final View mHostView;
		private final String mMethodName;

		private Method mMethod;

		public DeclaredOnClickListener(@NonNull View hostView, @NonNull String methodName) {
				mHostView = hostView;
				mMethodName = methodName;
		}

		@Override
		public void onClick(@NonNull View v) {
				// 反射找到方法
				if (mMethod == null) {
						mMethod = resolveMethod(mHostView.getContext(), mMethodName);
				}
				// 执行方法
				try {
						mMethod.invoke(mHostView.getContext(), v);
				} catch (IllegalAccessException e) {
					 ...
				}
		}

		@NonNull
		private Method resolveMethod(@Nullable Context context, @NonNull String name) {
				...
				if (!context.isRestricted()) {
						return context.getClass().getMethod(mMethodName, View.class);
				} catch (NoSuchMethodException e) {
						// Failed to find method, keep searching up the hierarchy.
				}
				...
		}
}
```
通过方法名 `mMethodName` 和参数 `View.class` 反射找到对应在 **Context** 中的方法，然后调用 `Method` 的 `invoke` 方法来完成整个监听过程