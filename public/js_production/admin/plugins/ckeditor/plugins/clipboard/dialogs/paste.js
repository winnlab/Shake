/*
 Copyright (c) 2003-2013, CKSource - Frederico Knabben. All rights reserved.
 For licensing, see LICENSE.md or http://ckeditor.com/license
*/

CKEDITOR.dialog.add("paste",function(e){function t(t){var n=new CKEDITOR.dom.document(t.document),r=n.getBody(),i=n.getById("cke_actscrpt");i&&i.remove(),r.setAttribute("contenteditable",!0),CKEDITOR.env.ie&&8>CKEDITOR.env.version&&n.getWindow().on("blur",function(){n.$.selection.empty()}),n.on("keydown",function(e){var e=e.data,t;switch(e.getKeystroke()){case 27:this.hide(),t=1;break;case 9:case CKEDITOR.SHIFT+9:this.changeFocus(1),t=1}t&&e.preventDefault()},this),e.fire("ariaWidget",new CKEDITOR.dom.element(t.frameElement)),n.getWindow().getFrame().removeCustomData("pendingFocus")&&r.focus()}var n=e.lang.clipboard;return e.on("pasteDialogCommit",function(t){t.data&&e.fire("paste",{type:"auto",dataValue:t.data})},null,null,1e3),{title:n.title,minWidth:CKEDITOR.env.ie&&CKEDITOR.env.quirks?370:350,minHeight:CKEDITOR.env.quirks?250:245,onShow:function(){this.parts.dialog.$.offsetHeight,this.setupContent(),this.parts.title.setHtml(this.customTitle||n.title),this.customTitle=null},onLoad:function(){(CKEDITOR.env.ie7Compat||CKEDITOR.env.ie6Compat)&&"rtl"==e.lang.dir&&this.parts.contents.setStyle("overflow","hidden")},onOk:function(){this.commitContent()},contents:[{id:"general",label:e.lang.common.generalTab,elements:[{type:"html",id:"securityMsg",html:'<div style="white-space:normal;width:340px">'+n.securityMsg+"</div>"},{type:"html",id:"pasteMsg",html:'<div style="white-space:normal;width:340px">'+n.pasteMsg+"</div>"},{type:"html",id:"editing_area",style:"width:100%;height:100%",html:"",focus:function(){var e=this.getInputElement(),t=e.getFrameDocument().getBody();!t||t.isReadOnly()?e.setCustomData("pendingFocus",1):t.focus()},setup:function(){var r=this.getDialog(),i='<html dir="'+e.config.contentsLangDirection+'" lang="'+(e.config.contentsLanguage||e.langCode)+'"><head><style>body{margin:3px;height:95%}</style></head><body><script id="cke_actscrpt" type="text/javascript">window.parent.CKEDITOR.tools.callFunction('+CKEDITOR.tools.addFunction(t,r)+",this);</script></body></html>",s=CKEDITOR.env.air?"javascript:void(0)":CKEDITOR.env.ie?"javascript:void((function(){"+encodeURIComponent("document.open();("+CKEDITOR.tools.fixDomain+")();document.close();")+'})())"':"",o=CKEDITOR.dom.element.createFromHtml('<iframe class="cke_pasteframe" frameborder="0"  allowTransparency="true" src="'+s+'" role="region" aria-label="'+n.pasteArea+'" aria-describedby="'+r.getContentElement("general","pasteMsg").domId+'" aria-multiple="true"></iframe>');o.on("load",function(n){n.removeListener(),n=o.getFrameDocument(),n.write(i),e.focusManager.add(n.getBody()),CKEDITOR.env.air&&t.call(this,n.getWindow().$)},r),o.setCustomData("dialog",r),r=this.getElement(),r.setHtml(""),r.append(o);if(CKEDITOR.env.ie){var u=CKEDITOR.dom.element.createFromHtml('<span tabindex="-1" style="position:absolute" role="presentation"></span>');u.on("focus",function(){setTimeout(function(){o.$.contentWindow.focus()})}),r.append(u),this.focus=function(){u.focus(),this.fire("focus")}}this.getInputElement=function(){return o},CKEDITOR.env.ie&&(r.setStyle("display","block"),r.setStyle("height",o.$.offsetHeight+2+"px"))},commit:function(){var e=this.getDialog().getParentEditor(),t=this.getInputElement().getFrameDocument().getBody(),n=t.getBogus(),r;n&&n.remove(),r=t.getHtml(),setTimeout(function(){e.fire("pasteDialogCommit",r)},0)}}]}]}});