# <center>李晓爽</center>

### 个人信息
#### 应聘前端工程师
**姓&emsp;&emsp;名 :** 李晓爽<br>
**工作年限 :** 三年工作经验<br>
**手机电话 :** 13197913032<br>
**邮箱地址 :** 1157502759@qq.com<br>


### 专业技能
* **CSS HTML :** 掌握使用,并了解不同浏览器适配及兼容性解决方案。
* **CSS3 Canvas 动画 :** 掌握使用, 熟悉CSS3与Canvas各种动画效果。
* **React :** 熟练使用, 并配合Redux, React-Router搭建前端框架。
* **Webpack :** 了解使用, 可搭建编译脚手架，配合项目需求开发loader插件。（[脚手架](https://github.com/xiaoshuangLi/devtool), [Loader插件](https://www.npmjs.com/package/skin-loader))
* **Webgl Svg :** 了解使用, 配合使用提示前端用户体验。
* **Node :** 了解使用, 可配合Express, Koa搭建后端。
* **码农思想 :** 善于总结并用代码偷懒，以解决代码中的重复工作。（[工具](https://www.npmjs.com/~xiaoshuang)）
* **热爱学习 :** 对于新知识，乐于接受，上手快。

### 工作经验
* **上海云御信息科技有限公司 :** 工作2年, 负责前端功能实现。
* **众安信息科技有限公司 :** 工作1年, 负责前端布局框架搭建以及前端功能实现。

### 项目经历
#### 多合一平台搭建（管理后台）/ [https://one.zuifuli.com](https://one.zuifuli.com)

##### 项目描述：
* 现将多个平台功能整合，用户统一入口登录，方便操作同时多个平台功能。

##### 项目需求：
* 页面风格简洁，易于扩展后续功能。
* 多个平台整合统一，支持内嵌其他平台页面。
* 为方便用户操作，实现类似浏览器多个Tab切换功能，并本地保存用户操作，再次打开时还原窗口。

##### 项目难点
* 如何整合多个平台功能。
* 类似浏览器Tab，子级路由在当前Tab加载子级页面，同级路由新开Tab并加载页面。
* 如何滤敏感数据。
* 如何保存不同用户操作，难点不再于存储，在与如何正确的初始化对应用户信息（初始化在渲染页面之前，请求到用户数据在渲染之后）。

##### 解决方案
* **框架:** Reac + React Router + Redux; **UI框架:** Ant-Design。
* 对于其他平台功能采用Iframe嵌套。对于平台自身功能使用 React-Router, 前端路由进行管理。
* 针对Tab功能, React-Router 来监听路由变化, 并使用Redux记录路由历史, 并根据子级路由或同级路由更新Redux State.
* 针对过滤数据, 整合需要记录的Redux Reducers,Reducers与需要记录数据的key一一对应，从而起到过滤作用。
* 针对不同用户的操作, Redux 添加中间件, 监听State变化，确定用户信息后，更新State。（Redux并不推荐这样直接操作State，这只算一种Hack)。

#### 企业内购商城 / [https://buy.zuifuli.com/custom/homepage](https://buy.zuifuli.com/custom/homepage)

##### 项目描述：
* 搭建内购商城，可购买最福利自营，京东，网易严选三个平台商品。

##### 项目难点
* 多个平台一套UI,多个主题。
* 存在数据的配置,需要根据接口数据实时渲染 (类似，货币单位，货币比例等数据)。 

##### 解决方案
* **框架:** Reac + React Router; **UI框架:** Ant-Design。
* 针对多套主题，可使用[skin-loader](https://www.npmjs.com/package/skin-loader), 实现类似 Less Modify Variables 功能。([skin-loader](https://www.npmjs.com/package/skin-loader) 个人开发的前端动态主题解决方案)。
* 针对数据配置，使用React HOC 创建高阶组件，在渲染后记录组件实例。当数据初始化或更新时，通过组件实例forceUpdate。

#### 中秋活动 / [https://m.zuifuli.com/midautumn/awesome](https://m.zuifuli.com/midautumn/awesome)

##### 项目描述：
* 开发移动版中秋活动页面。

##### 项目难点
* 活动所需的动画效果。
* 动画之间如何流畅的切换。

##### 解决方案
* **框架:** React。
* 动画效果分割，一般动画效果可分为移动，拉伸，缩放，透明度切换, 由于Css 控制时,不同效果transform-origin可能不同，导致如此，这样易于开发以及扩展动画。
* 使用React-transition-group 通过组建State控制动画切换。
* 图片经过使用webpack压缩体积，并开启gizp压缩。

#### H5移动版滴滴打车 / [https://h5.zuifuli.com/taxi](https://h5.zuifuli.com/taxi)

##### 项目描述：
* 开发H5移动版滴滴打车。

##### 项目难点
* React与其他框架配合使用。

##### 解决方案
* **框架:** Reac + 高德JS API。
* 分割组件，将页面业务逻辑与地图处理逻辑分开。

#### 个人项目
* **[create-react-file](https://www.npmjs.com/package/create-react-file):** 命令行创建React组件工具，支持React, React-Router 不同版本切换。
* **[skin-loader](https://www.npmjs.com/package/skin-loader):** 前端动态主题解决方案，基于Webpack + Sass。(最终会被Css Variables 替代)
* **[fondle](https://www.npmjs.com/package/fondle):** 针对移动端浏览器默认滚屏的解决方案（类似 微信，Safari）。
* **[晓地方](https://xiaodifang.club):** 在线简历生成模板。
