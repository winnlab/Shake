/*
Input Mask plugin extensions
http://github.com/RobinHerbots/jquery.inputmask
Copyright (c) 2010 - 2014 Robin Herbots
Licensed under the MIT license (http://www.opensource.org/licenses/mit-license.php)
Version: 0.0.0

Regex extensions on the jquery.inputmask base
Allows for using regular expressions as a mask
*/

(function(e){e.extend(e.inputmask.defaults.aliases,{Regex:{mask:"r",greedy:!1,repeat:"*",regex:null,regexTokens:null,tokenizer:/\[\^?]?(?:[^\\\]]+|\\[\S\s]?)*]?|\\(?:0(?:[0-3][0-7]{0,2}|[4-7][0-7]?)?|[1-9][0-9]*|x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4}|c[A-Za-z]|[\S\s]?)|\((?:\?[:=!]?)?|(?:[?*+]|\{[0-9]+(?:,[0-9]*)?\})\??|[^.?*+^${[()|\\]+|./g,quantifierFilter:/[0-9]+[^,]/,definitions:{r:{validator:function(e,t,n,r,i){function s(){this.matches=[],this.isGroup=!1,this.isQuantifier=!1,this.isLiteral=!1}function o(){var e=new s,t,n,r=[];i.regexTokens=[];while(t=i.tokenizer.exec(i.regex)){n=t[0];switch(n.charAt(0)){case"[":case"\\":r.length>0?r[r.length-1].matches.push(n):e.matches.push(n);break;case"(":!e.isGroup&&e.matches.length>0&&i.regexTokens.push(e),e=new s,e.isGroup=!0,r.push(e);break;case")":var o=r.pop();r.length>0?r[r.length-1].matches.push(o):(i.regexTokens.push(o),e=new s);break;case"{":var u=new s;u.isQuantifier=!0,u.matches.push(n),r.length>0?r[r.length-1].matches.push(u):e.matches.push(u);break;default:var a=new s;a.isLiteral=!0,a.matches.push(n),r.length>0?r[r.length-1].matches.push(a):e.matches.push(a)}}e.matches.length>0&&i.regexTokens.push(e)}function u(e,t){var n=!1;t&&(f+="(",c++);for(var r=0;r<e.matches.length;r++){var s=e.matches[r];if(s["isGroup"]==1)n=u(s,!0);else if(s["isQuantifier"]==1){s=s.matches[0];var o=i.quantifierFilter.exec(s)[0].replace("}",""),a=f+"{1,"+o+"}";for(var l=0;l<c;l++)a+=")";var p=new RegExp("^("+a+")$");n=p.test(h),f+=s}else if(s["isLiteral"]==1){s=s.matches[0];var a=f,d="";for(var l=0;l<c;l++)d+=")";for(var v=0;v<s.length;v++){a=(a+s[v]).replace(/\|$/,"");var p=new RegExp("^("+a+d+")$");n=p.test(h);if(n)break}f+=s}else{f+=s;var a=f.replace(/\|$/,"");for(var l=0;l<c;l++)a+=")";var p=new RegExp("^("+a+")$");n=p.test(h)}if(n)break}return t&&(f+=")",c--),n}i.regexTokens==null&&o();var a=t.slice(),f="",l=!1,c=0;a.splice(n,0,e);var h=a.join("");for(var p=0;p<i.regexTokens.length;p++){var s=i.regexTokens[p];l=u(s,s.isGroup);if(l)break}return l},cardinality:1}}}})})(jQuery);