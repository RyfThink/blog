---
title: mean.septenary.cn 搭建之登录逻辑梳理
date: 2017-05-05 12:00:00
description: 最近用 MEAN 栈技术搭建了一个网站，这里整理了下登录模块的问题 
categories: node
---

# 1.通常登录方式都有哪些? 
[登录那些事儿](https://cnodejs.org/topic/5671441a1d2912ce2a35aaa1)
# 2.restful API 形式的 登录服务 passport-jwt

* [什么是 JWT -- JSON WEB TOKEN](http://www.jianshu.com/p/576dbf44b2ae)
* [OAuth 2和JWT - 如何设计安全的API](http://blog.csdn.net/ljinddlj/article/details/53108261)
* [Angular authentication revisited](https://medium.com/@blacksonic86/angular-2-authentication-revisited-611bf7373bf9#.5mixgxid0)
* [angular2-jwt-auth-example](http://jasonwatmore.com/post/2016/08/16/angular-2-jwt-authentication-example-tutorial)
* [express-jwt-server](https://blog.jscrambler.com/implementing-jwt-using-passport/)
* [使用Json Web Token设计Passport系统](https://yq.aliyun.com/articles/59043)
* [Creating a Simple Node/Express API Authentication System with Passport and JWT](http://blog.slatepeak.com/creating-a-simple-node-express-api-authentication-system-with-passport-and-jwt/)
* [Building a Basic RESTful API for a Chat System](http://blog.slatepeak.com/building-a-basic-restful-api-for-a-chat-system/)

## jwt 如何保证在浏览器中的安全存储

1. Set-Cookie (http only)
2. LocalStorage: JWT 在浏览器中以加密方式存储在 localStorage 中，但 localStorage 无法防范 XSS 攻击，好在 Angular2 有"跨站脚本安全模型", 可按照[文档
](https://angular.cn/docs/ts/latest/guide/security.html#!#xss)

## 服务端实现
需要用到的库

* jwt-simple (jwt encode decode）
* moment
* passport
* passport-jwt

1.验证用户名密码后，响应生成的 jwt

```javascript

const me = {id:'1', email: 'seven__up@sina.cn', password: '123456', role: 'admin'};
const SECRET = 'my-jwt-secret';

app.post("/login", function(req, res) {
    let email = req.body.email;
    let password = req.body.password;
    if (me.email == email && me.password && password) {
        let payload = {
            id: me.id,
            role: me.role,
            iat: moment().unix(), // 签发时间
            exp: moment().add(5, 'minute').unix() // 过期时间
        };
        res.json({
            token: jwt.encode(payload, SECRET);
        });
    } else {
        res.sendStatus(401);
    }
});
```


2.受限 API 的访问

route:

```javascript
app.get("/user", auth.authenticate(), function(req, res) {  
    res.json(users[0]);
});
```

authenticate:

```javascript
module.exports = function() {  
    var strategy = new Strategy(params, function(req, payload, done) {
        var user = users[payload.id] || null;
        if (user) {
            return done(null, {
                id: user.id
            });
        } else {
            return done(new Error("User not found"), null);
        }
    });
    passport.use('jwt', strategy);
    return {
        initialize: function() {
            return passport.initialize();
        },
        authenticate: function() {
            return passport.authenticate('jwt', cfg.jwtSession);
        }
    };
```



get token

```shell
curl -H "Content-Type: application/json" -X POST -d '{"email":"seven__up@sina.cn","password":"123456"}' http://localhost:4300/api/auth/login
```

request with token

```shell
curl -I --header "Authorization:JWT TOKEN" localhost:4300/api/user
```

