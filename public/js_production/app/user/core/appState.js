define(["canjs"],function(e){var t=e.Map.extend({imgPath:"/img/user/",uploadPath:"/uploads/",is18Show:!0,menu:"closed",viewMode:"bottle",muted:!1,paused:!1,podcastChange:null,podcast:{playlists:null,currentTitle:null,currentSound:null,currentPlaylist:null,prevPlaylist:null,nextPlaylist:null,currentPlaylistPosition:null,currentPlaylistSystemPosition:null,prevPlaylistPosition:null,nextPlaylistPosition:null},fontSize:function(){return Number($("body").css("font-size").replace(/px$/,""))},getPageHeight:function(){return $("module.active").outerHeight()},size:{width:0,height:0,aspectRatio:0},scene:{originWidth:800,width:800,height:300},locale:data&&data.locale?data.locale:!1,lang:data&&data.lang?"/"+data.lang+"/":"/",langs:data&&data.langs?data.langs:!1,products:data&&data.products?data.products:!1,product:data&&data.product?data.product:!1,parties:data&&data.parties?data.parties:!1,newPodcasts:data&&data.newPodcasts?data.newPodcasts:!1,soundCloudImages:data&&data.soundCloudImages?data.soundCloudImages:!1,getProductImages:function(e){var t=this.attr("products"),n=[];e=e||["bottle","can"];for(var r=t.length-1;r>=0;r--)for(var i=e.length-1;i>=0;i--)t[r].img[e[i]]&&n.push(t[r].img[e[i]]);return n}}),n=new t;return window.appState=n,n});