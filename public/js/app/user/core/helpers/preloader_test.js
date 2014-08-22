define([
	'helpers/preloader'
],
	function (Preloader) {

		F.speed = 100;
		F('#sandbox').append('<p>Some text</p>');

		describe("Preloader", function() {

			it('should have default options', function (done) {
				// var preloader = new Preloader();
				// expect(preloader.images).toBe
				
				F('#sandbox').click(function(){
          			expect(F('#sandbox p').length).toBe(2);
				});

				F('#sandbox').click(function(){
          			expect(F('#sandbox p').length).toBe(3);
				});

				F(function(){
                    done();
                });

			});

			// it("should load array of images by name", function () {

			// });

			// it("should load array of images by url", function () {

			// });

			// it("should load images by jquery selector", function () {

			// });

			// it("should run callback if there are not images", function () {

			// });

		});

	}
);