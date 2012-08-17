var PacketHandler = require("./packet-handler.js");
var $builder = require("../builder.js");
function Presence (session) {
    PacketHandler.apply(this, arguments)
    this.name = "presence";
    this._presenceCount = 50;
};
Presence.prototype = new PacketHandler();

Presence.prototype._getPresences = function () {
    var presences = [];
    for (var i = 1; i <= this._presenceCount; i++) {
        var show = $builder("show").t("busy");
        var status = $builder("status").t("testing");
        presences.push(
            $builder.presence({
                from: i + "@load.com",
                to: this._session._from
            }).cnode(show).up().cnode(status).tree()
        );
    }
    return presences;
};

Presence.prototype.consume = function (stanza) {
    var sendPresence = false;
    if (stanza.is("session")) {
        if (stanza.attrs.presence) {
            this._presenceCount = Math.floor(stanza.attrs.presence);
        }
        sendPresence = true;
    } else if (stanza.is("presence")) {
        sendPresence = true;
    }

    if (sendPresence) {
        var presences = this._getPresences();
        for (var i = 0, l = presences.length; i < l; i++) {
            this._session._socket.write(presences[i].toString());
        }
    }
};

module.exports = Presence;
