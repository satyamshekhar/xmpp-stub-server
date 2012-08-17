var PacketHandler = require("./packet-handler.js");
var $builder = require("../builder.js");
var util = require("util");
var log  = require("../log.js").getLogger("[auth.js]");

var START_WAIT = 0
AUTH_WAIT = 1,
RESTART_WAIT = 2,
BIND_WAIT = 3,
SESSION_WAIT = 4,
AUTHENTICATED = 5;

function Auth(session) {
    PacketHandler.apply(this, arguments);
    this._authenticated = false;
    this._state = START_WAIT;
    this.name = "auth";
    this._attachListeners();
};

Auth.prototype = new PacketHandler();

function sendAuthFeatures(client) {
    return function () {
        client._state = AUTH_WAIT;
        var features = $builder("stream:features")
            .cnode($builder("mechanisms", {
                "xmlns": "urn:ietf:params:xml:ns:xmpp-sasl"
            })).cnode($builder("mechanism", {}))
            .t("PLAIN-PW-TOKEN").tree();
        client._session._socket.write(features.toString());
    };
};

function sendBindFeatures(client) {
    return function () {
        client._state = BIND_WAIT;
        var features = $builder("stream:features")
            .cnode($builder("bind", {
                "xmlns": "urn:ietf:params:xml:ns:xmpp-bind"
            })).up()
            .cnode($builder("session", {
                "xmlns": "urn:ietf:params:xml:ns:xmpp-session"
            })).tree();
        client._session._socket.write(features.toString());
    };
};

function consumeStanza(client, stanza) {
    log.debug("consuming: %s, state: %s", stanza, client._state);
    switch (client._state) {
        case AUTHENTICATED:
            return;
        case AUTH_WAIT:
            var success = $builder("success", {
                "xmlns": "urn:ietf:params:xml:ns:xmpp-sasl"
            });
            client._session._socket.write(success.toString());
            client._state = RESTART_WAIT;
            break;
        case BIND_WAIT:
            stanza.attrs.type = "result";
            var bind = stanza.getChild("bind");
            var resource = bind.getChild("resource").getText();
            bind.remove(bind.getChild("resource"));
            bind.cnode($builder("jid", {}))
            .t(client._session._from + "/" + resource);
            client._session._socket.write(stanza.toString());
            client._state = SESSION_WAIT;
            break;
        case SESSION_WAIT:
            stanza.attrs.type = "result";
            stanza.children = [ ];
            client._session._socket.write(stanza.toString());
            client._state = AUTHENTICATED;
            break;
    }
    return false;
}

Auth.prototype._attachListeners = function () {
    this._session.on("stream-start", sendAuthFeatures(this));
    this._session.on("stream-restart", sendBindFeatures(this));
};

Auth.prototype.consume = function (stanza) {
    return consumeStanza(this, stanza);
};

module.exports = Auth;
