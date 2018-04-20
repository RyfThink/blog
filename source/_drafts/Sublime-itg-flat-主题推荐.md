title: Sublime itg.flat主题推荐
date: 2015-8-23 14:21:31
tags:
- sublime
- theme
---

今天推荐一款 Sublime 主题插件 **itg.flat** 个人感觉配色蛮好看的哈，来看下效果
![itg.flat主题](/imgs/post-150823-1.png)

<!--more-->

安装
---
我用的是 **Sublime3** , 首先 Sublime 要有 **PackageControl** 这个插件，如果没有安装，移步[戳这里](https://gist.github.com/moomerman/4674060)按教程安装。

确保已经安装 PackageControl 插件后，按快捷键 `command+shift+p` 弹出控制台界面，找到 PackgeInstall 功能

![启动PackgeInstall 功能](/imgs/post-150823-2.png) 
 
搜索 **itg.flat** 点击安装


配置
---
安装后并没有即刻生效，这是因为 Sublime 需要进行一些配置，安快捷键 `command+,` 配置以下属性，保存退出，你的 Sublime 样式就变啦，怎么样，这个样式还不错吧。

    {
        "always_show_minimap_viewport": true,
        "bold_folder_labels": true,
        "color_scheme": "Packages/Theme - itg.flat/itg.dark.tmTheme",
        "font_size": 16,
        "ignored_packages":
        [
            "Markdown",
            "Vintage"
        ],
        "itg_sidebar_tree_large": true,
        "itg_sidebar_tree_medium": true,
        "itg_sidebar_tree_small": true,
        "itg_sidebar_tree_xlarge": true,
        "itg_sidebar_tree_xsmall": true,
        "itg_small_tabs": true,
        "line_padding_bottom": 1,
        "line_padding_top": 1,
        "overlay_scroll_bars": "enabled",
        "theme": "itg.flat.dark.sublime-theme"
    }

