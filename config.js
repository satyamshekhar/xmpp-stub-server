exports.config = {
    port: 5222
};

exports.packetHandlers = [
    require("./packet-handler/auth.js"),
    require("./packet-handler/roster.js"),
    require("./packet-handler/presence.js"),
    require("./packet-handler/message.js")
];
