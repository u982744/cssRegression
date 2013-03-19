var messagesModule = require("messages"),
	fs = require("fs"),
	errors = messagesModule.errors,
	casper = require('casper').create(),
	cli = casper.cli;

exports.basic = function (mode, modes) {
    var url = cli.get(modes[mode].args.url),
        selector = cli.get(modes[mode].args.selector),
        testConfigs = [
            {
                tests: [
                    {
                        "url": url,
                        "selectors": [selector]
                    }
                ]
            }
        ];

    return testConfigs;
};

exports.file = function (mode, modes) {
    var path = cli.get(modes[mode].args.path),
        files,
        testConfigs = [];

    if (!fs.isFile(path)) {
        casper.echo(errors.fileExist(path), "ERROR");
        return testConfigs;
    }

    files = [path];
    testConfigs = this.getTestConfigs(files);

    return testConfigs;
};

exports.folder = function (mode, modes) {
    var path = cli.get(modes[mode].args.path),
        list,
        files = [],
        testConfigs = [];

    // force trailing "/"
    path = (path[path.length - 1] === "/") ? path : path + "/";

    if (!fs.isDirectory(path)) {
        casper.echo(errors.folderExist(path), "ERROR");
        return testConfigs;
    }

    list = fs.list(path);

    list.forEach(function (file, index) {
        if (fs.isFile(path + file)) {
            files.push(path + file);
        }
    });

    testConfigs = exports.getTestConfigs(files);

    return testConfigs;
};

exports.getTestConfigs = function (files) {
    var moduleId,
        testConfig,
        testConfigs = [];

    files.forEach(function (file, index) {
        if (fs.isFile(file)) {
            moduleId = "./" + file.replace(/\.[\w\d]+$/gi, "");
            testConfig = require(moduleId).testConfig;
            testConfig.file = file;
            testConfigs.push(testConfig);
        }
    });

    return testConfigs;
};
