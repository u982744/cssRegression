var exports = exports || {},
	tmpb = tmpb || {};

/** @module sanitise */
tmpb.sanitise = (function () {

	"use strict";

    var sanitise = function (string) {

	    string = string.replace(/http\:\/\/|https\:\/\//gi, "");
	    string = string.replace(/\/$/gi, "");
	    string = string.replace(/#/gi, "_hash_");
	    string = string.replace(/\?/gi, "_q_");
	    string = string.replace(/\=/gi, "_equals_");
	    string = string.replace(/\s/gi, "_space_");
	    string = string.replace(/[.]/gi, "_dot_");

	    return string;
	};

	return sanitise;

}());

exports.sanitise = tmpb.sanitise;