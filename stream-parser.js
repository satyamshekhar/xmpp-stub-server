var ltx    = require('ltx');
var util   = require('util');
var events = require('events');
var expat  = require('node-expat');

function XmppStreamParser() {
    events.EventEmitter.apply(this);

    this.__defineGetter__("getCurrentByteIndex", function () {
        if (!this._parser) return 0;
        else return this._parser.getCurrentByteIndex();
    });

    this._start();
}

util.inherits(XmppStreamParser, events.EventEmitter);

XmppStreamParser.prototype._handle_start_element = function(name, attrs) {
    if (!this._started) {
        if (name === "stream:stream") {
            this._started = true;
            this.emit("stream-start", attrs);
        } else {
            this.emit("error", "stanza w/o stream-start");
            this.end();
        }
    } else {
        var stanza = new ltx.Element(name, attrs);
        if (name === "stream:stream") {
            this.emit("stream-restart", attrs, stanza);
        } else {
            if (this.stanza) {
                this.stanza = this.stanza.cnode(stanza);
            } else {
                this.stanza = stanza;
            }
        }
    }
};

XmppStreamParser.prototype._handle_end_element = function(name, attrs) {
    if (name === "stream:stream") {
        this.emit("stream-end", attrs);
        this.end();
        return;
    }

    if (this.stanza && this.stanza.parent) {
        this.stanza = this.stanza.parent;
    } else if (this.stanza) {
        this.emit("stanza", this.stanza);
        delete this.stanza;
    } else {
        // this happens some-times.
        this.emit("error", "end-element w/o start");
        this.end();
    }
};

XmppStreamParser.prototype._handle_text = function(txt) {
    // top level text nodes are
    // ignored. (not valid in xmpp).
    if (this.stanza) {
        this.stanza.t(txt);
    }
};

XmppStreamParser.prototype._handle_entity_decl = function() {
    this.emit("error", "entity-decl-not-allowed");
    this.end();
};

XmppStreamParser.prototype.parse = function(data) {
    if (this._parser && !this._parser.parse(data)) {
        // in case the parser is deleted on end-stream
        // and there is garbage after that.
        if (this._parser) {
            this.emit("error", this._parser.getError());
        }
    }
};

XmppStreamParser.prototype._start = function () {
    this._parser = new expat.Parser('UTF-8');
    this._started = this._started || false;

    this._parser.on("text", this._handle_text.bind(this));
    this._parser.on("endElement", this._handle_end_element.bind(this));
    this._parser.on("entityDecl", this._handle_entity_decl.bind(this));
    this._parser.on("startElement", this._handle_start_element.bind(this));
};

XmppStreamParser.prototype.end = function() {
    if (this._parser) {
        this._parser.stop();
        this._parser.removeAllListeners();
        delete this._parser;
    }
};

XmppStreamParser.prototype.restart = function() {
    this.end();
    this._start();
};

module.exports = XmppStreamParser;
