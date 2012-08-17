function PacketHandler(session) {
    this._session = session;
    this.name = "packet-handler";
}

PacketHandler.prototype.consume = function () {};

module.exports = PacketHandler;
