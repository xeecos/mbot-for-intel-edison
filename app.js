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

var express = require('express');
var app = express();
var http = require('http').Server(app);
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
