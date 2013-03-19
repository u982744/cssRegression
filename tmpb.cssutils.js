/*globals window, alert, ndm, jQuery*/

var tmpb = tmpb || {};

/** @module cssutils */
tmpb.cssutils = (function ($, global) {
    "use strict";

    /** 
        This is not a constructor but I can't figure out how else
        to jsdoc it so it will work...
        
        @constructor 
        @alias module:cssutils
     */
    var module = {
        /**
         * Returns computed style objects for a given array of elements
         *
         * @this {cssutils}
         * @param {elements} elems The dom elements to get the computed styles of
         * @return {array} Array of computed style objects
         */
        getStyleObjects: function (elems, options) {
            var elemsLen = elems.length,
                i = 0,
                elem,
                styleObj = {},
                styleObjs = [];

            for (i = 0; i < elemsLen; i = i + 1) {
                elem = elems[i];
                styleObj = this.getStyleObject(elem, options);
                styleObjs.push(styleObj);
            }

            return styleObjs;
        },
        /**
            Returns computed style object for a given element

            @this {cssutils}
            @param {element} elem The dom element to get the computed style of
            @param {object} options The options for which computed styles to check, can supply blacklist or whitelist
            @return {object} Computed style object
         */
        getStyleObject: function (elem, options) {
            var style,
                returns = {},
                i,
                prop,
                camelize,
                camel,
                val,
                checkLists,
                defaults = {
                    blacklist: [],
                    whitelist: [
                        // general
                        "color",
                        "background",
                        "backgroundAttachment",
                        "backgroundColor",
                        "backgroundImage",
                        "backgroundPosition",
                        "backgroundRepeat",
                        "borderBottomColor",
                        "borderBottomLeftRadius",
                        "borderBottomRightRadius",
                        "borderBottomStyle",
                        "borderBottomWidth",
                        "borderLeftColor",
                        "borderLeftStyle",
                        "borderLeftWidth",
                        "borderRightColor",
                        "borderRightStyle",
                        "borderRightWidth",
                        "borderTopColor",
                        "borderTopLeftRadius",
                        "borderTopRightRadius",
                        "borderTopStyle",
                        "borderTopWidth",
                        "cursor",
                        "fontFamily",
                        "fontSize",
                        "fontStyle",
                        "fontWeight",
                        "lineHeight",
                        "listStyleImage",
                        "listStylePosition",
                        "listStyleType",
                        "opacity",
                        "textDecoration",
                        "textIndent",
                        "textTransform",
                        "visibility",
                        "zIndex",

                        // positional
                        "position",
                        "left",
                        "top",
                        "right",
                        "bottom",
                        "clear",
                        "float",
                        "display",

                        // metrics
                        "width",
                        "height",
                        "marginBottom",
                        "marginLeft",
                        "marginRight",
                        "marginTop",
                        "paddingBottom",
                        "paddingLeft",
                        "paddingRight",
                        "paddingTop"
                    ]
                },
                validProperty = false,
                settings = $.extend(true, {}, defaults, options);

            checkLists = function (string) {
                var valid = false,
                    inWhitelist = false,
                    inBlacklist = false;

                if (settings.whitelist && settings.whitelist.toString().search(string) !== -1) {
                    inWhitelist = true;
                }

                if (settings.blacklist && settings.blacklist.toString().search(string) !== -1) {
                    inBlacklist = true;
                }

                if (inWhitelist && !inBlacklist) {
                    valid = true;
                }

                return valid;
            };

            if (global.getComputedStyle) {
                camelize = function (a, b) {
                    return b.toUpperCase();
                };
                style = global.getComputedStyle(elem, null);
                for (i = 0; i < style.length; i = i + 1) {
                    prop = style[i];
                    camel = prop.replace(/\-([a-z])/g, camelize);
                    val = style.getPropertyValue(prop);
                    validProperty = checkLists(camel);
                    if (validProperty) {
                        returns[camel] = val;
                    }
                }
                return returns;
            }
            if (elem.currentStyle) {
                style = elem.currentStyle;
                for (prop in style) {
                    if (style.hasOwnProperty(prop)) {
                        validProperty = checkLists(prop);
                        if (validProperty) {
                            returns[prop] = style[prop];
                        }
                    }
                }
                return returns;
            }
        },
        /**
         * Returns the diffs for a fragment's computed styles compared to the given baseline
         *
         * @this {cssutils}
         * @param {element} rootElement The dom element to compare to the baseline styles object
         * @param {object} baselineStyleObjs The baseline styles object to compare against
         * @return {object} Diffs between fragment and baseline
         */
        compareFragment: function (rootElement, baselineStyleObjs) {
            var elems = this.getElements(rootElement),
                currentStyleObjs = this.getStyleObjects(elems),
                rootSelector = this.getSelector(rootElement),
                elem,
                current,
                baseline,
                diffs = [],
                diff,
                i,
                len = currentStyleObjs.length;

            for (i = 0; i < len; i = i + 1) {
                current = currentStyleObjs[i];
                baseline = baselineStyleObjs[i];

                elem = elems[i];

                diff = this.diffStyleObject(elem, baseline, current);
                if (diff.results) {
                    diff.rootSelector = rootSelector;
                    diffs.push(diff);
                }
            }

            return diffs;
        },
        /**
         * Returns the diffs for an element's computed styles now compared to the baseline
         *
         * @this {cssutils}
         * @param {element} elem The dom element
         * @param {object} before The computed style for the element baseline
         * @param {object} after The computed style for the element now
         * @return {object} Diffs between element and baseline
         */
        diffStyleObject: function (elem, before, after) {
            var selector = this.getSelector(elem),
                diff = {
                    selector: selector
                },
                prop;

            for (prop in before) {
                if (before.hasOwnProperty(prop)) {
                    if (before[prop] !== after[prop]) {
                        diff.results = diff.results || {};
                        diff.results[prop] = {
                            expected: before[prop],
                            actual: after[prop],
                            selector: selector
                        };
                    }
                }
            }

            return diff;
        },
        /**
         * Returns the selector string for the given element
         *
         * @param {element} elem The dom element to get the selector for
         * @return {string} CSS selector
         */
        getSelector: function (elem) {
            var tree = [],
                getEntry = function (el) {
                    var entry = el.tagName.toLowerCase(),
                        className;

                    if (el.id) {
                        entry += "#" + el.id;
                    } else if (el.className) {
                        className = el.className.replace(/[\s]{2,}/gi, " ");
                        className = className.replace(/ $/gi, "");
                        className = className.replace(/^ /gi, "");
                        entry += "." + className.replace(/ /g, '.');
                    }

                    return entry;
                };

            // add given element
            tree.push(getEntry(elem));

            // add all parents until reach html tag
            $(elem).parents().not('html').each(function (index, parentElem) {
                tree.push(getEntry(parentElem));
            });

            tree.reverse();

            return tree.join(" ");
        },
        /**
         * Returns the elements for the given fragment root element
         *
         * @param {element} elem The dom element
         * @return {array} Array of elements for the fragment
         */
        getElements: function (elem) {
            var elements = [elem],
                $children = $(elem).find("*");

            $children.each(function (index, el) {
                elements.push(el);
            });

            return elements;
        },
        /**
         * Returns a JSON string of the given computed style objects
         *
         * @param {element} objs The dom element
         * @return {string} JSON string of the given computed style object
         */
        printStyleObjects: function (objs) {
            return JSON.stringify(objs);
        },
        /**
         * Returns the HTML version of the diffs for a given fragment
         *
         * @this {cssutils}
         * @param {element} rootElement The dom element
         * @param {array} diffs Array of diffs
         * @return {string} HTML version of the diffs for a given fragment
         */
        getHtmlDiffs: function (rootElement, diffs) {

            var i,
                diffsLen = diffs.length,
                diff,
                prop,
                fragmentHTML = rootElement.outerHTML,
                diffArray = [],
                rootSelector = this.getSelector(rootElement);

            if (diffsLen > 0) {
                diffArray = [
                    '<div class="row-fluid">',
                    '<div class="span12">',
                    '<h2><a href="#" class="collapseControl" data-toggle="collapse" data-target=".testNumber-{{testNumber}}">Test url: "{{url}}" with selector: "{{rootSelector}}"</a></h2>',
                    '<div class="well">',
                    '<p>FAIL - <a href="#" class="collapseControl" data-toggle="collapse" data-target=".testNumber-{{testNumber}}">expand to see issues</a>.</p>',
                    '</div>',
                    '<div class="collapse testNumber-{{testNumber}}">',
                    '{{screenshots}}',
                    '<h3>HTML Fragment</h3>',
                    "<pre class='prettyprint linenums'>" + $('<div/>').text(fragmentHTML).html() + "</pre>",
                    '<h3>Diffs</h3>',
                    '<div class="well">',
                    '<ol>'
                ];
            } else {
                diffArray = [
                    '<div class="row-fluid">',
                    '<div class="span12">',
                    '<h2>Test url: "{{url}}" with selector: "{{rootSelector}}"</h2>',
                    '<div class="well">',
                    '<p>PASS - computed styles identical to the baseline.</p>',
                    '</div>'
                ];
            }

            for (i = 0; i < diffsLen; i = i + 1) {
                diff = diffs[i];
                diffArray.push('<li><p><strong>' + diff.selector + '</strong></p>');

                for (prop in diff.results) {
                    if (diff.results.hasOwnProperty(prop)) {
                        diffArray.push(
                            '<p>Property: ' + prop + '<br/>',
                            'Expected: ' + diff.results[prop].expected + '<br/>',
                            'Actual: ' + diff.results[prop].actual + '</p>'
                        );
                    }
                }

                diffArray.push('</li>');
            }

            if (diffsLen > 0) {
                diffArray.push(
                    '</ol></div>',
                    '<a href="#" class="collapseControl" data-toggle="collapse" data-target=".testNumber-{{testNumber}}">collapse</a>',
                    '</div></div></div>'
                );
            } else {
                diffArray.push('</div></div>');
            }

            return diffArray.join("");
        }
    };

    return module;
}(jQuery, window));