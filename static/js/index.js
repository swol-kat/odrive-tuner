//overwriting console.log to have in browser log
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
  .getElementById("reboot_odrive")
  .addEventListener("click", () => odrive.emit("reboot"));
document
  .getElementById("get_gains")
  .addEventListener("click", () => odrive.emit("get_gains"));
document
  .getElementById("get_config")
  .addEventListener("click", () => odrive.emit("get_config"));
document
  .getElementById("set_gains")
  .addEventListener("click", () =>
    odrive.emit(
      "set_gains",
      form_to_json(document.getElementById("gains_disp_form"))
    )
  );

document
  .getElementById("set_config")
  .addEventListener(
    "click",
    () => odrive.emit("set_config",
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
odrive.on("disp_config", (config) =>
  json_to_form(document.getElementById("config_disp"), config)
);

window.setInterval(() => {
  odrive.emit("read_voltage");
}, 1000);
