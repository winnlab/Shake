define([
	'Class', 
	'three'	
],function(
	Class, 
	THREE	
) {
	var BaseClass = new Class({
		doNotEncapsulate: true,
		initialize : function(values){
			this.setParams(values);
		},
		setParams: function(values) {
			
			if ( values === undefined ) return;			
			var keys = [];
			for ( var key in values ) {
				keys.push(key);
			}
			for (var i = keys.length - 1; i >= 0; i--) {
				var key = keys[i];
				
				var newValue = values[ key ];

				if ( newValue === undefined ) {
					console.warn( 'BaseObject: \'' + key + '\' parameter is undefined.' );
					continue;
				}

				if ( key in this ) {
					var currentValue = this[ key ];
					if ( currentValue instanceof THREE.Color ) {
						currentValue.set( newValue );
					} else if ( currentValue instanceof THREE.Vector3 && newValue instanceof THREE.Vector3 ) {
						currentValue.copy( newValue );
					} else {
						this[ key ] = newValue;
						this[ "_" + key ] = newValue;
					}
				}
			}
		},
		transition: function(values) {
			if ( values === undefined ) return;			
		}
	});
	return BaseClass;
});