//console log to not console
(function () {
  if (!console) {
    console = {};
  }
  var old = console.log;
  var logger = document.getElementById("log");
  console.log = function (message) {
    if (typeof message == "object") {
      logger.innerHTML +=
        (JSON && JSON.stringify ? JSON.stringify(message) : String(message)) +
        "<br />";
    } else {
      logger.innerHTML += message + "<br />";
    }
    logger.scrollTop = logger.scrollHeight;
  };
})();

// state buttons
AXIS_STATES = {
  0: "AXIS_STATE_UNDEFINED",
  1: "AXIS_STATE_IDLE",
  2: "AXIS_STATE_STARTUP_SEQUENCE",
  3: "AXIS_STATE_FULL_CALIBRATION_SEQUENCE",
  4: "AXIS_STATE_MOTOR_CALIBRATION",
  5: "AXIS_STATE_SENSORLESS_CONTROL",
  6: "AXIS_STATE_ENCODER_INDEX_SEARCH",
  7: "AXIS_STATE_ENCODER_OFFSET_CALIBRATION",
  8: "AXIS_STATE_CLOSED_LOOP_CONTROL",
  9: "AXIS_STATE_LOCKIN_SPIN",
  10: "AXIS_STATE_ENCODER_DIR_FIND",
  11: "AXIS_STATE_HOMING",
};

CONTROL_MODES = {
  0: "CONTROL_MODE_VOLTAGE_CONTROL",
  1: "CONTROL_MODE_TORQUE_CONTROL",
  2: "CONTROL_MODE_VELOCITY_CONTROL",
  3: "CONTROL_MODE_POSITION_CONTROL",
};

function send_axis_state(e) {
  odrive.emit("set_axis_state", e.target.value);
}
function send_controller_state(e) {
  odrive.emit("set_controller_state", e.target.value);
}
// createing buttons for axis
function json_to_buttons(el, json, callback) {
  for (let [key, value] of Object.entries(json)) {
    b = document.createElement("button");
    b.innerHTML = value;
    b.value = key;
    b.classList.add("pretty");
    b.classList.add("button");
    b.classList.add("small");
    b.id = value;
    b.addEventListener("click", callback);
    el.appendChild(b);
  }
}

//form creation element is the element to append the form to,
function json_to_form(el, json) {
  f = document.getElementById(el.id + "_form");
  if (typeof f != "undefined" && f != null) {
    f.remove();
  }
  f = document.createElement("form");
  f.id = el.id + "_form";
  for (let [key, value] of Object.entries(json)) {
    l = document.createElement("label");
    l.innerHTML = key + ": ";
    i = document.createElement("input");
    i.classList.add("pretty");
    i.classList.add("input");
    i.id = key;
    i.setAttribute("type", "text");
    i.value = value;
    f.appendChild(l);
    f.appendChild(i);
    f.appendChild(document.createElement("br"));
  }
  el.appendChild(f);
}

function form_to_json(el) {
  if (typeof el == "undefined" && el == null) {
    console.log("bad_el");
  }

  children = [...el.children];

  data = {};
  children.forEach((child) => {
    if (child.tagName == "INPUT") {
      data[child.id] = child.value;
    }
  });
  return data;
}

//socket io
var socket = io();

//sending a connection message
socket.on("connect", function () {
  socket.send("The tips have been touched");
});

socket.on("message", (message) => console.log("[MESSAGE]: " + message));

//odrive stuff
const odrive = io("/odrive");

//message handler for odrive namespace
odrive.on("message", (message) => console.log("[ODRIVE]: " + message));

//button functions
document
  .getElementById("connect_odrive")
  .addEventListener("click", () => odrive.emit("find_odrive"));
document
  .getElementById("clear_errors")
  .addEventListener("click", () => odrive.emit("clear_errors"));
document
  .getElementById("reboot_odrive")
  .addEventListener("click", () => odrive.emit("reboot"));
document
  .getElementById("get_gains")
  .addEventListener("click", () => odrive.emit("get_gains"));
document
  .getElementById("get_inputs")
  .addEventListener("click", () => odrive.emit("get_inputs"));
document
  .getElementById("get_config")
  .addEventListener("click", () => odrive.emit("get_config"));
document
  .getElementById("save_motor_data")
  .addEventListener("click", () => {
    msg = prompt('What should this test be saved as?\n Files will get saved as <what you enter>_data.json\n don\'t enter spaces pls.', 'Velocity_Test_1')
    odrive.emit("save_motor_data" , msg);
  });
document
  .getElementById("reset_motor_data")
  .addEventListener("click", () => odrive.emit("reset_motor_data"));
document
  .getElementById("set_gains")
  .addEventListener("click", () =>
    odrive.emit(
      "set_gains",
      form_to_json(document.getElementById("gains_disp_form"))
    )
  );

document
  .getElementById("set_inputs")
  .addEventListener("click", () =>
    odrive.emit(
      "set_inputs",
      form_to_json(document.getElementById("inputs_disp_form"))
    )
  );
//setting up axis and control mode buttons

document
  .getElementById("set_config")
  .addEventListener("click", () =>
    odrive.emit(
      "set_config",
      form_to_json(document.getElementById("config_disp_form"))
    )
  );

document
  .getElementById("erase_config")
  .addEventListener("click", () => odrive.emit("erase_config"));

//handling events
odrive.on(
  "disp_voltage",
  (voltage) =>
    (document.getElementById("voltage_disp").innerHTML = voltage + " V")
);
odrive.on("disp_gains", (gains) =>
  json_to_form(document.getElementById("gains_disp"), gains)
);
odrive.on("disp_inputs", (inputs) =>
  json_to_form(document.getElementById("inputs_disp"), inputs)
);
odrive.on("disp_config", (config) =>
  json_to_form(document.getElementById("config_disp"), config)
);
odrive.on(
  "disp_enc_count",
  (count) => (document.getElementById("enc_disp").innerHTML = count)
);
odrive.on("disp_states", (states) => {
  disp = document.getElementById("current_state");
  disp.innerHTML = "";
  for (let [key, value] of Object.entries(states)) {
    if (key.includes("axis")) {
      name = AXIS_STATES[value];
    } else {
      name = CONTROL_MODES[value];
    }
    disp.innerHTML = disp.innerHTML + key + " : " + name + "\n";
  }
});

odrive.on(
  "disp_errors",
  (errors) => (document.getElementById("error_disp").innerHTML = errors)
);

//get voltage once a second
window.setInterval(() => {
  odrive.emit("read_voltage");
  odrive.emit("get_errors");
  odrive.emit("get_states");
}, 1000);

//get data every 20 ms
window.setInterval(() => {
  odrive.emit("get_enc_count");
  odrive.emit("get_graph_data");
}, 20);

json_to_buttons(
  document.getElementById("axis_state"),
  AXIS_STATES,
  send_axis_state
);

json_to_buttons(
  document.getElementById("control_state"),
  CONTROL_MODES,
  send_controller_state
);

// Chart shit

pos_current_data = [];
pos_setpoint_data = [];
vel_current_data = [];
vel_setpoint_data = [];
cur_current_data = [];
cur_setpoint_data = [];

var pos_chart = new Chart(
  document.getElementById("pos_chart").getContext("2d"),
  {
    type: "line",
    data: {
      datasets: [
        {
          label: "current",
          data: [],
          type: "line",
          borderColor: "#d08770",
        },
        {
          label: "setpoint",
          data: [],
          type: "line",
          borderColor: "#a3be8c",
          // this dataset is drawn on top
        },
      ],
    },
    options: {
      elements: {
        point: {
          radius: 0,
        },
        line: {
          fill: false,
          borderWidth: 0,
          tension: 0,
        },
      },
      animation: {
        duration: 0,
      },
      hover: {
        animationDuration: 0, // duration of animations when hovering an item
      },
      responsiveAnimationDuration: 0,
      scales: {
        xAxes: [
          {
            type: "linear",
          },
        ],
      },
      responsive: true,
      maintainAspectRatio: false,
    },
  }
);

var vel_chart = new Chart(
  document.getElementById("vel_chart").getContext("2d"),
  {
    type: "line",
    data: {
      datasets: [
        {
          label: "current",
          data: [],
          type: "line",
          borderColor: "#d08770",
        },
        {
          label: "setpoint",
          data: [],
          type: "line",
          borderColor: "#a3be8c",
          // this dataset is drawn on top
        },
      ],
    },
    options: {
      elements: {
        point: {
          radius: 0,
        },
        line: {
          fill: false,
          borderWidth: 0,
          tension: 0,
        },
      },
      animation: {
        duration: 0,
      },
      hover: {
        animationDuration: 0, // duration of animations when hovering an item
      },
      responsiveAnimationDuration: 0,
      scales: {
        xAxes: [
          {
            type: "linear",
          },
        ],
      },
      responsive: true,
      maintainAspectRatio: false,
    },
  }
);

var cur_chart = new Chart(
  document.getElementById("cur_chart").getContext("2d"),
  {
    type: "line",
    data: {
      datasets: [
        {
          label: "current",
          data: [],
          type: "line",
          borderColor: "#d08770",
        },
        {
          label: "setpoint",
          data: [],
          type: "line",
          borderColor: "#a3be8c",
          // this dataset is drawn on top
        },
      ],
    },
    options: {
      elements: {
        point: {
          radius: 0,
        },
        line: {
          fill: false,
          borderWidth: 0,
          tension: 0,
        },
      },
      animation: {
        duration: 0,
      },
      hover: {
        animationDuration: 0, // duration of animations when hovering an item
      },
      responsiveAnimationDuration: 0,
      scales: {
        xAxes: [
          {
            type: "linear",
          },
        ],
      },
      responsive: true,
      maintainAspectRatio: false,
    },
  }
);

odrive.on("disp_graph_data", (d) => {
  t = d.time;
  pos_chart.data.datasets[0].data.push({ x: t, y: d.pos_data.current });
  pos_chart.data.datasets[1].data.push({ x: t, y: d.pos_data.setpoint });

  if (pos_chart.data.datasets[0].data.length > 500) {
    pos_chart.data.datasets[0].data.shift();
    pos_chart.data.datasets[1].data.shift();
  }

  vel_chart.data.datasets[0].data.push({ x: t, y: d.vel_data.current });
  vel_chart.data.datasets[1].data.push({ x: t, y: d.vel_data.setpoint });

  if (vel_chart.data.datasets[0].data.length > 500) {
    vel_chart.data.datasets[0].data.shift();
    vel_chart.data.datasets[1].data.shift();
  }

  cur_chart.data.datasets[0].data.push({ x: t, y: d.cur_data.current });
  cur_chart.data.datasets[1].data.push({ x: t, y: d.cur_data.setpoint });

  if (cur_chart.data.datasets[0].data.length > 500) {
    cur_chart.data.datasets[0].data.shift();
    cur_chart.data.datasets[1].data.shift();
  }

  pos_chart.update();
  vel_chart.update();
  cur_chart.update();
});
