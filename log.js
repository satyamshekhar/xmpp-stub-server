var log4js = require("log4js");

log4js.configure({
    doNotReplaceConsole: true
});

var appender = log4js.appenders.console(log4js.layouts.basicLayout);
log4js.clearAppenders();
log4js.addAppender(appender);
log4js.setGlobalLogLevel("TRACE");

var setLogLevel = function (level) {
    log4js.setGlobalLogLevel(level);
};

module.exports = log4js;
module.exports.setLogLevel = setLogLevel;
