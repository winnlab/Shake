!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.TextManager=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
var Class = _dereq_('klasse');

var Vector3 = _dereq_('vecmath').Vector3;

var tmp = new Vector3();

/**
 * Creates a "physical text" object where each point (in triangles)
 * has a velocity, position, mass, etc.
 *
 * This does not hold on to the Text3D object
 */
var Constraint = new Class({

	initialize: function(p1, p2, stiffness, restingDistance) {
		this.p1 = p1;
		this.p2 = p2;

		if (typeof restingDistance !== "number")
			restingDistance = p1.position.distance(p2.position);

        
		this.restingDistance = restingDistance;
		this.originalRestingDistance = this.restingDistance;
        this.stiffness = typeof stiffness === "number" ? stiffness : 0.01;
        this.originalStiffness = stiffness;

        this.tearDistance = Number.MAX_VALUE;
	},


    solve: function() {
        var p1 = this.p1,
            p2 = this.p2,
            restingDistance = this.restingDistance,
            stiffness = this.stiffness;
        

        var dx = p2.position.x - p1.position.x;
        var dy = p2.position.y - p1.position.y;
        var dz = p2.position.z - p1.position.z;

        var d = Math.sqrt(dx * dx + dy * dy + dz * dz);


        
        //ratio for resting distance
        var restingRatio = d===0 ? restingDistance : (restingDistance - d) / d;
        
        //invert mass quantities
        var im1 = 1.0 / p1.mass;
        var im2 = 1.0 / p2.mass;
        var scalarP1 = (im1 / (im1 + im2)) * stiffness;
        var scalarP2 = stiffness - scalarP1;
        
        var spring = 1;

        //push/pull based on mass
        p1.velocity.x -= dx * scalarP1 * restingRatio * spring;
        p1.velocity.y -= dy * scalarP1 * restingRatio * spring;
        p1.velocity.z -= dz * scalarP1 * restingRatio * spring;

        p2.velocity.x += dx * scalarP2 * restingRatio * spring;
        p2.velocity.y += dy * scalarP2 * restingRatio * spring;
        p2.velocity.z += dz * scalarP2 * restingRatio * spring;

        // var drest = this.originalRestingDistance - restingDistance;
        // drest = Math.sqrt(drest * drest)
        // this.restingDistance += drest * 0.003;


        return d;
    }
});


module.exports = Constraint;
},{"klasse":34,"vecmath":61}],2:[function(_dereq_,module,exports){
// var domready = require('domready');
// require('raf.js');

var Vector2 = _dereq_('vecmath').Vector2;
var Vector3 = _dereq_('vecmath').Vector3;
var Matrix4 = _dereq_('vecmath').Matrix4;

var World = _dereq_('./World');
var Constraint = _dereq_('./Constraint');
var smoothstep = _dereq_('interpolation').smoothstep;
var lerp = _dereq_('interpolation').lerp;

var util = _dereq_('text3d').util;
var Glyph = _dereq_('text3d').Glyph;
var Text3D = _dereq_('text3d').Text3D;

var OrthographicCamera = _dereq_('cam3d').OrthographicCamera;
var PerspectiveCamera = _dereq_('cam3d').PerspectiveCamera;

var Class = _dereq_('klasse');

///hook in typeface
var _typeface_js = _dereq_('./typeface-stripped');
// var uni_sans = _dereq_('../vendor/uni_sans_bold_B.typeface');
var uni_sans = _dereq_('../vendor/pfdintextcondpro.typeface');

_typeface_js.loadFace(uni_sans);

var WebGLRenderer = _dereq_('./WebGLRenderer');

var tmp = new Vector3();
var tmp2 = new Vector3();
var tmp3 = new Vector3();
var zero = new Vector3();
var force = new Vector3();

var fs = _dereq_('fs');
var vert = "attribute vec4 Position;\nattribute vec4 Color;\n// attribute vec2 TexCoord0;\n\nuniform mat4 u_projModelView;\n\nvarying vec4 v_col;\n// varying vec2 v_texCoord0;\n\nvoid main() {\n\tgl_Position = u_projModelView * vec4(Position.xyz, 1.0);\n\tv_col = Color;\n\t// v_texCoord0 = TexCoord0;\n}";
var frag = "#ifdef GL_ES\nprecision mediump float;\n#endif\nvarying vec4 v_col;\n// varying vec2 v_texCoord0;\n// uniform sampler2D u_sampler0;\n\nvoid main() {\n\tgl_FragColor = v_col; //* texture2D(u_sampler0, v_texCoord0);\n}";
var vignetteFrag = "#ifdef GL_ES\nprecision mediump float;\n#endif\n\nuniform sampler2D u_texture0;\n\nvarying vec4 vColor;\nvarying vec2 vTexCoord0;\n\nvoid main() {\n\tfloat dist = smoothstep(0.5, 0.35, length(vTexCoord0.xy - 0.5));\n\tgl_FragColor = vColor * texture2D(u_texture0, vTexCoord0);\n\tgl_FragColor.a *= dist;\n}";



/////// LIST OF THINGS TO REMOVE BEFORE PRODUCTION
/// - Reduce Mesh vert size since no lines is necessary
/// - Remove preset / GUI
/// - Remove dat.gui.v2 from main
/// - Remove cache bust from main
/// - failIfMajorPerformanceCaveat


///////
///GET RID OF THESE FOR PRODUCTION
var Preset0 = JSON.parse( "{\n  \"preset\": \"Default\",\n  \"closed\": false,\n  \"remembered\": {\n    \"Default\": {\n      \"0\": {\n        \"steps\": 30,\n        \"simplify\": 0,\n        \"letterSpacing\": 2.352231604342581,\n        \"spaceWidth\": 0,\n        \"lineOffset\": -12,\n        \"periodKerning\": 14,\n        \"align\": \"CENTER\",\n        \"spinStrength\": 17.20489402033431,\n        \"mouseStrength\": 10.91849043598139,\n        \"mouseRadius\": 34.153024297777012,\n        \"minMouseMotion\": 5,\n        \"rigidness\": 0.2,\n        \"resetDuration\": 1,\n        \"resetDelay\": 1.191108047561606,\n        \"resetLinear\": false,\n        \"resetWhileIdle\": false,\n        \"resetByDistance\": true\n      }\n    },\n    \"Crows\": {\n      \"0\": {\n        \"steps\": 10.44442529726004,\n        \"simplify\": 50,\n        \"letterSpacing\": 0,\n        \"spaceWidth\": 0,\n        \"lineOffset\": -12,\n        \"periodKerning\": 14,\n        \"align\": \"CENTER\",\n        \"spinStrength\": 11.91108047561606,\n        \"mouseStrength\": 0.6617266930897812,\n        \"mouseRadius\": 27.461657763225915,\n        \"minMouseMotion\": 2,\n        \"rigidness\": 0,\n        \"resetDuration\": 1,\n        \"resetDelay\": 1.0146475960709977,\n        \"resetLinear\": false,\n        \"resetWhileIdle\": false,\n        \"resetByDistance\": true\n      }\n    },\n    \"Fling\": {\n      \"0\": {\n        \"steps\": 10,\n        \"simplify\": 50,\n        \"letterSpacing\": 0,\n        \"spaceWidth\": 0,\n        \"lineOffset\": -12,\n        \"periodKerning\": 14,\n        \"align\": \"CENTER\",\n        \"spinStrength\": 17.86662071342409,\n        \"mouseStrength\": 3.308633465448906,\n        \"mouseRadius\": 15,\n        \"minMouseMotion\": 0.38600723763570566,\n        \"rigidness\": 0.04632086851628468,\n        \"resetDuration\": 1.146992934688954,\n        \"resetDelay\": 1.191108047561606,\n        \"resetLinear\": false,\n        \"resetWhileIdle\": false,\n        \"resetByDistance\": true\n      }\n    }\n  },\n  \"folders\": {\n    \"Text Mesh\": {\n      \"preset\": \"Default\",\n      \"closed\": false,\n      \"folders\": {}\n    },\n    \"Physics\": {\n      \"preset\": \"Default\",\n      \"closed\": false,\n      \"folders\": {}\n    },\n    \"Reset Animation\": {\n      \"preset\": \"Default\",\n      \"closed\": false,\n      \"folders\": {}\n    }\n  }\n}\n" );

//draws the particles as a triangle list
function drawTriangles(context, particles, camera, tweens, fill, noIntersect) {
    context.beginPath();

    var lastWord = 0;
    var lastAlpha = tweens[0].alpha;

    for (var j=0; j<particles.length; j+=3) {
        var p1 = particles[j].position,
            p2 = particles[j+1].position,
            p3 = particles[j+2].position;

        var word = particles[j].word;
        var tween = tweens[word];
        var yoff = tween.y;


        if (word !== lastWord) {
            context.globalAlpha = lastAlpha;

            lastAlpha = tween.alpha;
            restart = true;

            context.closePath();
            if (fill) {
                context.fill();
            } else
                context.stroke();
            context.beginPath();
        }

        if (noIntersect)
            context.beginPath();

        camera.project(p1, tmp);
        var ox = tmp.x,
            oy = tmp.y;
        context.moveTo(tmp.x, tmp.y + yoff);

        camera.project(p2, tmp);
        context.lineTo(tmp.x, tmp.y + yoff);

        camera.project(p3, tmp);
        context.lineTo(tmp.x, tmp.y + yoff);

        var restart = false;

        if (noIntersect) {
            context.globalAlpha = lastAlpha;
            context.closePath();
            if (fill) {
                context.fill();
            } else
                context.stroke();
        } else {
            context.lineTo(ox, oy + yoff);
        }

        lastWord = word;

        // if (restart)
        //     context.beginPath();
    }
    if (!noIntersect) {
        context.globalAlpha = lastAlpha;
        if (fill)
            context.fill();
        else
            context.stroke();
    }
}

//Draws the text as triangles, with some custom deformation...
function drawPoints(context, particles) {
    var sz = 1;

    for (var i=0; i<particles.length; i++) {
        var particle = particles[i];
        var pos = particle.position;
        tmp.set(pos);
        // camera.project(pos, tmp);

        context.fillRect(tmp.x-sz/2, tmp.y-sz/2,sz, sz);
    }
}

function easeOutExpo (t, b, c, d) {
    return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
}


var TextManager = new Class({

    initialize: function(text, options, TweenLite, datGUI, simple) {
        this.options = this.toDefaults(options);
        this.text = text.trim();

        this.datGUI = datGUI;
        this.TweenLite = TweenLite;

        this.world = new World();

        this.camera = new OrthographicCamera();
        
        this.face = util.getFace('pf din text comp pro');
        this.webGLRenderer = null;
        this.scale = 1.0;
        this.position = new Vector3(0, 0, 0);

        this._finishTweenReset = this.finishTweenReset.bind(this);
        this._startTweenReset = this.startTweenReset.bind(this);

        this.glyphData = [];

        if (simple) {
            Preset0.remembered.Default["0"].steps = 10;
            Preset0.remembered.Default["0"].simplify = 50;
        }
        
        this.color = { r: 255, g: 255, b: 255, a: 1 };        

        this.create();

        this.setupUI();
        this.onCreated = null;

        // this.animateIn({
        //     delay: 0.5,
        //     duration: 3,
        //     yOff: 50,
        //     delayIncrement: .2
        // });

        // this.animateOut({
        //     delay: 1,
        //     duration: 3,
        // });
    },

    animateOut: function(opts) {
        opts = opts||{};

        var delay = opts.delay||0;
        var inc = (opts.delayIncrement===0||opts.delayIncrement) ? opts.delayIncrement : 0.05;

        for (var i=this.tweens.length-1; i>=0; i--) {
            this.TweenLite.to(this.tweens[i], opts.duration||0.5, {
                alpha: 0,
                y: (opts.yOff===0||opts.yOff) ? opts.yOff : 100,
                delay: delay,
                ease: opts.ease||Expo.easeOut,
                onStart: i===this.tweens.length-1 ? opts.onStart : undefined,
                onComplete: i===0 ? opts.onComplete : undefined,
                // overwrite: 2
            });
            delay += inc;
        }
    },

    animateIn: function(opts, alphaOpts) {
        opts = opts||{};
        alphaOpts = alphaOpts||opts;

        var delay = opts.delay||0;
        var opacityDelay = alphaOpts.delay||0;
        var inc = (opts.delayIncrement===0||opts.delayIncrement) ? opts.delayIncrement : 0.15;

        for (var i=0; i<this.tweens.length; i++) {
            this.TweenLite.fromTo(this.tweens[i], opts.duration||1.0, {
                y: (opts.yOff===0||opts.yOff) ? opts.yOff : 100
            }, {
                y: 0,
                onStart: i===0 ? opts.onStart : undefined,
                onComplete: i===this.tweens.length-1 ? opts.onComplete : undefined,
                delay: delay,
                ease: opts.ease||Expo.easeOut,
            });

            this.TweenLite.fromTo(this.tweens[i], alphaOpts.duration||1.0, {
                alpha: 0.0,
            }, {
                alpha: 1.0,
                delay: opacityDelay,
                ease: alphaOpts.ease||Expo.easeOut,
            });

            delay += inc;
            opacityDelay += inc;
        }
    },

    resetOptions: function() {
        this.options = {};
        this.toDefaults(this.options);
    },

    uiRecreate: function() {

    },

    setupUI: function() {
        if (!this.datGUI)
            return;

        var gui = new this.datGUI.GUI({
            load: Preset0
        });
        gui.remember(this.options);
        // gui.useLocalStorage = false;
        this.gui = gui;

        var mesh = gui.addFolder('Text Mesh');
        // mesh.add(this.options, 'text');

        // mesh.add(this.options, 'fill');
        // mesh.add(this.options, 'fontSize', 12, 150);
        mesh.add(this.options, 'steps', 3, 30);
        mesh.add(this.options, 'simplify', 0, 50);
        mesh.add(this.options, 'letterSpacing', -10, 10);
        mesh.add(this.options, 'spaceWidth', 0, 100);
        mesh.add(this.options, 'lineOffset', -20, 20);
        mesh.add(this.options, 'periodKerning', -50, 50);
        mesh.add(this.options, 'align', [
            Text3D.Align.LEFT, Text3D.Align.CENTER, Text3D.Align.RIGHT            
        ]); 

        mesh.add(this, 'create');
        mesh.add(this, 'reset');
        mesh.open();
        this.guiMesh = mesh;

        var physics = gui.addFolder('Physics');
        physics.add(this.options, 'spinStrength', 0, 30);
        physics.add(this.options, 'mouseStrength', 0, 30);
        physics.add(this.options, 'mouseRadius', 0, 30);
        physics.add(this.options, 'minMouseMotion', 0, 5);
        physics.add(this.options, 'rigidness', 0.0, 0.2);
        physics.open();

        var reset = gui.addFolder('Reset Animation');
        reset.add(this.options, 'resetDuration', 0, 4);
        reset.add(this.options, 'resetDelay', 0, 4);
        // reset.add(this.options, 'resetDelayIncrement', 0, .2);
        reset.add(this.options, 'resetLinear');
        reset.add(this.options, 'resetWhileIdle');
        reset.add(this.options, 'resetByDistance');
        reset.open();

        //wtf
        // document.querySelector(".ac").style.zIndex = 100000;
        // document.querySelector(".save-row").style.width = "260px";
        // document.querySelector(".gears").style.width = "18px";
        // document.querySelector(".gears").style.height = "18px";
    },

    toDefaults: function(options) {
        options.text = typeof options.text === "string" ? options.text : "";

        options.style = typeof options.style === "number" ? options.style : 0;
        options.spinStrength = typeof options.spinStrength === "number" ? options.spinStrength : 10;
        options.mouseStrength = typeof options.mouseStrength === "number" ? options.mouseStrength : 5;
        options.mouseRadius = typeof options.mouseRadius === "number" ? options.mouseRadius : 34;        
        options.minMouseMotion = typeof options.minMouseMotion === "number" ? options.minMouseMotion : 2;
        options.resetLinear = !!options.resetLinear;
        options.resetDuration = typeof options.resetDuration === "number" ? options.resetDuration : 1;
        options.resetDelay = typeof options.resetDelay === "number" ? options.resetDelay : .5;
        options.resetDelayIncrement = typeof options.resetDelayIncrement === "number" ? options.resetDelayIncrement : .05;
        options.resetWhileIdle = typeof options.resetWhileIdle === "boolean" ? options.resetWhileIdle : true;
        options.resetByDistance = typeof options.resetByDistance === "boolean" ? options.resetByDistance : true;
        options.rigidness = typeof options.rigidness === "number" ? options.rigidness : 0.0;
        options.align = options.align == 'center' ? Text3D.Align.CENTER : Text3D.Align.LEFT;        
        options.letterSpacing = options.letterSpacing || 0;
        options.spaceWidth = typeof options.spaceWidth === "number" ? options.spaceWidth : 0;
        options.periodKerning = typeof options.periodKerning === "number" ? options.periodKerning : 14;
        options.lineOffset = typeof options.lineOffset === "number" ? options.lineOffset : -12;        

        options.fill = typeof options.fill === "boolean" ? options.fill : true;

        this.fontSize = options.fontSize || 50;
        this.snap = typeof options.snap === "number" ? options.snap : 0.995;

        options.snap = this.snap;
        options.fontSize = this.fontSize;
        options.steps = typeof options.steps === "number" ? options.steps : 10;
        options.simplify = typeof options.simplify === "number" ? options.simplify : 50;

        if (Preset0 && Preset0.remembered && Preset0.remembered.Default) {
            for (var k in options) {
                if (typeof Preset0.remembered.Default["0"][k] !== "undefined" 
                    && (['align', 'letterSpacing', 'spaceWidth', 'lineOffset', 'mouseRadius']).indexOf(k) == -1)
                    options[k] = Preset0.remembered.Default["0"][k];
            }
        }

        return options;
    },
    
    //Resets the MESH parameters only...
    reset: function() {
        var options = this.options;
        options.text = undefined;
        options.align = undefined;
        options.letterSpacing = undefined;
        options.spaceWidth = undefined;
        options.lineOffset = undefined;
        options.fill = undefined;
        options.steps = undefined;
        options.simplify = undefined;
        options.periodKerning = undefined;
        this.toDefaults(options);
        this.create();

        if (this.guiMesh) {
            // Iterate over all controllers
            for (var i in this.guiMesh.__controllers) {
                this.guiMesh.__controllers[i].updateDisplay();
            }
        }
    },

    create: function() {
        var text = this.options.text||this.text;
        text = text.replace("<br>", "\n").replace("&nbsp;", "\u0020");        

        var options = this.options;
        this.toDefaults(this.options);

        var steps = ~~options.steps;

        if (typeof options.simplify === "number") {
            if (options.simplify === 0)
                simplify = 0;
            else
                simplify = this.fontSize/Math.max(10, ~~options.simplify)
        } else
            simplify = this.fontSize/50;

        Glyph.SAVE_CONTOUR = false;

        // Changed space width to 65 from 0

        var spaceWidth = Math.round(options.spaceWidth || 55) || undefined;        
        var letterSpacing = Math.round(options.letterSpacing || 0);        
        var lineOffset = Math.round(options.lineOffset||0) || undefined;

        var align = this.options.align;

        Text3D.PERIOD_KERNING = options.periodKerning||0;
        this.textMesh = new Text3D(text, this.face, this.fontSize, steps, simplify, align, spaceWidth, letterSpacing, lineOffset);

        this.tweens = [];
        for (var i=0; i<this.textMesh.wordCount; i++)
            this.tweens.push({ y:0, alpha: 1 });



        this.mouse = new Vector3();
        this.lastMouse = new Vector3();
        

        this.world.particles.length = 0;
        this.world.addText3D(this.textMesh);
        
        if (this.webGLRenderer)
            this.webGLRenderer.setup(this.world.particles);

        this.width = this.textMesh.bounds.maxX-this.textMesh.bounds.minX;
        this.height = this.textMesh.bounds.maxY-this.textMesh.bounds.minY;


        this.glyphData.length = 0;
        for (var i=0; i<this.textMesh.glyphs.length; i++) {
            this.glyphData[i] = {
                mouseOver: false,
                tween: 0.0,
                resetting: false,
            };
        }


        //destroy the text contour object to free up some memory
        this.textMesh.destroy();

        this._createRandomForces();

        if (typeof this.onCreated === "function")
            this.onCreated();
    },

    finishTweenReset: function(index) {
        this.glyphData[index].resetting = false;
        this.glyphData[index].tweening = false;
        this.glyphData[index].tween = 0;
    },

    startTweenReset: function(index) {
        this.glyphData[index].resetting = true;
        this.glyphData[index].tweening = true;
        this.glyphData[index].tween = 0;
        this._saveGlyph(index);
    },


    update: function(dt) {
        var world = this.world;

        world.step(dt);

        this._resolveTweens();
        this._updateKillTweens();

        var options = this.options;

        if (options.style === 0)
            this._updateMouseInteractions();
        else if (options.style === 1)
            this._updateMouseInteractions2();
        else if (options.style === 2)
            this._updateMouseInteractions3();
    },

    _resolveTweens: function() {
        var world = this.world;
        for (var i=0; i<world.particles.length; i++) {
            var p = world.particles[i];
            var glyphIndex = p.glyphIndex;

            var gd = this.glyphData[glyphIndex];

            if (gd.resetting) {
                var a = gd.tween;
                p.position.copy(p.lastPosition).lerp(p.original, a);
                p.velocity.lerp(zero, a);
                p.acceleration.lerp(zero, a);

                for (var k=0; k<p.constraints.length; k++) {
                    var c = p.constraints[k];
                    c.restingDistance = lerp(c.restingDistance, c.originalRestingDistance, a);
                    c.stiffness = lerp(c.stiffness, c.originalStiffness, a);
                }
            }
        }
    },

    _createRandomForces: function() {
        var world = this.world;

        for (var i=0; i<world.particles.length; i++) {
            

            var scale = this.options.spinStrength;
            tmp.random();
            tmp.z = 0;
            tmp.x *= scale;
            tmp.y *= scale;

            world.particles[i].finalPosition.add(tmp);
        }
    },

    _updateKillTweens: function() {
        var mouse = this.mouse;

        var mouseMove = (mouse.distance(this.lastMouse) > 2);

        for (var i=0; i<this.textMesh.glyphs.length; i++) {
            var gData = this.glyphData[i];

            var g = this.textMesh.glyphs[i];
            var b = g.bounds;

            var withinGlyph = mouse.x > b.minX && mouse.x < b.maxX && mouse.y > b.minY && mouse.y < b.maxY
                
            if (!mouseMove && this.options.resetWhileIdle) {
                gData.mouseOver = false;
                this._addTween(i, this.options.resetDelay);
                continue;
            }

            var dist = mouse.distance(tmp.set( b.minX+ (b.maxX-b.minX)/2, b.minY + (b.maxY-b.minY)/2 ));

            if (dist < this.options.mouseRadius) {
                // if (gData.tweening)
                this.TweenLite.killTweensOf( gData );
                gData.mouseOver = true;
                gData.tweening = false;
                gData.resetting = false;
                gData.tween = 0;


                //The mouse is under this !
            } else if (gData.mouseOver) {
                gData.mouseOver = false;

                // gData.tweening = true;
                // // gData.resetting = true;
                
                // TweenLite.to( gData, 0.5, {
                //     overwrite: 1,
                //     tween: 1.0,
                //     delay: 0.5,
                //     onStart: this._startTweenReset,
                //     onStartParams: [ i ],
                //     onComplete: this._finishTweenReset,
                //     onCompleteParams: [ i ]
                // });
            }
        }
    },

    _addTween: function(i, startDelay) {
        startDelay = startDelay||0;

        var gData = this.glyphData[i];
        var options = this.options;


        if (options.resetByDistance) {
            var mouse = this.mouse;
            var glyph = this.textMesh.glyphs[i];
            var b = glyph.bounds;

            var dist = mouse.distance(tmp.set( b.minX+ (b.maxX-b.minX)/2, b.minY + (b.maxY-b.minY)/2 ));    

            startDelay += dist / ( this.screenLength ) ;

        } else {
            startDelay += ( i * options.resetDelayIncrement);
        }
        //console.log("BY DIST", options.resetByDistance)

        if (!gData.mouseOver && !gData.tweening) {
            gData.tweening = true;
            gData.resetting = false;

            // this._saveGlyph(i);
            this.TweenLite.to( gData, options.resetDuration, {
                overwrite: 1,
                tween: 1.0,
                ease: options.resetLinear ? Linear.easeNone : Expo.easeOut,
                delay: startDelay + options.resetDelay,
                onStart: this._startTweenReset,
                onStartParams: [ i ],
                onComplete: this._finishTweenReset,
                onCompleteParams: [ i ]
            });
        }
    },

    _updateGlyphHitTest: function() {
        var options = this.options;

        //Any remaining glyphs that aren't tweening, and aren't under mouse, just tween them 
        //after a short delay
        var delay = 0;
        for (var i=0; i<this.textMesh.glyphs.length; i++) {
            this._addTween(i, delay);
            // delay += options.resetDelayIncrement;
        }

        this._updateKillTweens();
    },

    _updateMouseInteractions: function() {
        var mouse = this.mouse,
            lastMouse = this.lastMouse,
            world = this.world,
            width = this.camera.viewportWidth,
            height = this.camera.viewportHeight;

        var options = this.options;
        var mousePush = options.mouseStrength;
        var mousePushThreshold = options.mouseRadius;

        var strength = options.spinStrength;
        tmp3.copy( mouse );
        tmp3.sub( lastMouse );
        tmp3.normalize();
        tmp3.scale(mousePush);

        var mouseMoved = mouse.distance(lastMouse) > options.minMouseMotion;

        // if (options.resetWhileIdle && !mouseMoved)
        //     return;

        var explode = true;
        for (var i=0; i<world.particles.length; i++) {
            var p = world.particles[i];

            var pDist = p.position.distance(mouse);
            if ( pDist < mousePushThreshold) {
                if (mouseMoved) {
                    p.velocity.add(tmp3);
                }
            }

            if (pDist < mousePushThreshold/2) {
                force.random();
                // force.z = 0;


                var dist = this._normalizedDistanceFromMouse(p);
                if (dist < 0.5) {
                    var power = lerp(strength, 0, dist);
                    force.scale( power );

                    force.z = 0;

                    // if (options.rigid) {
                    //     p.position.add(force);
                    // }
                    p.velocity.add(force);


                    // for (var j=0; j<p.constraints.length; j++) {
                    //     p.constraints[j].stiffness = 0.01;
                    //     p.constraints[j].restingDistance -= lerp(15, 0, dist);
                    //     // p.constraints[j].restingDistance = Math.max(5, p.constraints[j].restingDistance);
                    // }
                        
                } else if (dist > 20) {
                    
                }                
            } else if (options.rigidness > 0) {
                var a = options.rigidness;
                p.position.lerp(p.original, a);
                p.velocity.lerp(zero, a);
                p.acceleration.lerp(zero, a);

                // if (pDist < mousePushThreshold*4) {
                //     for (var j=0; j<p.constraints.length; j++) {
                //         p.constraints[j].stiffness = 0.05;
                //         // p.constraints[j].restingDistance -= .5;
                //         // p.constraints[j].restingDistance = Math.max(5, p.constraints[j].restingDistance);
                //     }
                // }
            }
        }

        lastMouse.copy(mouse);
    },

    _normalizedDistanceFromMouse: function(p) {
        var distThreshold = 0.1;
        var width = this.camera.viewportWidth,
            height = this.camera.viewportHeight

        //normalized position
        tmp.copy( p.position );
        tmp.x /= width;
        tmp.y /= height;

        tmp2.copy( this.mouse );
        tmp2.x /= width;
        tmp2.y /= height;

        var dist = tmp.distance(tmp2);
        dist = smoothstep(0.0, distThreshold, dist);
        return dist;
    },

    _updateMouseInteractions2: function() {
        var mouse = this.mouse,
            lastMouse = this.lastMouse,
            world = this.world;

        tmp.copy( mouse );
        tmp.sub( lastMouse );
        tmp.normalize();
            
        // tmp2.random();
        // tmp2.scale(10);
        // tmp2.z = 0;
        // tmp.add( tmp2 );

        tmp.scale(5);

        if ( mouse.distance(lastMouse) > 5 ) {
            for (var i=0; i<world.particles.length; i++) {
                var p = world.particles[i];

                if (p.position.distance(mouse) < 50) {
                    p.velocity.add(tmp);
                }

                   
            }
        }

        lastMouse.copy(mouse);
    },

    _updateMouseInteractions3: function() {
        var mouse = this.mouse,
            lastMouse = this.lastMouse,
            world = this.world,
            width = this.camera.viewportWidth,
            height = this.camera.viewportHeight;

        for (var i=0; i<world.particles.length; i++) {
            var p = world.particles[i];

            //normalized position
            tmp.copy( p.position );
            tmp.x /= width;
            tmp.y /= height;

            tmp2.copy( mouse );
            tmp2.x /= width;
            tmp2.y /= height;


            var dist = tmp.distance(tmp2);

            // var power = (1-dist) * 10;
            dist = smoothstep(0.0, 0.10, dist);

            var strength = 1;
            var power = lerp(strength, 0.0, dist);

            tmp.copy(p.original);
            tmp.lerp(p.finalPosition, dist * power);
            p.position.copy(tmp);
        }
    },

    _savePosition: function() {
        var world = this.world;

        for (var i=0; i<world.particles.length; i++) {
            var p = world.particles[i];
            p.lastPosition.copy(p.position);
        }   
    },

    _saveGlyph: function(glyphIndex) {
        var world = this.world;

        for (var i=0; i<world.particles.length; i++) {
            var p = world.particles[i];
            if (p.glyphIndex === glyphIndex)
                p.lastPosition.copy(p.position);
        }   
    },

    initWebGL: function(canvas, antialiasing) {        
        this.webGLRenderer = new WebGLRenderer(canvas, vert, frag, antialiasing, vignetteFrag);
        this.webGLRenderer.setup(this.world.particles);
        
        this.resize(canvas.width, canvas.height);
    },

    //Does NOT resize WebGL/Canvas or glViewport
    resize: function(width, height) {
        var yDown = !!this.webGLRenderer;

        if (this.webGLRenderer) {
            this.webGLRenderer.resize(width, height);
        }

        var zoom = 1/this.scale;
        this.camera.zoom = zoom;
        this.camera.setToOrtho(yDown, width, height);
        this.camera.translate(-this.position.x*zoom, -this.position.y*zoom, this.position.z);
        this.camera.update();

        this.screenLength = Math.sqrt(width*width + height*height);
    },

    updateCamera: function() {
        this.resize(this.camera.viewportWidth, this.camera.viewportHeight);
    },

    setPosition: function(x, y, z) {
        this.position.set(x, y, z);
        this.resize(this.camera.viewportWidth, this.camera.viewportHeight);
    },

    setZoom: function(zoom) {
        this.camera.zoom = zoom;
        this.camera.update();
    },

    onTouchMove: function(x, y) {
        tmp.set(x, this.webGLRenderer ? y : this.camera.viewportHeight-y, 0);
        this.camera.unproject(tmp, tmp2);
        this.mouse.set(tmp2.x, tmp2.y);

        this._updateGlyphHitTest();
    },

    onTouchStart: function(x, y) {
        tmp.set(x, this.webGLRenderer ? y : this.camera.viewportHeight-y, 0);
        this.camera.unproject(tmp, tmp2);
        this.mouse.set(tmp2.x, tmp2.y);
    },

    onTouchEnd: function(x, y) {
        tmp.set(x, this.webGLRenderer ? y : this.camera.viewportHeight-y, 0);
        this.camera.unproject(tmp, tmp2);
        this.mouse.set(tmp2.x, tmp2.y);
    },

    //Resets all triangles to their original position
    resetAll: function() {
        this.resetTime = 0;
        this.resetting = true;
        this._savePosition();
    },

    renderCanvas: function(context) {
        // fill = typeof fill === "boolean" ? fill : true;
        // noIntersect = typeof noIntersect === "boolean" ? noIntersect : false;

        var fill = this.options.fill;
        var noIntersect = false;

        if (this.color.a===0)
            return;

        var style = "rgba("+ ~~(this.color.r*255)+","+ ~~(this.color.g*255) +","+ ~~(this.color.b*255) + "," + this.color.a +")";
        // if (fill)
        context.fillStyle = style;
        // else
        context.strokeStyle = style;

        drawTriangles(context, this.world.particles, this.camera, this.tweens, fill, noIntersect);
    },

    destroy: function() {
        this.world.particles.length = 0;
        this.text = null;
        this.world = null;
        this.webGLRenderer = null;
        this.camera = null;
        this.face = null;
    },

    renderWebGL: function() {
        var lines = !this.options.fill;
        if (this.color.a===0)
            return;

        if (this.webGLRenderer) {
            this.webGLRenderer.render(this.width, this.height, 
                        this.world.particles, this.camera, this.tweens, this.color, lines);
        }
    },
});


module.exports = TextManager;


// renderer = new TextRenderer("STORYTELLING.\nCRAFT.\nEXPLOSIONS.", glContext);
// renderer.update();
// renderer.draw();


// },{"../vendor/uni_sans_bold_B.typeface":6,"./Constraint":1,"./WebGLRenderer":3,"./World":4,"./typeface-stripped":5,"cam3d":17,"fs":62,"interpolation":19,"klasse":34,"text3d":"bRhrlU","vecmath":61}],3:[function(_dereq_,module,exports){
},{"../vendor/pfdintextcondpro.typeface":6,"./Constraint":1,"./WebGLRenderer":3,"./World":4,"./typeface-stripped":5,"cam3d":17,"fs":62,"interpolation":19,"klasse":34,"text3d":"bRhrlU","vecmath":61}],3:[function(_dereq_,module,exports){

var Class = _dereq_('klasse');
var WebGLContext = _dereq_('kami').WebGLContext;

var MeshRenderer = _dereq_('kami-mesh').MeshRenderer;

var ShaderProgram = _dereq_('kami').ShaderProgram;
var SpriteBatch = _dereq_('kami').SpriteBatch;
var FrameBuffer = _dereq_('kami').FrameBuffer;
var Texture = _dereq_('kami').Texture;

var Matrix4 = _dereq_('vecmath').Matrix4;
var OrthographicCamera = _dereq_('cam3d').OrthographicCamera;
var PerspectiveCamera = _dereq_('cam3d').PerspectiveCamera;

var Vector3 = _dereq_('vecmath').Vector3;
var Matrix3 = _dereq_('vecmath').Matrix3;

var rot = new Matrix3();
var tmpVec = new Vector3();
var tmpVec2 = new Vector3();
var tmpVec3 = new Vector3();

var AA_SIZE = 2048;

var WebGLRenderer = new Class({

    initialize: function(canvas, vert, frag, useAA, vignetteShader) {
        this.context = new WebGLContext(canvas.width, canvas.height, canvas);

        this.mesh = null;

        this.useAA = useAA;

        this.shader = new ShaderProgram(this.context, vert, frag);
        if (this.shader.log)
            console.warn(this.shader.log);


        if (this.useAA) {
            SpriteBatch.DEFAULT_FRAG_SHADER = vignetteShader;
            this.batch = new SpriteBatch(this.context, 1);
            // this.batch.shader.bind();
            // this.batch.shader.setUniformf("texcoordOffset", 1.0/AA_SIZE, 1.0/AA_SIZE);

            this.aaBuffer = new FrameBuffer(this.context, AA_SIZE, AA_SIZE);
            this.aaBuffer.texture.setFilter(Texture.Filter.LINEAR);
        }
    },

    resize: function(width, height) {
        this.context.width = width;
        this.context.height = height;        
    },

    setup: function(particles) {
        //TODO: fix!!
        // if (this.mesh)
        //     this.mesh.destroy();

        this.mesh = new MeshRenderer(this.context, {
            hasColors: true,
            maxVertices: particles.length * 4, //4 floats per vertex
            hasNormals: false,
            numTexCoords: 0
        });
    },

    destroy: function() {
        if (this.aaBuffer) 
            this.aaBuffer.destroy();
        if (this.batch)
            this.batch.destroy();
        this.shader.destroy();
        if (this.mesh)
            this.mesh.destroy();
    },

    _renderNormal: function(particles, camera, tweens, color, lines) {
        var gl = this.context.gl;
        var renderer = this.mesh;
        var shader = this.shader;

        renderer.shader = shader;
        renderer.begin(camera.combined, lines ? gl.LINES : gl.TRIANGLES);
        
        var r = color.r,
            g = color.g,
            b = color.b,
            a = color.a;

        // if (lines) {
        //     for (var i=0; i<particles.length; i+=3) {
        //         var p1 = particles[i];
        //         var p2 = particles[i+1];
        //         var p3 = particles[i+2];
        //         var p4 = (i+3)<particles.length ? particles[i+3] : null;
                

        //         renderer.color(r, g, b, a);
        //         renderer.vertex( p1.position.x, p1.position.y, p1.position.z );

        //         renderer.color(r, g, b, a);
        //         renderer.vertex( p2.position.x, p2.position.y, p2.position.z );

        //         renderer.color(r, g, b, a);
        //         renderer.vertex( p3.position.x, p3.position.y, p3.position.z );
                
        //         renderer.color(r, g, b, a);
        //         renderer.vertex( p1.position.x, p1.position.y, p1.position.z );

        //         if (p4 !== null) {
        //             renderer.color(0, 0, 0, 0);
        //             renderer.vertex( p1.position.x, p1.position.y, p1.position.z );
        //             renderer.color(0, 0, 0, 0);
        //             renderer.vertex( p4.position.x, p4.position.y, p4.position.z );
        //         }
                    
        //         // renderer.color(0, 0, 0, 0);
        //         // renderer.vertex( p2.position.x, p2.position.y, p2.position.z );
        //         // renderer.color(0, 0, 0, 0);
        //         // renderer.vertex( p3.position.x, p3.position.y, p3.position.z );

        //     }
        // } else {
        

            for (var i=0; i<particles.length; i++) {
                var p = particles[i];
                var pos = p.position;

                var tween = tweens[p.word];

                renderer.color(r, g, b, a * tween.alpha);
                renderer.vertex( pos.x, pos.y + tween.y, pos.z );
            }
        // }
            

        renderer.end();
    },

    render: function(width, height, particles, camera, tweens, color, lines) {
        var useAA = this.useAA;
        var gl = this.context.gl;

        width *= 1/camera.zoom;
        height *= 1/camera.zoom;

        var maxSize = AA_SIZE * 0.8;
        if (camera.viewportWidth > maxSize || camera.viewportHeight > maxSize ||
            width > maxSize/2 || height > maxSize/2) {
            useAA = false;

        }

        //ensure our states are set nicely
        gl.blendEquation(gl.FUNC_ADD);
        gl.activeTexture(gl.TEXTURE0);
        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.colorMask(true, true, true, true);
        gl.depthMask(false);
        gl.disable(gl.CULL_FACE);

        if (useAA) {
            var fbo = this.aaBuffer;
            var fboCam = this.fboCamera;

            var w = camera.viewportWidth,
                h = camera.viewportHeight;
                
            camera.viewportWidth = fbo.width/2;
            camera.viewportHeight = -fbo.height/2;
            camera.update();

            fbo.begin();

            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            this._renderNormal(particles, camera, tweens, color, lines);
            fbo.end();

            var out = AA_SIZE/2;

            this.batch.resize(w, h);
            this.batch.begin();
            this.batch.draw(fbo.texture, (w-out)/2, (h-out)/2, out, out);
            this.batch.end();
            
            camera.viewportWidth = w;
            camera.viewportHeight = h;
            camera.update();
        } else {
            this._renderNormal(particles, camera, tweens, color, lines);
        }
        
        gl.depthMask(true);
        gl.enable(gl.DEPTH_TEST);
    },
});


module.exports = WebGLRenderer;
},{"cam3d":17,"kami":31,"kami-mesh":20,"klasse":34,"vecmath":61}],4:[function(_dereq_,module,exports){
var Class = _dereq_('klasse');

var Vector3 = _dereq_('vecmath').Vector3;

var Constraint = _dereq_('./Constraint');

var tmp = new Vector3();

/**
 * Creates a "physical text" object where each point (in triangles)
 * has a velocity, position, mass, etc.
 *
 * This does not hold on to the Text3D object
 */
var World = new Class({

    initialize: function(gravity) {
        this.particles = [];
        this.gravity = gravity||new Vector3(0, 0, 0);
        
        this.floor = Number.MAX_VALUE;
        this.floorFriction = 0.98;

        this.accuracy = 1;

        this.defaultStiffness = 0.5;
        this.defaultRestingDistance = undefined;
    },

    clear: function() {
        this.particles.length = 0;
    },

    addTriangleList: function(triangles, mass, restitution, glyphIndex, word) {
        mass = typeof mass === "number" ? mass : 1.0;
        restitution = typeof restitution === "number" ? restitution : -0.5;


        var particles = this.particles,
            defStiff = this.defaultStiffness,
            defRest = this.defaultRestingDistance;

        for (var i=0; i<triangles.length; i++) {
            var point = triangles[i];

            //constrain the triangle together..
            
            var particle = {
                position: new Vector3(point),
                velocity: new Vector3(),
                acceleration: new Vector3(),

                original: new Vector3(point),
                lastPosition: new Vector3(point),
                finalPosition: new Vector3(point),

                glyphIndex: glyphIndex,
                word: word,
                mass: mass,
                restitution: restitution,
                restingDistance: 0,
                constraints: []
            };

            particles.push(particle);

            if (((i+1) % 3) === 0) {
                //the last three particles are our triangle
                
                var p3 = particles[particles.length-1],
                    p2 = particles[particles.length-2],
                    p1 = particles[particles.length-3];
                


                p1.constraints = [
                    new Constraint(p1, p2, defStiff, defRest),
                    new Constraint(p1, p3, defStiff, defRest),
                ];
                p2.constraints = [
                    new Constraint(p2, p1, defStiff, defRest),
                    new Constraint(p2, p3, defStiff, defRest),
                ];
                p3.constraints = [
                    new Constraint(p3, p1, defStiff, defRest),
                    new Constraint(p3, p2, defStiff, defRest),
                ];

                //surely a more efficient means of doing this.
                //maybe each particle has a fixed # of constraints?
                // lastA.constraints = [
                //     new Constraint(lastA, lastB, defStiff, defRest),
                //     new Constraint(lastA, lastC, defStiff, defRest),
                // ];
                // lastB.constraints = [
                //     new Constraint(lastB, lastA, defStiff, defRest),
                //     new Constraint(lastB, lastC, defStiff, defRest),
                // ];
                // lastC.constraints = [
                //     new Constraint(lastC, lastB, defStiff, defRest),
                //     new Constraint(lastC, lastA, defStiff, defRest),
                // ];

                // lastA.constraints.push(new Constraint(lastA, lastB, defStiff, defRest));
            }
        }
    },

    //Utility/helper method...
    addText3D: function(text3D, mass, restitution) {
        var particles = this.particles,
            defStiff = this.defaultStiffness,
            defRest = this.defaultRestingDistance;

        var word = 0;
        for (var k=0; k<text3D.glyphs.length; k++) {
            var g = text3D.glyphs[k];

            this.addTriangleList(g.points, mass, restitution, k, g.word);

            // if (g.character === '.')
            //     word++;
        }
    },

    solveConstraints: function(particle, constraints) {
        var i = constraints.length;
        while (i--) { //in reverse so we can pop safely
            var c = constraints[i];

            //solve the constraint, it will return the distance 
            var dist = c.solve();

            //here we can optionally check to see if we should tear the constraint
            //and pop it from the stack... 
        }
    },

    step: function(dt) {
        dt = dt||0.16;

        var particles = this.particles,
            gravity = this.gravity,
            floor = this.floor,
            floorFriction = this.floorFriction;

        var steps = this.accuracy;
        while (steps--) {
            for (var i=0; i<particles.length; i++) {
                var p = particles[i];
                var c = p.constraints;

                //Pull this particle close to its attached constraints
                this.solveConstraints(p, c);
            }
        }


        for (var i=0; i<particles.length; i++) {
            var p = particles[i];


            p.velocity.scale(0.98);

            p.velocity.x += gravity.x;
            p.velocity.y += gravity.y;
            p.velocity.z += gravity.z;

            p.position.x += p.velocity.x * dt;
            p.position.y += p.velocity.y * dt;
            p.position.z += p.velocity.z * dt;

            if (p.position.y >= this.floor) {
                p.velocity.x *= floorFriction;
                p.velocity.y *= floorFriction;
                p.velocity.z *= floorFriction;

                p.velocity.y *= p.restitution;
                p.position.y = this.floor - 0.1;
            }
        }
    },

});

module.exports = World;
},{"./Constraint":1,"klasse":34,"vecmath":61}],5:[function(_dereq_,module,exports){
var _typeface_js = {

    faces: {},

    loadFace: function(typefaceData) {
        var familyName = typefaceData.familyName.toLowerCase();
        
        if (!this.faces[familyName]) {
            this.faces[familyName] = {};
        }
        if (!this.faces[familyName][typefaceData.cssFontWeight]) {
            this.faces[familyName][typefaceData.cssFontWeight] = {};
        }

        var face = this.faces[familyName][typefaceData.cssFontWeight][typefaceData.cssFontStyle] = typefaceData;
        face.loaded = true;
    },

    pixelsFromPoints: function(face, style, points, dimension) {
        var pixels = points * parseInt(style.fontSize.toString(), 10) * 72 / (face.resolution * 100);
        if (dimension == 'horizontal' && style.fontStretchPercent) {
            pixels *= style.fontStretchPercent;
        }
        return pixels;
    },

    pointsFromPixels: function(face, style, pixels, dimension) {
        var points = pixels * face.resolution / (parseInt(style.fontSize.toString(), 10) * 72 / 100);
        if (dimension == 'horizontal' && style.fontStretchPrecent) {
            points *= style.fontStretchPercent;
        }
        return points;
    },
};

module.exports = _typeface_js;
},{}],6:[function(_dereq_,module,exports){
module.exports = {"glyphs":{"¦":{"x_min":106,"x_max":224,"ha":326,"o":"m 106 430 l 106 999 l 224 999 l 224 430 l 106 430 m 224 338 l 224 -231 l 106 -231 l 106 338 l 224 338 "},"₅":{"x_min":36.65625,"x_max":327,"ha":367,"o":"m 327 23 q 319 -35 327 -6 q 294 -85 311 -63 q 249 -119 276 -106 q 182 -133 221 -133 q 74 -94 111 -133 q 36 12 36 -55 l 145 30 q 154 -20 145 -5 q 183 -36 164 -36 q 208 -26 199 -36 q 217 4 217 -16 l 217 134 q 210 155 217 145 q 187 165 204 165 q 141 138 157 165 l 50 138 l 50 453 l 323 453 l 323 359 l 153 359 l 154 242 q 181 253 165 248 q 213 258 197 258 q 298 228 270 258 q 327 149 327 198 l 327 23 "},"Á":{"x_min":15.28125,"x_max":572.265625,"ha":586,"o":"m 419 0 l 381 202 l 204 202 q 185 101 194 151 q 168 0 176 50 l 15 0 q 112 483 63 243 q 209 967 161 723 l 376 967 l 572 0 l 419 0 m 230 1069 l 444 1238 l 533 1133 l 284 997 l 230 1069 m 288 743 q 259 544 275 643 q 226 342 244 444 l 358 342 l 295 743 l 288 743 "},"е":{"x_min":46,"x_max":475,"ha":522,"o":"m 195 308 q 195 233 195 269 q 202 178 196 197 q 262 131 215 131 q 325 210 318 131 l 475 186 q 415 43 469 94 q 261 -8 361 -8 q 177 3 212 -8 q 118 35 143 15 q 80 79 94 54 q 59 129 66 104 q 52 171 55 146 q 48 224 50 196 q 46 282 47 252 q 46 338 46 312 q 50 472 46 405 q 69 574 55 538 q 137 663 89 630 q 266 697 186 697 q 422 640 369 697 q 475 478 475 583 l 475 308 l 195 308 m 207 514 q 199 475 201 502 q 196 411 197 448 l 324 411 l 324 469 q 312 528 324 502 q 262 555 300 555 q 207 514 222 555 "},"Î":{"x_min":-70.84375,"x_max":375.03125,"ha":301,"o":"m 75 0 l 75 967 l 226 967 l 226 0 l 75 0 m 152 1112 l -11 1005 l -70 1058 l 112 1242 l 200 1242 l 375 1060 l 315 1005 l 152 1112 "},"e":{"x_min":46,"x_max":475,"ha":522,"o":"m 195 308 q 195 233 195 269 q 202 178 196 197 q 262 131 215 131 q 325 210 318 131 l 475 186 q 415 43 469 94 q 261 -8 361 -8 q 177 3 212 -8 q 118 35 143 15 q 80 79 94 54 q 59 129 66 104 q 52 171 55 146 q 48 224 50 196 q 46 282 47 252 q 46 338 46 312 q 50 472 46 405 q 69 574 55 538 q 137 663 89 630 q 266 697 186 697 q 422 640 369 697 q 475 478 475 583 l 475 308 l 195 308 m 207 514 q 199 475 201 502 q 196 411 197 448 l 324 411 l 324 469 q 312 528 324 502 q 262 555 300 555 q 207 514 222 555 "},"»":{"x_min":63.890625,"x_max":616.71875,"ha":676,"o":"m 318 64 l 472 333 l 318 601 l 462 601 l 616 333 l 462 64 l 318 64 m 63 64 l 216 333 l 63 601 l 208 601 l 362 333 l 208 64 l 63 64 "},"Ѓ":{"x_min":72,"x_max":490.078125,"ha":522,"o":"m 222 825 l 222 0 l 72 0 l 72 967 l 490 967 l 490 825 l 222 825 m 159 1069 l 373 1238 l 462 1133 l 213 997 l 159 1069 "},"ў":{"x_min":5.5625,"x_max":493.09375,"ha":499,"o":"m 251 231 l 288 431 l 338 686 l 493 686 l 294 -105 q 232 -224 275 -181 q 109 -268 190 -268 l 56 -268 l 56 -136 l 87 -136 q 137 -115 118 -136 q 170 -37 156 -95 l 180 5 l 5 686 l 165 686 l 208 431 l 245 231 l 251 231 m 162 954 q 171 922 163 938 q 190 892 179 906 q 218 870 202 879 q 252 861 233 861 q 289 870 273 861 q 316 892 305 879 q 334 922 327 906 q 340 954 340 938 l 450 954 q 434 890 447 924 q 397 828 422 856 q 338 780 373 799 q 252 762 302 762 q 161 780 198 762 q 100 828 123 799 q 65 890 76 856 q 52 954 54 924 l 162 954 "},"ò":{"x_min":46,"x_max":485,"ha":531,"o":"m 269 697 q 363 682 325 697 q 426 642 401 667 q 463 584 451 617 q 478 512 475 551 q 484 423 483 471 q 485 334 485 374 l 485 298 q 482 234 485 266 q 478 171 480 202 q 448 78 471 115 q 394 23 425 42 q 326 -3 362 3 q 255 -10 290 -10 q 171 3 207 -10 q 112 38 136 16 q 74 89 87 60 q 56 149 61 117 q 51 190 53 167 q 47 238 48 213 q 46 289 46 263 q 46 337 46 315 q 47 406 46 370 q 51 473 48 441 q 58 533 54 505 q 69 577 62 560 q 139 663 89 630 q 269 697 189 697 m 268 557 q 218 532 235 557 q 204 496 208 516 q 197 452 199 477 q 195 396 195 427 q 195 324 195 364 l 195 313 q 195 241 195 275 q 202 185 196 206 q 224 145 208 161 q 268 130 239 130 q 306 143 290 130 q 328 175 322 156 q 331 197 329 181 q 335 236 333 213 q 337 285 336 259 q 338 338 338 311 q 336 432 338 386 q 330 502 335 478 q 320 527 327 517 q 268 557 304 557 m 255 754 l 94 987 l 218 1043 l 335 797 l 255 754 "},"^":{"x_min":9.71875,"x_max":556.984375,"ha":563,"o":"m 9 447 q 120 705 65 577 q 231 964 175 833 l 331 964 l 556 444 l 420 444 l 341 642 l 280 798 l 212 619 q 178 533 195 577 q 145 447 161 490 l 9 447 l 9 447 "},"«":{"x_min":62.5,"x_max":615.328125,"ha":676,"o":"m 218 64 l 62 333 l 218 601 l 361 601 l 208 333 l 361 64 l 218 64 m 472 64 l 316 333 l 472 601 l 615 601 l 462 333 l 615 64 l 472 64 "},"ⁿ":{"x_min":32,"x_max":341,"ha":374,"o":"m 149 809 q 185 835 162 824 q 232 847 208 847 q 317 813 293 847 q 341 726 341 779 l 341 388 l 224 388 l 224 697 q 186 739 224 739 q 149 694 149 739 l 149 388 l 32 388 l 32 843 l 149 843 l 149 809 "},"к":{"x_min":53,"x_max":532.1875,"ha":547,"o":"m 53 0 l 53 685 l 203 685 l 203 406 l 233 406 q 264 408 248 406 q 293 421 279 411 q 318 452 307 432 q 336 505 329 472 l 378 686 l 519 686 q 495 586 507 636 q 472 486 483 536 q 437 403 461 437 q 376 358 412 369 l 376 355 q 443 307 422 344 q 478 221 465 271 l 532 0 l 384 0 l 347 175 q 331 230 340 209 q 309 262 322 251 q 281 277 297 273 q 244 282 265 282 l 203 282 l 203 0 l 53 0 "},"⁻":{"x_min":37,"x_max":301,"ha":330,"o":"m 37 699 l 37 791 l 301 791 l 301 699 l 37 699 "},"í":{"x_min":65,"x_max":338.921875,"ha":297,"o":"m 65 0 l 65 686 l 216 686 l 216 0 l 65 0 m 97 797 l 215 1043 l 338 987 l 177 754 l 97 797 "},"µ":{"x_min":63,"x_max":496,"ha":556,"o":"m 346 60 l 340 60 q 295 20 324 32 q 235 8 265 8 q 224 8 229 8 q 213 10 219 8 l 213 -267 l 63 -267 l 63 686 l 213 686 l 213 210 q 230 155 213 174 q 278 137 247 137 q 327 157 309 137 q 346 214 346 177 l 346 686 l 496 686 l 496 0 l 346 0 l 346 60 "},"-":{"x_min":68.0625,"x_max":454.203125,"ha":507,"o":"m 68 325 l 68 456 l 454 456 l 454 325 l 68 325 "},"ѕ":{"x_min":39,"x_max":465,"ha":504,"o":"m 188 209 q 203 150 186 172 q 252 128 221 128 q 302 146 285 128 q 319 198 319 165 q 303 259 319 241 q 246 291 288 276 q 163 325 201 308 q 100 366 126 343 q 60 422 74 390 q 47 499 47 454 q 100 640 47 583 q 258 697 153 697 q 415 642 366 697 q 465 496 465 588 l 318 477 q 303 536 319 514 q 257 559 287 559 q 208 538 220 559 q 196 496 196 517 q 209 451 196 468 q 270 417 222 434 q 358 382 322 400 q 419 339 395 364 q 453 281 442 315 q 465 199 465 247 q 453 118 465 155 q 417 52 442 80 q 351 7 391 23 q 252 -8 310 -8 q 96 41 151 -8 q 39 187 41 91 l 188 209 "},"Q":{"x_min":65,"x_max":595.109375,"ha":597,"o":"m 299 -8 q 121 53 177 -8 q 65 232 65 115 l 65 718 q 78 822 65 775 q 119 903 91 869 q 191 956 146 937 q 299 975 237 975 q 411 957 366 975 q 483 906 456 940 q 522 826 510 873 q 534 719 534 779 l 534 247 q 512 119 534 170 l 595 54 l 524 -32 l 446 30 q 381 0 420 8 q 299 -8 343 -8 m 273 174 l 339 258 l 383 223 l 383 707 q 383 730 383 718 q 382 755 383 743 q 359 812 379 790 q 299 835 340 835 q 237 806 256 835 q 216 740 218 778 q 215 703 215 721 q 215 669 215 686 l 215 229 q 233 161 215 192 q 298 131 252 131 q 321 134 313 131 l 273 174 "},"Ш":{"x_min":72,"x_max":809,"ha":881,"o":"m 809 967 l 809 0 l 72 0 l 72 967 l 222 967 l 222 140 l 365 140 l 365 967 l 515 967 l 515 140 l 660 140 l 660 967 l 809 967 "},"M":{"x_min":68,"x_max":728,"ha":796,"o":"m 352 211 l 283 390 l 224 559 l 217 559 l 217 0 l 68 0 l 68 967 l 213 967 l 318 691 l 394 482 l 401 482 l 479 697 l 584 967 l 728 967 l 728 0 l 578 0 l 578 557 l 572 557 l 511 384 l 443 211 l 352 211 "},"ј":{"x_min":-22,"x_max":217,"ha":280,"o":"m 66 821 l 66 967 l 217 967 l 217 821 l 66 821 m 217 -72 q 166 -221 217 -168 q 5 -274 115 -274 l -22 -274 l -22 -132 l 0 -132 q 53 -109 40 -132 q 66 -34 66 -87 l 66 688 l 217 688 l 217 -72 "},"₍":{"x_min":36,"x_max":229.0625,"ha":229,"o":"m 36 152 q 72 339 36 254 q 162 496 109 425 l 229 468 q 161 314 186 397 q 136 155 136 231 q 161 -10 136 72 q 226 -160 186 -93 l 165 -199 q 73 -37 111 -123 q 36 152 36 49 "},"{":{"x_min":21.265625,"x_max":321,"ha":340,"o":"m 154 413 q 211 360 183 402 q 239 243 239 318 l 239 48 q 253 -15 239 6 q 291 -38 268 -38 l 321 -38 l 321 -143 l 243 -143 q 145 -99 185 -143 q 106 16 106 -56 l 106 220 q 85 327 106 288 q 21 370 65 365 l 21 462 q 85 507 65 468 q 106 612 106 547 l 106 808 q 145 924 106 881 q 243 968 185 968 l 321 968 l 321 863 l 291 863 q 253 838 268 863 q 239 772 239 812 l 239 591 q 211 476 239 518 q 154 420 184 434 l 154 413 "},"¼":{"x_min":61,"x_max":813.890625,"ha":875,"o":"m 775 82 l 775 0 l 672 0 l 672 82 l 488 82 l 488 166 l 615 577 l 719 577 l 597 175 l 672 175 l 672 312 l 775 312 l 775 175 l 813 175 l 813 82 l 775 82 m 248 -24 l 156 -24 l 592 992 l 684 992 l 248 -24 m 145 389 l 145 847 l 61 784 l 61 898 l 153 967 l 255 967 l 255 389 l 145 389 "},"#":{"x_min":6.9375,"x_max":551.4375,"ha":563,"o":"m 6 403 l 104 403 l 136 576 l 58 576 l 58 679 l 154 679 l 206 970 l 312 970 l 258 679 l 368 679 l 420 970 l 525 970 l 470 679 l 551 679 l 551 576 l 452 576 l 422 403 l 502 403 l 502 300 l 402 300 l 348 0 l 244 0 l 298 300 l 188 300 l 136 0 l 30 0 l 86 300 l 6 300 l 6 403 m 208 403 l 318 403 l 350 576 l 240 576 l 208 403 "},"Ê":{"x_min":61.109375,"x_max":506.984375,"ha":528,"o":"m 72 0 l 72 967 l 501 967 l 501 825 l 222 825 l 222 563 l 465 563 l 465 420 l 222 420 l 222 142 l 501 142 l 501 0 l 72 0 m 284 1112 l 120 1005 l 61 1058 l 244 1242 l 331 1242 l 506 1060 l 447 1005 l 284 1112 "},"Џ":{"x_min":72,"x_max":532,"ha":603,"o":"m 532 967 l 532 0 l 365 0 l 365 -185 l 240 -185 l 240 0 l 72 0 l 72 967 l 222 967 l 222 146 l 382 146 l 382 967 l 532 967 "},")":{"x_min":63.703125,"x_max":337,"ha":351,"o":"m 337 424 q 280 108 337 253 q 140 -156 223 -36 l 66 -107 q 122 12 97 -51 q 166 146 148 77 q 194 287 184 214 q 204 430 204 359 q 194 564 204 495 q 166 702 184 634 q 122 835 148 770 q 63 959 95 901 l 148 1001 q 221 878 187 944 q 280 741 255 813 q 321 590 306 670 q 337 424 337 510 "},"э":{"x_min":29,"x_max":454,"ha":498,"o":"m 144 408 l 304 408 q 295 503 304 471 q 238 559 280 559 q 196 538 212 559 q 179 478 180 518 q 105 487 142 482 q 32 497 68 492 q 92 644 37 591 q 248 697 147 697 q 371 663 329 697 q 433 577 413 630 q 444 533 440 561 q 450 473 448 505 q 453 406 452 441 q 454 337 454 370 q 453 282 454 312 q 451 224 452 252 q 448 171 451 196 q 441 129 445 146 q 419 77 434 101 q 381 33 405 53 q 322 3 356 14 q 240 -8 287 -8 q 85 43 140 -8 q 29 186 31 95 l 179 205 q 237 130 183 130 q 280 147 266 130 q 299 192 293 164 q 304 234 303 208 q 305 286 305 259 l 144 286 l 144 408 "},"Å":{"x_min":16.21875,"x_max":572.78125,"ha":586,"o":"m 420 0 l 382 202 l 205 202 q 186 101 195 151 q 169 0 177 50 l 16 0 q 113 483 64 243 q 210 967 162 723 l 377 967 l 572 0 l 420 0 m 296 970 q 201 1008 239 970 q 163 1103 163 1047 q 201 1197 163 1158 q 296 1236 239 1236 q 390 1197 353 1236 q 428 1103 428 1158 q 390 1008 428 1047 q 296 970 353 970 m 288 743 q 259 544 274 643 q 226 342 244 444 l 358 342 l 295 743 l 288 743 m 296 1155 q 256 1139 272 1155 q 241 1101 241 1123 q 256 1063 241 1078 q 296 1048 272 1048 q 334 1063 318 1048 q 350 1101 350 1078 q 334 1139 350 1123 q 296 1155 318 1155 "},"ш":{"x_min":63,"x_max":752,"ha":813,"o":"m 752 688 l 752 0 l 63 0 l 63 688 l 213 688 l 213 138 l 331 138 l 331 688 l 482 688 l 482 138 l 603 138 l 603 688 l 752 688 "},"Я":{"x_min":36.40625,"x_max":540,"ha":608,"o":"m 36 0 l 90 306 q 121 394 100 355 q 179 456 141 434 q 87 540 112 484 q 63 676 63 596 q 131 893 63 819 q 319 967 200 967 l 540 967 l 540 0 l 390 0 l 390 412 l 351 412 q 279 381 312 412 q 233 273 247 350 l 187 0 l 36 0 m 331 825 q 237 783 264 825 q 210 676 210 742 q 243 578 210 605 q 330 551 277 551 l 390 551 l 390 825 l 331 825 "},"₈":{"x_min":39,"x_max":329,"ha":367,"o":"m 328 277 q 319 219 328 245 q 284 175 311 193 q 322 124 316 154 q 329 54 329 94 l 329 12 q 288 -96 329 -61 q 184 -131 247 -131 q 73 -90 108 -131 q 39 11 39 -50 l 39 44 q 43 118 39 84 q 80 172 48 151 q 47 216 55 187 q 40 262 40 244 l 40 324 q 78 421 40 385 q 183 458 117 458 q 290 421 252 458 q 328 316 328 384 l 328 277 m 218 95 q 210 123 218 111 q 183 135 202 135 q 155 123 163 135 q 148 95 148 111 l 148 -4 q 158 -25 148 -16 q 183 -35 169 -35 q 208 -25 198 -35 q 218 -4 218 -16 l 218 95 m 218 325 q 210 350 218 340 q 183 361 202 361 q 158 352 169 361 q 148 331 148 344 l 148 244 q 158 224 148 232 q 183 217 169 217 q 208 224 198 217 q 218 244 218 232 l 218 325 "},"¸":{"x_min":138.828125,"x_max":390,"ha":599,"o":"m 305 36 l 274 -62 q 331 -77 309 -66 q 367 -106 353 -89 q 385 -141 380 -123 q 390 -175 390 -160 q 383 -210 390 -191 q 362 -246 377 -230 q 324 -275 348 -263 q 265 -287 299 -287 q 215 -283 254 -287 q 138 -260 177 -280 l 162 -198 q 208 -214 190 -211 q 244 -218 227 -218 q 278 -205 263 -218 q 293 -173 293 -192 q 230 -127 293 -126 l 195 -101 l 237 38 l 305 36 "},"a":{"x_min":39,"x_max":482,"ha":535,"o":"m 327 54 q 271 7 304 22 q 200 -8 237 -8 q 123 8 154 -8 q 73 53 91 25 q 46 119 54 82 q 39 200 39 157 q 49 279 39 240 q 83 348 59 318 q 146 397 107 378 q 243 416 185 416 l 331 416 l 331 490 q 316 538 331 521 q 261 556 301 556 q 219 542 240 556 q 192 492 198 528 l 55 533 q 128 653 73 610 q 271 696 183 696 q 428 648 375 696 q 482 490 482 601 l 482 0 l 331 0 l 331 52 l 327 54 m 331 303 l 271 303 q 212 282 238 303 q 186 208 186 261 q 204 153 186 172 q 255 134 223 134 q 311 156 291 134 q 331 218 331 179 l 331 303 "},"=":{"x_min":19.453125,"x_max":541.703125,"ha":563,"o":"m 19 469 l 19 590 l 541 590 l 541 469 l 19 469 m 19 239 l 19 360 l 541 360 l 541 239 l 19 239 "},"Ћ":{"x_min":12.9375,"x_max":623,"ha":684,"o":"m 472 0 l 472 423 q 455 487 472 463 q 397 511 438 511 q 352 499 377 511 q 306 467 326 488 l 306 0 l 156 0 l 156 827 l 12 827 l 12 967 l 515 967 l 515 827 l 306 827 l 306 601 l 310 601 q 382 638 344 626 q 455 650 419 650 q 582 599 542 650 q 623 463 623 548 l 623 0 l 472 0 "},"ú":{"x_min":54,"x_max":488,"ha":544,"o":"m 338 61 q 335 61 336 61 q 332 62 335 62 q 276 12 311 31 q 202 -7 241 -7 q 130 6 159 -7 q 85 43 102 19 q 60 99 67 66 q 54 169 54 132 l 54 688 l 205 688 l 205 211 q 221 153 205 170 q 267 136 237 136 q 317 157 295 136 q 339 216 339 179 l 339 688 l 488 688 l 488 0 l 338 0 l 338 61 m 231 797 l 350 1043 l 473 987 l 312 754 l 231 797 "},"д":{"x_min":24,"x_max":593,"ha":621,"o":"m 535 135 l 593 134 l 593 -160 l 468 -160 l 468 0 l 150 0 l 150 -160 l 24 -160 l 24 124 l 80 137 q 103 174 94 155 q 118 216 112 193 q 127 268 125 238 q 131 337 130 297 l 143 688 l 535 688 l 535 135 m 275 553 l 268 346 q 257 214 265 261 q 232 135 248 166 l 385 135 l 385 553 l 275 553 "},"¯":{"x_min":108,"x_max":450,"ha":517,"o":"m 108 801 l 108 925 l 450 925 l 450 801 l 108 801 "},"Z":{"x_min":30.5625,"x_max":445.875,"ha":474,"o":"m 30 0 l 30 136 l 287 827 l 41 827 l 41 967 l 445 967 l 445 833 l 188 142 l 444 142 l 444 0 l 30 0 "},"⁸":{"x_min":39,"x_max":329,"ha":367,"o":"m 328 918 q 319 859 328 886 q 284 815 311 833 q 322 764 316 794 q 329 694 329 734 l 329 652 q 288 544 329 579 q 184 510 247 510 q 73 550 108 510 q 39 651 39 590 l 39 684 q 43 758 39 725 q 80 812 48 791 q 47 856 55 827 q 40 902 40 884 l 40 965 q 78 1062 40 1026 q 183 1099 117 1099 q 290 1062 252 1099 q 328 957 328 1025 l 328 918 m 218 736 q 210 763 218 751 q 183 775 202 775 q 155 763 163 775 q 148 736 148 751 l 148 636 q 158 615 148 624 q 183 606 169 606 q 208 615 198 606 q 218 636 218 624 l 218 736 m 218 965 q 210 991 218 981 q 183 1002 202 1002 q 158 993 169 1002 q 148 972 148 985 l 148 884 q 158 864 148 872 q 183 857 169 857 q 208 864 198 857 q 218 884 218 872 l 218 965 "},"u":{"x_min":54,"x_max":488,"ha":544,"o":"m 338 61 q 335 61 336 61 q 332 62 335 62 q 276 12 311 31 q 202 -7 241 -7 q 130 6 159 -7 q 85 43 102 19 q 60 99 67 66 q 54 169 54 132 l 54 688 l 205 688 l 205 211 q 221 153 205 170 q 267 136 237 136 q 317 157 295 136 q 339 216 339 179 l 339 688 l 488 688 l 488 0 l 338 0 l 338 61 "},"k":{"x_min":57,"x_max":549.078125,"ha":556,"o":"m 212 440 l 357 686 l 532 686 l 360 419 l 549 0 l 376 0 q 317 140 346 70 q 257 281 287 211 q 232 236 244 258 q 206 190 219 213 l 206 0 l 57 0 l 57 1007 l 206 1007 l 206 440 l 212 440 "},"Ù":{"x_min":67,"x_max":536,"ha":601,"o":"m 536 965 l 536 247 q 479 56 536 120 q 301 -8 423 -8 q 123 53 179 -8 q 67 232 67 115 l 67 965 l 217 965 l 217 229 q 235 161 217 191 q 300 132 254 132 q 365 163 346 132 q 385 238 385 194 l 385 965 l 536 965 m 336 997 l 88 1134 l 177 1239 l 391 1070 l 336 997 "},"З":{"x_min":37,"x_max":510,"ha":561,"o":"m 186 251 q 209 161 187 187 q 272 136 231 136 q 334 172 312 136 q 356 287 356 208 q 271 436 356 436 l 213 436 l 213 564 l 273 564 q 336 603 316 564 q 357 711 357 643 q 333 799 357 768 q 267 831 309 831 q 203 797 223 831 q 181 714 183 764 l 37 746 q 107 914 43 854 q 273 975 170 975 q 506 716 506 975 q 503 662 506 693 q 491 600 500 631 q 466 543 482 569 q 423 502 450 516 l 423 498 q 465 463 448 486 q 491 411 482 440 q 505 350 501 383 q 510 283 510 318 q 449 62 510 132 q 270 -8 389 -8 q 101 51 163 -8 q 38 222 38 111 l 186 251 "},"¢":{"x_min":68,"x_max":493,"ha":563,"o":"m 246 -6 q 131 40 169 0 q 80 128 93 80 q 73 170 76 145 q 70 223 70 195 q 68 282 69 252 q 68 337 68 312 q 69 405 68 370 q 73 473 70 441 q 80 533 76 505 q 91 577 84 560 q 146 653 109 622 q 246 694 183 685 l 246 836 l 320 836 l 320 695 q 449 631 407 687 q 492 483 492 574 q 417 474 455 478 q 343 465 379 470 q 327 535 343 513 q 284 558 311 558 q 228 516 243 558 q 220 460 223 502 q 217 363 217 419 l 217 313 q 217 235 217 273 q 225 177 218 196 q 246 141 232 155 q 284 128 259 128 q 343 217 343 128 q 418 206 380 210 q 493 195 455 202 q 447 55 491 107 q 320 -6 403 3 l 320 -163 l 246 -163 l 246 -6 "},"é":{"x_min":46,"x_max":475,"ha":522,"o":"m 195 308 q 195 233 195 269 q 202 178 196 197 q 262 131 215 131 q 325 210 318 131 l 475 186 q 415 43 469 94 q 261 -8 361 -8 q 177 3 212 -8 q 118 35 143 15 q 80 79 94 54 q 59 129 66 104 q 52 171 55 146 q 48 224 50 196 q 46 282 47 252 q 46 338 46 312 q 50 472 46 405 q 69 574 55 538 q 137 663 89 630 q 266 697 186 697 q 422 640 369 697 q 475 478 475 583 l 475 308 l 195 308 m 207 514 q 199 475 201 502 q 196 411 197 448 l 324 411 l 324 469 q 312 528 324 502 q 262 555 300 555 q 207 514 222 555 m 196 797 l 314 1043 l 437 987 l 276 754 l 196 797 "},"B":{"x_min":72,"x_max":534,"ha":597,"o":"m 383 701 q 356 797 383 768 q 269 827 330 827 l 222 827 l 222 576 l 270 576 q 355 608 328 576 q 383 701 383 640 m 391 305 q 366 406 391 373 q 278 440 341 440 l 222 440 l 222 140 l 281 140 q 339 153 317 140 q 372 188 360 166 q 387 241 384 210 q 391 305 391 271 m 423 505 q 510 426 487 484 q 534 293 534 368 q 469 70 534 141 q 271 0 404 0 l 72 0 l 72 967 l 283 967 q 468 899 410 967 q 526 704 526 832 q 503 587 526 637 q 423 512 480 537 l 423 505 "},"В":{"x_min":72,"x_max":534,"ha":597,"o":"m 383 701 q 356 797 383 768 q 269 827 330 827 l 222 827 l 222 576 l 270 576 q 355 608 328 576 q 383 701 383 640 m 391 305 q 366 406 391 373 q 278 440 341 440 l 222 440 l 222 140 l 281 140 q 339 153 317 140 q 372 188 360 166 q 387 241 384 210 q 391 305 391 271 m 423 505 q 510 426 487 484 q 534 293 534 368 q 469 70 534 141 q 271 0 404 0 l 72 0 l 72 967 l 283 967 q 468 899 410 967 q 526 704 526 832 q 503 587 526 637 q 423 512 480 537 l 423 505 "},"І":{"x_min":75,"x_max":226,"ha":301,"o":"m 75 0 l 75 967 l 226 967 l 226 0 l 75 0 "},"H":{"x_min":72,"x_max":543,"ha":615,"o":"m 394 0 l 394 422 l 221 422 l 221 0 l 72 0 l 72 967 l 221 967 l 221 562 l 394 562 l 394 967 l 543 967 l 543 0 l 394 0 "},"î":{"x_min":-41.671875,"x_max":404.203125,"ha":363,"o":"m 104 0 l 104 686 l 255 686 l 255 0 l 104 0 m 181 870 l 18 740 l -41 793 l 141 1000 l 229 1000 l 404 794 l 344 740 l 181 870 "},"¥":{"x_min":23.265625,"x_max":537.359375,"ha":563,"o":"m 379 477 l 494 477 l 494 396 l 356 396 q 354 380 355 389 q 354 365 354 372 l 354 325 l 494 325 l 494 243 l 354 243 l 354 0 l 208 0 l 208 243 l 71 243 l 71 325 l 208 325 l 208 365 q 207 380 208 372 q 205 396 206 389 l 71 396 l 71 477 l 181 476 l 23 967 l 177 967 l 231 773 q 254 678 242 725 q 278 583 266 630 l 285 583 q 309 679 298 632 q 333 775 320 726 q 358 871 345 823 q 384 967 370 918 l 537 967 l 379 477 "},"U":{"x_min":67,"x_max":536,"ha":601,"o":"m 536 965 l 536 247 q 479 56 536 121 q 301 -8 423 -8 q 123 53 179 -8 q 67 232 67 115 l 67 965 l 217 965 l 217 229 q 235 161 217 191 q 300 132 254 132 q 365 163 346 132 q 385 238 385 194 l 385 965 l 536 965 "},"Ñ":{"x_min":68,"x_max":579,"ha":647,"o":"m 217 562 l 217 0 l 68 0 l 68 967 l 202 967 l 319 679 q 347 608 333 643 q 376 537 361 573 l 425 404 q 428 404 427 404 q 432 405 429 405 l 432 967 l 579 967 l 579 0 l 447 0 l 331 286 q 276 425 303 356 q 223 562 249 493 l 217 562 m 472 1185 q 507 1163 490 1173 q 544 1141 525 1153 q 479 1049 513 1077 q 408 1021 444 1021 q 364 1028 384 1021 q 325 1046 344 1036 q 289 1063 306 1055 q 255 1071 272 1071 q 219 1058 238 1071 q 179 1018 200 1046 l 105 1064 q 169 1150 130 1119 q 247 1182 208 1182 q 287 1174 268 1182 q 325 1157 306 1166 q 361 1139 344 1147 q 395 1132 379 1132 q 431 1143 415 1132 q 472 1185 448 1154 "},"F":{"x_min":72,"x_max":501.1875,"ha":528,"o":"m 222 825 l 222 563 l 465 563 l 465 420 l 222 420 l 222 0 l 72 0 l 72 967 l 501 967 l 501 825 l 222 825 "},"*":{"x_min":33.34375,"x_max":470.875,"ha":518,"o":"m 422 587 l 337 529 l 252 670 l 165 528 l 81 587 l 187 719 l 33 761 l 66 856 l 213 795 l 200 965 l 304 965 l 290 797 l 436 856 l 470 761 l 313 719 l 422 587 "},"Ќ":{"x_min":72,"x_max":596.03125,"ha":610,"o":"m 72 0 l 72 967 l 221 967 l 221 558 l 251 558 q 333 587 301 558 q 382 691 365 616 q 393 743 384 703 q 411 828 402 783 q 429 912 421 873 q 440 965 437 952 l 580 965 q 550 819 565 891 q 519 676 534 748 q 473 561 504 605 q 401 501 441 517 l 401 498 q 483 435 454 478 q 527 322 512 392 q 562 160 546 240 q 596 0 577 80 l 446 0 q 418 141 432 70 q 389 283 404 212 q 342 391 373 360 q 261 422 311 422 l 221 422 l 221 0 l 72 0 m 212 1069 l 426 1238 l 515 1133 l 266 997 l 212 1069 "},"°":{"x_min":63,"x_max":384,"ha":440,"o":"m 294 812 q 273 864 294 844 q 223 885 253 885 q 173 864 193 885 q 153 812 153 844 q 173 760 153 781 q 223 740 193 740 q 273 760 253 740 q 294 812 294 781 m 384 812 q 371 749 384 778 q 336 698 359 720 q 285 663 314 676 q 223 651 256 651 q 161 663 190 651 q 110 698 132 676 q 75 749 87 720 q 63 812 63 778 q 75 875 63 845 q 110 927 87 905 q 161 961 132 948 q 223 975 190 975 q 287 961 258 975 q 337 927 316 948 q 371 875 359 905 q 384 812 384 845 "},"å":{"x_min":39,"x_max":482,"ha":535,"o":"m 326 54 q 271 7 304 22 q 200 -8 237 -8 q 123 8 154 -8 q 73 53 91 25 q 46 119 54 82 q 39 200 39 157 q 49 279 39 240 q 83 348 59 318 q 146 397 107 378 q 243 416 185 416 l 331 416 l 331 490 q 316 538 331 521 q 261 556 301 556 q 219 542 240 556 q 192 492 198 528 l 55 533 q 128 653 73 610 q 271 696 183 696 q 428 648 375 696 q 482 490 482 601 l 482 0 l 331 0 l 331 52 l 326 54 m 331 303 l 271 303 q 212 282 238 303 q 186 208 186 261 q 204 153 186 172 q 255 134 223 134 q 311 156 291 134 q 331 218 331 179 l 331 303 m 288 736 q 193 774 231 736 q 155 869 155 813 q 193 964 155 925 q 288 1003 231 1003 q 383 964 345 1003 q 421 869 421 925 q 383 774 421 813 q 288 736 345 736 m 288 922 q 248 906 264 922 q 233 868 233 890 q 248 829 233 844 q 288 814 264 814 q 326 829 310 814 q 342 868 342 844 q 326 906 342 890 q 288 922 310 922 "},"0":{"x_min":74,"x_max":495,"ha":563,"o":"m 495 196 q 478 109 495 147 q 433 44 461 71 q 366 5 404 18 q 285 -8 328 -8 q 202 5 240 -8 q 135 44 164 18 q 90 109 107 71 q 74 196 74 147 l 74 768 q 90 855 74 816 q 135 920 107 894 q 202 961 164 947 q 285 975 240 975 q 436 920 378 975 q 495 768 495 866 l 495 196 m 346 773 q 328 817 346 801 q 284 833 311 833 q 239 817 257 833 q 221 773 221 801 l 221 190 q 239 146 221 162 q 284 131 257 131 q 328 146 311 131 q 346 190 346 162 l 346 773 "},"ö":{"x_min":46,"x_max":485,"ha":531,"o":"m 269 697 q 363 682 325 697 q 426 642 401 667 q 463 584 451 617 q 478 512 475 551 q 484 423 483 471 q 485 334 485 374 l 485 298 q 482 234 485 266 q 478 171 480 202 q 448 78 471 115 q 393 23 425 42 q 326 -3 362 3 q 255 -10 290 -10 q 171 3 207 -10 q 111 38 136 16 q 74 89 87 60 q 55 149 61 117 q 50 190 52 167 q 47 238 48 213 q 46 289 46 263 q 46 337 46 315 q 47 406 46 370 q 51 473 48 441 q 58 533 54 505 q 69 577 62 560 q 139 663 89 630 q 269 697 189 697 m 268 557 q 218 532 235 557 q 204 496 208 516 q 197 452 199 477 q 195 396 195 427 q 195 324 195 364 l 195 313 q 195 241 195 275 q 201 185 196 206 q 224 145 208 161 q 268 130 239 130 q 306 143 290 130 q 328 175 322 156 q 331 197 329 181 q 335 236 333 213 q 337 285 336 259 q 338 338 338 311 q 336 432 338 386 q 329 502 335 478 q 319 527 326 517 q 268 557 304 557 m 318 789 l 318 935 l 449 935 l 449 789 l 318 789 m 91 789 l 91 935 l 222 935 l 222 789 l 91 789 "},"Õ":{"x_min":64,"x_max":533,"ha":597,"o":"m 533 247 q 476 56 533 121 q 297 -8 419 -8 q 119 53 175 -8 q 64 232 64 115 l 64 718 q 77 822 64 775 q 118 903 90 869 q 190 956 145 937 q 298 975 236 975 q 410 957 365 975 q 482 906 455 940 q 521 826 509 873 q 533 719 533 779 l 533 247 m 382 730 q 364 803 382 771 q 298 835 347 835 q 255 823 272 835 q 229 794 238 811 q 217 755 220 776 q 214 715 214 733 l 214 229 q 232 161 214 191 q 297 132 251 132 q 362 163 343 132 q 382 238 382 194 l 382 730 m 448 1203 q 484 1181 466 1191 q 521 1159 501 1171 q 455 1067 490 1095 q 385 1039 421 1039 q 341 1046 361 1039 q 302 1064 321 1054 q 266 1081 283 1073 q 232 1089 248 1089 q 196 1076 215 1089 q 155 1036 176 1064 l 82 1082 q 146 1168 107 1137 q 224 1200 185 1200 q 264 1192 244 1200 q 302 1175 283 1184 q 338 1157 320 1165 q 372 1150 355 1150 q 408 1161 391 1150 q 448 1203 425 1172 "},"þ":{"x_min":47,"x_max":486,"ha":532,"o":"m 316 696 q 371 688 343 696 q 420 661 398 680 q 458 607 442 641 q 480 518 474 572 q 484 441 483 487 q 486 348 486 396 q 485 281 486 315 q 481 215 484 247 q 474 155 479 183 q 465 107 470 128 q 447 64 458 85 q 419 27 437 43 q 375 1 401 11 q 312 -8 349 -8 q 253 2 283 -8 q 201 39 223 12 l 197 39 l 197 -265 l 47 -265 l 47 965 l 194 965 l 194 636 l 198 633 q 247 682 217 668 q 316 696 277 696 m 262 550 q 211 527 228 550 q 195 468 195 504 l 195 249 q 195 206 195 226 q 202 174 196 186 q 262 136 217 136 q 315 167 299 136 q 328 237 325 190 q 332 351 332 284 q 329 456 332 413 q 316 518 326 499 q 262 550 305 550 "},"]":{"x_min":21,"x_max":239,"ha":326,"o":"m 21 -143 l 21 -40 l 108 -40 l 108 867 l 21 867 l 21 968 l 239 968 l 239 -143 l 21 -143 "},"А":{"x_min":15.28125,"x_max":572.265625,"ha":586,"o":"m 419 0 l 381 202 l 204 202 q 185 101 194 151 q 168 0 176 50 l 15 0 q 112 483 63 243 q 209 967 161 723 l 376 967 l 572 0 l 419 0 m 288 743 q 259 544 275 643 q 226 342 244 444 l 358 342 l 295 743 l 288 743 "},"Ы":{"x_min":71,"x_max":767,"ha":843,"o":"m 71 0 l 71 967 l 220 967 l 220 595 l 283 595 q 407 574 358 595 q 486 517 456 554 q 528 425 516 479 q 541 303 541 371 q 478 75 541 151 q 285 0 416 0 l 71 0 m 220 142 l 276 142 q 371 186 345 142 q 397 300 397 230 q 370 416 397 379 q 273 453 343 453 l 220 453 l 220 142 m 617 0 l 617 967 l 767 967 l 767 0 l 617 0 "},"8":{"x_min":71,"x_max":493,"ha":562,"o":"m 492 679 q 476 579 492 626 q 417 508 461 531 q 419 506 417 506 q 460 469 445 490 q 481 423 474 448 q 490 368 488 398 q 493 304 493 338 l 493 220 q 477 118 493 161 q 432 46 461 75 q 365 5 404 18 q 283 -8 327 -8 q 187 8 227 -8 q 121 55 147 25 q 83 127 95 86 q 71 218 71 169 l 71 287 q 73 352 71 320 q 82 413 75 384 q 105 464 90 441 q 147 504 120 487 q 108 532 123 513 q 85 572 94 551 q 74 615 77 594 q 72 652 72 637 l 72 763 q 129 917 72 859 q 282 975 187 975 q 437 917 383 975 q 492 749 492 859 l 492 679 m 344 373 q 330 426 344 402 q 281 450 317 450 q 231 426 245 450 q 218 373 218 402 l 218 190 q 236 147 218 164 q 281 131 255 131 q 326 147 309 131 q 344 190 344 164 l 344 373 m 344 762 q 329 814 344 793 q 281 835 314 835 q 237 818 256 835 q 218 776 218 802 l 218 623 q 236 581 218 597 q 281 565 255 565 q 326 581 309 565 q 344 623 344 597 l 344 762 "},"R":{"x_min":72,"x_max":570.390625,"ha":597,"o":"m 292 967 q 477 901 410 967 q 544 686 544 835 q 518 531 544 594 q 427 432 492 468 l 570 0 l 417 0 l 292 400 l 222 400 l 222 0 l 72 0 l 72 967 l 292 967 m 222 825 l 222 541 l 283 541 q 369 575 341 541 q 397 684 397 609 q 369 788 397 751 q 280 825 342 825 l 222 825 "},"o":{"x_min":46,"x_max":485,"ha":531,"o":"m 269 697 q 363 682 325 697 q 426 642 401 667 q 463 584 451 617 q 478 512 475 551 q 484 423 483 471 q 485 334 485 374 l 485 298 q 482 234 485 266 q 478 171 480 202 q 448 78 471 115 q 394 23 425 42 q 326 -3 362 3 q 255 -10 290 -10 q 171 3 207 -10 q 112 38 136 16 q 74 89 87 60 q 56 149 61 117 q 51 190 53 167 q 47 238 48 213 q 46 289 46 263 q 46 337 46 315 q 47 406 46 370 q 51 473 48 441 q 58 533 54 505 q 69 577 62 560 q 139 663 89 630 q 269 697 189 697 m 268 557 q 218 532 235 557 q 204 496 208 516 q 197 452 199 477 q 195 396 195 427 q 195 324 195 364 l 195 313 q 195 241 195 275 q 202 185 196 206 q 224 145 208 161 q 268 130 239 130 q 306 143 290 130 q 328 175 322 156 q 331 197 329 181 q 335 236 333 213 q 337 285 336 259 q 338 338 338 311 q 336 432 338 386 q 330 502 335 478 q 320 527 327 517 q 268 557 304 557 "},"5":{"x_min":65,"x_max":494,"ha":562,"o":"m 276 -8 q 115 54 166 -8 q 65 227 65 116 l 209 251 l 209 232 q 226 154 209 177 q 278 132 242 132 q 322 148 303 132 q 344 212 341 165 l 344 441 q 284 501 344 501 q 242 489 262 501 q 210 449 221 477 l 86 449 l 86 967 l 488 967 l 488 829 l 222 829 l 222 595 q 224 595 223 595 q 227 594 224 594 q 273 622 245 613 q 328 632 302 632 q 455 582 417 632 q 494 458 494 533 l 494 258 q 440 56 494 121 q 276 -8 387 -8 "},"Ѕ":{"x_min":49,"x_max":527,"ha":571,"o":"m 527 275 q 515 157 527 209 q 475 69 503 105 q 401 12 447 32 q 286 -8 354 -8 q 178 10 224 -8 q 104 60 133 28 q 62 135 75 92 q 49 227 49 178 l 198 256 q 218 168 200 202 q 289 134 236 134 q 337 145 319 134 q 364 177 355 157 q 375 221 373 196 q 378 274 378 246 q 373 332 378 308 q 357 372 369 356 q 324 401 346 389 q 268 429 303 414 q 156 489 198 458 q 92 553 114 519 q 62 625 69 587 q 56 709 56 664 q 69 816 56 768 q 112 900 83 865 q 187 955 142 936 q 294 975 232 975 q 407 953 363 975 q 478 898 451 931 q 515 825 504 865 q 527 747 527 784 l 378 712 q 360 798 378 765 q 289 832 342 832 q 245 820 261 832 q 220 791 229 809 q 207 752 210 773 q 205 711 205 732 q 207 667 205 686 q 223 632 210 648 q 263 598 236 615 q 335 564 289 582 q 437 510 399 539 q 495 448 475 482 q 520 371 514 414 q 527 275 527 329 "},"õ":{"x_min":46,"x_max":488,"ha":531,"o":"m 269 697 q 363 682 325 697 q 426 642 401 667 q 463 584 451 617 q 478 512 475 551 q 484 423 483 471 q 485 334 485 374 l 485 298 q 482 234 485 266 q 478 171 480 202 q 448 78 471 115 q 394 23 425 42 q 326 -3 362 3 q 255 -10 290 -10 q 171 3 207 -10 q 112 38 136 16 q 74 89 87 60 q 56 149 61 117 q 51 190 53 167 q 47 238 48 213 q 46 289 46 263 q 46 337 46 315 q 47 406 46 370 q 51 473 48 441 q 58 533 54 505 q 69 577 62 560 q 139 663 89 630 q 269 697 189 697 m 268 557 q 218 532 235 557 q 204 496 208 516 q 197 452 199 477 q 195 396 195 427 q 195 324 195 364 l 195 313 q 195 241 195 275 q 202 185 196 206 q 224 145 208 161 q 268 130 239 130 q 306 143 290 130 q 328 175 322 156 q 331 197 329 181 q 335 236 333 213 q 337 285 336 259 q 338 338 338 311 q 336 432 338 386 q 330 502 335 478 q 320 527 327 517 q 268 557 304 557 m 415 953 q 451 931 433 941 q 488 909 468 921 q 422 817 457 845 q 351 789 387 789 q 308 796 328 789 q 269 814 287 804 q 233 831 250 823 q 199 839 215 839 q 162 826 182 839 q 122 786 143 814 l 49 832 q 113 918 74 887 q 191 950 152 950 q 231 942 211 950 q 269 925 250 934 q 305 907 287 915 q 339 900 322 900 q 375 911 358 900 q 415 953 391 922 "},",":{"x_min":67,"x_max":227,"ha":298,"o":"m 150 -190 l 67 -190 l 107 -8 l 71 -8 l 71 167 l 227 167 l 227 -4 l 150 -190 "},"d":{"x_min":44,"x_max":483,"ha":541,"o":"m 211 -8 q 157 0 184 -8 q 107 26 129 7 q 69 80 85 46 q 48 168 53 114 q 44 245 45 198 q 44 339 44 291 q 47 463 44 401 q 60 565 50 525 q 76 614 66 590 q 105 655 87 637 q 150 684 123 673 q 217 696 177 696 q 276 684 246 696 q 327 647 306 672 l 333 647 l 333 1008 l 483 1008 l 483 0 l 334 0 l 334 51 q 332 52 332 51 q 330 52 331 52 q 281 5 310 19 q 211 -8 252 -8 m 266 136 q 316 159 300 136 q 333 218 333 183 q 334 265 334 240 q 334 315 334 290 l 334 351 q 333 417 333 386 q 333 474 334 449 q 317 529 333 507 q 266 552 302 552 q 214 518 230 552 q 200 449 203 496 q 198 336 198 403 q 200 229 198 272 q 211 169 203 187 q 231 145 218 154 q 266 136 243 136 "},"\"":{"x_min":54,"x_max":338,"ha":389,"o":"m 231 681 l 231 967 l 338 967 l 338 681 l 231 681 m 54 681 l 54 967 l 160 967 l 160 681 l 54 681 "},"ê":{"x_min":40,"x_max":485.875,"ha":522,"o":"m 195 308 q 195 233 195 269 q 202 178 196 197 q 262 131 215 131 q 325 210 318 131 l 475 186 q 415 43 469 94 q 261 -8 361 -8 q 177 3 212 -8 q 118 35 143 15 q 80 79 94 54 q 59 129 66 104 q 52 171 55 146 q 48 224 50 196 q 46 282 47 252 q 46 338 46 312 q 50 472 46 405 q 69 574 55 538 q 137 663 89 630 q 266 697 186 697 q 422 640 369 697 q 475 478 475 583 l 475 308 l 195 308 m 207 514 q 199 475 201 502 q 196 411 197 448 l 324 411 l 324 469 q 312 528 324 502 q 262 555 300 555 q 207 514 222 555 m 263 870 l 99 740 l 40 793 l 223 1000 l 310 1000 l 485 794 l 426 740 l 263 870 "},"ч":{"x_min":36,"x_max":470,"ha":524,"o":"m 320 279 q 283 264 303 271 q 244 254 263 258 q 209 248 226 250 q 184 246 193 246 q 74 285 113 246 q 36 405 36 325 l 36 686 l 187 686 l 187 453 q 247 384 187 384 q 321 406 280 384 l 321 686 l 470 686 l 470 0 l 320 0 l 320 279 "},"Â":{"x_min":15.28125,"x_max":572.265625,"ha":586,"o":"m 419 0 l 381 202 l 204 202 q 185 101 194 151 q 168 0 176 50 l 15 0 q 112 483 63 243 q 209 967 161 723 l 376 967 l 572 0 l 419 0 m 293 1112 l 129 1005 l 69 1058 l 252 1242 l 340 1242 l 515 1060 l 455 1005 l 293 1112 m 288 743 q 259 544 275 643 q 226 342 244 444 l 358 342 l 295 743 l 288 743 "},"₎":{"x_min":31.9375,"x_max":226,"ha":229,"o":"m 226 152 q 187 -37 226 49 q 94 -199 149 -123 l 33 -160 q 99 -10 73 -93 q 125 155 125 72 q 99 314 125 231 q 31 468 74 397 l 100 496 q 189 341 152 426 q 226 152 226 255 "},"₄":{"x_min":20.640625,"x_max":345.890625,"ha":367,"o":"m 307 -43 l 307 -125 l 204 -125 l 204 -43 l 20 -43 l 20 41 l 147 453 l 251 453 l 128 50 l 204 50 l 204 187 l 307 187 l 307 50 l 345 50 l 345 -43 l 307 -43 "},"Í":{"x_min":75,"x_max":383.359375,"ha":301,"o":"m 75 0 l 75 967 l 226 967 l 226 0 l 75 0 m 80 1069 l 294 1238 l 383 1133 l 134 997 l 80 1069 "},"´":{"x_min":183.34375,"x_max":425.03125,"ha":515,"o":"m 183 797 l 301 1043 l 425 987 l 263 754 l 183 797 "},"⁾":{"x_min":31.9375,"x_max":226,"ha":229,"o":"m 226 769 q 187 579 226 666 q 94 418 149 493 l 33 456 q 99 606 73 523 q 125 772 125 689 q 99 931 125 848 q 31 1085 74 1014 l 100 1113 q 189 958 152 1043 q 226 769 226 872 "},"Ú":{"x_min":67,"x_max":536,"ha":601,"o":"m 536 965 l 536 247 q 479 56 536 120 q 301 -8 423 -8 q 123 53 179 -8 q 67 232 67 115 l 67 965 l 217 965 l 217 229 q 235 161 217 191 q 300 132 254 132 q 365 163 346 132 q 385 238 385 194 l 385 965 l 536 965 m 207 1069 l 420 1238 l 509 1133 l 261 997 l 207 1069 "},"Ý":{"x_min":11.09375,"x_max":537.515625,"ha":549,"o":"m 279 590 l 325 761 l 379 967 l 537 967 l 350 400 l 350 0 l 200 0 l 200 400 l 11 967 l 169 967 l 229 757 l 273 590 l 279 590 m 205 1069 l 419 1238 l 508 1133 l 259 997 l 205 1069 "},"И":{"x_min":67,"x_max":565,"ha":632,"o":"m 414 605 l 211 0 l 67 0 l 67 967 l 213 967 l 213 354 l 218 354 l 419 967 l 565 967 l 565 0 l 418 0 l 418 605 l 414 605 "},"₁":{"x_min":45,"x_max":239,"ha":302,"o":"m 129 -125 l 129 333 l 45 270 l 45 384 l 137 453 l 239 453 l 239 -125 l 129 -125 "},"⁼":{"x_min":8.328125,"x_max":356.96875,"ha":367,"o":"m 8 783 l 8 868 l 356 868 l 356 783 l 8 783 m 8 650 l 8 735 l 356 735 l 356 650 l 8 650 "},"Љ":{"x_min":1.546875,"x_max":853,"ha":882,"o":"m 587 142 q 682 185 657 142 q 707 301 707 229 q 679 416 707 380 q 585 453 652 453 l 531 453 l 531 142 l 587 142 m 381 825 l 254 825 l 254 452 q 245 256 254 336 q 215 123 237 177 q 155 35 193 69 q 58 -25 118 1 l 1 86 q 60 131 37 106 q 97 193 83 157 q 116 281 111 229 q 121 411 121 333 l 121 967 l 531 967 l 531 596 l 594 596 q 719 575 669 596 q 798 517 768 555 q 840 425 828 479 q 853 304 853 370 q 790 76 853 152 q 597 0 728 0 l 381 0 l 381 825 "},"р":{"x_min":47,"x_max":486,"ha":532,"o":"m 316 696 q 370 688 343 696 q 420 661 398 680 q 458 607 442 641 q 480 518 474 572 q 484 441 483 487 q 486 348 486 396 q 482 224 486 287 q 469 121 479 161 q 453 73 463 96 q 424 32 442 50 q 378 3 406 14 q 312 -8 351 -8 q 253 2 283 -8 q 201 39 223 12 l 197 39 l 197 -265 l 47 -265 l 47 688 l 194 688 l 194 636 l 198 633 q 247 682 217 668 q 316 696 277 696 m 262 550 q 212 527 229 550 q 196 468 196 504 l 196 249 q 196 206 196 226 q 203 174 197 186 q 262 136 218 136 q 315 167 300 136 q 328 237 325 190 q 332 351 332 284 q 329 456 332 413 q 316 518 326 499 q 262 550 305 550 "},"т":{"x_min":-1.515625,"x_max":425.90625,"ha":425,"o":"m 287 553 l 287 0 l 136 0 l 136 553 l -1 553 l -1 688 l 425 688 l 425 553 l 287 553 "},"П":{"x_min":72,"x_max":525,"ha":597,"o":"m 375 0 l 375 823 l 222 823 l 222 0 l 72 0 l 72 967 l 525 967 l 525 0 l 375 0 "},"Ö":{"x_min":64,"x_max":533,"ha":597,"o":"m 382 730 q 364 803 382 771 q 298 835 347 835 q 255 823 272 835 q 229 794 238 811 q 217 755 220 776 q 214 715 214 733 l 214 229 q 232 161 214 191 q 297 132 251 132 q 362 163 343 132 q 382 238 382 194 l 382 730 m 533 247 q 476 56 533 121 q 297 -8 419 -8 q 119 53 175 -8 q 64 232 64 115 l 64 718 q 77 822 64 775 q 118 903 90 869 q 190 956 145 937 q 298 975 236 975 q 410 957 365 975 q 482 906 455 940 q 521 826 509 873 q 533 719 533 779 l 533 247 m 346 1028 l 346 1175 l 477 1175 l 477 1028 l 346 1028 m 118 1028 l 118 1175 l 249 1175 l 249 1028 l 118 1028 "},"z":{"x_min":36.109375,"x_max":420.859375,"ha":456,"o":"m 36 0 l 36 136 l 251 553 l 52 553 l 52 686 l 420 686 l 420 559 l 201 140 l 420 140 l 420 0 l 36 0 "},"ã":{"x_min":39,"x_max":493.25,"ha":535,"o":"m 327 54 q 271 7 304 22 q 200 -8 237 -8 q 123 8 154 -8 q 73 53 91 25 q 46 119 54 82 q 39 200 39 157 q 49 279 39 240 q 83 348 59 318 q 146 397 107 378 q 243 416 185 416 l 331 416 l 331 490 q 316 538 331 521 q 261 556 301 556 q 219 542 240 556 q 192 492 198 528 l 55 533 q 128 653 73 610 q 271 696 183 696 q 428 648 375 696 q 482 490 482 601 l 482 0 l 331 0 l 331 52 l 327 54 m 421 945 q 456 923 439 933 q 493 901 473 913 q 427 809 462 837 q 357 781 393 781 q 313 788 333 781 q 274 806 293 796 q 238 823 255 815 q 204 831 221 831 q 168 818 187 831 q 127 778 148 806 l 54 824 q 118 910 79 879 q 196 942 157 942 q 236 934 216 942 q 274 917 255 926 q 310 899 293 907 q 344 892 327 892 q 380 903 364 892 q 421 945 397 914 m 331 303 l 271 303 q 212 282 238 303 q 186 208 186 261 q 204 153 186 172 q 255 134 223 134 q 311 156 291 134 q 331 218 331 179 l 331 303 "},"æ":{"x_min":35,"x_max":759.40625,"ha":795,"o":"m 541 -8 q 434 13 478 -8 q 368 74 390 35 q 326 31 347 47 q 284 6 304 15 q 245 -5 264 -2 q 211 -8 226 -8 q 124 8 158 -8 q 71 53 90 25 q 43 119 51 80 q 35 199 35 157 q 46 277 35 239 q 81 346 57 315 q 144 394 105 376 q 239 413 183 413 l 324 413 l 324 490 q 307 538 324 521 q 255 556 291 556 q 213 542 232 556 q 186 493 194 529 q 117 514 151 504 q 51 533 84 524 q 127 654 70 612 q 268 696 184 696 q 353 682 319 696 q 405 646 386 669 q 546 697 457 697 q 702 640 646 697 q 758 479 758 583 l 758 310 l 477 310 q 477 239 477 273 q 483 180 478 204 q 503 144 487 157 q 545 131 519 131 q 590 151 574 131 q 610 204 606 171 q 684 190 646 197 q 759 176 721 183 q 697 42 749 93 q 541 -8 645 -8 m 324 304 l 265 304 q 207 282 233 304 q 182 208 182 261 q 200 154 182 174 q 254 134 219 134 q 305 157 287 134 q 324 218 324 180 l 324 304 m 607 414 l 607 450 q 603 508 607 480 q 583 542 600 528 q 543 556 567 556 q 499 540 515 556 q 481 497 482 525 l 477 414 l 607 414 "},"₊":{"x_min":8.8125,"x_max":357.171875,"ha":367,"o":"m 228 75 l 228 -53 l 138 -53 l 138 75 l 8 75 l 8 160 l 138 160 l 138 288 l 228 288 l 228 160 l 357 160 l 357 75 l 228 75 "},"É":{"x_min":72,"x_max":501.1875,"ha":528,"o":"m 72 0 l 72 967 l 501 967 l 501 825 l 222 825 l 222 563 l 465 563 l 465 420 l 222 420 l 222 142 l 501 142 l 501 0 l 72 0 m 176 1069 l 390 1238 l 479 1133 l 230 997 l 176 1069 "},"и":{"x_min":57,"x_max":525,"ha":583,"o":"m 375 0 l 375 397 l 372 397 l 202 0 l 57 0 l 57 686 l 204 686 l 204 273 l 206 273 l 375 686 l 525 686 l 525 0 l 375 0 "},"~":{"x_min":11.109375,"x_max":547.265625,"ha":563,"o":"m 177 480 q 234 468 208 480 q 285 445 261 457 q 331 422 309 432 q 376 412 354 412 q 420 427 401 412 q 465 475 438 442 l 547 427 q 476 325 515 360 q 388 290 437 290 q 334 300 361 290 q 283 324 308 310 q 233 347 258 337 q 184 358 208 358 q 138 344 158 358 q 88 294 118 331 l 11 344 q 79 443 40 406 q 177 480 119 480 "},"³":{"x_min":36,"x_max":331,"ha":367,"o":"m 331 699 q 327 626 331 660 q 284 537 320 567 q 186 508 248 508 q 76 546 113 508 q 40 653 40 585 l 40 660 l 149 673 q 158 627 151 642 q 190 612 165 612 q 215 623 207 612 q 223 645 223 635 l 223 721 q 174 767 223 767 l 138 767 l 138 855 l 177 855 q 209 864 196 855 q 223 896 223 873 l 223 960 q 215 985 223 974 q 189 997 207 997 q 143 926 143 997 q 89 933 115 928 q 36 941 63 937 q 79 1054 38 1012 q 190 1097 119 1097 q 278 1076 247 1097 q 321 1020 308 1055 q 329 973 328 1001 q 331 923 331 945 q 324 862 331 892 q 282 813 317 833 q 322 771 314 799 q 331 699 331 744 "},"¡":{"x_min":102,"x_max":250,"ha":350,"o":"m 114 426 l 237 426 l 250 -276 l 102 -276 l 114 426 m 247 692 l 247 539 l 103 539 l 103 692 l 247 692 "},"[":{"x_min":86,"x_max":305,"ha":326,"o":"m 86 -142 l 86 968 l 305 968 l 305 867 l 218 867 l 218 -39 l 305 -39 l 305 -142 l 86 -142 "},"К":{"x_min":72,"x_max":596.03125,"ha":610,"o":"m 72 0 l 72 967 l 221 967 l 221 558 l 251 558 q 333 587 301 558 q 382 691 365 616 q 393 743 384 703 q 411 828 402 783 q 429 912 421 873 q 440 965 437 952 l 580 965 q 550 819 565 891 q 519 676 534 748 q 473 561 504 605 q 401 501 441 517 l 401 498 q 483 435 454 478 q 527 322 512 392 q 562 160 546 240 q 596 0 577 80 l 446 0 q 418 141 432 70 q 389 283 404 212 q 342 391 373 360 q 261 422 311 422 l 221 422 l 221 0 l 72 0 "},"%":{"x_min":37,"x_max":836,"ha":875,"o":"m 726 451 q 717 474 726 464 q 691 485 708 485 q 665 474 674 485 q 657 451 657 464 l 657 128 q 665 105 657 115 q 692 95 674 95 q 717 105 708 95 q 726 128 726 115 l 726 451 m 836 122 q 794 28 836 61 q 693 -4 752 -4 q 591 28 633 -4 q 550 122 550 61 l 550 457 q 592 551 550 518 q 693 585 634 585 q 795 551 754 585 q 836 457 836 518 l 836 122 m 214 840 q 204 863 214 853 q 179 874 195 874 q 153 863 162 874 q 144 840 144 853 l 144 517 q 153 494 144 504 q 180 484 162 484 q 204 494 195 484 q 214 517 214 504 l 214 840 m 324 511 q 282 417 324 450 q 180 385 240 385 q 78 417 120 385 q 37 511 37 450 l 37 846 q 79 940 37 907 q 180 974 121 974 q 282 940 241 974 q 324 846 324 907 l 324 511 m 263 -24 l 171 -24 l 608 992 l 699 992 l 263 -24 "},"P":{"x_min":72,"x_max":543,"ha":572,"o":"m 285 967 q 481 897 419 967 q 543 673 543 828 q 530 550 543 605 q 487 455 517 494 q 407 393 456 415 q 283 371 358 371 l 222 371 l 222 0 l 72 0 l 72 967 l 285 967 m 222 825 l 222 514 l 274 514 q 371 553 344 514 q 399 672 399 593 q 373 784 399 743 q 277 825 347 825 l 222 825 "},"_":{"x_min":0,"x_max":694.5,"ha":695,"o":"m 0 -203 l 0 -97 l 694 -97 l 694 -203 l 0 -203 "},"ñ":{"x_min":46,"x_max":486,"ha":542,"o":"m 203 625 l 208 625 q 263 674 229 654 q 337 695 298 695 q 407 681 378 695 q 453 644 435 668 q 478 587 470 619 q 486 518 486 556 l 486 0 l 336 0 l 336 475 q 273 549 336 549 q 222 527 241 549 q 203 468 203 505 l 203 0 l 53 0 l 53 686 l 203 686 l 203 625 m 412 953 q 448 931 430 941 q 485 909 465 921 q 419 817 454 845 q 348 789 384 789 q 305 796 325 789 q 266 814 284 804 q 230 831 247 823 q 196 839 212 839 q 159 826 179 839 q 119 786 140 814 l 46 832 q 109 918 70 887 q 187 950 148 950 q 227 942 208 950 q 265 925 247 934 q 302 907 284 915 q 336 900 319 900 q 372 911 355 900 q 412 953 388 922 "},"Æ":{"x_min":8.234375,"x_max":846.1875,"ha":879,"o":"m 418 0 l 418 231 l 234 231 l 163 0 l 8 0 l 317 967 l 846 967 l 846 825 l 567 825 l 567 563 l 810 563 l 810 420 l 567 420 l 567 146 l 846 146 l 846 0 l 418 0 m 274 374 l 418 374 l 418 824 l 411 824 l 274 374 "},"ѓ":{"x_min":60,"x_max":447.140625,"ha":471,"o":"m 147 797 l 265 1043 l 388 987 l 227 754 l 147 797 m 211 553 l 211 0 l 60 0 l 60 688 l 447 688 l 447 553 l 211 553 "},"ы":{"x_min":60,"x_max":703,"ha":768,"o":"m 550 0 l 550 688 l 703 688 l 703 0 l 550 0 m 60 0 l 60 688 l 213 688 l 213 435 l 257 435 q 371 419 325 435 q 444 375 417 404 q 483 307 472 347 q 495 220 495 268 q 258 0 495 0 l 60 0 m 253 135 q 327 160 308 135 q 346 219 346 186 q 325 277 346 255 q 251 300 304 300 l 213 300 l 213 135 l 253 135 "},"ª":{"x_min":21,"x_max":337,"ha":368,"o":"m 31 734 q 85 819 46 788 q 187 850 125 850 q 299 817 262 850 q 337 709 337 784 l 337 389 l 219 389 l 219 416 q 138 383 186 383 q 81 394 104 383 q 45 424 58 405 q 26 469 32 444 q 21 523 21 494 q 28 576 21 549 q 52 622 36 602 q 97 655 69 642 q 166 668 124 668 l 219 668 l 219 708 q 180 743 219 743 q 156 735 169 743 q 139 704 143 727 l 31 734 m 219 582 l 185 582 q 148 570 165 582 q 132 529 132 558 q 143 495 132 505 q 174 486 155 486 q 208 499 198 486 q 219 534 219 512 l 219 582 "},"ї":{"x_min":-36,"x_max":322,"ha":283,"o":"m 191 789 l 191 935 l 322 935 l 322 789 l 191 789 m -36 789 l -36 935 l 95 935 l 95 789 l -36 789 m 66 0 l 66 686 l 217 686 l 217 0 l 66 0 "},"T":{"x_min":4.4375,"x_max":466.5625,"ha":472,"o":"m 311 827 l 311 0 l 160 0 l 160 827 l 4 827 l 4 967 l 466 967 l 466 827 l 311 827 "},"Њ":{"x_min":72,"x_max":861,"ha":890,"o":"m 389 0 l 389 438 l 221 438 l 221 0 l 72 0 l 72 967 l 221 967 l 221 581 l 389 581 l 389 967 l 539 967 l 539 581 l 602 581 q 727 562 677 581 q 806 507 776 543 q 848 418 836 471 q 861 297 861 365 q 798 72 861 145 q 604 0 736 0 l 389 0 m 539 142 l 594 142 q 613 144 602 142 q 695 190 676 150 q 715 294 715 231 q 687 406 715 374 q 591 438 660 438 l 539 438 l 539 142 "},"є":{"x_min":57,"x_max":489,"ha":514,"o":"m 489 181 q 427 42 484 93 q 270 -8 370 -8 q 188 3 223 -8 q 129 34 154 15 q 91 78 105 53 q 69 129 76 103 q 62 171 65 146 q 59 224 59 196 q 57 282 58 252 q 57 338 57 312 q 58 406 57 372 q 62 473 59 441 q 69 533 65 505 q 80 577 73 561 q 149 663 100 630 q 279 697 198 697 q 432 646 379 697 q 488 505 485 596 l 338 489 q 318 541 335 524 q 278 558 301 558 q 218 516 233 558 q 209 474 211 502 q 207 407 208 447 l 370 407 l 370 286 l 206 286 q 207 224 206 254 q 214 178 208 194 q 235 143 221 155 q 275 131 249 131 q 319 149 303 131 q 338 201 335 167 l 489 181 "},"Þ":{"x_min":71,"x_max":543,"ha":572,"o":"m 285 789 q 481 719 419 789 q 543 495 543 650 q 530 372 543 427 q 487 277 517 316 q 407 215 456 237 q 283 193 358 193 l 222 193 l 222 0 l 72 0 l 71 967 l 219 967 l 219 789 l 285 789 m 222 647 l 222 336 l 274 336 q 371 375 344 336 q 399 495 399 415 q 373 606 399 565 q 277 647 347 647 l 222 647 "},"j":{"x_min":-22,"x_max":217,"ha":280,"o":"m 66 821 l 66 967 l 217 967 l 217 821 l 66 821 m 217 -72 q 166 -221 217 -168 q 5 -274 115 -274 l -22 -274 l -22 -132 l 0 -132 q 53 -109 40 -132 q 66 -34 66 -87 l 66 688 l 217 688 l 217 -72 "},"1":{"x_min":141,"x_max":422,"ha":562,"o":"m 273 0 l 273 798 l 141 693 l 141 854 l 281 967 l 422 967 l 422 0 l 273 0 "},"ћ":{"x_min":0.5,"x_max":495,"ha":555,"o":"m 219 615 q 275 664 239 644 q 350 685 311 685 q 420 671 392 685 q 464 632 448 657 q 488 575 481 608 q 495 504 495 541 l 495 0 l 344 0 l 344 465 q 280 539 344 539 q 230 518 248 539 q 213 461 213 498 l 213 0 l 63 0 l 63 786 l 0 786 l 0 882 l 63 882 l 63 1008 l 213 1008 l 213 882 l 389 882 l 389 786 l 213 786 l 213 616 l 219 615 "},"<":{"x_min":20.828125,"x_max":540.328125,"ha":563,"o":"m 538 104 l 20 363 l 20 464 l 540 724 l 540 586 l 163 414 l 538 243 l 538 104 "},"Ц":{"x_min":71,"x_max":602,"ha":620,"o":"m 539 967 l 539 140 l 602 140 l 602 -184 l 477 -184 l 477 0 l 71 0 l 71 967 l 221 967 l 221 140 l 389 140 l 389 967 l 539 967 "},"t":{"x_min":18,"x_max":313,"ha":352,"o":"m 245 0 q 168 14 198 0 q 118 52 137 29 q 92 105 100 76 q 85 164 85 134 l 85 570 l 18 570 l 18 688 l 86 688 l 86 861 l 231 861 l 231 688 l 313 688 l 313 570 l 231 570 l 231 212 q 243 156 231 173 q 294 139 255 139 l 312 139 l 312 0 l 245 0 "},"¬":{"x_min":19.203125,"x_max":540,"ha":563,"o":"m 540 133 l 422 133 l 422 352 l 19 352 l 19 471 l 540 471 l 540 133 "},"ù":{"x_min":54,"x_max":488,"ha":544,"o":"m 338 61 q 335 61 336 61 q 332 62 335 62 q 276 12 311 31 q 202 -7 241 -7 q 130 6 159 -7 q 85 43 102 19 q 60 99 67 66 q 54 169 54 132 l 54 688 l 205 688 l 205 211 q 221 153 205 170 q 267 136 237 136 q 317 157 295 136 q 339 216 339 179 l 339 688 l 488 688 l 488 0 l 338 0 l 338 61 m 263 754 l 102 987 l 226 1043 l 343 797 l 263 754 "},"Ф":{"x_min":61,"x_max":710,"ha":770,"o":"m 710 325 q 687 219 710 263 q 630 144 665 175 q 550 97 594 113 q 460 76 505 80 l 460 0 l 311 0 l 311 76 l 309 76 q 194 106 241 83 q 117 165 147 129 q 74 250 87 201 q 61 357 61 298 l 61 669 q 82 775 61 729 q 139 853 104 821 q 220 901 174 885 q 311 918 265 918 l 311 967 l 460 967 l 461 918 q 551 898 507 915 q 631 850 596 882 q 688 773 666 819 q 710 668 710 728 l 710 325 m 570 680 q 538 762 570 733 q 460 795 507 791 l 461 200 q 498 211 479 202 q 534 233 518 219 q 560 266 550 247 q 570 311 570 286 l 570 680 m 311 795 q 232 761 261 788 q 203 680 203 733 l 203 311 q 212 264 203 284 q 237 230 222 244 q 272 209 252 216 q 311 200 291 201 l 311 795 "},"ï":{"x_min":-14,"x_max":345,"ha":331,"o":"m 89 0 l 89 686 l 240 686 l 240 0 l 89 0 m 214 789 l 214 935 l 345 935 l 345 789 l 214 789 m -14 789 l -14 935 l 117 935 l 117 789 l -14 789 "},"Ò":{"x_min":64,"x_max":533,"ha":597,"o":"m 382 730 q 364 803 382 771 q 298 835 347 835 q 255 823 272 835 q 229 794 238 811 q 217 755 220 776 q 214 715 214 733 l 214 229 q 232 161 214 191 q 297 132 251 132 q 362 163 343 132 q 382 238 382 194 l 382 730 m 533 247 q 476 56 533 121 q 297 -8 419 -8 q 119 53 175 -8 q 64 232 64 115 l 64 718 q 77 822 64 775 q 118 903 90 869 q 190 956 145 937 q 298 975 236 975 q 410 957 365 975 q 482 906 455 940 q 521 826 509 873 q 533 719 533 779 l 533 247 m 343 997 l 94 1134 l 183 1239 l 397 1070 l 343 997 "},"О":{"x_min":64,"x_max":533,"ha":597,"o":"m 382 730 q 364 803 382 771 q 298 835 347 835 q 255 823 272 835 q 229 794 238 811 q 217 755 220 776 q 214 715 214 733 l 214 229 q 232 161 214 191 q 297 132 251 132 q 362 163 343 132 q 382 238 382 194 l 382 730 m 533 247 q 476 56 533 121 q 297 -8 419 -8 q 119 53 175 -8 q 64 232 64 115 l 64 718 q 77 822 64 775 q 118 903 90 869 q 190 956 145 937 q 298 975 236 975 q 410 957 365 975 q 482 906 455 940 q 521 826 509 873 q 533 719 533 779 l 533 247 "},"&":{"x_min":57,"x_max":654.59375,"ha":667,"o":"m 249 755 q 264 682 249 723 q 307 592 280 640 l 461 318 q 474 373 469 343 q 479 437 478 404 l 610 437 q 592 306 608 375 q 549 183 576 237 l 654 0 l 489 0 l 453 62 q 362 5 410 18 q 265 -8 315 -8 q 181 10 219 -8 q 115 61 143 28 q 72 142 87 94 q 57 246 57 189 q 91 394 57 329 q 189 518 126 458 l 164 562 q 126 652 143 601 q 110 757 110 703 q 123 842 110 803 q 163 911 137 882 q 226 957 189 940 q 307 974 262 974 q 437 944 383 974 q 524 843 492 914 l 400 780 q 365 827 387 812 q 317 842 343 842 q 263 814 278 842 q 249 755 249 786 m 258 397 q 212 326 228 361 q 197 251 197 291 q 221 162 197 200 q 290 125 245 125 q 344 138 317 125 q 388 172 370 151 l 258 397 "},"I":{"x_min":75,"x_max":226,"ha":301,"o":"m 75 0 l 75 967 l 226 967 l 226 0 l 75 0 "},"ə":{"x_min":47,"x_max":478,"ha":522,"o":"m 328 381 q 326 456 328 419 q 318 511 325 492 q 258 559 304 559 q 197 479 202 559 l 47 503 q 106 647 52 595 q 262 699 161 699 q 345 687 309 699 q 404 655 380 675 q 442 611 427 636 q 464 560 457 586 q 471 518 468 543 q 475 464 473 493 q 477 406 476 436 q 478 351 478 376 q 476 283 478 318 q 472 217 475 248 q 465 158 469 185 q 454 114 461 132 q 385 25 433 58 q 256 -8 337 -8 q 99 48 152 -8 q 47 210 47 105 l 47 381 l 328 381 m 315 174 q 323 213 321 186 q 327 278 325 240 l 198 278 l 198 219 q 209 160 198 186 q 259 134 221 134 q 315 174 300 134 "},"G":{"x_min":71,"x_max":538,"ha":594,"o":"m 304 -8 q 127 52 184 -8 q 71 229 71 112 l 71 711 q 83 813 71 765 q 124 897 96 861 q 197 954 152 933 q 305 975 241 975 q 479 913 423 975 q 535 753 535 852 l 535 742 l 389 713 q 368 799 389 766 q 304 833 348 833 q 261 821 278 833 q 235 793 244 810 q 223 755 226 776 q 220 717 220 735 l 220 227 q 224 198 220 212 q 244 152 228 173 q 300 132 260 132 q 364 152 340 132 q 389 209 389 173 l 389 400 l 300 400 l 300 531 l 538 531 l 538 222 q 473 50 538 108 q 304 -8 408 -8 "},"`":{"x_min":138.90625,"x_max":379.203125,"ha":515,"o":"m 300 754 l 138 987 l 262 1043 l 379 797 l 300 754 "},"₉":{"x_min":38,"x_max":325,"ha":367,"o":"m 72 -126 q 131 12 107 -46 q 171 111 155 71 l 169 111 q 138 107 157 107 q 69 134 100 107 q 38 227 38 162 l 38 297 q 41 349 38 322 q 56 396 44 376 q 108 443 74 426 q 183 460 143 460 q 280 430 239 460 q 324 343 321 401 q 325 303 325 325 q 325 260 325 282 q 306 148 325 193 l 191 -126 l 72 -126 m 148 235 q 156 207 148 219 q 183 195 164 195 q 212 210 207 195 q 218 236 218 226 l 218 325 q 208 349 218 338 q 183 361 198 361 q 157 349 167 361 q 148 325 148 338 l 148 235 "},"·":{"x_min":68,"x_max":224,"ha":293,"o":"m 68 292 l 68 460 l 224 460 l 224 292 l 68 292 "},"¿":{"x_min":53,"x_max":522,"ha":547,"o":"m 53 -37 q 55 23 53 -3 q 64 71 58 49 q 80 113 71 92 q 104 158 90 134 q 133 204 118 180 q 162 254 148 228 q 185 306 176 280 q 194 360 194 333 l 194 434 l 341 434 l 341 323 q 331 264 341 292 q 306 212 321 237 q 253 122 273 156 q 222 63 233 88 q 209 17 212 38 q 207 -35 207 -4 q 211 -68 207 -50 q 224 -103 215 -86 q 249 -130 233 -119 q 290 -142 265 -142 q 349 -114 323 -142 q 375 -21 375 -87 l 522 -37 q 454 -223 519 -161 q 284 -285 388 -285 q 107 -221 162 -285 q 53 -37 53 -157 m 340 690 l 340 537 l 197 537 l 197 690 l 340 690 "},"ý":{"x_min":5.5625,"x_max":493.09375,"ha":499,"o":"m 251 231 l 288 431 l 338 686 l 493 686 l 294 -105 q 232 -224 275 -181 q 109 -268 190 -268 l 56 -268 l 56 -136 l 87 -136 q 137 -115 118 -136 q 170 -37 156 -95 l 180 5 l 5 686 l 165 686 l 208 431 l 245 231 l 251 231 m 187 797 l 305 1043 l 429 987 l 268 754 l 187 797 "},"Ђ":{"x_min":14.328125,"x_max":624,"ha":687,"o":"m 397 511 q 354 500 379 511 q 306 467 329 490 l 306 0 l 156 0 l 156 827 l 14 827 l 14 967 l 519 967 l 519 827 l 306 827 l 306 601 l 310 601 q 381 638 343 626 q 455 650 419 650 q 537 633 505 650 q 589 590 569 616 q 616 530 608 563 q 624 463 624 497 l 624 204 q 579 18 624 83 q 419 -47 535 -47 l 389 -47 l 389 77 q 453 106 433 77 q 473 186 473 134 l 473 422 q 457 485 473 459 q 397 511 442 511 "},"º":{"x_min":26,"x_max":340,"ha":365,"o":"m 184 850 q 280 827 246 850 q 326 769 313 804 q 333 738 330 758 q 337 696 335 719 q 339 649 338 673 q 340 606 340 626 q 336 505 340 544 q 315 444 331 469 q 278 405 299 420 q 231 385 256 391 q 182 380 206 380 q 76 410 111 380 q 34 475 40 441 q 26 537 27 496 q 26 610 26 577 q 29 701 26 655 q 41 767 32 747 q 91 827 56 805 q 184 850 126 850 m 181 744 q 148 717 154 744 q 143 672 145 706 q 141 595 141 638 q 141 550 141 572 q 145 515 142 529 q 184 486 152 486 q 207 494 199 486 q 218 509 215 502 q 223 540 222 520 q 225 590 225 561 l 225 611 q 225 640 225 623 q 224 673 225 656 q 221 704 223 690 q 215 727 219 719 q 181 744 206 744 "},"я":{"x_min":29.40625,"x_max":487,"ha":537,"o":"m 29 0 l 80 211 q 103 271 87 243 q 146 315 118 299 q 69 381 90 338 q 49 475 49 424 q 107 632 49 576 q 273 688 165 688 l 487 688 l 487 0 l 336 0 l 336 277 l 299 277 q 245 254 266 277 q 209 165 223 232 l 175 0 l 29 0 m 290 557 q 220 535 245 557 q 196 471 196 514 q 220 417 196 435 q 287 399 245 399 l 336 399 l 336 557 l 290 557 "},"Ё":{"x_min":72,"x_max":501.1875,"ha":528,"o":"m 72 0 l 72 967 l 501 967 l 501 825 l 222 825 l 222 563 l 465 563 l 465 420 l 222 420 l 222 142 l 501 142 l 501 0 l 72 0 m 337 1028 l 337 1175 l 468 1175 l 468 1028 l 337 1028 m 110 1028 l 110 1175 l 241 1175 l 241 1028 l 110 1028 "},"₃":{"x_min":36,"x_max":331,"ha":367,"o":"m 331 61 q 327 -12 331 22 q 284 -100 320 -70 q 186 -130 248 -130 q 76 -91 113 -130 q 40 15 40 -52 l 40 22 l 149 35 q 158 -10 151 4 q 190 -26 165 -26 q 215 -14 207 -26 q 223 7 223 -2 l 223 83 q 174 129 223 129 l 138 129 l 138 216 l 177 216 q 209 225 196 216 q 223 258 223 234 l 223 321 q 215 346 223 335 q 189 358 207 358 q 143 287 143 358 q 89 294 115 289 q 36 302 63 298 q 79 415 38 373 q 190 458 119 458 q 278 437 247 458 q 321 381 308 416 q 329 334 328 362 q 331 284 331 306 q 324 224 331 254 q 282 175 317 194 q 322 133 314 161 q 331 61 331 105 "},";":{"x_min":67,"x_max":227,"ha":298,"o":"m 150 -190 l 67 -190 l 107 -8 l 71 -8 l 71 166 l 227 166 l 227 -4 l 150 -190 m 71 388 l 71 556 l 227 556 l 227 388 l 71 388 "},"Г":{"x_min":72,"x_max":490.078125,"ha":522,"o":"m 222 825 l 222 0 l 72 0 l 72 967 l 490 967 l 490 825 l 222 825 "},"6":{"x_min":75,"x_max":498,"ha":563,"o":"m 286 550 q 348 567 311 567 q 457 522 416 567 q 498 382 498 478 l 498 212 q 484 125 498 165 q 445 55 471 85 q 378 8 418 25 q 283 -8 337 -8 q 131 46 187 -8 q 75 192 75 100 l 75 315 q 81 417 75 372 q 102 503 87 462 l 280 967 l 438 967 l 281 555 l 286 550 m 349 387 q 330 430 349 415 q 286 445 312 445 q 238 424 254 445 q 222 375 222 403 l 222 189 q 240 146 222 161 q 284 132 258 132 q 330 146 312 132 q 349 189 349 161 l 349 387 "},"Ь":{"x_min":71,"x_max":541,"ha":572,"o":"m 71 0 l 71 967 l 220 967 l 220 595 l 283 595 q 407 574 358 595 q 486 517 456 554 q 528 425 516 479 q 541 303 541 371 q 478 75 541 151 q 285 0 416 0 l 71 0 m 220 142 l 276 142 q 371 186 345 142 q 397 300 397 230 q 370 416 397 379 q 273 453 343 453 l 220 453 l 220 142 "},"n":{"x_min":53,"x_max":486,"ha":542,"o":"m 203 625 l 208 625 q 263 674 229 654 q 337 695 298 695 q 407 681 378 695 q 453 644 435 668 q 478 587 470 619 q 486 518 486 556 l 486 0 l 336 0 l 336 475 q 273 549 336 549 q 222 527 241 549 q 203 468 203 505 l 203 0 l 53 0 l 53 686 l 203 686 l 203 625 "},"¤":{"x_min":51,"x_max":625.609375,"ha":699,"o":"m 134 579 q 94 620 114 599 q 53 659 73 640 q 141 747 96 703 l 221 666 q 340 700 276 700 q 457 668 400 700 l 537 751 q 581 707 563 727 q 625 663 600 687 l 543 583 q 577 465 577 526 q 542 347 577 405 l 624 266 l 536 178 l 456 259 q 337 226 398 226 q 218 259 273 226 l 137 178 l 51 265 l 133 345 q 101 461 101 402 q 134 579 101 522 m 337 590 q 247 551 283 590 q 211 459 211 513 q 221 412 211 434 q 248 373 231 389 q 287 346 265 356 q 334 337 309 337 q 384 347 361 337 q 425 375 408 357 q 453 416 443 392 q 464 466 464 439 q 426 554 464 519 q 337 590 388 590 "},"p":{"x_min":47,"x_max":486,"ha":532,"o":"m 316 696 q 370 688 343 696 q 420 661 398 680 q 458 607 442 641 q 480 518 474 572 q 484 441 483 487 q 486 348 486 396 q 482 224 486 287 q 469 121 479 161 q 453 73 463 96 q 424 32 442 50 q 378 3 406 14 q 312 -8 351 -8 q 253 2 283 -8 q 201 39 223 12 l 197 39 l 197 -265 l 47 -265 l 47 688 l 194 688 l 194 636 l 198 633 q 247 682 217 668 q 316 696 277 696 m 262 550 q 212 527 229 550 q 196 468 196 504 l 196 249 q 196 206 196 226 q 203 174 197 186 q 262 136 218 136 q 315 167 300 136 q 328 237 325 190 q 332 351 332 284 q 329 456 332 413 q 316 518 326 499 q 262 550 305 550 "},"⁴":{"x_min":20.640625,"x_max":345.890625,"ha":367,"o":"m 307 596 l 307 514 l 204 514 l 204 596 l 20 596 l 20 681 l 147 1092 l 251 1092 l 128 689 l 204 689 l 204 826 l 307 826 l 307 689 l 345 689 l 345 596 l 307 596 "},"Ю":{"x_min":72,"x_max":751,"ha":815,"o":"m 751 247 q 696 56 751 121 q 526 -8 642 -8 q 357 53 410 -8 q 304 231 304 115 l 304 422 l 222 422 l 222 0 l 72 0 l 72 967 l 222 967 l 222 562 l 304 562 l 304 716 q 316 821 304 773 q 355 902 328 868 q 424 955 381 936 q 526 974 466 974 q 633 956 589 974 q 702 905 676 939 q 739 825 728 872 q 751 718 751 778 l 751 247 m 607 729 q 603 767 607 749 q 590 801 600 786 q 565 824 580 815 q 526 834 549 834 q 485 822 501 834 q 461 792 470 810 q 449 754 452 775 q 447 714 447 732 l 447 229 q 464 161 447 191 q 526 132 481 132 q 588 163 570 132 q 607 239 607 194 l 607 729 "},"S":{"x_min":49,"x_max":527,"ha":571,"o":"m 527 275 q 515 157 527 209 q 475 69 503 105 q 401 12 447 32 q 286 -8 354 -8 q 178 10 224 -8 q 104 60 133 28 q 62 135 75 92 q 49 227 49 178 l 198 256 q 218 168 200 202 q 289 134 236 134 q 337 145 319 134 q 364 177 355 157 q 375 221 373 196 q 378 274 378 246 q 373 332 378 308 q 357 372 369 356 q 324 401 346 389 q 268 429 303 414 q 156 489 198 458 q 92 553 114 519 q 62 625 69 587 q 56 709 56 664 q 69 816 56 768 q 112 900 83 865 q 187 955 142 936 q 294 975 232 975 q 407 953 363 975 q 478 898 451 931 q 515 825 504 865 q 527 747 527 784 l 378 712 q 360 798 378 765 q 289 832 342 832 q 245 820 261 832 q 220 791 229 809 q 207 752 210 773 q 205 711 205 732 q 207 667 205 686 q 223 632 210 648 q 263 598 236 615 q 335 564 289 582 q 437 510 399 539 q 495 448 475 482 q 520 371 514 414 q 527 275 527 329 "},"/":{"x_min":4.171875,"x_max":375.03125,"ha":379,"o":"m 116 -58 l 4 -58 l 262 1007 l 375 1007 l 116 -58 "},"ђ":{"x_min":-0.109375,"x_max":503,"ha":557,"o":"m 351 685 q 439 659 403 685 q 489 582 475 634 q 496 534 493 564 q 500 468 498 504 q 502 395 501 433 q 503 326 503 358 l 503 272 q 500 161 503 216 q 486 74 497 106 q 424 -14 468 16 q 309 -49 380 -46 l 280 -49 l 275 70 q 312 78 298 72 q 332 92 325 84 q 341 108 339 99 q 344 124 344 117 q 347 177 345 138 q 350 259 350 215 q 349 388 350 328 q 344 488 348 449 q 328 523 341 513 q 298 534 314 534 q 233 507 255 534 q 211 432 211 481 l 211 0 l 61 0 l 61 786 l 0 786 l 0 882 l 61 882 l 61 1008 l 211 1008 l 211 882 l 388 882 l 388 786 l 211 786 l 211 615 q 214 615 214 615 q 217 614 215 614 q 272 663 234 642 q 351 685 310 685 "},"y":{"x_min":5.5625,"x_max":493.09375,"ha":499,"o":"m 251 231 l 288 431 l 338 686 l 493 686 l 294 -105 q 232 -224 275 -181 q 109 -268 190 -268 l 56 -268 l 56 -136 l 87 -136 q 137 -115 118 -136 q 170 -37 156 -95 l 180 5 l 5 686 l 165 686 l 208 431 l 245 231 l 251 231 "},"g":{"x_min":45.0625,"x_max":486,"ha":544,"o":"m 332 58 q 275 11 312 26 q 211 -3 237 -3 q 143 7 170 -3 q 99 35 116 17 q 72 78 82 54 q 57 131 62 102 q 48 200 50 159 q 45 284 46 241 l 45 344 q 47 437 45 393 q 52 518 49 482 q 108 654 63 614 q 216 695 154 695 q 285 681 256 695 q 333 634 313 667 q 335 634 334 634 q 337 635 335 635 l 337 686 l 486 686 l 486 -38 q 436 -210 486 -145 q 269 -275 387 -275 q 118 -226 172 -275 q 60 -86 64 -177 q 133 -74 96 -80 q 207 -62 170 -69 q 272 -136 209 -136 q 320 -112 305 -136 q 336 -57 336 -88 l 336 58 l 332 58 m 269 551 q 234 542 247 552 q 215 517 222 532 q 202 456 205 499 q 200 350 200 414 q 202 243 200 287 q 213 174 204 198 q 269 140 229 140 q 321 167 305 140 q 337 229 338 195 l 337 368 q 337 420 337 394 q 336 468 337 445 q 320 527 336 503 q 269 551 304 551 "},"²":{"x_min":31,"x_max":331,"ha":367,"o":"m 39 514 l 39 600 l 197 873 q 213 913 208 893 q 218 956 218 934 q 211 986 218 972 q 181 1000 204 1000 q 150 980 161 1000 q 139 916 139 961 l 31 931 q 72 1055 32 1012 q 183 1099 112 1099 q 295 1061 260 1099 q 331 958 331 1023 q 321 893 331 925 q 290 825 311 861 q 265 780 282 809 q 231 719 249 751 q 196 658 212 687 q 171 614 179 629 l 323 614 l 323 514 l 39 514 "},"ë":{"x_min":46,"x_max":475,"ha":522,"o":"m 195 308 q 195 233 195 269 q 201 178 196 197 q 262 131 215 131 q 325 210 318 131 l 475 186 q 415 43 469 94 q 261 -8 361 -8 q 177 3 212 -8 q 118 35 143 15 q 80 79 94 54 q 59 129 66 104 q 52 171 55 146 q 48 224 50 196 q 46 282 47 252 q 46 338 46 312 q 50 472 46 405 q 69 574 55 538 q 137 663 89 630 q 266 697 186 697 q 422 640 369 697 q 475 478 475 583 l 475 308 l 195 308 m 207 514 q 199 475 201 502 q 196 411 197 448 l 324 411 l 324 469 q 312 528 324 502 q 262 555 300 555 q 207 514 222 555 m 308 789 l 308 935 l 439 935 l 439 789 l 308 789 m 81 789 l 81 935 l 212 935 l 212 789 l 81 789 "},"б":{"x_min":46,"x_max":482,"ha":528,"o":"m 290 659 q 406 624 366 659 q 462 542 445 589 q 472 498 469 524 q 478 442 476 472 q 481 381 480 412 q 482 319 482 350 l 482 307 q 481 240 482 268 q 476 174 480 212 q 447 81 469 117 q 394 25 426 45 q 326 -2 363 5 q 251 -10 288 -10 q 174 1 206 -10 q 118 32 141 13 q 79 76 94 51 q 58 127 65 101 q 48 217 50 162 q 46 324 46 272 l 46 443 q 54 633 46 554 q 82 767 62 712 q 132 857 101 822 q 211 914 164 891 q 261 936 240 928 q 304 953 283 944 q 350 971 325 961 q 412 999 375 982 l 462 892 q 410 865 433 875 q 366 845 387 854 q 323 826 344 836 q 275 803 301 817 q 211 733 230 779 q 189 615 191 686 l 190 615 q 243 649 214 640 q 290 659 272 659 m 267 521 q 217 493 237 521 q 207 475 211 486 q 201 449 203 465 q 197 408 199 433 q 195 347 196 383 l 195 306 q 195 229 195 265 q 203 174 196 194 q 267 129 215 129 q 305 144 287 129 q 328 181 322 159 q 334 236 333 202 q 336 315 336 270 l 336 347 q 334 420 336 388 q 328 470 333 451 q 306 507 321 494 q 267 521 291 521 "},"⁽":{"x_min":36,"x_max":229.0625,"ha":229,"o":"m 36 769 q 72 956 36 871 q 162 1113 109 1042 l 229 1085 q 161 931 186 1014 q 136 772 136 848 q 161 606 136 689 q 226 456 186 523 l 165 418 q 73 579 111 493 q 36 769 36 666 "},"у":{"x_min":5.5625,"x_max":493.09375,"ha":499,"o":"m 251 231 l 288 431 l 338 686 l 493 686 l 294 -105 q 232 -224 275 -181 q 109 -268 190 -268 l 56 -268 l 56 -136 l 87 -136 q 137 -115 118 -136 q 170 -37 156 -95 l 180 5 l 5 686 l 165 686 l 208 431 l 245 231 l 251 231 "},"J":{"x_min":-7.125,"x_max":429,"ha":510,"o":"m 429 967 l 429 240 q 369 56 429 121 q 194 -8 309 -8 q 79 19 131 -8 q -7 101 27 46 l 103 187 q 144 147 119 163 q 192 132 170 132 q 258 163 238 132 q 279 234 279 194 l 279 967 l 429 967 "},"Ã":{"x_min":15.28125,"x_max":572.265625,"ha":586,"o":"m 419 0 l 381 202 l 204 202 q 185 101 194 151 q 168 0 176 50 l 15 0 q 112 483 63 243 q 209 967 161 723 l 376 967 l 572 0 l 419 0 m 440 1196 q 475 1174 458 1184 q 512 1152 493 1164 q 447 1060 481 1088 q 376 1032 412 1032 q 332 1039 352 1032 q 293 1057 312 1047 q 257 1074 275 1066 q 223 1082 240 1082 q 187 1069 206 1082 q 147 1029 168 1057 l 73 1075 q 137 1161 98 1130 q 215 1193 176 1193 q 255 1185 236 1193 q 293 1168 275 1177 q 329 1150 312 1158 q 363 1143 347 1143 q 400 1154 383 1143 q 440 1196 416 1165 m 288 743 q 259 544 275 643 q 226 342 244 444 l 358 342 l 295 743 l 288 743 "},"Ј":{"x_min":-28.140625,"x_max":408,"ha":489,"o":"m 408 967 l 408 240 q 348 56 408 121 q 173 -8 288 -8 q 58 19 110 -8 q -28 101 6 46 l 82 187 q 123 147 98 163 q 171 132 149 132 q 237 163 217 132 q 258 234 258 194 l 258 967 l 408 967 "},"©":{"x_min":60,"x_max":904,"ha":976,"o":"m 484 758 q 597 716 551 758 q 643 608 643 675 l 550 584 q 531 642 548 620 q 484 664 515 664 q 437 645 452 664 q 422 604 422 627 l 422 320 q 439 280 422 297 q 483 264 456 264 q 547 343 542 264 l 643 323 q 597 209 640 248 q 484 170 555 170 q 371 209 417 170 q 326 328 326 249 l 326 601 q 370 717 326 676 q 484 758 414 758 m 482 -11 q 299 25 377 -11 q 167 127 221 62 q 87 281 114 193 q 60 473 60 369 q 87 668 60 579 q 167 822 114 756 q 300 924 221 887 q 482 961 379 961 q 661 924 583 961 q 794 822 740 887 q 876 668 848 756 q 904 473 904 579 q 876 281 904 369 q 794 127 848 193 q 661 25 740 62 q 482 -11 583 -11 m 482 872 q 339 840 400 872 q 238 755 278 809 q 178 628 197 701 q 159 473 159 555 q 180 319 159 391 q 242 194 201 248 q 344 110 283 141 q 482 79 404 79 q 623 110 562 79 q 724 194 684 141 q 784 319 764 248 q 805 473 805 391 q 784 628 805 555 q 722 755 763 701 q 621 840 681 809 q 482 872 561 872 "},"ґ":{"x_min":60,"x_max":447,"ha":471,"o":"m 210 0 l 60 0 l 60 686 l 325 686 l 325 846 l 447 846 l 447 553 l 210 553 l 210 0 "},"D":{"x_min":72,"x_max":534,"ha":603,"o":"m 383 712 q 362 795 383 765 q 285 825 342 825 l 222 825 l 222 142 l 285 142 q 362 171 341 142 q 383 255 383 200 l 383 712 m 312 967 q 447 937 398 967 q 517 836 497 907 q 533 695 532 785 q 534 484 534 605 q 532 279 534 365 q 514 143 531 193 q 430 30 488 61 q 299 0 373 0 l 72 0 l 72 967 l 312 967 "},"ÿ":{"x_min":5.609375,"x_max":492.625,"ha":499,"o":"m 251 231 l 289 431 l 338 686 l 492 686 l 294 -105 q 232 -224 274 -181 q 109 -268 190 -268 l 57 -268 l 57 -136 l 87 -136 q 137 -115 118 -136 q 170 -37 157 -95 l 180 5 l 5 686 l 165 686 l 208 431 l 245 231 l 251 231 m 293 789 l 293 935 l 424 935 l 424 789 l 293 789 m 65 789 l 65 935 l 196 935 l 196 789 l 65 789 "},"ц":{"x_min":61,"x_max":555,"ha":572,"o":"m 494 688 l 494 138 l 555 137 l 555 -160 l 429 -160 l 429 0 l 61 0 l 61 688 l 212 688 l 212 138 l 343 138 l 343 688 l 494 688 "},"Л":{"x_min":6.53125,"x_max":555,"ha":630,"o":"m 555 967 l 555 0 l 406 0 l 406 825 l 259 825 l 259 452 q 250 256 259 336 q 220 123 242 177 q 160 35 198 69 q 63 -25 123 1 l 6 86 q 65 131 42 106 q 102 193 88 157 q 121 281 116 229 q 126 411 126 333 l 126 967 l 555 967 "},"$":{"x_min":42.984375,"x_max":521,"ha":563,"o":"m 521 275 q 510 163 521 214 q 475 75 500 112 q 409 17 450 39 q 310 -6 369 -3 l 310 -122 l 259 -122 l 259 -6 q 160 15 201 -3 q 93 66 119 34 q 55 138 67 97 q 42 226 42 179 l 193 255 q 208 177 194 211 q 259 136 222 144 l 259 432 q 149 491 190 461 q 86 554 108 520 q 56 625 63 587 q 50 709 50 663 q 100 890 50 818 q 259 973 150 962 l 259 1075 l 310 1075 l 310 975 q 412 950 371 972 q 477 894 452 927 q 511 822 501 861 q 521 747 521 783 l 374 712 q 360 790 374 758 q 310 829 346 822 l 310 572 q 419 512 378 541 q 484 449 461 483 q 514 373 507 415 q 521 275 521 330 m 374 273 q 361 356 374 329 q 310 407 348 383 l 310 136 q 344 153 332 140 q 363 185 357 166 q 371 226 369 204 q 374 273 374 248 m 199 711 q 208 649 199 675 q 259 598 217 623 l 258 827 q 210 781 221 816 q 199 711 199 745 "},"w":{"x_min":13.890625,"x_max":770.890625,"ha":786,"o":"m 388 390 l 352 181 l 316 0 l 155 0 l 13 686 l 172 686 l 208 440 l 241 219 l 247 219 l 280 441 l 319 686 l 466 686 l 505 442 l 544 218 l 550 218 l 580 442 l 615 686 l 770 686 l 629 0 l 466 0 l 431 177 l 394 390 l 388 390 "},"\\":{"x_min":6.9375,"x_max":336.140625,"ha":347,"o":"m 6 992 l 119 992 l 336 -35 l 225 -35 l 6 992 "},"о":{"x_min":46,"x_max":485,"ha":531,"o":"m 269 697 q 363 682 325 697 q 426 642 401 667 q 463 584 451 617 q 478 512 475 551 q 484 423 483 471 q 485 334 485 374 l 485 298 q 482 234 485 266 q 478 171 480 202 q 448 78 471 115 q 394 23 425 42 q 326 -3 362 3 q 255 -10 290 -10 q 171 3 207 -10 q 112 38 136 16 q 74 89 87 60 q 56 149 61 117 q 51 190 53 167 q 47 238 48 213 q 46 289 46 263 q 46 337 46 315 q 47 406 46 370 q 51 473 48 441 q 58 533 54 505 q 69 577 62 560 q 139 663 89 630 q 269 697 189 697 m 268 557 q 218 532 235 557 q 204 496 208 516 q 197 452 199 477 q 195 396 195 427 q 195 324 195 364 l 195 313 q 195 241 195 275 q 202 185 196 206 q 224 145 208 161 q 268 130 239 130 q 306 143 290 130 q 328 175 322 156 q 331 197 329 181 q 335 236 333 213 q 337 285 336 259 q 338 338 338 311 q 336 432 338 386 q 330 502 335 478 q 320 527 327 517 q 268 557 304 557 "},"Д":{"x_min":11,"x_max":647,"ha":673,"o":"m 137 0 l 137 -183 l 11 -183 l 11 125 l 67 137 q 120 234 106 179 q 137 379 134 289 l 153 967 l 586 967 l 586 136 l 647 136 l 647 -183 l 521 -183 l 521 0 l 137 0 m 271 380 q 260 236 268 297 q 228 136 252 176 l 437 136 l 437 828 l 282 828 l 271 380 "},"Ì":{"x_min":-84.734375,"x_max":226,"ha":301,"o":"m 75 0 l 75 967 l 226 967 l 226 0 l 75 0 m 163 997 l -84 1134 l 4 1239 l 218 1070 l 163 997 "},"Ç":{"x_min":64,"x_max":528,"ha":564,"o":"m 298 975 q 401 958 358 975 q 473 911 444 941 q 514 840 501 881 q 528 751 528 799 l 382 713 q 361 799 382 766 q 297 833 341 833 q 254 821 271 833 q 228 793 237 810 q 216 755 219 776 q 213 717 213 735 l 213 227 q 215 197 213 214 q 227 166 218 180 q 252 141 236 151 q 293 132 268 132 q 378 251 376 132 q 453 239 415 244 q 528 229 490 234 q 475 65 525 127 q 329 -6 426 3 l 312 -62 q 369 -78 347 -66 q 405 -106 391 -89 q 423 -141 418 -123 q 428 -175 428 -160 q 421 -210 428 -191 q 400 -246 415 -230 q 362 -275 386 -263 q 303 -287 337 -287 q 253 -283 292 -287 q 176 -260 215 -280 l 200 -198 q 246 -214 228 -211 q 282 -218 265 -218 q 316 -205 301 -218 q 331 -173 331 -193 q 268 -127 331 -126 l 233 -101 l 261 -6 q 112 61 161 1 q 64 229 64 120 l 64 711 q 75 813 64 765 q 115 897 87 861 q 188 954 143 933 q 298 975 233 975 "},"ъ":{"x_min":15,"x_max":624,"ha":648,"o":"m 188 0 l 188 553 l 15 553 l 15 688 l 341 688 l 341 435 l 385 435 q 499 419 453 435 q 573 375 545 404 q 612 307 601 347 q 624 220 624 268 q 566 55 624 111 q 387 0 509 0 l 188 0 m 381 135 q 456 160 437 135 q 475 219 475 186 q 454 277 475 255 q 380 300 433 300 l 341 300 l 341 135 l 381 135 "},"₋":{"x_min":37,"x_max":301,"ha":330,"o":"m 37 60 l 37 152 l 301 152 l 301 60 l 37 60 "},"C":{"x_min":64,"x_max":528,"ha":564,"o":"m 298 975 q 401 958 358 975 q 473 911 444 941 q 514 840 501 881 q 528 751 528 799 l 382 713 q 361 799 382 766 q 297 833 341 833 q 254 821 271 833 q 228 793 237 810 q 216 755 219 776 q 213 717 213 735 l 213 227 q 215 197 213 213 q 227 166 218 180 q 252 141 236 151 q 293 132 268 132 q 378 251 376 132 q 453 239 415 244 q 528 229 490 234 q 467 55 525 119 q 297 -8 409 -8 q 120 52 177 -8 q 64 229 64 112 l 64 711 q 75 813 64 765 q 115 897 87 861 q 188 954 143 933 q 298 975 233 975 "},"!":{"x_min":100,"x_max":248,"ha":350,"o":"m 237 264 l 113 264 l 100 967 l 248 967 l 237 264 m 103 0 l 103 151 l 247 151 l 247 0 l 103 0 "},"ç":{"x_min":46,"x_max":471,"ha":498,"o":"m 471 195 q 423 53 469 105 q 290 -6 377 1 l 273 -62 q 330 -78 308 -66 q 366 -106 352 -89 q 384 -142 379 -123 q 389 -176 389 -160 q 382 -210 389 -191 q 361 -246 376 -230 q 323 -275 347 -263 q 264 -287 298 -287 q 214 -283 253 -287 q 137 -260 176 -280 l 161 -198 q 207 -214 189 -211 q 243 -218 226 -218 q 277 -205 262 -218 q 292 -173 292 -193 q 229 -127 292 -126 l 194 -101 l 222 -5 q 109 40 147 1 q 58 129 71 80 q 51 170 54 145 q 48 224 48 195 q 46 282 47 252 q 46 337 46 312 q 47 406 46 370 q 51 473 48 441 q 58 533 54 505 q 69 577 62 560 q 138 663 90 630 q 267 697 186 697 q 420 640 371 697 q 470 483 470 583 q 395 474 433 478 q 321 464 357 470 q 305 535 321 513 q 262 558 289 558 q 206 516 221 558 q 198 460 201 502 q 195 363 195 419 l 195 313 q 195 235 195 273 q 203 177 196 197 q 224 142 210 155 q 262 129 237 129 q 321 218 321 129 q 396 206 358 211 q 471 195 433 202 "},"È":{"x_min":70.84375,"x_max":501.1875,"ha":528,"o":"m 72 0 l 72 967 l 501 967 l 501 825 l 222 825 l 222 563 l 465 563 l 465 420 l 222 420 l 222 142 l 501 142 l 501 0 l 72 0 m 319 997 l 70 1134 l 159 1239 l 373 1070 l 319 997 "},"Й":{"x_min":67,"x_max":565,"ha":632,"o":"m 414 605 l 211 0 l 67 0 l 67 967 l 213 967 l 213 354 l 218 354 l 419 967 l 565 967 l 565 0 l 418 0 l 418 605 l 414 605 m 233 1186 q 242 1154 234 1170 q 261 1124 249 1138 q 288 1102 273 1111 q 323 1093 304 1093 q 360 1102 344 1093 q 387 1124 376 1111 q 404 1154 398 1138 q 411 1186 411 1170 l 520 1186 q 505 1122 517 1156 q 468 1060 492 1088 q 408 1012 444 1031 q 323 994 373 994 q 231 1012 269 994 q 170 1060 194 1031 q 135 1122 147 1088 q 123 1186 124 1156 l 233 1186 "},"X":{"x_min":8.328125,"x_max":565.328125,"ha":575,"o":"m 397 0 l 287 332 l 284 332 l 175 0 l 8 0 l 204 505 q 113 735 158 621 q 22 967 68 850 l 190 967 q 237 821 213 893 q 284 676 261 750 l 290 678 l 381 967 l 551 967 l 363 505 q 464 252 413 377 q 565 0 515 126 l 397 0 "},"ô":{"x_min":42,"x_max":488,"ha":531,"o":"m 269 697 q 363 682 325 697 q 426 642 401 667 q 463 584 451 617 q 478 512 475 551 q 484 423 483 471 q 485 334 485 374 l 485 298 q 482 234 485 266 q 478 171 480 202 q 448 78 471 115 q 394 23 425 42 q 326 -3 362 3 q 255 -10 290 -10 q 171 3 207 -10 q 112 38 136 16 q 74 89 87 60 q 56 149 61 117 q 51 190 53 167 q 47 238 48 213 q 46 289 46 263 q 46 337 46 315 q 47 406 46 370 q 51 473 48 441 q 58 533 54 505 q 69 577 62 560 q 139 663 89 630 q 269 697 189 697 m 268 557 q 218 532 235 557 q 204 496 208 516 q 197 452 199 477 q 195 396 195 427 q 195 324 195 364 l 195 313 q 195 241 195 275 q 202 185 196 206 q 224 145 208 161 q 268 130 239 130 q 306 143 290 130 q 328 175 322 156 q 331 197 329 181 q 335 236 333 213 q 337 285 336 259 q 338 338 338 311 q 336 432 338 386 q 330 502 335 478 q 320 527 327 517 q 268 557 304 557 m 265 870 l 101 740 l 42 793 l 225 1000 l 312 1000 l 488 794 l 428 740 l 265 870 "},"Б":{"x_min":71,"x_max":541,"ha":572,"o":"m 220 141 l 276 141 q 296 146 287 141 q 376 193 356 151 q 397 300 397 236 q 370 416 397 379 q 273 453 343 453 l 220 453 l 220 141 m 220 595 l 283 595 q 407 574 358 595 q 486 517 456 554 q 528 425 516 479 q 541 303 541 371 q 478 75 541 151 q 285 0 416 0 l 71 0 l 71 967 l 493 967 l 493 825 l 220 825 l 220 595 "},"г":{"x_min":60,"x_max":447.140625,"ha":471,"o":"m 211 553 l 211 0 l 60 0 l 60 688 l 447 688 l 447 553 l 211 553 "},"х":{"x_min":6.9375,"x_max":504.203125,"ha":513,"o":"m 338 0 l 258 215 l 254 215 l 170 0 l 6 0 q 89 174 47 87 q 172 349 131 262 l 13 686 l 181 686 l 256 483 l 259 483 q 296 585 279 534 q 333 686 313 636 l 498 686 l 340 349 q 422 174 381 262 q 504 0 463 87 l 338 0 "},"}":{"x_min":22,"x_max":321.734375,"ha":340,"o":"m 188 420 q 131 476 158 434 q 104 591 104 518 l 104 772 q 89 838 104 812 q 51 863 74 863 l 22 863 l 22 968 l 101 968 q 198 924 159 968 q 237 808 237 881 l 237 612 q 257 507 237 547 q 321 462 277 468 l 321 370 q 257 327 277 365 q 237 220 237 288 l 237 16 q 198 -99 237 -56 q 101 -143 159 -143 l 22 -143 l 22 -38 l 51 -38 q 89 -15 74 -38 q 104 48 104 6 l 104 243 q 131 360 104 318 q 188 413 159 402 l 188 420 "},"â":{"x_min":39,"x_max":500.015625,"ha":535,"o":"m 327 54 q 271 7 304 22 q 200 -8 237 -8 q 123 8 154 -8 q 73 53 91 25 q 46 119 54 82 q 39 200 39 157 q 49 279 39 240 q 83 348 59 318 q 146 397 107 378 q 243 416 185 416 l 331 416 l 331 490 q 316 538 331 521 q 261 556 301 556 q 219 542 240 556 q 192 492 198 528 l 55 533 q 128 653 73 610 q 271 696 183 696 q 428 648 375 696 q 482 490 482 601 l 482 0 l 331 0 l 331 52 l 327 54 m 331 303 l 271 303 q 212 282 238 303 q 186 208 186 261 q 204 153 186 172 q 255 134 223 134 q 311 156 291 134 q 331 218 331 179 l 331 303 m 277 870 l 113 740 l 54 793 l 237 1000 l 325 1000 l 500 794 l 440 740 l 277 870 "},"ø":{"x_min":46,"x_max":485,"ha":531,"o":"m 269 697 q 390 670 341 697 l 419 732 l 462 709 l 429 640 q 464 582 453 615 q 478 512 475 549 q 484 423 483 472 q 485 334 485 374 l 485 298 q 482 234 485 266 q 478 172 480 202 q 448 78 471 115 q 394 23 425 42 q 326 -3 362 3 q 255 -10 290 -10 q 129 23 178 -10 l 104 -28 l 65 -6 l 94 56 q 69 100 79 75 q 56 149 60 124 q 51 190 53 167 q 47 238 48 213 q 46 289 46 263 q 46 337 46 314 q 47 405 46 370 q 51 473 48 441 q 58 533 54 505 q 69 577 62 560 q 139 663 89 630 q 269 697 189 697 m 205 175 q 226 143 211 156 q 268 130 240 130 q 306 143 290 130 q 328 175 322 156 q 331 197 329 181 q 335 236 333 213 q 337 285 336 259 q 338 338 338 312 q 338 395 338 366 q 335 447 338 423 l 205 175 m 268 558 q 218 533 235 558 q 204 497 208 516 q 197 452 199 477 q 195 396 195 427 q 195 324 195 365 l 195 313 l 195 262 q 258 393 226 329 q 321 524 289 458 q 320 527 320 526 q 268 558 304 558 "},"Ä":{"x_min":15.28125,"x_max":572.265625,"ha":587,"o":"m 419 0 l 381 202 l 204 202 q 185 101 194 151 q 168 0 176 50 l 15 0 q 112 483 63 243 q 209 967 161 723 l 376 967 l 572 0 l 419 0 m 288 743 q 259 544 275 643 q 226 342 244 444 l 358 342 l 295 743 l 288 743 m 342 1028 l 342 1175 l 473 1175 l 473 1028 l 342 1028 m 114 1028 l 114 1175 l 245 1175 l 245 1028 l 114 1028 "},"Ч":{"x_min":56,"x_max":524,"ha":596,"o":"m 205 967 l 205 613 q 228 531 205 552 q 296 511 252 511 q 333 515 313 511 q 374 527 354 519 l 374 967 l 524 967 l 524 0 l 374 0 l 374 394 q 317 382 346 385 q 264 379 289 379 q 177 390 215 379 q 112 426 139 401 q 70 493 85 452 q 56 594 56 534 l 56 967 l 205 967 "},"N":{"x_min":68,"x_max":579,"ha":647,"o":"m 217 562 l 217 0 l 68 0 l 68 967 l 202 967 l 319 679 q 347 608 333 643 q 376 537 361 573 l 425 404 q 428 405 427 404 q 432 405 429 405 l 432 967 l 579 967 l 579 0 l 447 0 l 331 286 q 276 425 303 356 q 223 562 249 493 l 217 562 "},"2":{"x_min":64,"x_max":499.125,"ha":563,"o":"m 281 833 q 230 802 249 831 q 211 698 211 773 l 64 714 q 123 906 64 838 q 283 975 183 975 q 448 913 398 975 q 499 747 499 851 q 485 633 500 683 q 441 526 470 583 l 245 142 l 489 142 l 489 0 l 72 0 l 72 130 q 195 365 134 248 q 316 601 255 483 q 341 672 336 637 q 346 746 346 708 q 343 774 346 759 q 334 802 341 789 q 315 823 327 814 q 281 833 302 833 "},"ü":{"x_min":54,"x_max":488,"ha":544,"o":"m 338 61 q 335 61 336 61 q 331 62 334 62 q 276 12 311 31 q 202 -7 241 -7 q 131 6 159 -7 q 85 43 102 19 q 60 99 67 66 q 54 169 54 132 l 54 688 l 205 688 l 205 211 q 221 153 205 170 q 267 136 237 136 q 317 157 295 136 q 339 216 339 179 l 339 688 l 488 688 l 488 0 l 338 0 l 338 61 m 318 789 l 318 935 l 449 935 l 449 789 l 318 789 m 90 789 l 90 935 l 220 935 l 220 789 l 90 789 "},"М":{"x_min":68,"x_max":728,"ha":796,"o":"m 352 211 l 283 390 l 224 559 l 217 559 l 217 0 l 68 0 l 68 967 l 213 967 l 318 691 l 394 482 l 401 482 l 479 697 l 584 967 l 728 967 l 728 0 l 578 0 l 578 557 l 572 557 l 511 384 l 443 211 l 352 211 "},"ь":{"x_min":58,"x_max":494,"ha":513,"o":"m 252 135 q 325 160 307 135 q 344 219 344 186 q 323 277 344 255 q 249 300 302 300 l 211 300 l 211 135 l 252 135 m 58 0 l 58 688 l 211 688 l 211 435 l 256 435 q 370 419 324 435 q 444 375 416 404 q 482 307 471 347 q 494 220 494 268 q 257 0 494 0 l 58 0 "},"Ó":{"x_min":64,"x_max":533,"ha":597,"o":"m 382 730 q 364 803 382 771 q 298 835 347 835 q 255 823 272 835 q 229 794 238 811 q 217 755 220 776 q 214 715 214 733 l 214 229 q 232 161 214 191 q 297 132 251 132 q 362 163 343 132 q 382 238 382 194 l 382 730 m 533 247 q 476 56 533 121 q 297 -8 419 -8 q 119 53 175 -8 q 64 232 64 115 l 64 718 q 77 822 64 775 q 118 903 90 869 q 190 956 145 937 q 298 975 236 975 q 410 957 365 975 q 482 906 455 940 q 521 826 509 873 q 533 719 533 779 l 533 247 m 208 1069 l 421 1238 l 510 1133 l 262 997 l 208 1069 "},"Ў":{"x_min":8.328125,"x_max":536.15625,"ha":540,"o":"m 280 464 l 395 967 l 536 967 l 341 219 q 297 94 322 140 q 246 24 273 48 q 188 -5 219 1 q 125 -14 158 -12 l 70 -14 l 70 107 l 105 107 q 161 129 140 107 q 198 201 183 152 q 201 209 200 202 q 204 224 202 216 q 209 238 206 231 q 212 248 211 245 l 8 965 l 154 965 l 273 464 l 280 464 m 186 1175 q 195 1143 187 1159 q 214 1113 202 1127 q 241 1091 226 1100 q 276 1082 256 1082 q 313 1091 297 1082 q 340 1113 329 1100 q 357 1143 351 1127 q 363 1175 363 1159 l 473 1175 q 458 1111 470 1145 q 421 1049 445 1077 q 361 1001 397 1020 q 276 983 326 983 q 184 1001 222 983 q 123 1049 147 1020 q 88 1111 100 1077 q 76 1175 77 1145 l 186 1175 "},"в":{"x_min":60,"x_max":494,"ha":545,"o":"m 60 0 l 60 686 l 256 686 q 430 636 374 686 q 487 494 487 587 q 469 419 487 453 q 416 362 452 385 l 417 361 q 478 301 462 342 q 494 212 494 261 q 434 51 494 102 q 252 0 374 0 l 60 0 m 350 225 q 330 282 350 261 q 262 303 311 303 l 211 303 l 211 135 l 262 135 q 308 141 291 135 q 334 161 324 148 q 347 189 344 173 q 350 225 350 205 m 340 486 q 322 535 340 519 q 262 555 305 552 l 211 555 l 211 416 l 251 416 q 319 434 299 416 q 340 486 340 453 "},"С":{"x_min":64,"x_max":528,"ha":564,"o":"m 298 975 q 401 958 358 975 q 473 911 444 941 q 514 840 501 881 q 528 751 528 799 l 382 713 q 361 799 382 766 q 297 833 341 833 q 254 821 271 833 q 228 793 237 810 q 216 755 219 776 q 213 717 213 735 l 213 227 q 215 197 213 213 q 227 166 218 180 q 252 141 236 151 q 293 132 268 132 q 378 251 376 132 q 453 239 415 244 q 528 229 490 234 q 467 55 525 119 q 297 -8 409 -8 q 120 52 177 -8 q 64 229 64 112 l 64 711 q 75 813 64 765 q 115 897 87 861 q 188 954 143 933 q 298 975 233 975 "},"ß":{"x_min":60,"x_max":500.890625,"ha":558,"o":"m 416 594 q 480 535 460 574 q 500 451 500 497 l 500 236 q 496 153 500 196 q 475 73 492 110 q 428 14 459 37 q 342 -8 396 -8 q 279 -4 312 -8 l 279 118 q 349 191 349 118 l 349 458 q 335 492 349 480 q 306 504 322 504 l 295 504 l 295 637 l 301 637 q 331 652 321 637 q 341 704 341 666 l 341 797 q 323 848 341 829 q 276 867 306 867 q 227 848 245 867 q 210 801 210 829 l 210 0 l 60 0 l 60 797 q 116 951 60 893 q 274 1009 172 1009 q 430 956 374 1009 q 487 804 487 904 l 487 738 q 471 656 487 693 q 416 600 456 619 l 416 594 "},"њ":{"x_min":62,"x_max":775,"ha":801,"o":"m 533 135 q 607 160 588 135 q 626 219 626 186 q 605 274 626 255 q 531 293 584 293 l 493 293 l 493 135 l 533 135 m 493 429 l 537 429 q 651 413 605 429 q 724 371 697 398 q 763 306 752 344 q 775 220 775 267 q 538 0 775 0 l 339 0 l 339 300 l 215 300 l 215 0 l 62 0 l 62 688 l 215 688 l 215 428 l 339 428 l 339 688 l 493 688 l 493 429 "},"s":{"x_min":39,"x_max":465,"ha":504,"o":"m 188 209 q 203 150 186 172 q 252 128 221 128 q 302 146 285 128 q 319 198 319 165 q 303 259 319 241 q 246 291 288 276 q 163 325 201 308 q 100 366 126 343 q 60 422 74 390 q 47 499 47 454 q 100 640 47 583 q 258 697 153 697 q 415 642 366 697 q 465 496 465 588 l 318 477 q 303 536 319 514 q 257 559 287 559 q 208 538 220 559 q 196 496 196 517 q 209 451 196 468 q 270 417 222 434 q 358 382 322 400 q 419 339 395 364 q 453 281 442 315 q 465 199 465 247 q 453 118 465 155 q 417 52 442 80 q 351 7 391 23 q 252 -8 310 -8 q 96 41 151 -8 q 39 187 41 91 l 188 209 "},"?":{"x_min":43,"x_max":512,"ha":547,"o":"m 512 727 q 509 665 512 691 q 500 617 506 638 q 484 575 494 595 q 460 530 474 555 l 394 413 q 377 376 383 395 q 371 329 371 356 l 371 255 l 224 255 l 224 366 q 233 424 224 397 q 258 476 243 451 q 311 566 291 531 q 342 625 331 600 q 355 671 352 650 q 358 725 358 693 q 353 759 358 740 q 340 793 349 777 q 315 820 331 809 q 274 832 299 832 q 215 804 241 832 q 190 711 190 777 l 43 727 q 110 913 45 851 q 280 975 176 975 q 457 911 402 975 q 512 727 512 847 m 225 0 l 225 151 l 368 151 l 368 0 l 225 0 "},"₆":{"x_min":42,"x_max":329,"ha":367,"o":"m 183 -130 q 87 -100 129 -130 q 43 -12 45 -70 q 42 24 42 4 q 42 65 42 44 q 43 84 42 78 q 59 177 44 140 l 174 451 l 295 451 q 235 310 259 366 q 195 215 211 254 l 197 215 q 229 220 209 220 q 298 192 267 220 q 329 99 329 164 q 329 49 329 68 q 329 17 329 29 q 328 -1 329 6 q 328 -14 328 -9 q 287 -98 325 -67 q 183 -130 250 -130 m 219 101 q 209 122 219 113 q 184 132 199 132 q 157 120 165 132 q 149 93 149 108 l 149 0 q 158 -22 149 -12 q 183 -33 168 -33 q 209 -22 199 -33 q 219 0 219 -12 l 219 101 "},"c":{"x_min":46,"x_max":471,"ha":498,"o":"m 259 -8 q 177 3 212 -8 q 118 33 143 14 q 80 77 94 53 q 58 129 65 101 q 51 171 54 146 q 48 224 48 196 q 46 282 47 252 q 46 337 46 312 q 47 406 46 370 q 51 473 48 441 q 58 533 54 505 q 69 577 62 561 q 138 663 90 630 q 267 697 186 697 q 420 640 371 697 q 470 483 470 583 q 395 474 433 478 q 321 464 357 470 q 305 535 321 513 q 262 558 289 558 q 206 516 221 558 q 198 461 201 502 q 195 364 195 419 l 195 314 q 195 235 195 274 q 203 178 196 197 q 223 143 209 156 q 262 130 237 130 q 321 218 321 130 q 396 207 358 211 q 471 196 433 203 q 416 45 469 99 q 259 -8 362 -8 "},"¶":{"x_min":14,"x_max":558.5,"ha":599,"o":"m 187 438 q 61 515 108 452 q 14 699 14 579 q 25 799 14 751 q 63 886 37 848 q 130 948 89 924 q 233 972 172 972 l 558 972 l 558 840 l 496 840 l 496 -97 l 378 -97 l 378 840 l 308 840 l 308 -97 l 187 -97 l 187 438 "},"н":{"x_min":60,"x_max":494,"ha":554,"o":"m 343 0 l 343 291 l 211 291 l 211 0 l 60 0 l 60 686 l 211 686 l 211 410 l 343 410 l 343 686 l 494 686 l 494 0 l 343 0 "},"(":{"x_min":64,"x_max":337.296875,"ha":351,"o":"m 64 424 q 78 590 64 510 q 118 741 93 670 q 178 878 144 813 q 251 1001 212 944 l 337 959 q 278 835 303 901 q 234 702 252 770 q 206 564 216 634 q 197 430 197 495 q 206 287 197 359 q 234 146 216 214 q 277 12 252 77 q 334 -107 302 -51 l 259 -156 q 120 108 176 -36 q 64 424 64 253 "},"­":{"x_min":68.0625,"x_max":454.203125,"ha":507,"o":"m 68 325 l 68 456 l 454 456 l 454 325 l 68 325 "},"м":{"x_min":58,"x_max":659,"ha":717,"o":"m 503 366 l 461 269 l 402 145 l 313 145 l 254 268 l 213 359 l 209 359 l 209 0 l 58 0 l 58 688 l 201 688 l 295 486 l 357 355 l 359 355 l 421 487 l 517 688 l 659 688 l 659 0 l 506 0 l 506 366 l 503 366 "},"⁹":{"x_min":38,"x_max":325,"ha":367,"o":"m 72 512 q 131 650 107 591 q 171 749 155 709 l 169 749 q 138 745 157 745 q 69 772 100 745 q 38 866 38 800 l 38 935 q 41 988 38 961 q 56 1034 44 1015 q 108 1082 74 1065 q 183 1099 143 1099 q 280 1069 239 1099 q 324 982 321 1040 q 325 942 325 964 q 325 898 325 920 q 306 787 325 831 l 191 512 l 72 512 m 148 873 q 156 845 148 858 q 183 833 164 833 q 212 849 207 833 q 218 874 218 865 l 218 963 q 208 988 218 977 q 183 1000 198 1000 q 157 988 167 1000 q 148 963 148 977 l 148 873 "},":":{"x_min":68,"x_max":224,"ha":293,"o":"m 68 388 l 68 556 l 224 556 l 224 388 l 68 388 m 68 0 l 68 168 l 224 168 l 224 0 l 68 0 "},"з":{"x_min":25,"x_max":457,"ha":506,"o":"m 383 354 q 441 299 426 336 q 456 204 456 262 q 395 44 456 95 q 234 -7 335 -7 q 85 40 139 -7 q 25 175 31 87 l 171 197 q 238 124 175 124 q 285 144 266 124 q 304 205 304 165 q 288 273 304 249 q 237 298 273 298 l 186 298 l 186 411 l 240 411 q 304 493 304 411 q 287 544 304 525 q 239 564 270 564 q 190 542 207 564 q 170 488 172 520 l 32 515 q 95 645 40 598 q 244 693 150 693 q 402 643 348 693 q 457 497 457 594 q 442 415 457 456 q 383 356 428 374 l 383 354 "},"Ґ":{"x_min":72,"x_max":491,"ha":523,"o":"m 491 1125 l 491 825 l 222 825 l 222 0 l 72 0 l 72 967 l 367 967 l 367 1125 l 491 1125 "},"і":{"x_min":65,"x_max":216,"ha":283,"o":"m 65 821 l 65 967 l 216 967 l 216 821 l 65 821 m 65 0 l 65 686 l 216 686 l 216 0 l 65 0 "},"Û":{"x_min":67,"x_max":536,"ha":601,"o":"m 536 965 l 536 247 q 479 56 536 120 q 301 -8 423 -8 q 123 53 179 -8 q 67 232 67 115 l 67 965 l 217 965 l 217 229 q 235 161 217 191 q 300 132 254 132 q 365 163 346 132 q 385 238 385 194 l 385 965 l 536 965 m 300 1112 l 136 1005 l 77 1058 l 260 1242 l 347 1242 l 522 1060 l 463 1005 l 300 1112 "},"V":{"x_min":19.453125,"x_max":565.328125,"ha":585,"o":"m 406 967 l 565 967 l 380 0 l 201 0 l 19 967 l 179 967 l 244 569 l 288 265 l 295 265 l 340 569 l 406 967 "},"У":{"x_min":8.328125,"x_max":536.15625,"ha":540,"o":"m 280 464 l 395 967 l 536 967 l 341 219 q 297 94 322 140 q 246 24 273 48 q 188 -5 219 1 q 125 -14 158 -12 l 70 -14 l 70 107 l 105 107 q 161 129 140 107 q 198 201 183 152 q 201 209 200 202 q 204 224 202 216 q 209 238 206 231 q 212 248 211 245 l 8 965 l 154 965 l 273 464 l 280 464 "},"@":{"x_min":83,"x_max":1004,"ha":1086,"o":"m 622 266 q 561 215 600 233 q 480 197 522 197 q 416 210 441 197 q 374 247 390 224 q 352 300 358 270 q 346 362 346 330 q 355 427 346 395 q 384 484 364 459 q 437 524 405 509 q 514 540 469 540 l 587 540 l 587 595 q 574 636 587 621 q 530 651 562 651 q 494 639 512 651 q 470 596 477 627 l 359 630 q 424 729 377 694 q 539 765 471 765 q 665 728 620 765 q 711 599 711 691 l 711 362 q 728 311 711 328 q 765 294 745 294 q 810 303 788 294 q 851 338 833 312 q 879 410 869 364 q 890 530 890 456 q 867 676 890 611 q 803 788 845 741 q 699 859 760 834 q 562 885 638 885 q 396 851 466 885 q 281 760 325 818 q 215 627 237 702 q 194 466 194 551 q 218 286 194 366 q 288 150 242 206 q 402 66 334 95 q 557 37 470 37 q 675 49 623 37 q 792 98 728 62 l 837 0 q 705 -48 773 -29 q 564 -67 637 -67 q 366 -34 455 -67 q 214 64 277 -1 q 116 230 150 130 q 83 466 83 330 q 114 676 83 580 q 205 842 145 772 q 355 951 266 911 q 558 991 444 991 q 754 955 670 991 q 894 857 838 920 q 976 710 949 794 q 1004 530 1004 626 q 983 370 1004 435 q 926 264 962 305 q 846 205 891 223 q 751 187 801 187 q 722 191 740 187 q 686 205 705 195 q 650 230 666 215 q 625 266 633 245 l 622 266 m 587 448 l 537 448 q 488 431 509 448 q 468 370 468 414 q 483 324 468 341 q 527 307 498 307 q 571 327 555 307 q 587 378 587 346 l 587 448 "},"¾":{"x_min":33,"x_max":840.890625,"ha":876,"o":"m 328 574 q 324 501 328 536 q 281 412 317 442 q 183 383 245 383 q 73 421 110 383 q 37 528 37 460 l 37 535 l 146 548 q 155 502 148 517 q 187 487 162 487 q 212 498 204 487 q 220 520 220 510 l 220 596 q 171 642 220 642 l 135 642 l 135 730 l 174 730 q 206 739 193 730 q 220 771 220 748 l 220 835 q 212 860 220 849 q 186 872 204 872 q 140 801 140 872 q 86 808 112 803 q 33 816 60 812 q 76 929 35 887 q 187 972 116 972 q 275 951 244 972 q 318 895 305 930 q 326 848 325 876 q 328 798 328 820 q 321 738 328 768 q 279 689 314 708 q 319 647 311 675 q 328 574 328 619 m 274 -24 l 183 -24 l 619 992 l 711 992 l 274 -24 m 802 82 l 802 0 l 699 0 l 699 82 l 515 82 l 515 166 l 642 577 l 746 577 l 624 175 l 699 175 l 699 312 l 802 312 l 802 175 l 840 175 l 840 82 l 802 82 "},"i":{"x_min":65,"x_max":216,"ha":283,"o":"m 65 821 l 65 967 l 216 967 l 216 821 l 65 821 m 65 0 l 65 686 l 216 686 l 216 0 l 65 0 "},"⁶":{"x_min":42,"x_max":329,"ha":367,"o":"m 183 508 q 87 537 129 508 q 43 626 45 567 q 42 662 42 642 q 42 703 42 683 q 43 723 42 716 q 59 816 44 778 l 174 1090 l 295 1090 q 235 949 259 1005 q 195 854 211 893 l 197 854 q 229 859 209 859 q 298 831 267 859 q 329 737 329 803 q 329 687 329 707 q 329 656 329 668 q 328 636 329 644 q 328 623 328 629 q 287 539 325 570 q 183 508 250 508 m 219 740 q 209 761 219 752 q 184 771 199 771 q 157 759 165 771 q 149 731 149 747 l 149 638 q 158 615 149 625 q 183 605 168 605 q 209 615 199 605 q 219 638 219 625 l 219 740 "},"ќ":{"x_min":53,"x_max":532.1875,"ha":547,"o":"m 53 0 l 53 685 l 203 685 l 203 406 l 233 406 q 264 408 248 406 q 293 421 279 411 q 318 452 307 432 q 336 505 329 472 l 378 686 l 519 686 q 495 586 507 636 q 472 486 483 536 q 437 403 461 437 q 376 358 412 369 l 376 355 q 443 307 422 344 q 478 221 465 271 l 532 0 l 384 0 l 347 175 q 331 230 340 209 q 309 262 322 251 q 281 277 297 273 q 244 282 265 282 l 203 282 l 203 0 l 53 0 m 213 797 l 331 1043 l 455 987 l 294 754 l 213 797 "},"ё":{"x_min":46,"x_max":474,"ha":522,"o":"m 195 308 q 195 233 195 269 q 201 178 196 197 q 262 131 215 131 q 324 210 317 131 l 474 186 q 414 43 468 94 q 260 -8 360 -8 q 177 3 212 -8 q 118 35 142 15 q 80 79 94 54 q 59 129 66 104 q 52 171 55 146 q 48 224 50 196 q 46 282 47 252 q 46 338 46 312 q 50 472 46 405 q 69 574 55 538 q 137 663 88 630 q 266 697 185 697 q 421 640 368 697 q 474 478 474 583 l 474 308 l 195 308 m 207 514 q 199 475 201 502 q 196 411 197 448 l 323 411 l 323 469 q 311 528 323 502 q 262 555 299 555 q 207 514 222 555 m 316 799 l 316 945 l 447 945 l 447 799 l 316 799 m 89 799 l 89 945 l 220 945 l 220 799 l 89 799 "},"m":{"x_min":63,"x_max":768,"ha":829,"o":"m 619 695 q 689 681 660 695 q 735 644 717 668 q 760 589 752 621 q 768 519 768 557 l 768 0 l 617 0 l 617 475 q 600 530 617 511 q 556 549 584 549 q 510 529 529 549 q 490 476 491 510 l 490 0 l 339 0 l 339 475 q 323 530 339 511 q 279 549 307 549 q 232 527 251 549 q 213 468 213 505 l 213 0 l 63 0 l 63 688 l 213 688 l 213 625 l 218 624 q 270 674 239 653 q 340 695 301 695 q 424 673 393 695 q 471 615 456 651 q 539 673 501 651 q 619 695 577 695 "},"Е":{"x_min":72,"x_max":501.1875,"ha":528,"o":"m 72 0 l 72 967 l 501 967 l 501 825 l 222 825 l 222 563 l 465 563 l 465 420 l 222 420 l 222 142 l 501 142 l 501 0 l 72 0 "},"Э":{"x_min":33,"x_max":496,"ha":554,"o":"m 496 239 q 441 57 496 122 q 265 -8 387 -8 q 97 51 156 -8 q 33 215 38 111 l 182 239 q 266 131 186 131 q 307 141 291 131 q 332 167 323 151 q 344 202 341 183 q 347 236 347 221 l 347 419 l 154 419 l 154 565 l 347 565 l 347 726 q 330 801 347 769 q 263 833 313 833 q 202 803 223 833 q 179 721 181 774 l 33 746 q 96 913 37 851 q 267 975 156 975 q 380 954 336 975 q 450 897 425 933 q 486 815 476 862 q 496 713 496 768 l 496 239 "},"⁵":{"x_min":36.65625,"x_max":327,"ha":367,"o":"m 327 662 q 319 603 327 632 q 294 553 311 575 q 249 519 276 532 q 182 506 221 506 q 74 544 111 506 q 36 651 36 583 l 145 669 q 154 618 145 633 q 183 603 164 603 q 208 612 199 603 q 217 643 217 622 l 217 773 q 210 794 217 784 q 187 804 204 804 q 141 777 157 804 l 50 777 l 50 1092 l 323 1092 l 323 998 l 153 998 l 154 881 q 181 892 165 887 q 213 897 197 897 q 298 867 270 897 q 327 788 327 837 l 327 662 "},"ю":{"x_min":53,"x_max":691,"ha":737,"o":"m 483 695 q 614 658 569 695 q 674 567 659 622 q 683 516 679 544 q 688 456 686 487 q 690 393 689 425 q 691 334 691 362 l 691 323 q 689 247 691 286 q 684 172 688 208 q 655 78 677 115 q 604 23 634 42 q 539 -3 574 3 q 470 -10 503 -10 q 394 1 426 -10 q 339 32 362 13 q 302 76 316 51 q 282 129 289 101 q 273 201 275 155 q 271 290 271 247 l 204 290 l 204 0 l 53 0 l 53 686 l 204 686 l 204 409 l 271 409 q 277 506 272 462 q 291 574 283 549 q 358 662 311 629 q 483 695 405 695 m 481 557 q 445 542 459 557 q 423 508 430 527 q 416 448 418 490 q 414 349 415 406 l 414 313 q 416 217 414 255 q 429 159 418 180 q 481 130 444 130 q 518 143 502 130 q 538 175 534 156 q 542 197 540 181 q 544 235 544 213 q 546 284 545 257 q 547 337 547 310 q 546 431 547 385 q 540 499 545 476 q 522 539 534 522 q 481 557 509 557 "},"á":{"x_min":39,"x_max":482,"ha":535,"o":"m 327 54 q 271 7 304 22 q 200 -8 237 -8 q 123 8 154 -8 q 73 53 91 25 q 46 119 54 82 q 39 200 39 157 q 49 279 39 240 q 83 348 59 318 q 146 397 107 378 q 243 416 185 416 l 331 416 l 331 490 q 316 538 331 521 q 261 556 301 556 q 219 542 240 556 q 192 492 198 528 l 55 533 q 128 653 73 610 q 271 696 183 696 q 428 648 375 696 q 482 490 482 601 l 482 0 l 331 0 l 331 52 l 327 54 m 331 303 l 271 303 q 212 282 238 303 q 186 208 186 261 q 204 153 186 172 q 255 134 223 134 q 311 156 291 134 q 331 218 331 179 l 331 303 m 211 797 l 330 1043 l 453 987 l 292 754 l 211 797 "},"×":{"x_min":16.671875,"x_max":547.265625,"ha":563,"o":"m 366 412 l 538 233 l 455 150 l 280 327 l 97 150 l 16 233 l 198 412 l 23 590 l 108 674 l 283 494 l 466 675 l 547 590 l 366 412 "},"K":{"x_min":72,"x_max":593.265625,"ha":597,"o":"m 440 0 l 284 416 q 253 349 269 383 q 221 282 237 315 l 221 0 l 72 0 l 72 967 l 221 967 l 221 576 l 227 576 l 409 967 l 565 967 q 468 771 516 868 q 371 575 419 673 l 593 0 l 440 0 "},"7":{"x_min":71,"x_max":497.4375,"ha":563,"o":"m 252 0 l 105 0 l 341 829 l 203 829 l 203 725 l 71 725 l 71 967 l 497 967 l 497 840 l 252 0 "},"п":{"x_min":65,"x_max":498,"ha":562,"o":"m 347 0 l 347 555 l 215 555 l 215 0 l 65 0 l 65 688 l 498 688 l 498 0 l 347 0 "},"⁰":{"x_min":42,"x_max":328,"ha":367,"o":"m 218 965 q 209 988 218 978 q 183 999 200 999 q 157 988 166 999 q 149 965 149 978 l 149 642 q 157 619 149 629 q 184 609 166 609 q 209 619 200 609 q 218 642 218 629 l 218 965 m 328 636 q 286 542 328 575 q 185 510 244 510 q 83 542 125 510 q 42 636 42 575 l 42 971 q 84 1065 42 1032 q 185 1099 126 1099 q 287 1065 246 1099 q 328 971 328 1032 l 328 636 "},"¨":{"x_min":68,"x_max":427,"ha":492,"o":"m 296 789 l 296 935 l 427 935 l 427 789 l 296 789 m 68 789 l 68 935 l 199 935 l 199 789 l 68 789 "},"Y":{"x_min":11.09375,"x_max":537.515625,"ha":549,"o":"m 279 590 l 325 761 l 379 967 l 537 967 l 350 400 l 350 0 l 200 0 l 200 400 l 11 967 l 169 967 l 229 757 l 273 590 l 279 590 "},"E":{"x_min":72,"x_max":501.1875,"ha":528,"o":"m 72 0 l 72 967 l 501 967 l 501 825 l 222 825 l 222 563 l 465 563 l 465 420 l 222 420 l 222 142 l 501 142 l 501 0 l 72 0 "},"Ô":{"x_min":64,"x_max":533,"ha":597,"o":"m 382 730 q 364 803 382 771 q 298 835 347 835 q 255 823 272 835 q 229 794 238 811 q 217 755 220 776 q 214 715 214 733 l 214 229 q 232 161 214 191 q 297 132 251 132 q 362 163 343 132 q 382 238 382 194 l 382 730 m 533 247 q 476 56 533 121 q 297 -8 419 -8 q 119 53 175 -8 q 64 232 64 115 l 64 718 q 77 822 64 775 q 118 903 90 869 q 190 956 145 937 q 298 975 236 975 q 410 957 365 975 q 482 906 455 940 q 521 826 509 873 q 533 719 533 779 l 533 247 m 298 1112 l 134 1005 l 75 1058 l 258 1242 l 345 1242 l 520 1060 l 461 1005 l 298 1112 "},"Ï":{"x_min":-28,"x_max":331,"ha":302,"o":"m 75 0 l 75 967 l 226 967 l 226 0 l 75 0 m 200 1028 l 200 1175 l 331 1175 l 331 1028 l 200 1028 m -28 1028 l -28 1175 l 103 1175 l 103 1028 l -28 1028 "},"Є":{"x_min":64,"x_max":528,"ha":559,"o":"m 298 975 q 400 958 357 975 q 471 914 443 942 q 513 846 498 885 q 528 759 528 806 l 382 730 q 359 804 380 776 q 297 833 337 833 q 255 821 272 833 q 229 794 239 810 q 216 757 219 777 q 213 719 213 737 l 213 565 l 406 565 l 406 419 l 213 419 l 213 227 q 215 195 213 212 q 227 164 218 179 q 252 141 236 150 q 293 132 268 132 q 378 238 373 132 l 528 215 q 464 51 522 111 q 298 -8 407 -8 q 120 52 177 -8 q 64 230 64 112 l 64 711 q 76 813 64 765 q 117 897 89 862 q 190 954 145 933 q 298 975 234 975 "},"₂":{"x_min":31,"x_max":331,"ha":367,"o":"m 39 -125 l 39 -38 l 197 234 q 213 274 208 254 q 218 317 218 295 q 211 347 218 333 q 181 361 204 361 q 150 341 161 361 q 139 277 139 322 l 31 292 q 72 416 32 373 q 183 460 112 460 q 295 422 260 460 q 331 319 331 384 q 321 254 331 286 q 290 186 311 222 q 265 141 282 170 q 231 80 249 112 q 196 19 212 48 q 171 -25 179 -9 l 323 -25 l 323 -125 l 39 -125 "},"⁺":{"x_min":8.8125,"x_max":357.171875,"ha":367,"o":"m 228 715 l 228 588 l 138 588 l 138 715 l 8 715 l 8 800 l 138 800 l 138 928 l 228 928 l 228 800 l 357 800 l 357 715 l 228 715 "},"±":{"x_min":19.21875,"x_max":541.78125,"ha":563,"o":"m 339 375 l 339 162 l 222 162 l 222 375 l 19 375 l 19 492 l 222 492 l 222 704 l 339 704 l 339 492 l 541 492 l 541 375 l 339 375 m 541 114 l 541 0 l 19 0 l 19 114 l 541 114 "},"ì":{"x_min":-37.5,"x_max":216,"ha":283,"o":"m 65 0 l 65 686 l 216 686 l 216 0 l 65 0 m 123 754 l -37 987 l 86 1043 l 202 797 l 123 754 "},"|":{"x_min":106,"x_max":224,"ha":326,"o":"m 106 -225 l 106 1004 l 224 1004 l 224 -225 l 106 -225 "},"§":{"x_min":48.578125,"x_max":549,"ha":588,"o":"m 549 411 q 527 325 549 361 q 466 262 506 288 q 506 190 494 227 q 519 113 519 152 q 501 28 519 66 q 452 -37 484 -9 q 374 -80 420 -65 q 273 -96 329 -96 q 154 -69 215 -96 q 48 1 93 -43 l 131 94 q 209 39 176 53 q 274 26 243 26 q 350 48 325 26 q 375 107 375 71 q 240 253 375 180 q 161 301 195 278 q 103 350 126 324 q 68 407 80 376 q 57 480 57 438 q 81 566 57 526 q 146 630 106 606 q 88 767 88 690 q 104 851 88 813 q 150 916 121 888 q 220 959 179 944 q 310 975 261 975 q 429 952 377 975 q 534 885 481 930 l 449 787 q 372 838 405 828 q 310 849 339 849 q 252 827 274 849 q 230 776 230 805 q 261 713 230 740 q 342 657 292 686 q 420 607 382 632 q 485 552 457 582 q 531 489 514 523 q 549 411 549 454 m 410 406 q 371 477 410 445 q 243 551 332 508 q 206 527 220 544 q 193 486 193 509 q 209 443 193 463 q 252 403 226 422 q 308 368 277 384 q 365 337 339 351 q 398 366 386 345 q 410 406 410 386 "},"џ":{"x_min":65,"x_max":495,"ha":558,"o":"m 495 686 l 495 0 l 342 0 l 342 -174 l 215 -174 l 215 0 l 65 0 l 65 686 l 216 686 l 216 138 l 345 137 l 345 686 l 495 686 "},"љ":{"x_min":7.203125,"x_max":772,"ha":797,"o":"m 246 553 l 246 276 q 232 153 246 204 q 195 68 219 103 q 135 13 171 34 q 55 -22 100 -8 l 7 93 q 55 123 36 108 q 87 159 75 139 q 104 207 98 179 q 110 279 110 236 l 110 686 l 489 686 l 489 435 l 534 435 q 648 419 602 435 q 722 375 694 403 q 760 307 749 347 q 772 220 772 268 q 535 0 772 0 l 336 0 l 336 553 l 246 553 m 489 135 l 530 135 q 602 159 582 135 q 623 219 623 184 q 601 277 623 255 q 527 300 580 300 l 489 300 l 489 135 "},"й":{"x_min":57,"x_max":525,"ha":583,"o":"m 375 0 l 375 397 l 372 397 l 202 0 l 57 0 l 57 686 l 204 686 l 204 273 l 206 273 l 375 686 l 525 686 l 525 0 l 375 0 m 204 954 q 213 922 205 938 q 232 892 220 906 q 259 870 244 879 q 294 861 274 861 q 331 870 315 861 q 358 892 347 879 q 375 922 369 906 q 382 954 382 938 l 491 954 q 476 890 488 924 q 439 828 463 856 q 379 780 415 799 q 294 762 344 762 q 202 780 240 762 q 141 828 165 799 q 106 890 117 856 q 94 954 95 924 l 204 954 "},"q":{"x_min":46,"x_max":488,"ha":544,"o":"m 338 -267 l 338 52 l 332 52 q 275 5 312 20 q 212 -10 238 -10 q 152 -1 176 -10 q 111 20 127 6 q 84 53 94 34 q 66 94 73 72 q 50 194 54 133 q 46 314 46 255 l 46 343 q 48 436 46 391 q 53 517 50 480 q 75 605 58 571 q 114 659 91 639 q 164 687 137 679 q 218 695 190 695 q 287 681 258 695 q 335 632 315 667 l 339 635 l 339 686 l 488 686 l 488 -267 l 338 -267 m 271 549 q 217 516 228 549 q 204 455 207 498 q 202 349 202 412 q 204 239 202 287 q 215 167 206 191 q 271 134 231 134 q 319 155 301 134 q 338 207 338 177 q 338 278 339 239 q 339 359 338 317 l 339 367 q 339 419 339 394 q 338 466 339 444 q 322 526 338 503 q 271 549 306 549 "},"b":{"x_min":51,"x_max":492,"ha":535,"o":"m 320 -8 q 251 5 280 -8 q 204 52 223 19 q 202 52 202 52 q 200 51 201 51 l 200 0 l 51 0 l 51 1008 l 201 1008 l 201 633 l 207 633 q 263 680 226 665 q 326 696 300 696 q 387 688 362 696 q 428 666 411 680 q 454 634 444 652 q 472 594 464 615 q 487 514 483 562 q 492 411 492 465 l 492 348 q 489 251 492 298 q 485 168 487 204 q 463 80 479 114 q 425 26 447 46 q 375 0 402 7 q 320 -8 348 -8 m 268 136 q 303 145 290 136 q 322 169 315 155 q 335 229 332 187 q 338 336 338 272 q 336 446 338 400 q 324 517 335 493 q 304 542 317 533 q 268 552 291 552 q 211 515 227 552 q 201 475 201 499 q 200 405 200 443 q 200 318 201 366 q 200 266 200 291 q 201 218 200 241 q 217 159 201 183 q 268 136 233 136 "},"Ж":{"x_min":27.53125,"x_max":916.46875,"ha":945,"o":"m 397 0 l 397 422 l 360 422 q 276 390 305 422 q 233 283 248 359 q 205 141 219 212 q 176 0 191 70 l 27 0 l 94 322 q 138 435 109 392 q 220 498 167 478 l 220 501 q 149 561 180 517 q 103 676 117 605 q 73 819 88 748 q 42 965 58 891 l 181 965 l 241 691 q 263 626 249 652 q 294 585 277 601 q 329 564 310 570 q 366 558 348 558 l 397 558 l 397 967 l 547 967 l 547 558 l 572 558 q 652 585 619 558 q 702 691 685 613 q 714 744 705 705 q 733 828 723 783 q 751 912 742 873 q 762 965 759 951 l 901 965 q 871 819 887 891 q 840 676 855 748 q 794 561 824 605 q 723 501 763 517 l 722 499 q 804 436 774 480 q 849 322 834 392 l 916 0 l 767 0 l 710 283 q 663 391 695 360 q 583 422 631 422 l 547 422 l 547 0 l 397 0 "},"®":{"x_min":57,"x_max":615,"ha":675,"o":"m 380 487 l 330 634 l 310 634 l 310 487 l 238 487 l 238 866 l 340 866 q 446 748 446 866 q 436 691 446 718 q 400 648 427 665 l 459 487 l 380 487 m 374 748 q 364 787 374 773 q 332 801 355 801 l 310 801 l 310 700 l 336 700 q 365 713 357 700 q 374 748 374 727 m 337 361 q 215 385 267 361 q 128 452 163 409 q 75 554 93 495 q 57 680 57 612 q 75 809 57 750 q 128 911 93 868 q 215 978 163 954 q 337 1003 267 1003 q 455 978 404 1003 q 542 911 506 954 q 596 809 577 868 q 615 680 615 750 q 596 554 615 612 q 542 452 577 495 q 455 385 506 409 q 337 361 404 361 m 337 939 q 244 918 283 939 q 179 863 205 898 q 140 782 152 829 q 128 683 128 735 q 141 580 128 627 q 182 500 155 534 q 247 448 208 467 q 337 430 286 430 q 430 449 391 430 q 494 503 469 468 q 531 583 519 537 q 543 683 543 630 q 529 782 543 735 q 490 863 516 829 q 426 918 465 898 q 337 939 387 939 "},"Н":{"x_min":72,"x_max":543,"ha":615,"o":"m 394 0 l 394 422 l 221 422 l 221 0 l 72 0 l 72 967 l 221 967 l 221 562 l 394 562 l 394 967 l 543 967 l 543 0 l 394 0 "},"ф":{"x_min":47,"x_max":667,"ha":716,"o":"m 286 -9 q 130 41 183 1 q 58 158 77 82 q 49 241 51 194 q 47 337 47 289 q 51 457 47 404 q 70 553 56 511 q 149 650 91 615 q 286 694 206 686 l 286 960 l 428 960 l 428 694 q 578 646 525 689 q 648 547 630 604 q 663 456 660 512 q 667 340 667 400 l 667 329 q 666 261 667 290 q 661 197 665 232 q 608 71 649 116 q 532 17 577 36 q 431 -8 487 -1 l 431 -265 l 286 -265 l 286 -9 m 285 122 q 285 342 285 229 q 286 562 286 455 q 208 506 226 551 q 198 454 201 490 q 196 376 196 418 l 196 279 q 200 211 198 240 q 208 166 201 183 q 237 135 216 145 q 285 122 257 125 m 428 122 q 508 180 494 130 q 518 241 517 205 q 520 326 520 277 q 519 436 520 383 q 511 509 518 490 q 484 545 504 531 q 428 562 464 559 l 428 122 "},"л":{"x_min":4.21875,"x_max":503,"ha":559,"o":"m 243 553 l 243 276 q 230 153 243 204 q 193 68 218 103 q 134 13 169 34 q 52 -22 98 -8 l 4 93 q 52 123 33 108 q 84 159 72 139 q 101 207 95 179 q 107 279 107 236 l 107 688 l 503 688 l 503 0 l 353 0 l 353 553 l 243 553 "},"L":{"x_min":72,"x_max":490.078125,"ha":499,"o":"m 72 0 l 72 967 l 222 967 l 222 142 l 490 142 l 490 0 l 72 0 "},"Щ":{"x_min":71,"x_max":872,"ha":898,"o":"m 808 140 l 872 140 l 872 -184 l 746 -184 l 746 0 l 71 0 l 71 967 l 221 967 l 221 140 l 364 140 l 364 967 l 514 967 l 514 140 l 658 140 l 658 967 l 808 967 l 808 140 "}," ":{"x_min":0,"x_max":0,"ha":285},"À":{"x_min":15.28125,"x_max":572.265625,"ha":586,"o":"m 419 0 l 381 202 l 204 202 q 185 101 194 151 q 168 0 176 50 l 15 0 q 112 483 63 243 q 209 967 161 723 l 376 967 l 572 0 l 419 0 m 297 997 l 48 1134 l 137 1239 l 351 1070 l 297 997 m 288 743 q 259 544 275 643 q 226 342 244 444 l 358 342 l 295 743 l 288 743 "},"+":{"x_min":19.21875,"x_max":541.78125,"ha":563,"o":"m 339 352 l 339 133 l 222 133 l 222 352 l 19 352 l 19 471 l 222 471 l 222 690 l 339 690 l 339 471 l 541 471 l 541 352 l 339 352 "},"½":{"x_min":54,"x_max":819,"ha":875,"o":"m 527 0 l 527 86 l 685 359 q 701 399 696 379 q 706 442 706 420 q 699 472 706 458 q 669 486 692 486 q 638 466 649 486 q 627 402 627 447 l 519 417 q 560 541 520 498 q 671 585 600 585 q 783 547 748 585 q 819 444 819 509 q 809 379 819 411 q 778 311 799 347 q 753 266 770 295 q 719 205 737 237 q 684 144 700 173 q 659 100 667 115 l 811 100 l 811 0 l 527 0 m 244 -24 l 152 -24 l 588 992 l 680 992 l 244 -24 m 138 389 l 138 847 l 54 784 l 54 898 l 146 967 l 248 967 l 248 389 l 138 389 "},"₌":{"x_min":8.328125,"x_max":356.96875,"ha":367,"o":"m 8 143 l 8 229 l 356 229 l 356 143 l 8 143 m 8 10 l 8 96 l 356 96 l 356 10 l 8 10 "},"Ë":{"x_min":72,"x_max":501.1875,"ha":529,"o":"m 72 0 l 72 967 l 501 967 l 501 825 l 222 825 l 222 563 l 466 563 l 466 420 l 222 420 l 222 142 l 501 142 l 501 0 l 72 0 m 335 1028 l 335 1175 l 466 1175 l 466 1028 l 335 1028 m 107 1028 l 107 1175 l 237 1175 l 237 1028 l 107 1028 "},"'":{"x_min":79,"x_max":186,"ha":258,"o":"m 79 681 l 79 967 l 186 967 l 186 681 l 79 681 "},"Р":{"x_min":72,"x_max":543,"ha":572,"o":"m 285 967 q 481 897 419 967 q 543 673 543 828 q 530 550 543 605 q 487 455 517 494 q 407 393 456 415 q 283 371 358 371 l 222 371 l 222 0 l 72 0 l 72 967 l 285 967 m 222 825 l 222 514 l 274 514 q 371 553 344 514 q 399 672 399 593 q 373 784 399 743 q 277 825 347 825 l 222 825 "},"щ":{"x_min":63,"x_max":814,"ha":842,"o":"m 751 688 l 751 138 l 814 138 l 814 -147 l 689 -147 l 689 0 l 63 0 l 63 688 l 213 688 l 213 138 l 331 138 l 331 688 l 482 688 l 482 138 l 601 138 l 601 688 l 751 688 "},"ð":{"x_min":46,"x_max":532.671875,"ha":536,"o":"m 485 358 q 485 315 485 338 q 483 266 485 291 q 480 217 482 241 q 478 174 479 194 q 449 81 471 117 q 396 25 428 45 q 328 -2 365 5 q 254 -10 291 -10 q 119 30 165 -10 q 58 128 73 70 q 51 168 54 144 q 48 221 48 192 q 46 279 47 249 q 46 336 46 309 q 52 458 46 404 q 71 547 58 512 q 132 629 89 595 q 247 664 176 664 q 303 654 272 664 q 358 622 335 645 l 360 622 q 357 704 360 666 q 339 777 354 741 l 259 719 l 218 775 l 301 834 q 231 882 277 866 q 140 902 184 897 l 158 1014 q 253 1000 213 1009 q 322 977 293 991 q 371 948 351 963 q 407 913 391 932 l 491 975 l 532 922 q 488 888 510 905 q 444 857 466 872 q 463 806 455 834 q 475 740 471 779 q 482 651 480 701 q 485 536 485 601 l 485 358 m 268 525 q 231 515 247 525 q 207 483 215 505 q 198 431 200 463 q 195 326 196 398 q 195 281 195 304 q 195 239 195 259 q 198 202 196 219 q 203 176 200 185 q 225 142 211 155 q 268 129 240 129 q 307 144 290 129 q 328 180 325 159 q 335 239 332 195 q 338 331 338 283 q 337 413 338 379 q 331 469 336 448 q 268 525 315 525 "},"⁷":{"x_min":29,"x_max":325,"ha":333,"o":"m 162 514 l 52 514 l 208 995 l 129 995 l 129 936 l 29 936 l 29 1092 l 325 1092 l 325 1008 l 162 514 "},"ä":{"x_min":39,"x_max":481,"ha":535,"o":"m 325 54 q 270 7 303 22 q 199 -8 237 -8 q 122 8 154 -8 q 72 53 91 25 q 46 119 54 82 q 39 200 39 157 q 49 279 39 240 q 83 348 59 318 q 145 397 106 378 q 242 416 184 416 l 330 416 l 330 490 q 315 538 330 521 q 261 556 301 556 q 219 542 240 556 q 192 492 198 528 l 55 533 q 128 653 73 610 q 270 696 183 696 q 427 648 374 696 q 481 490 481 601 l 481 0 l 330 0 l 330 52 l 325 54 m 330 303 l 270 303 q 212 282 238 303 q 186 208 186 261 q 204 153 186 172 q 255 134 223 134 q 310 156 291 134 q 330 218 330 179 l 330 303 m 323 789 l 323 935 l 454 935 l 454 789 l 323 789 m 96 789 l 96 935 l 227 935 l 227 789 l 96 789 "},"Т":{"x_min":4.4375,"x_max":466.5625,"ha":472,"o":"m 311 827 l 311 0 l 160 0 l 160 827 l 4 827 l 4 967 l 466 967 l 466 827 l 311 827 "},"¹":{"x_min":45,"x_max":239,"ha":302,"o":"m 129 514 l 129 972 l 45 909 l 45 1023 l 137 1092 l 239 1092 l 239 514 l 129 514 "},"£":{"x_min":41.9375,"x_max":521,"ha":563,"o":"m 286 975 q 458 914 396 975 q 521 747 521 854 l 375 714 q 353 799 375 767 q 287 831 332 831 q 232 808 255 831 q 210 749 210 786 q 216 699 210 724 q 231 646 222 674 q 249 585 240 618 q 265 513 258 553 l 400 513 l 400 396 l 269 396 q 253 253 269 312 q 210 136 237 194 l 500 136 l 500 0 l 41 0 l 41 126 q 74 188 61 159 q 96 247 87 216 q 112 313 105 277 q 122 396 118 348 l 43 396 l 43 513 l 114 513 q 98 575 107 547 q 80 630 89 603 q 66 685 72 657 q 60 748 60 714 q 76 841 60 800 q 123 913 93 883 q 194 959 153 943 q 286 975 236 975 "},"W":{"x_min":20.828125,"x_max":827.84375,"ha":849,"o":"m 687 0 l 531 0 l 455 419 q 441 500 448 459 q 427 582 434 541 l 422 582 l 393 416 q 354 208 373 312 q 315 0 334 104 l 161 0 l 20 967 l 184 967 q 205 786 195 875 q 225 605 215 697 q 230 556 226 593 q 238 478 234 519 q 246 400 243 437 q 251 351 250 364 l 256 351 q 275 459 266 405 q 291 566 283 512 l 362 967 l 490 967 l 559 565 q 577 456 568 511 q 595 347 586 401 l 601 347 l 623 566 l 662 967 l 827 967 l 687 0 "},"а":{"x_min":39,"x_max":482,"ha":535,"o":"m 327 54 q 271 7 304 22 q 200 -8 237 -8 q 123 8 154 -8 q 73 53 91 25 q 46 119 54 82 q 39 200 39 157 q 49 279 39 240 q 83 348 59 318 q 146 397 107 378 q 243 416 185 416 l 331 416 l 331 490 q 316 538 331 521 q 261 556 301 556 q 219 542 240 556 q 192 492 198 528 l 55 533 q 128 653 73 610 q 271 696 183 696 q 428 648 375 696 q 482 490 482 601 l 482 0 l 331 0 l 331 52 l 327 54 m 331 303 l 271 303 q 212 282 238 303 q 186 208 186 261 q 204 153 186 172 q 255 134 223 134 q 311 156 291 134 q 331 218 331 179 l 331 303 "},"ә":{"x_min":47,"x_max":478,"ha":522,"o":"m 328 381 q 326 456 328 419 q 318 511 325 492 q 258 559 304 559 q 197 479 202 559 l 47 503 q 106 647 52 595 q 262 699 161 699 q 345 687 309 699 q 404 655 380 675 q 442 611 427 636 q 464 560 457 586 q 471 518 468 543 q 475 464 473 493 q 477 406 476 436 q 478 351 478 376 q 476 283 478 318 q 472 217 475 248 q 465 158 469 185 q 454 114 461 132 q 385 25 433 58 q 256 -8 337 -8 q 99 48 152 -8 q 47 210 47 105 l 47 381 l 328 381 m 315 174 q 323 213 321 186 q 327 278 325 240 l 198 278 l 198 219 q 209 160 198 186 q 259 134 221 134 q 315 174 300 134 "},"v":{"x_min":6.9375,"x_max":502.8125,"ha":510,"o":"m 340 0 l 168 0 q 87 343 127 173 q 6 686 47 512 l 170 686 q 195 548 183 616 q 219 411 208 480 q 236 306 227 358 q 254 202 244 255 l 261 202 l 294 409 l 340 686 l 502 686 l 340 0 "},">":{"x_min":22.21875,"x_max":541.703125,"ha":563,"o":"m 25 243 l 398 414 l 22 586 l 22 724 l 541 464 l 541 363 l 25 104 l 25 243 "},"Ї":{"x_min":-29,"x_max":329,"ha":301,"o":"m 76 0 l 76 967 l 227 967 l 227 0 l 76 0 m 198 1038 l 198 1184 l 329 1184 l 329 1038 l 198 1038 m -29 1038 l -29 1184 l 102 1184 l 102 1038 l -29 1038 "},"û":{"x_min":46,"x_max":492,"ha":544,"o":"m 338 61 q 335 61 336 61 q 332 62 335 62 q 276 12 311 31 q 202 -7 241 -7 q 130 6 159 -7 q 85 43 102 19 q 60 99 67 66 q 54 169 54 132 l 54 688 l 205 688 l 205 211 q 221 153 205 170 q 267 136 237 136 q 317 157 295 136 q 339 216 339 179 l 339 688 l 488 688 l 488 0 l 338 0 l 338 61 m 269 870 l 105 740 l 46 793 l 229 1000 l 316 1000 l 492 794 l 432 740 l 269 870 "},"Ð":{"x_min":7,"x_max":535,"ha":604,"o":"m 312 967 q 448 937 398 967 q 518 836 498 907 q 534 695 533 785 q 535 484 535 605 q 533 279 535 365 q 515 143 532 193 q 431 30 489 61 q 300 0 373 0 l 72 0 l 72 438 l 7 438 l 7 542 l 72 542 l 72 967 l 312 967 m 384 712 q 363 795 384 765 q 286 825 343 825 l 222 825 l 222 542 l 297 542 l 297 438 l 222 438 l 222 142 l 286 142 q 363 171 342 142 q 384 255 384 200 l 384 712 "},"Х":{"x_min":8.328125,"x_max":565.328125,"ha":575,"o":"m 397 0 l 287 332 l 284 332 l 175 0 l 8 0 l 204 505 q 113 735 158 621 q 22 967 68 850 l 190 967 q 237 821 213 893 q 284 676 261 750 l 290 678 l 381 967 l 551 967 l 363 505 q 464 252 413 377 q 565 0 515 126 l 397 0 "},"r":{"x_min":70,"x_max":387,"ha":399,"o":"m 70 688 l 221 688 l 221 611 l 224 611 q 286 680 250 664 q 373 696 323 696 l 387 696 l 387 536 q 366 538 375 537 q 346 539 356 539 q 253 510 286 539 q 221 409 221 482 l 221 0 l 70 0 l 70 688 "},"ж":{"x_min":20.90625,"x_max":807.09375,"ha":828,"o":"m 339 0 l 339 282 l 308 282 q 270 277 286 282 q 241 261 254 273 q 220 229 229 250 q 204 175 211 208 q 186 87 195 130 q 168 0 176 44 l 20 0 q 47 110 34 55 q 73 221 61 165 q 108 307 86 271 q 173 355 130 343 l 173 358 q 115 403 138 369 q 80 486 91 437 q 56 586 68 536 q 33 686 44 636 l 173 686 l 215 505 q 234 452 223 472 q 259 421 245 432 q 287 408 272 411 q 318 406 302 406 l 339 406 l 339 685 l 489 685 l 489 406 l 509 406 q 552 412 534 406 q 582 433 569 418 q 602 471 594 447 q 619 530 611 496 l 654 686 l 794 686 q 771 586 783 636 q 747 486 759 536 q 712 403 736 437 q 652 358 689 369 l 652 355 q 718 305 695 341 q 754 221 741 269 q 780 110 766 165 q 807 0 794 55 l 659 0 q 642 87 651 44 q 623 175 633 130 q 607 230 616 209 q 584 262 597 251 q 556 277 572 273 q 519 282 540 282 l 489 282 l 489 0 l 339 0 "},"₇":{"x_min":29,"x_max":325,"ha":333,"o":"m 162 -125 l 52 -125 l 208 356 l 129 356 l 129 297 l 29 297 l 29 453 l 325 453 l 325 369 l 162 -125 "},"x":{"x_min":6.9375,"x_max":504.203125,"ha":513,"o":"m 338 0 l 258 215 l 254 215 l 170 0 l 6 0 q 89 174 47 87 q 172 349 131 262 l 13 686 l 181 686 l 256 483 l 259 483 q 296 585 279 534 q 333 686 313 636 l 498 686 l 340 349 q 422 174 381 262 q 504 0 463 87 l 338 0 "},"è":{"x_min":46,"x_max":475,"ha":522,"o":"m 195 308 q 195 233 195 269 q 202 178 196 197 q 262 131 215 131 q 325 210 318 131 l 475 186 q 415 43 469 94 q 261 -8 361 -8 q 177 3 212 -8 q 118 35 143 15 q 80 79 94 54 q 59 129 66 104 q 52 171 55 146 q 48 224 50 196 q 46 282 47 252 q 46 338 46 312 q 50 472 46 405 q 69 574 55 538 q 137 663 89 630 q 266 697 186 697 q 422 640 369 697 q 475 478 475 583 l 475 308 l 195 308 m 207 514 q 199 475 201 502 q 196 411 197 448 l 324 411 l 324 469 q 312 528 324 502 q 262 555 300 555 q 207 514 222 555 m 261 754 l 100 987 l 223 1043 l 340 797 l 261 754 "},"Ø":{"x_min":56,"x_max":543,"ha":597,"o":"m 56 16 l 90 94 q 64 231 64 148 l 64 717 q 77 822 64 774 q 118 903 90 869 q 191 956 145 937 q 298 975 236 975 q 397 961 356 975 q 465 925 437 948 l 488 975 l 543 947 l 506 868 q 533 719 533 809 l 533 247 q 476 56 533 121 q 297 -8 419 -8 q 129 44 186 -8 l 104 -10 l 56 16 m 214 366 l 382 737 q 362 805 380 775 q 298 835 344 835 q 255 823 272 835 q 229 793 238 811 q 217 755 220 776 q 214 715 214 733 l 214 366 m 382 595 l 214 229 q 232 161 214 191 q 297 132 251 132 q 362 163 343 132 q 382 238 382 194 l 382 595 "},"÷":{"x_min":19.453125,"x_max":541.703125,"ha":563,"o":"m 371 637 q 345 574 371 601 q 283 547 319 547 q 221 574 247 547 q 195 637 195 601 q 221 699 195 673 q 283 726 247 726 q 345 699 319 726 q 371 637 371 673 m 371 176 q 345 114 371 140 q 283 88 319 88 q 221 114 247 88 q 195 176 195 140 q 221 239 195 212 q 283 267 247 267 q 345 239 319 267 q 371 176 371 212 m 541 465 l 541 347 l 19 347 l 19 465 l 541 465 "},"с":{"x_min":46,"x_max":471,"ha":498,"o":"m 259 -8 q 177 3 212 -8 q 118 33 143 14 q 80 77 94 53 q 58 129 65 101 q 51 171 54 146 q 48 224 48 196 q 46 282 47 252 q 46 337 46 312 q 47 406 46 370 q 51 473 48 441 q 58 533 54 505 q 69 577 62 561 q 138 663 90 630 q 267 697 186 697 q 420 640 371 697 q 470 483 470 583 q 395 474 433 478 q 321 464 357 470 q 305 535 321 513 q 262 558 289 558 q 206 516 221 558 q 198 461 201 502 q 195 364 195 419 l 195 314 q 195 235 195 274 q 203 178 196 197 q 223 143 209 156 q 262 130 237 130 q 321 218 321 130 q 396 207 358 211 q 471 196 433 203 q 416 45 469 99 q 259 -8 362 -8 "},"h":{"x_min":56,"x_max":489,"ha":543,"o":"m 206 625 l 211 625 q 268 674 232 654 q 344 695 304 695 q 413 681 385 695 q 458 642 442 667 q 482 585 475 618 q 489 514 489 551 l 489 0 l 338 0 l 338 475 q 272 549 338 549 q 223 528 242 549 q 205 471 205 508 l 205 0 l 56 0 l 56 1008 l 206 1008 l 206 625 "},".":{"x_min":68,"x_max":224,"ha":293,"o":"m 68 0 l 68 168 l 224 168 l 224 0 l 68 0 "},"f":{"x_min":17,"x_max":337,"ha":356,"o":"m 233 565 l 233 0 l 82 0 l 82 565 l 17 565 l 17 686 l 82 686 l 82 832 q 131 965 82 922 q 254 1009 180 1009 l 334 1009 l 334 871 l 289 871 q 247 854 262 871 q 233 811 233 837 l 233 686 l 337 686 l 337 565 l 233 565 "},"A":{"x_min":15.28125,"x_max":572.265625,"ha":586,"o":"m 419 0 l 381 202 l 204 202 q 185 101 194 151 q 168 0 176 50 l 15 0 q 112 483 63 243 q 209 967 161 723 l 376 967 l 572 0 l 419 0 m 288 743 q 259 544 275 643 q 226 342 244 444 l 358 342 l 295 743 l 288 743 "},"O":{"x_min":64,"x_max":533,"ha":597,"o":"m 382 730 q 364 803 382 771 q 298 835 347 835 q 255 823 272 835 q 229 794 238 811 q 217 755 220 776 q 214 715 214 733 l 214 229 q 232 161 214 191 q 297 132 251 132 q 362 163 343 132 q 382 238 382 194 l 382 730 m 533 247 q 476 56 533 121 q 297 -8 419 -8 q 119 53 175 -8 q 64 232 64 115 l 64 718 q 77 822 64 775 q 118 903 90 869 q 190 956 145 937 q 298 975 236 975 q 410 957 365 975 q 482 906 455 940 q 521 826 509 873 q 533 719 533 779 l 533 247 "},"3":{"x_min":56.171875,"x_max":494,"ha":562,"o":"m 415 497 q 478 432 463 475 q 494 337 494 390 l 493 226 q 432 51 493 111 q 270 -8 372 -8 q 101 56 152 -8 q 57 238 50 120 l 206 257 q 219 159 199 187 q 274 132 239 132 q 320 149 298 132 q 342 214 342 166 l 342 344 q 319 414 342 393 q 257 435 297 435 l 216 435 l 216 563 l 264 563 q 325 582 304 563 q 346 647 346 601 l 346 754 q 333 807 346 782 q 284 832 321 832 q 230 803 250 832 q 210 708 210 775 l 63 727 q 126 907 65 840 q 291 975 187 975 q 387 956 348 975 q 449 909 426 938 q 483 841 473 879 q 494 763 494 802 l 494 687 q 492 632 494 659 q 482 582 490 605 q 458 538 474 558 q 415 504 443 518 l 415 497 "},"9":{"x_min":71,"x_max":495,"ha":563,"o":"m 282 416 q 221 400 257 400 q 111 440 152 400 q 71 586 71 481 l 71 754 q 84 841 71 801 q 123 911 97 881 q 190 958 150 941 q 286 975 230 975 q 442 920 389 975 q 495 775 495 866 l 495 651 q 467 463 495 541 l 289 0 l 130 0 l 287 411 l 282 416 m 220 579 q 238 536 220 551 q 283 521 256 521 q 330 542 315 521 q 346 591 346 564 l 346 778 q 328 820 346 805 q 283 835 311 835 q 238 820 257 835 q 220 778 220 805 l 220 579 "},"l":{"x_min":59,"x_max":283,"ha":308,"o":"m 255 -8 q 168 1 205 -8 q 107 32 131 10 q 70 91 82 54 q 59 182 59 128 l 59 1008 l 210 1008 l 210 204 q 221 146 210 164 q 266 129 233 129 l 283 129 l 283 -8 l 255 -8 "},"4":{"x_min":31.65625,"x_max":522.125,"ha":562,"o":"m 461 144 l 461 0 l 315 0 l 315 144 l 31 144 l 31 270 l 237 967 l 383 967 l 183 283 l 315 283 l 315 502 l 461 502 l 461 283 l 522 283 l 522 144 l 461 144 "},"Ъ":{"x_min":18,"x_max":686,"ha":715,"o":"m 18 825 l 18 967 l 364 967 l 364 596 l 427 596 q 552 575 502 596 q 631 517 601 555 q 673 425 661 479 q 686 304 686 370 q 623 76 686 152 q 430 0 561 0 l 214 0 l 214 825 l 18 825 m 420 143 q 515 186 490 143 q 540 301 540 229 q 512 416 540 380 q 418 453 485 453 l 364 453 l 364 143 l 420 143 "},"Ü":{"x_min":67,"x_max":536,"ha":601,"o":"m 536 965 l 536 247 q 479 56 536 120 q 301 -8 423 -8 q 123 53 179 -8 q 67 232 67 115 l 67 965 l 217 965 l 217 229 q 235 161 217 191 q 300 132 254 132 q 365 163 346 132 q 385 238 385 194 l 385 965 l 536 965 m 350 1028 l 350 1175 l 481 1175 l 481 1028 l 350 1028 m 123 1028 l 123 1175 l 254 1175 l 254 1028 l 123 1028 "},"à":{"x_min":39,"x_max":482,"ha":535,"o":"m 327 54 q 271 7 304 22 q 200 -8 237 -8 q 123 8 154 -8 q 73 53 91 25 q 46 119 54 82 q 39 200 39 157 q 49 279 39 240 q 83 348 59 318 q 146 397 107 378 q 243 416 185 416 l 331 416 l 331 490 q 316 538 331 521 q 261 556 301 556 q 219 542 240 556 q 192 492 198 528 l 55 533 q 128 653 73 610 q 271 696 183 696 q 428 648 375 696 q 482 490 482 601 l 482 0 l 331 0 l 331 52 l 327 54 m 331 303 l 271 303 q 212 282 238 303 q 186 208 186 261 q 204 153 186 172 q 255 134 223 134 q 311 156 291 134 q 331 218 331 179 l 331 303 m 261 754 l 100 987 l 224 1043 l 341 797 l 261 754 "},"ó":{"x_min":46,"x_max":485,"ha":531,"o":"m 269 697 q 363 682 325 697 q 426 642 401 667 q 463 584 451 617 q 478 512 475 551 q 484 423 483 471 q 485 334 485 374 l 485 298 q 482 234 485 266 q 478 171 480 202 q 448 78 471 115 q 394 23 425 42 q 326 -3 362 3 q 255 -10 290 -10 q 171 3 207 -10 q 112 38 136 16 q 74 89 87 60 q 56 149 61 117 q 51 190 53 167 q 47 238 48 213 q 46 289 46 263 q 46 337 46 315 q 47 406 46 370 q 51 473 48 441 q 58 533 54 505 q 69 577 62 560 q 139 663 89 630 q 269 697 189 697 m 268 557 q 218 532 235 557 q 204 496 208 516 q 197 452 199 477 q 195 396 195 427 q 195 324 195 364 l 195 313 q 195 241 195 275 q 202 185 196 206 q 224 145 208 161 q 268 130 239 130 q 306 143 290 130 q 328 175 322 156 q 331 197 329 181 q 335 236 333 213 q 337 285 336 259 q 338 338 338 311 q 336 432 338 386 q 330 502 335 478 q 320 527 327 517 q 268 557 304 557 m 183 797 l 301 1043 l 425 987 l 263 754 l 183 797 "},"₀":{"x_min":42,"x_max":328,"ha":367,"o":"m 218 326 q 209 349 218 339 q 183 360 200 360 q 157 349 166 360 q 149 326 149 339 l 149 3 q 157 -19 149 -9 q 184 -30 166 -30 q 209 -19 200 -30 q 218 3 218 -9 l 218 326 m 328 -2 q 286 -96 328 -63 q 185 -129 244 -129 q 83 -96 125 -129 q 42 -2 42 -63 l 42 332 q 84 426 42 393 q 185 460 126 460 q 287 426 246 460 q 328 332 328 393 l 328 -2 "}},"cssFontWeight":"normal","ascender":1042,"underlinePosition":-75,"cssFontStyle":"normal","boundingBox":{"yMin":-287,"xMin":-84.734375,"yMax":1242,"xMax":1004},"resolution":1000,"original_font_information":{"postscript_name":"PFDinTextCompPro-Medium","version_string":"Version 2.005 2005","vendor_url":"http://www.parachute.gr","full_font_name":"PFDinTextCompPro-Medium","font_family_name":"PF Din Text Comp Pro Medium","copyright":"Copyright (c) 2002, 2005 Parachute¨, www.parachute.gr.  All rights reserved.","description":"Based on DIN 1451 the German Industrial standard by the Deutsches Institut Normung - (1936/1986)","trademark":"Din Text is a registered trademark of Parachute¨","designer":"Panos Vassiliou","designer_url":"","unique_font_identifier":"ParachuteWorldwide: PFDinTextCompPro-Medium: 2005","license_url":"http://www.parachute.gr/support.aspx?Licensing=1","license_description":"","manufacturer_name":"Parachute¨ Worldwide","font_sub_family_name":"Regular"},"descender":-348,"familyName":"PF Din Text Comp Pro","lineHeight":1667,"underlineThickness":50};
},{}],7:[function(_dereq_,module,exports){
var Class = _dereq_('klasse');

var Vector3 = _dereq_('vecmath').Vector3;
var Matrix4 = _dereq_('vecmath').Matrix4;

var triangulateShapes = _dereq_('./triangulate');
var util = _dereq_('./util');

var tmp = new Vector3();

/**
 * A glyph holds the contour and triangulated mesh of a font.
 * 
 * @param  {[type]} face     [description]
 * @param  {[type]} chr      [description]
 * @param  {[type]} size     [description]
 * @param  {[type]} steps    [description]
 * @param  {[type]} simplify [description]
 * @param  {[type]} scale)   {                   if (!chr)            throw new Error('must specify a valid character for this glyph');        if (!face)            throw new Error("must specify a typeface 'font face' for a Glyph");        simplify = typeof simplify === "number" ? simplify : Glyph.DEFAULT_SIMPLIFY;        steps = typeof steps === "number" ? steps : Glyph.DEFAULT_STEPS;        size = typeof size === "number" ? size : Glyph.DEFAULT_SIZE;        scale = typeof scale === "number" ? scale : 1.0;                var shapes = util.getShapeList(face, size, chr, steps);                if (!shapes) {            shapes = util.getShapeList(face, size, Glyph.DEFAULT_CHARACTER, steps);            if (!shapes)                throw new Error("could not find glyph '"+chr+"' or the default '"+Glyph.DEFAULT_CHARACTER+"'");        }                if (simplify > 0 [description]
 * @return {[type]}          [description]
 */
var Glyph = new Class({

    initialize: function(face, chr, size, steps, simplify, scale) {
        if (!chr)
            throw new Error('must specify a valid character for this glyph');
        if (!face)
            throw new Error("must specify a typeface 'font face' for a Glyph");
        simplify = typeof simplify === "number" ? simplify : Glyph.DEFAULT_SIMPLIFY;
        steps = typeof steps === "number" ? steps : Glyph.DEFAULT_STEPS;
        size = typeof size === "number" ? size : Glyph.DEFAULT_SIZE;
        scale = typeof scale === "number" ? scale : 1.0;

        this.character = chr;

        //Try to get our shape...
        var shapes = util.getShapeList(face, size, chr, steps);

        //If the font face doesn't support the character, what about the default?
        if (!shapes) {
            shapes = util.getShapeList(face, size, Glyph.DEFAULT_CHARACTER, steps);
            if (!shapes)
                throw new Error("could not find glyph '"+chr+"' or the default '"+Glyph.DEFAULT_CHARACTER+"'");
        }

        //now simplify the shape by a certain amount...
        if (simplify > 0) {
            for (var i=0; i<shapes.length; i++) {
                shapes[i] = shapes[i].simplify(simplify);
            }
        }

        /**
         * This is a list of Shape objects which define the simplified contour 
         * of the glyph in discrete points. This may be useful when drawing the
         * text in simple 2D, or as a stroke.
         * 
         * @type {Array} an array of Shape objects
         */
        this.shapes = shapes;

        this.bounds = {
            minX: 0,
            maxX: 0,
            minY: 0,
            maxY: 0
        };

        /**
         * This is a list of Vector3s which defines the triangulated data
         * for this glyph. The z component is zero. 
         *
         * These points are in model-space, unless otherwise transformed.
         * 
         * @type {Array}
         */
        this.points = [];

        this.triangulate(this.shapes);

        if (!Glyph.SAVE_CONTOUR) {
            for (var i=0; i<this.shapes.length; i++) {
                this.shapes[i].length = 0;
            }
            this.shapes.length = 0;
            this.shapes = null;
        }
    },

    /**
     * This is called from the constructor to triangulate the list of
     * shapes and determine the new (model-space) bounding box.
     */
    triangulate: function(shapes) {
        this.shapes = shapes || this.shapes;

        this.points.length = 0;

        //Triangulate the shape data
        var triangles = triangulateShapes(this.shapes) || [];

        //bounds are initially zero
        this.bounds.minX = 0;
        this.bounds.minY = 0;
        this.bounds.maxX = 0;
        this.bounds.maxY = 0;

        if (triangles.length > 0) {
            var minX = Number.MAX_VALUE,
                minY = Number.MAX_VALUE,
                maxX = -Number.MAX_VALUE,
                maxY = -Number.MAX_VALUE;

            for (var i=0; i<triangles.length; i++) {
                var tri = triangles[i];
                for (var k=0; k<tri.points_.length; k++) {
                    var v = new Vector3(tri.points_[k].x, tri.points_[k].y, 0);

                    minX = Math.min(minX, v.x);
                    minY = Math.min(minY, v.y);
                    maxX = Math.max(maxX, v.x);
                    maxY = Math.max(maxY, v.y);

                    this.points.push( v );
                }
            }
            this.bounds.minX = minX;
            this.bounds.minY = minY;
            this.bounds.maxX = maxX;
            this.bounds.maxY = maxY;
        }
    },

    /**
     * Runs through all points and transforms them by the given matrix.
     * This is a destructive operation; the original model-space points
     * will be lost.
     *
     * The bounding box is updated.
     * 
     * @param  {[type]} matrix [description]
     * @return {[type]}        [description]
     */
    applyTransform: function(matrix) {
        var points = this.points;
        if (points.length===0)
            return;


        var minX = Number.MAX_VALUE,
            minY = Number.MAX_VALUE,
            maxX = -Number.MAX_VALUE,
            maxY = -Number.MAX_VALUE;
        for (var i=0; i<points.length; i++) {
            var v = points[i];
            v.transformMat4(matrix);

            minX = Math.min(minX, v.x);
            minY = Math.min(minY, v.y);
            maxX = Math.max(maxX, v.x);
            maxY = Math.max(maxY, v.y);
        }
        this.bounds.minX = minX;
        this.bounds.minY = minY;
        this.bounds.maxX = maxX;
        this.bounds.maxY = maxY;
    },

    destroyContour: function() {
        if (!this.shapes)
            return;

        for (var i=0; i<this.shapes.length; i++) {
            this.shapes[i].length = 0;
        }
        this.shapes.length = 0;
        this.shapes = null;
    },

    destroy: function() {
        this.destroyContour();
        if (this.points) {
            this.points.length = 0;
            this.points = null;
        }

        // this.bounds.minX = 0;
        // this.bounds.minY = 0;
        // this.bounds.maxX = 0;
        // this.bounds.maxY = 0;
    },
});

Glyph.DEFAULT_SIZE = 12;
Glyph.DEFAULT_STEPS = 10;
Glyph.DEFAULT_SIMPLIFY = 3;
Glyph.DEFAULT_CHARACTER = '?';

Glyph.SAVE_CONTOUR = false;

module.exports = Glyph;
},{"./triangulate":11,"./util":13,"klasse":34,"vecmath":61}],8:[function(_dereq_,module,exports){
var Class = _dereq_('klasse');

var Vector2 = _dereq_('vecmath').Vector2;
var Vector3 = _dereq_('vecmath').Vector3;
var Matrix4 = _dereq_('vecmath').Matrix4;

var triangulateShapes = _dereq_('./triangulate');
var util = _dereq_('./util');

var Glyph = _dereq_('./Glyph');
var tmp = new Vector3();
var tmpMat = new Matrix4();

/**
 * Text3D represents multiple glyphs in 3D space.
 *
 * Each glyph is transformed based on its x-advance and line
 * height (for multi-line strings), which gives us a model-space
 * representation of the entire string. 
 */
var Text3D = new Class({

	initialize: function(text, face, size, steps, simplify, align, spaceWidth, letterSpacing, lineOffset) {
        size = typeof size === "number" ? size : Glyph.DEFAULT_SIZE;

        this.size = size;
		this.text = "";
		this.face = face;

        this.align = align || Text3D.Align.LEFT;

        this.glyphs = [];

        if (typeof spaceWidth !== "number") {
            var wMetric = util.getGlyphMetrics(face, size, 'W');
            this.spaceWidth = wMetric ? wMetric.xadvance : size/2;
        } else
            this.spaceWidth = spaceWidth;
        this.letterSpacing = letterSpacing||0;

        this.lineHeight = util.getFaceHeight(face, size) + lineOffset;
        
        this.wordCount = 0;

        this.bounds = { minX: 0, minY: 0, maxX: 0, maxY: 0 };
        
        this.setText(text, steps, simplify);
	},


	setText: function(text, steps, simplify) {
        text = (text||'').toString().trim();

		this.text = text;

        this.glyphs.length = 0;
        

        var size = this.size,
            face = this.face;

        this.bounds.minX = 0;
        this.bounds.minY = 0;
        this.bounds.maxX = 0;
        this.bounds.maxY = 0;

        if (this.text.length === 0)
            return;

        this.bounds.minX = Number.MAX_VALUE,
        this.bounds.minY = Number.MAX_VALUE,
        this.bounds.maxX = -Number.MAX_VALUE,
        this.bounds.maxY = -Number.MAX_VALUE;

        var xoff = 0;
        var metricsList = [];
        var offsets = [];
        var rowIdx = 0;

        var yoff = 0;


        var curWidth = 0;
        var rowWidths = [ 0 ];
        var maxWidth = 0;

        var wordIndex = 0;

        for (var i=0; i<text.length; i++) {
            var c = text.charAt(i);

            //skip chars
            if (c == '\r') {
                metricsList.push( {xadvance: 0 });
                continue;
            }

            //line chars
            if (c == '\n') {
                metricsList.push( {xadvance: 0} );
                yoff += this.lineHeight;
                xoff = 0;

                curWidth = 0;
                rowWidths.push(0);
                rowIdx++;
                wordIndex++;
                continue;
            }

            //space chars
            if (c == ' ' || c == '\t') {
                //APPLICATION SPECIFIC HACK: Fix period kerning with space
                if (i>0 && text.charAt(i-1)==='.')
                    xoff -= Text3D.PERIOD_KERNING;

                metricsList.push( {xadvance: this.spaceWidth });
                // wordIndex++;
                //Should we include space as bounds?
                continue;
            }

            var glyph = new Glyph(face, c, size, steps, simplify);
            glyph.word = wordIndex;

            var metrics = util.getGlyphMetrics(face, size, c);
            if (!metrics)
                metrics = { xadvance: 0 };

            if (i > 0)
                xoff += metricsList[i-1].xadvance + this.letterSpacing;

            curWidth = Math.max(curWidth, xoff + glyph.bounds.minX + (glyph.bounds.maxX-glyph.bounds.minX) )
            rowWidths[rowWidths.length-1] = curWidth;

            maxWidth = Math.max(maxWidth, curWidth);

            offsets.push( { x: xoff, y: yoff, row: rowIdx } );
            metricsList.push(metrics);
            
            this.glyphs.push(glyph);
        }

        this.wordCount = this.glyphs.length === 0 ? 0 : wordIndex+1;


        for (var i=0; i<this.glyphs.length; i++) {
            var glyph = this.glyphs[i];
            var xoff = offsets[i].x;
            var yoff = offsets[i].y;
            var row = offsets[i].row;

            //determine how much to center it from the left
            var width = rowWidths[row];
            
            //align center
            if (this.align === Text3D.Align.CENTER)
                xoff += (maxWidth-width)/2;
            else if (this.align === Text3D.Align.RIGHT)
                xoff += (maxWidth-width);            

            //create a transformation for this glyph
            tmpMat.idt();
            tmpMat.translate( tmp.set(xoff, yoff, 0) );

            //apply the transform so the glyph's points are now
            //part of the model-space of the entire text string
            glyph.applyTransform(tmpMat);

            this.bounds.minX = Math.min(this.bounds.minX, xoff + glyph.bounds.minX);
            this.bounds.maxX = Math.max(this.bounds.maxX, glyph.bounds.minX + (glyph.bounds.maxX - glyph.bounds.minX))
            this.bounds.minY = Math.min(this.bounds.minY, glyph.bounds.minY);
            this.bounds.maxY = Math.max(this.bounds.maxY, glyph.bounds.maxY);
        }


        this.bounds.minX = 0;
        this.bounds.maxX = maxWidth;
	},

    _maxWidth: function(offsets) {

    },

    destroy: function() {
        if (!this.glyphs)
            return;

        for (var i=0; i<this.glyphs.length; i++) {
            this.glyphs[i].destroy();
        }

        //Need to handle this more cleanly...
        // this.glyphs.length = 0;
        // this.glyphs = null;
    },
});

Text3D.Align = {
    CENTER: 'CENTER',
    LEFT: 'LEFT',
    RIGHT: 'RIGHT'
};

//hack to fix period kerning
Text3D.PERIOD_KERNING = 0;

module.exports = Text3D;
},{"./Glyph":7,"./triangulate":11,"./util":13,"klasse":34,"vecmath":61}],"bRhrlU":[function(_dereq_,module,exports){
module.exports = {
    triangulate: _dereq_('./triangulate'),
    util: _dereq_('./util'),
    Glyph: _dereq_('./Glyph'),
    Text3D: _dereq_('./Text3D')
};
},{"./Glyph":7,"./Text3D":8,"./triangulate":11,"./util":13}],"text3d":[function(_dereq_,module,exports){
module.exports=_dereq_('bRhrlU');
},{}],11:[function(_dereq_,module,exports){
var poly2tri = _dereq_('poly2tri');

function getWindingNumber(point, points_list)
{
    // The winding number counter.
    var winding_number = 0;

    for (var i = 0; i < points_list.length; ++i)             // Edge from point1 to points_list[i+1]
    {
        var point1 = points_list[i];
        var point2;

        // Wrap?
        if (i === (points_list.length - 1))
        {
            point2 = points_list[0];
        }
        else
        {
            point2 = points_list[i + 1];
        }

        if (point1.y <= point.y)                                    // start y <= point.y
        {
            if (point2.y > point.y)                                 // An upward crossing
            {
                if (Is_Left(point1, point2, point) > 0)             // Point left of edge
                {
                    ++winding_number;                               // Have a valid up intersect
                }
            }
        }
        else
        {
            // start y > point.y (no test needed)
            if (point2.y <= point.y)                                // A downward crossing
            {
                if (Is_Left(point1, point2, point) < 0)             // Point right of edge
                {
                    --winding_number;                               // Have a valid down intersect
                }
            }
        }
    }

    return winding_number;
}

function Is_Left(p0, p1, point) {
    return ((p1.x - p0.x) * (point.y - p0.y) - (point.x - p0.x) * (p1.y - p0.y));
}

function isClockwise(points) {
    var sum = 0;
    for (var i=0; i<points.length; i++) {
        var o = i===points.length-1 ? points[0] : points[i+1];
        sum += (o.x - points[i].x) * (o.y + points[i].y);
    }
    return sum > 0;
}



function indexOfPointInList(other, list) {
    for (var i=0; i<list.length; i++) {
        var p = list[i];
        if (p.x == other.x && p.y == other.y)
            return i;
    }
    return -1;
}

function isCollinear(a, b, c) {
    var r = (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y) ;
    var eps = 0.0000001;
    return Math.abs(r) < eps;
}

function asPointSet(points) {
    var contour = [];

    for (var n=0; n<points.length; n++) {
        var x = points[n].x;
        var y = points[n].y;
                
        var np = new poly2tri.Point(x, y);
        
        if (indexOfPointInList(np, contour) === -1) {
            if ( (n===0 || n===points.length-1) || !isCollinear(points[n-1], points[n], points[n+1]))
                contour.push(np);
        }
    }
    return contour;
}


function addSteinerPoints(set, sweep) {
    var points = [];

    for (var i=0; i<10; i++) {
        // var p = set[i];
        //for each point, add 4 more around it

        // var off = +0.5;
        // points.push( new poly2tri.Point( p.x + off, p.y ) );
        // sweep.addPoint( new poly2tri.Point( p.x + off/2, p.y + off ) );
        // points.push( new poly2tri.Point( p.x , p.y + off ) );
        // sweep.addPoint( new poly2tri.Point( p.x , p.y ) );

        // if (Math.random() > 0.5)
        // sweep.addPoint( new poly2tri.Point( 10*(Math.random()*2-1)+p.x, 10*(Math.random()*2-1)+p.y ) );
    }
    // points.push(set);

    // points = asPointSet(points);
    // for (var i=0; i<0 && i<points.length; i++) {
    //     sweep.addPoint(points[i]);
    // }

    // var p = set[0];
    // console.log("POINT");
    // sweep.addPoint(new poly2tri.Point(set[0].x+.5, set[0].y+.5));
    // sweep.addPoint(new poly2tri.Point(set[1].x+.5, set[1].y+.5));
    // sweep.addPoint(new poly2tri.Point(set[2].x+.5, set[2].y+.5));
    // sweep.addPoint( new poly2tri.Point(1*(Math.random()*2-1)+p.x, 1*(Math.random()*2-1)+p.y)) ;
}

/**
 * Triangulates a list of Shape objects. 
 */
module.exports = function (shapes) {
    var windingClockwise = false;
    var sweep = null;

    var poly = {holes:[], contour:[]};
    var allTris = [];

    // debugger;

    for (var j=0; j<shapes.length; j++) {
        var points = shapes[j].points;
        
        var set = asPointSet(points);

        //check the winding order
        if (j==0) {
            windingClockwise = isClockwise(set);

            var windingNumber = getWindingNumber(points[0], points);

            // console.log("POIND", j, windingClockwise, windingNumber);
        }
        
        try {
            // var set = asPointSet(points);

            //if the sweep has already been created, maybe we're on a hole?
            if (sweep !== null) {
                var clock = isClockwise(set);
                var windingNumber = getWindingNumber(points[0], points);

                // console.log("POINT", j, clock, windingNumber);

                //we have a hole...
                if (windingClockwise !== clock) {
                    sweep.addHole( set );
                    poly.holes.push(points);
                } else {
                    //no hole, so it must be a new shape.
                    //add our last shape
                    
                    addSteinerPoints(set, sweep);

                    sweep.triangulate();
                    allTris = allTris.concat(sweep.getTriangles());

                    //reset the sweep for next shape
                    sweep = new poly2tri.SweepContext(set);
                    poly = {holes:[], contour:points};
                }
            } else {
                sweep = new poly2tri.SweepContext(set);   
                poly = {holes:[], contour:points};
            }
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    //if the sweep is still setup, then triangulate it
    if (sweep !== null) {
        try {
            addSteinerPoints(set, sweep);

            sweep.triangulate();
            allTris = allTris.concat(sweep.getTriangles());
        } catch (e) {
            console.log(e);
            return null;
        }
    }
    return allTris;
}
},{"poly2tri":39}],12:[function(_dereq_,module,exports){
module.exports=_dereq_(5)
},{}],13:[function(_dereq_,module,exports){
var Vector2 = _dereq_('vecmath').Vector2;
var Shape = _dereq_('shape2d');
var _typeface_js = _dereq_('./typeface-stripped.js');

var style = {
    fontSize: 12,
    fontStretchPercent: 1.0,
    letterSpacing: 0
};
      
module.exports.getFaces = function() {
    return _typeface_js.faces;
};

//Look through the dict, return if we find 'search'
//Otherwise return
function doLookup(dict, search, defaultVal) {
    var first = null;
    var foundDefault = null;

    for (var k in dict) {
        var e = dict[k];
        if (e) {
            if (k === search)
                return e;

            //store the first..
            if (first === null)
                first = e;
            if (defaultVal && foundDefault === null && k === defaultVal)
                foundDefault = e;
        }
    }
    return foundDefault !== null ? foundDefault : first;
}

/**
 * Returns the face by the given family, weight and style.
 * If these parameters are passed, they are expected to succeed,
 * otherwise an error is thrown. If a parameter is undefined (falsy),
 * we will do a looser lookup, initially looking for 'normal' style/weight,
 * and if that isn't found, then falling back to any weight/style that is
 * available. 
 *
 * If no parameters are passed, we simply find the first font, or null
 * if no faces are loaded.
 * 
 * @param  {[type]} family [description]
 * @param  {[type]} weight [description]
 * @param  {[type]} style  [description]
 * @return {[type]}        [description]
 */
module.exports.getFace = function(family, weight, style) {
    family = (family||'').toLowerCase();

    var face = null;
    if (_typeface_js && _typeface_js.faces) {
        
        if (family && !(family in _typeface_js.faces)) {
            throw "No font with the name "+family;
        }
        //get matching font..
        var fonts = family ? _typeface_js.faces[family] : doLookup(_typeface_js.faces, family);
        
        if (weight && !(weight in fonts)) {
            throw "No '"+family+"' weight with the value "+weight;
        }
            
        var weightDict = weight ? fonts[weight] : doLookup(fonts, weight, 'normal');
        if (style && !(style in weightDict)) {
            throw "No '"+family+"' style with the type "+style;
        }
        
        face = style ? weightDict[style] : doLookup(weightDict, style, 'normal');
    }
    return face;  
};

module.exports.getFaceHeight = function(face, size) {
    style.fontSize = size; 
    return Math.round(_typeface_js.pixelsFromPoints(face, style, face.lineHeight));
}

module.exports.getFaceAscent = function(face, size) {
    style.fontSize = size;
    return Math.round(_typeface_js.pixelsFromPoints(face, style, face.ascender));   
}

module.exports.pixelsFromPoints = function(face, size, points) {
    style.fontSize = size; 
    return _typeface_js.pixelsFromPoints(face, style, typeof points === "number" ? points : 1);
};

module.exports.pointsFromPixels = function(face, size, pixels) {
    style.fontSize = size; 
    return _typeface_js.pointsFromPixels(face, style, pixels);  
};

module.exports.getGlyphMetrics = function(face, size, chr) {
    var g = face.glyphs[chr];
    if (!g || !g.o)
        return null;
    var pointScale = module.exports.pixelsFromPoints(face, size);
    return {
        xadvance: (g.ha) ? g.ha * pointScale : 0,
        height: module.exports.getFaceHeight(face, size),
        ascent: module.exports.getFaceAscent(face, size)
    };
};

function scaleAndOffset(shape, scale, offset) {
    var p = shape.points;
    for (var i=0; i<p.length; i++) {
        p[i].x = p[i].x * scale.x + offset.x;
        p[i].y = p[i].y * scale.y + offset.y;
    }
}

function getShapeList(face, size, chr, steps) {
    steps = steps || 10;
    style.fontSize = size;
    
    var glyph = face.glyphs[chr];
    if (!glyph || !glyph.o)
        return null;
    
    var shapes = [];
    var shape = new Shape();

    var curves = false, //TODO: better curve fitting; and expose it to end-user
        factor = 0.5;
    shape.approximateCurves = curves;
    shape.approximationFactor = factor;
    shape.steps = steps;

    var pointScale = _typeface_js.pixelsFromPoints(face, style, 1);
    var scl = new Vector2(pointScale * style.fontStretchPercent, -pointScale);
    var off = new Vector2(0, face.ascender*pointScale);
    
    var outline = glyph.o.split(' ');
    var outlineLength = outline.length;
    for (var i = 0; i < outlineLength; ) {
        var action = outline[i++];

        switch(action) {
            case 'm':
                if (i!==1) {
                    scaleAndOffset(shape, scl, off);
                    shapes.push(shape);

                    shape = new Shape();
                    shape.approximateCurves = curves;
                    shape.approximationFactor = factor;
                    shape.steps = steps;
                }
                shape.moveTo(outline[i++], outline[i++]);
                break;
            case 'l':
                shape.lineTo(outline[i++], outline[i++]);
                break;
            case 'q':
                var cpx = outline[i++];
                var cpy = outline[i++];
                shape.quadraticCurveTo(outline[i++], outline[i++], cpx, cpy);
                break;
            case 'b':
                var x = outline[i++];
                var y = outline[i++];
                shape.bezierCurveTo(outline[i++], outline[i++], outline[i++], outline[i++], x, y);
                break;
        }
    }
    scaleAndOffset(shape, scl, off);
    shapes.push(shape);
    return shapes;
}


module.exports.getShapeList = getShapeList;
},{"./typeface-stripped.js":12,"shape2d":45,"vecmath":61}],14:[function(_dereq_,module,exports){
var Class = _dereq_('klasse');

var util = _dereq_('./vecutil');

var Vector2 = _dereq_('vecmath').Vector2;
var Vector3 = _dereq_('vecmath').Vector3;
var Vector4 = _dereq_('vecmath').Vector4;
var Matrix4 = _dereq_('vecmath').Matrix4;

var tmpVec3 = new Vector3();
var tmpVec4 = new Vector4();

/** 
 * Abstract base class for cameras to implement.
 * @class Camera
 * @abstract
 */
var Camera = new Class({
	
    initialize: function() {
        this.direction = new Vector3(0, 0, -1);
        this.up = new Vector3(0, 1, 0);
        this.position = new Vector3();
        
        this.projection = new Matrix4();
        this.view = new Matrix4();
        this.combined = new Matrix4();
        this.invProjectionView = new Matrix4();

        this.near = 1;
        this.far = 100;

        this.ray = {
            origin: new Vector3(),
            direction: new Vector3()
        };

        this.viewportWidth = 0;
        this.viewportHeight = 0;
    },

    /**
     * Translates this camera by a specified Vector3 object
     * or x, y, z parameters. Any undefined x y z values will
     * default to zero, leaving that component unaffected.
     * 
     * @param  {[type]} vec [description]
     * @return {[type]}     [description]
     */
    translate: function(x, y, z) {
        if (typeof x === "object") {
            this.position.x += x.x || 0;
            this.position.y += x.y || 0;
            this.position.z += x.z || 0;
        } else {
            this.position.x += x || 0;
            this.position.y += y || 0;
            this.position.z += z || 0;
        }
    },

    lookAt: function(x, y, z) {
        var dir = this.direction,
            up = this.up;

        if (typeof x === "object") {
            dir.copy(x);
        } else {
            dir.set(x, y, z);
        }

        dir.sub(this.position).normalize();

        //calculate right vector
        tmpVec3.copy(dir).cross(up).normalize();

        //calculate up vector
        up.copy(tmpVec3).cross(dir).normalize();
    },

    rotate: function(radians, axis) {
        util.rotate( this.direction, axis, radians );
        util.rotate( this.up, axis, radians );
    },

    rotateAround: function(point, radians, axis) {
        tmpVec.copy(point).sub(this.position);
        this.translate( tmpVec );
        this.rotate( radians, axis );
        this.translate( tmpVec.negate() );
    },

    project: function(vec, out) {
        if (!out)
            out = new Vector4();

        //TODO: support viewport XY
        var viewportWidth = this.viewportWidth,
            viewportHeight = this.viewportHeight,
            n = Camera.NEAR_RANGE,
            f = Camera.FAR_RANGE;

        // for useful Z and W values we should do the usual steps...
        //    clip space -> NDC -> window coords

        //implicit 1.0 for w component
        tmpVec4.set(vec.x, vec.y, vec.z, 1.0);
        
        //transform into clip space
        tmpVec4.transformMat4( this.combined );
        
        //now into NDC
        tmpVec4.x = tmpVec4.x / tmpVec4.w;
        tmpVec4.y = tmpVec4.y / tmpVec4.w;
        tmpVec4.z = tmpVec4.z / tmpVec4.w;
        
        //and finally into window coordinates
        out.x = viewportWidth/2 * tmpVec4.x + (0 + viewportWidth/2);
        out.y = viewportHeight/2 * tmpVec4.y + (0 + viewportHeight/2);
        out.z = (f-n)/2 * tmpVec4.z + (f+n)/2;

        //if the out vector has a fourth component, we also store (1/clip.w)
        //same idea as gl_FragCoord.w
        if (out.w === 0 || out.w)
            out.w = 1/tmpVec4.w;
        
        return out;
    },

    unproject: function(vec, out) {
        if (!out)
            out = new Vector3();

        var viewport = tmpVec4.set(0, 0, this.viewportWidth, this.viewportHeight);
        return out.copy(vec).unproject( viewport, this.invProjectionView );
    },

    getPickRay: function(x, y) {
        var origin = this.ray.origin.set(x, y, 0),
            direction = this.ray.direction.set(x, y, 1),
            viewport = tmpVec4.set(0, 0, this.viewportWidth, this.viewportHeight),
            mtx = this.invProjectionView;

        origin.unproject(viewport, mtx);
        direction.unproject(viewport, mtx);

        direction.sub(origin).normalize();
        return this.ray;
    },

    update: function() {
        //left empty for subclasses
    }
});

Camera.FAR_RANGE = 1.0;
Camera.NEAR_RANGE = 0.0;

// Regarding method overloading. It introduces a slow-down,
// but presumably this is negligible compared to the benefit of convenience.
// Besides, this is a high-level API!
// http://jsperf.com/arguments-length-perf

module.exports = Camera;



},{"./vecutil":18,"klasse":34,"vecmath":61}],15:[function(_dereq_,module,exports){
var Class = _dereq_('klasse');

var Vector3 = _dereq_('vecmath').Vector3;
var Vector4 = _dereq_('vecmath').Vector4;
var Matrix4 = _dereq_('vecmath').Matrix4;

var Camera = _dereq_('./Camera');

var tmpVec3 = new Vector3();

var OrthographicCamera = new Class({

	Extends: Camera,

	initialize: function(viewportWidth, viewportHeight) {
		Camera.call(this);
		this.viewportWidth = viewportWidth||0;
		this.viewportHeight = viewportHeight||0;

		this.zoom = 1.0;
		this.near = 0;
		this.update();
	},

	setToOrtho: function(yDown, viewportWidth, viewportHeight) {
		var zoom = this.zoom;
		viewportWidth = typeof viewportWidth === "number" ? viewportWidth : this.viewportWidth;
		viewportHeight = typeof viewportHeight === "number" ? viewportHeight : this.viewportHeight;

		this.up.set(0, yDown ? -1 : 1, 0);
		this.direction.set(0, 0, yDown ? 1 : -1);
		this.position.set(zoom * viewportWidth/2, zoom * viewportHeight/2, 0);

		this.viewportWidth = viewportWidth;
		this.viewportHeight = viewportHeight;
		this.update();
	},

	update: function() {
		//TODO: support x/y offset
		var w = this.viewportWidth,
			h = this.viewportHeight,
			near = Math.abs(this.near),
			far = Math.abs(this.far),
			zoom = this.zoom;

		this.projection.ortho(
					zoom * -w/2, zoom * w/2, 
					zoom * -h/2, zoom * h/2,
					near, far);		
		

		//build the view matrix 
		tmpVec3.copy(this.position).add(this.direction);
		this.view.lookAt(this.position, tmpVec3, this.up);


		//projection * view matrix
		this.combined.copy(this.projection).mul(this.view);

		//invert combined matrix, used for unproject
		this.invProjectionView.copy(this.combined).invert();
	}
});

module.exports = OrthographicCamera;
},{"./Camera":14,"klasse":34,"vecmath":61}],16:[function(_dereq_,module,exports){
var Class = _dereq_('klasse');

var Matrix4 = _dereq_('vecmath').Matrix4;
var Vector2 = _dereq_('vecmath').Vector2;
var Vector3 = _dereq_('vecmath').Vector3;
var Camera = _dereq_('./Camera');

var tmpVec3 = new Vector3();

var dirvec = null,
    rightvec = null,
    billboardMatrix = null;

var PerspectiveCamera = new Class({

	Extends: Camera,

	//fov in RADIANS!
	initialize: function(fieldOfView, viewportWidth, viewportHeight) {
		Camera.call(this);
		this.viewportWidth = viewportWidth;
		this.viewportHeight = viewportHeight;

        this.billboardMatrixDirty = true;

		this.fieldOfView = fieldOfView;
		this.update();
	},

	/**
	 * This method sets the width and height of the viewport.
	 * 
	 * @method  setViewport
	 * @param {Number} width  the viewport width
	 * @param {Number} height the viewport height
	 */
	setViewport: function(width, height) {
		this.viewportWidth = width;
		this.viewportHeight = height;
	},

    /**
     * This is a helper function to determine the scaling factor
     * for 2D billboard sprites when projected in 3D space. 
     *
     * @param  {vec3} position     the 3D position
     * @param  {vec2} originalSize the 2D sprite size
     * @return {vec2}              the output size
     */
    // projectedScale: function(position, originalSize, out) {
    // },



    updateBillboardMatrix: function() {
        if (!dirvec) {
            dirvec = new Vector3();
            rightvec = new Vector3();
            billboardMatrix = new Matrix4();
        }


        var dir = dirvec.set(this.direction).negate();

        // Better view-aligned billboards might use this:
        // var dir = tmp.set(camera.position).sub(p).normalize();
        
        var right = rightvec.set(this.up).cross(dir).normalize();
        var up = tmpVec3.set(dir).cross(right).normalize();

        var out = billboardMatrix.val;
        out[0] = right.x;
        out[1] = right.y;
        out[2] = right.z;
        out[3] = 0;
        out[4] = up.x;
        out[5] = up.y;
        out[6] = up.z;
        out[7] = 0;
        out[8] = dir.x;
        out[9] = dir.y;
        out[10] = dir.z;
        out[11] = 0;
        out[12] = 0;
        out[13] = 0;
        out[14] = 0;
        out[15] = 1;

        this.billboardMatrixDirty = false;
    },

    /**
     * This is a utility function for canvas 3D rendering, 
     * which determines the "point size" of a camera-facing
     * sprite billboard given its 3D world position 
     * (origin at center of sprite) and its world width
     * and height in x/y. 
     *
     * We place into the output Vector2 the scaled width
     * and height. If no `out` is specified, a new Vector2
     * will be created for convenience (this should be avoided 
     * in tight loops).
     * 
     * @param  {Vector3} vec the position of the 3D sprite
     * @param  {Vector2} size the x and y dimensions of the sprite
     * @param  {Vector2} out the result, scaled x and y dimensions in 3D space
     * @return {Vector2} returns the out parameter, or a new Vector2 if none was given    
     */
    getPointSize: function(vec, size, out) {
        //TODO: optimize this with a simple distance calculation:
        //https://developer.valvesoftware.com/wiki/Field_of_View

        if (!out)
            out = new Vector2();

        if (this.billboardMatrixDirty)
            this.updateBillboardMatrix();

        var tmp = tmpVec3;

        var dx = size.x/2;
        var dy = size.y/2;

        tmp.set(-dx, -dy, 0).transformMat4(billboardMatrix).add(vec);
        this.project(tmp, tmp);

        var tlx = tmp.x;
        var tly = tmp.y;

        tmp.set(dx, dy, 0).transformMat4(billboardMatrix).add(vec);
        this.project(tmp, tmp);

        var brx = tmp.x;
        var bry = tmp.y;

        var w = Math.abs(brx - tlx);
        var h = Math.abs(bry - tly);
        return out.set(w, h);
    },

	update: function() {
		var aspect = this.viewportWidth / this.viewportHeight;

		//create a perspective matrix for our camera
		this.projection.perspective(this.fieldOfView, aspect, 
							Math.abs(this.near), Math.abs(this.far));

		//build the view matrix 
		tmpVec3.copy(this.position).add(this.direction);
		this.view.lookAt(this.position, tmpVec3, this.up);

		//projection * view matrix
		this.combined.copy(this.projection).mul(this.view);

		//invert combined matrix, used for unproject
		this.invProjectionView.copy(this.combined).invert();

        this.billboardMatrixDirty = true;
	}
});

module.exports = PerspectiveCamera;
},{"./Camera":14,"klasse":34,"vecmath":61}],17:[function(_dereq_,module,exports){
module.exports = {
	vecutil: _dereq_('./vecutil'),
	Camera: _dereq_('./Camera'),
    PerspectiveCamera: _dereq_('./PerspectiveCamera'),
    OrthographicCamera: _dereq_('./OrthographicCamera')
};
},{"./Camera":14,"./OrthographicCamera":15,"./PerspectiveCamera":16,"./vecutil":18}],18:[function(_dereq_,module,exports){

var Vector3 = _dereq_('vecmath').Vector3;
var Matrix4 = _dereq_('vecmath').Matrix4;
var Quaternion = _dereq_('vecmath').Quaternion;

var tmpMat4 = new Matrix4();
var tmpQuat = new Quaternion();
var tmpVec3 = new Vector3();

var util = {};

/**
 * Rotates a vector in place by axis angle.
 *
 * This is the same as transforming a point by an 
 * axis-angle quaternion, but it has higher precision.
 * 
 * @param  {Vector3} vec     [description]
 * @param  {Vector3} axis    [description]
 * @param  {float} radians [description]
 * @return {Vector3}         [description]
 */
util.rotate = function(vec, axis, radians) {
    //set the quaternion to our axis angle
    tmpQuat.setAxisAngle(axis, radians);

    //create a rotation matrix from the axis angle
    tmpMat4.fromRotationTranslation( tmpQuat, tmpVec3.set(0, 0, 0) );

    //multiply our vector by the rotation matrix
    return vec.transformMat4( tmpMat4 );
};

module.exports = util;
},{"vecmath":61}],19:[function(_dereq_,module,exports){
/** Utility function for linear interpolation. */
module.exports.lerp = function(v0, v1, t) {
    return v0*(1-t)+v1*t;
};

/** Utility function for Hermite interpolation. */
module.exports.smoothstep = function(v0, v1, t) {
    // Scale, bias and saturate x to 0..1 range
    t = Math.max(0.0, Math.min(1.0, (t - v0)/(v1 - v0) ));
    // Evaluate polynomial
    return t*t*(3 - 2*t);
};
},{}],20:[function(_dereq_,module,exports){
module.exports = {
    MeshRenderer: _dereq_('./lib/MeshRenderer'),
};
},{"./lib/MeshRenderer":21}],21:[function(_dereq_,module,exports){
var Class = _dereq_('klasse');
var Mesh = _dereq_('kami').Mesh;
var ShaderProgram = _dereq_('kami').ShaderProgram;

var Matrix4 = _dereq_('vecmath').Matrix4;
var colorToFloat = _dereq_('number-util').colorToFloat;


////TODOS:
/// - use BaseBatch as a mixin for flush/begin/etc.
/// - rename to VertexRenderer? ImmediateModeRenderer?

/**
 * An immediate mode mesh renderer, mostly straight from LibGDX:
 * https://github.com/libgdx/libgdx/blob/master/gdx/src/com/badlogic/gdx/graphics/glutils/ImmediateModeRenderer20.java
 * 
 * This is mainly useful for prototyping.
 *
 * The options and their defaults:
 *
 * @class  MeshRenderer
 * @constructor
 * @param {WebGLContext} context the WebGLContext for management
 * @param {Object} options the optional set of options
 * @param {Boolean} options.hasNormals whether the renderer should write normals; default false
 * @param {Boolean} options.hasColors whether the renderer should write colors; default false
 * @param {Number} options.numTexCoords the number of texture coordinates to write. defaults to zero (no texcoords)
 * @param {Number} options.maxVertices the maximum number of vertices for this renderer, default 500
 */
var MeshRenderer = new Class({

    initialize: function(context, options) {
        this.context = context;
        if (!context)
            throw new Error("no WebGLContext specified to MeshRenderer");

        options = options || {};

        var hasNormals = typeof options.hasNormals !== "undefined" ? options.hasNormals : false;
        var hasColors = typeof options.hasColors !== "undefined" ? options.hasColors : false;
        this.numTexCoords = options.numTexCoords || 0;
        this.maxVertices = typeof options.maxVertices === "number" ? options.maxVertices : 500;

        var attribs = this._createVertexAttributes(hasNormals, hasColors);
        this.mesh = new Mesh(context, false, this.maxVertices, 0, attribs);

        //offset in FLOATS from start of vertex
        this.normalOffset = hasNormals ? 3 : 0;
        this.colorOffset = hasColors ? (this.normalOffset + 3) : 0;
        this.texCoordOffset = this.numTexCoords > 0 ? (this.colorOffset + 1) : 0;
        
        this.numSetTexCoords = 0;
        this.vertices = this.mesh.vertices;
        this.vertexSize = this.mesh.vertexStride / 4;

        this.primitiveType = context.gl.TRIANGLES;

        this.premultiplied = true;
        this.vertexIdx = 0;
        this.numVertices = 0;

        this.projModelView = new Matrix4();
        this._shader = MeshRenderer.createDefaultShader(context, hasNormals, hasColors, this.numTexCoords);


        /**
         * This shader will be used whenever "null" is passed
         * as the renderer's shader. 
         *
         * @property {ShaderProgram} shader
         */
        this.defaultShader = this._shader;

        /**
         * By default, a MeshRenderer is created with its own ShaderProgram,
         * stored in `defaultShader`. If this flag is true, on deleting the MeshRenderer, its
         * `defaultShader` will also be deleted. If this flag is false, no shaders
         * will be deleted on destroy.
         *
         * Note that if you re-assign `defaultShader`, you will need to dispose the previous
         * default shader yoursel. 
         *
         * @property ownsShader
         * @type {Boolean}
         */
        this.ownsShader = true;
    },


    destroy: function() {
        if (this.ownsShader && this.defaultShader)
            this.defaultShader.destroy();
        if (this.mesh)
            this.mesh.destroy();

        this.defaultShader = null;
        this._shader = null;
        this.mesh = null;
        this.context = null;
    },

    /**
     * This is a setter/getter for this renderer's current ShaderProgram.
     * 
     * If `null` or a falsy value is specified, the batch's `defaultShader` will be used. 
     *
     * Note that shaders are bound on renderer.begin().
     *
     * @property shader
     * @type {ShaderProgram}
     */
    shader: {
        set: function(val) {

            this._shader = val ? val : this.defaultShader;

            if (this.drawing) {
                this._shader.bind();
                this.uploadMatrices();
            }
        },

        get: function() {
            return this._shader;
        }
    },

    _createVertexAttributes: function(hasNormals, hasColors) {
        var gl = this.context.gl;
        var attribs = [
            new Mesh.Attrib(ShaderProgram.POSITION_ATTRIBUTE, 3)
        ];

        if (hasNormals)
            attribs.push( new Mesh.Attrib(ShaderProgram.NORMAL_ATTRIBUTE, 3) );
        if (hasColors)
            attribs.push( new Mesh.Attrib(ShaderProgram.COLOR_ATTRIBUTE, 4, null, gl.UNSIGNED_BYTE, true, 1) );

        for (var i = 0; i < this.numTexCoords; i++) {
            attribs.push( new Mesh.Attrib(ShaderProgram.TEXCOORD_ATTRIBUTE+i, 2) );
        }

        return attribs;
    },

    begin: function(projModelView, primitiveType) {
        if (this.drawing) 
            throw "batch.end() must be called before begin";
        this.drawing = true;

        if (projModelView)
            this.projModelView.set(projModelView);
        this.primitiveType = typeof primitiveType === "undefined" ? this.context.gl.TRIANGLES : primitiveType;

        var shader = this._shader;
        shader.bind();
        this.uploadMatrices();
    },

    uploadMatrices: function() {
        var shader = this._shader;
        shader.setUniformMatrix4("u_projModelView", this.projModelView);
        for (var i=0; i<this.numTexCoords; i++) {
            shader.setUniformi("u_sampler"+i, i);
        }
    },

    color: function(r, g, b, a) {
        var rnum = typeof r === "number";
        if (rnum
                && typeof g === "number"
                && typeof b === "number") {
            //default alpha to one 
            a = (a || a === 0) ? a : 1.0;
        } else {
            r = g = b = a = rnum ? r : 1.0;
        }
        

        if (this.premultiplied) {
            r *= a;
            g *= a;
            b *= a;
        }
        
        var color = colorToFloat(
            ~~(r * 255),
            ~~(g * 255),
            ~~(b * 255),
            ~~(a * 255)
        );
        this.vertices[ this.vertexIdx + this.colorOffset ] = color;
    },

    texCoord: function(u, v) {
        var idx = this.vertexIdx + this.texCoordOffset;
        this.vertices[ idx + this.numSetTexCoords ] = u || 0;
        this.vertices[ idx + this.numSetTexCoords + 1 ] = v || 0;
        this.numSetTexCoords += 2;
    },

    normal: function(x, y, z) {
        var idx = this.vertexIdx + this.normalOffset;
        this.vertices[ idx ] = x || 0;
        this.vertices[ idx + 1 ] = y || 0;
        this.vertices[ idx + 2 ] = z || 0;
    },

    vertex: function(x, y, z) {
        var idx = this.vertexIdx;
        this.vertices[ idx ] = x || 0;
        this.vertices[ idx + 1 ] = y || 0;
        this.vertices[ idx + 2 ] = z || 0;

        this.numSetTexCoords = 0;
        this.vertexIdx += this.vertexSize;
        this.numVertices++;
    },

    end: function() {
        //TODO: allow flushing and check for size like SpriteBatch
        if (!this.drawing)
            throw "renderer.begin() must be called before end";

        this.drawing = false;
        
        if (this.numVertices === 0)
            return;

        var shader = this._shader,
            gl = this.context.gl;

        this.mesh.bind(shader);

        this.mesh.verticesDirty = true;
        this.mesh.draw(this.primitiveType, this.vertexIdx * 4 / this.mesh.vertexStride, 0, this.vertexIdx);

        this.mesh.unbind(shader);

        this.numSetTexCoords = 0;
        this.vertexIdx = 0;
        this.numVertices = 0;
    }
});

//little shader builder from LibGDX..
MeshRenderer.createDefaultShader = function(context, hasNormals, hasColors, numTexCoords) {
    var vertSrc = MeshRenderer.createVertexShader(hasNormals, hasColors, numTexCoords);
    var fragSrc = MeshRenderer.createFragmentShader(hasColors, numTexCoords);
    return new ShaderProgram(context, vertSrc, fragSrc);
};

MeshRenderer.createVertexShader = function(hasNormals, hasColors, numTexCoords) {
    numTexCoords = numTexCoords || 0;
    var shader = "";
    shader += "attribute vec4 "+ShaderProgram.POSITION_ATTRIBUTE+";\n"
         + (hasNormals ? "attribute vec3 " + ShaderProgram.NORMAL_ATTRIBUTE + ";\n" : "")
         + (hasColors ? "attribute vec4 " + ShaderProgram.COLOR_ATTRIBUTE + ";\n" : "");

    var i;

    for (i = 0; i < numTexCoords; i++) {
        shader += "attribute vec2 " + ShaderProgram.TEXCOORD_ATTRIBUTE + i + ";\n";
    }

    shader += "uniform mat4 u_projModelView;\n";
    
    shader += (hasColors ? "varying vec4 v_col;\n" : "");

    for (i = 0; i < numTexCoords; i++) {
        shader += "varying vec2 v_tex" + i + ";\n";
    }

    shader += "void main() {\n" + "   gl_Position = u_projModelView * " + ShaderProgram.POSITION_ATTRIBUTE + ";\n"
            + (hasColors ? "   v_col = " + ShaderProgram.COLOR_ATTRIBUTE + ";\n" : "");

    for (i = 0; i < numTexCoords; i++) {
        shader += "   v_tex" + i + " = " + ShaderProgram.TEXCOORD_ATTRIBUTE + i + ";\n";
    }
    shader += "   gl_PointSize = 1.0;\n";
    shader += "}\n";

    return shader;
};

MeshRenderer.createFragmentShader = function(hasColors, numTexCoords) {
    numTexCoords = numTexCoords || 0;
    var shader = "#ifdef GL_ES\n" + "precision mediump float;\n" + "#endif\n";
 
    if (hasColors) 
        shader += "varying vec4 v_col;\n";

    var i;
    for (i = 0; i < numTexCoords; i++) {
            shader += "varying vec2 v_tex" + i + ";\n";
            shader += "uniform sampler2D u_sampler" + i + ";\n";
    }

    shader += "void main() {\n" + "   gl_FragColor = " + (hasColors ? "v_col" : "vec4(1, 1, 1, 1)");

    if (numTexCoords > 0) shader += " * ";

    for (i = 0; i < numTexCoords; i++) {
            if (i == numTexCoords - 1) {
                    shader += " texture2D(u_sampler" + i + ",  v_tex" + i + ")";
            } else {
                    shader += " texture2D(u_sampler" + i + ",  v_tex" + i + ") *";
            }
    }

    shader += ";\n}";
    return shader;
};

module.exports = MeshRenderer;
},{"kami":31,"klasse":34,"number-util":22,"vecmath":61}],22:[function(_dereq_,module,exports){
var int8 = new Int8Array(4);
var int32 = new Int32Array(int8.buffer, 0, 1);
var float32 = new Float32Array(int8.buffer, 0, 1);

/**
 * A singleton for number utilities. 
 * @class NumberUtil
 */
var NumberUtil = function() {

};


/**
 * Returns a float representation of the given int bits. ArrayBuffer
 * is used for the conversion.
 *
 * @method  intBitsToFloat
 * @static
 * @param  {Number} i the int to cast
 * @return {Number}   the float
 */
NumberUtil.intBitsToFloat = function(i) {
	int32[0] = i;
	return float32[0];
};

/**
 * Returns the int bits from the given float. ArrayBuffer is used
 * for the conversion.
 *
 * @method  floatToIntBits
 * @static
 * @param  {Number} f the float to cast
 * @return {Number}   the int bits
 */
NumberUtil.floatToIntBits = function(f) {
	float32[0] = f;
	return int32[0];
};

/**
 * Encodes ABGR int as a float, with slight precision loss.
 *
 * @method  intToFloatColor
 * @static
 * @param {Number} value an ABGR packed integer
 */
NumberUtil.intToFloatColor = function(value) {
	return NumberUtil.intBitsToFloat( value & 0xfeffffff );
};

/**
 * Returns a float encoded ABGR value from the given RGBA
 * bytes (0 - 255). Useful for saving bandwidth in vertex data.
 *
 * @method  colorToFloat
 * @static
 * @param {Number} r the Red byte (0 - 255)
 * @param {Number} g the Green byte (0 - 255)
 * @param {Number} b the Blue byte (0 - 255)
 * @param {Number} a the Alpha byte (0 - 255)
 * @return {Float32}  a Float32 of the RGBA color
 */
NumberUtil.colorToFloat = function(r, g, b, a) {
	var bits = (a << 24 | b << 16 | g << 8 | r);
	return NumberUtil.intToFloatColor(bits);
};

/**
 * Returns true if the number is a power-of-two.
 *
 * @method  isPowerOfTwo
 * @param  {Number}  n the number to test
 * @return {Boolean}   true if power-of-two
 */
NumberUtil.isPowerOfTwo = function(n) {
	return (n & (n - 1)) === 0;
};

/**
 * Returns the next highest power-of-two from the specified number. 
 * 
 * @param  {Number} n the number to test
 * @return {Number}   the next highest power of two
 */
NumberUtil.nextPowerOfTwo = function(n) {
	n--;
	n |= n >> 1;
	n |= n >> 2;
	n |= n >> 4;
	n |= n >> 8;
	n |= n >> 16;
	return n+1;
};

module.exports = NumberUtil;
},{}],23:[function(_dereq_,module,exports){
/**
 * The core kami module provides basic 2D sprite batching and 
 * asset management.
 * 
 * @module kami
 */

var Class = _dereq_('klasse');
var Mesh = _dereq_('./glutils/Mesh');

var colorToFloat = _dereq_('number-util').colorToFloat;

/** 
 * A batcher mixin composed of quads (two tris, indexed). 
 *
 * This is used internally; users should look at 
 * {{#crossLink "SpriteBatch"}}{{/crossLink}} instead, which inherits from this
 * class.
 * 
 * The batcher itself is not managed by WebGLContext; however, it makes
 * use of Mesh and Texture which will be managed. For this reason, the batcher
 * does not hold a direct reference to the GL state.
 *
 * Subclasses must implement the following:  
 * {{#crossLink "BaseBatch/_createShader:method"}}{{/crossLink}}  
 * {{#crossLink "BaseBatch/_createVertexAttributes:method"}}{{/crossLink}}  
 * {{#crossLink "BaseBatch/getVertexSize:method"}}{{/crossLink}}  
 * 
 * @class  BaseBatch
 * @constructor
 * @param {WebGLContext} context the context this batcher belongs to
 * @param {Number} size the optional size of this batch, i.e. max number of quads
 * @default  500
 */
var BaseBatch = new Class({

	//Constructor
	initialize: function BaseBatch(context, size) {
		if (typeof context !== "object")
			throw "GL context not specified to SpriteBatch";
		this.context = context;

		this.size = size || 500;
		
		// 65535 is max index, so 65535 / 6 = 10922.
		if (this.size > 10922)  //(you'd have to be insane to try and batch this much with WebGL)
			throw "Can't have more than 10922 sprites per batch: " + this.size;
				
		
		
		this._blendSrc = this.context.gl.ONE;
		this._blendDst = this.context.gl.ONE_MINUS_SRC_ALPHA
		this._blendingEnabled = true;
		this._shader = this._createShader();

		/**
		 * This shader will be used whenever "null" is passed
		 * as the batch's shader. 
		 *
		 * @property {ShaderProgram} shader
		 */
		this.defaultShader = this._shader;

		/**
		 * By default, a SpriteBatch is created with its own ShaderProgram,
		 * stored in `defaultShader`. If this flag is true, on deleting the SpriteBatch, its
		 * `defaultShader` will also be deleted. If this flag is false, no shaders
		 * will be deleted on destroy.
		 *
		 * Note that if you re-assign `defaultShader`, you will need to dispose the previous
		 * default shader yoursel. 
		 *
		 * @property ownsShader
		 * @type {Boolean}
		 */
		this.ownsShader = true;

		this.idx = 0;

		/**
		 * Whether we are currently drawing to the batch. Do not modify.
		 * 
		 * @property {Boolean} drawing
		 */
		this.drawing = false;

		this.mesh = this._createMesh(this.size);


		/**
		 * The ABGR packed color, as a single float. The default
		 * value is the color white (255, 255, 255, 255).
		 *
		 * @property {Number} color
		 * @readOnly 
		 */
		this.color = colorToFloat(255, 255, 255, 255);
		
		/**
		 * Whether to premultiply alpha on calls to setColor. 
		 * This is true by default, so that we can conveniently write:
		 *
		 *     batch.setColor(1, 0, 0, 0.25); //tints red with 25% opacity
		 *
		 * If false, you must premultiply the colors yourself to achieve
		 * the same tint, like so:
		 *
		 *     batch.setColor(0.25, 0, 0, 0.25);
		 * 
		 * @property premultiplied
		 * @type {Boolean}
		 * @default  true
		 */
		this.premultiplied = true;
	},

	/**
	 * A property to enable or disable blending for this sprite batch. If
	 * we are currently drawing, this will first flush the batch, and then
	 * update GL_BLEND state (enabled or disabled) with our new value.
	 * 
	 * @property {Boolean} blendingEnabled
	 */
	blendingEnabled: {
		set: function(val) {
			var old = this._blendingEnabled;
			if (this.drawing)
				this.flush();

			this._blendingEnabled = val;

			//if we have a new value, update it.
			//this is because blend is done in begin() / end() 
			if (this.drawing && old != val) {
				var gl = this.context.gl;
				if (val)
					gl.enable(gl.BLEND);
				else
					gl.disable(gl.BLEND);
			}

		},

		get: function() {
			return this._blendingEnabled;
		}
	},

	/**
	 * Sets the blend source parameters. 
	 * If we are currently drawing, this will flush the batch.
	 *
	 * Setting either src or dst to `null` or a falsy value tells the SpriteBatch
	 * to ignore gl.blendFunc. This is useful if you wish to use your
	 * own blendFunc or blendFuncSeparate. 
	 * 
	 * @property {GLenum} blendDst 
	 */
	blendSrc: {
		set: function(val) {
			if (this.drawing)
				this.flush();
			this._blendSrc = val;
		},

		get: function() {
			return this._blendSrc;
		}
	},

	/**
	 * Sets the blend destination parameters. 
	 * If we are currently drawing, this will flush the batch.
	 *
	 * Setting either src or dst to `null` or a falsy value tells the SpriteBatch
	 * to ignore gl.blendFunc. This is useful if you wish to use your
	 * own blendFunc or blendFuncSeparate. 
	 *
	 * @property {GLenum} blendSrc 
	 */
	blendDst: {
		set: function(val) {
			if (this.drawing)
				this.flush();
			this._blendDst = val;
		},

		get: function() {
			return this._blendDst;
		}
	},

	/**
	 * Sets the blend source and destination parameters. This is 
	 * a convenience function for the blendSrc and blendDst setters.
	 * If we are currently drawing, this will flush the batch.
	 *
	 * Setting either to `null` or a falsy value tells the SpriteBatch
	 * to ignore gl.blendFunc. This is useful if you wish to use your
	 * own blendFunc or blendFuncSeparate. 
	 *
	 * @method  setBlendFunction
	 * @param {GLenum} blendSrc the source blend parameter
	 * @param {GLenum} blendDst the destination blend parameter
	 */
	setBlendFunction: function(blendSrc, blendDst) {
		this.blendSrc = blendSrc;
		this.blendDst = blendDst;
	},

	/**
	 * This is a setter/getter for this batch's current ShaderProgram.
	 * If this is set when the batch is drawing, the state will be flushed
	 * to the GPU and the new shader will then be bound.
	 *
	 * If `null` or a falsy value is specified, the batch's `defaultShader` will be used. 
	 *
	 * Note that shaders are bound on batch.begin().
	 *
	 * @property shader
	 * @type {ShaderProgram}
	 */
	shader: {
		set: function(val) {
			var wasDrawing = this.drawing;

			if (wasDrawing) {
				this.end(); //unbinds the shader from the mesh
			}

			this._shader = val ? val : this.defaultShader;

			if (wasDrawing) {
				this.begin();
			}
		},

		get: function() {
			return this._shader;
		}
	},

	/**
	 * Sets the color of this sprite batcher, which is used in subsequent draw
	 * calls. This does not flush the batch.
	 *
	 * If r, g, b, are all numbers, this method assumes that RGB 
	 * or RGBA float values (0.0 to 1.0) are being passed. Alpha defaults to one
	 * if undefined.
	 * 
	 * If the first three arguments are not numbers, we only consider the first argument
	 * and assign it to all four components -- this is useful for setting transparency 
	 * in a premultiplied alpha stage. 
	 * 
	 * If the first argument is invalid or not a number,
	 * the color defaults to (1, 1, 1, 1).
	 *
	 * @method  setColor
	 * @param {Number} r the red component, normalized
	 * @param {Number} g the green component, normalized
	 * @param {Number} b the blue component, normalized
	 * @param {Number} a the alpha component, normalized
	 */
	setColor: function(r, g, b, a) {
		var rnum = typeof r === "number";
		if (rnum
				&& typeof g === "number"
				&& typeof b === "number") {
			//default alpha to one 
			a = (a || a === 0) ? a : 1.0;
		} else {
			r = g = b = a = rnum ? r : 1.0;
		}
		
		if (this.premultiplied) {
			r *= a;
			g *= a;
			b *= a;
		}
		
		this.color = colorToFloat(
			~~(r * 255),
			~~(g * 255),
			~~(b * 255),
			~~(a * 255)
		);
	},

	/**
	 * Called from the constructor to create a new Mesh 
	 * based on the expected batch size. Should set up
	 * verts & indices properly.
	 *
	 * Users should not call this directly; instead, it
	 * should only be implemented by subclasses.
	 * 
	 * @method _createMesh
	 * @param {Number} size the size passed through the constructor
	 */
	_createMesh: function(size) {
		//the total number of floats in our batch
		var numVerts = size * 4 * this.getVertexSize();
		//the total number of indices in our batch
		var numIndices = size * 6;
		var gl = this.context.gl;

		//vertex data
		this.vertices = new Float32Array(numVerts);
		//index data
		this.indices = new Uint16Array(numIndices); 
		
		for (var i=0, j=0; i < numIndices; i += 6, j += 4) 
		{
			this.indices[i + 0] = j + 0; 
			this.indices[i + 1] = j + 1;
			this.indices[i + 2] = j + 2;
			this.indices[i + 3] = j + 0;
			this.indices[i + 4] = j + 2;
			this.indices[i + 5] = j + 3;
		}

		var mesh = new Mesh(this.context, false, 
						numVerts, numIndices, this._createVertexAttributes());
		mesh.vertices = this.vertices;
		mesh.indices = this.indices;
		mesh.vertexUsage = gl.DYNAMIC_DRAW;
		mesh.indexUsage = gl.STATIC_DRAW;
		mesh.dirty = true;
		return mesh;
	},

	/**
	 * Returns a shader for this batch. If you plan to support
	 * multiple instances of your batch, it may or may not be wise
	 * to use a shared shader to save resources.
	 * 
	 * This method initially throws an error; so it must be overridden by
	 * subclasses of BaseBatch.
	 *
	 * @method  _createShader
	 * @return {Number} the size of a vertex, in # of floats
	 */
	_createShader: function() {
		throw "_createShader not implemented"
	},	

	/**
	 * Returns an array of vertex attributes for this mesh; 
	 * subclasses should implement this with the attributes 
	 * expected for their batch.
	 *
	 * This method initially throws an error; so it must be overridden by
	 * subclasses of BaseBatch.
	 *
	 * @method _createVertexAttributes
	 * @return {Array} an array of Mesh.VertexAttrib objects
	 */
	_createVertexAttributes: function() {
		throw "_createVertexAttributes not implemented";
	},


	/**
	 * Returns the number of floats per vertex for this batcher.
	 * 
	 * This method initially throws an error; so it must be overridden by
	 * subclasses of BaseBatch.
	 *
	 * @method  getVertexSize
	 * @return {Number} the size of a vertex, in # of floats
	 */
	getVertexSize: function() {
		throw "getVertexSize not implemented";
	},

	
	/** 
	 * Begins the sprite batch. This will bind the shader
	 * and mesh. Subclasses may want to disable depth or 
	 * set up blending.
	 *
	 * @method  begin
	 */
	begin: function()  {
		if (this.drawing) 
			throw "batch.end() must be called before begin";
		this.drawing = true;

		this.shader.bind();

		//bind the attributes now to avoid redundant calls
		this.mesh.bind(this.shader);

		if (this._blendingEnabled) {
			var gl = this.context.gl;
			gl.enable(gl.BLEND);
		}
	},

	/** 
	 * Ends the sprite batch. This will flush any remaining 
	 * data and set GL state back to normal.
	 * 
	 * @method  end
	 */
	end: function()  {
		if (!this.drawing)
			throw "batch.begin() must be called before end";
		if (this.idx > 0)
			this.flush();
		this.drawing = false;

		this.mesh.unbind(this.shader);

		if (this._blendingEnabled) {
			var gl = this.context.gl;
			gl.disable(gl.BLEND);
		}
	},

	/** 
	 * Called before rendering to bind new textures.
	 * This method does nothing by default.
	 *
	 * @method  _preRender
	 */
	_preRender: function()  {
	},

	/**
	 * Flushes the batch by pushing the current data
	 * to GL.
	 * 
	 * @method flush
	 */
	flush: function()  {
		if (this.idx===0)
			return;

		var gl = this.context.gl;

		//premultiplied alpha
		if (this._blendingEnabled) {
			//set either to null if you want to call your own 
			//blendFunc or blendFuncSeparate
			if (this._blendSrc && this._blendDst)
				gl.blendFunc(this._blendSrc, this._blendDst); 
		}

		this._preRender();

		//number of sprites in batch
		var numComponents = this.getVertexSize();
		var spriteCount = (this.idx / (numComponents * 4));
		
		//draw the sprites
		this.mesh.verticesDirty = true;
		this.mesh.draw(gl.TRIANGLES, spriteCount * 6, 0, this.idx);

		this.idx = 0;
	},

	/**
	 * Adds a sprite to this batch.
	 * The specifics depend on the sprite batch implementation.
	 *
	 * @method draw
	 * @param  {Texture} texture the texture for this sprite
	 * @param  {Number} x       the x position, defaults to zero
	 * @param  {Number} y       the y position, defaults to zero
	 * @param  {Number} width   the width, defaults to the texture width
	 * @param  {Number} height  the height, defaults to the texture height
	 * @param  {Number} u1      the first U coordinate, default zero
	 * @param  {Number} v1      the first V coordinate, default zero
	 * @param  {Number} u2      the second U coordinate, default one
	 * @param  {Number} v2      the second V coordinate, default one
	 */
	draw: function(texture, x, y, width, height, u1, v1, u2, v2) {
	},

	/**
	 * Adds a single quad mesh to this sprite batch from the given
	 * array of vertices.
	 * The specifics depend on the sprite batch implementation.
	 *
	 * @method  drawVertices
	 * @param {Texture} texture the texture we are drawing for this sprite
	 * @param {Float32Array} verts an array of vertices
	 * @param {Number} off the offset into the vertices array to read from
	 */
	drawVertices: function(texture, verts, off)  {
	},

	drawRegion: function(region, x, y, width, height) {
		this.draw(region.texture, x, y, width, height, region.u, region.v, region.u2, region.v2);
	},

	/**
	 * Destroys the batch, deleting its buffers and removing it from the
	 * WebGLContext management. Trying to use this
	 * batch after destroying it can lead to unpredictable behaviour.
	 *
	 * If `ownsShader` is true, this will also delete the `defaultShader` object.
	 * 
	 * @method destroy
	 */
	destroy: function() {
		this.vertices = null;
		this.indices = null;
		this.size = this.maxVertices = 0;

		if (this.ownsShader && this.defaultShader)
			this.defaultShader.destroy();
		this.defaultShader = null;
		this._shader = null; // remove reference to whatever shader is currently being used

		if (this.mesh) 
			this.mesh.destroy();
		this.mesh = null;
	}
});

module.exports = BaseBatch;

},{"./glutils/Mesh":29,"klasse":34,"number-util":32}],24:[function(_dereq_,module,exports){
/**
 * @module kami
 */

// Requires....
var Class         = _dereq_('klasse');

var BaseBatch = _dereq_('./BaseBatch');

var Mesh          = _dereq_('./glutils/Mesh');
var ShaderProgram = _dereq_('./glutils/ShaderProgram');

/**
 * A basic implementation of a batcher which draws 2D sprites.
 * This uses two triangles (quads) with indexed and interleaved
 * vertex data. Each vertex holds 5 floats (Position.xy, Color, TexCoord0.xy).
 *
 * The color is packed into a single float to reduce vertex bandwidth, and
 * the data is interleaved for best performance. We use a static index buffer,
 * and a dynamic vertex buffer that is updated with bufferSubData. 
 * 
 * @example
 *      var SpriteBatch = require('kami').SpriteBatch;  
 *      
 *      //create a new batcher
 *      var batch = new SpriteBatch(context);
 *
 *      function render() {
 *          batch.begin();
 *          
 *          //draw some sprites in between begin and end...
 *          batch.draw( texture, 0, 0, 25, 32 );
 *          batch.draw( texture1, 0, 25, 42, 23 );
 * 
 *          batch.end();
 *      }
 * 
 * @class  SpriteBatch
 * @uses BaseBatch
 * @constructor
 * @param {WebGLContext} context the context for this batch
 * @param {Number} size the max number of sprites to fit in a single batch
 */
var SpriteBatch = new Class({

	//inherit some stuff onto this prototype
	Mixins: BaseBatch,

	//Constructor
	initialize: function SpriteBatch(context, size) {
		BaseBatch.call(this, context, size);

		/**
		 * The projection Float32Array vec2 which is
		 * used to avoid some matrix calculations.
		 *
		 * @property projection
		 * @type {Float32Array}
		 */
		this.projection = new Float32Array(2);

		//Sets up a default projection vector so that the batch works without setProjection
		this.projection[0] = this.context.width/2;
		this.projection[1] = this.context.height/2;

		/**
		 * The currently bound texture. Do not modify.
		 * 
		 * @property {Texture} texture
		 * @readOnly
		 */
		this.texture = null;
	},

	/**
	 * This is a convenience function to set the batch's projection
	 * matrix to an orthographic 2D projection, based on the given screen
	 * size. This allows users to render in 2D without any need for a camera.
	 * 
	 * @param  {[type]} width  [description]
	 * @param  {[type]} height [description]
	 * @return {[type]}        [description]
	 */
	resize: function(width, height) {
		this.setProjection(width/2, height/2);
	},

	/**
	 * The number of floats per vertex for this batcher 
	 * (Position.xy + Color + TexCoord0.xy).
	 *
	 * @method  getVertexSize
	 * @return {Number} the number of floats per vertex
	 */
	getVertexSize: function() {
		return SpriteBatch.VERTEX_SIZE;
	},

	/**
	 * Used internally to return the Position, Color, and TexCoord0 attributes.
	 *
	 * @method  _createVertexAttribuets
	 * @protected
	 * @return {[type]} [description]
	 */
	_createVertexAttributes: function() {
		var gl = this.context.gl;

		return [ 
			new Mesh.Attrib(ShaderProgram.POSITION_ATTRIBUTE, 2),
			 //pack the color using some crazy wizardry 
			new Mesh.Attrib(ShaderProgram.COLOR_ATTRIBUTE, 4, null, gl.UNSIGNED_BYTE, true, 1),
			new Mesh.Attrib(ShaderProgram.TEXCOORD_ATTRIBUTE+"0", 2)
		];
	},


	/**
	 * Sets the projection vector, an x and y
	 * defining the middle points of your stage.
	 *
	 * @method setProjection
	 * @param {Number} x the x projection value
	 * @param {Number} y the y projection value
	 */
	setProjection: function(x, y) {
		var oldX = this.projection[0];
		var oldY = this.projection[1];
		this.projection[0] = x;
		this.projection[1] = y;

		//we need to flush the batch..
		if (this.drawing && (x != oldX || y != oldY)) {
			this.flush();
			this._updateMatrices();
		}
	},

	/**
	 * Creates a default shader for this batch.
	 *
	 * @method  _createShader
	 * @protected
	 * @return {ShaderProgram} a new instance of ShaderProgram
	 */
	_createShader: function() {
		var shader = new ShaderProgram(this.context,
				SpriteBatch.DEFAULT_VERT_SHADER, 
				SpriteBatch.DEFAULT_FRAG_SHADER);
		if (shader.log)
			console.warn("Shader Log:\n" + shader.log);
		return shader;
	},

	/**
	 * This is called during rendering to update projection/transform
	 * matrices and upload the new values to the shader. For example,
	 * if the user calls setProjection mid-draw, the batch will flush
	 * and this will be called before continuing to add items to the batch.
	 *
	 * You generally should not need to call this directly.
	 * 
	 * @method  updateMatrices
	 * @protected
	 */
	updateMatrices: function() {
		this.shader.setUniformfv("u_projection", this.projection);
	},

	/**
	 * Called before rendering, and binds the current texture.
	 * 
	 * @method _preRender
	 * @protected
	 */
	_preRender: function() {
		if (this.texture)
			this.texture.bind();
	},

	/**
	 * Binds the shader, disables depth writing, 
	 * enables blending, activates texture unit 0, and sends
	 * default matrices and sampler2D uniforms to the shader.
	 *
	 * @method  begin
	 */
	begin: function() {
		//sprite batch doesn't hold a reference to GL since it is volatile
		var gl = this.context.gl;
		
		//This binds the shader and mesh!
		BaseBatch.prototype.begin.call(this);

		this.updateMatrices(); //send projection/transform to shader

		//upload the sampler uniform. not necessary every flush so we just
		//do it here.
		this.shader.setUniformi("u_texture0", 0);

		//disable depth mask
		gl.depthMask(false);
	},

	/**
	 * Ends the sprite batcher and flushes any remaining data to the GPU.
	 * 
	 * @method end
	 */
	end: function() {
		//sprite batch doesn't hold a reference to GL since it is volatile
		var gl = this.context.gl;
		
		//just do direct parent call for speed here
		//This binds the shader and mesh!
		BaseBatch.prototype.end.call(this);

		gl.depthMask(true);
	},

	/**
	 * Flushes the batch to the GPU. This should be called when
	 * state changes, such as blend functions, depth or stencil states,
	 * shaders, and so forth.
	 * 
	 * @method flush
	 */
	flush: function() {
		//ignore flush if texture is null or our batch is empty
		if (!this.texture)
			return;
		if (this.idx === 0)
			return;
		BaseBatch.prototype.flush.call(this);
		SpriteBatch.totalRenderCalls++;
	},

	/**
	 * Adds a sprite to this batch. The sprite is drawn in 
	 * screen-space with the origin at the upper-left corner (y-down).
	 * 
	 * @method draw
	 * @param  {Texture} texture the Texture
	 * @param  {Number} x       the x position in pixels, defaults to zero
	 * @param  {Number} y       the y position in pixels, defaults to zero
	 * @param  {Number} width   the width in pixels, defaults to the texture width
	 * @param  {Number} height  the height in pixels, defaults to the texture height
	 * @param  {Number} u1      the first U coordinate, default zero
	 * @param  {Number} v1      the first V coordinate, default zero
	 * @param  {Number} u2      the second U coordinate, default one
	 * @param  {Number} v2      the second V coordinate, default one
	 */
	draw: function(texture, x, y, width, height, u1, v1, u2, v2) {
		if (!this.drawing)
			throw "Illegal State: trying to draw a batch before begin()";

		//don't draw anything if GL tex doesn't exist..
		if (!texture)
			return;

		if (this.texture === null || this.texture.id !== texture.id) {
			//new texture.. flush previous data
			this.flush();
			this.texture = texture;
		} else if (this.idx == this.vertices.length) {
			this.flush(); //we've reached our max, flush before pushing more data
		}

		width = (width===0) ? width : (width || texture.width);
		height = (height===0) ? height : (height || texture.height);
		x = x || 0;
		y = y || 0;

		var x1 = x;
		var x2 = x + width;
		var y1 = y;
		var y2 = y + height;

		u1 = u1 || 0;
		u2 = (u2===0) ? u2 : (u2 || 1);
		v1 = v1 || 0;
		v2 = (v2===0) ? v2 : (v2 || 1);

		var c = this.color;

		//xy
		this.vertices[this.idx++] = x1;
		this.vertices[this.idx++] = y1;
		//color
		this.vertices[this.idx++] = c;
		//uv
		this.vertices[this.idx++] = u1;
		this.vertices[this.idx++] = v1;
		
		//xy
		this.vertices[this.idx++] = x2;
		this.vertices[this.idx++] = y1;
		//color
		this.vertices[this.idx++] = c;
		//uv
		this.vertices[this.idx++] = u2;
		this.vertices[this.idx++] = v1;

		//xy
		this.vertices[this.idx++] = x2;
		this.vertices[this.idx++] = y2;
		//color
		this.vertices[this.idx++] = c;
		//uv
		this.vertices[this.idx++] = u2;
		this.vertices[this.idx++] = v2;

		//xy
		this.vertices[this.idx++] = x1;
		this.vertices[this.idx++] = y2;
		//color
		this.vertices[this.idx++] = c;
		//uv
		this.vertices[this.idx++] = u1;
		this.vertices[this.idx++] = v2;
	},

	/**
	 * Adds a single quad mesh to this sprite batch from the given
	 * array of vertices. The sprite is drawn in 
	 * screen-space with the origin at the upper-left corner (y-down).
	 *
	 * This reads 20 interleaved floats from the given offset index, in the format
	 *
	 *  { x, y, color, u, v,
	 *      ...  }
	 *
	 * @method  drawVertices
	 * @param {Texture} texture the Texture object
	 * @param {Float32Array} verts an array of vertices
	 * @param {Number} off the offset into the vertices array to read from
	 */
	drawVertices: function(texture, verts, off) {
		if (!this.drawing)
			throw "Illegal State: trying to draw a batch before begin()";
		
		//don't draw anything if GL tex doesn't exist..
		if (!texture)
			return;


		if (this.texture != texture) {
			//new texture.. flush previous data
			this.flush();
			this.texture = texture;
		} else if (this.idx == this.vertices.length) {
			this.flush(); //we've reached our max, flush before pushing more data
		}

		off = off || 0;
		//TODO: use a loop here?
		//xy
		this.vertices[this.idx++] = verts[off++];
		this.vertices[this.idx++] = verts[off++];
		//color
		this.vertices[this.idx++] = verts[off++];
		//uv
		this.vertices[this.idx++] = verts[off++];
		this.vertices[this.idx++] = verts[off++];
		
		//xy
		this.vertices[this.idx++] = verts[off++];
		this.vertices[this.idx++] = verts[off++];
		//color
		this.vertices[this.idx++] = verts[off++];
		//uv
		this.vertices[this.idx++] = verts[off++];
		this.vertices[this.idx++] = verts[off++];

		//xy
		this.vertices[this.idx++] = verts[off++];
		this.vertices[this.idx++] = verts[off++];
		//color
		this.vertices[this.idx++] = verts[off++];
		//uv
		this.vertices[this.idx++] = verts[off++];
		this.vertices[this.idx++] = verts[off++];

		//xy
		this.vertices[this.idx++] = verts[off++];
		this.vertices[this.idx++] = verts[off++];
		//color
		this.vertices[this.idx++] = verts[off++];
		//uv
		this.vertices[this.idx++] = verts[off++];
		this.vertices[this.idx++] = verts[off++];
	}
});

/**
 * The default vertex size, i.e. number of floats per vertex.
 * @attribute  VERTEX_SIZE
 * @static
 * @final
 * @type {Number}
 * @default  5
 */
SpriteBatch.VERTEX_SIZE = 5;

/**
 * Incremented after each draw call, can be used for debugging.
 *
 *     SpriteBatch.totalRenderCalls = 0;
 *
 *     ... draw your scene ...
 *
 *     console.log("Draw calls per frame:", SpriteBatch.totalRenderCalls);
 *
 * 
 * @attribute  totalRenderCalls
 * @static
 * @type {Number}
 * @default  0
 */
SpriteBatch.totalRenderCalls = 0;

SpriteBatch.DEFAULT_FRAG_SHADER = [
	"precision mediump float;",
	"varying vec2 vTexCoord0;",
	"varying vec4 vColor;",
	"uniform sampler2D u_texture0;",

	"void main(void) {",
	"   gl_FragColor = texture2D(u_texture0, vTexCoord0) * vColor;",
	"}"
].join('\n');

SpriteBatch.DEFAULT_VERT_SHADER = [
	"attribute vec2 "+ShaderProgram.POSITION_ATTRIBUTE+";",
	"attribute vec4 "+ShaderProgram.COLOR_ATTRIBUTE+";",
	"attribute vec2 "+ShaderProgram.TEXCOORD_ATTRIBUTE+"0;",

	"uniform vec2 u_projection;",
	"varying vec2 vTexCoord0;",
	"varying vec4 vColor;",

	"void main(void) {", ///TODO: use a projection and transform matrix
	"   gl_Position = vec4( "
		+ShaderProgram.POSITION_ATTRIBUTE
		+".x / u_projection.x - 1.0, "
		+ShaderProgram.POSITION_ATTRIBUTE
		+".y / -u_projection.y + 1.0 , 0.0, 1.0);",
	"   vTexCoord0 = "+ShaderProgram.TEXCOORD_ATTRIBUTE+"0;",
	"   vColor = "+ShaderProgram.COLOR_ATTRIBUTE+";",
	"}"
].join('\n');

module.exports = SpriteBatch;

},{"./BaseBatch":23,"./glutils/Mesh":29,"./glutils/ShaderProgram":30,"klasse":34}],25:[function(_dereq_,module,exports){
/**
 * @module kami
 */

var Class = _dereq_('klasse');
var Signal = _dereq_('signals');
var nextPowerOfTwo = _dereq_('number-util').nextPowerOfTwo;
var isPowerOfTwo = _dereq_('number-util').isPowerOfTwo;

var Texture = new Class({


	/**
	 * Creates a new texture with the optional width, height, and data.
	 *
	 * If the constructor is passed no parameters other than WebGLContext, then
	 * it will not be initialized and will be non-renderable. You will need to manually
	 * uploadData or uploadImage yourself.
	 *
	 * If you pass a width and height after context, the texture will be initialized with that size
	 * and null data (e.g. transparent black). If you also pass the format and data, 
	 * it will be uploaded to the texture. 
	 *
	 * If you pass a String or Data URI as the second parameter,
	 * this Texture will load an Image object asynchronously. The optional third
	 * and fourth parameters are callback functions for success and failure, respectively. 
	 * The optional fifrth parameter for this version of the constructor is genMipmaps, which defaults to false. 
	 * 
	 * The arguments are kept in memory for future context restoration events. If
	 * this is undesirable (e.g. huge buffers which need to be GC'd), you should not
	 * pass the data in the constructor, but instead upload it after creating an uninitialized 
	 * texture. You will need to manage it yourself, either by extending the create() method, 
	 * or listening to restored events in WebGLContext.
	 *
	 * Most users will want to use the AssetManager to create and manage their textures
	 * with asynchronous loading and context loss. 
	 *
	 * @example
	 * 		new Texture(context, 256, 256); //empty 256x256 texture
	 * 		new Texture(context, 1, 1, Texture.Format.RGBA, Texture.DataType.UNSIGNED_BYTE, 
	 * 					new Uint8Array([255,0,0,255])); //1x1 red texture
	 * 		new Texture(context, "test.png"); //loads image asynchronously
	 * 		new Texture(context, "test.png", successFunc, failFunc, useMipmaps); //extra params for image laoder 
	 *
	 * @class  Texture
	 * @constructor
	 * @param  {WebGLContext} context the WebGL context
	 * @param  {Number} width the width of this texture
	 * @param  {Number} height the height of this texture
	 * @param  {GLenum} format e.g. Texture.Format.RGBA
	 * @param  {GLenum} dataType e.g. Texture.DataType.UNSIGNED_BYTE (Uint8Array)
	 * @param  {GLenum} data the array buffer, e.g. a Uint8Array view
	 * @param  {Boolean} genMipmaps whether to generate mipmaps after uploading the data
	 */
	initialize: function Texture(context, width, height, format, dataType, data, genMipmaps) {
		if (typeof context !== "object")
			throw "GL context not specified to Texture";
		this.context = context;

		/**
		 * The WebGLTexture which backs this Texture object. This
		 * can be used for low-level GL calls.
		 * 
		 * @type {WebGLTexture}
		 */
		this.id = null; //initialized in create()

		/**
		 * The target for this texture unit, i.e. TEXTURE_2D. Subclasses
		 * should override the create() method to change this, for correct
		 * usage with context restore.
		 * 
		 * @property target
		 * @type {GLenum}
		 * @default  gl.TEXTURE_2D
		 */
		this.target = context.gl.TEXTURE_2D;

		/**
		 * The width of this texture, in pixels.
		 * 
		 * @property width
		 * @readOnly
		 * @type {Number} the width
		 */
		this.width = 0; //initialized on texture upload

		/**
		 * The height of this texture, in pixels.
		 * 
		 * @property height
		 * @readOnly
		 * @type {Number} the height
		 */
		this.height = 0; //initialized on texture upload

		// e.g. --> new Texture(gl, 256, 256, gl.RGB, gl.UNSIGNED_BYTE, data);
		//		      creates a new empty texture, 256x256
		//		--> new Texture(gl);
		//			  creates a new texture but WITHOUT uploading any data. 

		/**
		 * The S wrap parameter.
		 * @property {GLenum} wrapS
		 */
		this.wrapS = Texture.DEFAULT_WRAP;
		/**
		 * The T wrap parameter.
		 * @property {GLenum} wrapT
		 */
		this.wrapT = Texture.DEFAULT_WRAP;
		/**
		 * The minifcation filter.
		 * @property {GLenum} minFilter 
		 */
		this.minFilter = Texture.DEFAULT_FILTER;
		
		/**
		 * The magnification filter.
		 * @property {GLenum} magFilter 
		 */
		this.magFilter = Texture.DEFAULT_FILTER;

		/**
		 * When a texture is created, we keep track of the arguments provided to 
		 * its constructor. On context loss and restore, these arguments are re-supplied
		 * to the Texture, so as to re-create it in its correct form.
		 *
		 * This is mainly useful if you are procedurally creating textures and passing
		 * their data directly (e.g. for generic lookup tables in a shader). For image
		 * or media based textures, it would be better to use an AssetManager to manage
		 * the asynchronous texture upload.
		 *
		 * Upon destroying a texture, a reference to this is also lost.
		 *
		 * @property managedArgs
		 * @type {Array} the array of arguments, shifted to exclude the WebGLContext parameter
		 */
		this.managedArgs = Array.prototype.slice.call(arguments, 1);

		//This is maanged by WebGLContext
		this.context.addManagedObject(this);
		this.create();
	},

	/**
	 * This can be called after creating a Texture to load an Image object asynchronously,
	 * or upload image data directly. It takes the same parameters as the constructor, except 
	 * for the context which has already been established. 
	 *
	 * Users will generally not need to call this directly. 
	 * 
	 * @protected
	 * @method  setup
	 */
	setup: function(width, height, format, dataType, data, genMipmaps) {
		var gl = this.gl;

		//If the first argument is a string, assume it's an Image loader
		//second argument will then be genMipmaps, third and fourth the success/fail callbacks
		if (typeof width === "string") {
			var img = new Image();
			var path      = arguments[0];   //first argument, the path
			var successCB = typeof arguments[1] === "function" ? arguments[1] : null;
			var failCB    = typeof arguments[2] === "function" ? arguments[2] : null;
			genMipmaps    = !!arguments[3];

			var self = this;

			//If you try to render a texture that is not yet "renderable" (i.e. the 
			//async load hasn't completed yet, which is always the case in Chrome since requestAnimationFrame
			//fires before img.onload), WebGL will throw us errors. So instead we will just upload some
			//dummy data until the texture load is complete. Users can disable this with the global flag.
			if (Texture.USE_DUMMY_1x1_DATA) {
				self.uploadData(1, 1);
				this.width = this.height = 0;
			}

			img.onload = function() {
				self.uploadImage(img, undefined, undefined, genMipmaps);
				if (successCB)
					successCB();
			}
			img.onerror = function() {
				// console.warn("Error loading image: "+path);
				if (genMipmaps) //we still need to gen mipmaps on the 1x1 dummy
					gl.generateMipmap(gl.TEXTURE_2D);
				if (failCB)
					failCB();
			}
			img.onabort = function() {
				// console.warn("Image load aborted: "+path);
				if (genMipmaps) //we still need to gen mipmaps on the 1x1 dummy
					gl.generateMipmap(gl.TEXTURE_2D);
				if (failCB)
					failCB();
			}

			img.src = path;
		} 
		//otherwise assume our regular list of width/height arguments are passed
		else {
			this.uploadData(width, height, format, dataType, data, genMipmaps);
		}
	},	

	/**
	 * Called in the Texture constructor, and after the GL context has been re-initialized. 
	 * Subclasses can override this to provide a custom data upload, e.g. cubemaps or compressed
	 * textures.
	 *
	 * @method  create
	 */
	create: function() {
		this.gl = this.context.gl; 
		var gl = this.gl;

		this.id = gl.createTexture(); //texture ID is recreated
		this.width = this.height = 0; //size is reset to zero until loaded
		this.target = gl.TEXTURE_2D;  //the provider can change this if necessary (e.g. cube maps)

		this.bind();


		//TODO: clean these up a little. 
		gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, Texture.UNPACK_PREMULTIPLY_ALPHA);
		gl.pixelStorei(gl.UNPACK_ALIGNMENT, Texture.UNPACK_ALIGNMENT);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, Texture.UNPACK_FLIP_Y);
		
		var colorspace = Texture.UNPACK_COLORSPACE_CONVERSION || gl.BROWSER_DEFAULT_WEBGL;
		gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, colorspace);

		//setup wrap modes without binding redundantly
		this.setWrap(this.wrapS, this.wrapT, false);
		this.setFilter(this.minFilter, this.magFilter, false);
		
		if (this.managedArgs.length !== 0) {
			this.setup.apply(this, this.managedArgs);
		}
	},

	/**
	 * Destroys this texture by deleting the GL resource,
	 * removing it from the WebGLContext management stack,
	 * setting its size to zero, and id and managed arguments to null.
	 * 
	 * Trying to use this texture after may lead to undefined behaviour.
	 *
	 * @method  destroy
	 */
	destroy: function() {
		if (this.id && this.gl)
			this.gl.deleteTexture(this.id);
		if (this.context)
			this.context.removeManagedObject(this);
		this.width = this.height = 0;
		this.id = null;
		this.managedArgs = null;
		this.context = null;
		this.gl = null;
	},

	/**
	 * Sets the wrap mode for this texture; if the second argument
	 * is undefined or falsy, then both S and T wrap will use the first
	 * argument.
	 *
	 * You can use Texture.Wrap constants for convenience, to avoid needing 
	 * a GL reference.
	 *
	 * @method  setWrap
	 * @param {GLenum} s the S wrap mode
	 * @param {GLenum} t the T wrap mode
	 * @param {Boolean} ignoreBind (optional) if true, the bind will be ignored. 
	 */
	setWrap: function(s, t, ignoreBind) { //TODO: support R wrap mode
		if (s && t) {
			this.wrapS = s;
			this.wrapT = t;
		} else 
			this.wrapS = this.wrapT = s;
		
		//enforce POT rules..
		this._checkPOT();	

		if (!ignoreBind)
			this.bind();

		var gl = this.gl;
		gl.texParameteri(this.target, gl.TEXTURE_WRAP_S, this.wrapS);
		gl.texParameteri(this.target, gl.TEXTURE_WRAP_T, this.wrapT);
	},


	/**
	 * Sets the min and mag filter for this texture; 
	 * if mag is undefined or falsy, then both min and mag will use the
	 * filter specified for min.
	 *
	 * You can use Texture.Filter constants for convenience, to avoid needing 
	 * a GL reference.
	 *
	 * @method  setFilter
	 * @param {GLenum} min the minification filter
	 * @param {GLenum} mag the magnification filter
	 * @param {Boolean} ignoreBind if true, the bind will be ignored. 
	 */
	setFilter: function(min, mag, ignoreBind) { 
		if (min && mag) {
			this.minFilter = min;
			this.magFilter = mag;
		} else 
			this.minFilter = this.magFilter = min;
		
		//enforce POT rules..
		this._checkPOT();

		if (!ignoreBind)
			this.bind();

		var gl = this.gl;
		gl.texParameteri(this.target, gl.TEXTURE_MIN_FILTER, this.minFilter);
		gl.texParameteri(this.target, gl.TEXTURE_MAG_FILTER, this.magFilter);
	},

	/**
	 * A low-level method to upload the specified ArrayBufferView
	 * to this texture. This will cause the width and height of this
	 * texture to change.
	 *
	 * @method  uploadData
	 * @param  {Number} width          the new width of this texture,
	 *                                 defaults to the last used width (or zero)
	 * @param  {Number} height         the new height of this texture
	 *                                 defaults to the last used height (or zero)
	 * @param  {GLenum} format         the data format, default RGBA
	 * @param  {GLenum} type           the data type, default UNSIGNED_BYTE (Uint8Array)
	 * @param  {ArrayBufferView} data  the raw data for this texture, or null for an empty image
	 * @param  {Boolean} genMipmaps	   whether to generate mipmaps after uploading the data, default false
	 */
	uploadData: function(width, height, format, type, data, genMipmaps) {
		var gl = this.gl;

		format = format || gl.RGBA;
		type = type || gl.UNSIGNED_BYTE;
		data = data || null; //make sure falsey value is null for texImage2D

		this.width = (width || width==0) ? width : this.width;
		this.height = (height || height==0) ? height : this.height;

		this._checkPOT();

		this.bind();

		gl.texImage2D(this.target, 0, format, 
					  this.width, this.height, 0, format,
					  type, data);

		if (genMipmaps)
			gl.generateMipmap(this.target);
	},

	/**
	 * Uploads ImageData, HTMLImageElement, HTMLCanvasElement or 
	 * HTMLVideoElement.
	 *
	 * @method  uploadImage
	 * @param  {Object} domObject the DOM image container
	 * @param  {GLenum} format the format, default gl.RGBA
	 * @param  {GLenum} type the data type, default gl.UNSIGNED_BYTE
	 * @param  {Boolean} genMipmaps whether to generate mipmaps after uploading the data, default false
	 */
	uploadImage: function(domObject, format, type, genMipmaps) {
		var gl = this.gl;

		format = format || gl.RGBA;
		type = type || gl.UNSIGNED_BYTE;
		
		this.width = domObject.width;
		this.height = domObject.height;

		this._checkPOT();

		this.bind();

		gl.texImage2D(this.target, 0, format, format,
					  type, domObject);

		if (genMipmaps)
			gl.generateMipmap(this.target);
	},

	/**
	 * If FORCE_POT is false, we verify this texture to see if it is valid, 
	 * as per non-power-of-two rules. If it is non-power-of-two, it must have 
	 * a wrap mode of CLAMP_TO_EDGE, and the minification filter must be LINEAR
	 * or NEAREST. If we don't satisfy these needs, an error is thrown.
	 * 
	 * @method  _checkPOT
	 * @private
	 * @return {[type]} [description]
	 */
	_checkPOT: function() {
		if (!Texture.FORCE_POT) {
			//If minFilter is anything but LINEAR or NEAREST
			//or if wrapS or wrapT are not CLAMP_TO_EDGE...
			var wrongFilter = (this.minFilter !== Texture.Filter.LINEAR && this.minFilter !== Texture.Filter.NEAREST);
			var wrongWrap = (this.wrapS !== Texture.Wrap.CLAMP_TO_EDGE || this.wrapT !== Texture.Wrap.CLAMP_TO_EDGE);

			if ( wrongFilter || wrongWrap ) {
				if (!isPowerOfTwo(this.width) || !isPowerOfTwo(this.height))
					throw new Error(wrongFilter 
							? "Non-power-of-two textures cannot use mipmapping as filter"
							: "Non-power-of-two textures must use CLAMP_TO_EDGE as wrap");
			}
		}
	},

	/**
	 * Binds the texture. If unit is specified,
	 * it will bind the texture at the given slot
	 * (TEXTURE0, TEXTURE1, etc). If unit is not specified,
	 * it will simply bind the texture at whichever slot
	 * is currently active.
	 *
	 * @method  bind
	 * @param  {Number} unit the texture unit index, starting at 0
	 */
	bind: function(unit) {
		var gl = this.gl;
		if (unit || unit === 0)
			gl.activeTexture(gl.TEXTURE0 + unit);
		gl.bindTexture(this.target, this.id);
	},

	toString: function() {
		return this.id + ":" + this.width + "x" + this.height + "";
	}
});

/** 
 * A set of Filter constants that match their GL counterparts.
 * This is for convenience, to avoid the need for a GL rendering context.
 *
 * @example
 * ```
 *     Texture.Filter.NEAREST
 *     Texture.Filter.NEAREST_MIPMAP_LINEAR
 *     Texture.Filter.NEAREST_MIPMAP_NEAREST
 *     Texture.Filter.LINEAR
 *     Texture.Filter.LINEAR_MIPMAP_LINEAR
 *     Texture.Filter.LINEAR_MIPMAP_NEAREST
 * ```
 * @attribute Filter
 * @static
 * @type {Object}
 */
Texture.Filter = {
	NEAREST: 9728,
	NEAREST_MIPMAP_LINEAR: 9986,
	NEAREST_MIPMAP_NEAREST: 9984,
	LINEAR: 9729,
	LINEAR_MIPMAP_LINEAR: 9987,
	LINEAR_MIPMAP_NEAREST: 9985
};

/** 
 * A set of Wrap constants that match their GL counterparts.
 * This is for convenience, to avoid the need for a GL rendering context.
 *
 * @example
 * ```
 *     Texture.Wrap.CLAMP_TO_EDGE
 *     Texture.Wrap.MIRRORED_REPEAT
 *     Texture.Wrap.REPEAT
 * ```
 * @attribute Wrap
 * @static
 * @type {Object}
 */
Texture.Wrap = {
	CLAMP_TO_EDGE: 33071,
	MIRRORED_REPEAT: 33648,
	REPEAT: 10497
};

/** 
 * A set of Format constants that match their GL counterparts.
 * This is for convenience, to avoid the need for a GL rendering context.
 *
 * @example
 * ```
 *     Texture.Format.RGB
 *     Texture.Format.RGBA
 *     Texture.Format.LUMINANCE_ALPHA
 * ```
 * @attribute Format
 * @static
 * @type {Object}
 */
Texture.Format = {
	DEPTH_COMPONENT: 6402,
	ALPHA: 6406,
	RGBA: 6408,
	RGB: 6407,
	LUMINANCE: 6409,
	LUMINANCE_ALPHA: 6410
};

/** 
 * A set of DataType constants that match their GL counterparts.
 * This is for convenience, to avoid the need for a GL rendering context.
 *
 * @example
 * ```
 *     Texture.DataType.UNSIGNED_BYTE 
 *     Texture.DataType.FLOAT 
 * ```
 * @attribute DataType
 * @static
 * @type {Object}
 */
Texture.DataType = {
	BYTE: 5120,
	SHORT: 5122,
	INT: 5124,
	FLOAT: 5126,
	UNSIGNED_BYTE: 5121,
	UNSIGNED_INT: 5125,
	UNSIGNED_SHORT: 5123,
	UNSIGNED_SHORT_4_4_4_4: 32819,
	UNSIGNED_SHORT_5_5_5_1: 32820,
	UNSIGNED_SHORT_5_6_5: 33635
}

/**
 * The default wrap mode when creating new textures. If a custom 
 * provider was specified, it may choose to override this default mode.
 * 
 * @attribute {GLenum} DEFAULT_WRAP
 * @static 
 * @default  Texture.Wrap.CLAMP_TO_EDGE
 */
Texture.DEFAULT_WRAP = Texture.Wrap.CLAMP_TO_EDGE;


/**
 * The default filter mode when creating new textures. If a custom
 * provider was specified, it may choose to override this default mode.
 *
 * @attribute {GLenum} DEFAULT_FILTER
 * @static
 * @default  Texture.Filter.LINEAR
 */
Texture.DEFAULT_FILTER = Texture.Filter.NEAREST;

/**
 * By default, we do some error checking when creating textures
 * to ensure that they will be "renderable" by WebGL. Non-power-of-two
 * textures must use CLAMP_TO_EDGE as their wrap mode, and NEAREST or LINEAR
 * as their wrap mode. Further, trying to generate mipmaps for a NPOT image
 * will lead to errors. 
 *
 * However, you can disable this error checking by setting `FORCE_POT` to true.
 * This may be useful if you are running on specific hardware that supports POT 
 * textures, or in some future case where NPOT textures is added as a WebGL extension.
 * 
 * @attribute {Boolean} FORCE_POT
 * @static
 * @default  false
 */
Texture.FORCE_POT = false;

//default pixel store operations. Used in create()
Texture.UNPACK_FLIP_Y = false;
Texture.UNPACK_ALIGNMENT = 1;
Texture.UNPACK_PREMULTIPLY_ALPHA = true; 
Texture.UNPACK_COLORSPACE_CONVERSION = undefined;

//for the Image constructor we need to handle things a bit differently..
Texture.USE_DUMMY_1x1_DATA = true;

/**
 * Utility to get the number of components for the given GLenum, e.g. gl.RGBA returns 4.
 * Returns null if the specified format is not of type DEPTH_COMPONENT, ALPHA, LUMINANCE,
 * LUMINANCE_ALPHA, RGB, or RGBA.
 * 
 * @method getNumComponents
 * @static
 * @param  {GLenum} format a texture format, i.e. Texture.Format.RGBA
 * @return {Number} the number of components for this format
 */
Texture.getNumComponents = function(format) {
	switch (format) {
		case Texture.Format.DEPTH_COMPONENT:
		case Texture.Format.ALPHA:
		case Texture.Format.LUMINANCE:
			return 1;
		case Texture.Format.LUMINANCE_ALPHA:
			return 2;
		case Texture.Format.RGB:
			return 3;
		case Texture.Format.RGBA:
			return 4;
	}
	return null;
};

module.exports = Texture;
},{"klasse":34,"number-util":32,"signals":33}],26:[function(_dereq_,module,exports){
var Class = _dereq_('klasse');
var Texture = _dereq_('./Texture');

//This is a GL-specific texture region, employing tangent space normalized coordinates U and V.
//A canvas-specific region would really just be a lightweight object with { x, y, width, height }
//in pixels.
var TextureRegion = new Class({

	initialize: function TextureRegion(texture, x, y, width, height) {
		this.texture = texture;
		this.setRegion(x, y, width, height);
	},

	setUVs: function(u, v, u2, v2) {
		this.regionWidth = Math.round(Math.abs(u2 - u) * this.texture.width);
        this.regionHeight = Math.round(Math.abs(v2 - v) * this.texture.height);

        // From LibGDX TextureRegion.java -- 
		// For a 1x1 region, adjust UVs toward pixel center to avoid filtering artifacts on AMD GPUs when drawing very stretched.
		if (this.regionWidth == 1 && this.regionHeight == 1) {
			var adjustX = 0.25 / this.texture.width;
			u += adjustX;
			u2 -= adjustX;
			var adjustY = 0.25 / this.texture.height;
			v += adjustY;
			v2 -= adjustY;
		}

		this.u = u;
		this.v = v;
		this.u2 = u2;
		this.v2 = v2;
	},

	setRegion: function(x, y, width, height) {
		x = x || 0;
		y = y || 0;
		width = (width===0 || width) ? width : this.texture.width;
		height = (height===0 || height) ? height : this.texture.height;

		var invTexWidth = 1 / this.texture.width;
		var invTexHeight = 1 / this.texture.height;
		this.setUVs(x * invTexWidth, y * invTexHeight, (x + width) * invTexWidth, (y + height) * invTexHeight);
		this.regionWidth = Math.abs(width);
		this.regionHeight = Math.abs(height);
	},

	/** Sets the texture to that of the specified region and sets the coordinates relative to the specified region. */
	setFromRegion: function(region, x, y, width, height) {
		this.texture = region.texture;
		this.set(region.getRegionX() + x, region.getRegionY() + y, width, height);
	},


	//TODO: add setters for regionX/Y and regionWidth/Height

	regionX: {
		get: function() {
			return Math.round(this.u * this.texture.width);
		} 
	},

	regionY: {
		get: function() {
			return Math.round(this.v * this.texture.height);
		}
	},

	flip: function(x, y) {
		var temp;
		if (x) {
			temp = this.u;
			this.u = this.u2;
			this.u2 = temp;
		}
		if (y) {
			temp = this.v;
			this.v = this.v2;
			this.v2 = temp;
		}
	}
});

module.exports = TextureRegion;
},{"./Texture":25,"klasse":34}],27:[function(_dereq_,module,exports){
/**
 * @module kami
 */

var Class = _dereq_('klasse');
var Signal = _dereq_('signals');

/**
 * A thin wrapper around WebGLRenderingContext which handles
 * context loss and restore with various rendering objects (textures,
 * shaders and buffers). This also handles general viewport management.
 *
 * If the view is not specified, a canvas will be created.
 *
 * If the `view` parameter is an instanceof WebGLRenderingContext,
 * we will use its canvas and context without fetching another through `getContext`.
 * Passing a canvas that has already had `getContext('webgl')` called will not cause
 * errors, but in certain debuggers (e.g. Chrome WebGL Inspector) only the latest
 * context will be traced.
 * 
 * @class  WebGLContext
 * @constructor
 * @param {Number} width the width of the GL canvas
 * @param {Number} height the height of the GL canvas
 * @param {HTMLCanvasElement} view the optional DOM canvas element
 * @param {Object} contextAttribuets an object containing context attribs which
 *                                   will be used during GL initialization
 */
var WebGLContext = new Class({
	
	initialize: function WebGLContext(width, height, view, contextAttributes) {
		/**
		 * The list of rendering objects (shaders, VBOs, textures, etc) which are 
		 * currently being managed. Any object with a "create" method can be added
		 * to this list. Upon destroying the rendering object, it should be removed.
		 * See addManagedObject and removeManagedObject.
		 * 
		 * @property {Array} managedObjects
		 */
		this.managedObjects = [];

		/**
		 * The actual GL context. You can use this for
		 * raw GL calls or to access GLenum constants. This
		 * will be updated on context restore. While the WebGLContext
		 * is not `valid`, you should not try to access GL state.
		 * 
		 * @property gl
		 * @type {WebGLRenderingContext}
		 */
		this.gl = null;

		if (view && typeof window.WebGLRenderingContext !== "undefined"
				 && view instanceof window.WebGLRenderingContext) {
			view = view.canvas;
			this.gl = view;
			this.valid = true;
			contextAttributes = undefined; //just ignore new attribs...
		}

		/**
		 * The canvas DOM element for this context.
		 * @property {Number} view
		 */
		this.view = view || document.createElement("canvas");

		//default size as per spec:
		//http://www.w3.org/TR/2012/WD-html5-author-20120329/the-canvas-element.html#the-canvas-element
		
		/**
		 * The width of this canvas.
		 *
		 * @property width
		 * @type {Number}
		 */
		this.width = this.view.width = width || 300;

		/**
		 * The height of this canvas.
		 * @property height
		 * @type {Number}
		 */
		this.height = this.view.height = height || 150;


		/**
		 * The context attributes for initializing the GL state. This might include
		 * anti-aliasing, alpha settings, verison, and so forth.
		 * 
		 * @property {Object} contextAttributes 
		 */
		this.contextAttributes = contextAttributes;
		
		/**
		 * Whether this context is 'valid', i.e. renderable. A context that has been lost
		 * (and not yet restored) or destroyed is invalid.
		 * 
		 * @property {Boolean} valid
		 */
		this.valid = false;

		/**
		 * A signal dispatched when GL context is lost. 
		 * 
		 * The first argument passed to the listener is the WebGLContext
		 * managing the context loss.
		 * 
		 * @event {Signal} lost
		 */
		this.lost = new Signal();

		/**
		 * A signal dispatched when GL context is restored, after all the managed
		 * objects have been recreated.
		 *
		 * The first argument passed to the listener is the WebGLContext
		 * which managed the restoration.
		 *
		 * This does not gaurentee that all objects will be renderable.
		 * For example, a Texture with an ImageProvider may still be loading
		 * asynchronously.	 
		 * 
		 * @event {Signal} restored
		 */
		this.restored = new Signal();	
		
		//setup context lost and restore listeners
		this.view.addEventListener("webglcontextlost", function (ev) {
			ev.preventDefault();
			this._contextLost(ev);
		}.bind(this));
		this.view.addEventListener("webglcontextrestored", function (ev) {
			ev.preventDefault();
			this._contextRestored(ev);
		}.bind(this));
			
		if (!this.valid) //would only be valid if WebGLRenderingContext was passed 
			this._initContext();

		this.resize(this.width, this.height);
	},
	
	_initContext: function() {
		var err = "";
		this.valid = false;

		try {
			this.gl = (this.view.getContext('webgl', this.contextAttributes) 
						|| this.view.getContext('experimental-webgl', this.contextAttributes));
		} catch (e) {
			this.gl = null;
		}

		if (this.gl) {
			this.valid = true;
		} else {
			throw "WebGL Context Not Supported -- try enabling it or using a different browser";
		}	
	},

	/**
	 * Updates the width and height of this WebGL context, resizes
	 * the canvas view, and calls gl.viewport() with the new size.
	 * 
	 * @param  {Number} width  the new width
	 * @param  {Number} height the new height
	 */
	resize: function(width, height) {
		this.width = width;
		this.height = height;

		this.view.width = width;
		this.view.height = height;

		var gl = this.gl;
		gl.viewport(0, 0, this.width, this.height);
	},

	/**
	 * (internal use)
	 * A managed object is anything with a "create" function, that will
	 * restore GL state after context loss. 
	 * 
	 * @param {[type]} tex [description]
	 */
	addManagedObject: function(obj) {
		this.managedObjects.push(obj);
	},

	/**
	 * (internal use)
	 * Removes a managed object from the cache. This is useful to destroy
	 * a texture or shader, and have it no longer re-load on context restore.
	 *
	 * Returns the object that was removed, or null if it was not found in the cache.
	 * 
	 * @param  {Object} obj the object to be managed
	 * @return {Object}     the removed object, or null
	 */
	removeManagedObject: function(obj) {
		var idx = this.managedObjects.indexOf(obj);
		if (idx > -1) {
			this.managedObjects.splice(idx, 1);
			return obj;
		} 
		return null;
	},

	/**
	 * Calls destroy() on each managed object, then removes references to these objects
	 * and the GL rendering context. This also removes references to the view and sets
	 * the context's width and height to zero.
	 *
	 * Attempting to use this WebGLContext or the GL rendering context after destroying it
	 * will lead to undefined behaviour.
	 */
	destroy: function() {
		for (var i=0; i<this.managedObjects.length; i++) {
			var obj = this.managedObjects[i];
			if (obj && typeof obj.destroy === "function")
				obj.destroy();
		}
		this.managedObjects.length = 0;
		this.valid = false;
		this.gl = null;
		this.view = null;
		this.width = this.height = 0;
	},

	_contextLost: function(ev) {
		//all textures/shaders/buffers/FBOs have been deleted... 
		//we need to re-create them on restore
		this.valid = false;

		this.lost.dispatch(this);
	},

	_contextRestored: function(ev) {
		//first, initialize the GL context again
		this._initContext();

		//now we recreate our shaders and textures
		for (var i=0; i<this.managedObjects.length; i++) {
			this.managedObjects[i].create();
		}

		//update GL viewport
		this.resize(this.width, this.height);

		this.restored.dispatch(this);
	}
});

module.exports = WebGLContext;
},{"klasse":34,"signals":33}],28:[function(_dereq_,module,exports){
var Class = _dereq_('klasse');
var Texture = _dereq_('../Texture');


var FrameBuffer = new Class({

	/**
	 * Creates a new Frame Buffer Object with the given width and height.
	 *
	 * If width and height are non-numbers, this method expects the
	 * first parameter to be a Texture object which should be acted upon. 
	 * In this case, the FrameBuffer does not "own" the texture, and so it
	 * won't dispose of it upon destruction. This is an advanced version of the
	 * constructor that assumes the user is giving us a valid Texture that can be bound (i.e.
	 * no async Image textures).
	 *
	 * @class  FrameBuffer
	 * @constructor
	 * @param  {[type]} width  [description]
	 * @param  {[type]} height [description]
	 * @param  {[type]} filter [description]
	 * @return {[type]}        [description]
	 */
	initialize: function FrameBuffer(context, width, height, format) { //TODO: depth component
		if (typeof context !== "object")
			throw "GL context not specified to FrameBuffer";
	

		/**
		 * The underlying ID of the GL frame buffer object.
		 *
		 * @property {WebGLFramebuffer} id
		 */		
		this.id = null;

		/**
		 * The WebGLContext backed by this frame buffer.
		 *
		 * @property {WebGLContext} context
		 */
		this.context = context;

		/**
		 * The Texture backed by this frame buffer.
		 *
		 * @property {Texture} Texture
		 */
		//this Texture is now managed.
		this.texture = new Texture(context, width, height, format);

		//This is maanged by WebGLContext
		this.context.addManagedObject(this);
		this.create();
	},

	/**
	 * A read-only property which returns the width of the backing texture. 
	 * 
	 * @readOnly
	 * @property width
	 * @type {Number}
	 */
	width: {
		get: function() {
			return this.texture.width
		}
	},

	/**
	 * A read-only property which returns the height of the backing texture. 
	 * 
	 * @readOnly
	 * @property height
	 * @type {Number}
	 */
	height: {
		get: function() {
			return this.texture.height;
		}
	},


	/**
	 * Called during initialization to setup the frame buffer; also called on
	 * context restore. Users will not need to call this directly.
	 * 
	 * @method create
	 */
	create: function() {
		this.gl = this.context.gl; 
		var gl = this.gl;

		var tex = this.texture;

		//we assume the texture has already had create() called on it
		//since it was added as a managed object prior to this FrameBuffer
		tex.bind();
 
		this.id = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.id);

		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, tex.target, tex.id, 0);

		var result = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
		if (result != gl.FRAMEBUFFER_COMPLETE) {
			this.destroy(); //destroy our resources before leaving this function..

			var err = "Framebuffer not complete";
			switch (result) {
				case gl.FRAMEBUFFER_UNSUPPORTED:
					throw new Error(err + ": unsupported");
				case gl.INCOMPLETE_DIMENSIONS:
					throw new Error(err + ": incomplete dimensions");
				case gl.INCOMPLETE_ATTACHMENT:
					throw new Error(err + ": incomplete attachment");
				case gl.INCOMPLETE_MISSING_ATTACHMENT:
					throw new Error(err + ": missing attachment");
				default:
					throw new Error(err);
			}
		}
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	},


	/**
	 * Destroys this frame buffer. Using this object after destroying it will have
	 * undefined results. 
	 * @method destroy
	 */
	destroy: function() {
		var gl = this.gl;

		if (this.texture)
			this.texture.destroy();
		if (this.id && this.gl)
			this.gl.deleteFramebuffer(this.id);
		if (this.context)
			this.context.removeManagedObject(this);

		this.id = null;
		this.gl = null;
		this.texture = null;
		this.context = null;
	},

	/**
	 * Binds this framebuffer and sets the viewport to the expected size.
	 * @method begin
	 */
	begin: function() {
		var gl = this.gl;
		gl.viewport(0, 0, this.texture.width, this.texture.height);
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.id);
	},

	/**
	 * Binds the default frame buffer (the screen) and sets the viewport back
	 * to the size of the WebGLContext.
	 * 
	 * @method end
	 */
	end: function() {
		var gl = this.gl;
		gl.viewport(0, 0, this.context.width, this.context.height);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}
});

module.exports = FrameBuffer;
},{"../Texture":25,"klasse":34}],29:[function(_dereq_,module,exports){
/**
 * @module kami
 */

var Class = _dereq_('klasse');

//TODO: decouple into VBO + IBO utilities 
/**
 * A mesh class that wraps VBO and IBO.
 *
 * @class  Mesh
 */
var Mesh = new Class({


	/**
	 * A write-only property which sets both vertices and indices 
	 * flag to dirty or not. 
	 *
	 * @property dirty
	 * @type {Boolean}
	 * @writeOnly
	 */
	dirty: {
		set: function(val) {
			this.verticesDirty = val;
			this.indicesDirty = val;
		}
	},

	/**
	 * Creates a new Mesh with the provided parameters.
	 *
	 * If numIndices is 0 or falsy, no index buffer will be used
	 * and indices will be an empty ArrayBuffer and a null indexBuffer.
	 * 
	 * If isStatic is true, then vertexUsage and indexUsage will
	 * be set to gl.STATIC_DRAW. Otherwise they will use gl.DYNAMIC_DRAW.
	 * You may want to adjust these after initialization for further control.
	 * 
	 * @param  {WebGLContext}  context the context for management
	 * @param  {Boolean} isStatic      a hint as to whether this geometry is static
	 * @param  {[type]}  numVerts      [description]
	 * @param  {[type]}  numIndices    [description]
	 * @param  {[type]}  vertexAttribs [description]
	 * @return {[type]}                [description]
	 */
	initialize: function Mesh(context, isStatic, numVerts, numIndices, vertexAttribs) {
		if (typeof context !== "object")
			throw "GL context not specified to Mesh";
		if (!numVerts)
			throw "numVerts not specified, must be > 0";

		this.context = context;
		this.gl = context.gl;
		
		this.numVerts = null;
		this.numIndices = null;
		
		this.vertices = null;
		this.indices = null;
		this.vertexBuffer = null;
		this.indexBuffer = null;

		this.verticesDirty = true;
		this.indicesDirty = true;
		this.indexUsage = null;
		this.vertexUsage = null;

		/** 
		 * @property
		 * @private
		 */
		this._vertexAttribs = null;

		/** 
		 * The stride for one vertex _in bytes_. 
		 * 
		 * @property {Number} vertexStride
		 */
		this.vertexStride = null;

		this.numVerts = numVerts;
		this.numIndices = numIndices || 0;
		this.vertexUsage = isStatic ? this.gl.STATIC_DRAW : this.gl.DYNAMIC_DRAW;
		this.indexUsage  = isStatic ? this.gl.STATIC_DRAW : this.gl.DYNAMIC_DRAW;
		this._vertexAttribs = vertexAttribs || [];
		
		this.indicesDirty = true;
		this.verticesDirty = true;

		//determine the vertex stride based on given attributes
		var totalNumComponents = 0;
		for (var i=0; i<this._vertexAttribs.length; i++)
			totalNumComponents += this._vertexAttribs[i].offsetCount;
		this.vertexStride = totalNumComponents * 4; // in bytes

		this.vertices = new Float32Array(this.numVerts);
		this.indices = new Uint16Array(this.numIndices);

		//add this VBO to the managed cache
		this.context.addManagedObject(this);

		this.create();
	},

	//recreates the buffers on context loss
	create: function() {
		this.gl = this.context.gl;
		var gl = this.gl;
		this.vertexBuffer = gl.createBuffer();

		//ignore index buffer if we haven't specified any
		this.indexBuffer = this.numIndices > 0
					? gl.createBuffer()
					: null;

		this.dirty = true;
	},

	destroy: function() {
		this.vertices = null;
		this.indices = null;
		if (this.vertexBuffer && this.gl)
			this.gl.deleteBuffer(this.vertexBuffer);
		if (this.indexBuffer && this.gl)
			this.gl.deleteBuffer(this.indexBuffer);
		this.vertexBuffer = null;
		this.indexBuffer = null;
		if (this.context)
			this.context.removeManagedObject(this);
		this.gl = null;
		this.context = null;
	},

	_updateBuffers: function(ignoreBind, subDataLength) {
		var gl = this.gl;

		//bind our index data, if we have any
		if (this.numIndices > 0) {
			if (!ignoreBind)
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

			//update the index data
			if (this.indicesDirty) {
				gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, this.indexUsage);
				this.indicesDirty = false;
			}
		}

		//bind our vertex data
		if (!ignoreBind)
			gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

		//update our vertex data
		if (this.verticesDirty) {
			if (subDataLength) {
				// TODO: When decoupling VBO/IBO be sure to give better subData support..
				var view = this.vertices.subarray(0, subDataLength);
				gl.bufferSubData(gl.ARRAY_BUFFER, 0, view);
			} else {
				gl.bufferData(gl.ARRAY_BUFFER, this.vertices, this.vertexUsage);	
			}

			
			this.verticesDirty = false;
		}
	},

	draw: function(primitiveType, count, offset, subDataLength) {
		if (count === 0)
			return;

		var gl = this.gl;
		
		offset = offset || 0;

		//binds and updates our buffers. pass ignoreBind as true
		//to avoid binding unnecessarily
		this._updateBuffers(true, subDataLength);

		if (this.numIndices > 0) { 
			gl.drawElements(primitiveType, count, 
						gl.UNSIGNED_SHORT, offset * 2); //* Uint16Array.BYTES_PER_ELEMENT
		} else
			gl.drawArrays(primitiveType, offset, count);
	},

	//binds this mesh's vertex attributes for the given shader
	bind: function(shader) {
		var gl = this.gl;

		var offset = 0;
		var stride = this.vertexStride;

		//bind and update our vertex data before binding attributes
		this._updateBuffers();

		//for each attribtue
		for (var i=0; i<this._vertexAttribs.length; i++) {
			var a = this._vertexAttribs[i];

			//location of the attribute
			var loc = a.location === null 
					? shader.getAttributeLocation(a.name)
					: a.location;

			//TODO: We may want to skip unfound attribs
			// if (loc!==0 && !loc)
			// 	console.warn("WARN:", a.name, "is not enabled");

			//first, enable the vertex array
			gl.enableVertexAttribArray(loc);

			//then specify our vertex format
			gl.vertexAttribPointer(loc, a.numComponents, a.type || gl.FLOAT, 
								   a.normalize, stride, offset);

			//and increase the offset...
			offset += a.offsetCount * 4; //in bytes
		}
	},

	unbind: function(shader) {
		var gl = this.gl;

		//for each attribtue
		for (var i=0; i<this._vertexAttribs.length; i++) {
			var a = this._vertexAttribs[i];

			//location of the attribute
			var loc = a.location === null 
					? shader.getAttributeLocation(a.name)
					: a.location;

			//first, enable the vertex array
			gl.disableVertexAttribArray(loc);
		}
	}
});

Mesh.Attrib = new Class({

	name: null,
	numComponents: null,
	location: null,
	type: null,

	/**
	 * Location is optional and for advanced users that
	 * want vertex arrays to match across shaders. Any non-numerical
	 * value will be converted to null, and ignored. If a numerical
	 * value is given, it will override the position of this attribute
	 * when given to a mesh.
	 * 
	 * @param  {[type]} name          [description]
	 * @param  {[type]} numComponents [description]
	 * @param  {[type]} location      [description]
	 * @return {[type]}               [description]
	 */
	initialize: function(name, numComponents, location, type, normalize, offsetCount) {
		this.name = name;
		this.numComponents = numComponents;
		this.location = typeof location === "number" ? location : null;
		this.type = type;
		this.normalize = Boolean(normalize);
		this.offsetCount = typeof offsetCount === "number" ? offsetCount : this.numComponents;
	}
})


module.exports = Mesh;
},{"klasse":34}],30:[function(_dereq_,module,exports){
/**
 * @module kami
 */

var Class = _dereq_('klasse');


var ShaderProgram = new Class({
	
	/**
	 * Creates a new ShaderProgram from the given source, and an optional map of attribute
	 * locations as <name, index> pairs.
	 *
	 * _Note:_ Chrome version 31 was giving me issues with attribute locations -- you may
	 * want to omit this to let the browser pick the locations for you.	
	 *
	 * @class  ShaderProgram
	 * @constructor
	 * @param  {WebGLContext} context      the context to manage this object
	 * @param  {String} vertSource         the vertex shader source
	 * @param  {String} fragSource         the fragment shader source
	 * @param  {Object} attributeLocations the attribute locations
	 */
	initialize: function ShaderProgram(context, vertSource, fragSource, attributeLocations) {
		if (!vertSource || !fragSource)
			throw "vertex and fragment shaders must be defined";
		if (typeof context !== "object")
			throw "GL context not specified to ShaderProgram";
		this.context = context;

		this.vertShader = null;
		this.fragShader = null;
		this.program = null;
		this.log = "";

		this.uniformCache = null;
		this.attributeCache = null;

		this.attributeLocations = attributeLocations;

		//We trim (ECMAScript5) so that the GLSL line numbers are
		//accurate on shader log
		this.vertSource = vertSource.trim();
		this.fragSource = fragSource.trim();

		//Adds this shader to the context, to be managed
		this.context.addManagedObject(this);

		this.create();
	},

	/** 
	 * This is called during the ShaderProgram constructor,
	 * and may need to be called again after context loss and restore.
	 * 
	 * @method  create
	 */
	create: function() {
		this.gl = this.context.gl;
		this._compileShaders();
	},

	//Compiles the shaders, throwing an error if the program was invalid.
	_compileShaders: function() {
		var gl = this.gl; 
		
		this.log = "";

		this.vertShader = this._loadShader(gl.VERTEX_SHADER, this.vertSource);
		this.fragShader = this._loadShader(gl.FRAGMENT_SHADER, this.fragSource);

		if (!this.vertShader || !this.fragShader)
			throw "Error returned when calling createShader";

		this.program = gl.createProgram();

		gl.attachShader(this.program, this.vertShader);
		gl.attachShader(this.program, this.fragShader);
	
		//TODO: This seems not to be working on my OSX -- maybe a driver bug?
		if (this.attributeLocations) {
			for (var key in this.attributeLocations) {
				if (this.attributeLocations.hasOwnProperty(key)) {
					gl.bindAttribLocation(this.program, Math.floor(this.attributeLocations[key]), key);
				}
			}
		}

		gl.linkProgram(this.program); 

		this.log += gl.getProgramInfoLog(this.program) || "";

		if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
			throw "Error linking the shader program:\n"
				+ this.log;
		}

		this._fetchUniforms();
		this._fetchAttributes();
	},

	_fetchUniforms: function() {
		var gl = this.gl;

		this.uniformCache = {};

		var len = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
		if (!len) //null or zero
			return;

		for (var i=0; i<len; i++) {
			var info = gl.getActiveUniform(this.program, i);
			if (info === null) 
				continue;
			var name = info.name;
			var location = gl.getUniformLocation(this.program, name);
			
			this.uniformCache[name] = {
				size: info.size,
				type: info.type,
				location: location
			};
		}
	},

	_fetchAttributes: function() { 
		var gl = this.gl; 

		this.attributeCache = {};

		var len = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);
		if (!len) //null or zero
			return;	

		for (var i=0; i<len; i++) {
			var info = gl.getActiveAttrib(this.program, i);
			if (info === null) 
				continue;
			var name = info.name;

			//the attrib location is a simple index
			var location = gl.getAttribLocation(this.program, name);
			
			this.attributeCache[name] = {
				size: info.size,
				type: info.type,
				location: location
			};
		}
	},

	_loadShader: function(type, source) {
		var gl = this.gl;

		var shader = gl.createShader(type);
		if (!shader) //should not occur...
			return -1;

		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		
		var logResult = gl.getShaderInfoLog(shader) || "";
		if (logResult) {
			//we do this so the user knows which shader has the error
			var typeStr = (type === gl.VERTEX_SHADER) ? "vertex" : "fragment";
			logResult = "Error compiling "+ typeStr+ " shader:\n"+logResult;
		}

		this.log += logResult;

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) ) {
			throw this.log;
		}
		return shader;
	},

	/**
	 * Called to bind this shader. Note that there is no "unbind" since
	 * technically such a thing is not possible in the programmable pipeline.
	 *
	 * You must bind a shader before settings its uniforms.
	 * 
	 * @method bind
	 */
	bind: function() {
		this.gl.useProgram(this.program);
	},


	/**
	 * Destroys this shader and its resources. You should not try to use this
	 * after destroying it.
	 * @method  destroy
	 */
	destroy: function() {
		if (this.context)
			this.context.removeManagedObject(this);

		if (this.gl) {
			var gl = this.gl;
			gl.detachShader(this.vertShader);
			gl.detachShader(this.fragShader);

			gl.deleteShader(this.vertShader);
			gl.deleteShader(this.fragShader);
			gl.deleteProgram(this.program);
		}
		this.attributeCache = null;
		this.uniformCache = null;
		this.vertShader = null;
		this.fragShader = null;
		this.program = null;
		this.gl = null;
		this.context = null;
	},


	/**
	 * Returns the cached uniform info (size, type, location).
	 * If the uniform is not found in the cache, it is assumed
	 * to not exist, and this method returns null.
	 *
	 * This may return null even if the uniform is defined in GLSL:
	 * if it is _inactive_ (i.e. not used in the program) then it may
	 * be optimized out.
	 *
	 * @method  getUniformInfo
	 * @param  {String} name the uniform name as defined in GLSL
	 * @return {Object} an object containing location, size, and type
	 */
	getUniformInfo: function(name) {
		return this.uniformCache[name] || null; 
	},

	/**
	 * Returns the cached attribute info (size, type, location).
	 * If the attribute is not found in the cache, it is assumed
	 * to not exist, and this method returns null.
	 *
	 * This may return null even if the attribute is defined in GLSL:
	 * if it is _inactive_ (i.e. not used in the program or disabled) 
	 * then it may be optimized out.
	 *
	 * @method  getAttributeInfo
	 * @param  {String} name the attribute name as defined in GLSL
	 * @return {object} an object containing location, size and type
	 */
	getAttributeInfo: function(name) {
		return this.attributeCache[name] || null; 
	},


	/**
	 * Returns the cached uniform location object.
	 * If the uniform is not found, this method returns null.
	 *
	 * @method  getAttributeLocation
	 * @param  {String} name the uniform name as defined in GLSL
	 * @return {GLint} the location object
	 */
	getAttributeLocation: function(name) { //TODO: make faster, don't cache
		var info = this.getAttributeInfo(name);
		return info ? info.location : null;
	},

	/**
	 * Returns the cached uniform location object, assuming it exists
	 * and is active. Note that uniforms may be inactive if 
	 * the GLSL compiler deemed them unused.
	 *
	 * @method  getUniformLocation
	 * @param  {String} name the uniform name as defined in GLSL
	 * @return {WebGLUniformLocation} the location object
	 */
	getUniformLocation: function(name) {
		var info = this.getUniformInfo(name);
		return info ? info.location : null;
	},

	/**
	 * Returns true if the uniform is active and found in this
	 * compiled program. Note that uniforms may be inactive if 
	 * the GLSL compiler deemed them unused.
	 *
	 * @method  hasUniform
	 * @param  {String}  name the uniform name
	 * @return {Boolean} true if the uniform is found and active
	 */
	hasUniform: function(name) {
		return this.getUniformInfo(name) !== null;
	},

	/**
	 * Returns true if the attribute is active and found in this
	 * compiled program.
	 *
	 * @method  hasAttribute
	 * @param  {String}  name the attribute name
	 * @return {Boolean} true if the attribute is found and active
	 */
	hasAttribute: function(name) {
		return this.getAttributeInfo(name) !== null;
	},

	/**
	 * Returns the uniform value by name.
	 *
	 * @method  getUniform
	 * @param  {String} name the uniform name as defined in GLSL
	 * @return {any} The value of the WebGL uniform
	 */
	getUniform: function(name) {
		return this.gl.getUniform(this.program, this.getUniformLocation(name));
	},

	/**
	 * Returns the uniform value at the specified WebGLUniformLocation.
	 *
	 * @method  getUniformAt
	 * @param  {WebGLUniformLocation} location the location object
	 * @return {any} The value of the WebGL uniform
	 */
	getUniformAt: function(location) {
		return this.gl.getUniform(this.program, location);
	},

	/**
	 * A convenience method to set uniformi from the given arguments.
	 * We determine which GL call to make based on the number of arguments
	 * passed. For example, `setUniformi("var", 0, 1)` maps to `gl.uniform2i`.
	 * 
	 * @method  setUniformi
	 * @param {String} name        		the name of the uniform
	 * @param {GLint} x  the x component for ints
	 * @param {GLint} y  the y component for ivec2
	 * @param {GLint} z  the z component for ivec3
	 * @param {GLint} w  the w component for ivec4
	 */
	setUniformi: function(name, x, y, z, w) {
		var gl = this.gl;
		var loc = this.getUniformLocation(name);
		if (!loc) 
			return false;
		switch (arguments.length) {
			case 2: gl.uniform1i(loc, x); return true;
			case 3: gl.uniform2i(loc, x, y); return true;
			case 4: gl.uniform3i(loc, x, y, z); return true;
			case 5: gl.uniform4i(loc, x, y, z, w); return true;
			default:
				throw "invalid arguments to setUniformi"; 
		}
	},

	/**
	 * A convenience method to set uniformf from the given arguments.
	 * We determine which GL call to make based on the number of arguments
	 * passed. For example, `setUniformf("var", 0, 1)` maps to `gl.uniform2f`.
	 * 
	 * @method  setUniformf
	 * @param {String} name        		the name of the uniform
	 * @param {GLfloat} x  the x component for floats
	 * @param {GLfloat} y  the y component for vec2
	 * @param {GLfloat} z  the z component for vec3
	 * @param {GLfloat} w  the w component for vec4
	 */
	setUniformf: function(name, x, y, z, w) {
		var gl = this.gl;
		var loc = this.getUniformLocation(name);
		if (!loc) 
			return false;
		switch (arguments.length) {
			case 2: gl.uniform1f(loc, x); return true;
			case 3: gl.uniform2f(loc, x, y); return true;
			case 4: gl.uniform3f(loc, x, y, z); return true;
			case 5: gl.uniform4f(loc, x, y, z, w); return true;
			default:
				throw "invalid arguments to setUniformf"; 
		}
	},

	//I guess we won't support sequence<GLfloat> .. whatever that is ??
	

	///// 
	
	/**
	 * A convenience method to set uniformNfv from the given ArrayBuffer.
	 * We determine which GL call to make based on the length of the array 
	 * buffer (for 1-4 component vectors stored in a Float32Array). To use
	 * this method to upload data to uniform arrays, you need to specify the
	 * 'count' parameter; i.e. the data type you are using for that array. If
	 * specified, this will dictate whether to call uniform1fv, uniform2fv, etc.
	 *
	 * @method  setUniformfv
	 * @param {String} name        		the name of the uniform
	 * @param {ArrayBuffer} arrayBuffer the array buffer
	 * @param {Number} count            optional, the explicit data type count, e.g. 2 for vec2
	 */
	setUniformfv: function(name, arrayBuffer, count) {
		count = count || arrayBuffer.length;
		var gl = this.gl;
		var loc = this.getUniformLocation(name);
		if (!loc) 
			return false;
		switch (count) {
			case 1: gl.uniform1fv(loc, arrayBuffer); return true;
			case 2: gl.uniform2fv(loc, arrayBuffer); return true;
			case 3: gl.uniform3fv(loc, arrayBuffer); return true;
			case 4: gl.uniform4fv(loc, arrayBuffer); return true;
			default:
				throw "invalid arguments to setUniformf"; 
		}
	},

	/**
	 * A convenience method to set uniformNiv from the given ArrayBuffer.
	 * We determine which GL call to make based on the length of the array 
	 * buffer (for 1-4 component vectors stored in a int array). To use
	 * this method to upload data to uniform arrays, you need to specify the
	 * 'count' parameter; i.e. the data type you are using for that array. If
	 * specified, this will dictate whether to call uniform1fv, uniform2fv, etc.
	 *
	 * @method  setUniformiv
	 * @param {String} name        		the name of the uniform
	 * @param {ArrayBuffer} arrayBuffer the array buffer
	 * @param {Number} count            optional, the explicit data type count, e.g. 2 for ivec2
	 */
	setUniformiv: function(name, arrayBuffer, count) {
		count = count || arrayBuffer.length;
		var gl = this.gl;
		var loc = this.getUniformLocation(name);
		if (!loc) 
			return false;
		switch (count) {
			case 1: gl.uniform1iv(loc, arrayBuffer); return true;
			case 2: gl.uniform2iv(loc, arrayBuffer); return true;
			case 3: gl.uniform3iv(loc, arrayBuffer); return true;
			case 4: gl.uniform4iv(loc, arrayBuffer); return true;
			default:
				throw "invalid arguments to setUniformf"; 
		}
	},

	/**
	 * This is a convenience function to pass a Matrix3 (from vecmath,
	 * kami's preferred math library) or a Float32Array (e.g. gl-matrix)
	 * to a shader. If mat is an object with "val", it is considered to be
	 * a Matrix3, otherwise assumed to be a typed array being passed directly
	 * to the shader.
	 * 
	 * @param {String} name the uniform name
	 * @param {Matrix3|Float32Array} mat a Matrix3 or Float32Array
	 * @param {Boolean} transpose whether to transpose the matrix, default false
	 */
	setUniformMatrix3: function(name, mat, transpose) {
		var arr = typeof mat === "object" && mat.val ? mat.val : mat;
		transpose = !!transpose; //to boolean

		var gl = this.gl;
		var loc = this.getUniformLocation(name);
		if (!loc) 
			return false;
		gl.uniformMatrix3fv(loc, transpose, arr)
	},

	/**
	 * This is a convenience function to pass a Matrix4 (from vecmath,
	 * kami's preferred math library) or a Float32Array (e.g. gl-matrix)
	 * to a shader. If mat is an object with "val", it is considered to be
	 * a Matrix4, otherwise assumed to be a typed array being passed directly
	 * to the shader.
	 * 
	 * @param {String} name the uniform name
	 * @param {Matrix4|Float32Array} mat a Matrix4 or Float32Array
	 * @param {Boolean} transpose whether to transpose the matrix, default false
	 */
	setUniformMatrix4: function(name, mat, transpose) {
		var arr = typeof mat === "object" && mat.val ? mat.val : mat;
		transpose = !!transpose; //to boolean

		var gl = this.gl;
		var loc = this.getUniformLocation(name);
		if (!loc) 
			return false;
		gl.uniformMatrix4fv(loc, transpose, arr)
	} 
 
});

//Some default attribute names that parts of kami will use
//when creating a standard shader.
ShaderProgram.POSITION_ATTRIBUTE = "Position";
ShaderProgram.NORMAL_ATTRIBUTE = "Normal";
ShaderProgram.COLOR_ATTRIBUTE = "Color";
ShaderProgram.TEXCOORD_ATTRIBUTE = "TexCoord";

module.exports = ShaderProgram;
},{"klasse":34}],31:[function(_dereq_,module,exports){
/**
  Auto-generated Kami index file.
  Created on 2014-03-24.
*/
module.exports = {
    //core classes
    'BaseBatch':       _dereq_('./BaseBatch.js'),
    'SpriteBatch':     _dereq_('./SpriteBatch.js'),
    'Texture':         _dereq_('./Texture.js'),
    'TextureRegion':   _dereq_('./TextureRegion.js'),
    'WebGLContext':    _dereq_('./WebGLContext.js'),
    'FrameBuffer':     _dereq_('./glutils/FrameBuffer.js'),
    'Mesh':            _dereq_('./glutils/Mesh.js'),
    'ShaderProgram':   _dereq_('./glutils/ShaderProgram.js')
};
},{"./BaseBatch.js":23,"./SpriteBatch.js":24,"./Texture.js":25,"./TextureRegion.js":26,"./WebGLContext.js":27,"./glutils/FrameBuffer.js":28,"./glutils/Mesh.js":29,"./glutils/ShaderProgram.js":30}],32:[function(_dereq_,module,exports){
module.exports=_dereq_(22)
},{}],33:[function(_dereq_,module,exports){
/*jslint onevar:true, undef:true, newcap:true, regexp:true, bitwise:true, maxerr:50, indent:4, white:false, nomen:false, plusplus:false */
/*global define:false, require:false, exports:false, module:false, signals:false */

/** @license
 * JS Signals <http://millermedeiros.github.com/js-signals/>
 * Released under the MIT license
 * Author: Miller Medeiros
 * Version: 1.0.0 - Build: 268 (2012/11/29 05:48 PM)
 */

(function(global){

    // SignalBinding -------------------------------------------------
    //================================================================

    /**
     * Object that represents a binding between a Signal and a listener function.
     * <br />- <strong>This is an internal constructor and shouldn't be called by regular users.</strong>
     * <br />- inspired by Joa Ebert AS3 SignalBinding and Robert Penner's Slot classes.
     * @author Miller Medeiros
     * @constructor
     * @internal
     * @name SignalBinding
     * @param {Signal} signal Reference to Signal object that listener is currently bound to.
     * @param {Function} listener Handler function bound to the signal.
     * @param {boolean} isOnce If binding should be executed just once.
     * @param {Object} [listenerContext] Context on which listener will be executed (object that should represent the `this` variable inside listener function).
     * @param {Number} [priority] The priority level of the event listener. (default = 0).
     */
    function SignalBinding(signal, listener, isOnce, listenerContext, priority) {

        /**
         * Handler function bound to the signal.
         * @type Function
         * @private
         */
        this._listener = listener;

        /**
         * If binding should be executed just once.
         * @type boolean
         * @private
         */
        this._isOnce = isOnce;

        /**
         * Context on which listener will be executed (object that should represent the `this` variable inside listener function).
         * @memberOf SignalBinding.prototype
         * @name context
         * @type Object|undefined|null
         */
        this.context = listenerContext;

        /**
         * Reference to Signal object that listener is currently bound to.
         * @type Signal
         * @private
         */
        this._signal = signal;

        /**
         * Listener priority
         * @type Number
         * @private
         */
        this._priority = priority || 0;
    }

    SignalBinding.prototype = {

        /**
         * If binding is active and should be executed.
         * @type boolean
         */
        active : true,

        /**
         * Default parameters passed to listener during `Signal.dispatch` and `SignalBinding.execute`. (curried parameters)
         * @type Array|null
         */
        params : null,

        /**
         * Call listener passing arbitrary parameters.
         * <p>If binding was added using `Signal.addOnce()` it will be automatically removed from signal dispatch queue, this method is used internally for the signal dispatch.</p>
         * @param {Array} [paramsArr] Array of parameters that should be passed to the listener
         * @return {*} Value returned by the listener.
         */
        execute : function (paramsArr) {
            var handlerReturn, params;
            if (this.active && !!this._listener) {
                params = this.params? this.params.concat(paramsArr) : paramsArr;
                handlerReturn = this._listener.apply(this.context, params);
                if (this._isOnce) {
                    this.detach();
                }
            }
            return handlerReturn;
        },

        /**
         * Detach binding from signal.
         * - alias to: mySignal.remove(myBinding.getListener());
         * @return {Function|null} Handler function bound to the signal or `null` if binding was previously detached.
         */
        detach : function () {
            return this.isBound()? this._signal.remove(this._listener, this.context) : null;
        },

        /**
         * @return {Boolean} `true` if binding is still bound to the signal and have a listener.
         */
        isBound : function () {
            return (!!this._signal && !!this._listener);
        },

        /**
         * @return {boolean} If SignalBinding will only be executed once.
         */
        isOnce : function () {
            return this._isOnce;
        },

        /**
         * @return {Function} Handler function bound to the signal.
         */
        getListener : function () {
            return this._listener;
        },

        /**
         * @return {Signal} Signal that listener is currently bound to.
         */
        getSignal : function () {
            return this._signal;
        },

        /**
         * Delete instance properties
         * @private
         */
        _destroy : function () {
            delete this._signal;
            delete this._listener;
            delete this.context;
        },

        /**
         * @return {string} String representation of the object.
         */
        toString : function () {
            return '[SignalBinding isOnce:' + this._isOnce +', isBound:'+ this.isBound() +', active:' + this.active + ']';
        }

    };


/*global SignalBinding:false*/

    // Signal --------------------------------------------------------
    //================================================================

    function validateListener(listener, fnName) {
        if (typeof listener !== 'function') {
            throw new Error( 'listener is a required param of {fn}() and should be a Function.'.replace('{fn}', fnName) );
        }
    }

    /**
     * Custom event broadcaster
     * <br />- inspired by Robert Penner's AS3 Signals.
     * @name Signal
     * @author Miller Medeiros
     * @constructor
     */
    function Signal() {
        /**
         * @type Array.<SignalBinding>
         * @private
         */
        this._bindings = [];
        this._prevParams = null;

        // enforce dispatch to aways work on same context (#47)
        var self = this;
        this.dispatch = function(){
            Signal.prototype.dispatch.apply(self, arguments);
        };
    }

    Signal.prototype = {

        /**
         * Signals Version Number
         * @type String
         * @const
         */
        VERSION : '1.0.0',

        /**
         * If Signal should keep record of previously dispatched parameters and
         * automatically execute listener during `add()`/`addOnce()` if Signal was
         * already dispatched before.
         * @type boolean
         */
        memorize : false,

        /**
         * @type boolean
         * @private
         */
        _shouldPropagate : true,

        /**
         * If Signal is active and should broadcast events.
         * <p><strong>IMPORTANT:</strong> Setting this property during a dispatch will only affect the next dispatch, if you want to stop the propagation of a signal use `halt()` instead.</p>
         * @type boolean
         */
        active : true,

        /**
         * @param {Function} listener
         * @param {boolean} isOnce
         * @param {Object} [listenerContext]
         * @param {Number} [priority]
         * @return {SignalBinding}
         * @private
         */
        _registerListener : function (listener, isOnce, listenerContext, priority) {

            var prevIndex = this._indexOfListener(listener, listenerContext),
                binding;

            if (prevIndex !== -1) {
                binding = this._bindings[prevIndex];
                if (binding.isOnce() !== isOnce) {
                    throw new Error('You cannot add'+ (isOnce? '' : 'Once') +'() then add'+ (!isOnce? '' : 'Once') +'() the same listener without removing the relationship first.');
                }
            } else {
                binding = new SignalBinding(this, listener, isOnce, listenerContext, priority);
                this._addBinding(binding);
            }

            if(this.memorize && this._prevParams){
                binding.execute(this._prevParams);
            }

            return binding;
        },

        /**
         * @param {SignalBinding} binding
         * @private
         */
        _addBinding : function (binding) {
            //simplified insertion sort
            var n = this._bindings.length;
            do { --n; } while (this._bindings[n] && binding._priority <= this._bindings[n]._priority);
            this._bindings.splice(n + 1, 0, binding);
        },

        /**
         * @param {Function} listener
         * @return {number}
         * @private
         */
        _indexOfListener : function (listener, context) {
            var n = this._bindings.length,
                cur;
            while (n--) {
                cur = this._bindings[n];
                if (cur._listener === listener && cur.context === context) {
                    return n;
                }
            }
            return -1;
        },

        /**
         * Check if listener was attached to Signal.
         * @param {Function} listener
         * @param {Object} [context]
         * @return {boolean} if Signal has the specified listener.
         */
        has : function (listener, context) {
            return this._indexOfListener(listener, context) !== -1;
        },

        /**
         * Add a listener to the signal.
         * @param {Function} listener Signal handler function.
         * @param {Object} [listenerContext] Context on which listener will be executed (object that should represent the `this` variable inside listener function).
         * @param {Number} [priority] The priority level of the event listener. Listeners with higher priority will be executed before listeners with lower priority. Listeners with same priority level will be executed at the same order as they were added. (default = 0)
         * @return {SignalBinding} An Object representing the binding between the Signal and listener.
         */
        add : function (listener, listenerContext, priority) {
            validateListener(listener, 'add');
            return this._registerListener(listener, false, listenerContext, priority);
        },

        /**
         * Add listener to the signal that should be removed after first execution (will be executed only once).
         * @param {Function} listener Signal handler function.
         * @param {Object} [listenerContext] Context on which listener will be executed (object that should represent the `this` variable inside listener function).
         * @param {Number} [priority] The priority level of the event listener. Listeners with higher priority will be executed before listeners with lower priority. Listeners with same priority level will be executed at the same order as they were added. (default = 0)
         * @return {SignalBinding} An Object representing the binding between the Signal and listener.
         */
        addOnce : function (listener, listenerContext, priority) {
            validateListener(listener, 'addOnce');
            return this._registerListener(listener, true, listenerContext, priority);
        },

        /**
         * Remove a single listener from the dispatch queue.
         * @param {Function} listener Handler function that should be removed.
         * @param {Object} [context] Execution context (since you can add the same handler multiple times if executing in a different context).
         * @return {Function} Listener handler function.
         */
        remove : function (listener, context) {
            validateListener(listener, 'remove');

            var i = this._indexOfListener(listener, context);
            if (i !== -1) {
                this._bindings[i]._destroy(); //no reason to a SignalBinding exist if it isn't attached to a signal
                this._bindings.splice(i, 1);
            }
            return listener;
        },

        /**
         * Remove all listeners from the Signal.
         */
        removeAll : function () {
            var n = this._bindings.length;
            while (n--) {
                this._bindings[n]._destroy();
            }
            this._bindings.length = 0;
        },

        /**
         * @return {number} Number of listeners attached to the Signal.
         */
        getNumListeners : function () {
            return this._bindings.length;
        },

        /**
         * Stop propagation of the event, blocking the dispatch to next listeners on the queue.
         * <p><strong>IMPORTANT:</strong> should be called only during signal dispatch, calling it before/after dispatch won't affect signal broadcast.</p>
         * @see Signal.prototype.disable
         */
        halt : function () {
            this._shouldPropagate = false;
        },

        /**
         * Dispatch/Broadcast Signal to all listeners added to the queue.
         * @param {...*} [params] Parameters that should be passed to each handler.
         */
        dispatch : function (params) {
            if (! this.active) {
                return;
            }

            var paramsArr = Array.prototype.slice.call(arguments),
                n = this._bindings.length,
                bindings;

            if (this.memorize) {
                this._prevParams = paramsArr;
            }

            if (! n) {
                //should come after memorize
                return;
            }

            bindings = this._bindings.slice(); //clone array in case add/remove items during dispatch
            this._shouldPropagate = true; //in case `halt` was called before dispatch or during the previous dispatch.

            //execute all callbacks until end of the list or until a callback returns `false` or stops propagation
            //reverse loop since listeners with higher priority will be added at the end of the list
            do { n--; } while (bindings[n] && this._shouldPropagate && bindings[n].execute(paramsArr) !== false);
        },

        /**
         * Forget memorized arguments.
         * @see Signal.memorize
         */
        forget : function(){
            this._prevParams = null;
        },

        /**
         * Remove all bindings from signal and destroy any reference to external objects (destroy Signal object).
         * <p><strong>IMPORTANT:</strong> calling any method on the signal instance after calling dispose will throw errors.</p>
         */
        dispose : function () {
            this.removeAll();
            delete this._bindings;
            delete this._prevParams;
        },

        /**
         * @return {string} String representation of the object.
         */
        toString : function () {
            return '[Signal active:'+ this.active +' numListeners:'+ this.getNumListeners() +']';
        }

    };


    // Namespace -----------------------------------------------------
    //================================================================

    /**
     * Signals namespace
     * @namespace
     * @name signals
     */
    var signals = Signal;

    /**
     * Custom event broadcaster
     * @see Signal
     */
    // alias for backwards compatibility (see #gh-44)
    signals.Signal = Signal;



    //exports to multiple environments
    if(typeof define === 'function' && define.amd){ //AMD
        define(function () { return signals; });
    } else if (typeof module !== 'undefined' && module.exports){ //node
        module.exports = signals;
    } else { //browser
        //use string because of Google closure compiler ADVANCED_MODE
        /*jslint sub:true */
        global['signals'] = signals;
    }

}(this));

},{}],34:[function(_dereq_,module,exports){
function hasGetterOrSetter(def) {
	return (!!def.get && typeof def.get === "function") || (!!def.set && typeof def.set === "function");
}

function getProperty(definition, k, isClassDescriptor) {
	//This may be a lightweight object, OR it might be a property
	//that was defined previously.
	
	//For simple class descriptors we can just assume its NOT previously defined.
	var def = isClassDescriptor 
				? definition[k] 
				: Object.getOwnPropertyDescriptor(definition, k);

	if (!isClassDescriptor && def.value && typeof def.value === "object") {
		def = def.value;
	}


	//This might be a regular property, or it may be a getter/setter the user defined in a class.
	if ( def && hasGetterOrSetter(def) ) {
		if (typeof def.enumerable === "undefined")
			def.enumerable = true;
		if (typeof def.configurable === "undefined")
			def.configurable = true;
		return def;
	} else {
		return false;
	}
}

function hasNonConfigurable(obj, k) {
	var prop = Object.getOwnPropertyDescriptor(obj, k);
	if (!prop)
		return false;

	if (prop.value && typeof prop.value === "object")
		prop = prop.value;

	if (prop.configurable === false) 
		return true;

	return false;
}

//TODO: On create, 
//		On mixin, 

function extend(ctor, definition, isClassDescriptor, extend) {
	for (var k in definition) {
		if (!definition.hasOwnProperty(k))
			continue;

		var def = getProperty(definition, k, isClassDescriptor);

		if (def !== false) {
			//If Extends is used, we will check its prototype to see if 
			//the final variable exists.
			
			var parent = extend || ctor;
			if (hasNonConfigurable(parent.prototype, k)) {

				//just skip the final property
				if (Class.ignoreFinals)
					continue;

				//We cannot re-define a property that is configurable=false.
				//So we will consider them final and throw an error. This is by
				//default so it is clear to the developer what is happening.
				//You can set ignoreFinals to true if you need to extend a class
				//which has configurable=false; it will simply not re-define final properties.
				throw new Error("cannot override final property '"+k
							+"', set Class.ignoreFinals = true to skip");
			}

			Object.defineProperty(ctor.prototype, k, def);
		} else {
			ctor.prototype[k] = definition[k];
		}

	}
}

/**
 */
function mixin(myClass, mixins) {
	if (!mixins)
		return;

	if (!Array.isArray(mixins))
		mixins = [mixins];

	for (var i=0; i<mixins.length; i++) {
		extend(myClass, mixins[i].prototype || mixins[i]);
	}
}

/**
 * Creates a new class with the given descriptor.
 * The constructor, defined by the name `initialize`,
 * is an optional function. If unspecified, an anonymous
 * function will be used which calls the parent class (if
 * one exists). 
 *
 * You can also use `Extends` and `Mixins` to provide subclassing
 * and inheritance.
 *
 * @class  Class
 * @constructor
 * @param {Object} definition a dictionary of functions for the class
 * @example
 *
 * 		var MyClass = new Class({
 * 		
 * 			initialize: function() {
 * 				this.foo = 2.0;
 * 			},
 *
 * 			bar: function() {
 * 				return this.foo + 5;
 * 			}
 * 		});
 */
function Class(definition) {
	if (!definition)
		definition = {};

	//The variable name here dictates what we see in Chrome debugger
	var initialize;
	var Extends;

	if (definition.initialize) {
		if (typeof definition.initialize !== "function")
			throw new Error("initialize must be a function");
		initialize = definition.initialize;

		//Usually we should avoid "delete" in V8 at all costs.
		//However, its unlikely to make any performance difference
		//here since we only call this on class creation (i.e. not object creation).
		delete definition.initialize;
	} else {
		if (definition.Extends) {
			var base = definition.Extends;
			initialize = function () {
				base.apply(this, arguments);
			}; 
		} else {
			initialize = function () {}; 
		}
	}

	if (definition.Extends) {
		initialize.prototype = Object.create(definition.Extends.prototype);
		initialize.prototype.constructor = initialize;
		//for getOwnPropertyDescriptor to work, we need to act
		//directly on the Extends (or Mixin)
		Extends = definition.Extends;
		delete definition.Extends;
	} else {
		initialize.prototype.constructor = initialize;
	}

	//Grab the mixins, if they are specified...
	var mixins = null;
	if (definition.Mixins) {
		mixins = definition.Mixins;
		delete definition.Mixins;
	}

	//First, mixin if we can.
	mixin(initialize, mixins);

	//Now we grab the actual definition which defines the overrides.
	extend(initialize, definition, true, Extends);

	return initialize;
};

Class.extend = extend;
Class.mixin = mixin;
Class.ignoreFinals = false;

module.exports = Class;
},{}],35:[function(_dereq_,module,exports){
module.exports={"version": "1.3.3"}
},{}],36:[function(_dereq_,module,exports){
/*
 * Poly2Tri Copyright (c) 2009-2013, Poly2Tri Contributors
 * http://code.google.com/p/poly2tri/
 * 
 * poly2tri.js (JavaScript port) (c) 2009-2013, Poly2Tri Contributors
 * https://github.com/r3mi/poly2tri.js
 * 
 * All rights reserved.
 * 
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */

/* jshint maxcomplexity:11 */

"use strict";


/*
 * Note
 * ====
 * the structure of this JavaScript version of poly2tri intentionally follows
 * as closely as possible the structure of the reference C++ version, to make it 
 * easier to keep the 2 versions in sync.
 */


// -------------------------------------------------------------------------Node

/**
 * Advancing front node
 * @param {Point} p any "Point like" object with {x,y} (duck typing)
 * @param {Triangle} t triangle (optionnal)
 */
var Node = function(p, t) {
    this.point = p;
    this.triangle = t || null;

    this.next = null; // Node
    this.prev = null; // Node

    this.value = p.x;
};

// ---------------------------------------------------------------AdvancingFront
var AdvancingFront = function(head, tail) {
    this.head_ = head; // Node
    this.tail_ = tail; // Node
    this.search_node_ = head; // Node
};

AdvancingFront.prototype.head = function() {
    return this.head_;
};

AdvancingFront.prototype.setHead = function(node) {
    this.head_ = node;
};

AdvancingFront.prototype.tail = function() {
    return this.tail_;
};

AdvancingFront.prototype.setTail = function(node) {
    this.tail_ = node;
};

AdvancingFront.prototype.search = function() {
    return this.search_node_;
};

AdvancingFront.prototype.setSearch = function(node) {
    this.search_node_ = node;
};

AdvancingFront.prototype.findSearchNode = function(/*x*/) {
    // TODO: implement BST index
    return this.search_node_;
};

AdvancingFront.prototype.locateNode = function(x) {
    var node = this.search_node_;

    /* jshint boss:true */
    if (x < node.value) {
        while (node = node.prev) {
            if (x >= node.value) {
                this.search_node_ = node;
                return node;
            }
        }
    } else {
        while (node = node.next) {
            if (x < node.value) {
                this.search_node_ = node.prev;
                return node.prev;
            }
        }
    }
    return null;
};

AdvancingFront.prototype.locatePoint = function(point) {
    var px = point.x;
    var node = this.findSearchNode(px);
    var nx = node.point.x;

    if (px === nx) {
        // Here we are comparing point references, not values
        if (point !== node.point) {
            // We might have two nodes with same x value for a short time
            if (point === node.prev.point) {
                node = node.prev;
            } else if (point === node.next.point) {
                node = node.next;
            } else {
                throw new Error('poly2tri Invalid AdvancingFront.locatePoint() call');
            }
        }
    } else if (px < nx) {
        /* jshint boss:true */
        while (node = node.prev) {
            if (point === node.point) {
                break;
            }
        }
    } else {
        while (node = node.next) {
            if (point === node.point) {
                break;
            }
        }
    }

    if (node) {
        this.search_node_ = node;
    }
    return node;
};


// ----------------------------------------------------------------------Exports

module.exports = AdvancingFront;
module.exports.Node = Node;


},{}],37:[function(_dereq_,module,exports){
/*
 * Poly2Tri Copyright (c) 2009-2013, Poly2Tri Contributors
 * http://code.google.com/p/poly2tri/
 * 
 * poly2tri.js (JavaScript port) (c) 2009-2013, Poly2Tri Contributors
 * https://github.com/r3mi/poly2tri.js
 * 
 * All rights reserved.
 * 
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */

"use strict";


/*
 * Note
 * ====
 * the structure of this JavaScript version of poly2tri intentionally follows
 * as closely as possible the structure of the reference C++ version, to make it 
 * easier to keep the 2 versions in sync.
 */

var xy = _dereq_('./xy');

// ------------------------------------------------------------------------Point
/**
 * Construct a point
 * @param {Number} x    coordinate (0 if undefined)
 * @param {Number} y    coordinate (0 if undefined)
 */
var Point = function(x, y) {
    this.x = +x || 0;
    this.y = +y || 0;

    // All extra fields added to Point are prefixed with _p2t_
    // to avoid collisions if custom Point class is used.

    // The edges this point constitutes an upper ending point
    this._p2t_edge_list = null;
};

/**
 * For pretty printing ex. <i>"(5;42)"</i>)
 */
Point.prototype.toString = function() {
    return xy.toStringBase(this);
};

/**
 * Creates a copy of this Point object.
 * @returns Point
 */
Point.prototype.clone = function() {
    return new Point(this.x, this.y);
};

/**
 * Set this Point instance to the origo. <code>(0; 0)</code>
 */
Point.prototype.set_zero = function() {
    this.x = 0.0;
    this.y = 0.0;
    return this; // for chaining
};

/**
 * Set the coordinates of this instance.
 * @param   x   number.
 * @param   y   number;
 */
Point.prototype.set = function(x, y) {
    this.x = +x || 0;
    this.y = +y || 0;
    return this; // for chaining
};

/**
 * Negate this Point instance. (component-wise)
 */
Point.prototype.negate = function() {
    this.x = -this.x;
    this.y = -this.y;
    return this; // for chaining
};

/**
 * Add another Point object to this instance. (component-wise)
 * @param   n   Point object.
 */
Point.prototype.add = function(n) {
    this.x += n.x;
    this.y += n.y;
    return this; // for chaining
};

/**
 * Subtract this Point instance with another point given. (component-wise)
 * @param   n   Point object.
 */
Point.prototype.sub = function(n) {
    this.x -= n.x;
    this.y -= n.y;
    return this; // for chaining
};

/**
 * Multiply this Point instance by a scalar. (component-wise)
 * @param   s   scalar.
 */
Point.prototype.mul = function(s) {
    this.x *= s;
    this.y *= s;
    return this; // for chaining
};

/**
 * Return the distance of this Point instance from the origo.
 */
Point.prototype.length = function() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
};

/**
 * Normalize this Point instance (as a vector).
 * @return The original distance of this instance from the origo.
 */
Point.prototype.normalize = function() {
    var len = this.length();
    this.x /= len;
    this.y /= len;
    return len;
};

/**
 * Test this Point object with another for equality.
 * @param   p   any "Point like" object with {x,y} (duck typing)
 * @return <code>True</code> if <code>this == p</code>, <code>false</code> otherwise.
 */
Point.prototype.equals = function(p) {
    return this.x === p.x && this.y === p.y;
};


// -----------------------------------------------------Point ("static" methods)

/**
 * Negate a point component-wise and return the result as a new Point object.
 * @param   p   Point object.
 * @return the resulting Point object.
 */
Point.negate = function(p) {
    return new Point(-p.x, -p.y);
};

/**
 * Add two points component-wise and return the result as a new Point object.
 * @param   a   Point object.
 * @param   b   Point object.
 * @return the resulting Point object.
 */
Point.add = function(a, b) {
    return new Point(a.x + b.x, a.y + b.y);
};

/**
 * Subtract two points component-wise and return the result as a new Point object.
 * @param   a   Point object.
 * @param   b   Point object.
 * @return the resulting Point object.
 */
Point.sub = function(a, b) {
    return new Point(a.x - b.x, a.y - b.y);
};

/**
 * Multiply a point by a scalar and return the result as a new Point object.
 * @param   s   the scalar (a number).
 * @param   p   Point object.
 * @return the resulting Point object.
 */
Point.mul = function(s, p) {
    return new Point(s * p.x, s * p.y);
};

/**
 * Perform the cross product on either two points (this produces a scalar)
 * or a point and a scalar (this produces a point).
 * This function requires two parameters, either may be a Point object or a
 * number.
 * @param   a   Point object or scalar.
 * @param   b   Point object or scalar.
 * @return  a   Point object or a number, depending on the parameters.
 */
Point.cross = function(a, b) {
    if (typeof(a) === 'number') {
        if (typeof(b) === 'number') {
            return a * b;
        } else {
            return new Point(-a * b.y, a * b.x);
        }
    } else {
        if (typeof(b) === 'number') {
            return new Point(b * a.y, -b * a.x);
        } else {
            return a.x * b.y - a.y * b.x;
        }
    }
};


// -----------------------------------------------------------------"Point-Like"
/*
 * The following functions operate on "Point" or any "Point like" object 
 * with {x,y} (duck typing).
 */

Point.toString = xy.toString;
Point.compare = xy.compare;
Point.cmp = xy.compare; // backward compatibility
Point.equals = xy.equals;

/**
 * Peform the dot product on two vectors.
 * @param   a,b   any "Point like" objects with {x,y} 
 * @return The dot product (as a number).
 */
Point.dot = function(a, b) {
    return a.x * b.x + a.y * b.y;
};


// ---------------------------------------------------------Exports (public API)

module.exports = Point;

},{"./xy":44}],38:[function(_dereq_,module,exports){
/*
 * Poly2Tri Copyright (c) 2009-2013, Poly2Tri Contributors
 * http://code.google.com/p/poly2tri/
 * 
 * poly2tri.js (JavaScript port) (c) 2009-2013, Poly2Tri Contributors
 * https://github.com/r3mi/poly2tri.js
 * 
 * All rights reserved.
 * 
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */

"use strict";

/*
 * Class added in the JavaScript version (was not present in the c++ version)
 */

var xy = _dereq_('./xy');

/**
 * Custom exception class to indicate invalid Point values
 * @param {String} message          error message
 * @param {array<Point>} points     invalid points
 */
var PointError = function(message, points) {
    this.name = "PointError";
    this.points = points = points || [];
    this.message = message || "Invalid Points!";
    for (var i = 0; i < points.length; i++) {
        this.message += " " + xy.toString(points[i]);
    }
};
PointError.prototype = new Error();
PointError.prototype.constructor = PointError;


module.exports = PointError;

},{"./xy":44}],39:[function(_dereq_,module,exports){
(function (global){
/*
 * Poly2Tri Copyright (c) 2009-2013, Poly2Tri Contributors
 * http://code.google.com/p/poly2tri/
 * 
 * poly2tri.js (JavaScript port) (c) 2009-2013, Poly2Tri Contributors
 * https://github.com/r3mi/poly2tri.js
 *
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *
 * * Redistributions of source code must retain the above copyright notice,
 *   this list of conditions and the following disclaimer.
 * * Redistributions in binary form must reproduce the above copyright notice,
 *   this list of conditions and the following disclaimer in the documentation
 *   and/or other materials provided with the distribution.
 * * Neither the name of Poly2Tri nor the names of its contributors may be
 *   used to endorse or promote products derived from this software without specific
 *   prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

"use strict";

/*
 * Public API for poly2tri.js
 * ==========================
 */


/*
 * for Browser + <script> : 
 * return the poly2tri global variable to its previous value. 
 * (this feature is not automatically provided by browserify).
 */
var previousPoly2tri = global.poly2tri;
exports.noConflict = function() {
    global.poly2tri = previousPoly2tri;
    return exports;
};

exports.VERSION = _dereq_('../dist/version.json').version;

exports.PointError = _dereq_('./pointerror');
exports.Point = _dereq_('./point');
exports.Triangle = _dereq_('./triangle');
exports.SweepContext = _dereq_('./sweepcontext');


// Backward compatibility
var sweep = _dereq_('./sweep');
exports.triangulate = sweep.triangulate;
exports.sweep = {Triangulate: sweep.triangulate};

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../dist/version.json":35,"./point":37,"./pointerror":38,"./sweep":40,"./sweepcontext":41,"./triangle":42}],40:[function(_dereq_,module,exports){
/*
 * Poly2Tri Copyright (c) 2009-2013, Poly2Tri Contributors
 * http://code.google.com/p/poly2tri/
 * 
 * poly2tri.js (JavaScript port) (c) 2009-2013, Poly2Tri Contributors
 * https://github.com/r3mi/poly2tri.js
 * 
 * All rights reserved.
 * 
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */

/* jshint latedef:nofunc, maxcomplexity:9 */

"use strict";


/*
 * Note
 * ====
 * the structure of this JavaScript version of poly2tri intentionally follows
 * as closely as possible the structure of the reference C++ version, to make it 
 * easier to keep the 2 versions in sync.
 *
 * This 'Sweep' module is present in order to keep this JavaScript version 
 * as close as possible to the reference C++ version, even though almost all
 * functions could be declared as methods on the SweepContext object.
 */

var PointError = _dereq_('./pointerror');
var Triangle = _dereq_('./triangle');
var Node = _dereq_('./advancingfront').Node;


// ------------------------------------------------------------------------utils

var utils = _dereq_('./utils');

var PI_3div4 = 3 * Math.PI / 4;
var PI_div2 = Math.PI / 2;
var EPSILON = utils.EPSILON;

var Orientation = utils.Orientation;
var orient2d = utils.orient2d;
var inScanArea = utils.inScanArea;


// ------------------------------------------------------------------------Sweep

/**
 * Triangulate the polygon with holes and Steiner points.
 * Do this AFTER you've added the polyline, holes, and Steiner points
 * @param   tcx SweepContext object.
 */
function triangulate(tcx) {
    tcx.initTriangulation();
    tcx.createAdvancingFront();
    // Sweep points; build mesh
    sweepPoints(tcx);
    // Clean up
    finalizationPolygon(tcx);
}

/**
 * Start sweeping the Y-sorted point set from bottom to top
 * @param   tcx SweepContext object.
 */
function sweepPoints(tcx) {
    var i, len = tcx.pointCount();
    for (i = 1; i < len; ++i) {
        var point = tcx.getPoint(i);
        var node = pointEvent(tcx, point);
        var edges = point._p2t_edge_list;
        for (var j = 0; edges && j < edges.length; ++j) {
            edgeEventByEdge(tcx, edges[j], node);
        }
    }
}

function finalizationPolygon(tcx) {
    // Get an Internal triangle to start with
    var t = tcx.front().head().next.triangle;
    var p = tcx.front().head().next.point;
    while (!t.getConstrainedEdgeCW(p)) {
        t = t.neighborCCW(p);
    }

    // Collect interior triangles constrained by edges
    tcx.meshClean(t);
}

/**
 * Find closes node to the left of the new point and
 * create a new triangle. If needed new holes and basins
 * will be filled to.
 */
function pointEvent(tcx, point) {
    var node = tcx.locateNode(point);
    var new_node = newFrontTriangle(tcx, point, node);

    // Only need to check +epsilon since point never have smaller
    // x value than node due to how we fetch nodes from the front
    if (point.x <= node.point.x + (EPSILON)) {
        fill(tcx, node);
    }

    //tcx.AddNode(new_node);

    fillAdvancingFront(tcx, new_node);
    return new_node;
}

function edgeEventByEdge(tcx, edge, node) {
    tcx.edge_event.constrained_edge = edge;
    tcx.edge_event.right = (edge.p.x > edge.q.x);

    if (isEdgeSideOfTriangle(node.triangle, edge.p, edge.q)) {
        return;
    }

    // For now we will do all needed filling
    // TODO: integrate with flip process might give some better performance
    //       but for now this avoid the issue with cases that needs both flips and fills
    fillEdgeEvent(tcx, edge, node);
    edgeEventByPoints(tcx, edge.p, edge.q, node.triangle, edge.q);
}

function edgeEventByPoints(tcx, ep, eq, triangle, point) {
    if (isEdgeSideOfTriangle(triangle, ep, eq)) {
        return;
    }

    var p1 = triangle.pointCCW(point);
    var o1 = orient2d(eq, p1, ep);
    if (o1 === Orientation.COLLINEAR) {
        // TODO integrate here changes from C++ version
        // (C++ repo revision 09880a869095 dated March 8, 2011)
        throw new PointError('poly2tri EdgeEvent: Collinear not supported!', [eq, p1, ep]);
    }

    var p2 = triangle.pointCW(point);
    var o2 = orient2d(eq, p2, ep);
    if (o2 === Orientation.COLLINEAR) {
        // TODO integrate here changes from C++ version
        // (C++ repo revision 09880a869095 dated March 8, 2011)
        throw new PointError('poly2tri EdgeEvent: Collinear not supported!', [eq, p2, ep]);
    }

    if (o1 === o2) {
        // Need to decide if we are rotating CW or CCW to get to a triangle
        // that will cross edge
        if (o1 === Orientation.CW) {
            triangle = triangle.neighborCCW(point);
        } else {
            triangle = triangle.neighborCW(point);
        }
        edgeEventByPoints(tcx, ep, eq, triangle, point);
    } else {
        // This triangle crosses constraint so lets flippin start!
        flipEdgeEvent(tcx, ep, eq, triangle, point);
    }
}

function isEdgeSideOfTriangle(triangle, ep, eq) {
    var index = triangle.edgeIndex(ep, eq);
    if (index !== -1) {
        triangle.markConstrainedEdgeByIndex(index);
        var t = triangle.getNeighbor(index);
        if (t) {
            t.markConstrainedEdgeByPoints(ep, eq);
        }
        return true;
    }
    return false;
}

/**
 * Creates a new front triangle and legalize it
 */
function newFrontTriangle(tcx, point, node) {
    var triangle = new Triangle(point, node.point, node.next.point);

    triangle.markNeighbor(node.triangle);
    tcx.addToMap(triangle);

    var new_node = new Node(point);
    new_node.next = node.next;
    new_node.prev = node;
    node.next.prev = new_node;
    node.next = new_node;

    if (!legalize(tcx, triangle)) {
        tcx.mapTriangleToNodes(triangle);
    }

    return new_node;
}

/**
 * Adds a triangle to the advancing front to fill a hole.
 * @param tcx
 * @param node - middle node, that is the bottom of the hole
 */
function fill(tcx, node) {
    var triangle = new Triangle(node.prev.point, node.point, node.next.point);

    // TODO: should copy the constrained_edge value from neighbor triangles
    //       for now constrained_edge values are copied during the legalize
    triangle.markNeighbor(node.prev.triangle);
    triangle.markNeighbor(node.triangle);

    tcx.addToMap(triangle);

    // Update the advancing front
    node.prev.next = node.next;
    node.next.prev = node.prev;


    // If it was legalized the triangle has already been mapped
    if (!legalize(tcx, triangle)) {
        tcx.mapTriangleToNodes(triangle);
    }

    //tcx.removeNode(node);
}

/**
 * Fills holes in the Advancing Front
 */
function fillAdvancingFront(tcx, n) {
    // Fill right holes
    var node = n.next;
    var angle;
    while (node.next) {
        // TODO integrate here changes from C++ version
        // (C++ repo revision acf81f1f1764 dated April 7, 2012)
        angle = holeAngle(node);
        if (angle > PI_div2 || angle < -(PI_div2)) {
            break;
        }
        fill(tcx, node);
        node = node.next;
    }

    // Fill left holes
    node = n.prev;
    while (node.prev) {
        // TODO integrate here changes from C++ version
        // (C++ repo revision acf81f1f1764 dated April 7, 2012)
        angle = holeAngle(node);
        if (angle > PI_div2 || angle < -(PI_div2)) {
            break;
        }
        fill(tcx, node);
        node = node.prev;
    }

    // Fill right basins
    if (n.next && n.next.next) {
        angle = basinAngle(n);
        if (angle < PI_3div4) {
            fillBasin(tcx, n);
        }
    }
}

/**
 * The basin angle is decided against the horizontal line [1,0]
 */
function basinAngle(node) {
    var ax = node.point.x - node.next.next.point.x;
    var ay = node.point.y - node.next.next.point.y;
    return Math.atan2(ay, ax);
}

/**
 *
 * @param node - middle node
 * @return the angle between 3 front nodes
 */
function holeAngle(node) {
    /* Complex plane
     * ab = cosA +i*sinA
     * ab = (ax + ay*i)(bx + by*i) = (ax*bx + ay*by) + i(ax*by-ay*bx)
     * atan2(y,x) computes the principal value of the argument function
     * applied to the complex number x+iy
     * Where x = ax*bx + ay*by
     *       y = ax*by - ay*bx
     */
    var ax = node.next.point.x - node.point.x;
    var ay = node.next.point.y - node.point.y;
    var bx = node.prev.point.x - node.point.x;
    var by = node.prev.point.y - node.point.y;
    return Math.atan2(ax * by - ay * bx, ax * bx + ay * by);
}

/**
 * Returns true if triangle was legalized
 */
function legalize(tcx, t) {
    // To legalize a triangle we start by finding if any of the three edges
    // violate the Delaunay condition
    for (var i = 0; i < 3; ++i) {
        if (t.delaunay_edge[i]) {
            continue;
        }
        var ot = t.getNeighbor(i);
        if (ot) {
            var p = t.getPoint(i);
            var op = ot.oppositePoint(t, p);
            var oi = ot.index(op);

            // If this is a Constrained Edge or a Delaunay Edge(only during recursive legalization)
            // then we should not try to legalize
            if (ot.constrained_edge[oi] || ot.delaunay_edge[oi]) {
                t.constrained_edge[i] = ot.constrained_edge[oi];
                continue;
            }

            var inside = inCircle(p, t.pointCCW(p), t.pointCW(p), op);
            if (inside) {
                // Lets mark this shared edge as Delaunay
                t.delaunay_edge[i] = true;
                ot.delaunay_edge[oi] = true;

                // Lets rotate shared edge one vertex CW to legalize it
                rotateTrianglePair(t, p, ot, op);

                // We now got one valid Delaunay Edge shared by two triangles
                // This gives us 4 new edges to check for Delaunay

                // Make sure that triangle to node mapping is done only one time for a specific triangle
                var not_legalized = !legalize(tcx, t);
                if (not_legalized) {
                    tcx.mapTriangleToNodes(t);
                }

                not_legalized = !legalize(tcx, ot);
                if (not_legalized) {
                    tcx.mapTriangleToNodes(ot);
                }
                // Reset the Delaunay edges, since they only are valid Delaunay edges
                // until we add a new triangle or point.
                // XXX: need to think about this. Can these edges be tried after we
                //      return to previous recursive level?
                t.delaunay_edge[i] = false;
                ot.delaunay_edge[oi] = false;

                // If triangle have been legalized no need to check the other edges since
                // the recursive legalization will handles those so we can end here.
                return true;
            }
        }
    }
    return false;
}

/**
 * <b>Requirement</b>:<br>
 * 1. a,b and c form a triangle.<br>
 * 2. a and d is know to be on opposite side of bc<br>
 * <pre>
 *                a
 *                +
 *               / \
 *              /   \
 *            b/     \c
 *            +-------+
 *           /    d    \
 *          /           \
 * </pre>
 * <b>Fact</b>: d has to be in area B to have a chance to be inside the circle formed by
 *  a,b and c<br>
 *  d is outside B if orient2d(a,b,d) or orient2d(c,a,d) is CW<br>
 *  This preknowledge gives us a way to optimize the incircle test
 * @param pa - triangle point, opposite d
 * @param pb - triangle point
 * @param pc - triangle point
 * @param pd - point opposite a
 * @return true if d is inside circle, false if on circle edge
 */
function inCircle(pa, pb, pc, pd) {
    var adx = pa.x - pd.x;
    var ady = pa.y - pd.y;
    var bdx = pb.x - pd.x;
    var bdy = pb.y - pd.y;

    var adxbdy = adx * bdy;
    var bdxady = bdx * ady;
    var oabd = adxbdy - bdxady;
    if (oabd <= 0) {
        return false;
    }

    var cdx = pc.x - pd.x;
    var cdy = pc.y - pd.y;

    var cdxady = cdx * ady;
    var adxcdy = adx * cdy;
    var ocad = cdxady - adxcdy;
    if (ocad <= 0) {
        return false;
    }

    var bdxcdy = bdx * cdy;
    var cdxbdy = cdx * bdy;

    var alift = adx * adx + ady * ady;
    var blift = bdx * bdx + bdy * bdy;
    var clift = cdx * cdx + cdy * cdy;

    var det = alift * (bdxcdy - cdxbdy) + blift * ocad + clift * oabd;
    return det > 0;
}

/**
 * Rotates a triangle pair one vertex CW
 *<pre>
 *       n2                    n2
 *  P +-----+             P +-----+
 *    | t  /|               |\  t |
 *    |   / |               | \   |
 *  n1|  /  |n3           n1|  \  |n3
 *    | /   |    after CW   |   \ |
 *    |/ oT |               | oT \|
 *    +-----+ oP            +-----+
 *       n4                    n4
 * </pre>
 */
function rotateTrianglePair(t, p, ot, op) {
    var n1, n2, n3, n4;
    n1 = t.neighborCCW(p);
    n2 = t.neighborCW(p);
    n3 = ot.neighborCCW(op);
    n4 = ot.neighborCW(op);

    var ce1, ce2, ce3, ce4;
    ce1 = t.getConstrainedEdgeCCW(p);
    ce2 = t.getConstrainedEdgeCW(p);
    ce3 = ot.getConstrainedEdgeCCW(op);
    ce4 = ot.getConstrainedEdgeCW(op);

    var de1, de2, de3, de4;
    de1 = t.getDelaunayEdgeCCW(p);
    de2 = t.getDelaunayEdgeCW(p);
    de3 = ot.getDelaunayEdgeCCW(op);
    de4 = ot.getDelaunayEdgeCW(op);

    t.legalize(p, op);
    ot.legalize(op, p);

    // Remap delaunay_edge
    ot.setDelaunayEdgeCCW(p, de1);
    t.setDelaunayEdgeCW(p, de2);
    t.setDelaunayEdgeCCW(op, de3);
    ot.setDelaunayEdgeCW(op, de4);

    // Remap constrained_edge
    ot.setConstrainedEdgeCCW(p, ce1);
    t.setConstrainedEdgeCW(p, ce2);
    t.setConstrainedEdgeCCW(op, ce3);
    ot.setConstrainedEdgeCW(op, ce4);

    // Remap neighbors
    // XXX: might optimize the markNeighbor by keeping track of
    //      what side should be assigned to what neighbor after the
    //      rotation. Now mark neighbor does lots of testing to find
    //      the right side.
    t.clearNeigbors();
    ot.clearNeigbors();
    if (n1) {
        ot.markNeighbor(n1);
    }
    if (n2) {
        t.markNeighbor(n2);
    }
    if (n3) {
        t.markNeighbor(n3);
    }
    if (n4) {
        ot.markNeighbor(n4);
    }
    t.markNeighbor(ot);
}

/**
 * Fills a basin that has formed on the Advancing Front to the right
 * of given node.<br>
 * First we decide a left,bottom and right node that forms the
 * boundaries of the basin. Then we do a reqursive fill.
 *
 * @param tcx
 * @param node - starting node, this or next node will be left node
 */
function fillBasin(tcx, node) {
    if (orient2d(node.point, node.next.point, node.next.next.point) === Orientation.CCW) {
        tcx.basin.left_node = node.next.next;
    } else {
        tcx.basin.left_node = node.next;
    }

    // Find the bottom and right node
    tcx.basin.bottom_node = tcx.basin.left_node;
    while (tcx.basin.bottom_node.next && tcx.basin.bottom_node.point.y >= tcx.basin.bottom_node.next.point.y) {
        tcx.basin.bottom_node = tcx.basin.bottom_node.next;
    }
    if (tcx.basin.bottom_node === tcx.basin.left_node) {
        // No valid basin
        return;
    }

    tcx.basin.right_node = tcx.basin.bottom_node;
    while (tcx.basin.right_node.next && tcx.basin.right_node.point.y < tcx.basin.right_node.next.point.y) {
        tcx.basin.right_node = tcx.basin.right_node.next;
    }
    if (tcx.basin.right_node === tcx.basin.bottom_node) {
        // No valid basins
        return;
    }

    tcx.basin.width = tcx.basin.right_node.point.x - tcx.basin.left_node.point.x;
    tcx.basin.left_highest = tcx.basin.left_node.point.y > tcx.basin.right_node.point.y;

    fillBasinReq(tcx, tcx.basin.bottom_node);
}

/**
 * Recursive algorithm to fill a Basin with triangles
 *
 * @param tcx
 * @param node - bottom_node
 */
function fillBasinReq(tcx, node) {
    // if shallow stop filling
    if (isShallow(tcx, node)) {
        return;
    }

    fill(tcx, node);

    var o;
    if (node.prev === tcx.basin.left_node && node.next === tcx.basin.right_node) {
        return;
    } else if (node.prev === tcx.basin.left_node) {
        o = orient2d(node.point, node.next.point, node.next.next.point);
        if (o === Orientation.CW) {
            return;
        }
        node = node.next;
    } else if (node.next === tcx.basin.right_node) {
        o = orient2d(node.point, node.prev.point, node.prev.prev.point);
        if (o === Orientation.CCW) {
            return;
        }
        node = node.prev;
    } else {
        // Continue with the neighbor node with lowest Y value
        if (node.prev.point.y < node.next.point.y) {
            node = node.prev;
        } else {
            node = node.next;
        }
    }

    fillBasinReq(tcx, node);
}

function isShallow(tcx, node) {
    var height;
    if (tcx.basin.left_highest) {
        height = tcx.basin.left_node.point.y - node.point.y;
    } else {
        height = tcx.basin.right_node.point.y - node.point.y;
    }

    // if shallow stop filling
    if (tcx.basin.width > height) {
        return true;
    }
    return false;
}

function fillEdgeEvent(tcx, edge, node) {
    if (tcx.edge_event.right) {
        fillRightAboveEdgeEvent(tcx, edge, node);
    } else {
        fillLeftAboveEdgeEvent(tcx, edge, node);
    }
}

function fillRightAboveEdgeEvent(tcx, edge, node) {
    while (node.next.point.x < edge.p.x) {
        // Check if next node is below the edge
        if (orient2d(edge.q, node.next.point, edge.p) === Orientation.CCW) {
            fillRightBelowEdgeEvent(tcx, edge, node);
        } else {
            node = node.next;
        }
    }
}

function fillRightBelowEdgeEvent(tcx, edge, node) {
    if (node.point.x < edge.p.x) {
        if (orient2d(node.point, node.next.point, node.next.next.point) === Orientation.CCW) {
            // Concave
            fillRightConcaveEdgeEvent(tcx, edge, node);
        } else {
            // Convex
            fillRightConvexEdgeEvent(tcx, edge, node);
            // Retry this one
            fillRightBelowEdgeEvent(tcx, edge, node);
        }
    }
}

function fillRightConcaveEdgeEvent(tcx, edge, node) {
    fill(tcx, node.next);
    if (node.next.point !== edge.p) {
        // Next above or below edge?
        if (orient2d(edge.q, node.next.point, edge.p) === Orientation.CCW) {
            // Below
            if (orient2d(node.point, node.next.point, node.next.next.point) === Orientation.CCW) {
                // Next is concave
                fillRightConcaveEdgeEvent(tcx, edge, node);
            } else {
                // Next is convex
                /* jshint noempty:false */
            }
        }
    }
}

function fillRightConvexEdgeEvent(tcx, edge, node) {
    // Next concave or convex?
    if (orient2d(node.next.point, node.next.next.point, node.next.next.next.point) === Orientation.CCW) {
        // Concave
        fillRightConcaveEdgeEvent(tcx, edge, node.next);
    } else {
        // Convex
        // Next above or below edge?
        if (orient2d(edge.q, node.next.next.point, edge.p) === Orientation.CCW) {
            // Below
            fillRightConvexEdgeEvent(tcx, edge, node.next);
        } else {
            // Above
            /* jshint noempty:false */
        }
    }
}

function fillLeftAboveEdgeEvent(tcx, edge, node) {
    while (node.prev.point.x > edge.p.x) {
        // Check if next node is below the edge
        if (orient2d(edge.q, node.prev.point, edge.p) === Orientation.CW) {
            fillLeftBelowEdgeEvent(tcx, edge, node);
        } else {
            node = node.prev;
        }
    }
}

function fillLeftBelowEdgeEvent(tcx, edge, node) {
    if (node.point.x > edge.p.x) {
        if (orient2d(node.point, node.prev.point, node.prev.prev.point) === Orientation.CW) {
            // Concave
            fillLeftConcaveEdgeEvent(tcx, edge, node);
        } else {
            // Convex
            fillLeftConvexEdgeEvent(tcx, edge, node);
            // Retry this one
            fillLeftBelowEdgeEvent(tcx, edge, node);
        }
    }
}

function fillLeftConvexEdgeEvent(tcx, edge, node) {
    // Next concave or convex?
    if (orient2d(node.prev.point, node.prev.prev.point, node.prev.prev.prev.point) === Orientation.CW) {
        // Concave
        fillLeftConcaveEdgeEvent(tcx, edge, node.prev);
    } else {
        // Convex
        // Next above or below edge?
        if (orient2d(edge.q, node.prev.prev.point, edge.p) === Orientation.CW) {
            // Below
            fillLeftConvexEdgeEvent(tcx, edge, node.prev);
        } else {
            // Above
            /* jshint noempty:false */
        }
    }
}

function fillLeftConcaveEdgeEvent(tcx, edge, node) {
    fill(tcx, node.prev);
    if (node.prev.point !== edge.p) {
        // Next above or below edge?
        if (orient2d(edge.q, node.prev.point, edge.p) === Orientation.CW) {
            // Below
            if (orient2d(node.point, node.prev.point, node.prev.prev.point) === Orientation.CW) {
                // Next is concave
                fillLeftConcaveEdgeEvent(tcx, edge, node);
            } else {
                // Next is convex
                /* jshint noempty:false */
            }
        }
    }
}

function flipEdgeEvent(tcx, ep, eq, t, p) {
    var ot = t.neighborAcross(p);
    if (!ot) {
        // If we want to integrate the fillEdgeEvent do it here
        // With current implementation we should never get here
        throw new Error('poly2tri [BUG:FIXME] FLIP failed due to missing triangle!');
    }
    var op = ot.oppositePoint(t, p);

    // Additional check from Java version (see issue #88)
    if (t.getConstrainedEdgeAcross(p)) {
        var index = t.index(p);
        throw new PointError("poly2tri Intersecting Constraints",
                [p, op, t.getPoint((index + 1) % 3), t.getPoint((index + 2) % 3)]);
    }

    if (inScanArea(p, t.pointCCW(p), t.pointCW(p), op)) {
        // Lets rotate shared edge one vertex CW
        rotateTrianglePair(t, p, ot, op);
        tcx.mapTriangleToNodes(t);
        tcx.mapTriangleToNodes(ot);

        // XXX: in the original C++ code for the next 2 lines, we are
        // comparing point values (and not pointers). In this JavaScript
        // code, we are comparing point references (pointers). This works
        // because we can't have 2 different points with the same values.
        // But to be really equivalent, we should use "Point.equals" here.
        if (p === eq && op === ep) {
            if (eq === tcx.edge_event.constrained_edge.q && ep === tcx.edge_event.constrained_edge.p) {
                t.markConstrainedEdgeByPoints(ep, eq);
                ot.markConstrainedEdgeByPoints(ep, eq);
                legalize(tcx, t);
                legalize(tcx, ot);
            } else {
                // XXX: I think one of the triangles should be legalized here?
                /* jshint noempty:false */
            }
        } else {
            var o = orient2d(eq, op, ep);
            t = nextFlipTriangle(tcx, o, t, ot, p, op);
            flipEdgeEvent(tcx, ep, eq, t, p);
        }
    } else {
        var newP = nextFlipPoint(ep, eq, ot, op);
        flipScanEdgeEvent(tcx, ep, eq, t, ot, newP);
        edgeEventByPoints(tcx, ep, eq, t, p);
    }
}

/**
 * After a flip we have two triangles and know that only one will still be
 * intersecting the edge. So decide which to contiune with and legalize the other
 *
 * @param tcx
 * @param o - should be the result of an orient2d( eq, op, ep )
 * @param t - triangle 1
 * @param ot - triangle 2
 * @param p - a point shared by both triangles
 * @param op - another point shared by both triangles
 * @return returns the triangle still intersecting the edge
 */
function nextFlipTriangle(tcx, o, t, ot, p, op) {
    var edge_index;
    if (o === Orientation.CCW) {
        // ot is not crossing edge after flip
        edge_index = ot.edgeIndex(p, op);
        ot.delaunay_edge[edge_index] = true;
        legalize(tcx, ot);
        ot.clearDelunayEdges();
        return t;
    }

    // t is not crossing edge after flip
    edge_index = t.edgeIndex(p, op);

    t.delaunay_edge[edge_index] = true;
    legalize(tcx, t);
    t.clearDelunayEdges();
    return ot;
}

/**
 * When we need to traverse from one triangle to the next we need
 * the point in current triangle that is the opposite point to the next
 * triangle.
 */
function nextFlipPoint(ep, eq, ot, op) {
    var o2d = orient2d(eq, op, ep);
    if (o2d === Orientation.CW) {
        // Right
        return ot.pointCCW(op);
    } else if (o2d === Orientation.CCW) {
        // Left
        return ot.pointCW(op);
    } else {
        throw new PointError("poly2tri [Unsupported] nextFlipPoint: opposing point on constrained edge!", [eq, op, ep]);
    }
}

/**
 * Scan part of the FlipScan algorithm<br>
 * When a triangle pair isn't flippable we will scan for the next
 * point that is inside the flip triangle scan area. When found
 * we generate a new flipEdgeEvent
 *
 * @param tcx
 * @param ep - last point on the edge we are traversing
 * @param eq - first point on the edge we are traversing
 * @param flipTriangle - the current triangle sharing the point eq with edge
 * @param t
 * @param p
 */
function flipScanEdgeEvent(tcx, ep, eq, flip_triangle, t, p) {
    var ot = t.neighborAcross(p);
    if (!ot) {
        // If we want to integrate the fillEdgeEvent do it here
        // With current implementation we should never get here
        throw new Error('poly2tri [BUG:FIXME] FLIP failed due to missing triangle');
    }
    var op = ot.oppositePoint(t, p);

    if (inScanArea(eq, flip_triangle.pointCCW(eq), flip_triangle.pointCW(eq), op)) {
        // flip with new edge op.eq
        flipEdgeEvent(tcx, eq, op, ot, op);
        // TODO: Actually I just figured out that it should be possible to
        //       improve this by getting the next ot and op before the the above
        //       flip and continue the flipScanEdgeEvent here
        // set new ot and op here and loop back to inScanArea test
        // also need to set a new flip_triangle first
        // Turns out at first glance that this is somewhat complicated
        // so it will have to wait.
    } else {
        var newP = nextFlipPoint(ep, eq, ot, op);
        flipScanEdgeEvent(tcx, ep, eq, flip_triangle, ot, newP);
    }
}


// ----------------------------------------------------------------------Exports

exports.triangulate = triangulate;

},{"./advancingfront":36,"./pointerror":38,"./triangle":42,"./utils":43}],41:[function(_dereq_,module,exports){
/*
 * Poly2Tri Copyright (c) 2009-2013, Poly2Tri Contributors
 * http://code.google.com/p/poly2tri/
 * 
 * poly2tri.js (JavaScript port) (c) 2009-2013, Poly2Tri Contributors
 * https://github.com/r3mi/poly2tri.js
 * 
 * All rights reserved.
 * 
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */

/* jshint maxcomplexity:6 */

"use strict";


/*
 * Note
 * ====
 * the structure of this JavaScript version of poly2tri intentionally follows
 * as closely as possible the structure of the reference C++ version, to make it 
 * easier to keep the 2 versions in sync.
 */

var PointError = _dereq_('./pointerror');
var Point = _dereq_('./point');
var Triangle = _dereq_('./triangle');
var sweep = _dereq_('./sweep');
var AdvancingFront = _dereq_('./advancingfront');
var Node = AdvancingFront.Node;


// ------------------------------------------------------------------------utils

/* 
 * Initial triangle factor, seed triangle will extend 30% of
 * PointSet width to both left and right.
 */
var kAlpha = 0.3;


// -------------------------------------------------------------------------Edge
/**
 * Represents a simple polygon's edge
 * @param {Point} p1
 * @param {Point} p2
 */
var Edge = function(p1, p2) {
    this.p = p1;
    this.q = p2;

    if (p1.y > p2.y) {
        this.q = p1;
        this.p = p2;
    } else if (p1.y === p2.y) {
        if (p1.x > p2.x) {
            this.q = p1;
            this.p = p2;
        } else if (p1.x === p2.x) {
            throw new PointError('poly2tri Invalid Edge constructor: repeated points!', [p1]);
        }
    }

    if (!this.q._p2t_edge_list) {
        this.q._p2t_edge_list = [];
    }
    this.q._p2t_edge_list.push(this);
};


// ------------------------------------------------------------------------Basin
var Basin = function() {
    this.left_node = null; // Node
    this.bottom_node = null; // Node
    this.right_node = null; // Node
    this.width = 0.0; // number
    this.left_highest = false;
};

Basin.prototype.clear = function() {
    this.left_node = null;
    this.bottom_node = null;
    this.right_node = null;
    this.width = 0.0;
    this.left_highest = false;
};

// --------------------------------------------------------------------EdgeEvent
var EdgeEvent = function() {
    this.constrained_edge = null; // Edge
    this.right = false;
};

// ----------------------------------------------------SweepContext (public API)
/**
 * Constructor for the triangulation context.
 * It accepts a simple polyline (with non repeating points), 
 * which defines the constrained edges.
 * Possible options are:
 *    cloneArrays:  if true, do a shallow copy of the Array parameters 
 *                  (contour, holes). Points inside arrays are never copied.
 *                  Default is false : keep a reference to the array arguments,
 *                  who will be modified in place.
 * @param {Array} contour  array of "Point like" objects with {x,y} (duck typing)
 * @param {Object} options  constructor options
 */
var SweepContext = function(contour, options) {
    options = options || {};
    this.triangles_ = [];
    this.map_ = [];
    this.points_ = (options.cloneArrays ? contour.slice(0) : contour);
    this.edge_list = [];

    // Bounding box of all points. Computed at the start of the triangulation, 
    // it is stored in case it is needed by the caller.
    this.pmin_ = this.pmax_ = null;

    // Advancing front
    this.front_ = null; // AdvancingFront
    // head point used with advancing front
    this.head_ = null; // Point
    // tail point used with advancing front
    this.tail_ = null; // Point

    this.af_head_ = null; // Node
    this.af_middle_ = null; // Node
    this.af_tail_ = null; // Node

    this.basin = new Basin();
    this.edge_event = new EdgeEvent();

    this.initEdges(this.points_);
};


/**
 * Add a hole to the constraints
 * @param {Array} polyline  array of "Point like" objects with {x,y} (duck typing)
 */
SweepContext.prototype.addHole = function(polyline) {
    this.initEdges(polyline);
    var i, len = polyline.length;
    for (i = 0; i < len; i++) {
        this.points_.push(polyline[i]);
    }
    return this; // for chaining
};
// Backward compatibility
SweepContext.prototype.AddHole = SweepContext.prototype.addHole;


/**
 * Add a Steiner point to the constraints
 * @param {Point} point     any "Point like" object with {x,y} (duck typing)
 */
SweepContext.prototype.addPoint = function(point) {
    this.points_.push(point);
    return this; // for chaining
};
// Backward compatibility
SweepContext.prototype.AddPoint = SweepContext.prototype.addPoint;


/**
 * Add several Steiner points to the constraints
 * @param {array<Point>} points     array of "Point like" object with {x,y} 
 */
// Method added in the JavaScript version (was not present in the c++ version)
SweepContext.prototype.addPoints = function(points) {
    this.points_ = this.points_.concat(points);
    return this; // for chaining
};


/**
 * Triangulate the polygon with holes and Steiner points.
 * Do this AFTER you've added the polyline, holes, and Steiner points
 */
// Shortcut method for sweep.triangulate(SweepContext).
// Method added in the JavaScript version (was not present in the c++ version)
SweepContext.prototype.triangulate = function() {
    sweep.triangulate(this);
    return this; // for chaining
};


/**
 * Get the bounding box of the provided constraints (contour, holes and 
 * Steinter points). Warning : these values are not available if the triangulation 
 * has not been done yet.
 * @returns {Object} object with 'min' and 'max' Point
 */
// Method added in the JavaScript version (was not present in the c++ version)
SweepContext.prototype.getBoundingBox = function() {
    return {min: this.pmin_, max: this.pmax_};
};

/**
 * Get result of triangulation
 * @returns {array<Triangle>}   array of triangles
 */
SweepContext.prototype.getTriangles = function() {
    return this.triangles_;
};
// Backward compatibility
SweepContext.prototype.GetTriangles = SweepContext.prototype.getTriangles;


// ---------------------------------------------------SweepContext (private API)

SweepContext.prototype.front = function() {
    return this.front_;
};

SweepContext.prototype.pointCount = function() {
    return this.points_.length;
};

SweepContext.prototype.head = function() {
    return this.head_;
};

SweepContext.prototype.setHead = function(p1) {
    this.head_ = p1;
};

SweepContext.prototype.tail = function() {
    return this.tail_;
};

SweepContext.prototype.setTail = function(p1) {
    this.tail_ = p1;
};

SweepContext.prototype.getMap = function() {
    return this.map_;
};

SweepContext.prototype.initTriangulation = function() {
    var xmax = this.points_[0].x;
    var xmin = this.points_[0].x;
    var ymax = this.points_[0].y;
    var ymin = this.points_[0].y;

    // Calculate bounds
    var i, len = this.points_.length;
    for (i = 1; i < len; i++) {
        var p = this.points_[i];
        /* jshint expr:true */
        (p.x > xmax) && (xmax = p.x);
        (p.x < xmin) && (xmin = p.x);
        (p.y > ymax) && (ymax = p.y);
        (p.y < ymin) && (ymin = p.y);
    }
    this.pmin_ = new Point(xmin, ymin);
    this.pmax_ = new Point(xmax, ymax);

    var dx = kAlpha * (xmax - xmin);
    var dy = kAlpha * (ymax - ymin);
    this.head_ = new Point(xmax + dx, ymin - dy);
    this.tail_ = new Point(xmin - dx, ymin - dy);

    // Sort points along y-axis
    this.points_.sort(Point.compare);
};

SweepContext.prototype.initEdges = function(polyline) {
    var i, len = polyline.length;
    for (i = 0; i < len; ++i) {
        this.edge_list.push(new Edge(polyline[i], polyline[(i + 1) % len]));
    }
};

SweepContext.prototype.getPoint = function(index) {
    return this.points_[index];
};

SweepContext.prototype.addToMap = function(triangle) {
    this.map_.push(triangle);
};

SweepContext.prototype.locateNode = function(point) {
    return this.front_.locateNode(point.x);
};

SweepContext.prototype.createAdvancingFront = function() {
    var head;
    var middle;
    var tail;
    // Initial triangle
    var triangle = new Triangle(this.points_[0], this.tail_, this.head_);

    this.map_.push(triangle);

    head = new Node(triangle.getPoint(1), triangle);
    middle = new Node(triangle.getPoint(0), triangle);
    tail = new Node(triangle.getPoint(2));

    this.front_ = new AdvancingFront(head, tail);

    head.next = middle;
    middle.next = tail;
    middle.prev = head;
    tail.prev = middle;
};

SweepContext.prototype.removeNode = function(node) {
    // do nothing
    /* jshint unused:false */
};

SweepContext.prototype.mapTriangleToNodes = function(t) {
    for (var i = 0; i < 3; ++i) {
        if (!t.getNeighbor(i)) {
            var n = this.front_.locatePoint(t.pointCW(t.getPoint(i)));
            if (n) {
                n.triangle = t;
            }
        }
    }
};

SweepContext.prototype.removeFromMap = function(triangle) {
    var i, map = this.map_, len = map.length;
    for (i = 0; i < len; i++) {
        if (map[i] === triangle) {
            map.splice(i, 1);
            break;
        }
    }
};

/**
 * Do a depth first traversal to collect triangles
 * @param {Triangle} triangle start
 */
SweepContext.prototype.meshClean = function(triangle) {
    // New implementation avoids recursive calls and use a loop instead.
    // Cf. issues # 57, 65 and 69.
    var triangles = [triangle], t, i;
    /* jshint boss:true */
    while (t = triangles.pop()) {
        if (!t.isInterior()) {
            t.setInterior(true);
            this.triangles_.push(t);
            for (i = 0; i < 3; i++) {
                if (!t.constrained_edge[i]) {
                    triangles.push(t.getNeighbor(i));
                }
            }
        }
    }
};

// ----------------------------------------------------------------------Exports

module.exports = SweepContext;

},{"./advancingfront":36,"./point":37,"./pointerror":38,"./sweep":40,"./triangle":42}],42:[function(_dereq_,module,exports){
/*
 * Poly2Tri Copyright (c) 2009-2013, Poly2Tri Contributors
 * http://code.google.com/p/poly2tri/
 * 
 * poly2tri.js (JavaScript port) (c) 2009-2013, Poly2Tri Contributors
 * https://github.com/r3mi/poly2tri.js
 *
 * All rights reserved.
 * 
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */

/* jshint maxcomplexity:10 */

"use strict";


/*
 * Note
 * ====
 * the structure of this JavaScript version of poly2tri intentionally follows
 * as closely as possible the structure of the reference C++ version, to make it 
 * easier to keep the 2 versions in sync.
 */

var xy = _dereq_("./xy");


// ---------------------------------------------------------------------Triangle
/**
 * Triangle class.<br>
 * Triangle-based data structures are known to have better performance than
 * quad-edge structures.
 * See: J. Shewchuk, "Triangle: Engineering a 2D Quality Mesh Generator and
 * Delaunay Triangulator", "Triangulations in CGAL"
 * 
 * @param   a,b,c   any "Point like" objects with {x,y} (duck typing)
 */
var Triangle = function(a, b, c) {
    // Triangle points
    this.points_ = [a, b, c];
    // Neighbor list
    this.neighbors_ = [null, null, null];
    // Has this triangle been marked as an interior triangle?
    this.interior_ = false;
    // Flags to determine if an edge is a Constrained edge
    this.constrained_edge = [false, false, false];
    // Flags to determine if an edge is a Delauney edge
    this.delaunay_edge = [false, false, false];
};

/**
 * For pretty printing ex. <i>"[(5;42)(10;20)(21;30)]"</i>)
 */
var p2s = xy.toString;
Triangle.prototype.toString = function() {
    return ("[" + p2s(this.points_[0]) + p2s(this.points_[1]) + p2s(this.points_[2]) + "]");
};

Triangle.prototype.getPoint = function(index) {
    return this.points_[index];
};
// for backward compatibility
Triangle.prototype.GetPoint = Triangle.prototype.getPoint;

// Method added in the JavaScript version (was not present in the c++ version)
Triangle.prototype.getPoints = function() {
    return this.points_;
};

Triangle.prototype.getNeighbor = function(index) {
    return this.neighbors_[index];
};

/**
 * Test if this Triangle contains the Point object given as parameters as its
 * vertices. Only point references are compared, not values.
 * @return <code>True</code> if the Point object is of the Triangle's vertices,
 *         <code>false</code> otherwise.
 */
Triangle.prototype.containsPoint = function(point) {
    var points = this.points_;
    // Here we are comparing point references, not values
    return (point === points[0] || point === points[1] || point === points[2]);
};

/**
 * Test if this Triangle contains the Edge object given as parameter as its
 * bounding edges. Only point references are compared, not values.
 * @return <code>True</code> if the Edge object is of the Triangle's bounding
 *         edges, <code>false</code> otherwise.
 */
Triangle.prototype.containsEdge = function(edge) {
    return this.containsPoint(edge.p) && this.containsPoint(edge.q);
};
Triangle.prototype.containsPoints = function(p1, p2) {
    return this.containsPoint(p1) && this.containsPoint(p2);
};


Triangle.prototype.isInterior = function() {
    return this.interior_;
};
Triangle.prototype.setInterior = function(interior) {
    this.interior_ = interior;
    return this;
};

/**
 * Update neighbor pointers.
 * @param {Point} p1 Point object.
 * @param {Point} p2 Point object.
 * @param {Triangle} t Triangle object.
 */
Triangle.prototype.markNeighborPointers = function(p1, p2, t) {
    var points = this.points_;
    // Here we are comparing point references, not values
    if ((p1 === points[2] && p2 === points[1]) || (p1 === points[1] && p2 === points[2])) {
        this.neighbors_[0] = t;
    } else if ((p1 === points[0] && p2 === points[2]) || (p1 === points[2] && p2 === points[0])) {
        this.neighbors_[1] = t;
    } else if ((p1 === points[0] && p2 === points[1]) || (p1 === points[1] && p2 === points[0])) {
        this.neighbors_[2] = t;
    } else {
        throw new Error('poly2tri Invalid Triangle.markNeighborPointers() call');
    }
};

/**
 * Exhaustive search to update neighbor pointers
 * @param {Triangle} t
 */
Triangle.prototype.markNeighbor = function(t) {
    var points = this.points_;
    if (t.containsPoints(points[1], points[2])) {
        this.neighbors_[0] = t;
        t.markNeighborPointers(points[1], points[2], this);
    } else if (t.containsPoints(points[0], points[2])) {
        this.neighbors_[1] = t;
        t.markNeighborPointers(points[0], points[2], this);
    } else if (t.containsPoints(points[0], points[1])) {
        this.neighbors_[2] = t;
        t.markNeighborPointers(points[0], points[1], this);
    }
};


Triangle.prototype.clearNeigbors = function() {
    this.neighbors_[0] = null;
    this.neighbors_[1] = null;
    this.neighbors_[2] = null;
};

Triangle.prototype.clearDelunayEdges = function() {
    this.delaunay_edge[0] = false;
    this.delaunay_edge[1] = false;
    this.delaunay_edge[2] = false;
};

/**
 * Returns the point clockwise to the given point.
 */
Triangle.prototype.pointCW = function(p) {
    var points = this.points_;
    // Here we are comparing point references, not values
    if (p === points[0]) {
        return points[2];
    } else if (p === points[1]) {
        return points[0];
    } else if (p === points[2]) {
        return points[1];
    } else {
        return null;
    }
};

/**
 * Returns the point counter-clockwise to the given point.
 */
Triangle.prototype.pointCCW = function(p) {
    var points = this.points_;
    // Here we are comparing point references, not values
    if (p === points[0]) {
        return points[1];
    } else if (p === points[1]) {
        return points[2];
    } else if (p === points[2]) {
        return points[0];
    } else {
        return null;
    }
};

/**
 * Returns the neighbor clockwise to given point.
 */
Triangle.prototype.neighborCW = function(p) {
    // Here we are comparing point references, not values
    if (p === this.points_[0]) {
        return this.neighbors_[1];
    } else if (p === this.points_[1]) {
        return this.neighbors_[2];
    } else {
        return this.neighbors_[0];
    }
};

/**
 * Returns the neighbor counter-clockwise to given point.
 */
Triangle.prototype.neighborCCW = function(p) {
    // Here we are comparing point references, not values
    if (p === this.points_[0]) {
        return this.neighbors_[2];
    } else if (p === this.points_[1]) {
        return this.neighbors_[0];
    } else {
        return this.neighbors_[1];
    }
};

Triangle.prototype.getConstrainedEdgeCW = function(p) {
    // Here we are comparing point references, not values
    if (p === this.points_[0]) {
        return this.constrained_edge[1];
    } else if (p === this.points_[1]) {
        return this.constrained_edge[2];
    } else {
        return this.constrained_edge[0];
    }
};

Triangle.prototype.getConstrainedEdgeCCW = function(p) {
    // Here we are comparing point references, not values
    if (p === this.points_[0]) {
        return this.constrained_edge[2];
    } else if (p === this.points_[1]) {
        return this.constrained_edge[0];
    } else {
        return this.constrained_edge[1];
    }
};

// Additional check from Java version (see issue #88)
Triangle.prototype.getConstrainedEdgeAcross = function(p) {
    // Here we are comparing point references, not values
    if (p === this.points_[0]) {
        return this.constrained_edge[0];
    } else if (p === this.points_[1]) {
        return this.constrained_edge[1];
    } else {
        return this.constrained_edge[2];
    }
};

Triangle.prototype.setConstrainedEdgeCW = function(p, ce) {
    // Here we are comparing point references, not values
    if (p === this.points_[0]) {
        this.constrained_edge[1] = ce;
    } else if (p === this.points_[1]) {
        this.constrained_edge[2] = ce;
    } else {
        this.constrained_edge[0] = ce;
    }
};

Triangle.prototype.setConstrainedEdgeCCW = function(p, ce) {
    // Here we are comparing point references, not values
    if (p === this.points_[0]) {
        this.constrained_edge[2] = ce;
    } else if (p === this.points_[1]) {
        this.constrained_edge[0] = ce;
    } else {
        this.constrained_edge[1] = ce;
    }
};

Triangle.prototype.getDelaunayEdgeCW = function(p) {
    // Here we are comparing point references, not values
    if (p === this.points_[0]) {
        return this.delaunay_edge[1];
    } else if (p === this.points_[1]) {
        return this.delaunay_edge[2];
    } else {
        return this.delaunay_edge[0];
    }
};

Triangle.prototype.getDelaunayEdgeCCW = function(p) {
    // Here we are comparing point references, not values
    if (p === this.points_[0]) {
        return this.delaunay_edge[2];
    } else if (p === this.points_[1]) {
        return this.delaunay_edge[0];
    } else {
        return this.delaunay_edge[1];
    }
};

Triangle.prototype.setDelaunayEdgeCW = function(p, e) {
    // Here we are comparing point references, not values
    if (p === this.points_[0]) {
        this.delaunay_edge[1] = e;
    } else if (p === this.points_[1]) {
        this.delaunay_edge[2] = e;
    } else {
        this.delaunay_edge[0] = e;
    }
};

Triangle.prototype.setDelaunayEdgeCCW = function(p, e) {
    // Here we are comparing point references, not values
    if (p === this.points_[0]) {
        this.delaunay_edge[2] = e;
    } else if (p === this.points_[1]) {
        this.delaunay_edge[0] = e;
    } else {
        this.delaunay_edge[1] = e;
    }
};

/**
 * The neighbor across to given point.
 */
Triangle.prototype.neighborAcross = function(p) {
    // Here we are comparing point references, not values
    if (p === this.points_[0]) {
        return this.neighbors_[0];
    } else if (p === this.points_[1]) {
        return this.neighbors_[1];
    } else {
        return this.neighbors_[2];
    }
};

Triangle.prototype.oppositePoint = function(t, p) {
    var cw = t.pointCW(p);
    return this.pointCW(cw);
};

/**
 * Legalize triangle by rotating clockwise around oPoint
 * @param {Point} opoint
 * @param {Point} npoint
 */
Triangle.prototype.legalize = function(opoint, npoint) {
    var points = this.points_;
    // Here we are comparing point references, not values
    if (opoint === points[0]) {
        points[1] = points[0];
        points[0] = points[2];
        points[2] = npoint;
    } else if (opoint === points[1]) {
        points[2] = points[1];
        points[1] = points[0];
        points[0] = npoint;
    } else if (opoint === points[2]) {
        points[0] = points[2];
        points[2] = points[1];
        points[1] = npoint;
    } else {
        throw new Error('poly2tri Invalid Triangle.legalize() call');
    }
};

/**
 * Returns the index of a point in the triangle. 
 * The point *must* be a reference to one of the triangle's vertices.
 * @param {Point} p Point object
 * @returns {Number} index 0, 1 or 2
 */
Triangle.prototype.index = function(p) {
    var points = this.points_;
    // Here we are comparing point references, not values
    if (p === points[0]) {
        return 0;
    } else if (p === points[1]) {
        return 1;
    } else if (p === points[2]) {
        return 2;
    } else {
        throw new Error('poly2tri Invalid Triangle.index() call');
    }
};

Triangle.prototype.edgeIndex = function(p1, p2) {
    var points = this.points_;
    // Here we are comparing point references, not values
    if (p1 === points[0]) {
        if (p2 === points[1]) {
            return 2;
        } else if (p2 === points[2]) {
            return 1;
        }
    } else if (p1 === points[1]) {
        if (p2 === points[2]) {
            return 0;
        } else if (p2 === points[0]) {
            return 2;
        }
    } else if (p1 === points[2]) {
        if (p2 === points[0]) {
            return 1;
        } else if (p2 === points[1]) {
            return 0;
        }
    }
    return -1;
};

/**
 * Mark an edge of this triangle as constrained.<br>
 * This method takes either 1 parameter (an edge index or an Edge instance) or
 * 2 parameters (two Point instances defining the edge of the triangle).
 */
Triangle.prototype.markConstrainedEdgeByIndex = function(index) {
    this.constrained_edge[index] = true;
};
Triangle.prototype.markConstrainedEdgeByEdge = function(edge) {
    this.markConstrainedEdgeByPoints(edge.p, edge.q);
};
Triangle.prototype.markConstrainedEdgeByPoints = function(p, q) {
    var points = this.points_;
    // Here we are comparing point references, not values        
    if ((q === points[0] && p === points[1]) || (q === points[1] && p === points[0])) {
        this.constrained_edge[2] = true;
    } else if ((q === points[0] && p === points[2]) || (q === points[2] && p === points[0])) {
        this.constrained_edge[1] = true;
    } else if ((q === points[1] && p === points[2]) || (q === points[2] && p === points[1])) {
        this.constrained_edge[0] = true;
    }
};


// ---------------------------------------------------------Exports (public API)

module.exports = Triangle;

},{"./xy":44}],43:[function(_dereq_,module,exports){
/*
 * Poly2Tri Copyright (c) 2009-2013, Poly2Tri Contributors
 * http://code.google.com/p/poly2tri/
 * 
 * poly2tri.js (JavaScript port) (c) 2009-2013, Poly2Tri Contributors
 * https://github.com/r3mi/poly2tri.js
 * 
 * All rights reserved.
 * 
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */

"use strict";

/*
 * Note
 * ====
 * the structure of this JavaScript version of poly2tri intentionally follows
 * as closely as possible the structure of the reference C++ version, to make it 
 * easier to keep the 2 versions in sync.
 */

var EPSILON = 1e-12;

var Orientation = {
    "CW": 1,
    "CCW": -1,
    "COLLINEAR": 0
};

/**
 * Forumla to calculate signed area<br>
 * Positive if CCW<br>
 * Negative if CW<br>
 * 0 if collinear<br>
 * <pre>
 * A[P1,P2,P3]  =  (x1*y2 - y1*x2) + (x2*y3 - y2*x3) + (x3*y1 - y3*x1)
 *              =  (x1-x3)*(y2-y3) - (y1-y3)*(x2-x3)
 * </pre>
 * 
 * @param   pa,pb,pc   any "Point like" objects with {x,y} (duck typing)
 */
function orient2d(pa, pb, pc) {
    var detleft = (pa.x - pc.x) * (pb.y - pc.y);
    var detright = (pa.y - pc.y) * (pb.x - pc.x);
    var val = detleft - detright;
    if (val > -(EPSILON) && val < (EPSILON)) {
        return Orientation.COLLINEAR;
    } else if (val > 0) {
        return Orientation.CCW;
    } else {
        return Orientation.CW;
    }
}

/**
 *  
 * @param   pa,pb,pc,pd   any "Point like" objects with {x,y} (duck typing)
 */
function inScanArea(pa, pb, pc, pd) {
    var oadb = (pa.x - pb.x) * (pd.y - pb.y) - (pd.x - pb.x) * (pa.y - pb.y);
    if (oadb >= -EPSILON) {
        return false;
    }

    var oadc = (pa.x - pc.x) * (pd.y - pc.y) - (pd.x - pc.x) * (pa.y - pc.y);
    if (oadc <= EPSILON) {
        return false;
    }
    return true;
}


// ----------------------------------------------------------------------Exports

module.exports = {
    EPSILON: EPSILON,
    Orientation: Orientation,
    orient2d: orient2d,
    inScanArea: inScanArea
};

},{}],44:[function(_dereq_,module,exports){
/*
 * Poly2Tri Copyright (c) 2009-2013, Poly2Tri Contributors
 * http://code.google.com/p/poly2tri/
 * 
 * poly2tri.js (JavaScript port) (c) 2009-2013, Poly2Tri Contributors
 * https://github.com/r3mi/poly2tri.js
 * 
 * All rights reserved.
 * 
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */

"use strict";

/*
 * The following functions operate on "Point" or any "Point like" object 
 * with {x,y} (duck typing).
 */


/**
 * Point pretty printing ex. <i>"(5;42)"</i>)
 * @param   p   any "Point like" object with {x,y} 
 * @returns {String}
 */
function toStringBase(p) {
    return ("(" + p.x + ";" + p.y + ")");
}
function toString(p) {
    // Try a custom toString first, and fallback to own implementation if none
    var s = p.toString();
    return (s === '[object Object]' ? toStringBase(p) : s);
}

/**
 * Compare two points component-wise. Ordered by y axis first, then x axis.
 * @param   a,b   any "Point like" objects with {x,y} 
 * @return <code>&lt; 0</code> if <code>a &lt; b</code>, 
 *         <code>&gt; 0</code> if <code>a &gt; b</code>, 
 *         <code>0</code> otherwise.
 */
function compare(a, b) {
    if (a.y === b.y) {
        return a.x - b.x;
    } else {
        return a.y - b.y;
    }
}

/**
 * Test two Point objects for equality.
 * @param   a,b   any "Point like" objects with {x,y} 
 * @return <code>True</code> if <code>a == b</code>, <code>false</code> otherwise.
 */
function equals(a, b) {
    return a.x === b.x && a.y === b.y;
}


module.exports = {
    toString: toString,
    toStringBase: toStringBase,
    compare: compare,
    equals: equals
};

},{}],45:[function(_dereq_,module,exports){
var Vector2 = _dereq_('vecmath').Vector2;
var Class = _dereq_('klasse');
var lerp = _dereq_('interpolation').lerp;

function distanceTo(x1, y1, x2, y2) {
    var dx = x2-x1;
    var dy = y2-y1;
    return Math.sqrt(dx*dx+dy*dy);
}

var tmp1 = new Vector2();
var tmp2 = new Vector2();

var Shape = new Class({

    initialize: function() {
        this.steps = 1;
        this.points = [];

        // If step is not provided to a ***CurveTo function, 
        // then it will be approximated with a very simple distance check
        this.approximateCurves = true;
        this.approximationFactor = 0.5;

        this._move = new Vector2();
        this._start = new Vector2();
        this._hasMoved = false;
        this._newPath = true;
    },


    reset: function() {
        this.points.length = 0;
        this._newPath = true;
        this._hasMoved = false;
        this._move.x = this._move.y = 0;
        this._start.x = this._start.y = 0;
    },

    beginPath: function() {
        this.reset();
    },
    
    moveTo: function(x, y) {
        this._newPath = true;
        this._move.x = x;
        this._move.y = y;
        this._start.x = x;
        this._start.y = y;
        this._hasMoved = true;
    },

    __newPoint: function(nx, ny) {
        this.points.push(new Vector2(nx, ny));
        this._newPath = false;
    },
    
    /** Closes the path by performing a lineTo with the first 'starting' point. 
        If the path is empty, this does nothing. */
    closePath: function(steps) {
        if (this.points.length===0)
            return;
        this.lineTo(this._start.x, this._start.y, steps);
    },
    
    lineTo: function(x, y, steps) {
        //if we are calling lineTo before any moveTo.. make this the first point
        if (!this._hasMoved) {
            this.moveTo(x, y);
            return;
        }

        steps = Math.max(1, steps || this.steps);
        for (var i=0; i<=steps; i++) { 
            if (!this._newPath && i==0)
                continue;
                
            var t = i/steps;   
            var nx = lerp(this._move.x, x, t);
            var ny = lerp(this._move.y, y, t);
            
            this.__newPoint(nx, ny);
        }
        this._move.x = x;
        this._move.y = y; 
    },

    /** Creates a bezier (cubic) curve to the specified point, with the given control points.
    If steps is not specified or is a falsy value, this function will use the default value
    set for this Path object. It will be capped to a minimum of 3 steps. 
    */
    bezierCurveTo: function(x2, y2, x3, y3, x4, y4, steps) {
        //if we are calling lineTo before any moveTo.. make this the first point
        if (!this._hasMoved) {
            this.moveTo(x, y);
            return;
        }
        
        var x1 = this._move.x;
        var y1 = this._move.y;
        
        //try to approximate with a simple distance sum.
        //more accurate would be to use this:
        //http://antigrain.com/research/adaptive_bezier/
        if (!steps) {
            if (this.approximateCurves) {
                var d1 = distanceTo(x1, y1, x2, y2);
                var d2 = distanceTo(x2, y2, x3, y3);
                var d3 = distanceTo(x3, y3, x4, y4);
                steps = ~~((d1 + d2 + d3) * this.approximationFactor);
            } else {
                steps = Math.max(1, this.steps);
            }
        } 
        
        for (var i=0; i<steps; i++) {
            var t = i / (steps-1);
            var dt = (1 - t);
            
            var dt2 = dt * dt;
            var dt3 = dt2 * dt;
            var t2 = t * t;
            var t3 = t2 * t;
            
            var x = dt3 * x1 + 3 * dt2 * t * x2 + 3 * dt * t2 * x3 + t3 * x4;
            var y = dt3 * y1 + 3 * dt2 * t * y2 + 3 * dt * t2 * y3 + t3 * y4;
            
            this.__newPoint(x, y);
        }
        
        this._move.x = x4;
        this._move.y = y4;
    },
    
    /** Creates a quadratic curve to the specified point, with the given control points.
    If steps is not specified or is a falsy value, this function will use the default value
    set for this Path object. It will be capped to a minimum of 3 steps. 
    */
    quadraticCurveTo: function(x2, y2, x3, y3, steps) {
        //if we are calling lineTo before any moveTo.. make this the first point
        if (!this._hasMoved) {
            this.moveTo(x, y);
            return;
        } 
        
        var x1 = this._move.x;
        var y1 = this._move.y;
        
        //try to approximate with a simple distance sum.
        //more accurate would be to use this:
        //http://antigrain.com/research/adaptive_bezier/
        if (!steps) {
            if (this.approximateCurves) {
                var d1 = tmp1.set(x1, y1).distance( tmp2.set(x2, y2) );
                var d2 = tmp1.set(x2, y2).distance( tmp2.set(x3, y3) );
                steps = ~~((d1 + d2) * this.approximationFactor);
            } else {
                steps = Math.max(1, this.steps);
            }
        } 
        
        for (var i=0; i<steps; i++) {
            var t = i / (steps-1);
            var dt = (1 - t);
            var dtSq = dt * dt;
            var tSq = t * t;
            
            var x = dtSq * x1 + 2 * dt * t * x2 + tSq * x3;
            var y = dtSq * y1 + 2 * dt * t * y2 + tSq * y3;
            
            this.__newPoint(x, y);
        }
        
        this._move.x = x3;
        this._move.y = y3;
    },

    calculateBoundingBox: function() {
        var points = this.points;

        var minX = Number.MAX_VALUE,
            minY = Number.MAX_VALUE,
            maxX = -Number.MAX_VALUE,
            maxY = -Number.MAX_VALUE;

        for (var i=0; i<points.length; i++) {
            var p = points[i];

            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        }

        return {
            x: minX,
            y: minY,
            width: maxX-minX,
            height: maxY-minY
        };
    },

    contains: function(x, y) {
        var testx = x, testy = y;
        if (typeof x === "object") {
            testx = x.x;
            testy = x.y;
        }

        var points = this.points;
        var nvert = points.length;
        var i, j, c = 0;
        for (i=0, j=nvert-1; i<nvert; j=i++) {
            if ( ((points[i].y>testy) != (points[j].y>testy)) &&
                (testx < (points[j].x-points[i].x) * (testy-points[i].y) / (points[j].y-points[i].y) + points[i].x) ) {
                c = !c;
            }
        }
        return c;
    },


    simplify: function(tolerance, out) {
        var points = this.points,
            len = points.length,
            point = new Vector2(),
            sqTolerance = tolerance*tolerance,
            prevPoint = new Vector2( points[0] );

        if (!out)
            out = new Shape();

        var outPoints = [];
        outPoints.push(prevPoint);

        for (var i=1; i<len; i++) {
            point = points[i];
            if ( point.distanceSq(prevPoint) > sqTolerance ) {
                outPoints.push(new Vector2(point));
                prevPoint = point;
            }
        }
        if (prevPoint.x !== point.x || prevPoint.y !== point.y)
            outPoints.push(new Vector2(point));

        out.points = outPoints;
        return out; 
    }
});

module.exports = Shape;
},{"interpolation":19,"klasse":34,"vecmath":53}],46:[function(_dereq_,module,exports){
var ARRAY_TYPE = typeof Float32Array !== "undefined" ? Float32Array : Array;

function Matrix3(m) {
    this.val = new ARRAY_TYPE(9);

    if (m) { //assume Matrix3 with val
        this.copy(m);
    } else { //default to identity
        this.idt();
    }
}

var mat3 = Matrix3.prototype;

mat3.clone = function() {
    return new Matrix3(this);
};

mat3.set = function(otherMat) {
    return this.copy(otherMat);
};

mat3.copy = function(otherMat) {
    var out = this.val,
        a = otherMat.val; 
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return this;
};

mat3.fromMat4 = function(m) {
    var a = m.val,
        out = this.val;
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[4];
    out[4] = a[5];
    out[5] = a[6];
    out[6] = a[8];
    out[7] = a[9];
    out[8] = a[10];
    return this;
};

mat3.fromArray = function(a) {
    var out = this.val;
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return this;
};

mat3.identity = function() {
    var out = this.val;
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 1;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return this;
};

mat3.transpose = function() {
    var a = this.val,
        a01 = a[1], 
        a02 = a[2], 
        a12 = a[5];
    a[1] = a[3];
    a[2] = a[6];
    a[3] = a01;
    a[5] = a[7];
    a[6] = a02;
    a[7] = a12;
    return this;
};

mat3.invert = function() {
    var a = this.val,
        a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],

        b01 = a22 * a11 - a12 * a21,
        b11 = -a22 * a10 + a12 * a20,
        b21 = a21 * a10 - a11 * a20,

        // Calculate the determinant
        det = a00 * b01 + a01 * b11 + a02 * b21;

    if (!det) { 
        return null; 
    }
    det = 1.0 / det;

    a[0] = b01 * det;
    a[1] = (-a22 * a01 + a02 * a21) * det;
    a[2] = (a12 * a01 - a02 * a11) * det;
    a[3] = b11 * det;
    a[4] = (a22 * a00 - a02 * a20) * det;
    a[5] = (-a12 * a00 + a02 * a10) * det;
    a[6] = b21 * det;
    a[7] = (-a21 * a00 + a01 * a20) * det;
    a[8] = (a11 * a00 - a01 * a10) * det;
    return this;
};

mat3.adjoint = function() {
    var a = this.val,
        a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8];

    a[0] = (a11 * a22 - a12 * a21);
    a[1] = (a02 * a21 - a01 * a22);
    a[2] = (a01 * a12 - a02 * a11);
    a[3] = (a12 * a20 - a10 * a22);
    a[4] = (a00 * a22 - a02 * a20);
    a[5] = (a02 * a10 - a00 * a12);
    a[6] = (a10 * a21 - a11 * a20);
    a[7] = (a01 * a20 - a00 * a21);
    a[8] = (a00 * a11 - a01 * a10);
    return this;
};

mat3.determinant = function() {
    var a = this.val,
        a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8];

    return a00 * (a22 * a11 - a12 * a21) + a01 * (-a22 * a10 + a12 * a20) + a02 * (a21 * a10 - a11 * a20);
};

mat3.multiply = function(otherMat) {
    var a = this.val,
        b = otherMat.val,
        a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],

        b00 = b[0], b01 = b[1], b02 = b[2],
        b10 = b[3], b11 = b[4], b12 = b[5],
        b20 = b[6], b21 = b[7], b22 = b[8];

    a[0] = b00 * a00 + b01 * a10 + b02 * a20;
    a[1] = b00 * a01 + b01 * a11 + b02 * a21;
    a[2] = b00 * a02 + b01 * a12 + b02 * a22;

    a[3] = b10 * a00 + b11 * a10 + b12 * a20;
    a[4] = b10 * a01 + b11 * a11 + b12 * a21;
    a[5] = b10 * a02 + b11 * a12 + b12 * a22;

    a[6] = b20 * a00 + b21 * a10 + b22 * a20;
    a[7] = b20 * a01 + b21 * a11 + b22 * a21;
    a[8] = b20 * a02 + b21 * a12 + b22 * a22;
    return this;
};

mat3.translate = function(v) {
    var a = this.val,
        x = v.x, y = v.y;
    a[6] = x * a[0] + y * a[3] + a[6];
    a[7] = x * a[1] + y * a[4] + a[7];
    a[8] = x * a[2] + y * a[5] + a[8];
    return this;
};

mat3.rotate = function(rad) {
    var a = this.val,
        a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],

        s = Math.sin(rad),
        c = Math.cos(rad);

    a[0] = c * a00 + s * a10;
    a[1] = c * a01 + s * a11;
    a[2] = c * a02 + s * a12;

    a[3] = c * a10 - s * a00;
    a[4] = c * a11 - s * a01;
    a[5] = c * a12 - s * a02;
    return this;
};

mat3.scale = function(v) {
    var a = this.val,
        x = v.x, 
        y = v.y;

    a[0] = x * a[0];
    a[1] = x * a[1];
    a[2] = x * a[2];

    a[3] = y * a[3];
    a[4] = y * a[4];
    a[5] = y * a[5];
    return this;
};

mat3.fromQuat = function(q) {
    var x = q.x, y = q.y, z = q.z, w = q.w,
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        xy = x * y2,
        xz = x * z2,
        yy = y * y2,
        yz = y * z2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2,

        out = this.val;

    out[0] = 1 - (yy + zz);
    out[3] = xy + wz;
    out[6] = xz - wy;

    out[1] = xy - wz;
    out[4] = 1 - (xx + zz);
    out[7] = yz + wx;

    out[2] = xz + wy;
    out[5] = yz - wx;
    out[8] = 1 - (xx + yy);
    return this;
};

mat3.normalFromMat4 = function(m) {
    var a = m.val,
        out = this.val,

        a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32,

        // Calculate the determinant
        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (!det) { 
        return null; 
    }
    det = 1.0 / det;

    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[2] = (a10 * b10 - a11 * b08 + a13 * b06) * det;

    out[3] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[4] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[5] = (a01 * b08 - a00 * b10 - a03 * b06) * det;

    out[6] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[7] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[8] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    return this;
};

mat3.mul = mat3.multiply;

mat3.idt = mat3.identity;

//This is handy for Pool utilities, to "reset" a
//shared object to its default state
mat3.reset = mat3.idt;

mat3.toString = function() {
    var a = this.val;
    return 'Matrix3(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + 
                    a[3] + ', ' + a[4] + ', ' + a[5] + ', ' + 
                    a[6] + ', ' + a[7] + ', ' + a[8] + ')';
};

mat3.str = mat3.toString;

module.exports = Matrix3;
},{}],47:[function(_dereq_,module,exports){
var ARRAY_TYPE = typeof Float32Array !== "undefined" ? Float32Array : Array;
var EPSILON = 0.000001;

function Matrix4(m) {
    this.val = new ARRAY_TYPE(16);

    if (m) { //assume Matrix4 with val
        this.copy(m);
    } else { //default to identity
        this.idt();
    }
}

var mat4 = Matrix4.prototype;

mat4.clone = function() {
    return new Matrix4(this);
};

mat4.set = function(otherMat) {
    return this.copy(otherMat);
};

mat4.copy = function(otherMat) {
    var out = this.val,
        a = otherMat.val; 
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return this;
};

mat4.fromArray = function(a) {
    var out = this.val;
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return this;
};

mat4.identity = function() {
    var out = this.val;
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return this;
};

mat4.transpose = function() {
    var a = this.val,
        a01 = a[1], a02 = a[2], a03 = a[3],
        a12 = a[6], a13 = a[7],
        a23 = a[11];

    a[1] = a[4];
    a[2] = a[8];
    a[3] = a[12];
    a[4] = a01;
    a[6] = a[9];
    a[7] = a[13];
    a[8] = a02;
    a[9] = a12;
    a[11] = a[14];
    a[12] = a03;
    a[13] = a13;
    a[14] = a23;
    return this;
};

mat4.invert = function() {
    var a = this.val,
        a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32,

        // Calculate the determinant
        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (!det) { 
        return null; 
    }
    det = 1.0 / det;

    a[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    a[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    a[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    a[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    a[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    a[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    a[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    a[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    a[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    a[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    a[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    a[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    a[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    a[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    a[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    a[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
    return this;
};

mat4.adjoint = function() {
    var a = this.val,
        a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    a[0]  =  (a11 * (a22 * a33 - a23 * a32) - a21 * (a12 * a33 - a13 * a32) + a31 * (a12 * a23 - a13 * a22));
    a[1]  = -(a01 * (a22 * a33 - a23 * a32) - a21 * (a02 * a33 - a03 * a32) + a31 * (a02 * a23 - a03 * a22));
    a[2]  =  (a01 * (a12 * a33 - a13 * a32) - a11 * (a02 * a33 - a03 * a32) + a31 * (a02 * a13 - a03 * a12));
    a[3]  = -(a01 * (a12 * a23 - a13 * a22) - a11 * (a02 * a23 - a03 * a22) + a21 * (a02 * a13 - a03 * a12));
    a[4]  = -(a10 * (a22 * a33 - a23 * a32) - a20 * (a12 * a33 - a13 * a32) + a30 * (a12 * a23 - a13 * a22));
    a[5]  =  (a00 * (a22 * a33 - a23 * a32) - a20 * (a02 * a33 - a03 * a32) + a30 * (a02 * a23 - a03 * a22));
    a[6]  = -(a00 * (a12 * a33 - a13 * a32) - a10 * (a02 * a33 - a03 * a32) + a30 * (a02 * a13 - a03 * a12));
    a[7]  =  (a00 * (a12 * a23 - a13 * a22) - a10 * (a02 * a23 - a03 * a22) + a20 * (a02 * a13 - a03 * a12));
    a[8]  =  (a10 * (a21 * a33 - a23 * a31) - a20 * (a11 * a33 - a13 * a31) + a30 * (a11 * a23 - a13 * a21));
    a[9]  = -(a00 * (a21 * a33 - a23 * a31) - a20 * (a01 * a33 - a03 * a31) + a30 * (a01 * a23 - a03 * a21));
    a[10] =  (a00 * (a11 * a33 - a13 * a31) - a10 * (a01 * a33 - a03 * a31) + a30 * (a01 * a13 - a03 * a11));
    a[11] = -(a00 * (a11 * a23 - a13 * a21) - a10 * (a01 * a23 - a03 * a21) + a20 * (a01 * a13 - a03 * a11));
    a[12] = -(a10 * (a21 * a32 - a22 * a31) - a20 * (a11 * a32 - a12 * a31) + a30 * (a11 * a22 - a12 * a21));
    a[13] =  (a00 * (a21 * a32 - a22 * a31) - a20 * (a01 * a32 - a02 * a31) + a30 * (a01 * a22 - a02 * a21));
    a[14] = -(a00 * (a11 * a32 - a12 * a31) - a10 * (a01 * a32 - a02 * a31) + a30 * (a01 * a12 - a02 * a11));
    a[15] =  (a00 * (a11 * a22 - a12 * a21) - a10 * (a01 * a22 - a02 * a21) + a20 * (a01 * a12 - a02 * a11));
    return this;
};

mat4.determinant = function () {
    var a = this.val,
        a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32;

    // Calculate the determinant
    return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
};

mat4.multiply = function(otherMat) {
    var a = this.val,
        b = otherMat.val,
        a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    // Cache only the current line of the second matrix
    var b0  = b[0], b1 = b[1], b2 = b[2], b3 = b[3];  
    a[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    a[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    a[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    a[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
    a[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    a[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    a[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    a[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
    a[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    a[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    a[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    a[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
    a[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    a[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    a[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    a[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
    return this;
};

mat4.translate = function(v) {
    var x = v.x, y = v.y, z = v.z,
        a = this.val;
    a[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
    a[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
    a[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
    a[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
    return this;
};

mat4.scale = function(v) {
    var x = v.x, y = v.y, z = v.z, a = this.val;

    a[0] = a[0] * x;
    a[1] = a[1] * x;
    a[2] = a[2] * x;
    a[3] = a[3] * x;
    a[4] = a[4] * y;
    a[5] = a[5] * y;
    a[6] = a[6] * y;
    a[7] = a[7] * y;
    a[8] = a[8] * z;
    a[9] = a[9] * z;
    a[10] = a[10] * z;
    a[11] = a[11] * z;
    a[12] = a[12];
    a[13] = a[13];
    a[14] = a[14];
    a[15] = a[15];
    return this;
};

mat4.rotate = function (rad, axis) {
    var a = this.val,
        x = axis.x, y = axis.y, z = axis.z,
        len = Math.sqrt(x * x + y * y + z * z),
        s, c, t,
        a00, a01, a02, a03,
        a10, a11, a12, a13,
        a20, a21, a22, a23,
        b00, b01, b02,
        b10, b11, b12,
        b20, b21, b22;

    if (Math.abs(len) < EPSILON) { return null; }
    
    len = 1 / len;
    x *= len;
    y *= len;
    z *= len;

    s = Math.sin(rad);
    c = Math.cos(rad);
    t = 1 - c;

    a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
    a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
    a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];

    // Construct the elements of the rotation matrix
    b00 = x * x * t + c; b01 = y * x * t + z * s; b02 = z * x * t - y * s;
    b10 = x * y * t - z * s; b11 = y * y * t + c; b12 = z * y * t + x * s;
    b20 = x * z * t + y * s; b21 = y * z * t - x * s; b22 = z * z * t + c;

    // Perform rotation-specific matrix multiplication
    a[0] = a00 * b00 + a10 * b01 + a20 * b02;
    a[1] = a01 * b00 + a11 * b01 + a21 * b02;
    a[2] = a02 * b00 + a12 * b01 + a22 * b02;
    a[3] = a03 * b00 + a13 * b01 + a23 * b02;
    a[4] = a00 * b10 + a10 * b11 + a20 * b12;
    a[5] = a01 * b10 + a11 * b11 + a21 * b12;
    a[6] = a02 * b10 + a12 * b11 + a22 * b12;
    a[7] = a03 * b10 + a13 * b11 + a23 * b12;
    a[8] = a00 * b20 + a10 * b21 + a20 * b22;
    a[9] = a01 * b20 + a11 * b21 + a21 * b22;
    a[10] = a02 * b20 + a12 * b21 + a22 * b22;
    a[11] = a03 * b20 + a13 * b21 + a23 * b22;
    return this;
};

mat4.rotateX = function(rad) {
    var a = this.val,
        s = Math.sin(rad),
        c = Math.cos(rad),
        a10 = a[4],
        a11 = a[5],
        a12 = a[6],
        a13 = a[7],
        a20 = a[8],
        a21 = a[9],
        a22 = a[10],
        a23 = a[11];

    // Perform axis-specific matrix multiplication
    a[4] = a10 * c + a20 * s;
    a[5] = a11 * c + a21 * s;
    a[6] = a12 * c + a22 * s;
    a[7] = a13 * c + a23 * s;
    a[8] = a20 * c - a10 * s;
    a[9] = a21 * c - a11 * s;
    a[10] = a22 * c - a12 * s;
    a[11] = a23 * c - a13 * s;
    return this;
};

mat4.rotateY = function(rad) {
    var a = this.val,
        s = Math.sin(rad),
        c = Math.cos(rad),
        a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a03 = a[3],
        a20 = a[8],
        a21 = a[9],
        a22 = a[10],
        a23 = a[11];

    // Perform axis-specific matrix multiplication
    a[0] = a00 * c - a20 * s;
    a[1] = a01 * c - a21 * s;
    a[2] = a02 * c - a22 * s;
    a[3] = a03 * c - a23 * s;
    a[8] = a00 * s + a20 * c;
    a[9] = a01 * s + a21 * c;
    a[10] = a02 * s + a22 * c;
    a[11] = a03 * s + a23 * c;
    return this;
};

mat4.rotateZ = function (rad) {
    var a = this.val,
        s = Math.sin(rad),
        c = Math.cos(rad),
        a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a03 = a[3],
        a10 = a[4],
        a11 = a[5],
        a12 = a[6],
        a13 = a[7];

    // Perform axis-specific matrix multiplication
    a[0] = a00 * c + a10 * s;
    a[1] = a01 * c + a11 * s;
    a[2] = a02 * c + a12 * s;
    a[3] = a03 * c + a13 * s;
    a[4] = a10 * c - a00 * s;
    a[5] = a11 * c - a01 * s;
    a[6] = a12 * c - a02 * s;
    a[7] = a13 * c - a03 * s;
    return this;
};

mat4.fromRotationTranslation = function (q, v) {
    // Quaternion math
    var out = this.val,
        x = q.x, y = q.y, z = q.z, w = q.w,
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        xy = x * y2,
        xz = x * z2,
        yy = y * y2,
        yz = y * z2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    out[0] = 1 - (yy + zz);
    out[1] = xy + wz;
    out[2] = xz - wy;
    out[3] = 0;
    out[4] = xy - wz;
    out[5] = 1 - (xx + zz);
    out[6] = yz + wx;
    out[7] = 0;
    out[8] = xz + wy;
    out[9] = yz - wx;
    out[10] = 1 - (xx + yy);
    out[11] = 0;
    out[12] = v.x;
    out[13] = v.y;
    out[14] = v.z;
    out[15] = 1;
    return this;
};

mat4.fromQuat = function (q) {
    var out = this.val,
        x = q.x, y = q.y, z = q.z, w = q.w,
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        xy = x * y2,
        xz = x * z2,
        yy = y * y2,
        yz = y * z2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    out[0] = 1 - (yy + zz);
    out[1] = xy + wz;
    out[2] = xz - wy;
    out[3] = 0;

    out[4] = xy - wz;
    out[5] = 1 - (xx + zz);
    out[6] = yz + wx;
    out[7] = 0;

    out[8] = xz + wy;
    out[9] = yz - wx;
    out[10] = 1 - (xx + yy);
    out[11] = 0;

    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;

    return this;
};


/**
 * Generates a frustum matrix with the given bounds
 *
 * @param {Number} left Left bound of the frustum
 * @param {Number} right Right bound of the frustum
 * @param {Number} bottom Bottom bound of the frustum
 * @param {Number} top Top bound of the frustum
 * @param {Number} near Near bound of the frustum
 * @param {Number} far Far bound of the frustum
 * @returns {Matrix4} this for chaining
 */
mat4.frustum = function (left, right, bottom, top, near, far) {
    var out = this.val,
        rl = 1 / (right - left),
        tb = 1 / (top - bottom),
        nf = 1 / (near - far);
    out[0] = (near * 2) * rl;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = (near * 2) * tb;
    out[6] = 0;
    out[7] = 0;
    out[8] = (right + left) * rl;
    out[9] = (top + bottom) * tb;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = (far * near * 2) * nf;
    out[15] = 0;
    return this;
};


/**
 * Generates a perspective projection matrix with the given bounds
 *
 * @param {number} fovy Vertical field of view in radians
 * @param {number} aspect Aspect ratio. typically viewport width/height
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {Matrix4} this for chaining
 */
mat4.perspective = function (fovy, aspect, near, far) {
    var out = this.val,
        f = 1.0 / Math.tan(fovy / 2),
        nf = 1 / (near - far);
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = (2 * far * near) * nf;
    out[15] = 0;
    return this;
};

/**
 * Generates a orthogonal projection matrix with the given bounds
 *
 * @param {number} left Left bound of the frustum
 * @param {number} right Right bound of the frustum
 * @param {number} bottom Bottom bound of the frustum
 * @param {number} top Top bound of the frustum
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {Matrix4} this for chaining
 */
mat4.ortho = function (out, left, right, bottom, top, near, far) {
    var out = this.val,
        lr = 1 / (left - right),
        bt = 1 / (bottom - top),
        nf = 1 / (near - far);
    out[0] = -2 * lr;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = -2 * bt;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 2 * nf;
    out[11] = 0;
    out[12] = (left + right) * lr;
    out[13] = (top + bottom) * bt;
    out[14] = (far + near) * nf;
    out[15] = 1;
    return this;
};

/**
 * Generates a look-at matrix with the given eye position, focal point, and up axis
 *
 * @param {Vector3} eye Position of the viewer
 * @param {Vector3} center Point the viewer is looking at
 * @param {Vector3} up vec3 pointing up
 * @returns {Matrix4} this for chaining
 */
mat4.lookAt = function (eye, center, up) {
    var out = this.val,

        x0, x1, x2, y0, y1, y2, z0, z1, z2, len,
        eyex = eye.x,
        eyey = eye.y,
        eyez = eye.z,
        upx = up.x,
        upy = up.y,
        upz = up.z,
        centerx = center.x,
        centery = center.y,
        centerz = center.z;

    if (Math.abs(eyex - centerx) < EPSILON &&
        Math.abs(eyey - centery) < EPSILON &&
        Math.abs(eyez - centerz) < EPSILON) {
        return this.identity();
    }

    z0 = eyex - centerx;
    z1 = eyey - centery;
    z2 = eyez - centerz;

    len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
    z0 *= len;
    z1 *= len;
    z2 *= len;

    x0 = upy * z2 - upz * z1;
    x1 = upz * z0 - upx * z2;
    x2 = upx * z1 - upy * z0;
    len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
    if (!len) {
        x0 = 0;
        x1 = 0;
        x2 = 0;
    } else {
        len = 1 / len;
        x0 *= len;
        x1 *= len;
        x2 *= len;
    }

    y0 = z1 * x2 - z2 * x1;
    y1 = z2 * x0 - z0 * x2;
    y2 = z0 * x1 - z1 * x0;

    len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
    if (!len) {
        y0 = 0;
        y1 = 0;
        y2 = 0;
    } else {
        len = 1 / len;
        y0 *= len;
        y1 *= len;
        y2 *= len;
    }

    out[0] = x0;
    out[1] = y0;
    out[2] = z0;
    out[3] = 0;
    out[4] = x1;
    out[5] = y1;
    out[6] = z1;
    out[7] = 0;
    out[8] = x2;
    out[9] = y2;
    out[10] = z2;
    out[11] = 0;
    out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
    out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
    out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
    out[15] = 1;

    return this;
};


mat4.mul = mat4.multiply;

mat4.idt = mat4.identity;

//This is handy for Pool utilities, to "reset" a
//shared object to its default state
mat4.reset = mat4.idt;

mat4.toString = function () {
    var a = this.val;
    return 'Matrix4(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ', ' +
                    a[4] + ', ' + a[5] + ', ' + a[6] + ', ' + a[7] + ', ' +
                    a[8] + ', ' + a[9] + ', ' + a[10] + ', ' + a[11] + ', ' + 
                    a[12] + ', ' + a[13] + ', ' + a[14] + ', ' + a[15] + ')';
};

mat4.str = mat4.toString;

module.exports = Matrix4;

},{}],48:[function(_dereq_,module,exports){
var Vector3 = _dereq_('./Vector3');
var Matrix3 = _dereq_('./Matrix3');
var common = _dereq_('./common');

//some shared 'private' arrays
var s_iNext = (typeof Int8Array !== 'undefined' ? new Int8Array([1,2,0]) : [1,2,0]);
var tmp = (typeof Float32Array !== 'undefined' ? new Float32Array([0,0,0]) : [0,0,0]);

var xUnitVec3 = new Vector3(1, 0, 0);
var yUnitVec3 = new Vector3(0, 1, 0);
var tmpvec = new Vector3();

var tmpMat3 = new Matrix3();

function Quaternion(x, y, z, w) {
	if (typeof x === "object") {
        this.x = x.x||0;
        this.y = x.y||0;
        this.z = x.z||0;
        this.w = x.w||0;
    } else {
        this.x = x||0;
        this.y = y||0;
        this.z = z||0;
        this.w = w||0;
    }
}

var quat = Quaternion.prototype;

//mixin common functions
for (var k in common) {
    quat[k] = common[k];
}

quat.rotationTo = function(a, b) {
    var dot = a.x * b.x + a.y * b.y + a.z * b.z; //a.dot(b)
    if (dot < -0.999999) {
        if (tmpvec.copy(xUnitVec3).cross(a).len() < 0.000001)
            tmpvec.copy(yUnitVec3).cross(a);
        
        tmpvec.normalize();
        return this.setAxisAngle(tmpvec, Math.PI);
    } else if (dot > 0.999999) {
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.w = 1;
        return this;
    } else {
        tmpvec.copy(a).cross(b);
        this.x = tmpvec.x;
        this.y = tmpvec.y;
        this.z = tmpvec.z;
        this.w = 1 + dot;
        return this.normalize();
    }
};

quat.setAxes = function(view, right, up) {
    var m = tmpMat3.val;
    m[0] = right.x;
    m[3] = right.y;
    m[6] = right.z;

    m[1] = uquat.x;
    m[4] = uquat.y;
    m[7] = uquat.z;

    m[2] = view.x;
    m[5] = view.y;
    m[8] = view.z;

    return this.fromMat3(tmpMat3).normalize();
};

quat.identity = function() {
    this.x = this.y = this.z = 0;
    this.w = 1;
    return this;
};

quat.setAxisAngle = function(axis, rad) {
    rad = rad * 0.5;
    var s = Math.sin(rad);
    this.x = s * axis.x;
    this.y = s * axis.y;
    this.z = s * axis.z;
    this.w = Math.cos(rad);
    return this;
};

quat.multiply = function(b) {
    var ax = this.x, ay = this.y, az = this.z, aw = this.w,
        bx = b.x, by = b.y, bz = b.z, bw = b.w;

    this.x = ax * bw + aw * bx + ay * bz - az * by;
    this.y = ay * bw + aw * by + az * bx - ax * bz;
    this.z = az * bw + aw * bz + ax * by - ay * bx;
    this.w = aw * bw - ax * bx - ay * by - az * bz;
    return this;
};

quat.slerp = function (b, t) {
    // benchmarks:
    //    http://jsperf.com/quaternion-slerp-implementations

    var ax = this.x, ay = this.y, az = this.y, aw = this.y,
        bx = b.x, by = b.y, bz = b.z, bw = b.w;

    var        omega, cosom, sinom, scale0, scale1;

    // calc cosine
    cosom = ax * bx + ay * by + az * bz + aw * bw;
    // adjust signs (if necessary)
    if ( cosom < 0.0 ) {
        cosom = -cosom;
        bx = - bx;
        by = - by;
        bz = - bz;
        bw = - bw;
    }
    // calculate coefficients
    if ( (1.0 - cosom) > 0.000001 ) {
        // standard case (slerp)
        omega  = Math.acos(cosom);
        sinom  = Math.sin(omega);
        scale0 = Math.sin((1.0 - t) * omega) / sinom;
        scale1 = Math.sin(t * omega) / sinom;
    } else {        
        // "from" and "to" quaternions are very close 
        //  ... so we can do a linear interpolation
        scale0 = 1.0 - t;
        scale1 = t;
    }
    // calculate final values
    this.x = scale0 * ax + scale1 * bx;
    this.y = scale0 * ay + scale1 * by;
    this.z = scale0 * az + scale1 * bz;
    this.w = scale0 * aw + scale1 * bw;
    return this;
};

quat.invert = function() {
    var a0 = this.x, a1 = this.y, a2 = this.z, a3 = this.w,
        dot = a0*a0 + a1*a1 + a2*a2 + a3*a3,
        invDot = dot ? 1.0/dot : 0;
    
    // TODO: Would be faster to return [0,0,0,0] immediately if dot == 0

    this.x = -a0*invDot;
    this.y = -a1*invDot;
    this.z = -a2*invDot;
    this.w = a3*invDot;
    return this;
};

quat.conjugate = function() {
    this.x = -this.x;
    this.y = -this.y;
    this.z = -this.z;
    return this;
};

quat.rotateX = function (rad) {
    rad *= 0.5; 

    var ax = this.x, ay = this.y, az = this.z, aw = this.w,
        bx = Math.sin(rad), bw = Math.cos(rad);

    this.x = ax * bw + aw * bx;
    this.y = ay * bw + az * bx;
    this.z = az * bw - ay * bx;
    this.w = aw * bw - ax * bx;
    return this;
};

quat.rotateY = function (rad) {
    rad *= 0.5; 

    var ax = this.x, ay = this.y, az = this.z, aw = this.w,
        by = Math.sin(rad), bw = Math.cos(rad);

    this.x = ax * bw - az * by;
    this.y = ay * bw + aw * by;
    this.z = az * bw + ax * by;
    this.w = aw * bw - ay * by;
    return this;
};

quat.rotateZ = function (rad) {
    rad *= 0.5; 

    var ax = this.x, ay = this.y, az = this.z, aw = this.w,
        bz = Math.sin(rad), bw = Math.cos(rad);

    this.x = ax * bw + ay * bz;
    this.y = ay * bw - ax * bz;
    this.z = az * bw + aw * bz;
    this.w = aw * bw - az * bz;
    return this;
};

quat.calculateW = function () {
    var x = this.x, y = this.y, z = this.z;

    this.x = x;
    this.y = y;
    this.z = z;
    this.w = -Math.sqrt(Math.abs(1.0 - x * x - y * y - z * z));
    return this;
};

quat.fromMat3 = function(mat) {
    // benchmarks:
    //    http://jsperf.com/typed-array-access-speed
    //    http://jsperf.com/conversion-of-3x3-matrix-to-quaternion

    // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
    // article "Quaternion Calculus and Fast Animation".
    var m = mat.val,
        fTrace = m[0] + m[4] + m[8];
    var fRoot;

    if ( fTrace > 0.0 ) {
        // |w| > 1/2, may as well choose w > 1/2
        fRoot = Math.sqrt(fTrace + 1.0);  // 2w
        this.w = 0.5 * fRoot;
        fRoot = 0.5/fRoot;  // 1/(4w)
        this.x = (m[7]-m[5])*fRoot;
        this.y = (m[2]-m[6])*fRoot;
        this.z = (m[3]-m[1])*fRoot;
    } else {
        // |w| <= 1/2
        var i = 0;
        if ( m[4] > m[0] )
          i = 1;
        if ( m[8] > m[i*3+i] )
          i = 2;
        var j = s_iNext[i];
        var k = s_iNext[j];
            
        //This isn't quite as clean without array access...
        fRoot = Math.sqrt(m[i*3+i]-m[j*3+j]-m[k*3+k] + 1.0);
        tmp[i] = 0.5 * fRoot;

        fRoot = 0.5 / fRoot;
        tmp[j] = (m[j*3+i] + m[i*3+j]) * fRoot;
        tmp[k] = (m[k*3+i] + m[i*3+k]) * fRoot;

        this.x = tmp[0];
        this.y = tmp[1];
        this.z = tmp[2];
        this.w = (m[k*3+j] - m[j*3+k]) * fRoot;
    }
    
    return this;
};

quat.idt = quat.identity;

quat.sub = quat.subtract;

quat.mul = quat.multiply;

quat.len = quat.length;

quat.lenSq = quat.lengthSq;

//This is handy for Pool utilities, to "reset" a
//shared object to its default state
quat.reset = quat.idt;


quat.toString = function() {
    return 'Quaternion(' + this.x + ', ' + this.y + ', ' + this.z + ', ' + this.w + ')';
};

quat.str = quat.toString;

module.exports = Quaternion;
},{"./Matrix3":46,"./Vector3":50,"./common":52}],49:[function(_dereq_,module,exports){
function Vector2(x, y) {
	if (typeof x === "object") {
        this.x = x.x||0;
        this.y = x.y||0;
    } else {
        this.x = x||0;
        this.y = y||0;
    }
}

//shorthand it for better minification
var vec2 = Vector2.prototype;

/**
 * Returns a new instance of Vector2 with
 * this vector's components. 
 * @return {Vector2} a clone of this vector
 */
vec2.clone = function() {
    return new Vector2(this.x, this.y);
};

/**
 * Copies the x, y components from the specified
 * Vector. Any undefined components from `otherVec`
 * will default to zero.
 * 
 * @param  {otherVec} the other Vector2 to copy
 * @return {Vector2}  this, for chaining
 */
vec2.copy = function(otherVec) {
    this.x = otherVec.x||0;
    this.y = otherVec.y||0;
    return this;
};

/**
 * A convenience function to set the components of
 * this vector as x and y. Falsy or undefined
 * parameters will default to zero.
 *
 * You can also pass a vector object instead of
 * individual components, to copy the object's components.
 * 
 * @param {Number} x the x component
 * @param {Number} y the y component
 * @return {Vector2}  this, for chaining
 */
vec2.set = function(x, y) {
    if (typeof x === "object") {
        this.x = x.x||0;
        this.y = x.y||0;
    } else {
        this.x = x||0;
        this.y = y||0;
    }
    return this;
};

vec2.add = function(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
};

vec2.subtract = function(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
};

vec2.multiply = function(v) {
    this.x *= v.x;
    this.y *= v.y;
    return this;
};

vec2.scale = function(s) {
    this.x *= s;
    this.y *= s;
    return this;
};

vec2.divide = function(v) {
    this.x /= v.x;
    this.y /= v.y;
    return this;
};

vec2.negate = function() {
    this.x = -this.x;
    this.y = -this.y;
    return this;
};

vec2.distance = function(v) {
    var dx = v.x - this.x,
        dy = v.y - this.y;
    return Math.sqrt(dx*dx + dy*dy);
};

vec2.distanceSq = function(v) {
    var dx = v.x - this.x,
        dy = v.y - this.y;
    return dx*dx + dy*dy;
};

vec2.length = function() {
    var x = this.x,
        y = this.y;
    return Math.sqrt(x*x + y*y);
};

vec2.lengthSq = function() {
    var x = this.x,
        y = this.y;
    return x*x + y*y;
};

vec2.normalize = function() {
    var x = this.x,
        y = this.y;
    var len = x*x + y*y;
    if (len > 0) {
        len = 1 / Math.sqrt(len);
        this.x = x*len;
        this.y = y*len;
    }
    return this;
};

vec2.dot = function(v) {
    return this.x * v.x + this.y * v.y;
};

//Unlike Vector3, this returns a scalar
//http://allenchou.net/2013/07/cross-product-of-2d-vectors/
vec2.cross = function(v) {
    return this.x * v.y - this.y * v.x;
};

vec2.lerp = function(v, t) {
    var ax = this.x,
        ay = this.y;
    t = t||0;
    this.x = ax + t * (v.x - ax);
    this.y = ay + t * (v.y - ay);
    return this;
};

vec2.transformMat3 = function(mat) {
    var x = this.x, y = this.y, m = mat.val;
    this.x = m[0] * x + m[2] * y + m[4];
    this.y = m[1] * x + m[3] * y + m[5];
    return this;
};

vec2.transformMat4 = function(mat) {
    var x = this.x, 
        y = this.y,
        m = mat.val;
    this.x = m[0] * x + m[4] * y + m[12];
    this.y = m[1] * x + m[5] * y + m[13];
    return this;
};

vec2.reset = function() {
    this.x = 0;
    this.y = 0;
    return this;
};

vec2.sub = vec2.subtract;

vec2.mul = vec2.multiply;

vec2.div = vec2.divide;

vec2.dist = vec2.distance;

vec2.distSq = vec2.distanceSq;

vec2.len = vec2.length;

vec2.lenSq = vec2.lengthSq;

vec2.toString = function() {
    return 'Vector2(' + this.x + ', ' + this.y + ')';
};

vec2.random = function(scale) {
    scale = scale || 1.0;
    var r = Math.random() * 2.0 * Math.PI;
    this.x = Math.cos(r) * scale;
    this.y = Math.sin(r) * scale;
    return this;
};

vec2.str = vec2.toString;

module.exports = Vector2;
},{}],50:[function(_dereq_,module,exports){
function Vector3(x, y, z) {
    if (typeof x === "object") {
        this.x = x.x||0;
        this.y = x.y||0;
        this.z = x.z||0;
    } else {
        this.x = x||0;
        this.y = y||0;
        this.z = z||0;
    }
}

//shorthand it for better minification
var vec3 = Vector3.prototype;

vec3.clone = function() {
    return new Vector3(this.x, this.y, this.z);
};

vec3.copy = function(otherVec) {
    this.x = otherVec.x;
    this.y = otherVec.y;
    this.z = otherVec.z;
    return this;
};

vec3.set = function(x, y, z) {
    if (typeof x === "object") {
        this.x = x.x||0;
        this.y = x.y||0;
        this.z = x.z||0;
    } else {
        this.x = x||0;
        this.y = y||0;
        this.z = z||0;
    }
    return this;
};

vec3.add = function(v) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    return this;
};

vec3.subtract = function(v) {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;
    return this;
};

vec3.multiply = function(v) {
    this.x *= v.x;
    this.y *= v.y;
    this.z *= v.z;
    return this;
};

vec3.scale = function(s) {
    this.x *= s;
    this.y *= s;
    this.z *= s;
    return this;
};

vec3.divide = function(v) {
    this.x /= v.x;
    this.y /= v.y;
    this.z /= v.z;
    return this;
};

vec3.negate = function() {
    this.x = -this.x;
    this.y = -this.y;
    this.z = -this.z;
    return this;
};

vec3.distance = function(v) {
    var dx = v.x - this.x,
        dy = v.y - this.y,
        dz = v.z - this.z;
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
};

vec3.distanceSq = function(v) {
    var dx = v.x - this.x,
        dy = v.y - this.y,
        dz = v.z - this.z;
    return dx*dx + dy*dy + dz*dz;
};

vec3.length = function() {
    var x = this.x,
        y = this.y,
        z = this.z;
    return Math.sqrt(x*x + y*y + z*z);
};

vec3.lengthSq = function() {
    var x = this.x,
        y = this.y,
        z = this.z;
    return x*x + y*y + z*z;
};

vec3.normalize = function() {
    var x = this.x,
        y = this.y,
        z = this.z;
    var len = x*x + y*y + z*z;
    if (len > 0) {
        len = 1 / Math.sqrt(len);
        this.x = x*len;
        this.y = y*len;
        this.z = z*len;
    }
    return this;
};

vec3.dot = function(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
};

vec3.cross = function(v) {
    var ax = this.x, ay = this.y, az = this.z,
        bx = v.x, by = v.y, bz = v.z;

    this.x = ay * bz - az * by;
    this.y = az * bx - ax * bz;
    this.z = ax * by - ay * bx;
    return this;
};

vec3.lerp = function(v, t) {
    var ax = this.x,
        ay = this.y,
        az = this.z;
    t = t||0;
    this.x = ax + t * (v.x - ax);
    this.y = ay + t * (v.y - ay);
    this.z = az + t * (v.z - az);
    return this;
};

vec3.transformMat4 = function(mat) {
    var x = this.x, y = this.y, z = this.z, m = mat.val;
    this.x = m[0] * x + m[4] * y + m[8] * z + m[12];
    this.y = m[1] * x + m[5] * y + m[9] * z + m[13];
    this.z = m[2] * x + m[6] * y + m[10] * z + m[14];
    return this;
};

vec3.transformMat3 = function(mat) {
    var x = this.x, y = this.y, z = this.z, m = mat.val;
    this.x = x * m[0] + y * m[3] + z * m[6];
    this.y = x * m[1] + y * m[4] + z * m[7];
    this.z = x * m[2] + y * m[5] + z * m[8];
    return this;
};

vec3.transformQuat = function(q) {
    // benchmarks: http://jsperf.com/quaternion-transform-vec3-implementations
    var x = this.x, y = this.y, z = this.z,
        qx = q.x, qy = q.y, qz = q.z, qw = q.w,

        // calculate quat * vec
        ix = qw * x + qy * z - qz * y,
        iy = qw * y + qz * x - qx * z,
        iz = qw * z + qx * y - qy * x,
        iw = -qx * x - qy * y - qz * z;

    // calculate result * inverse quat
    this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    return this;
};

/**
 * Multiplies this Vector3 by the specified matrix, 
 * applying a W divide. This is useful for projection,
 * e.g. unprojecting a 2D point into 3D space.
 *
 * @method  prj
 * @param {Matrix4} the 4x4 matrix to multiply with 
 * @return {Vector3} this object for chaining
 */
vec3.project = function(mat) {
    var x = this.x,
        y = this.y,
        z = this.z,
        m = mat.val,
        a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3],
        a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7],
        a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11],
        a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15];

    var l_w = 1 / (x * a03 + y * a13 + z * a23 + a33);

    this.x = (x * a00 + y * a10 + z * a20 + a30) * l_w; 
    this.y = (x * a01 + y * a11 + z * a21 + a31) * l_w; 
    this.z = (x * a02 + y * a12 + z * a22 + a32) * l_w;
    return this;
};

/**
 * Unproject this point from 2D space to 3D space.
 * The point should have its x and y properties set to
 * 2D screen space, and the z either at 0 (near plane)
 * or 1 (far plane). The provided matrix is assumed to already
 * be combined, i.e. projection * view * model.
 *
 * After this operation, this vector's (x, y, z) components will
 * represent the unprojected 3D coordinate.
 * 
 * @param  {Vector4} viewport          screen x, y, width and height in pixels
 * @param  {Matrix4} invProjectionView combined projection and view matrix
 * @return {Vector3}                   this object, for chaining
 */
vec3.unproject = function(viewport, invProjectionView) {
    var viewX = viewport.x,
        viewY = viewport.y,
        viewWidth = viewport.z,
        viewHeight = viewport.w;
    
    var x = this.x, 
        y = this.y,
        z = this.z;

    x = x - viewX;
    y = viewHeight - y - 1;
    y = y - viewY;

    this.x = (2 * x) / viewWidth - 1;
    this.y = (2 * y) / viewHeight - 1;
    this.z = 2 * z - 1;

    return this.project(invProjectionView);
};

vec3.random = function(scale) {
    scale = scale || 1.0;

    var r = Math.random() * 2.0 * Math.PI;
    var z = (Math.random() * 2.0) - 1.0;
    var zScale = Math.sqrt(1.0-z*z) * scale;
    
    this.x = Math.cos(r) * zScale;
    this.y = Math.sin(r) * zScale;
    this.z = z * scale;
    return this;
};

vec3.reset = function() {
    this.x = 0;
    this.y = 0;
    this.z = 0;
    return this;
};


vec3.sub = vec3.subtract;

vec3.mul = vec3.multiply;

vec3.div = vec3.divide;

vec3.dist = vec3.distance;

vec3.distSq = vec3.distanceSq;

vec3.len = vec3.length;

vec3.lenSq = vec3.lengthSq;

vec3.toString = function() {
    return 'Vector3(' + this.x + ', ' + this.y + ', ' + this.z + ')';
};

vec3.str = vec3.toString;

module.exports = Vector3;
},{}],51:[function(_dereq_,module,exports){
var common = _dereq_('./common');

function Vector4(x, y, z, w) {
	if (typeof x === "object") {
        this.x = x.x||0;
        this.y = x.y||0;
        this.z = x.z||0;
        this.w = x.w||0;
    } else {
        this.x = x||0;
        this.y = y||0;
        this.z = z||0;
        this.w = w||0;
    }
}

//shorthand it for better minification
var vec4 = Vector4.prototype;

//mixin common functions
for (var k in common) {
    vec4[k] = common[k];
}

vec4.clone = function() {
    return new Vector4(this.x, this.y, this.z, this.w);
};

vec4.multiply = function(v) {
    this.x *= v.x;
    this.y *= v.y;
    this.z *= v.z;
    this.w *= v.w;
    return this;
};

vec4.divide = function(v) {
    this.x /= v.x;
    this.y /= v.y;
    this.z /= v.z;
    this.w /= v.w;
    return this;
};

vec4.distance = function(v) {
    var dx = v.x - this.x,
        dy = v.y - this.y,
        dz = v.z - this.z,
        dw = v.w - this.w;
    return Math.sqrt(dx*dx + dy*dy + dz*dz + dw*dw);
};

vec4.distanceSq = function(v) {
    var dx = v.x - this.x,
        dy = v.y - this.y,
        dz = v.z - this.z,
        dw = v.w - this.w;
    return dx*dx + dy*dy + dz*dz + dw*dw;
};

vec4.negate = function() {
    this.x = -this.x;
    this.y = -this.y;
    this.z = -this.z;
    this.w = -this.w;
    return this;
};

vec4.transformMat4 = function(mat) {
    var m = mat.val, x = this.x, y = this.y, z = this.z, w = this.w;
    this.x = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
    this.y = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
    this.z = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
    this.w = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
    return this;
};

//// TODO: is this really the same as Vector3 ??
///  Also, what about this:
///  http://molecularmusings.wordpress.com/2013/05/24/a-faster-quaternion-vector-multiplication/
vec4.transformQuat = function(q) {
    // benchmarks: http://jsperf.com/quaternion-transform-vec3-implementations
    var x = this.x, y = this.y, z = this.z,
        qx = q.x, qy = q.y, qz = q.z, qw = q.w,

        // calculate quat * vec
        ix = qw * x + qy * z - qz * y,
        iy = qw * y + qz * x - qx * z,
        iz = qw * z + qx * y - qy * x,
        iw = -qx * x - qy * y - qz * z;

    // calculate result * inverse quat
    this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    return out;
};

vec4.random = function(scale) {
    scale = scale || 1.0;

    //Not spherical; should fix this for more uniform distribution
    this.x = (Math.random() * 2 - 1) * scale;
    this.y = (Math.random() * 2 - 1) * scale;
    this.z = (Math.random() * 2 - 1) * scale;
    this.w = (Math.random() * 2 - 1) * scale;
    return this;
};

vec4.reset = function() {
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.w = 0;
    return this;
};

vec4.sub = vec4.subtract;

vec4.mul = vec4.multiply;

vec4.div = vec4.divide;

vec4.dist = vec4.distance;

vec4.distSq = vec4.distanceSq;

vec4.len = vec4.length;

vec4.lenSq = vec4.lengthSq;

vec4.toString = function() {
    return 'Vector4(' + this.x + ', ' + this.y + ', ' + this.z + ', ' + this.w + ')';
};

vec4.str = vec4.toString;

module.exports = Vector4;
},{"./common":52}],52:[function(_dereq_,module,exports){
//common vec4 functions
module.exports = {
    
/**
 * Copies the x, y, z, w components from the specified
 * Vector. Unlike most other operations, this function
 * will default undefined components on `otherVec` to zero.
 * 
 * @method  copy
 * @param  {otherVec} the other Vector4 to copy
 * @return {Vector}  this, for chaining
 */


/**
 * A convenience function to set the components of
 * this vector as x, y, z, w. Falsy or undefined
 * parameters will default to zero.
 *
 * You can also pass a vector object instead of
 * individual components, to copy the object's components.
 * 
 * @method  set
 * @param {Number} x the x component
 * @param {Number} y the y component
 * @param {Number} z the z component
 * @param {Number} w the w component
 * @return {Vector2}  this, for chaining
 */

/**
 * Adds the components of the other Vector4 to
 * this vector.
 * 
 * @method add
 * @param  {Vector4} otherVec other vector, right operand
 * @return {Vector2}  this, for chaining
 */

/**
 * Subtracts the components of the other Vector4
 * from this vector. Aliased as `sub()`
 * 
 * @method  subtract
 * @param  {Vector4} otherVec other vector, right operand
 * @return {Vector2}  this, for chaining
 */

/**
 * Multiplies the components of this Vector4
 * by a scalar amount.
 *
 * @method  scale
 * @param {Number} s the scale to multiply by
 * @return {Vector4} this, for chaining
 */

/**
 * Returns the magnitude (length) of this vector.
 *
 * Aliased as `len()`
 * 
 * @method  length
 * @return {Number} the length of this vector
 */

/**
 * Returns the squared magnitude (length) of this vector.
 *
 * Aliased as `lenSq()`
 * 
 * @method  lengthSq
 * @return {Number} the squared length of this vector
 */

/**
 * Normalizes this vector to a unit vector.
 * @method normalize
 * @return {Vector4}  this, for chaining
 */

/**
 * Returns the dot product of this vector
 * and the specified Vector4.
 * 
 * @method dot
 * @return {Number} the dot product
 */
    copy: function(otherVec) {
        this.x = otherVec.x||0;
        this.y = otherVec.y||0;
        this.z = otherVec.z||0;
        this.w = otherVec.w||0;
        return this;
    },

    set: function(x, y, z, w) {
        if (typeof x === "object") {
            this.x = x.x||0;
            this.y = x.y||0;
            this.z = x.z||0;
            this.w = x.w||0;
        } else {
            this.x = x||0;
            this.y = y||0;
            this.z = z||0;
            this.w = w||0;

        }
        return this;
    },

    add: function(v) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        this.w += v.w;
        return this;
    },

    subtract: function(v) {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;
        this.w -= v.w;
        return this;
    },

    scale: function(s) {
        this.x *= s;
        this.y *= s;
        this.z *= s;
        this.w *= s;
        return this;
    },


    length: function() {
        var x = this.x,
            y = this.y,
            z = this.z,
            w = this.w;
        return Math.sqrt(x*x + y*y + z*z + w*w);
    },

    lengthSq: function() {
        var x = this.x,
            y = this.y,
            z = this.z,
            w = this.w;
        return x*x + y*y + z*z + w*w;
    },

    normalize: function() {
        var x = this.x,
            y = this.y,
            z = this.z,
            w = this.w;
        var len = x*x + y*y + z*z + w*w;
        if (len > 0) {
            len = 1 / Math.sqrt(len);
            this.x = x*len;
            this.y = y*len;
            this.z = z*len;
            this.w = w*len;
        }
        return this;
    },

    dot: function(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w;
    },

    lerp: function(v, t) {
        var ax = this.x,
            ay = this.y,
            az = this.z,
            aw = this.w;
        t = t||0;
        this.x = ax + t * (v.x - ax);
        this.y = ay + t * (v.y - ay);
        this.z = az + t * (v.z - az);
        this.w = aw + t * (v.w - aw);
        return this;
    }
};
},{}],53:[function(_dereq_,module,exports){
module.exports = {
    Vector2: _dereq_('./Vector2'),
    Vector3: _dereq_('./Vector3'),
    Vector4: _dereq_('./Vector4'),
    Matrix3: _dereq_('./Matrix3'),
    Matrix4: _dereq_('./Matrix4'),
    Quaternion: _dereq_('./Quaternion')
};
},{"./Matrix3":46,"./Matrix4":47,"./Quaternion":48,"./Vector2":49,"./Vector3":50,"./Vector4":51}],54:[function(_dereq_,module,exports){
module.exports=_dereq_(46)
},{}],55:[function(_dereq_,module,exports){
var ARRAY_TYPE = typeof Float32Array !== "undefined" ? Float32Array : Array;
var EPSILON = 0.000001;

function Matrix4(m) {
    this.val = new ARRAY_TYPE(16);

    if (m) { //assume Matrix4 with val
        this.copy(m);
    } else { //default to identity
        this.idt();
    }
}

var mat4 = Matrix4.prototype;

mat4.clone = function() {
    return new Matrix4(this);
};

mat4.set = function(otherMat) {
    return this.copy(otherMat);
};

mat4.copy = function(otherMat) {
    var out = this.val,
        a = otherMat.val; 
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return this;
};

mat4.fromArray = function(a) {
    var out = this.val;
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return this;
};

mat4.identity = function() {
    var out = this.val;
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return this;
};

mat4.transpose = function() {
    var a = this.val,
        a01 = a[1], a02 = a[2], a03 = a[3],
        a12 = a[6], a13 = a[7],
        a23 = a[11];

    a[1] = a[4];
    a[2] = a[8];
    a[3] = a[12];
    a[4] = a01;
    a[6] = a[9];
    a[7] = a[13];
    a[8] = a02;
    a[9] = a12;
    a[11] = a[14];
    a[12] = a03;
    a[13] = a13;
    a[14] = a23;
    return this;
};

mat4.invert = function() {
    var a = this.val,
        a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32,

        // Calculate the determinant
        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (!det) { 
        return null; 
    }
    det = 1.0 / det;

    a[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    a[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    a[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    a[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    a[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    a[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    a[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    a[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    a[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    a[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    a[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    a[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    a[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    a[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    a[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    a[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
    return this;
};

mat4.adjoint = function() {
    var a = this.val,
        a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    a[0]  =  (a11 * (a22 * a33 - a23 * a32) - a21 * (a12 * a33 - a13 * a32) + a31 * (a12 * a23 - a13 * a22));
    a[1]  = -(a01 * (a22 * a33 - a23 * a32) - a21 * (a02 * a33 - a03 * a32) + a31 * (a02 * a23 - a03 * a22));
    a[2]  =  (a01 * (a12 * a33 - a13 * a32) - a11 * (a02 * a33 - a03 * a32) + a31 * (a02 * a13 - a03 * a12));
    a[3]  = -(a01 * (a12 * a23 - a13 * a22) - a11 * (a02 * a23 - a03 * a22) + a21 * (a02 * a13 - a03 * a12));
    a[4]  = -(a10 * (a22 * a33 - a23 * a32) - a20 * (a12 * a33 - a13 * a32) + a30 * (a12 * a23 - a13 * a22));
    a[5]  =  (a00 * (a22 * a33 - a23 * a32) - a20 * (a02 * a33 - a03 * a32) + a30 * (a02 * a23 - a03 * a22));
    a[6]  = -(a00 * (a12 * a33 - a13 * a32) - a10 * (a02 * a33 - a03 * a32) + a30 * (a02 * a13 - a03 * a12));
    a[7]  =  (a00 * (a12 * a23 - a13 * a22) - a10 * (a02 * a23 - a03 * a22) + a20 * (a02 * a13 - a03 * a12));
    a[8]  =  (a10 * (a21 * a33 - a23 * a31) - a20 * (a11 * a33 - a13 * a31) + a30 * (a11 * a23 - a13 * a21));
    a[9]  = -(a00 * (a21 * a33 - a23 * a31) - a20 * (a01 * a33 - a03 * a31) + a30 * (a01 * a23 - a03 * a21));
    a[10] =  (a00 * (a11 * a33 - a13 * a31) - a10 * (a01 * a33 - a03 * a31) + a30 * (a01 * a13 - a03 * a11));
    a[11] = -(a00 * (a11 * a23 - a13 * a21) - a10 * (a01 * a23 - a03 * a21) + a20 * (a01 * a13 - a03 * a11));
    a[12] = -(a10 * (a21 * a32 - a22 * a31) - a20 * (a11 * a32 - a12 * a31) + a30 * (a11 * a22 - a12 * a21));
    a[13] =  (a00 * (a21 * a32 - a22 * a31) - a20 * (a01 * a32 - a02 * a31) + a30 * (a01 * a22 - a02 * a21));
    a[14] = -(a00 * (a11 * a32 - a12 * a31) - a10 * (a01 * a32 - a02 * a31) + a30 * (a01 * a12 - a02 * a11));
    a[15] =  (a00 * (a11 * a22 - a12 * a21) - a10 * (a01 * a22 - a02 * a21) + a20 * (a01 * a12 - a02 * a11));
    return this;
};

mat4.determinant = function () {
    var a = this.val,
        a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32;

    // Calculate the determinant
    return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
};

mat4.multiply = function(otherMat) {
    var a = this.val,
        b = otherMat.val,
        a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    // Cache only the current line of the second matrix
    var b0  = b[0], b1 = b[1], b2 = b[2], b3 = b[3];  
    a[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    a[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    a[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    a[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
    a[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    a[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    a[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    a[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
    a[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    a[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    a[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    a[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
    a[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    a[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    a[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    a[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
    return this;
};

mat4.translate = function(v) {
    var x = v.x, y = v.y, z = v.z,
        a = this.val;
    a[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
    a[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
    a[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
    a[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
    return this;
};

mat4.scale = function(v) {
    var x = v.x, y = v.y, z = v.z, a = this.val;

    a[0] = a[0] * x;
    a[1] = a[1] * x;
    a[2] = a[2] * x;
    a[3] = a[3] * x;
    a[4] = a[4] * y;
    a[5] = a[5] * y;
    a[6] = a[6] * y;
    a[7] = a[7] * y;
    a[8] = a[8] * z;
    a[9] = a[9] * z;
    a[10] = a[10] * z;
    a[11] = a[11] * z;
    a[12] = a[12];
    a[13] = a[13];
    a[14] = a[14];
    a[15] = a[15];
    return this;
};

mat4.rotate = function (rad, axis) {
    var a = this.val,
        x = axis.x, y = axis.y, z = axis.z,
        len = Math.sqrt(x * x + y * y + z * z),
        s, c, t,
        a00, a01, a02, a03,
        a10, a11, a12, a13,
        a20, a21, a22, a23,
        b00, b01, b02,
        b10, b11, b12,
        b20, b21, b22;

    if (Math.abs(len) < EPSILON) { return null; }
    
    len = 1 / len;
    x *= len;
    y *= len;
    z *= len;

    s = Math.sin(rad);
    c = Math.cos(rad);
    t = 1 - c;

    a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
    a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
    a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];

    // Construct the elements of the rotation matrix
    b00 = x * x * t + c; b01 = y * x * t + z * s; b02 = z * x * t - y * s;
    b10 = x * y * t - z * s; b11 = y * y * t + c; b12 = z * y * t + x * s;
    b20 = x * z * t + y * s; b21 = y * z * t - x * s; b22 = z * z * t + c;

    // Perform rotation-specific matrix multiplication
    a[0] = a00 * b00 + a10 * b01 + a20 * b02;
    a[1] = a01 * b00 + a11 * b01 + a21 * b02;
    a[2] = a02 * b00 + a12 * b01 + a22 * b02;
    a[3] = a03 * b00 + a13 * b01 + a23 * b02;
    a[4] = a00 * b10 + a10 * b11 + a20 * b12;
    a[5] = a01 * b10 + a11 * b11 + a21 * b12;
    a[6] = a02 * b10 + a12 * b11 + a22 * b12;
    a[7] = a03 * b10 + a13 * b11 + a23 * b12;
    a[8] = a00 * b20 + a10 * b21 + a20 * b22;
    a[9] = a01 * b20 + a11 * b21 + a21 * b22;
    a[10] = a02 * b20 + a12 * b21 + a22 * b22;
    a[11] = a03 * b20 + a13 * b21 + a23 * b22;
    return this;
};

mat4.rotateX = function(rad) {
    var a = this.val,
        s = Math.sin(rad),
        c = Math.cos(rad),
        a10 = a[4],
        a11 = a[5],
        a12 = a[6],
        a13 = a[7],
        a20 = a[8],
        a21 = a[9],
        a22 = a[10],
        a23 = a[11];

    // Perform axis-specific matrix multiplication
    a[4] = a10 * c + a20 * s;
    a[5] = a11 * c + a21 * s;
    a[6] = a12 * c + a22 * s;
    a[7] = a13 * c + a23 * s;
    a[8] = a20 * c - a10 * s;
    a[9] = a21 * c - a11 * s;
    a[10] = a22 * c - a12 * s;
    a[11] = a23 * c - a13 * s;
    return this;
};

mat4.rotateY = function(rad) {
    var a = this.val,
        s = Math.sin(rad),
        c = Math.cos(rad),
        a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a03 = a[3],
        a20 = a[8],
        a21 = a[9],
        a22 = a[10],
        a23 = a[11];

    // Perform axis-specific matrix multiplication
    a[0] = a00 * c - a20 * s;
    a[1] = a01 * c - a21 * s;
    a[2] = a02 * c - a22 * s;
    a[3] = a03 * c - a23 * s;
    a[8] = a00 * s + a20 * c;
    a[9] = a01 * s + a21 * c;
    a[10] = a02 * s + a22 * c;
    a[11] = a03 * s + a23 * c;
    return this;
};

mat4.rotateZ = function (rad) {
    var a = this.val,
        s = Math.sin(rad),
        c = Math.cos(rad),
        a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a03 = a[3],
        a10 = a[4],
        a11 = a[5],
        a12 = a[6],
        a13 = a[7];

    // Perform axis-specific matrix multiplication
    a[0] = a00 * c + a10 * s;
    a[1] = a01 * c + a11 * s;
    a[2] = a02 * c + a12 * s;
    a[3] = a03 * c + a13 * s;
    a[4] = a10 * c - a00 * s;
    a[5] = a11 * c - a01 * s;
    a[6] = a12 * c - a02 * s;
    a[7] = a13 * c - a03 * s;
    return this;
};

mat4.fromRotationTranslation = function (q, v) {
    // Quaternion math
    var out = this.val,
        x = q.x, y = q.y, z = q.z, w = q.w,
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        xy = x * y2,
        xz = x * z2,
        yy = y * y2,
        yz = y * z2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    out[0] = 1 - (yy + zz);
    out[1] = xy + wz;
    out[2] = xz - wy;
    out[3] = 0;
    out[4] = xy - wz;
    out[5] = 1 - (xx + zz);
    out[6] = yz + wx;
    out[7] = 0;
    out[8] = xz + wy;
    out[9] = yz - wx;
    out[10] = 1 - (xx + yy);
    out[11] = 0;
    out[12] = v.x;
    out[13] = v.y;
    out[14] = v.z;
    out[15] = 1;
    return this;
};

mat4.fromQuat = function (q) {
    var out = this.val,
        x = q.x, y = q.y, z = q.z, w = q.w,
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        xy = x * y2,
        xz = x * z2,
        yy = y * y2,
        yz = y * z2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    out[0] = 1 - (yy + zz);
    out[1] = xy + wz;
    out[2] = xz - wy;
    out[3] = 0;

    out[4] = xy - wz;
    out[5] = 1 - (xx + zz);
    out[6] = yz + wx;
    out[7] = 0;

    out[8] = xz + wy;
    out[9] = yz - wx;
    out[10] = 1 - (xx + yy);
    out[11] = 0;

    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;

    return this;
};


/**
 * Generates a frustum matrix with the given bounds
 *
 * @param {Number} left Left bound of the frustum
 * @param {Number} right Right bound of the frustum
 * @param {Number} bottom Bottom bound of the frustum
 * @param {Number} top Top bound of the frustum
 * @param {Number} near Near bound of the frustum
 * @param {Number} far Far bound of the frustum
 * @returns {Matrix4} this for chaining
 */
mat4.frustum = function (left, right, bottom, top, near, far) {
    var out = this.val,
        rl = 1 / (right - left),
        tb = 1 / (top - bottom),
        nf = 1 / (near - far);
    out[0] = (near * 2) * rl;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = (near * 2) * tb;
    out[6] = 0;
    out[7] = 0;
    out[8] = (right + left) * rl;
    out[9] = (top + bottom) * tb;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = (far * near * 2) * nf;
    out[15] = 0;
    return this;
};


/**
 * Generates a perspective projection matrix with the given bounds
 *
 * @param {number} fovy Vertical field of view in radians
 * @param {number} aspect Aspect ratio. typically viewport width/height
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {Matrix4} this for chaining
 */
mat4.perspective = function (fovy, aspect, near, far) {
    var out = this.val,
        f = 1.0 / Math.tan(fovy / 2),
        nf = 1 / (near - far);
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = (2 * far * near) * nf;
    out[15] = 0;
    return this;
};

/**
 * Generates a orthogonal projection matrix with the given bounds
 *
 * @param {number} left Left bound of the frustum
 * @param {number} right Right bound of the frustum
 * @param {number} bottom Bottom bound of the frustum
 * @param {number} top Top bound of the frustum
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {Matrix4} this for chaining
 */
mat4.ortho = function (left, right, bottom, top, near, far) {
    var out = this.val,
        lr = 1 / (left - right),
        bt = 1 / (bottom - top),
        nf = 1 / (near - far);
    out[0] = -2 * lr;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = -2 * bt;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 2 * nf;
    out[11] = 0;
    out[12] = (left + right) * lr;
    out[13] = (top + bottom) * bt;
    out[14] = (far + near) * nf;
    out[15] = 1;
    return this;
};

/**
 * Generates a look-at matrix with the given eye position, focal point, and up axis
 *
 * @param {Vector3} eye Position of the viewer
 * @param {Vector3} center Point the viewer is looking at
 * @param {Vector3} up vec3 pointing up
 * @returns {Matrix4} this for chaining
 */
mat4.lookAt = function (eye, center, up) {
    var out = this.val,

        x0, x1, x2, y0, y1, y2, z0, z1, z2, len,
        eyex = eye.x,
        eyey = eye.y,
        eyez = eye.z,
        upx = up.x,
        upy = up.y,
        upz = up.z,
        centerx = center.x,
        centery = center.y,
        centerz = center.z;

    if (Math.abs(eyex - centerx) < EPSILON &&
        Math.abs(eyey - centery) < EPSILON &&
        Math.abs(eyez - centerz) < EPSILON) {
        return this.identity();
    }

    z0 = eyex - centerx;
    z1 = eyey - centery;
    z2 = eyez - centerz;

    len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
    z0 *= len;
    z1 *= len;
    z2 *= len;

    x0 = upy * z2 - upz * z1;
    x1 = upz * z0 - upx * z2;
    x2 = upx * z1 - upy * z0;
    len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
    if (!len) {
        x0 = 0;
        x1 = 0;
        x2 = 0;
    } else {
        len = 1 / len;
        x0 *= len;
        x1 *= len;
        x2 *= len;
    }

    y0 = z1 * x2 - z2 * x1;
    y1 = z2 * x0 - z0 * x2;
    y2 = z0 * x1 - z1 * x0;

    len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
    if (!len) {
        y0 = 0;
        y1 = 0;
        y2 = 0;
    } else {
        len = 1 / len;
        y0 *= len;
        y1 *= len;
        y2 *= len;
    }

    out[0] = x0;
    out[1] = y0;
    out[2] = z0;
    out[3] = 0;
    out[4] = x1;
    out[5] = y1;
    out[6] = z1;
    out[7] = 0;
    out[8] = x2;
    out[9] = y2;
    out[10] = z2;
    out[11] = 0;
    out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
    out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
    out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
    out[15] = 1;

    return this;
};


mat4.mul = mat4.multiply;

mat4.idt = mat4.identity;

//This is handy for Pool utilities, to "reset" a
//shared object to its default state
mat4.reset = mat4.idt;

mat4.toString = function () {
    var a = this.val;
    return 'Matrix4(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ', ' +
                    a[4] + ', ' + a[5] + ', ' + a[6] + ', ' + a[7] + ', ' +
                    a[8] + ', ' + a[9] + ', ' + a[10] + ', ' + a[11] + ', ' + 
                    a[12] + ', ' + a[13] + ', ' + a[14] + ', ' + a[15] + ')';
};

mat4.str = mat4.toString;

module.exports = Matrix4;

},{}],56:[function(_dereq_,module,exports){
var Vector3 = _dereq_('./Vector3');
var Matrix3 = _dereq_('./Matrix3');
var common = _dereq_('./common');

//some shared 'private' arrays
var s_iNext = (typeof Int8Array !== 'undefined' ? new Int8Array([1,2,0]) : [1,2,0]);
var tmp = (typeof Float32Array !== 'undefined' ? new Float32Array([0,0,0]) : [0,0,0]);

var xUnitVec3 = new Vector3(1, 0, 0);
var yUnitVec3 = new Vector3(0, 1, 0);
var tmpvec = new Vector3();

var tmpMat3 = new Matrix3();

function Quaternion(x, y, z, w) {
	if (typeof x === "object") {
        this.x = x.x||0;
        this.y = x.y||0;
        this.z = x.z||0;
        this.w = x.w||0;
    } else {
        this.x = x||0;
        this.y = y||0;
        this.z = z||0;
        this.w = w||0;
    }
}

var quat = Quaternion.prototype;

//mixin common functions
for (var k in common) {
    quat[k] = common[k];
}

quat.rotationTo = function(a, b) {
    var dot = a.x * b.x + a.y * b.y + a.z * b.z; //a.dot(b)
    if (dot < -0.999999) {
        if (tmpvec.copy(xUnitVec3).cross(a).len() < 0.000001)
            tmpvec.copy(yUnitVec3).cross(a);
        
        tmpvec.normalize();
        return this.setAxisAngle(tmpvec, Math.PI);
    } else if (dot > 0.999999) {
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.w = 1;
        return this;
    } else {
        tmpvec.copy(a).cross(b);
        this.x = tmpvec.x;
        this.y = tmpvec.y;
        this.z = tmpvec.z;
        this.w = 1 + dot;
        return this.normalize();
    }
};

quat.setAxes = function(view, right, up) {
    var m = tmpMat3.val;
    m[0] = right.x;
    m[3] = right.y;
    m[6] = right.z;

    m[1] = up.x;
    m[4] = up.y;
    m[7] = up.z;

    m[2] = -view.x;
    m[5] = -view.y;
    m[8] = -view.z;

    return this.fromMat3(tmpMat3).normalize();
};

quat.identity = function() {
    this.x = this.y = this.z = 0;
    this.w = 1;
    return this;
};

quat.setAxisAngle = function(axis, rad) {
    rad = rad * 0.5;
    var s = Math.sin(rad);
    this.x = s * axis.x;
    this.y = s * axis.y;
    this.z = s * axis.z;
    this.w = Math.cos(rad);
    return this;
};

quat.multiply = function(b) {
    var ax = this.x, ay = this.y, az = this.z, aw = this.w,
        bx = b.x, by = b.y, bz = b.z, bw = b.w;

    this.x = ax * bw + aw * bx + ay * bz - az * by;
    this.y = ay * bw + aw * by + az * bx - ax * bz;
    this.z = az * bw + aw * bz + ax * by - ay * bx;
    this.w = aw * bw - ax * bx - ay * by - az * bz;
    return this;
};

quat.slerp = function (b, t) {
    // benchmarks:
    //    http://jsperf.com/quaternion-slerp-implementations

    var ax = this.x, ay = this.y, az = this.y, aw = this.y,
        bx = b.x, by = b.y, bz = b.z, bw = b.w;

    var        omega, cosom, sinom, scale0, scale1;

    // calc cosine
    cosom = ax * bx + ay * by + az * bz + aw * bw;
    // adjust signs (if necessary)
    if ( cosom < 0.0 ) {
        cosom = -cosom;
        bx = - bx;
        by = - by;
        bz = - bz;
        bw = - bw;
    }
    // calculate coefficients
    if ( (1.0 - cosom) > 0.000001 ) {
        // standard case (slerp)
        omega  = Math.acos(cosom);
        sinom  = Math.sin(omega);
        scale0 = Math.sin((1.0 - t) * omega) / sinom;
        scale1 = Math.sin(t * omega) / sinom;
    } else {        
        // "from" and "to" quaternions are very close 
        //  ... so we can do a linear interpolation
        scale0 = 1.0 - t;
        scale1 = t;
    }
    // calculate final values
    this.x = scale0 * ax + scale1 * bx;
    this.y = scale0 * ay + scale1 * by;
    this.z = scale0 * az + scale1 * bz;
    this.w = scale0 * aw + scale1 * bw;
    return this;
};

quat.invert = function() {
    var a0 = this.x, a1 = this.y, a2 = this.z, a3 = this.w,
        dot = a0*a0 + a1*a1 + a2*a2 + a3*a3,
        invDot = dot ? 1.0/dot : 0;
    
    // TODO: Would be faster to return [0,0,0,0] immediately if dot == 0

    this.x = -a0*invDot;
    this.y = -a1*invDot;
    this.z = -a2*invDot;
    this.w = a3*invDot;
    return this;
};

quat.conjugate = function() {
    this.x = -this.x;
    this.y = -this.y;
    this.z = -this.z;
    return this;
};

quat.rotateX = function (rad) {
    rad *= 0.5; 

    var ax = this.x, ay = this.y, az = this.z, aw = this.w,
        bx = Math.sin(rad), bw = Math.cos(rad);

    this.x = ax * bw + aw * bx;
    this.y = ay * bw + az * bx;
    this.z = az * bw - ay * bx;
    this.w = aw * bw - ax * bx;
    return this;
};

quat.rotateY = function (rad) {
    rad *= 0.5; 

    var ax = this.x, ay = this.y, az = this.z, aw = this.w,
        by = Math.sin(rad), bw = Math.cos(rad);

    this.x = ax * bw - az * by;
    this.y = ay * bw + aw * by;
    this.z = az * bw + ax * by;
    this.w = aw * bw - ay * by;
    return this;
};

quat.rotateZ = function (rad) {
    rad *= 0.5; 

    var ax = this.x, ay = this.y, az = this.z, aw = this.w,
        bz = Math.sin(rad), bw = Math.cos(rad);

    this.x = ax * bw + ay * bz;
    this.y = ay * bw - ax * bz;
    this.z = az * bw + aw * bz;
    this.w = aw * bw - az * bz;
    return this;
};

quat.calculateW = function () {
    var x = this.x, y = this.y, z = this.z;

    this.x = x;
    this.y = y;
    this.z = z;
    this.w = -Math.sqrt(Math.abs(1.0 - x * x - y * y - z * z));
    return this;
};

quat.fromMat3 = function(mat) {
    // benchmarks:
    //    http://jsperf.com/typed-array-access-speed
    //    http://jsperf.com/conversion-of-3x3-matrix-to-quaternion

    // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
    // article "Quaternion Calculus and Fast Animation".
    var m = mat.val,
        fTrace = m[0] + m[4] + m[8];
    var fRoot;

    if ( fTrace > 0.0 ) {
        // |w| > 1/2, may as well choose w > 1/2
        fRoot = Math.sqrt(fTrace + 1.0);  // 2w
        this.w = 0.5 * fRoot;
        fRoot = 0.5/fRoot;  // 1/(4w)
        this.x = (m[7]-m[5])*fRoot;
        this.y = (m[2]-m[6])*fRoot;
        this.z = (m[3]-m[1])*fRoot;
    } else {
        // |w| <= 1/2
        var i = 0;
        if ( m[4] > m[0] )
          i = 1;
        if ( m[8] > m[i*3+i] )
          i = 2;
        var j = s_iNext[i];
        var k = s_iNext[j];
            
        //This isn't quite as clean without array access...
        fRoot = Math.sqrt(m[i*3+i]-m[j*3+j]-m[k*3+k] + 1.0);
        tmp[i] = 0.5 * fRoot;

        fRoot = 0.5 / fRoot;
        tmp[j] = (m[j*3+i] + m[i*3+j]) * fRoot;
        tmp[k] = (m[k*3+i] + m[i*3+k]) * fRoot;

        this.x = tmp[0];
        this.y = tmp[1];
        this.z = tmp[2];
        this.w = (m[k*3+j] - m[j*3+k]) * fRoot;
    }
    
    return this;
};

quat.idt = quat.identity;

quat.sub = quat.subtract;

quat.mul = quat.multiply;

quat.len = quat.length;

quat.lenSq = quat.lengthSq;

//This is handy for Pool utilities, to "reset" a
//shared object to its default state
quat.reset = quat.idt;


quat.toString = function() {
    return 'Quaternion(' + this.x + ', ' + this.y + ', ' + this.z + ', ' + this.w + ')';
};

quat.str = quat.toString;

module.exports = Quaternion;
},{"./Matrix3":54,"./Vector3":58,"./common":60}],57:[function(_dereq_,module,exports){
module.exports=_dereq_(49)
},{}],58:[function(_dereq_,module,exports){
module.exports=_dereq_(50)
},{}],59:[function(_dereq_,module,exports){
var common = _dereq_('./common');

function Vector4(x, y, z, w) {
	if (typeof x === "object") {
        this.x = x.x||0;
        this.y = x.y||0;
        this.z = x.z||0;
        this.w = x.w||0;
    } else {
        this.x = x||0;
        this.y = y||0;
        this.z = z||0;
        this.w = w||0;
    }
}

//shorthand it for better minification
var vec4 = Vector4.prototype;

//mixin common functions
for (var k in common) {
    vec4[k] = common[k];
}

vec4.clone = function() {
    return new Vector4(this.x, this.y, this.z, this.w);
};

vec4.multiply = function(v) {
    this.x *= v.x;
    this.y *= v.y;
    this.z *= v.z;
    this.w *= v.w;
    return this;
};

vec4.divide = function(v) {
    this.x /= v.x;
    this.y /= v.y;
    this.z /= v.z;
    this.w /= v.w;
    return this;
};

vec4.distance = function(v) {
    var dx = v.x - this.x,
        dy = v.y - this.y,
        dz = v.z - this.z,
        dw = v.w - this.w;
    return Math.sqrt(dx*dx + dy*dy + dz*dz + dw*dw);
};

vec4.distanceSq = function(v) {
    var dx = v.x - this.x,
        dy = v.y - this.y,
        dz = v.z - this.z,
        dw = v.w - this.w;
    return dx*dx + dy*dy + dz*dz + dw*dw;
};

vec4.negate = function() {
    this.x = -this.x;
    this.y = -this.y;
    this.z = -this.z;
    this.w = -this.w;
    return this;
};

vec4.transformMat4 = function(mat) {
    var m = mat.val, x = this.x, y = this.y, z = this.z, w = this.w;
    this.x = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
    this.y = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
    this.z = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
    this.w = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
    return this;
};

//// TODO: is this really the same as Vector3 ??
///  Also, what about this:
///  http://molecularmusings.wordpress.com/2013/05/24/a-faster-quaternion-vector-multiplication/
vec4.transformQuat = function(q) {
    // benchmarks: http://jsperf.com/quaternion-transform-vec3-implementations
    var x = this.x, y = this.y, z = this.z,
        qx = q.x, qy = q.y, qz = q.z, qw = q.w,

        // calculate quat * vec
        ix = qw * x + qy * z - qz * y,
        iy = qw * y + qz * x - qx * z,
        iz = qw * z + qx * y - qy * x,
        iw = -qx * x - qy * y - qz * z;

    // calculate result * inverse quat
    this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    return this;
};

vec4.random = function(scale) {
    scale = scale || 1.0;

    //Not spherical; should fix this for more uniform distribution
    this.x = (Math.random() * 2 - 1) * scale;
    this.y = (Math.random() * 2 - 1) * scale;
    this.z = (Math.random() * 2 - 1) * scale;
    this.w = (Math.random() * 2 - 1) * scale;
    return this;
};

vec4.reset = function() {
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.w = 0;
    return this;
};

vec4.sub = vec4.subtract;

vec4.mul = vec4.multiply;

vec4.div = vec4.divide;

vec4.dist = vec4.distance;

vec4.distSq = vec4.distanceSq;

vec4.len = vec4.length;

vec4.lenSq = vec4.lengthSq;

vec4.toString = function() {
    return 'Vector4(' + this.x + ', ' + this.y + ', ' + this.z + ', ' + this.w + ')';
};

vec4.str = vec4.toString;

module.exports = Vector4;
},{"./common":60}],60:[function(_dereq_,module,exports){
module.exports=_dereq_(52)
},{}],61:[function(_dereq_,module,exports){
arguments[4][53][0].apply(exports,arguments)
},{"./Matrix3":54,"./Matrix4":55,"./Quaternion":56,"./Vector2":57,"./Vector3":58,"./Vector4":59}],62:[function(_dereq_,module,exports){

},{}]},{},[2])
(2)
});