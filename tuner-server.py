from flask import Flask, render_template, request
from flask_socketio import SocketIO, send, emit
import odrive

app = Flask(__name__, static_url_path='')
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

od = None
#serving html
@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')

#handling messages
@socketio.on('message')
def print_message(message):
    print(f'[MESSAGE] {message}')


@socketio.on('find_odrive', namespace='/odrive')
def connect_odrive():
    global od
    if not od:
        print('[ODRIVE] Attempting Connection')
        od=odrive.find_any(timeout=15)
        if od: 
            print('[ODRIVE] Connection Success')
            send(f'Odrive {str(od.serial_number)} connected')
        else: 
            print('[ODRIVE] Connection Failure')
            send('No Odrive Found')
    else:
        print('[ODRIVE] Already Connected Sending Success')
        send('Odrive Already Connected')


@socketio.on('reboot', namespace='/odrive')
def connect_odrive():
    global od
    if od:
        print('[ODRIVE] Rebooting Odrive')
        try:
            od.reboot()
        except:
            pass
        od = None
        send('Odrive Rebooted')
    else:
        send('No Odrive Connected')
        









if __name__ == '__main__':
    print('[INFO] Starting server at http://localhost:6969')
    socketio.run(app=app, host='0.0.0.0', port=6969, debug=True)



