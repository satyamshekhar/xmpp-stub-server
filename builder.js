var ltx = require("ltx");

var builder = function (name, attrs) {
    return new ltx.Element(name, attrs);
};

builder.iq = function (attrs) {
    attrs = attrs || {};
    return new ltx.Element("iq", attrs);
};

builder.message = function (attrs) {
    attrs = attrs || {};
    return new ltx.Element("message", attrs);
};

builder.presence = function (attrs) {
    attrs = attrs || {};
    return new ltx.Element("presence", attrs);
};

module.exports = builder;
