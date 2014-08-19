define([
	'jquery',
	'Class',
	'three',
	'core/appState',	
	'managers/SceneManager',
	'managers/TextManager',
	'TweenLite'
], function(
	$,
	Class,
	THREE,
	appState,
	SceneManager,
	TextManager,
	TweenLite
){
	var RenderManager = new Class({		
		renderer: undefined,
		rendererWebGL: undefined,
		rendererCanvas: undefined,
		antialias: true,
		camera: undefined,
		scene: undefined,
		bgColor: "transperent",
		forceCanvas: false,
		clearAlpha: 1,
		alpha: false,
		performanceScale: 1,		
		warmupCounter: 5,

		initialize: function(params){
			this.options = params;
			// if(RenderManager.instance) throw("Singleton enforcer!");
			RenderManager.instance = this;

			this.parent(params);			

			this.camera = SceneManager.instance.camera;
			this.scene = SceneManager.instance.scene;

			this._canvasContext = null;
			
			this.warmupCounter = 25;
			
			this.rendererCanvas = new THREE.CanvasRenderer({
				alpha: this.clearAlpha,
				clearColor: this.bgColor
			});
			this.renderer = this.rendererCanvas;

			this._canvasContext = this.rendererCanvas.domElement.getContext("2d");
			
			var container = document.getElementById(params.selector);
			container.appendChild(this.renderer.domElement);

			window.addEventListener('resize', this.onWindowResize.bind(this), false);
			
			this.hasRenderedOnce = false;
			this.initText(params);			
		},		

		onWindowResize:function() {			
			var winWidth = appState.attr('scene.width'),
				winHeight = appState.attr('scene.height'),
				w = ~~(winWidth * this.performanceScale),
				h = ~~(winHeight * this.performanceScale);
			
			this.renderer.setSize(w, h);
			$(this.renderer.domElement).css("width", winWidth + "px").css("height", winHeight + "px");
			this.camera.aspect = appState.attr('scene.aspectRatio');
			this.camera.updateProjectionMatrix();
			this.camera.far = appState.attr('scene.distanceFar');
			
			this.resizeText(winWidth, winHeight);
		},

		render: function() {			

			if(this.warmupCounter > 0) {
				this.warmupCounter--;
				this.renderer.clear();
				return;
			}

			if (this._canvasContext) {
				this._canvasContext.clearRect(0, 0, appState.attr('scene.width'), appState.attr('scene.height'));				
				this.renderer.clear();
			}
			
			this.renderer.render(this.scene, this.camera);
			
			this.renderText();
			
			if (!this.hasRenderedOnce) {
				this.hasRenderedOnce = true;
				this.animateInText();
			}

		},
		
		initText: function(params) {
			//We fake anti-aliasing by rendering to a 2x FBO and then down-scaling
			//If this is causing performance issues, set to false

			//This is automatically disabled when the user resizes their browser very large,
			//or if we're using a huge font size.
			this.forceTextAntialiasing = true;

			//NOTE: We're disabling this for retina devices, since we should already get AA for free.
			//More importantly, it causes a problem since the "anti-alias" FBO is not big enough
			if (this.renderer.devicePixelRatio > 1)
				this.forceTextAntialiasing = false;
			
			var simpleMesh = !this.rendererWebGL; //simplify the mesh for canvas

			this.textManager = new TextManager(params.title, {
				//font size in points (roughly)
				fontSize: params.fontSize || appState.fontSize() * 5,
				//number of steps for curves and lines, leads to more triangles
				// steps: 10,

				//a factor for simplifying the mesh,
				//10 means more simple, 100 means more complex,
				//0 means no simplification at all (i.e. most complex)
				// simplify: 50,

				//Allows us to control when the text "snaps" back into place,
				//to avoid thin lines between triangles
				snap: 0.999,
				text: params.title,
				align: params.align,
				letterSpacing: params.letterSpacing,
				spaceWidth: params.spaceWidth,
				lineOffset: params.lineOffset,
				mouseRadius: params.mouseRadius
			}, TweenLite, null, simpleMesh);

			this.textManager.style = 0;

			var winWidth = appState.attr('scene.width'),
				winHeight = appState.attr('scene.height'),
				w = ~~(winWidth * this.performanceScale),
				h = ~~(winHeight * this.performanceScale);			

			
			this.resizeText(winWidth, winHeight);

			$(window).on("mousemove.textfx", function(ev) {				
				var scl = 1;

				if (this.forceTextAntialiasing || this._canvasContext)
					scl = this.renderer.devicePixelRatio * this.performanceScale;

				var off = $(this.renderer.domElement).offset();
				this.textManager.onTouchMove(ev.pageX*scl - off.left, ev.pageY*scl - off.top);
			}.bind(this));

			this.textManager.color.a = 0;
		},

		setTextAlpha: function(a) {
			this.textManager.color.a = a;
		},

		animateInText: function() {
			// console.log("ANIM IN TEXT");
			this.textManager.animateIn({
				onStart: this.setTextAlpha.bind(this, 1.0),
				delay: 0,
				delayIncrement: 0.2,
				duration: 0.8,
				yOff: 30,				
				ease: Expo.easeOut
			}, { //alpha options
				ease: Linear.easeNone,
				duration: 0.3,
				delay: 0,
			});
		},

		destroyText: function() {
			$(window).off("mousemove.textfx");
		},

		resizeText: function(width, height) {
			if (!this.textManager)
				return;

			if (this.forceTextAntialiasing || this._canvasContext) {
				width *= this.renderer.devicePixelRatio * this.performanceScale;
				height *= this.renderer.devicePixelRatio * this.performanceScale;
			}


			var TARGET_WIDTH = 1024;
			var TARGET_HEIGHT = 300;

			var scale = width / TARGET_WIDTH;

			scale = Math.max(0.75, Math.min(2.2, scale));			

			if (this._canvasContext) {
				scale *= this.performanceScale;				
			}

			var textManager = this.textManager;


			//set new window size
			textManager.resize(width, height);

			//update camera matrices			
			var y = (height - textManager.height * scale) / 2;

			textManager.scale = scale;

			if (this.options.align == 'center') {
				textManager.setPosition((width-textManager.width*scale)/2, y );
			} else if (this.options.align == 'left') {
				textManager.setPosition(0, y);
			}

			textManager.updateCamera();

		},

		renderText: function() {			
			this.textManager.update(0.3);

			this._canvasContext.fillStyle = 'black';
			this._canvasContext.strokeStyle = 'black';
			this._canvasContext.globalCompositeOperation = 'source-over';

			this.textManager.renderCanvas(this._canvasContext);
			this._canvasContext.fillStyle = 'white';
			this._canvasContext.strokeStyle = 'white';			
		},

	});
	return RenderManager;
});
