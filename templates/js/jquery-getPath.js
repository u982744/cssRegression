/*globals window, jQuery */
(function (global, $) {
    "use strict";

    $.fn.extend({
        getPath: function (path) {

            var parents = [];

            $(this).parents().not('html').each(function() {

                var entry = this.tagName.toLowerCase();

                if (this.className) {
                    entry += "." + this.className.replace(/ /g, '.');
                }

                parents.push(entry);
            });

            parents.reverse();

            alert(parents.join(" "));
        }
    });

}(window, jQuery));