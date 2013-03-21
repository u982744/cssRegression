/*globals require, tmpb*/
(function () {

    "use strict";

    var casper = require('casper').create({
            clientScripts: [
                "tmpb.cssutils.js"
            ],
            viewportSize: {
                width: 1280,
                height: 1024
            }//,
            //verbose: true,
            //logLevel: "debug"
        }),
        utils = require("utils"),
        modeHelp = require("./modules/modeHelp").modeHelp,
        getTests = require("./modules/getTests"),
        messages = require("./modules/messages"),
        report = require("./modules/report"),
        fs = require("fs"),
        sanitise = require("./modules/tmpb.sanitise").sanitise,
        cloneObject = require("./modules/helpers").cloneObject,
        baselineDir = "baselines/",
        mode,
        isSetBaseline,
        logFolder,
        supportedModes = ["basic", "file", "folder", "help"],
        isModeSupported,
        errors = messages.errors,
        help = messages.help,
        testConfigs = [],
        cli = casper.cli,
        opts = cli.options,
        configSettings,
        testSettings,
        handleConfig,
        handleTest,
        setBaseline,
        compareBaseline,
        getSelectorStyles,
        resultsFilename,
        compareSelectorStyles,
        modes = {
            basic: {
                args: {
                    url: 0,
                    selector: 1
                },
                filename: function () {
                    return sanitise(cli.get(0)) + "___" + sanitise(cli.get(1)) + ".xml";
                }
            },
            file: {
                args: {
                    path: 0
                },
                filename: function () {
                    return sanitise(cli.get(0)) + ".xml";
                }
            },
            folder: {
                args: {
                    path: 0
                },
                filename: function () {
                    return sanitise(cli.get(0)) + ".xml";
                }
            }
        };

    /*
    casper.on("page.error", function(msg, trace) {
        this.echo("Error: " + msg, "ERROR");
    });
    */

    handleConfig = function (config, index) {
        var tests = config.tests;

        casper.then(function () {
            casper.echo("");

            if (config.file) {
                casper.echo('Run tests defined in config file "' + config.file + '"', "INFO");
            } else {
                casper.echo('Run basic test', "INFO");
            }

            casper.echo('');

            configSettings = config.settings || {};
            tests.forEach(handleTest);
        });
    };

    handleTest = function (test, index) {
        var url = test.url,
            selectors = test.selectors || [],
            testResults,
            clonedConfigSelectors = cloneObject(configSettings.selectors || []),
            clonedConfigSettings = cloneObject(configSettings),
            mergedSettings,
            mergedSelectors,
            diffs;

        testSettings = test.settings || {};
        mergedSelectors = selectors.concat(clonedConfigSelectors);
        mergedSelectors = utils.unique(mergedSelectors);
        mergedSettings = utils.mergeObjects(clonedConfigSettings, testSettings);

        casper.then(function () {
            casper.echo("--------------------", "INFO");
            casper.echo("Open URL:", "INFO");
            casper.echo(url);
            casper.open(url);
        });

        casper.then(function () {
            casper.echo("");
            casper.echo("Apply settings:", "INFO");
            if (mergedSettings.viewportSize) {
                casper.echo("Change viewportSize to: " + mergedSettings.viewportSize.width + "x" + mergedSettings.viewportSize.height);
                casper.viewport(mergedSettings.viewportSize.width, mergedSettings.viewportSize.height);
            }

            if (mergedSettings.setup) {
                casper.echo("Run setup method...");
                casper.evaluate(mergedSettings.setup);
            }

            casper.echo("");
        });

        casper.then(function () {
            if (isSetBaseline) {
                setBaseline(url, mergedSelectors, mergedSettings);
            } else {
                compareBaseline(url, mergedSelectors, mergedSettings);
            }
        });
    };

    setBaseline = function (url, selectors, settings) {
        var selectorsLen = selectors.length,
            selector,
            i,
            urlName = sanitise(url),
            selectorName,
            currentBaselineDir,
            currentStyles,
            folderDir;

        casper.then(function () {
            casper.echo("Selectors:", "INFO");
            casper.echo(selectors);
            for (i = 0; i < selectorsLen; i = i + 1) {
                selector = selectors[i];

                selectorName = sanitise(selector);
                folderDir = urlName + "___" + selectorName + "/";
                currentBaselineDir = baselineDir + folderDir;

                currentStyles = getSelectorStyles(selector, settings);

                // save baseline to filesystem
                casper.captureSelector(currentBaselineDir + "screenshot-baseline.png", selector);
                fs.write(currentBaselineDir + "computedStyle-baseline.txt", JSON.stringify(currentStyles), "w");
            }
            casper.echo("--------------------", "INFO");
            casper.echo("");
            casper.echo("");
        });
    };

    compareBaseline = function (url, selectors, settings) {
        var selectorsLen = selectors.length,
            selector,
            i,
            urlName = sanitise(url),
            selectorName,
            currentBaselineDir,
            baselineStyles,
            baselineElementCount,
            currentElementCount,
            diffsStyles,
            folderDir,
            rootElement,
            baselineExists,
            diffs;

        casper.then(function () {
            casper.echo("Test selectors: " + selectors, "INFO");
            for (i = 0; i < selectorsLen; i = i + 1) {
                selector = selectors[i];

                selectorName = sanitise(selector);
                folderDir = urlName + "___" + selectorName + "/";
                currentBaselineDir = baselineDir + folderDir;

                baselineExists = fs.isFile(currentBaselineDir + "computedStyle-baseline.txt");

                casper.test.assert(baselineExists, 'Baseline exists for fragment at URL: "' + url + '" with selector: "' + selector + '" to regression test against.');

                if (baselineExists) {
                    baselineStyles = JSON.parse(fs.read(currentBaselineDir + "computedStyle-baseline.txt"));
                    baselineElementCount = baselineStyles.length;
                    diffsStyles = compareSelectorStyles(selector, baselineStyles, settings);

                    // save current to filesystem
                    casper.captureSelector(currentBaselineDir + "screenshot-current.png", selector);

                    casper.test.assertEquals(diffsStyles.elementCount, baselineElementCount, 'Check DOM structure for fragment at URL: "' + url + '" at selector: "' + selector + '" is identical to baseline.', "Current element count was " + diffsStyles.elementCount + ", baseline count is " + baselineElementCount + ".");

                    if (diffsStyles.elementCount === baselineElementCount) {
                        casper.test.assertEquals(diffsStyles.diffs, [], 'Check computed styles for fragment at URL: "' + url + '" at selector "' + selector + '" are identical to baseline.', "Click to view error details.", urlName + "___" + selectorName + ".html");
                    }
                }
            }
            casper.echo("--------------------", "INFO");
            casper.echo("");
            casper.echo("");
        });
    };

    getSelectorStyles = function (cssSelector, options) {
        var styles;

        styles = casper.evaluate(function (selector, opts) {
            var rootElement = __utils__.findOne(selector),
                elems,
                styleObjects,
                returnData = {};

            if (!rootElement) {
                returnData = false;
            } else {
                elems = tmpb.cssutils.getElements(rootElement);
                styleObjects = tmpb.cssutils.getStyleObjects(elems, opts);
                returnData = styleObjects;
            }

            return returnData;
        }, cssSelector, options);

        return styles;
    };

    compareSelectorStyles = function (cssSelector, baselineStyles, options) {
        var diffs;

        diffs = casper.evaluate(function (selector, styles, opts) {
            var rootElement = __utils__.findOne(selector),
                elems,
                returnData = {},
                mydiffs;

            if (!rootElement) {
                returnData = false;
            } else {
                elems = tmpb.cssutils.getElements(rootElement);
                mydiffs = tmpb.cssutils.compareFragment(rootElement, styles, opts);
                returnData.diffs = mydiffs;
                returnData.elementCount = elems.length;
            }

            return returnData;
        }, cssSelector, baselineStyles, options);

        return diffs;
    };

    mode = (opts.mode && opts.mode !== true) ? opts.mode : "file";
    logFolder = (opts.log && opts.log !== true) ? opts.log : "";
    mode = mode.toLowerCase();
    isSetBaseline = (opts.setBaseline) ? true : false;

    //console.log(utils.dump(cli.args));
    //console.log(utils.dump(cli.options));

    isModeSupported = (supportedModes.toString().indexOf(mode) !== -1) ? true : false;

    if (!isModeSupported) {
        casper.echo("You have provided an unsupported mode. Please read the usage instructions below.");
        mode = "help";
    }

    if (mode === "help") {
        casper.echo(help.help);
        casper.exit();
    }

    if (mode === "basic" && !cli.has(1)) {
        modeHelp(mode, modes);
        casper.exit();
    }

    if ((mode === "file" || mode === "folder") && !cli.has(0)) {
        modeHelp(mode, modes);
        casper.exit();
    }

    if (isSetBaseline) {
        casper.echo("SET BASELINE MODE", "INFO");
    } else {
        casper.echo("COMPARE BASELINE MODE", "INFO");
        logFolder = (logFolder[logFolder.length - 1] === "/") ? logFolder : logFolder + "/";
        resultsFilename = logFolder + "testResults/" + mode + "/" + modes[mode].filename();
    }

    testConfigs = getTests[mode](mode, modes);
    if (testConfigs.length === 0) {
        casper.echo(errors.noTestConfigs, "ERROR");
        casper.echo(help.noTestConfigs);
        casper.exit();
    }

    casper.start();

    casper.then(function () {
        this.echo("Got test configs, ok to start", "INFO");
        testConfigs.forEach(handleConfig);
    });

    casper.run(function () {
        if (!isSetBaseline) {

            // use failures data to generate HTML report later as an enhancement
            // utils.dump(casper.test.getFailures());

            casper.echo(resultsFilename);
            this.test.renderResults(false, 0, cli.get('save') || false);

            casper.echo("");
            casper.echo("COMPARE BASELINE COMPLETE", "INFO");
        } else {
            casper.echo("SET BASELINE COMPLETE", "INFO");
        }
        this.exit();
    });

}());