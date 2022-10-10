(function (factory) {
	typeof define === 'function' && define.amd ? define(factory) :
	factory();
})((function () { 'use strict';

	window.document.getElementById('app').innerText = 'hello, world!';

}));
