/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:18 GMT
 * Licensed MIT
 * Includes: CanJS default build
 * Download from: http://canjs.us/
 */

steal("can/util","can/map","can/list","can/compute",function(e){return e.Observe=e.Map,e.Observe.startBatch=e.batch.start,e.Observe.stopBatch=e.batch.stop,e.Observe.triggerBatch=e.batch.trigger,e});