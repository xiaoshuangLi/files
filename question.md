## 基础

### css盒模型
### bfc的了解

### 页面导入样式时，使用link和@import有什么区别？

link属于XHTML标签，除了加载CSS外，还能用于定义RSS, 定义rel连接属性等作用；而@import是CSS提供的，只能用于加载CSS;
页面被加载的时，link会同时被加载，而@import引用的CSS会等到页面被加载完再加载;
import是CSS2.1 提出的，只在IE5以上才能被识别，而link是XHTML标签，无兼容问题;

### CSRF(Cross Site Request Forgery)，跨站点伪造请求
尽量使用Post请求,验证码，token.

### 如何实现多个Tab通信

WebSocket, localSotrage

### HTML5的离线储存怎么使用

在用户没有与因特网连接时，可以正常访问站点或应用，在用户与因特网连接时，更新用户机器上的缓存文件。
原理：HTML5的离线存储是基于一个新建的.appcache文件的缓存机制(不是存储技术)，通过这个文件上的解析清单离线存储资源，这些资源就会像cookie一样被存储了下来。之后当网络在处于离线状态下时，浏览器会通过被离线存储的数据进行页面展示。

如何使用：
1、页面头部像下面一样加入一个manifest的属性；
2、在cache.manifest文件的编写离线存储的资源；
  CACHE MANIFEST
  #v0.11
  CACHE:
  js/app.js
  css/style.css
  NETWORK:
  resourse/logo.png
  FALLBACK:
  / /offline.html
3、在离线状态时，操作window.applicationCache进行需求实现。

### Ajax 是什么? 如何创建一个Ajax？

ajax的全称：Asynchronous Javascript And XML。
异步传输+js+xml。
所谓异步，在这里简单地解释就是：向服务器发送请求的时候，我们不必等待结果，而是可以同时做其他的事情，等到有了结果它自己会根据设定进行后续操作，与此同时，页面是不会发生整页刷新的，提高了用户体验。

(1)创建XMLHttpRequest对象,也就是创建一个异步调用对象
(2)创建一个新的HTTP请求,并指定该HTTP请求的方法、URL及验证信息
(3)设置响应HTTP请求状态变化的函数
(4)发送HTTP请求
(5)获取异步调用返回的数据
(6)使用JavaScript和DOM实现局部刷新

### AMD（Modules/Asynchronous-Definition）、CMD（Common Module Definition）规范区别

## 拓展

### React的批量更新机制BatchUpdates

### React如何设计大型SPA应用

### 服务器部署

### 前后端同构的看法

### Webpack热更新实现原理

1. Webpack编译期，为需要热更新的 entry 注入热更新代码(EventSource通信)
2. 页面首次打开后，服务端与客户端通过 EventSource 建立通信渠道，把下一次的 hash 返回前端
3. 客户端获取到hash，这个hash将作为下一次请求服务端 hot-update.js 和 hot-update.json的hash
4. 修改页面代码后，Webpack 监听到文件修改后，开始编译，编译完成后，发送 build 消息给客户端
5. 客户端获取到hash，成功后客户端构造hot-update.js script链接，然后插入主文档
6. hot-update.js 插入成功后，执行hotAPI 的 createRecord 和 reload方法，获取到 Vue 组件的 render方法，重新 render 组件， 继而实现 UI 无刷新更新。

### 浏览器缓有哪几种？Webpack如何配置缓存文件？
* **强缓存:** 
也称为本地缓存，不向服务器发送请求，直接使用客户端本地缓存数据
* **协商缓存:** 也称304缓存，向服务器发送请求，由服务器判断请求文件是否发生改变。如果未发生改变，则返回304状态码，通知客户端直接使用本地缓存；如果发生改变，则直接返回请求文件。