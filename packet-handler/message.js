var PacketHandler = require("./packet-handler.js");
var $builder = require("../builder.js");
function Message (session) {
    PacketHandler.apply(this, arguments);
    this._load     = 1;
    this._message  = 4;
    this._intervals = [ ];
    this.name = "message";
    this._session.on("terminate", this._clearIntervals.bind(this));
};

Message.prototype = new PacketHandler();

Message.prototype._clearIntervals = function () {
    this._intervals.forEach(function (interval){
        clearTimeout(interval);
    });
};

Message.prototype._reconfigure = function () {
    this._clearIntervals();
    for (var i = 0; i < this._message; i++) {
        var time = Math.floor(Math.random() * 100) % 60;
        console.log("time: %s", time);
        var timeout = setTimeout(function () {
            var message = $builder.message({
                from: "loadgenerator@test.com",
                to: "user-test@test.com"
            }).t("Some Message");
            this._session._socket.write(message.toString());
        }.bind(this), time * 1000);
        this._intervals.push(timeout);
    }
    this._intervals.push(setTimeout(this._reconfigure.bind(this), 60 * 1000));
};

Message.prototype._sendLoad = function (stanza) {
    for (var i = 0; i < this._load; i++) {
        this._session._socket.write(stanza.toString());
    }
};

Message.prototype.consume = function (stanza) {
    if (stanza.is("session")) {
        if (stanza.attrs.load) {
            this._load = Math.floor(stanza.attrs.load);
        }
        if (stanza.attrs.message) {
            this._message = Math.floor(stanza.attrs.message);
        }
        this._reconfigure();
    }
    else {
        this._sendLoad(stanza);
    }
};

module.exports = Message;
