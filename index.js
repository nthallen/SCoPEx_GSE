const { app, BrowserWindow } = require('electron')
const ipc = require('electron').ipcRenderer;


var groundData = new groundDataClass();
var VMData = new VMDataClass();
var commands = new commandClass();

// things to share with the virtual machine:
function VMDataClass() {
  this.world = {};
  this.ODEPath = "C:\\cygwin64\\home\\mab5410\\scopex-sim\\build\\";
  this.ODExportPath = "C:\\Users\\mab5410\\AppData\\Roaming\\flightgear.org\\Export\\";
  this.initLat = 0; // will be updated once the user starts the VM
  this.initLon = 0; // will be updated once the user starts the VM
  this.initAlt = 0; // will be updated once the user starts the VM
  this.initHeading = 0; // will be updated once the user starts the VM (from groundData.flightGear.x)
  this.payloadMass = 473; // kg
  this.ductArea = 0.0002; // m2?
  this.ductCdischarge = 0.6; // [?]
  this.ductHeightRatio = -0.05; // [?]
  this.pressure = 0; // will be calculated by VM
  this.temperature = 0; // will be calculated by VM
  this.windGondolaSpeed = 0; // m/s, will be updated once the user starts the VM
  this.windGondolaDirection = 0; // deg, will be updated once the user starts the VM
  this.windBalloonSpeed = 0; // m/s, will be updated once the user starts the VM
  this.windBalloonDirection = 0; // deg, will be updated once the user starts the VM

  this.world.EarthRadius = 6356752.3; // m, radius of Earth's ellipsoid at current lat/lon
}

// commands:
function commandClass() {
  this.autopilot = {};
  this.sprayer = {};
  this.lidar = {};

  this.autopilot.mode = 1;
  this.autopilot.power = 0;
  this.autopilot.thrust = 0;
  this.autopilot.rpm = [0,0];
  this.autopilot.heading = 0;
}


// things received from either ScopexVM or the real Thing
function dataClass() {
  this.gondola = {};
  this.ascender = {};
  this.motors = {};
  this.batteries = {};
  this.met = {};
  this.sprayer = {};

  this.gondola.lat = 0;
  this.gondola.lon = 0;
  this.gondola.alt = 0;
  this.gondola.heading = 0;
  this.gondola.roll = 0;
  this.gondola.pitch = 0;
  this.gondola.groundSpeedsNEU = [0,0,0];
  this.gondola.windSpeedsNEU = [0,0,0];
  
  this.ascender.tetherLength = 0;
  
  this.motors.rpm = [0,0];
  this.motors.thrust = [0,0];
  this.motors.power = [0,0];

  this.batteries.voltage = [0,0] // [V], delivered
  this.batteries.currents = [0,0] // [A], delivered
  this.batteries.energyRemaining = [0,0] // [Wh]
  this.batteries.energyPercent = [0,0] // [%], 100...fully charged

}

// things stored/displayed in the ground software (compiled from data received by either ScopexVM or the real thing):
function groundDataClass() {
  this.flightGear = {};
  this.world = {};
  this.gondola = {};
  this.balloon = {};
  this.sprayer = {};
  this.met = {};
  this.motors = {};
  this.ascender = {};
  this.batteries = {};

  this.flightGear.initLat = 19.732; // degrees
  this.flightGear.initLon = -155.854; // degrees
  this.flightGear.initAlt = 20400; // m
  this.flightGear.initHeading = 45; // degrees
  this.flightGear.localTime = [2020,9,15,17,30,00];
  this.flightGear.windSpeed = 1; // m/s
  this.flightGear.windDirection = 120; // degrees from
  this.flightGear.path = "C:\\Program Files\\FlightGear 2019.1.1\\";
  this.flightGear.aircraftPath = "C:\\Users\\mab5410\\Documents\\FlightGear\\Aircraft\\Scopex\\";
  this.flightGear.ODEPath = "C:\\cygwin64\\home\\mab5410\\scopex-sim\\build\\";
  this.flightGear.exportPath = "C:\\Users\\mab5410\\AppData\\Roaming\\flightgear.org\\Export\\";

  this.world.EarthRadius = 6356752.3; // m, radius of Earth's ellipsoid at current lat/lon
  
  this.gondola.lat = 0; // degrees
  this.gondola.lon = 0; // degrees
  this.gondola.alt = 0; // ft
  this.gondola.XYZ = [0,0,0]; // m, relative to initLat/Lon/Alt
  this.gondola.heading = 90; // degrees
  this.gondola.roll = 0; // degrees, right side down is positive
  this.gondola.pitch =0; // degrees, nose up is positive
  this.gondola.groundSpeedsXYZ = [0,0,0]; // m/s X...forward positive; Y..right positive; Z... up positive
  this.gondola.groundSpeedsNEU = [0,0,0]; // m/s, North,East and Up is positive
  this.gondola.groundSpeed = 0; // m/s
  this.gondola.groundSpeedHeading = 0; // degrees
  this.gondola.airSpeedsXYZ = [0,0,0]; // m/s X...forward positive; Y..right positive; Z... up positive
  this.gondola.airSpeedsNEU = [0,0,0]; // m/s, North,East and Up is positive
  this.gondola.airSpeed = 0; // m/s
  this.gondola.airSpeedHeading = 0; // degrees
  this.gondola.windSpeedsXYZ = [0,0,0]; // m/s X...forward positive; Y..right positive; Z... up positive
  this.gondola.windSpeedsNEU = [0,0,0]; // m/s, North,East and Up is positive
  this.gondola.windSpeed = 0; // m/s
  this.gondola.windSpeedHeading = 0; // degrees
  
  this.sprayer.fillLevel = 3; // kg
  this.sprayer.burnRate = 500; // seconds per kg
  this.sprayer.active = 0; // 0...off, 1...on 

  this.balloon.lat = 0; // degrees
  this.balloon.lon = 0; // degrees
  this.balloon.alt = 0; // ft
  this.balloon.XYZ = [0,0,0]; // m, relative to initLat/Lon/Alt
  this.balloon.heading = 90; // degrees
  this.balloon.roll = 0; // degrees, right side down is positive
  this.balloon.pitch =0; // degrees, nose up is positive
  this.balloon.groundSpeedsXYZ = [0,0,0]; // m/s X...forward positive; Y..right positive; Z... up positive
  this.balloon.groundSpeedsNEU = [0,0,0]; // m/s, North,East and Up is positive
  this.balloon.groundSpeed = 0; // m/s
  this.balloon.groundSpeedHeading = 0; // degrees
  this.balloon.airSpeedsXYZ = [0,0,0]; // m/s X...forward positive; Y..right positive; Z... up positive
  this.balloon.airSpeedsNEU = [0,0,0]; // m/s, North,East and Up is positive
  this.balloon.airSpeed = 0; // m/s
  this.balloon.airSpeedHeading = 0; // degrees
  this.balloon.windSpeedsXYZ = [0,0,0]; // m/s X...forward positive; Y..right positive; Z... up positive
  this.balloon.windSpeedsNEU = [0,0,0]; // m/s, North,East and Up is positive
  this.balloon.windSpeed = 0; // m/s
  this.balloon.windSpeedHeading = 0; // degrees
  
  this.met.pressure = 0; // mbar
  this.met.temperature = 0; // degC

  this.motors.thrust = [0,0]; // N, read only
  this.motors.rpm = [0,0]; // rpm, read only
  this.motors.power = [0,0]; // W, read only

  this.batteries.voltage = [0,0] // [V], delivered
  this.batteries.currents = [0,0] // [A], delivered
  this.batteries.energyRemaining = [0,0] // [Wh]
  this.batteries.energyPercent = [0,0] // [%], 100...fully charged


 }


function addToCommandQue(cmd) {
  if (cmd=="autopilot") {
    ipc.send("ground_adds_cmd",[cmd,commands.autopilot])
  }
}



function updateDisplay(){
  if (data.gondola.position.lat>0) suffix=' &deg;N'; else suffix = ' &deg;S'
  document.getElementById('gondola-lat').innerHTML = Math.abs(data.gondola.position.lat).toFixed(7)+suffix;
  if (data.gondola.position.lon>0) suffix=' &deg;E'; else suffix = ' &deg;W'
  document.getElementById('gondola-lon').innerHTML = Math.abs(data.gondola.position.lon).toFixed(7)+suffix;

  document.getElementById('gondola-alt-m').innerText = (data.gondola.position.alt*0.3048).toFixed(2)+' m';
  document.getElementById('gondola-alt-ft').innerText = data.gondola.position.alt.toFixed(0)+' ft';

  document.getElementById('gondola-heading-slider').value = data.gondola.position.heading.toFixed(0);
  document.getElementById('gondola-heading-txt').innerHTML = data.gondola.position.heading.toFixed(2)+' &deg;';
  
  document.getElementById('gondola-airspeed-north').innerText = data.gondola.position.airSpeedsNEU[0].toFixed(3)+' m/s';
  document.getElementById('gondola-airspeed-east').innerText = data.gondola.position.airSpeedsNEU[1].toFixed(3)+' m/s';
  document.getElementById('gondola-airspeed-up').innerText = data.gondola.position.airSpeedsNEU[2].toFixed(3)+' m/s';
  
  document.getElementById('gondola-airspeed-x').innerText = data.gondola.position.airSpeedsXYZ[0].toFixed(3)+' m/s';
  document.getElementById('gondola-airspeed-y').innerText = data.gondola.position.airSpeedsXYZ[1].toFixed(3)+' m/s';
  document.getElementById('gondola-airspeed-z').innerText = data.gondola.position.airSpeedsXYZ[2].toFixed(3)+' m/s';



}


function flightGearClick() {
  ipc.send('openFlightGearWindow',1);

}

function ScopexVMClick() {
  // update VMData:
  VMData.initLat = groundData.flightGear.initLat;
  VMData.initLon = groundData.flightGear.initLon;
  VMData.initAlt = groundData.flightGear.initAlt;
  VMData.initHeading = groundData.flightGear.initHeading;
  VMData.windGondolaSpeed = groundData.flightGear.windSpeed;
  VMData.windGondolaDirection = groundData.flightGear.windDirection;
  VMData.windBalloonSpeed = groundData.flightGear.windSpeed;
  VMData.windBalloonDirection = groundData.flightGear.windDirection;



  ipc.send('openScopexVMWindow',1);
}


function mainWindowOnLoad() {
  //ipc.send('updateData',[data]);
}


ipc.on('FS_sends_starting_data', (event, args) => {
  VMData.FSInitLat = args[0];
  VMData.FSInitLon = args[1];
  console.log(VMData);
  event.returnValue = 'ok';
 });

 ipc.on('VM_requests_data', (event, args) => {
  ipc.send('data_to_VM',[VMData])
  event.returnValue = 'ok';
 });

 ipc.on('FS_requests_data', (event, args) => {
  ipc.send('data_to_FS',[groundData])
  event.returnValue = 'ok';
 });

 ipc.on('VM_sends_all_data', (event, args) => {
  parseDataFromVM(args[0]);
  //console.log(args[0]);
  event.returnValue = 'ok';
 });