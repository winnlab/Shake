/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:18 GMT
 * Licensed MIT
 * Includes: CanJS default build
 * Download from: http://canjs.us/
 */

define(["can/util/library"],function(e){var t=e.bubble={event:function(e,t){return e.constructor._bubbleRule(t,e)},childrenOf:function(e,n){e._each(function(r,i){r&&r.bind&&t.toParent(r,e,i,n)})},teardownChildrenFrom:function(e,n){e._each(function(r){t.teardownFromParent(e,r,n)})},toParent:function(t,n,r,i){e.listenTo.call(n,t,i,function(){var i=e.makeArray(arguments),s=i.shift();i[0]=(e.List&&n instanceof e.List?n.indexOf(t):r)+(i[0]?"."+i[0]:""),s.triggeredNS=s.triggeredNS||{};if(s.triggeredNS[n._cid])return;s.triggeredNS[n._cid]=!0,e.trigger(n,s,i)})},teardownFromParent:function(t,n,r){n&&n.unbind&&e.stopListening.call(t,n,r)},isBubbling:function(e,t){return e._bubbleBindings&&e._bubbleBindings[t]},bind:function(e,n){if(!e._init){var r=t.event(e,n);r&&(e._bubbleBindings||(e._bubbleBindings={}),e._bubbleBindings[r]?e._bubbleBindings[r]++:(e._bubbleBindings[r]=1,t.childrenOf(e,r)))}},unbind:function(n,r){var i=t.event(n,r);i&&(n._bubbleBindings&&n._bubbleBindings[i]--,n._bubbleBindings&&!n._bubbleBindings[i]&&(delete n._bubbleBindings[i],t.teardownChildrenFrom(n,i),e.isEmptyObject(n._bubbleBindings)&&delete n._bubbleBindings))},add:function(n,r,i){if(r instanceof e.Map&&n._bubbleBindings)for(var s in n._bubbleBindings)n._bubbleBindings[s]&&(t.teardownFromParent(n,r,s),t.toParent(r,n,i,s))},removeMany:function(e,n){for(var r=0,i=n.length;r<i;r++)t.remove(e,n[r])},remove:function(n,r){if(r instanceof e.Map&&n._bubbleBindings)for(var i in n._bubbleBindings)n._bubbleBindings[i]&&t.teardownFromParent(n,r,i)},set:function(n,r,i,s){return e.Map.helpers.isObservable(i)&&t.add(n,i,r),e.Map.helpers.isObservable(s)&&t.remove(n,s),i}};return t});