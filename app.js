var SerialPort = require("serialport").SerialPort;  
var port = "/dev/ttyMFD1";  
var serial = new SerialPort(port, {  
  baudrate: 38400      
}, false); 
console.log("Open port: "+ port);  
serial.open(function (error) {  
  if (error) {  
    console.log('Failed to open: '+error);  
  } else {  
    console.log('open');  
    serial.on('data', function(data) {  
      //console.log('data received: ' + data);  
		for(var i =0;i<sockets.length;i++){
			sockets[i].emit('message',data);
		}
    });
  }	
});
var childProcess = require('child_process');
var morgan = require('morgan')
var ws = require('ws');
                              
var sleep = require('sleep');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var httpVideo = require('http')
var io= require('socket.io')(http)
var sockets = [];
var buffers = [];
io.on('connection', function (socket) {  
  sockets.push(socket);
  socket.on('message', function (data) {
    var buffer = data.split(" "); 
	for(var i=0;i<buffer.length;i++){
		buffer[i] = buffer[i]*1;
	}
	buffers.push(new Buffer(buffer));
  });
});  
function sendSerial(){
	if(buffers.length>0){
		serial.write(buffers[0]);
		buffers.shift();
	}
	setTimeout(sendSerial,60);
}
sendSerial();
app.use('/', express.static('public'));

http.listen(3000, function(){
  console.log('listening on *:3000');
});

var STREAM_MAGIC_BYTES = 'jsmp'; // Must be 4 bytes
var width = 320;
var height = 240;

// WebSocket server
var wsServer = new (ws.Server)({ port: 8084 });
console.log('WebSocket server listening on port 8084');

wsServer.on('connection', function(socket) {
  // Send magic bytes and video size to the newly connected socket
  // struct { char magic[4]; unsigned short width, height;}
  var streamHeader = new Buffer(8);

  streamHeader.write(STREAM_MAGIC_BYTES);
  streamHeader.writeUInt16BE(width, 4);
  streamHeader.writeUInt16BE(height, 6);
  socket.send(streamHeader, { binary: true });

  console.log('New WebSocket Connection (' + wsServer.clients.length + ' total)');

  socket.on('close', function(code, message){
    console.log('Disconnected WebSocket (' + wsServer.clients.length + ' total)');
  });
});

wsServer.broadcast = function(data, opts) {
  for(var i in this.clients) {
    if(this.clients[i].readyState == 1) {
      this.clients[i].send(data, opts);
    }
    else {
      console.log('Error: Client (' + i + ') not connected.');
    }
  }
};
function resetStream(){
	childProcess.exec('kill $(pidof ffmpeg)');
  childProcess.exec('~/mblockly/bin/do_ffmpeg.sh');
};
// HTTP server to accept incoming MPEG1 stream
httpVideo.createServer(function (req, res) {
  console.log(
    'Stream Connected: ' + req.socket.remoteAddress +
    ':' + req.socket.remotePort + ' size: ' + width + 'x' + height
  );

  req.on('data', function (data) {
    wsServer.broadcast(data, { binary: true });
  });
}).listen(8082, function () {
  console.log('Listening for video stream on port 8082');

childProcess.exec('kill $(pidof ffmpeg)');
sleep.sleep(1);
  // Run do_ffmpeg.sh from node                                                   
  childProcess.exec('/home/root/mblockly/bin/do_ffmpeg.sh');
});
