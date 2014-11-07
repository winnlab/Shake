/*!
 * Bootstrap Colorpicker
 * http://mjolnic.github.io/bootstrap-colorpicker/
 *
 * Originally written by (c) 2012 Stefan Petre
 * Licensed under the Apache License v2.0
 * http://www.apache.org/licenses/LICENSE-2.0.txt
 *
 * @todo Update DOCS
 */

(function(e){var t=function(e){this.value={h:0,s:0,b:0,a:1},this.origFormat=null,e&&(e.toLowerCase!==undefined?this.setColor(e):e.h!==undefined&&(this.value=e))};t.prototype={constructor:t,_sanitizeNumber:function(e){return typeof e=="number"?e:isNaN(e)||e===null||e===""||e===undefined?1:e.toLowerCase!==undefined?parseFloat(e):1},setColor:function(e){e=e.toLowerCase(),this.value=this.stringToHSB(e)||{h:0,s:0,b:0,a:1}},stringToHSB:function(t){t=t.toLowerCase();var n=this,r=!1;return e.each(this.stringParsers,function(e,i){var s=i.re.exec(t),o=s&&i.parse.apply(n,[s]),u=i.format||"rgba";return o?(u.match(/hsla?/)?r=n.RGBtoHSB.apply(n,n.HSLtoRGB.apply(n,o)):r=n.RGBtoHSB.apply(n,o),n.origFormat=u,!1):!0}),r},setHue:function(e){this.value.h=1-e},setSaturation:function(e){this.value.s=e},setBrightness:function(e){this.value.b=1-e},setAlpha:function(e){this.value.a=parseInt((1-e)*100,10)/100},toRGB:function(e,t,n,r){e=e||this.value.h,t=t||this.value.s,n=n||this.value.b,r=r||this.value.a;var i,s,o,u,a,f,l,c;e&&t===undefined&&n===undefined&&(t=e.s,n=e.v,e=e.h),u=Math.floor(e*6),a=e*6-u,f=n*(1-t),l=n*(1-a*t),c=n*(1-(1-a)*t);switch(u%6){case 0:i=n,s=c,o=f;break;case 1:i=l,s=n,o=f;break;case 2:i=f,s=n,o=c;break;case 3:i=f,s=l,o=n;break;case 4:i=c,s=f,o=n;break;case 5:i=n,s=f,o=l}return{r:Math.floor(i*255),g:Math.floor(s*255),b:Math.floor(o*255),a:r}},toHex:function(e,t,n,r){var i=this.toRGB(e,t,n,r);return"#"+(1<<24|parseInt(i.r)<<16|parseInt(i.g)<<8|parseInt(i.b)).toString(16).substr(1)},toHSL:function(e,t,n,r){e=e||this.value.h,t=t||this.value.s,n=n||this.value.b,r=r||this.value.a;var i=e,s=(2-t)*n,o=t*n;return s>0&&s<=1?o/=s:o/=2-s,s/=2,o>1&&(o=1),{h:i,s:o,l:s,a:r}},RGBtoHSB:function(e,t,n,r){e/=255,t/=255,n/=255;var i,s,o,u;return o=Math.max(e,t,n),u=o-Math.min(e,t,n),i=u===0?null:o===e?(t-n)/u:o===t?(n-e)/u+2:(e-t)/u+4,i=(i+360)%6*60/360,s=u===0?0:u/o,{h:this._sanitizeNumber(i),s:s,b:o,a:this._sanitizeNumber(r)}},HueToRGB:function(e,t,n){return n<0?n+=1:n>1&&(n-=1),n*6<1?e+(t-e)*n*6:n*2<1?t:n*3<2?e+(t-e)*(2/3-n)*6:e},HSLtoRGB:function(e,t,n,r){t<0&&(t=0);var i;n<=.5?i=n*(1+t):i=n+t-n*t;var s=2*n-i,o=e+1/3,u=e,a=e-1/3,f=Math.round(this.HueToRGB(s,i,o)*255),l=Math.round(this.HueToRGB(s,i,u)*255),c=Math.round(this.HueToRGB(s,i,a)*255);return[f,l,c,this._sanitizeNumber(r)]},toString:function(e){e=e||"rgba";switch(e){case"rgb":var t=this.toRGB();return"rgb("+t.r+","+t.g+","+t.b+")";case"rgba":var t=this.toRGB();return"rgba("+t.r+","+t.g+","+t.b+","+t.a+")";case"hsl":var n=this.toHSL();return"hsl("+Math.round(n.h*360)+","+Math.round(n.s*100)+"%,"+Math.round(n.l*100)+"%)";case"hsla":var n=this.toHSL();return"hsla("+Math.round(n.h*360)+","+Math.round(n.s*100)+"%,"+Math.round(n.l*100)+"%,"+n.a+")";case"hex":return this.toHex();default:return!1}},stringParsers:[{re:/#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/,format:"hex",parse:function(e){return[parseInt(e[1],16),parseInt(e[2],16),parseInt(e[3],16),1]}},{re:/#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/,format:"hex",parse:function(e){return[parseInt(e[1]+e[1],16),parseInt(e[2]+e[2],16),parseInt(e[3]+e[3],16),1]}},{re:/rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*?\)/,format:"rgb",parse:function(e){return[e[1],e[2],e[3],1]}},{re:/rgb\(\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*?\)/,format:"rgb",parse:function(e){return[2.55*e[1],2.55*e[2],2.55*e[3],1]}},{re:/rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)/,format:"rgba",parse:function(e){return[e[1],e[2],e[3],e[4]]}},{re:/rgba\(\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)/,format:"rgba",parse:function(e){return[2.55*e[1],2.55*e[2],2.55*e[3],e[4]]}},{re:/hsl\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*?\)/,format:"hsl",parse:function(e){return[e[1]/360,e[2]/100,e[3]/100,e[4]]}},{re:/hsla\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)/,format:"hsla",parse:function(e){return[e[1]/360,e[2]/100,e[3]/100,e[4]]}},{re:/^([a-z]{3,})$/,format:"alias",parse:function(e){var t=this.colorNameToHex(e[0])||"#000000",n=this.stringParsers[0].re.exec(t),r=n&&this.stringParsers[0].parse.apply(this,[n]);return r}}],colorNameToHex:function(e){var t={aliceblue:"#f0f8ff",antiquewhite:"#faebd7",aqua:"#00ffff",aquamarine:"#7fffd4",azure:"#f0ffff",beige:"#f5f5dc",bisque:"#ffe4c4",black:"#000000",blanchedalmond:"#ffebcd",blue:"#0000ff",blueviolet:"#8a2be2",brown:"#a52a2a",burlywood:"#deb887",cadetblue:"#5f9ea0",chartreuse:"#7fff00",chocolate:"#d2691e",coral:"#ff7f50",cornflowerblue:"#6495ed",cornsilk:"#fff8dc",crimson:"#dc143c",cyan:"#00ffff",darkblue:"#00008b",darkcyan:"#008b8b",darkgoldenrod:"#b8860b",darkgray:"#a9a9a9",darkgreen:"#006400",darkkhaki:"#bdb76b",darkmagenta:"#8b008b",darkolivegreen:"#556b2f",darkorange:"#ff8c00",darkorchid:"#9932cc",darkred:"#8b0000",darksalmon:"#e9967a",darkseagreen:"#8fbc8f",darkslateblue:"#483d8b",darkslategray:"#2f4f4f",darkturquoise:"#00ced1",darkviolet:"#9400d3",deeppink:"#ff1493",deepskyblue:"#00bfff",dimgray:"#696969",dodgerblue:"#1e90ff",firebrick:"#b22222",floralwhite:"#fffaf0",forestgreen:"#228b22",fuchsia:"#ff00ff",gainsboro:"#dcdcdc",ghostwhite:"#f8f8ff",gold:"#ffd700",goldenrod:"#daa520",gray:"#808080",green:"#008000",greenyellow:"#adff2f",honeydew:"#f0fff0",hotpink:"#ff69b4","indianred ":"#cd5c5c","indigo ":"#4b0082",ivory:"#fffff0",khaki:"#f0e68c",lavender:"#e6e6fa",lavenderblush:"#fff0f5",lawngreen:"#7cfc00",lemonchiffon:"#fffacd",lightblue:"#add8e6",lightcoral:"#f08080",lightcyan:"#e0ffff",lightgoldenrodyellow:"#fafad2",lightgrey:"#d3d3d3",lightgreen:"#90ee90",lightpink:"#ffb6c1",lightsalmon:"#ffa07a",lightseagreen:"#20b2aa",lightskyblue:"#87cefa",lightslategray:"#778899",lightsteelblue:"#b0c4de",lightyellow:"#ffffe0",lime:"#00ff00",limegreen:"#32cd32",linen:"#faf0e6",magenta:"#ff00ff",maroon:"#800000",mediumaquamarine:"#66cdaa",mediumblue:"#0000cd",mediumorchid:"#ba55d3",mediumpurple:"#9370d8",mediumseagreen:"#3cb371",mediumslateblue:"#7b68ee",mediumspringgreen:"#00fa9a",mediumturquoise:"#48d1cc",mediumvioletred:"#c71585",midnightblue:"#191970",mintcream:"#f5fffa",mistyrose:"#ffe4e1",moccasin:"#ffe4b5",navajowhite:"#ffdead",navy:"#000080",oldlace:"#fdf5e6",olive:"#808000",olivedrab:"#6b8e23",orange:"#ffa500",orangered:"#ff4500",orchid:"#da70d6",palegoldenrod:"#eee8aa",palegreen:"#98fb98",paleturquoise:"#afeeee",palevioletred:"#d87093",papayawhip:"#ffefd5",peachpuff:"#ffdab9",peru:"#cd853f",pink:"#ffc0cb",plum:"#dda0dd",powderblue:"#b0e0e6",purple:"#800080",red:"#ff0000",rosybrown:"#bc8f8f",royalblue:"#4169e1",saddlebrown:"#8b4513",salmon:"#fa8072",sandybrown:"#f4a460",seagreen:"#2e8b57",seashell:"#fff5ee",sienna:"#a0522d",silver:"#c0c0c0",skyblue:"#87ceeb",slateblue:"#6a5acd",slategray:"#708090",snow:"#fffafa",springgreen:"#00ff7f",steelblue:"#4682b4",tan:"#d2b48c",teal:"#008080",thistle:"#d8bfd8",tomato:"#ff6347",turquoise:"#40e0d0",violet:"#ee82ee",wheat:"#f5deb3",white:"#ffffff",whitesmoke:"#f5f5f5",yellow:"#ffff00",yellowgreen:"#9acd32"};return typeof t[e.toLowerCase()]!="undefined"?t[e.toLowerCase()]:!1}};var n={horizontal:!1,inline:!1,color:!1,format:!1,input:"input",container:!1,component:".add-on, .input-group-addon",sliders:{saturation:{maxLeft:100,maxTop:100,callLeft:"setSaturation",callTop:"setBrightness"},hue:{maxLeft:0,maxTop:100,callLeft:!1,callTop:"setHue"},alpha:{maxLeft:0,maxTop:100,callLeft:!1,callTop:"setAlpha"}},slidersHorz:{saturation:{maxLeft:100,maxTop:100,callLeft:"setSaturation",callTop:"setBrightness"},hue:{maxLeft:100,maxTop:0,callLeft:"setHue",callTop:!1},alpha:{maxLeft:100,maxTop:0,callLeft:"setAlpha",callTop:!1}},template:'<div class="colorpicker dropdown-menu"><div class="colorpicker-saturation"><i><b></b></i></div><div class="colorpicker-hue"><i></i></div><div class="colorpicker-alpha"><i></i></div><div class="colorpicker-color"><div /></div></div>'},r=function(r,i){this.element=e(r).addClass("colorpicker-element"),this.options=e.extend({},n,this.element.data(),i),this.component=this.options.component,this.component=this.component!==!1?this.element.find(this.component):!1,this.component&&this.component.length===0&&(this.component=!1),this.container=this.options.container===!0?this.element:this.options.container,this.container=this.container!==!1?e(this.container):!1,this.input=this.element.is("input")?this.element:this.options.input?this.element.find(this.options.input):!1,this.input&&this.input.length===0&&(this.input=!1),this.color=new t(this.options.color!==!1?this.options.color:this.getValue()),this.format=this.options.format!==!1?this.options.format:this.color.origFormat,this.picker=e(this.options.template),this.options.inline?this.picker.addClass("colorpicker-inline colorpicker-visible"):this.picker.addClass("colorpicker-hidden"),this.options.horizontal&&this.picker.addClass("colorpicker-horizontal"),(this.format==="rgba"||this.format==="hsla")&&this.picker.addClass("colorpicker-with-alpha"),this.picker.on("mousedown.colorpicker",e.proxy(this.mousedown,this)),this.picker.appendTo(this.container?this.container:e("body")),this.input!==!1&&(this.input.on({"keyup.colorpicker":e.proxy(this.keyup,this)}),this.component===!1&&this.element.on({"focus.colorpicker":e.proxy(this.show,this)}),this.options.inline===!1&&this.element.on({"focusout.colorpicker":e.proxy(this.hide,this)})),this.component!==!1&&this.component.on({"click.colorpicker":e.proxy(this.show,this)}),this.input===!1&&this.component===!1&&this.element.on({"click.colorpicker":e.proxy(this.show,this)}),this.update(),e(e.proxy(function(){this.element.trigger("create")},this))};r.version="2.0.0-beta",r.Color=t,r.prototype={constructor:r,destroy:function(){this.picker.remove(),this.element.removeData("colorpicker").off(".colorpicker"),this.input!==!1&&this.input.off(".colorpicker"),this.component!==!1&&this.component.off(".colorpicker"),this.element.removeClass("colorpicker-element"),this.element.trigger({type:"destroy"})},reposition:function(){if(this.options.inline!==!1)return!1;var e=this.component?this.component.offset():this.element.offset();this.picker.css({top:e.top+(this.component?this.component.outerHeight():this.element.outerHeight()),left:e.left})},show:function(t){if(this.isDisabled())return!1;this.picker.addClass("colorpicker-visible").removeClass("colorpicker-hidden"),this.reposition(),e(window).on("resize.colorpicker",e.proxy(this.reposition,this)),!this.hasInput()&&t&&t.stopPropagation&&t.preventDefault&&(t.stopPropagation(),t.preventDefault()),this.options.inline===!1&&e(window.document).on({"mousedown.colorpicker":e.proxy(this.hide,this)}),this.element.trigger({type:"showPicker",color:this.color})},hide:function(){this.picker.addClass("colorpicker-hidden").removeClass("colorpicker-visible"),e(window).off("resize.colorpicker",this.reposition),e(document).off({"mousedown.colorpicker":this.hide}),this.update(),this.element.trigger({type:"hidePicker",color:this.color})},updateData:function(e){return e=e||this.color.toString(this.format),this.element.data("color",e),e},updateInput:function(e){return e=e||this.color.toString(this.format),this.input!==!1&&this.input.prop("value",e),e},updatePicker:function(e){e!==undefined&&(this.color=new t(e));var n=this.options.horizontal===!1?this.options.sliders:this.options.slidersHorz,r=this.picker.find("i");if(r.length===0)return;return this.options.horizontal===!1?(n=this.options.sliders,r.eq(1).css("top",n.hue.maxTop*(1-this.color.value.h)).end().eq(2).css("top",n.alpha.maxTop*(1-this.color.value.a))):(n=this.options.slidersHorz,r.eq(1).css("left",n.hue.maxLeft*(1-this.color.value.h)).end().eq(2).css("left",n.alpha.maxLeft*(1-this.color.value.a))),r.eq(0).css({top:n.saturation.maxTop-this.color.value.b*n.saturation.maxTop,left:this.color.value.s*n.saturation.maxLeft}),this.picker.find(".colorpicker-saturation").css("backgroundColor",this.color.toHex(this.color.value.h,1,1,1)),this.picker.find(".colorpicker-alpha").css("backgroundColor",this.color.toHex()),this.picker.find(".colorpicker-color, .colorpicker-color div").css("backgroundColor",this.color.toString(this.format)),e},updateComponent:function(e){e=e||this.color.toString(this.format);if(this.component!==!1){var t=this.component.find("i").eq(0);t.length>0?t.css({backgroundColor:e}):this.component.css({backgroundColor:e})}return e},update:function(e){var t=this.updateComponent();if(this.getValue(!1)!==!1||e===!0)this.updateInput(t),this.updateData(t);return this.updatePicker(),t},setValue:function(e){this.color=new t(e),this.update(),this.element.trigger({type:"changeColor",color:this.color,value:e})},getValue:function(e){e=e===undefined?"#000000":e;var t;this.hasInput()?t=this.input.val():t=this.element.data("color");if(t===undefined||t===""||t===null)t=e;return t},hasInput:function(){return this.input!==!1},isDisabled:function(){return this.hasInput()?this.input.prop("disabled")===!0:!1},disable:function(){return this.hasInput()?(this.input.prop("disabled",!0),!0):!1},enable:function(){return this.hasInput()?(this.input.prop("disabled",!1),!0):!1},currentSlider:null,mousePointer:{left:0,top:0},mousedown:function(t){t.stopPropagation(),t.preventDefault();var n=e(t.target),r=n.closest("div"),i=this.options.horizontal?this.options.slidersHorz:this.options.sliders;if(!r.is(".colorpicker")){if(r.is(".colorpicker-saturation"))this.currentSlider=e.extend({},i.saturation);else if(r.is(".colorpicker-hue"))this.currentSlider=e.extend({},i.hue);else{if(!r.is(".colorpicker-alpha"))return!1;this.currentSlider=e.extend({},i.alpha)}var s=r.offset();this.currentSlider.guide=r.find("i")[0].style,this.currentSlider.left=t.pageX-s.left,this.currentSlider.top=t.pageY-s.top,this.mousePointer={left:t.pageX,top:t.pageY},e(document).on({"mousemove.colorpicker":e.proxy(this.mousemove,this),"mouseup.colorpicker":e.proxy(this.mouseup,this)}).trigger("mousemove")}return!1},mousemove:function(e){e.stopPropagation(),e.preventDefault();var t=Math.max(0,Math.min(this.currentSlider.maxLeft,this.currentSlider.left+((e.pageX||this.mousePointer.left)-this.mousePointer.left))),n=Math.max(0,Math.min(this.currentSlider.maxTop,this.currentSlider.top+((e.pageY||this.mousePointer.top)-this.mousePointer.top)));return this.currentSlider.guide.left=t+"px",this.currentSlider.guide.top=n+"px",this.currentSlider.callLeft&&this.color[this.currentSlider.callLeft].call(this.color,t/100),this.currentSlider.callTop&&this.color[this.currentSlider.callTop].call(this.color,n/100),this.update(!0),this.element.trigger({type:"changeColor",color:this.color}),!1},mouseup:function(t){return t.stopPropagation(),t.preventDefault(),e(document).off({"mousemove.colorpicker":this.mousemove,"mouseup.colorpicker":this.mouseup}),!1},keyup:function(e){if(e.keyCode===38)this.color.value.a<1&&(this.color.value.a=Math.round((this.color.value.a+.01)*100)/100),this.update(!0);else if(e.keyCode===40)this.color.value.a>0&&(this.color.value.a=Math.round((this.color.value.a-.01)*100)/100),this.update(!0);else{var n=this.input.val();this.color=new t(n),this.getValue(!1)!==!1&&(this.updateData(),this.updateComponent(),this.updatePicker())}this.element.trigger({type:"changeColor",color:this.color,value:n})}},e.colorpicker=r,e.fn.colorpicker=function(t){return this.each(function(){var n=e(this),i=n.data("colorpicker"),s=typeof t=="object"?t:{};!i&&typeof t!="string"?n.data("colorpicker",new r(this,s)):typeof t=="string"&&i[t].apply(i,Array.prototype.slice.call(arguments,1))})},e.fn.colorpicker.constructor=r})(window.jQuery);