define([
	'Class',
	'managers/BaseObjectActive',
	'three',
	'core/appState'
], function(
	Class,
	BaseObjectActive,
	THREE,
	appState
){
	var SceneManager = new Class({
		Extends: BaseObjectActive,
		scene: undefined,
		camera: undefined,
		cameraController: undefined,
		cameraFOV: 37,
		distanceNear: 1,
		distanceFar: 3000,
		emDoodle: undefined,
		camDefaultRotation: undefined,
		camDefaultPosition: undefined,
		bgColor: 'transperent',
		mouseStrength: 1,
		lighting: "light",

		initialize: function(params) {
			// if(SceneManager.instance) throw("Singleton enforcer!");
			SceneManager.instance = this;
			this.parent(params);
		},

		setParams: function(values) {
			if(!values.emDoodle) { 
				values.emDoodle = {
					choicesSource:"emDoodles",
					value:"planet"
				}
			};
			
			if(!values.bgColor) values.bgColor = this.bgColor;
			if(!values.mouseStrength) {
				values.mouseStrength = {value:1, min:-10, max:10, step:.01};
			}
			if(!values.lighting) values.lighting = {value: "light", choicesSource:"lighting"};
			this.parent(values);

			if(!this.scene) this.scene = new THREE.Scene();
			
			if(!this.camera) {
				this.camera = new THREE.PerspectiveCamera(this.cameraFOV.value, appState.attr('size.aspectRatio'), this.distanceNear.value, this.distanceFar.value );				
				this.scene.add(this.camera);
			}
			
			appState.attr('scene.distanceFar', this.distanceFar.value);

			this.camera.position = new THREE.Vector3(this.camDefaultPosition.x.value, this.camDefaultPosition.y.value, this.camDefaultPosition.z.value);			
			this.camera.far = this.distanceFar.value;
		},

		update: function() {
			if(this.cameraController) this.cameraController.update();
		}
	});

	return SceneManager;
});