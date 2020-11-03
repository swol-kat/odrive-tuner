from flask import Flask, render_template, request
from flask_socketio import SocketIO, send, emit
import odrive
from helper.utils import dump_errors
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

@socketio.on('clear_errors', namespace='/odrive')
def clear_errors():
    global od
    if od:
        print('[ODRIVE] Clearing Errors on axis0 Odrive')
        try:
            od.axis0.clear_errors()
        except:
            pass
        send('Cleared Errors')
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


@socketio.on('read_voltage', namespace='/odrive')
def read_voltage():
    global od
    if od:
        emit('disp_voltage', str('%.3f'%(od.vbus_voltage)))




@socketio.on('set_config', namespace='/odrive')
def set_config(config_data):
    global od
    if od:
        od.axis0.motor.config.current_lim = config_data['current_lim']
        od.axis0.controller.config.vel_limit = config_data['vel_lim'] 
        od.config.brake_resistance = config_data['brake_resistance']
        od.axis0.motor.config.pole_pairs = config_data['pole_pairs']
        od.axis0.motor.config.torque_constant = config_data['torque_constant']
        od.axis0.motor.config.motor_type = config_data['motor_type']
        od.axis0.encoder.config.cpr = config_data['cpr']


        od.save_configuration()
        send('Set Config and Saved, Rebooting and Reconnecting')
        reboot()
        connect_odrive()
        

@socketio.on('set_gains', namespace='/odrive')
def set_gains(data):
    global od
    if od:
        od.axis0.controller.config.pos_gain = data['pos_gain']
        od.axis0.controller.config.vel_gain = data['vel_gain']
        od.axis0.controller.config.vel_integrator_gain = data['vel_integrator_gain']
        send('Set Gains')



@socketio.on('set_inputs', namespace='/odrive')
def set_inputs(data):
    global od
    if od:
        od.axis0.controller.input_pos = data['input_pos']
        od.axis0.controller.input_vel = data['input_vel']
        od.axis0.controller.input_torque = data['input_torque']

@socketio.on('get_config', namespace='/odrive')
def get_config():
    global od
    if od:
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
    global od
    if od:
        emit('disp_gains', {
                'pos_gain' : od.axis0.controller.config.pos_gain,
                'vel_gain' : od.axis0.controller.config.vel_gain,
                'vel_integrator_gain': od.axis0.controller.config.vel_integrator_gain

                }   
            )

@socketio.on('get_enc_count', namespace='/odrive')
def get_encoder_count():
    global od
    if od:
        emit('disp_enc_count', od.axis0.encoder.shadow_count)

@socketio.on('get_errors', namespace='/odrive')
def get_gains():
    global od
    if od:
        emit('disp_errors', dump_errors(od))

@socketio.on('get_states', namespace='/odrive')
def get_state():
    global od
    if od:
        packet = {
            'axis_state' : od.axis0.current_state,
            'controller_control_mode' : od.axis0.controller.config.control_mode 

        }
        emit('disp_states',packet)


@socketio.on('get_inputs', namespace='/odrive')
def get_inputs():
    global od
    if od:
        packet = {
            'input_pos': od.axis0.controller.input_pos,
            'input_vel': od.axis0.controller.input_vel,
            'input_torque': od.axis0.controller.input_torque
        }
        emit('disp_inputs', packet)

@socketio.on('set_axis_state', namespace='/odrive')
def set_axis_state(state):
    global od
    if od:
        print(f'[ODRIVE] set axis state to : {state}')
        od.axis0.requested_state = state



@socketio.on('set_controller_state', namespace='/odrive')
def set_controller_state(state):
    global od
    if od:
        print(f'[ODRIVE] set controller state to : {state}')
        od.axis0.controller.config.control_mode = state

@socketio.on('get_graph_data', namespace='/odrive')
def get_data():
    global od
    if od:
        packet = {
            'pos_data': {
                'current': od.axis0.encoder.pos_estimate,
                'setpoint': od.axis0.controller.pos_setpoint
            },
            'vel_data': {
                'current': od.axis0.encoder.vel_estimate,
                'setpoint': od.axis0.controller.vel_setpoint
            },
            'cur_data': {
                'current': od.axis0.motor.current_control.Iq_measured,
                'setpoint': od.axis0.motor.current_control.Iq_setpoint
            }
        }

        emit('disp_graph_data',packet)


if __name__ == '__main__':
    print('[INFO] Starting server at http://localhost:6969')
    socketio.run(app=app, host='0.0.0.0', port=6969, debug=True)



