    //socket io 
    var socket = io();
    //sending a connection message
    socket.on('connect', function() {
        socket.send('The tips have been touched');
    });

    socket.on('message', message => console.log('[MESSAGE]: ' + message))

    //odrive stuff
    const odrive = io('/odrive');

    //message handler for odrive namespace
    odrive.on('message', message => console.log('[ODRIVE]: ' + message))
   
    document.getElementById('connect_odrive').addEventListener('click',() => odrive.emit('find_odrive'))
    document.getElementById('reboot_odrive').addEventListener('click',() => odrive.emit('reboot'))

    

