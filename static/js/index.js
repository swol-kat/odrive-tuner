    //overwriting console.log to have in browser log 
    (function () {
        if (!console) {
            console = {};
        }
        var old = console.log;
        var logger = document.getElementById('log');
        console.log = function (message) {
            if (typeof message == 'object') {
                logger.innerHTML += (JSON && JSON.stringify ? JSON.stringify(message) : String(message)) + '<br />';
            } else {
                logger.innerHTML += message + '<br />';
            }
            logger.scrollTop = logger.scrollHeight;
        }
    })();
    
    
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
    document.getElementById('erase_config').addEventListener('click',() => odrive.emit('erase_config'))

    odrive.on('disp_voltage', message => document.getElementById('voltage_disp').innerHTML = message + ' V' )
