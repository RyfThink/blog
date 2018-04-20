title: ShellScript初级编程
date: 2015-06-14 19:02:29
categories:
- Linux
tags:
- ShellScript
---

## Shell & Shell Script

*  Shell 是解释并执行 Shell 脚本的一个应用程序，提供一个图形界面实现人机交互
*  ShellScript 是为Shell应用程序编写的脚本，我们可以通过编写的shell脚本执行某些命令，访问操作系统内核服务等

下面是 **Unix** 环境下的一个简单的 "Hello World" 脚本

    #!/bin/sh  
    echo "Hello Shell"

第一行指定sh作为该脚本的解释器
第二行输出文本

<!--more-->


***

## Shell 的种类

Shell 有很多种类型，在 **Unix** 中主要有两大阵营的类型
- Bourne shell  (终端内以 **$** 开头)
    + Bourne Shell (sh)
    + Korn Shell (ksh)
    + Bourne Again Shell (bash)
    + POSIX Shell (sh)
- C shell （终端内以 **%** 开头)
    + C Shell (csh)
    + TENEX/TOPS Shell (tcsh)

tips1: 本文主要基于 **sh** 的脚本开发进行讲解

tips2: 像 Shell 这种 **脚本--解释器** 的方式，我们也可以用高级语言编写脚本，然后用其对应的解释器执行脚本,比如：
- 用  **php**  语言编写脚本，然后用 `/usr/bin/php` 执行该脚本
- 用 **java** 语言编写脚本，然后用 **jshell** 执行该脚本

***

## Shell Prompt

Shell Prompt 命令行提示符，当执行某些操作时，终端行首显示的友好提示

1.**PS1**

终端提示，我们可以通过修改PS1变量设置提示符的内容，提示符的颜色，以及shell窗口的标题栏文字等，当我打开终端时，行首提示是这样子的
    
    ~ Septenary$
    
查看PS1 `echo $PS1` 会看到
    
    \w \u\$
    
我们来修改下PS1，在终端上输入 `PS1='\A:\w\$'` ，这时行首会变成
    
    16:08:~$

下面是PS1中部分转义字符的含义

| 命令      |     含义    |
| :-------- | :-------- |
|  \a       |   ASCII bell character (也可以写成\007)  |
|  \d       |   日期，格式为"Wed Sep 06"|
|  \h       |   完整主机名的第一部分|
|  \H       |   完整的主机名|
|  \j       |   这个shell挂起的进程数目|
|  \l       |   这个shell的终端设备文件|
|  \n       |   换行符|
|  \r       |   回车符|
|  \s       |   shell的名字 .如 "bash"|
|  \t       |   24小时制时间.如 "16:19:00"|
|  \T       |   12小时制时间 ,如 "04:19:00"|
|  \@       |   12小时制时间,如 "16:19 pm"|
|  \u       |   用户名|
|  \v       |   bash版本号|
|  \V       |   bash版本号, 包括补丁|
|  \w       |   当前工作目录的完整路径|
|  \W       |   当前工作目录|

2.**PS2**
            考虑一种使用情况，比如一个命令很长，我们希望不用一行将所有命令全部输入，这时可以在输入一半时键入 `\` ，然后再换行输入剩下的命令，换行后会有一个 **prompt** 提示，这个提示就是 **PS2**，可以看下面的例子
    
    ~  ᐅ PS2='input_next_cmd_>'
    ~  ᐅ ffmpeg -i in.mov -s 600x400 -pix_fmt rgb24 -r 10 -f gif - \
    input_next_cmd_>| gifsicle --optimize=3 --delay=3 out.gif

3.**PS3**  
    Shell语法中使用 **select** 时用到的，下面是 **PS3** 的简单使用

    #!/bin/sh
    PS3="select a laungage >>" 
    select person in English Chinese Japanese Korea Exit
    do
       case $person in
            English ) echo "英语" ;;
            Chinese ) echo "汉语" ;;
            Japanese ) echo "日语" ;;
            Korea ) echo "韩语" ;;
            Exit ) break ;;
            * ) echo "\007" ;;
           esac
        done
        
执行该脚本会输出以下内容：
            
            1) English
            2) Chinese
            3) Japanese
            4) Korea
            5) Exit
            select a laungage >>
        
最后一行就是设置 **PS3** 后的效果   

***

## 第一个shell脚本
1. 在终端中，键入 `touch test.sh` 创建一个文件 **test.sh** ,编辑该文件输入以下代码保存退出
        
        #!/bin/sh
        # Author : Septenary
        # Copyright (c) septenary.cn
        # Script follows here:
        echo "Hello Shell"
    
    第一行的前两个字符 **#!** （读作 shebang）声明该脚本由哪个解释器执行，第二行 **#** 为注释，最后一行调用 **echo** 命令输出文本信息

2. 更改 **test.sh** 文件为可执行，在终端上输入     ```chmod +x test.sh``` 
3. 双击 **test.sh** 文件可以看到终端上输出了 "Hello Shell"

4. 也可以这样执行 **test.sh**：在终端中键入 `/bin/sh ./test.sh` ，同样会打印出 "Hello Shell" ，这种方式是将 **./test.sh** 作为一个参数来让 **/bin/sh** 解释执行

***

## 变量

**1. Shell中变量的命名规则**

以 **(a-z) (A-Z) (0-9) (_) ** 组成， 字母和下划线开头

**2. 定义变量**，Shell 中变量是弱类型的，可以赋值成任何类型
    
    var="a message"
    var=10

**3. 访问变量**
    
    echo $var
        
**4. 只读变量**
    
    #!/bin/sh
    var="value1"
    readonly var
    var="value2
         
**5. 重置变量**
    
    #!/bin/sh
    var="value"
    echo var
    unset var
    echo var

***

## 特殊变量

拷贝下面的代码会看到注释所对应的输出结果

    #!/bin/sh
    echo '$$' = "$$"    #  $$ 当前shell进程的PID
    echo '$0' = "$0"    #  $0 当前script的文件名
    echo '$1' = "$1"    #  给当前shell传入的第一个参数，$n 为第n个参数
    echo '$#' = "$#"    #  $# 传入参数的个数
    echo '$*' = "$*"    #  $*/$@  参数集合
    echo '$@' = "$@"    #  $*/$@  参数集合
    echo '$?' = "$?"    #  $? 执行前一命令的返回结果（Exist Status）
    echo '$!' = "$!"  #  最近一个后台程序的进程ID
    for var in $@; do #  输出所有传入参数
        echo $var
    done

***

## 数组

**1. 定义数组** 
    
    items=(aa bb cc)

**2. 定义数组**
        
    items[0]=aa
    items[1]=bb
    
**3. 引用数组元素**
        
    ${items[n]}
    
**4. 所有数组元素**
        
    ${items[*]}
    ${items[@]}

**5. Example:**
    
    #!/bin/bash
    items=(aa bb cc dd)
    echo ${items[0]}
    echo ${items[1]}
    echo ${items[2]}
    echo ${items[@]}
    items[5]="ee"
    echo ${items[9]}

***

## 运算符
    
**1.算数运算符**
* `expr $a + $b`  加法
* `expr $a + $b` 减法
* `expr $a \* $b` 乘法
* `expr $a / $b` 乘法
* `expr $a % $b` 取模
* `expr $a == $b` 等于
* `expr $a = $b` 不等于

执行算数运算时需要用反引号 `` ` `` 或 ``$()``  将运算逻辑括起来 

example:

    #!/bin/sh
    b=3
    a=5
    var=`expr $a + $b` 
    echo "$a+$b=$var"

***

**2.关系运算符**
* `-eq` 相等
* `-ne` 不等
* `-gt` 大于
* `-lt` 小于
* `-ge` 大于等于
* `-le` 小于等于
   
   example:
   
        /bin/sh
        b=3
        a=5
        if [ $a -eq $b ]; then # -eq 相等
            echo "$a equals $b"
        else
            echo "$a not equals $b"
        fi

***

**3.布尔运算**
* `!`   NOT
* `-o`  OR
* `-a`  AND

***

**4.字符串操作符**
* `=`   相等
* `!=`  不等
* `-z`  长度为0
* `-n`  长度不为0
* `str` check empty(false)

**example**:

    #!/bin/bash
    # if [ $1 ] ; then
    #   echo "\$1 is $1"
    # else 
    #   echo "\$1 is null"
    # fi

再来介绍下字符串的处理:
![Shell字符串处理](/imgs/shell-string-operation.png)

当然，也可以用 **cut** 命令完成字符串操作，可以在终端键入 `man cut` 查看更多帮助
***

**5.文件操作**

|   命令    |  释义 |
| :-------- | :------- |
|-b file | 是否为块文件 |
|-c file | 是否为字符文件 |
|-d file | 是否为目录 |
|-f file | 文件不是一个目录或特殊文件 |
|-g file | 文件是否有它设置组ID（SGID) |
|-k file | 是否为sticky |
|-p file | 是否为named pip |
|-t file | 文件的 descriptor 是否对终端 开放|
|-u file | 文件是否设置用户ID（SUID) |
|-r file | 可读 |
|-w file | 可写 |
|-x file | 可执行 |
|-s file | 文件大小是否不为0 |
|-e file | 文件是否存在 |

example:

    !/bin/bash
    file=/Users/septenary/Desktop/test.sh
    if [[ -e $file ]]; then
        echo "exit"
    else
        echo "not exit"
    fi

也可以用 **test** 命令完成字符串操作，可以在终端键入 `man test` 查看更多帮助

***

**6.条件语句**
上面的一些例子已经看到，条件语句的简单使用:

* 条件语句 以 `if` 开头 倒序 `fi` 结尾，表示一端代码块
* 分支语句 以 `case` 开头,倒序  `esac` 结尾，表示一端代码块

1）**if...fi statement**
    
    if [[ condition ]]; then
        #statements
    fi
        
2）**if...else...fi statement**

    if [[ condition ]]; then
        #statements
    else
        #statements
    fi

3）**if...elif...else...fi statement**

    if [[ condition ]]; then
        #statements
    elif [[ condition ]]; then
        #statements
    elif [[ condition ]]; then
        #statements
    fi
4）**switch**

    #!/bin/sh
    name="xiaoming"
    case "$name" in
       "xiaogang") echo "Xiaogang is fat boy." 
       ;;
       "xiaohong") echo "Xiaohong is beautiful girl." 
       ;;
       "xiaoming") echo "Xiaoming is a doubi." 
       ;;
    esac

***

**7. 循环**
1）while

        i=0
        while [ $i -lt 10 ]; do
            echo -e "$i \c" 
            i=`expr $i + 1`
        done
            
2）for

        for var in 1 2 3 4 5 6 7; do
            #statements
            echo $var
        done
        
3) until

        i=0
        until [ ! $i -lt 10 ]; do
            printf "$i \n"
            i=`expr $i + 1`
        done
    
4) select
    以上文讲到的PS3为例

***

**8. 循环控制**
1）break
    
    for var1 in 1 2 3 4 5; do
        for var2 in 6 7 8 9 10; do
            if [ $var1 -eq 3 -a $var2 -eq 7 ]; then
                break 2 # 跳出两层循环
            else
                echo "$var1/$var2"
            fi
        done
    done
        
2）continue

***

**9. 元字符 Metacharacters**

元字符: `# * ? [ ] ' " \ $ ; & ( ) | ^ < > `
1) 单引号 `''`  单引号内所有字符原样输出
2) 双引号 `""` 大部分原样输出，除以下几种
         
    $   变量引用
    ``  执行语句
    \$  转义，输出 $
    \'  转义，输出 '
    \"  转义，输出 "
    \\  转义，输出 \ 

3) 反斜杠 `\` 转义字符后的的内容原样输出
4) 反引号 `` ` xxx ` `` xxx 按命令方式执行

***

**10.IO重定向**

1） `>`  output 擦除写入
2）`>>`      output 追加
3） `<`      input 输入
4） `<<`     - input here documents

    cat << EOF
    This is a simple lookup program 
    for good (and bad) restaurants
    in Cape Town.
    EOF
        
5）管道 `|`    - pipes

***

**11. shell函数**
1) 函数创建
        
    !/bin/bash
    week(){
        echo "A week function."
    }
    week

2) 传参(anytype)
        
    !/bin/bash
    week(){
        echo "Today is $1"
    }
    week Friday

3) 返回值(numeric)
        
    !/bin/bash
    week(){
        echo "Today is $1"
        return 0
    }
    week Friday
    var=$?
    echo $var
    
4) Nested function

5) Prompt function

***

## Tips

1. java中执行一个脚本程序
    * Runtime.getRuntime().exec(...);
    * 也可以用Apcache提供的 **Apache Commons exec library**. [戳这里](https://commons.apache.org/proper/commons-exec/)

2.  其他高级命令
    **find**
    **grep**
    **sed**
    **awk**