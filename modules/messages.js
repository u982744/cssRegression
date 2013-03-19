exports.help = {
    help: [
        "",
        "Usage:",
        "   casperjs cssRegression.js [--mode=basic|file|folder|help] [--setBaseline] [argument [argument [...]]]",
        "",
        "How To Guide",
        "  Overview",
        "   This tools is designed to regression test CSS computed styles. This will help you spot when",
        "   CSS or other changes affect the visual styling on your site.",
        "",
        "  Common Scenario",
        "   1. Write CSS for a fragment on a page until everyone is happy with how it looks visually.",
        "   2. Set a baseline for that fragment by running code as below.",
        "       casperjs cssRegression.js --mode=basic --setBaseline \"url\" \"cssSelector\"",
        "   3. Write more CSS for the site.",
        "   4. Regression test that your changes haven't broken the existing styling.",
        "       casperjs cssRegression.js --mode=basic \"url\" \"cssSelector\"",
        "   5. Review test results to check the changes haven't broken existing styling.",
        "",
        "  Setting Baselines",
        "   The idea behind this is when visual styling is correct for a fragment of a page you",
        "   save a baseline to use for future regression tests. If the baseline needs to change",
        "   simply set the baseline again before running regression tests.",
        "",
        "   To set a baseline use the flag --setBaseline",
        "",
        "  Running Regression Tests",
        "   After baselines have been saved using the --setBaseline flag you can run regression test(s)",
        "   at any time by ommitting the --setBaseline flag.",
        "",
        "",
        "Examples",
        "  Settings baseline(s):",
        "   casperjs cssRegression.js --mode=basic --setBaseline \"url\" \"cssSelector\"",
        "   casperjs cssRegression.js --mode=file --setBaseline testfilePath",
        "   casperjs cssRegression.js --mode=folder --setBaseline testFolderPath",
        "",
        "  Regression test against baseline(s):",
        "   casperjs cssRegression.js --mode=basic \"url\" \"cssSelector\"",
        "   casperjs cssRegression.js --mode=file testfilePath",
        "   casperjs cssRegression.js --mode=folder testFolderPath",
        "",
        "  Help:",
        "   casperjs cssRegression.js --mode=help",
        ""
    ].join("\n"),
    noTestConfigs: [
        '',
        'Test config files are defined in the commonJS module format.',
        'An example test config file is below.',
        '',
        'mytestconfig.js',
        '---------------',
        '// commonJS module format',
        '// see http://wiki.commonjs.org/wiki/Modules/1.1',
        'exports.testConfig = {',
        '    tests: [',
        '        {',
        '            url: "http://drupal.test.sbs.com.au/food/?mode=hires",',
        '            selectors: [',
        '                ".header",',
        '                ".region-menu",',
        '                "#feature",',
        '                "#main",',
        '                "#footer"',
        '            ]',
        '        }',
        '    ]',
        '};'
    ].join("\n")
};

exports.errors = {
    noTestConfigs: 'No test configs were found.',
    basic: "Please provide a url and css selector.",
    file: "Please provide a filePath.",
    folder: "Please provide a folderPath.",
    fileExist: function (path) {
        return this.exist(path, "file");
    },
    folderExist: function (path) {
        return this.exist(path, "folder");
    },
    exist: function (path, type) {
        return type.toUpperCase() + " doesn't exist: " + path;
    }
};