from flask import Flask, render_template, request
from flask_socketio import SocketIO, send, emit
import odrive
import json

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
def reboot():
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
        
@socketio.on('erase_config', namespace='/odrive')
def connect_odrive():
    global od
    if od:
        print('[ODRIVE] Erasing Odrive')
        try:
            od.erase_configuration()
        except:
            pass
        od = None
        send('Odrive Erased')
    else:
        send('No Odrive Connected')



@socketio.on('read_voltage', namespace='/odrive')
def read_voltage():
    global od
    if od:
        emit('disp_voltage', str('%.3f'%(od.vbus_voltage)))

@socketio.on('set_config', namespace='/odrive')
def set_config(config_data):
    od.axis0.motor.config.current_lim = config_data['current_lim']
    od.axis0.controller.config.vel_limit = config_data['vel_lim'] 
    od.config.brake_resistance = config_data['brake_resistance']
    od.axis0.motor.config.pole_pairs = config_data['pole_pairs']
    od.axis0.motor.config.torque_constant = config_data['torque_constant']
    od.axis0.motor.config.motor_type = config_data['motor_type']

    od.save_configuration()
    send('Set Config and Saved, Rebooting and Reconnecting')
    
    reboot()
    connect_odrive()

@socketio.on('set_gains', namespace='/odrive')
def set_gains(data):
    od.axis0.controller.config.pos_gain = data['pos_gain']
    od.axis0.controller.config.vel_gain = data['vel_gain']
    od.axis0.controller.config.vel_integrator_gain = data['vel_integrator_gain']
    send('Set Gains')

@socketio.on('get_config', namespace='/odrive')
def get_config():
    emit('disp_config', {
            'current_lim' : od.axis0.motor.config.current_lim,
            'vel_lim' : od.axis0.controller.config.vel_limit,
            'pole_pairs': od.axis0.motor.config.pole_pairs,
            'brake_resistance': od.config.brake_resistance,
            'torque_constant': od.axis0.motor.config.torque_constant,
            'motor_type': od.axis0.motor.config.motor_type,
            'cpr': od.axis0.encoder.config.cpr
            }   
        )

@socketio.on('get_gains', namespace='/odrive')
def get_gains():
    emit('disp_gains', {
            'pos_gain' : od.axis0.controller.config.pos_gain,
            'vel_gain' : od.axis0.controller.config.vel_gain,
            'vel_integrator_gain': od.axis0.controller.config.vel_integrator_gain

            }   
        )





if __name__ == '__main__':
    print('[INFO] Starting server at http://localhost:6969')
    socketio.run(app=app, host='0.0.0.0', port=6969, debug=True)



