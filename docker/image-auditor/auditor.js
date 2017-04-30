const dgram = require('dgram');
const moment = require('moment');

const net = require('net');
const configuration = require('./config.json');
const instruments = require('./instruments.json');

const socket = dgram.createSocket('udp4');
const server = net.createServer();

const soundMap = deserialize(instruments);
var music = new Map();

function deserialize(all_instruments) {
    var result = new Map();
    
	all_instruments.forEach(function(inst){
        result.set(inst.sound, inst.name);
    });

    return result;
}

function removeIfNotPlaying() {
    music.forEach(function(sound) {
        if (+moment() - sound.timestamp >= configuration.inactive_delay) {
            music.delete(sound.uuid);
        }
    });
}

function payload() {
    removeIfNotPlaying();
    var result = [];
    
	music.forEach(function(sound, uuid) {
        var inst = {
            "uuid": uuid,
            "instrument": soundMap.get(sound.sound),
            "activeSince": moment(sound.timestamp).toISOString()
        }
        result.push(inst);
    });
	
    return JSON.stringify(result);
}

/* LISTENERS - TOOK IT FROM STACKOVERFLOW */
socket.on('listening', function() {
    socket.addMembership(configuration.multicast_adr);
    console.log("Now listening for UDP trafic on %s:%d", configuration.multicast_adr, configuration.udp_port);
});

socket.on('message', function(msg, info) {
  console.log('Heard something from %s:%d', info.address, info.port);
  var data = JSON.parse(msg);

  music.set(data.uuid, data);
});

server.on('listening', function() {
    console.log("Now listening for TCP trafic on %s:%d", server.address().address, configuration.tcp_port);
});

server.on('connection', function(socket) {
    socket.end(payload());
    console.log("Payload sent to %s:%d", socket.remoteAddress, socket.remotePort);
});

/* Main */
socket.bind(configuration.udp_port);
server.listen(configuration.tcp_port);
