webpackHotUpdate(0,{

/***/ 49:
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(135)();
	// imports
	
	
	// module
	exports.push([module.id, ".bg, .side:before, .percenter, .btn:before, .svg-hide {\n  position: absolute; }\n\n.body, .z-1 {\n  position: relative; }\n\n.bg {\n  position: fixed; }\n\n\ninput[type='number']::-webkit-inner-spin-button, .ng-hide {\n  display: none; }\n\n.table {\n  width: 100%; }\n\n.pointer {\n  cursor: pointer; }\n\n.svg-hide {\n  opacity: 0; }\n\n.center.table > * {\n  vertical-align: middle; }\n\n.text-center {\n  text-align: center; }\n\n.text-left {\n  text-align: left; }\n\n.text-right {\n  text-align: right; }\n\n.left, .fw-5, .fw-10, .fw-15, .fw-20, .fw-25, .fw-30, .fw-35, .fw-40, .fw-45, .fw-50, .fw-55, .fw-60, .fw-65, .fw-70, .fw-75, .fw-80, .fw-85, .fw-90, .fw-95, .fw-100 {\n  float: left; }\n\n.right {\n  float: right; }\n\n.bg, .side:before {\n  left: 0;\n  right: 0; }\n\n.bg, .side:before {\n  top: 0;\n  bottom: 0; }\n\n.percenter, .btn:before {\n  left: 50%;\n  top: 50%;\n  transform: translate(-50%, -50%); }\n\n.row:before, .rooms .room:before, .row:after, .rooms .room:after {\n  content: '';\n  display: table;\n  clear: both; }\n\n.bg {\n  background-color: rgba(0, 0, 0, 0.3); }\n\n.z-1 {\n  z-index: 1; }\n\n.table {\n  display: table; }\n  .table > * {\n    display: table-cell; }\n    .table > *.equal {\n      width: 50%; }\n\ninput, textarea, * {\n  padding: 0;\n  margin: 0;\n  -webkit-tap-highlight-color: transparent;\n  tap-highlight-color: transparent;\n  box-sizing: border-box;\n  outline: none;\n  -webkit-overflow-scrolling: touch;\n  -webkit-text-size-adjust: none;\n  -webkit-perspective: 100%;\n  border-radius: 0px; }\n\ninput, textarea {\n  -webkit-appearance: none; }\n\na {\n  color: inherit;\n  text-decoration: none; }\n\nbody {\n  color: #666;\n  font-family: \"Hiragino Sans GB\",\"Microsoft YaHei\",simsun, Helvetica;\n  font-size: 12px;\n  font-weight: 100;\n  height: 100vh;\n  @extends %bg-grey; }\n\n.hidden {\n  @extends %hidden; }\n\n.bg {\n  z-index: -1; }\n\n.transparent {\n  opacity: 0; }\n\n.mask-hide {\n  -webkit-mask-image: -webkit-gradient(linear, 0 0, 0 0, from(transparent), to(transparent)); }\n\n.opacity-ani {\n  animation: opacityFade 0.7s ease-in; }\n\n.fw-5 {\n  width: 5%; }\n\n@media (max-width: 640px) {\n  .fw-5:not(.all) {\n    width: 100%;\n    padding: 0 15px; } }\n\n.fw-10 {\n  width: 10%; }\n\n@media (max-width: 640px) {\n  .fw-10:not(.all) {\n    width: 100%;\n    padding: 0 15px; } }\n\n.fw-15 {\n  width: 15%; }\n\n@media (max-width: 640px) {\n  .fw-15:not(.all) {\n    width: 100%;\n    padding: 0 15px; } }\n\n.fw-20 {\n  width: 20%; }\n\n@media (max-width: 640px) {\n  .fw-20:not(.all) {\n    width: 100%;\n    padding: 0 15px; } }\n\n.fw-25 {\n  width: 25%; }\n\n@media (max-width: 640px) {\n  .fw-25:not(.all) {\n    width: 100%;\n    padding: 0 15px; } }\n\n.fw-30 {\n  width: 30%; }\n\n@media (max-width: 640px) {\n  .fw-30:not(.all) {\n    width: 100%;\n    padding: 0 15px; } }\n\n.fw-35 {\n  width: 35%; }\n\n@media (max-width: 640px) {\n  .fw-35:not(.all) {\n    width: 100%;\n    padding: 0 15px; } }\n\n.fw-40 {\n  width: 40%; }\n\n@media (max-width: 640px) {\n  .fw-40:not(.all) {\n    width: 100%;\n    padding: 0 15px; } }\n\n.fw-45 {\n  width: 45%; }\n\n@media (max-width: 640px) {\n  .fw-45:not(.all) {\n    width: 100%;\n    padding: 0 15px; } }\n\n.fw-50 {\n  width: 50%; }\n\n@media (max-width: 640px) {\n  .fw-50:not(.all) {\n    width: 100%;\n    padding: 0 15px; } }\n\n.fw-55 {\n  width: 55%; }\n\n@media (max-width: 640px) {\n  .fw-55:not(.all) {\n    width: 100%;\n    padding: 0 15px; } }\n\n.fw-60 {\n  width: 60%; }\n\n@media (max-width: 640px) {\n  .fw-60:not(.all) {\n    width: 100%;\n    padding: 0 15px; } }\n\n.fw-65 {\n  width: 65%; }\n\n@media (max-width: 640px) {\n  .fw-65:not(.all) {\n    width: 100%;\n    padding: 0 15px; } }\n\n.fw-70 {\n  width: 70%; }\n\n@media (max-width: 640px) {\n  .fw-70:not(.all) {\n    width: 100%;\n    padding: 0 15px; } }\n\n.fw-75 {\n  width: 75%; }\n\n@media (max-width: 640px) {\n  .fw-75:not(.all) {\n    width: 100%;\n    padding: 0 15px; } }\n\n.fw-80 {\n  width: 80%; }\n\n@media (max-width: 640px) {\n  .fw-80:not(.all) {\n    width: 100%;\n    padding: 0 15px; } }\n\n.fw-85 {\n  width: 85%; }\n\n@media (max-width: 640px) {\n  .fw-85:not(.all) {\n    width: 100%;\n    padding: 0 15px; } }\n\n.fw-90 {\n  width: 90%; }\n\n@media (max-width: 640px) {\n  .fw-90:not(.all) {\n    width: 100%;\n    padding: 0 15px; } }\n\n.fw-95 {\n  width: 95%; }\n\n@media (max-width: 640px) {\n  .fw-95:not(.all) {\n    width: 100%;\n    padding: 0 15px; } }\n\n.fw-100 {\n  width: 100%; }\n\n@media (max-width: 640px) {\n  .fw-100:not(.all) {\n    width: 100%;\n    padding: 0 15px; } }\n\n@keyframes opacityFade {\n  0% {\n    opacity: 0; }\n  100% {\n    opacity: 1; } }\n\nbody {\n  background: #fff; }\n\n.header {\n  position: relative; }\n  .header .img {\n    position: absolute;\n    display: inline-block;\n    left: 3px;\n    top: 0;\n    bottom: 0;\n    width: 38px; }\n\n.user-header {\n  padding: 30px 10px 10px;\n  height: 100px;\n  text-align: center;\n  position: relative;\n  border-bottom: 1px solid #eaeaea; }\n  .user-header .setting {\n    top: 10px;\n    left: 10px; }\n  .user-header .avatar, .user-header .setting {\n    position: absolute; }\n  .user-header .avatar {\n    height: 60px;\n    width: 60px;\n    top: inherit;\n    border: 1px solid #eaeaea;\n    display: inline-block;\n    right: 10px;\n    bottom: 0;\n    border-radius: 5px;\n    -webkit-transform: translateY(50%);\n    transform: translateY(50%);\n    background: #fff; }\n  .user-header .name {\n    right: 80px; }\n  .user-header .add, .user-header .name {\n    position: absolute;\n    bottom: 5px; }\n  .user-header .add {\n    right: 110px;\n    color: #60a70c; }\n\n.user-body .body-top {\n  width: calc(100% - 70px);\n  position: relative; }\n  .user-body .body-top .add {\n    color: #60a70c;\n    position: absolute;\n    bottom: 5px;\n    right: 0; }\n\n.people {\n  padding: 10px;\n  height: 70px;\n  white-space: nowrap;\n  border-bottom: 1px solid #eaeaea;\n  overflow-x: scroll;\n  overflow-y: hidden;\n  width: 100%; }\n  .people .person {\n    border: 1px solid #ddd;\n    width: 50px;\n    height: 50px;\n    border-radius: 5px;\n    display: inline-block;\n    margin-right: 5px;\n    position: relative; }\n    .people .person:before {\n      content: '';\n      background: rgba(255, 255, 255, 0.6); }\n    .people .person:after, .people .person:before {\n      position: absolute;\n      bottom: 0;\n      left: 0;\n      width: 100%; }\n    .people .person:after {\n      content: attr(data-after);\n      border-radius: 0 0 5px 5px;\n      text-align: center;\n      padding: 2px 0;\n      font-size: 12px;\n      -webkit-transform: scale(0.7);\n      transform: scale(0.7);\n      -webkit-transform-origin: 50% 100%;\n      transform-origin: 50% 100%; }\n\n.rooms {\n  padding: 10px; }\n  .rooms .room {\n    border-bottom: 1px solid #eaeaea;\n    padding-bottom: 10px; }\n    .rooms .room + .room {\n      margin-top: 10px; }\n    .rooms .room:last-child {\n      border: none; }\n    .rooms .room .img {\n      height: 80px;\n      width: 80px;\n      border: 1px solid #eaeaea;\n      border-radius: 5px;\n      float: left;\n      margin-right: 10px;\n      position: relative; }\n      .rooms .room .img i {\n        font-size: 28px;\n        color: #aaa; }\n    .rooms .room .title {\n      font-size: 14px; }\n\n.tags {\n  font-size: 12px; }\n  .tags .tag {\n    border: 1px solid #ddd;\n    display: inline-block;\n    border-radius: 3px;\n    padding: 2px 5px;\n    margin: 0 5px 5px 0; }\n    .tags .tag.add {\n      color: #60a70c; }\n\n.side {\n  position: fixed;\n  left: 0;\n  top: 0;\n  bottom: 0;\n  width: 50%;\n  padding: 10px;\n  text-align: center;\n  color: #666; }\n  .side:before {\n    content: '';\n    background: #fff; }\n  .side .avatar {\n    position: relative;\n    top: 0;\n    margin: 0 auto;\n    width: 60px;\n    height: 60px;\n    border-color: #eaeaea; }\n  .side .name + .option {\n    margin-top: 20px; }\n  .side .name, .side .option {\n    position: relative;\n    margin-top: 5px; }\n  .side .option {\n    text-align: left;\n    padding: 5px 0;\n    border-bottom: 1px solid #eaeaea; }\n    .side .option:after {\n      margin-top: 3px;\n      float: right;\n      content: '\\E609';\n      font-family: t-font !important;\n      font-size: 12px;\n      font-style: normal;\n      -webkit-font-smoothing: antialiased;\n      -moz-osx-font-smoothing: grayscale;\n      color: #ff5e5e; }\n    .side .option.checked:after {\n      content: '\\EEF9';\n      color: #60a70c; }\n  .side .go-rooms {\n    top: 85%; }\n  .side .footer, .side .go-rooms {\n    position: absolute;\n    left: 10px;\n    padding-left: 0; }\n  .side .footer {\n    top: 92%; }\n\n.icon {\n  font-size: 36px;\n  position: absolute;\n  margin: 20px;\n  right: 0;\n  -webkit-transform: rotate(1turn);\n  transform: rotate(1turn);\n  -webkit-transition: 10s;\n  transition: 10s; }\n\n.logo {\n  line-height: .45;\n  top: 2%;\n  left: 75%;\n  -webkit-transform: scale(0.7);\n  transform: scale(0.7); }\n  .logo > * {\n    position: relative; }\n    .logo > *:before {\n      content: attr(data-before); }\n    .logo > *:after, .logo > *:before {\n      vertical-align: middle; }\n    .logo > *:after {\n      content: attr(data-after); }\n  .logo .before {\n    margin-right: 21px; }\n    .logo .before:before {\n      font-size: 48px;\n      font-weight: 700; }\n    .logo .before:after {\n      font-size: 14px;\n      color: #888;\n      position: relative;\n      left: 8px;\n      top: -13px; }\n  .logo .after {\n    float: right; }\n    .logo .after:before {\n      font-size: 14px;\n      color: #888;\n      position: relative;\n      left: -10px;\n      top: 11px; }\n    .logo .after:after {\n      font-size: 48px;\n      font-weight: 700; }\n\n.avatar {\n  top: 35%;\n  height: 80px;\n  width: 80px;\n  border: 1px solid #666;\n  border-radius: 10px; }\n  .avatar .img {\n    font-size: 32px;\n    color: #999; }\n  .avatar .edit {\n    position: absolute;\n    right: 0;\n    bottom: 0;\n    font-size: 12px;\n    padding: 3px;\n    border-left: 1px solid #666;\n    border-top: 1px solid #666;\n    border-radius: 7px 0 0 0; }\n\n.container {\n  color: #333; }\n\n.btn-container {\n  top: 53%; }\n\ninput {\n  border: none;\n  padding: 5px;\n  border-bottom: 1px solid #aaa;\n  font-size: 14px;\n  display: block;\n  width: 100%;\n  padding: 10px;\n  padding-left: 40px;\n  border-bottom: 1px solid #eaeaea; }\n\n.btn {\n  top: 70%;\n  width: 100%;\n  height: 30px; }\n  .btn:after, .btn:before {\n    border-radius: 50px;\n    text-align: center;\n    padding: 5px 10px;\n    color: #666;\n    display: inline-block;\n    width: 45%; }\n  .btn:before {\n    content: attr(data-before);\n    border: 1px solid #aaa;\n    z-index: 1;\n    background: #fff;\n    box-shadow: 1px 1px 1px #fff; }\n  .btn:after {\n    content: '';\n    border-radius: 50px;\n    background: #aaa;\n    left: 25%;\n    bottom: 0;\n    position: absolute;\n    -webkit-transform: skew(55deg, 0deg) scaleY(0.25);\n    transform: skew(55deg, 0deg) scaleY(0.25);\n    -webkit-transform-origin: 100% 100%;\n    transform-origin: 100% 100%;\n    height: 100%; }\n\n.desc {\n  text-align: center;\n  top: 77%;\n  color: #666; }\n\n.href {\n  top: 90%;\n  padding: 2px 3px;\n  border-bottom: 1px solid #888; }\n", ""]);
	
	// exports


/***/ }

})
//# sourceMappingURL=0.ecff29db4527533d312d.hot-update.js.map