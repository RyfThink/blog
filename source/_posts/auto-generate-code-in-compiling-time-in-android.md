---
title: AndroidStudio 编译时自动生成源代码
categories: Android
date: 2015-12-19 12:00:00
description: 神奇的事情发生了，写点注释就能自动生成代码，这是怎么做到的呢？
---

# Annotation

- `@Retention(RetentionPolicy.SOURCE)`
- `@Retention(RetentionPolicy.RUNTIME)`
- `@Retention(RetentionPolicy.CLASS)`

[Annotation Document](http://docs.oracle.com/javase/tutorial/java/annotations/index.html)

# APT---annotation processing tool

**apt**（Annotation processing  tool） 是在编译时，扫描和处理注解的一个构建工具，**Java 5** 时就已经有了，直到 **Java 6** 才提供 API 给开发者，**apt** 的道路实在坎坷，到了 **Java 7** 又被废弃。现在，该功能由 **javac** 来实现，我们可以在 **javac** 编译时源代码额外生成 java 源代码（也可以是其它类型的文件），那么如何处理注解，需要我们了解 `AbstractProcessor` 这个类。


# AbstractProcessor

**AbstractProcessor** 是 **javac**  扫描和处理注解的关键类，在所有的 `Processor`API 中都可以看到它们都继承自 `AbstractProcessor` ，像下面的代码示例：

```java
package cn.septenary.processor;

public class MyProcessor extends AbstractProcessor {

    @Override
    public synchronized void init(ProcessingEnvironment env){ }

    @Override
    public boolean process(Set<? extends TypeElement> annoations, RoundEnvironment env) { }

    @Override
    public Set<String> getSupportedAnnotationTypes() { }

    @Override
    public SourceVersion getSupportedSourceVersion() { }

}
```

<!--more-->

- `init(ProcessingEnvironment env)` ：**javac** 会在 **Processor** 创建时调用并执行的初始化操作，该方法会传入 一个参数 `ProcessingEnvironment env` ，通过 env 可以访问 `Elements`、`Types`、`Filer`等工具类。
- `process(Set<? extends TypeElement> annotations, RoundEnvironment env)` ：它是每个 **processor** 的主方法，可以在这个方法中扫描和处理注解，并生成新的 java 源代码，通过参数 `RoundEnvironment env` 可以找到我们想要的某一个被注解的元素
- `getSupportedAnnotationTypes()` 指定哪些注解需要注册
- `getSupportedSourceVersion()` 指定支持的 java 版本，通常返回 `SourceVersion.latestSupported()`，如果只想支持到 **Java 6** 可以返回 `SourceVersion.RELEASE_6`

在 **Java 7** 中可以不用重写 `getSupportedAnnotationTypes（）` 和 `getSupportedSourceVersion()`：

```java
@SupportedSourceVersion(SourceVersion.latestSupported())
@SupportedAnnotationTypes({
   // Set of full qullified annotation type names
 })
public class MyProcessor extends AbstractProcessor {

    @Override
    public synchronized void init(ProcessingEnvironment env){ }

    @Override
    public boolean process(Set<? extends TypeElement> annoations, RoundEnvironment env) { }
}
```

# Register Your Processor

如何让 **javac** 执行时调用我自定义的 **MyProcessor** 呢，需要注册自定义的 **MyProcessor** 来完成

1.**MyProcessor** 需要打包到 **jar** 包中，就像其它普通的 **.jar** 文件一样，这里命名为 **MyProcessor.jar**
2.但 **MyProcessor.jar** 中多了一个特殊的文件：**javax.annotation.processing.Processor** 它存储在 **jar/META-INF/services/** 文件夹下，**MyProcessor.jar** 的结构是这样的：

```xml
MyProcessor.jar
    - cn
        - septenary
            - processor
                - MyProcessor.class
    - META-INF
        - services
            - javax.annotation.processing.Processor
```

**javax.annotation.processing.Processor** 文件列出了要注册的 **Processor**，每个 **Processor** 逐行列出

```xml
cn.septenary.processor.MyProcessor
com.foo.OtherProcessor
net.foo.SpecialProcessor
```

构建项目时 **javac** 自动检测并读取 **javax.annotation.processing.Processor** 来注册列出来的 **Processor**

# Android Studio 中实现编译时动态生成代码


## 1.新建工程，分别创建三个模板
- app module (Android module)
- api module (Java module)
- compiler module (Java module)

## 2.根目录 build.gradle 

需要声明依赖插件 **android-apt**，它是将 Android Studio 与 annotation processors 结合的一个插件，构建工程时，它会辅助 javac 执行 processor，  [More](https://bitbucket.org/hvisser/android-apt#header-language) 

```gradle
buildscript {
    ...
    dependencies {
        ...
        classpath 'com.neenbedankt.gradle.plugins:android-apt:1.8'
    }
}
...
```

## 3.app module
Android 模板，使用 **android-apt**插件，依赖 **api module** 和 **compiler module**

1.使用自定义注解 `@MyAnnotation` 的类 `Bean`:

```java
@MyAnnotation
public class Bean {
    public String name;
    public String address;
    public Bean(String name, String address) {
        this.name = name;
        this.address = address;
    }
    @Override
    public String toString() {
        return StringUtil.createString(this);
    }
}
```

**app module** 中并没有 `StringUtil` 这个类，不考虑其他 module ，编写 `Bean` 中代码时，IDE 会警告找不到 `StringUtil`这个类，它是在编译时由 **javac** 和 **compiler.jar** 自动生成，继续往下看

 2.build.gradle :
 3.
```gradle
apply plugin: 'com.neenbedankt.android-apt'
...
...
dependencies {
    ...
    apt project(':compiler')
}
```

## 4.lib module
普通的 java 模板，自定义注解 `MyAnnotation`

**build.gradle :**
```gradle
apply plugin: 'java'
...
```

**MyAnnotation:**
```java
@Retention(RetentionPolicy.CLASS)
@Target(ElementType.TYPE)
public @interface MyAnnotation {
}
```

## 5.compiler module 
普通的 java 模板

1.自定义注解处理器: `MyProcessor`
2.引入了三个依赖：
- **lib** ，使用自定义的注解 `MyAnnotation`，
- **auto-service**， 用来自动生成 **javax.annotation.processing.Processor** 文件， [More](https://github.com/google/auto/tree/master/service)
- **javapoet** ，自动生成代码的工具类库， [More](https://github.com/square/javapoet)

**MyProcessor:**

```java
// 注解 @AutoService 自动生成 javax.annotation.processing.Processor 文件
@AutoService(Processor.class)
public class MyProcessor extends AbstractProcessor {

    private static final String ANNOTATION = "@" + MyAnnotation.class.getSimpleName();
    private Messager messager;

    @Override
    public synchronized void init(ProcessingEnvironment processingEnv) {
        super.init(processingEnv);
        messager = processingEnv.getMessager();
    }

    @Override
    public Set<String> getSupportedAnnotationTypes() {
        return Collections.singleton(MyAnnotation.class.getCanonicalName());
    }

    @Override
    public SourceVersion getSupportedSourceVersion() {
        return SourceVersion.latestSupported();
    }

    @Override
    public boolean process(Set<? extends TypeElement> annotations, RoundEnvironment roundEnv) {
        List<AnnotatedClass> annotatedClasses = new ArrayList<>();
        for (Element annotatedElement : roundEnv.getElementsAnnotatedWith(MyAnnotation.class)) {
            if (annotatedElement instanceof TypeElement) {
                // Our annotation is defined with @Target(value=TYPE)
                TypeElement element = (TypeElement) annotatedElement;
                if (!isValidClass(element)) {
                    return true;
                }
                try {
                    AnnotatedClass annotatedClass = buildAnnotatedClass(element);
                    annotatedClasses.add(annotatedClass);
                } catch (NoPackageNameException | IOException e) {
                    String message = String.format("Couldn't process class %s: %s", element, e.getMessage());
                    messager.printMessage(ERROR, message, annotatedElement);
                }
            }
        }
        try {
            generate(annotatedClasses);
            // genHelloWorld();
        } catch (NoPackageNameException | IOException e) {
            messager.printMessage(ERROR, "Couldn't generate class");
        }
        Messager messager = processingEnv.getMessager();
        for (TypeElement te : annotations) {
            for (Element e : roundEnv.getElementsAnnotatedWith(te)) {
                messager.printMessage(Diagnostic.Kind.NOTE, "HelloProcessor Printing: " + e.toString());
            }
        }
        return true;
    }

    // 构建被 @MyAnnotation 注解的类
    private AnnotatedClass buildAnnotatedClass(TypeElement typeElement) throws NoPackageNameException, IOException {
        ArrayList<String> variableNames = new ArrayList<>();
        for (Element element : typeElement.getEnclosedElements()) {
            if (!(element instanceof VariableElement)) {
                continue;
            }
            VariableElement variableElement = (VariableElement) element;
            variableNames.add(variableElement.getSimpleName().toString());
        }
        return new AnnotatedClass(typeElement, variableNames);
    }

    // 生成 StringUtil 源代码
    private void generate(List<AnnotatedClass> list) throws NoPackageNameException, IOException {
        if (list.size() == 0) {
            return;
        }
        for (AnnotatedClass annotatedClass : list) {
            // debug
            String message = annotatedClass.annotatedClassName + " / " + annotatedClass.typeElement + " / " + Arrays.toString(annotatedClass.variableNames.toArray());
            messager.printMessage(Diagnostic.Kind.NOTE, message, annotatedClass.typeElement);
        }

        // 生成源代码
        String packageName = getPackageName(processingEnv.getElementUtils(), list.get(0).typeElement);
        TypeSpec generatedClass = CodeGenerator.generateClass(list);
        JavaFile javaFile = JavaFile.builder(packageName, generatedClass).build();

        // 在 app module/build/generated/source/apt 生成一份源代码
        javaFile.writeTo(processingEnv.getFiler());

        // 测试在桌面生成一份源代码
        javaFile.writeTo(new File(System.getProperty("user.home") + "/Desktop/"));
    }

    // 在桌面生成 HelloWorld.java
    private void genHelloWorld() throws IOException {
        MethodSpec main = MethodSpec.methodBuilder("main").addModifiers(Modifier.PUBLIC, Modifier.STATIC).returns(void.class).addParameter(String[].class, "args").addStatement("$T.out.println($S)", System.class, "Hello, JavaPoet!").build();
        TypeSpec helloWorld = TypeSpec.classBuilder("HelloWorld").addModifiers(Modifier.PUBLIC, Modifier.FINAL).addMethod(main).build();
        JavaFile javaFile = JavaFile.builder("cn.septenary.annotation", helloWorld).build();
        javaFile.writeTo(new File(System.getProperty("user.home") + "/Desktop/Hello"));
    }

    // 被 @MyAnnotation 注解的类
    private static class AnnotatedClass {
        // 整个类元素
        public final TypeElement typeElement;
        // 类名
        public final String annotatedClassName;
        // 成员变量
        public final List<String> variableNames;

        public AnnotatedClass(TypeElement typeElement, List<String> variableNames) {
            this.annotatedClassName = typeElement.getSimpleName().toString();
            this.variableNames = variableNames;
            this.typeElement = typeElement;
        }

        public TypeMirror getType() {
            return typeElement.asType();
        }
    }

    // 源码生成器
    private static class CodeGenerator {

        private static final String CLASS_NAME = "StringUtil";

        // 构建类
        public static TypeSpec generateClass(List<AnnotatedClass> classes) {
            TypeSpec.Builder builder = classBuilder(CLASS_NAME).addModifiers(PUBLIC, FINAL);
            for (AnnotatedClass anno : classes) {
                builder.addMethod(makeCreateStringMethod(anno));
            }
            return builder.build();
        }

        // 将 AnnotatedClass 作为参数构建 createString() 方法
        private static MethodSpec makeCreateStringMethod(AnnotatedClass annotatedClass) {
            StringBuilder builder = new StringBuilder();
            builder.append(String.format("return \"%s{\" + ", annotatedClass.annotatedClassName));
            for (String variableName : annotatedClass.variableNames) {
                builder.append(String.format(" \"%s='\" + String.valueOf(instance.%s) + \"',\" + ", variableName, variableName));
            }
            builder.append("\"}\"");
            return methodBuilder("createString").addJavadoc("@return string suitable for {@param instance}'s toString()").addModifiers(PUBLIC, STATIC).addParameter(TypeName.get(annotatedClass.getType()), "instance").addStatement(builder.toString()).returns(String.class).build();
        }
    }

    private boolean isPublic(TypeElement element) {
        return element.getModifiers().contains(PUBLIC);
    }

    private boolean isAbstract(TypeElement element) {
        return element.getModifiers().contains(ABSTRACT);
    }

    private boolean isValidClass(TypeElement element) {

        if (!isPublic(element)) {
            String message = String.format("Classes annotated with %s must be public.", ANNOTATION);
            messager.printMessage(Diagnostic.Kind.ERROR, message, element);
            return false;
        }

        if (isAbstract(element)) {
            String message = String.format("Classes annotated with %s must not be abstract.", ANNOTATION);
            messager.printMessage(Diagnostic.Kind.ERROR, message, element);
            return false;
        }

        return true;
    }

    private String getPackageName(Elements elements, TypeElement typeElement) throws NoPackageNameException {
        PackageElement pkg = elements.getPackageOf(typeElement);
        if (pkg.isUnnamed()) {
            throw new NoPackageNameException(typeElement);
        }
        return pkg.getQualifiedName().toString();
    }
}
```

**build.gradle:**
```gradle
apply plugin: 'java'
...
dependencies {
    compile project(':lib')
    compile 'com.google.auto.service:auto-service:1.0-rc2'
    compile 'com.squareup:javapoet:1.4.0'
}
```
## 6.构建 api module
生成 **api.jar** ,供 **lib module ** 和 **app module** 使用

## 7.构建 lib module 
生成了 **complier.jar** ，其中关键文件 **javax.annotation.processing.Processor** 也被自动添加到 jar 包中

![complier.jar](/imgs/post-1512109-1.png) 

## 8.构建 app module 
构建后会看到，IDE 不在警告 `TextUtil` 找不到的错误了，他的文件被自动生成在:

![TextUtil](/imgs/post-1512109-2.png) 

## 9.案例源码
[Github Source Code](https://github.com/Ryfthink/Android-Gradle-Multy-Flavor)


参考链接
---
- [Android Annotation Processing: POJO string generator](http://brianattwell.com/android-annotation-processing-pojo-string-generator/)

- [Code Generation using Annotation Processors](https://deors.wordpress.com/2011/10/08/annotation-processors/)

- [Annotation Processing](http://hannesdorfmann.com/annotation-processing/annotationprocessing101/)