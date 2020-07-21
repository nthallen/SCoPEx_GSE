const ipc = require('electron').ipcRenderer;
var child = require('child_process').execFile;

var fs = require('fs'),
xml2js = require('xml2js');

var waitForFlightGear = {}; // timer started after FlightGear launch
var fsLaunched = -1; // will hold date object of fs launch time
var data = {};

function requestUpdateData(){
  initWithData();
}

function initWithData(){
  document.getElementById('status').innerText = 'requesting data...';
  ipc.send('FS_requests_data',1);
}

ipc.on('data_for_FS', (event, args) => {
  document.getElementById('status').innerText = 'data received.';
  data = args[0];
  // use GPS/VM data if available:
  if (data.gondola.lat!=0 && data.gondola.lon!=0) {
    data.flightGear.initLat = data.gondola.lat;
    data.flightGear.initLon = data.gondola.lon;
    data.flightGear.initAlt = data.gondola.alt;
    data.flightGear.initHeading = data.gondola.heading;
  }
  displayUpdate();
  event.returnValue = 'ok';
 });

function updateData() {

  data.flightGear.initLon = parseFloat(document.getElementById('lon').value);
  data.flightGear.initLat = parseFloat(document.getElementById('lat').value);
  data.flightGear.initAlt = parseFloat(document.getElementById('alt').value);
  data.flightGear.initHeading = parseInt(document.getElementById('heading').value);
  
  //data.flightGear.windSpeed = parseFloat(document.getElementById('wind-speed').value);
  //data.flightGear.windDirection = parseInt(document.getElementById('wind-heading').value);

  data.flightGear.localTime[3] = parseInt(document.getElementById('time-hr').value);
  data.flightGear.localTime[4] = parseInt(document.getElementById('time-min').value);
  data.flightGear.localTime[1] = parseInt(document.getElementById('date-month').value);
  data.flightGear.localTime[2] = parseInt(document.getElementById('date-day').value);
}


function displayUpdate() {
  console.log(data);
  document.getElementById('lon').setAttribute('value',data.flightGear.initLon.toFixed(7));
  document.getElementById('lat').setAttribute('value',data.flightGear.initLat.toFixed(7));
  document.getElementById('alt').setAttribute('value',data.flightGear.initAlt.toFixed(0));
  document.getElementById('heading').setAttribute('value',data.flightGear.initHeading.toFixed(0));

  //document.getElementById('wind-speed').setAttribute('value',data.flightGear.windSpeed.toFixed(2));
  //document.getElementById('wind-heading').setAttribute('value',data.flightGear.windDirection.toFixed(0));

  document.getElementById('time-hr').setAttribute('value',data.flightGear.localTime[3].toFixed(0));
  document.getElementById('time-min').setAttribute('value',data.flightGear.localTime[4].toFixed(0));
  document.getElementById('date-month').setAttribute('value',data.flightGear.localTime[1].toFixed(0));
  document.getElementById('date-day').setAttribute('value',data.flightGear.localTime[2].toFixed(0));
}

function launchSim() {
  document.getElementById('status').innerText = "launching FlightGear..."
  document.getElementById('launchBtn').setAttribute('disabled','disabled');

  //updateData();
  //ipc.send('updateData',[data]);

  // overwrite old ODEoutput file:
  //fs.writeFile(data.flightGear.ODEPath+"ODEoutput.log", '-1,standing by\n', function (err) {
  //  if (err) return console.log(err);
  //  console.log("wrote to ODE output file: 'standing by'");
  //});

  // launch FlightGear:
  var executablePath = data.flightGear.path+"bin\\fgfs.exe";
  
  // cmd line parameters:
  var parameters = [
    "--httpd=5480","--fdm=null","--fg-root="+data.flightGear.path+"\\data",
    "--aircraft-dir="+data.flightGear.aircraftPath, "--aircraft=Scopex",
    "--lat="+data.flightGear.initLat.toFixed(7), "--lon="+data.flightGear.initLon.toFixed(7),
    "--altitude="+(data.flightGear.initAlt/0.3048).toFixed(2), "--heading="+data.flightGear.initHeading.toFixed(2), "--in-air",
    "--com1=100.00", "--com2=100.00", "--disable-real-weather-fetch", "--disable-specular-highlight", "--shading-smooth", "--texture-filtering=4",
    "--wind="+data.gondola.windSpeedHeading.toFixed(0)+"@"+(data.gondola.windSpeed*1.94384).toFixed(2),
    "--start-date-lat="+data.flightGear.localTime[0].toFixed(0)+":"+data.flightGear.localTime[1].toFixed(0)+":"+data.flightGear.localTime[2].toFixed(0)+":"+data.flightGear.localTime[3].toFixed(0)+":"+data.flightGear.localTime[4].toFixed(0)+":"+data.flightGear.localTime[5].toFixed(0),
    "--allow-nasal-read="+data.flightGear.ODEPath  ]
  
  //console.log(data)
  //console.log(parameters)

  // send initLat/Lon to ScopexVM:
  ipc.send('FS_sends_starting_data',[data.flightGear.initLat,data.flightGear.initLon]);

  child(executablePath, parameters, function(err, stdout, sterr) {
    // this code is executed after the process terminates:
    console.log(err)
    console.log('FlightGear terminated.');
    document.getElementById('status').innerText = "ready to launch.";
    document.getElementById('launchBtn').removeAttribute('disabled');
    clearInterval(waitForFlightGear);

  });
  waitForFlightGear = setInterval(waitForFlightGearReady, 1000);
  fsLaunched = Date.now();
  console.log(fsLaunched);
}

function waitForFlightGearReady() {
  var parser = new xml2js.Parser();
  fs.readFile(data.flightGear.exportPath + 'flightGearStatus.xml', function(err, data) {
    if (err) {
      console.log('error parsing the xml...')
    } else {
      parser.parseString(data, function (err, result) {
        if (err) {

        } else {
          var tmp = result.status.time[0];
          var t = tmp.split(":");
          var d = new Date(parseInt(t[0]),parseInt(t[1])-1,parseInt(t[2]),parseInt(t[3]),parseInt(t[4]),parseInt(t[5]));
          var dt = fsLaunched-d.getTime();
          console.log(dt);
          if (dt<0) {
            clearInterval(waitForFlightGear);
            document.getElementById('status').innerText = 'FlightGear ready.';
          }
          //console.log(result);  
        }
      });  
    }

});
}

