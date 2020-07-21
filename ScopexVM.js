const ipc = require('electron').ipcRenderer;
var child = require('child_process').execFile;

var fs = require('fs'),
xml2js = require('xml2js');

var ODEupdateTimer = {}; // timer started after ODE launch to collect data
var ODEcommandTimer = {}; // timer for sending commands to ODE

// things received from GUI via commands:
function commandClass() {
    this.autopilot = {};
    this.sprayer = {};
    this.lidar = {};

    this.autopilot.mode = 0; // 0...manual power setting, 1... manual rpm control; 2...heading and speed control; 3... tbd
    this.autopilot.power = [0,0]; // Ws
    this.autopilot.thrust = [0,0]; // N
    this.autopilot.rpm = [0,0]; // rpm
    this.autopilot.heading = 0; // deg (setpoint)
  }

var VMData = {}; // holds basic info like paths, initLat, initLon and earth radius 
var VM = {}; // holds data which is sent to main and subsequently to GUI (gondola position, speeds etc, motor rpm, ...)
VM.initialized = 0; // 0 for now, 1 once data from ODE was read back to VM.stuff

var processODE = {};

function updateData() {

  //data.flightGear.initLon = parseFloat(document.getElementById('lon').value);

}

function ODEinitCommands() {
  var txt = "";
  txt = txt + "initialAltitude "+VMData.initAlt.toFixed(2)+";\n";
  txt = txt + "ductArea "+VMData.ductArea.toFixed(4)+";\n";
  txt = txt + "ductCdischarge "+VMData.ductCdischarge.toFixed(4)+";\n";
  txt = txt + "ductHeightRatio "+VMData.ductHeightRatio.toFixed(4)+";\n";
  txt = txt + "payloadMass "+VMData.payloadMass.toFixed(2)+";\n";
  txt = txt + "direction "+VMData.initHeading.toFixed(2)+";\n";
  var windNorth = VMData.windGondolaSpeed*Math.cos(VMData.windGondolaDirection/180*Math.PI);
  var windEast = VMData.windGondolaSpeed*Math.sin(VMData.windGondolaDirection/180*Math.PI);
  txt = txt + "WindNorthPayload "+windNorth.toFixed(3)+";\n";
  txt = txt + "WindEastPayload "+windEast.toFixed(3)+";\n";
  var windNorth = VMData.windBalloonSpeed*Math.cos(VMData.windBalloonDirection/180*Math.PI);
  var windEast = VMData.windBalloonSpeed*Math.sin(VMData.windBalloonDirection/180*Math.PI);
  txt = txt + "WindNorthBalloon "+windNorth.toFixed(3)+";\n";
  txt = txt + "WindEastBalloon "+windEast.toFixed(3)+";\n";
  txt = txt + "Pressure "+(atmos.getP(VMData.initAlt)).toFixed(2)+";\n";
  txt = txt + "Temperature "+(atmos.getT(VMData.initAlt)).toFixed(2)+";\n";

  var left = propulsion.thrust[0];
  var right = propulsion.thrust[1];
  var sum = left+right;
  dThrust = 0;
  if (sum>0) {
    dThrust = 2*right/sum-1.0;
  }
  txt = txt + "thrust "+sum.toFixed(3)+";\n";
  txt = txt + "dThrust "+dThrust.toFixed(4)+";\n";
  
  fs.writeFileSync(VMData.ODEPath+"VMcmd.scp.init", txt, function (err) {
    if (err) return console.log(err);
  });  
}


function ODEcommands() {
  var txt = "";
  txt = txt + "payloadMass "+VMData.payloadMass.toFixed(2)+";\n";
  txt = txt + "direction "+VMData.initHeading.toFixed(2)+";\n";
  var windNorth = VMData.windGondolaSpeed*Math.cos(VMData.windGondolaDirection/180*Math.PI);
  var windEast = VMData.windGondolaSpeed*Math.sin(VMData.windGondolaDirection/180*Math.PI);
  txt = txt + "WindNorthPayload "+windNorth.toFixed(3)+";\n";
  txt = txt + "WindEastPayload "+windEast.toFixed(3)+";\n";
  var windNorth = VMData.windBalloonSpeed*Math.cos(VMData.windBalloonDirection/180*Math.PI);
  var windEast = VMData.windBalloonSpeed*Math.sin(VMData.windBalloonDirection/180*Math.PI);
  txt = txt + "WindNorthBalloon "+windNorth.toFixed(3)+";\n";
  txt = txt + "WindEastBalloon "+windEast.toFixed(3)+";\n";
  if (VM.gondola) {
    txt = txt + "Pressure "+(atmos.getP(VM.gondola.alt)).toFixed(2)+";\n"; // + tetherlength!
    txt = txt + "Temperature "+(atmos.getT(VM.gondola.alt)).toFixed(2)+";\n";
  } else {
    txt = txt + "Pressure "+(atmos.getP(VMData.initAlt)).toFixed(2)+";\n"; // + tetherlength!
    txt = txt + "Temperature "+(atmos.getT(VMData.initAlt)).toFixed(2)+";\n";
  }

  var left = propulsion.thrust[0];
  var right = propulsion.thrust[1];
  var sum = left+right;
  dThrust = 0;
  if (sum>0) {
    dThrust = 2*right/sum-1.0;
  }
  txt = txt + "thrust "+sum.toFixed(3)+";\n";
  txt = txt + "dThrust "+dThrust.toFixed(4)+";\n";
  
  fs.writeFileSync(VMData.ODEPath+"VMcmd.scp", txt, function (err) {
    if (err) return console.log(err);
  });
}


function displayUpdate() {
  //console.log(data);
  document.getElementById('init-alt-m').setAttribute('value',VMData.initAlt.toFixed(0));
  document.getElementById('init-heading').setAttribute('value',VMData.initHeading.toFixed(0));
  document.getElementById('payload-mass').setAttribute('value',VMData.payloadMass.toFixed(0));
  document.getElementById('pressure').setAttribute('value',atmos.getP(VMData.initAlt).toFixed(1));
  document.getElementById('temperature').setAttribute('value',(atmos.getT(VMData.initAlt)-273.15).toFixed(1));
  document.getElementById('wind-speed-gondola').setAttribute('value',VMData.windGondolaSpeed.toFixed(2));
  document.getElementById('wind-direction-gondola').setAttribute('value',VMData.windGondolaDirection.toFixed(0));
  document.getElementById('wind-speed-balloon').setAttribute('value',VMData.windBalloonSpeed.toFixed(2));
  document.getElementById('wind-direction-balloon').setAttribute('value',VMData.windBalloonDirection.toFixed(0));
}

function updateData() {
  VMData.initAlt = parseFloat(document.getElementById('init-alt-m').value);
  VMData.initHeading = parseFloat(document.getElementById('init-heading').value);
  VMData.payloadMass = parseFloat(document.getElementById('payload-mass').value);
  VMData.pressure = atmos.getP(VMData.initAlt);
  document.getElementById('pressure').setAttribute('value',VMData.pressure.toFixed(1));
  VMData.temperature = atmos.getT(VMData.initAlt);
  document.getElementById('temperature').setAttribute('value',(VMData.temperature-273.15).toFixed(1));
  VMData.windGondolaSpeed = parseFloat(document.getElementById('wind-speed-gondola').value);
  VMData.windGondolaDirection = parseFloat(document.getElementById('wind-direction-gondola').value);
  VMData.windBalloonSpeed = parseFloat(document.getElementById('wind-speed-balloon').value);
  VMData.windBalloonDirection = parseFloat(document.getElementById('wind-direction-balloon').value);

  console.log(VMData);
}

function initODELaunch() {
    document.getElementById('status').innerText = 'requesting data...';
    ipc.send('VM_requests_data',1);
}
ipc.on('data_for_VM', (event, args) => {
    document.getElementById('status').innerText = 'data received.';
    VMData = args[0];
    console.log(VMData);
    displayUpdate();
    event.returnValue = 'ok';
   });

ipc.on('ground_sends_cmd', (event, args) => {
    var cmd = args[0];
    var data = args[1];
    if (cmd=="autopilot") {
      propulsion.autopilot = data;
      console.log(propulsion.autopilot);
    }
    event.returnValue = 'ok';
   });
   

function launchODE() {
    document.getElementById('status').innerText = 'launching ODE...';

    // write VMcmd.scp.init:
    ODEinitCommands();

    // launch ODE:
    var executablePath = VMData.ODEPath+"scopex-sim";
    // with command file:
    var parameters = [ "-f",VMData.ODEPath+"VMcmd.scp","-l",VMData.ODEPath+"ODEoutput.log","-i", VMData.ODEPath+"VMcmd.scp.init" ];
    // without command file:
    //var parameters = [ "-l",VMData.ODEPath+"ODEoutput.log" ];
    
    processODE = child(executablePath, parameters, function(err, stdout, stderr) {
        // this code is executed after the process terminates:
        console.log(stdout)
        console.log('ODE terminated.');
        document.getElementById('status').innerText = "ready to launch.";
        document.getElementById('launchBtn').removeAttribute('disabled');
        clearInterval(ODEupdateTimer);
    });

    // start collecting data from ODE
    clearInterval(ODEupdateTimer);
    ODEupdateTimer = setInterval(ODEupdate, 100);
    
    // start sending commands to ODE:
    clearInterval(ODEcommandTimer);
    ODEcommandTimer = setInterval(ODEcommands, 100);
}

function launchSubSystems() { // called after ODE sucessfully output first line of data; now we can launch motors and stuff
    document.getElementById('status').innerText = 'ODE started, running subsystems...';

    // initialize atmospheric model:
    prepareAtmosData();

    // run propulsion system (in constant rpm mode, setpoints [0 rpm,0 rpm]):
    propulsion.power = [0,0]; // units: W
    propulsion.start(); 
    //propulsion.setRpm(0,0); // units: rpm
    propulsion.RPMsetpoint = [0,0];
    propulsion.thrust = [0,0];
    ODEcommands();
    propulsion.regRpmStart();


    // launch and initialize power system:
    powerSys.init([90,95]); // charge State in percent (100 is fully charged)
    powerSys.start();
    powerSys.addStaticLoads([235,0]);
}


function ODEupdate() {
  try {
    var line = fs.readFileSync(VMData.ODEPath+"ODEoutput.log", 'utf8')
    parseODE(line);
  } catch (err) {
    console.error(err)
  }
}

function parseODE(line) {
  //console.log(line);
  if (line.length<3) { return;  }
  var arr = line.split(',');
  //console.log(arr.length);
  if (parseInt(arr[0])<0) { console.log('t<0');  return;  }
  if (arr.length==41) {
    //VM = {};


    VM.gondola = {};
    VM.sprayer = {};
    VM.ascender = {};
    VM.motors = {};
    VM.met = {};
    VM.batteries = {};
    VM.lidar = {};

    // gondola position:
    // =====================================
    var x = parseFloat(arr[1]); var y = parseFloat(arr[2]); var alt = parseFloat(arr[3]);
    var r = VMData.world.EarthRadius+alt;
    VM.gondola.alt = alt;
    VM.gondola.lat = VMData.initLat + Math.atan2(x,r)*180/Math.PI;
    VM.gondola.lon = VMData.initLon + Math.atan2(y,r)*180/Math.PI;
    var heading = parseFloat(arr[27]);
    if (heading<0) heading=heading+360.0;
    VM.gondola.heading = heading;
    VM.gondola.roll = 0; // not simulated
    VM.gondola.pitch = 0; // not simulated

    // ground speeds:
    var gsN = parseFloat(arr[4]);
    var gsE = parseFloat(arr[5]);
    var gsU = parseFloat(arr[6]);
    VM.gondola.groundSpeedsNEU = [gsN,gsE,gsU];

    // wind speeds:
    var wsN = parseFloat(arr[39]);
    var wsE = parseFloat(arr[40]);
    var wsU = 0; // not simulated
    VM.gondola.windSpeedsNEU = [wsN,wsE,wsU];

    var altBalloon = parseFloat(arr[15]);

    VM.met.pressure = parseFloat(arr[35]); // mbar
    VM.met.temperature = parseFloat(arr[36])-273.15; // [C] converted from K
    //console.log(VM.met.pressure);

    // add modeled stuff:
    // =======================

    // motors:
    VM.motors = {};
    VM.motors.rpm = [parseInt(propulsion.n[0]*60),parseInt(propulsion.n[1]*60)];
    VM.motors.thrust = propulsion.thrust;
    VM.motors.power = propulsion.power;

    // batteries:
    VM.batteries.voltage = powerSys.voltage; // [V], delivered
    VM.batteries.currents = powerSys.current; // [A], delivered
    VM.batteries.energyRemaining = powerSys.energy; // [%], 100...fully charged
    VM.batteries.energyPercent = powerSys.energyPercent; // [%], 100...fully charged


    ipc.send('VM_sends_all_data',[VM]);

    if (VM.initialized<1) {
        launchSubSystems()
    }

    VM.initialized = 1;
    return;
  }
  console.log('unknown error.')
}

