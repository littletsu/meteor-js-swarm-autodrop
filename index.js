
const Net = require('net');
const fs = require('fs');

const port = Number(process.argv[3]) || 7777;


const tserver = new Net.Server();

const blocks = fs.readFileSync('./blocks.txt', {'encoding': 'utf-8'}).split('\r\n').map(cmd => `drop minecraft:${cmd}`);
console.log(`Read ${blocks.join(', ')}`)

tserver.listen(port, function() {
    console.log(`Swarm host listening for connection requests on localhost:${port}`);
});

let clients = [];

const createCommandBuffer = cmd => Buffer.concat(
    [
        Buffer.from([0, cmd.length]), 
        Buffer.from(cmd, 'utf-8')
    ]
);

const broadcastCmds = cmds => clients.filter(client => client.opened).forEach(client => client.sendCmds(cmds));

tserver.on('connection', function(socket) {
    console.log('A new connection has been established.');

    socket.opened = true;
    socket.on('data', function(chunk) {
        console.log(`Data received from client: ${chunk.toString()}`);
    });


    socket.on('end', function() {
        console.log('A connection was closed.');
        socket.opened = false;
    });


    socket.on('error', function(err) {
        console.log(`Error: ${err}`);
        socket.opened = false;
    });
	
	
    socket.sendCmds = cmds => cmds.forEach(cmd => socket.write(createCommandBuffer(cmd)));
	
    clients.push(socket)
});


setInterval(() => {
    broadcastCmds(blocks);
    console.log('Broadcast drop');
}, 5000)


