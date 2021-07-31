# 李晓爽

### 前端工程师
**姓&emsp;&emsp;名 :** 李晓爽 <br> 
**毕业学校 :** 华东交通大学（2015-06毕业）<br> 
**工作年限 :** 6年工作经验 <br> 
**手机电话 :** 13197913032 <br> 
**邮箱地址 :** 1157502759@qq.com <br> 

### 专业技能
**React :** 熟练使用, 熟练hooks使用，渲染优化，工具封装。 <br> 
**CSS3 HTML :** 熟练使用, 熟悉不同浏览器适配及兼容性解决方案。 <br> 

### 个人实践
**[react-mc-dnd](https://github.com/xiaoshuangLi/react-mc/tree/master/packages/react-mc-dnd):** 基于 [react-dnd](https://github.com/react-dnd/react-dnd) 封装实现，数据驱动的拖拽方案。 <br>
**[react-mc-dnd-frame](https://github.com/xiaoshuangLi/react-mc/tree/master/packages/react-mc-dnd-frame):** 基于 [react-dnd](https://github.com/react-dnd/react-dnd) 实现，跨iframe拖拽解决方案。 <br>
**[react-mc-diagrams](https://github.com/xiaoshuangLi/react-mc/tree/master/packages/react-mc-diagrams):** 基于DOM/SVG的简易图形工具。 <br>
**[react-mc-worksapce](https://github.com/xiaoshuangLi/react-mc/tree/master/packages/react-mc-workspace):** 基于[React](https://github.com/facebook/react)的简易可视化编程框架。 <br>
**[react-docgen-props-schema](https://github.com/xiaoshuangLi/react-docgen-props-schema):** 基于 [react-docgen](https://github.com/reactjs/react-docgen), 解析 [PropTypes](https://github.com/facebook/prop-types), 转换输出 [JSON-Schema](https://json-schema.org/understanding-json-schema/index.html)。 <br> 
**[create-react-file](https://github.com/xiaoshuangLi/create-react-file):** 基于 node.js，通过命令行生成 React snippet。 <br>
**[website-changer](https://github.com/xiaoshuangLi/website-changer):** Chrome插件，修改浏览器样式使用。 <br> 
**[UK-Charts](https://github.com/xiaoshuangLi/UK-Charts):** Chrome插件，个人听歌使用。 <br> 
**[晓地方](https://xiaoshuangli.github.io/web-just-for-fun/):**  在线简历模板网站，尝试制作充满惊喜的网站。 <br> 

### 工作经验
**2017.3 - 至今  众安信息科技有限公司 :** 负责前端功能实现。 <br> 
**2015.6 - 2017.3 上海云御信息科技有限公司 :** 负责前端功能实现。 <br> 

## 项目 - 模板化投保开发流程

### 项目描述
主要为了快速响应大量的产品需求的开发流程优化。<br> 
* **传统投保开发流程:** 代码难以复用; 开发周期过长；无法应对大量的产品需求；<br> 
* **模块化投保开发流程:** 通用代码复用性高；开发周期短，3天即可上线；可以快速反馈迭代；<br> 

### 项目实践
**投保流程模板化:** 产品需求其实都是投保流程的执行。一套投保模板包含多个投保页面。多个投保页面的串联实现投保流程。最终产品需求按照投保流程区分。同样投保流程的产品即可使用同样的投保模板开发。 <br> 
**投保页面组件化:** 一个投保页面对应多个组件。产品需求的开发，大部分只需要定制开发模板对应页面的部分组件。尽量通过定制开发少量组件来实现产品需求。不修改模板以及投保流程。 <br> 
**投保数据配置化:** 页面的投保数据，不需要硬编码到代码文件中。后端提供商品数据，前端通过移动魔方的配置工具来配置页面展示数据。 <br> 

## 项目 - 移动魔方建站平台

### 项目描述
移动魔方是一个针对移动端页面的 low-code 建站工具，主要实现以下两方面功能：
* 通过拖拽组件轻松的进行页面的排版布局；
* 通过可视化编程来编写页面的运行逻辑。

### 技术难点
**页面布局编排:** 拖拽功能：需要支持多层级结构拖拽。 <br> 
**页面布局编排:** 页面还原：需要精准还原移动端页面。 <br> 

**物料组件库:** 结构定义：需要简单明了，易于维护。 <br> 
**物料组件库:** 对接门槛：需要对接使用原生组件，降低开发成本。 <br> 

**可视化编程:** 逻辑整合：需要整合现有逻辑，并简化操作。 <br> 
**可视化编程:** 界面直观：需要直观体现任务队列，方便用户操作编排。 <br> 

**逻辑还原:** 逻辑还原：需要自行实现任务队列执行机制。 <br> 
**逻辑还原:** 跨“平台“：需要还原方案不局限于[React](https://github.com/facebook/react)。 <br> 

### 项目实践
**页面布局编排:** 拖拽功能：使用[react-mc-dnd](https://github.com/xiaoshuangLi/react-mc/tree/master/packages/react-mc-dnd)，将拖拽行为映射到页面数据的变更。 <br> 
**页面布局编排:** 页面还原：使用[react-mc-dnd-frame](https://github.com/xiaoshuangLi/react-mc/tree/master/packages/react-mc-dnd-frame)，页面渲染到iframe子页面，精准还原，所见即所得。 <br>

**物料组件库:** 结构定义：基于 [PropTypes](https://github.com/facebook/prop-types) 描述物料组件数据结构，[JSDoc](https://jsdoc.app/) 拓展描述数据定义。 <br> 
**物料组件库:** 对接门槛：使用[react-docgen-props-schema](https://github.com/xiaoshuangLi/react-docgen-props-schema)解析物料组件代码，兼容[React](https://github.com/facebook/react)生态组件。 <br>  

**可视化编程:** 逻辑整合：基于事件驱动实现页面逻辑，符合开发编程思维模式。 <br> 
**可视化编程:** 界面直观：项目初期，使用[scratch-blocks](https://github.com/LLK/scratch-blocks)实现可视化编程界面操作。由于框架拓展性，易用性不足，自行整合开发[react-mc-worksapce](https://github.com/xiaoshuangLi/react-mc/tree/master/packages/react-mc-workspace)替代使用。 <br> 

**逻辑还原:** 逻辑还原：逻辑还原框架由四个模块组成。
* **State/数据模块:** 承担数据的读取与修改；
* **Core/运行模块:** 运行任务队列，处理通用事件触发机制；
* **Render/渲染模块:** 负责对应框架的渲染处理，移动魔方的框架为 React；
* **Blockly/逻辑模块:** 存储可执行的代码逻辑块，与储存的逻辑数据对应执行。

**逻辑还原:** 跨“平台“：只有 Render 模块才会与框架耦合，需要替换 Render 模块即可。

