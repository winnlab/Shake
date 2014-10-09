define([
	'jquery',
	'Class',
	'three',
	'managers/SceneManager',
	'managers/RenderManager'
],function(
	$,
	Class,
	THREE,
	SceneManager,
	RenderManager
) {
	var WorldManager = new Class({
		
		forceCanvas: false,

		initialize: function(values) {

			// if (WorldManager.instance) throw("Singleton enforcer!");
			// WorldManager.instance = this;
			
			THREE.ImageUtils.crossOrigin = "";
			
			//scene and camera
			var sceneManager = new SceneManager({
				cameraFOV: 37,
				distanceNear: 1,
				distanceFar: 3000,
				camDefaultRotation: {
					x:0,
					y:0,
					z:0
				},
				camDefaultPosition: {
					x:0,
					y:0,
					z:400
				}
			});

			//renderer
			this.renderManager = new RenderManager({
				showStats: this.showStats,
				forceCanvas: this.forceCanvas,
				// qualityDegradeWhenFPSBelow: values.qualityDegradeWhenFPSBelow,
				// qualityUpgradeWhenFPSAbove: values.qualityUpgradeWhenFPSAbove,
				alpha: values.alpha,
				bgColor: values.bgColor,
				warmupCounter: values.warmupCounter,
				selector: values.selector || 'checkTitle',
				title: values.title || appState.attr('locale.checkAge'),
				align: values.align || 'center',
				letterSpacing: values.letterSpacing,
				fontSize: values.fontSize,
				spaceWidth: values.spaceWidth,
				lineOffset: values.lineOffset,
				mouseRadius: values.mouseRadius
			});
			
		    this.renderManager.onWindowResize();

		    this.animateBound = this.animate.bind(this);
		    requestAnimationFrame(this.animateBound);
		},

		animate: function (time, once) {
			// console.log('!!!');
			this.renderManager.render();
			if (!once)
				this.requestId = requestAnimationFrame(this.animateBound);
		},

		stopAnimate: function() {
			if (this.requestId) {
				window.cancelAnimationFrame(this.requestId);
				this.requestId = null;
			}
		}
	});

	return WorldManager;
});