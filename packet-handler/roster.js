var PacketHandler = require("./packet-handler.js");
var $builder = require("../builder.js");
var util = require("util");

function Roster (session) {
    PacketHandler.apply(this, arguments);
    this.name = "roster";
    this._rosterSize = 100;
};

Roster.prototype = new PacketHandler();

Roster.prototype._makeRoster = function () {
    var query = $builder("iq", {
        type: "result",
        to: this._session._from
    }).cnode($builder("query", {
        xmlns: "jabber:iq:roster"
    }));
    for (var i = 1; i <= this._rosterSize; i++) {
        query.cnode(
            $builder("item", {
                "jid": i + "name,size" + this._rosterSize + "@load.com",
                "name": i + "name lastname",
                "subscription": "both"
            }).cnode(
                $builder("group").t("Load Test")
            ).root()
        );
    }
    return query.root();
};

Roster.prototype.consume = function (stanza) {
    var sendRoster = false;
    if (stanza.is("session")) {
        if (stanza.attrs.roster) {
            this._rosterSize = Math.floor(stanza.attrs.roster);
        }
        sendRoster = true;
    } else if (stanza.is("roster")){
        sendRoster = true;
    }
    if (sendRoster) {
        var roster = this._makeRoster();
        this._session._socket.write(roster.toString());
    }
};

module.exports = Roster;
