const dgram = require('dgram');
const moment = require('moment');
const uuid = require('uuid');
const config = require('./config.json');
const instruments = require('./instruments.json');

const socket = dgram.createSocket('udp4');
const instrumentsMap = deserialize(instruments);
const appId = uuid.v4();
const sound = instrumentsMap.get(process.argv[2]);

function format() {
    var data = {
        "uuid": appId,
        "sound": sound,
        "timestamp": +moment()
    };

    return JSON.stringify(data);
}

function deserialize(all_instruments) {
    var result = new Map();
    
	all_instruments.forEach(function(inst){
        result.set(inst.name, inst.sound);
    });

    return result;
}

function emitSound() {
    var msg = new Buffer(format());
    socket.send(msg, 0, msg.length, config.udp_port, config.multicast_adr, function(err) {
      if (!err) {
          console.log("Sound sent successfully");
      }
      else {
		  console.log(err); 
      }
    });
}

setInterval(emitSound, config.interval);
