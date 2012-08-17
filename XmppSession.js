var util          = require("util");
var $builder      = require("./builder.js");
var XmppParser    = require("./stream-parser.js");
var EventEmitter  = require("events").EventEmitter;
var log           = require("./log.js").getLogger("[XmppSession.js]");
var packetHandler = require("./config.js").packetHandlers;

function XmppSession (socket) {
    EventEmitter.apply(this);
    this.id      = "nothing";
    this._socket = socket;
    this._parser = new XmppParser();
    this._attachListenersToParser();
    var self = this;
    this._socket.on("data", function (d) {
        log.debug("RECV: %s", d);
        self._parser.parse(d);
    });
    this._packetHandlers = [ ];
    for (var i = 0, l = packetHandler.length; i < l; i++) {
        this._packetHandlers.push(new packetHandler[i](this));
    }

    /* default config */
    this._load = 1;
    this._message = 4;
};
util.inherits(XmppSession, EventEmitter);

XmppSession.prototype.terminate = function (error) {
    log.info("%s terminate %s", this.id, error);
    this.emit("terminate");
    this._socket.end();
    this._parser.end();
};

XmppSession.prototype._attachListenersToParser = function () {
    this._parser.on("error", this.terminate.bind(this));
    this._parser.on("stanza", this._handleStanza.bind(this));
    this._parser.on("stream-end", this._handleStreamEnd.bind(this));
    this._parser.on("stream-start", this._handleStreamStart.bind(this));
    this._parser.on("stream-restart", this._handleStreamRestart.bind(this));
};

XmppSession.prototype._handleStanza = function (stanza) {
    log.info("stanza: %s", stanza);
    this.emit("stanza",  stanza);
    for (var i = 0, l = this._packetHandlers.length; i < l; i++) {
        log.debug("executing: %s", this._packetHandlers[i].name);
        if (this._packetHandlers[i].consume(stanza) === false) {
            return;
        }
    }
};

XmppSession.prototype._handleStreamRestart = function (attrs) {
    log.info("%s stream-restart", this.id);

    attrs.from = attrs.to;
    delete attrs.to;
    delete attrs["x:user-jid"];

    var start = $builder("stream:stream", attrs);

    this._socket.write(start.toString().replace("/>", ">"));

    this.emit("stream-restart", attrs);
};

XmppSession.prototype._handleStreamStart = function (attr) {
    log.info("%s stream-start", this.id);

    if (!attr.from) {
        attr.from = attr['x:user-jid'];
    }
    if (!attr.from) {
        this.terminate("no from");
        return;
    }
    // log.info("stream-start %s", util.inspect(attr));
    this.id = attr.from;
    this._from = attr.from;

    attr.from = attr.to;
    delete attr.to;
    delete attr["x:user-jid"];

    var start = $builder("stream:stream", attr);
    this._socket.write(start.toString().replace("/>", ">"));
    this.emit("stream-start", attr);
};

XmppSession.prototype._handleStreamEnd = function () {
    this.emit("stream-end", {});
    log.info("%s stream-end", this.id);
};

module.exports = XmppSession;
