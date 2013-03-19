var casper = require('casper').create(),
    messagesModule = require("messages"),
	errors = messagesModule.errors,
	messages = messagesModule.help;

exports.modeHelp = function (modeName, modesConfig) {
	casper.echo((modeName + " mode").toUpperCase(), "RED_BAR");
    casper.echo("");
    casper.echo(errors[modeName], "INFO");
    casper.echo(messages.help);
};