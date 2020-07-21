//import { ipcMain } from "electron";

function displayUpdate() {
    // lat/lon
    document.getElementById('gondola-lat').innerHTML = groundData.gondola.lat.toFixed(5) +" &deg;";
    document.getElementById('gondola-lon').innerHTML = groundData.gondola.lon.toFixed(5)+ " &deg;";
    
    // altitude:
    document.getElementById('gondola-alt-m').innerText = groundData.gondola.alt.toFixed(1) + " m";

    // vertical speeds
    document.getElementById('gondola-vs-m').innerText = groundData.gondola.groundSpeedsXYZ[2].toFixed(2) + " m/s";
    
    // met:
    var n=1; if (groundData.met.pressure>100) n=0;
    document.getElementById('met-pressure').innerText = groundData.met.pressure.toFixed(n)+" mbar";
    document.getElementById('met-temperature').innerHTML = groundData.met.temperature.toFixed(1)+" &deg;C";
    
    // compass
    var thrust = groundData.motors.thrust;
    var rpm = groundData.motors.rpm;
    var scale = 1.8; // arrows: pixels per Newton
    drawCompass(groundData.gondola.heading, thrust, groundData.gondola.windSpeed, groundData.gondola.windSpeedHeading, groundData.gondola.airSpeed, groundData.gondola.airSpeedHeading,groundData.gondola.groundSpeed, groundData.gondola.groundSpeedHeading,)
    document.getElementById('compass-air-speed').innerHTML = "as: "+groundData.gondola.airSpeed.toFixed(2)+" m/s @ "+groundData.gondola.airSpeedHeading.toFixed(0)+"&deg;";
    document.getElementById('compass-gnd-speed').innerHTML = "gs: "+groundData.gondola.groundSpeed.toFixed(2)+" m/s @ "+groundData.gondola.groundSpeedHeading.toFixed(0)+"&deg;";
    document.getElementById('compass-wind-speed').innerHTML = "ws: "+groundData.gondola.windSpeed.toFixed(1)+" m/s from "+groundData.gondola.windSpeedHeading.toFixed(0)+"&deg;";
    document.getElementById('compass-heading').innerHTML = groundData.gondola.heading.toFixed(1)+ "&deg;";

    
    document.getElementById('compass-thrust-left-N').innerText = thrust[0].toFixed(0)+" N";
    document.getElementById('compass-thrust-right-N').innerText = thrust[1].toFixed(0)+" N";
    document.getElementById('compass-thrust-left-rpm').innerText = rpm[0].toFixed(0)+" rpm";
    document.getElementById('compass-thrust-right-rpm').innerText = rpm[1].toFixed(0)+" rpm";
    var y = 160-thrust[0]*scale-30;
    if (thrust[0]<0) { y = 160+thrust[0]*scale+30; }
    document.getElementById('compass-thrust-left-N').style.top = y+"px";
    document.getElementById('compass-thrust-left-rpm').style.top = (y+15)+"px";
    var y = 160-thrust[1]*scale-30;
    if (thrust[0]<0) { y = 160+thrust[1]*scale+30; }
    document.getElementById('compass-thrust-right-N').style.top = y+"px";
    document.getElementById('compass-thrust-right-rpm').style.top = (y+15)+"px";
    

    // motors:
    document.getElementById('motor-power-left').innerText = groundData.motors.power[0].toFixed(0)+" W";
    document.getElementById('motor-power-right').innerText = groundData.motors.power[1].toFixed(0)+" W";
    document.getElementById('motor-power-progress-left').value = groundData.motors.power[0];
    document.getElementById('motor-power-progress-right').value = groundData.motors.power[1];
    
    document.getElementById('motor-rpm-left').innerText = groundData.motors.rpm[0].toFixed(0)+" rpm";
    document.getElementById('motor-rpm-right').innerText = groundData.motors.rpm[1].toFixed(0)+" rpm";
    document.getElementById('motor-rpm-progress-left').value = groundData.motors.rpm[0];
    document.getElementById('motor-rpm-progress-right').value = groundData.motors.rpm[1];

    // batteries:
    // (index 0: 28V system)
    document.getElementById('battery-28-energy').innerText = groundData.batteries.energyRemaining[0].toFixed(0)+" Wh";
    document.getElementById('battery-28-energy-progress').value = groundData.batteries.energyPercent[0];
    document.getElementById('battery-28-voltage').innerText = "("+groundData.batteries.voltage[0].toFixed(1)+" V)";
    var p = (groundData.batteries.voltage[0]*groundData.batteries.currents[0]);
    document.getElementById('battery-28-power').innerText = p.toFixed(0)+" W";
    document.getElementById('battery-28-power-progress').value = p;
    // (index 1: 100V system)
    document.getElementById('battery-100-energy').innerText = groundData.batteries.energyRemaining[1].toFixed(0)+" Wh";
    document.getElementById('battery-100-energy-progress').value = groundData.batteries.energyPercent[1];
    document.getElementById('battery-100-voltage').innerText = "("+groundData.batteries.voltage[1].toFixed(1)+" V)";
    var p = (groundData.batteries.voltage[1]*groundData.batteries.currents[1]);
    document.getElementById('battery-100-power').innerText = p.toFixed(0)+" W";
    document.getElementById('battery-100-power-progress').value = p;

    

}




function parseDataFromVM(VM) {
    //console.log('groundData')
    //return;    
    
    // gondola position:
    // =====================================

    // ground speeds:
    groundData.gondola.lat = VM.gondola.lat;
    groundData.gondola.lon = VM.gondola.lon;
    groundData.gondola.alt = VM.gondola.alt;
    groundData.gondola.heading = VM.gondola.heading;
    groundData.gondola.roll = VM.gondola.roll;
    groundData.gondola.pitch = VM.gondola.pitch;
    groundData.gondola.groundSpeedsNEU = VM.gondola.groundSpeedsNEU;
    var tmp = rotNEU2XYZ(VM.gondola.groundSpeedsNEU[0],VM.gondola.groundSpeedsNEU[1],VM.gondola.heading);
    groundData.gondola.groundSpeedsXYZ = [tmp[0],tmp[1],VM.gondola.groundSpeedsNEU[2]];
    groundData.gondola.groundSpeed = abs3d([groundData.gondola.groundSpeedsXYZ[0],groundData.gondola.groundSpeedsXYZ[1],0]); // 2d only
    groundData.gondola.groundSpeedHeading = getHeading(VM.gondola.groundSpeedsNEU[0],VM.gondola.groundSpeedsNEU[1]);

    // wind speeds:
    wsN = VM.gondola.windSpeedsNEU[0];
    wsE = VM.gondola.windSpeedsNEU[1];
    wsU = 0; // not simulated
    groundData.gondola.windSpeedsNEU = [wsN,wsE,wsU];
    var tmp = rotNEU2XYZ(wsN,wsE,VM.gondola.heading)
    groundData.gondola.windSpeedsXYZ = [tmp[0],tmp[1],wsU];
    groundData.gondola.windSpeed = abs3d(groundData.gondola.windSpeedsXYZ);
    groundData.gondola.windSpeedHeading = getHeading(wsN,wsE);

    // air speeds:
    asN = VM.gondola.groundSpeedsNEU[0] + wsN;
    asE = VM.gondola.groundSpeedsNEU[1] + wsE;
    asU = 0 + wsU;
    groundData.gondola.airSpeedsNEU = [asN,asE,asU];
    var tmp = rotNEU2XYZ(asN,asE,VM.gondola.heading)
    groundData.gondola.airSpeedsXYZ = [tmp[0],tmp[1],asU];
    groundData.gondola.airSpeed = abs3d(groundData.gondola.airSpeedsXYZ);
    groundData.gondola.airSpeedHeading = getHeading(asN,asE);

    // motors:
    groundData.motors.power = VM.motors.power;
    groundData.motors.thrust = VM.motors.thrust;
    groundData.motors.rpm = VM.motors.rpm;

    // batteries:
    groundData.batteries = VM.batteries;


    // Met data:
    groundData.met.pressure = VM.met.pressure;
    groundData.met.temperature = VM.met.temperature;
    

    displayUpdate();

return;
    nav.gondola = {};
    var x = parseFloat(arr[1]); var y = parseFloat(arr[2]); var alt = parseFloat(arr[3]);
    nav.gondola.position.XYZ = [x, y, alt];
    var r = data.world.EarthRadius+alt;
    nav.gondola.position.lat = data.flightGear.initLat + Math.atan2(x,r)*180/Math.PI;
    nav.gondola.position.lon = data.flightGear.initLon + Math.atan2(y,r)*180/Math.PI;
    nav.gondola.position.alt = alt;
    heading = parseFloat(arr[27]);
    nav.gondola.position.heading = heading;
    
    nav.gondola.position.roll = 0; // currently not simulated
    nav.gondola.position.pitch = 0; // currently not simulated

    // ground speeds:
    gsN = parseFloat(arr[4]);
    gsE = parseFloat(arr[5]);
    gsU = parseFloat(arr[6]);
    nav.gondola.position.groundSpeedsNEU = [gsN,gsE,gsU];
    var tmp = rotNEU2XYZ(gsN,gsE,heading)
    nav.gondola.position.groundSpeedsXYZ = [tmp[0],tmp[1],gsU];
    nav.gondola.position.groundSpeed = abs3d(nav.gondola.position.groundSpeedsXYZ);
    nav.gondola.groundSpeedHeading = getHeading(gsN,gsE);

    // wind speeds:
    wsN = parseFloat(arr[39]);
    wsE = parseFloat(arr[40]);
    wsU = 0; // not simulated
    nav.gondola.position.windSpeedsNEU = [wsN,wsE,wsU];
    var tmp = rotNEU2XYZ(wsN,wsE,heading)
    nav.gondola.position.windSpeedsXYZ = [tmp[0],tmp[1],wsU];
    nav.gondola.position.windSpeed = abs3d(nav.gondola.position.windSpeedsXYZ);
    nav.gondola.windSpeedHeading = getHeading(wsN,wsE);

    // air speeds:
    asN = gsN + wsN;
    asE = gsE + wsE;
    asU = gsU + wsU;
    nav.gondola.position.airSpeedsNEU = [asN,asE,asU];
    var tmp = rotNEU2XYZ(asN,asE,heading)
    nav.gondola.position.airSpeedsXYZ = [tmp[0],tmp[1],asU];
    nav.gondola.position.airSpeed = abs3d(nav.gondola.position.airSpeedsXYZ);
    nav.gondola.airSpeedHeading = getHeading(asN,asE);

    //console.log(nav.gondola.position);


    // balloon position:
    // =====================================
    nav.balloon = {};
    nav.balloon.position = {};
    var x = parseFloat(arr[13]); var y = parseFloat(arr[14]); var alt = parseFloat(arr[15]);
    nav.balloon.position.XYZ = [x, y, alt];
    var r = data.world.EarthRadius+alt;
    nav.balloon.position.lat = data.flightGear.initLat + Math.atan2(x,r)*180/Math.PI;
    nav.balloon.position.lon = data.flightGear.initLon + Math.atan2(y,r)*180/Math.PI;
    nav.balloon.position.alt = alt;
    heading = parseFloat(arr[27]);
    nav.balloon.position.heading = heading;
    
    nav.balloon.position.roll = 0; // currently not simulated
    nav.balloon.position.pitch = 0; // currently not simulated

    // ground speeds:
    gsN = parseFloat(arr[16]);
    gsE = parseFloat(arr[17]);
    gsU = parseFloat(arr[18]);
    nav.balloon.position.groundSpeedsNEU = [gsN,gsE,gsU];
    var tmp = rotNEU2XYZ(gsN,gsE,heading)
    nav.balloon.position.groundSpeedsXYZ = [tmp[0],tmp[1],gsU];
    nav.balloon.position.groundSpeed = abs3d(nav.balloon.position.groundSpeedsXYZ);
    nav.balloon.groundSpeedHeading = getHeading(gsN,gsE);

    // wind speeds:
    wsN = parseFloat(arr[37]);
    wsE = parseFloat(arr[38]);
    wsU = 0; // not simulated
    nav.balloon.position.windSpeedsNEU = [wsN,wsE,wsU];
    var tmp = rotNEU2XYZ(wsN,wsE,heading)
    nav.balloon.position.windSpeedsXYZ = [tmp[0],tmp[1],wsU];
    nav.balloon.position.windSpeed = abs3d(nav.balloon.position.windSpeedsXYZ);
    nav.balloon.windSpeedHeading = getHeading(wsN,wsE);

    // air speeds:
    asN = gsN + wsN;
    asE = gsE + wsE;
    asU = gsU + wsU;
    nav.balloon.position.airSpeedsNEU = [asN,asE,asU];
    var tmp = rotNEU2XYZ(asN,asE,heading)
    nav.balloon.position.airSpeedsXYZ = [tmp[0],tmp[1],asU];
    nav.balloon.position.airSpeed = abs3d(nav.balloon.position.airSpeedsXYZ);
    nav.balloon.airSpeedHeading = getHeading(asN,asE);

    console.log(gsU);

}





function rotNEU2XYZ(N,E,heading) {
    var rad = heading*Math.PI/180;
    xs = N*Math.cos(rad) + E*Math.sin(rad);  
    ys = -N*Math.sin(rad) + E*Math.cos(rad);  
    return ([xs,ys]);
  }
  
  function rot2d(x,y,deg) {
    var rad = deg*Math.PI/180;
    xs = x*Math.cos(rad) - y*Math.sin(rad);  
    ys = x*Math.sin(rad) + y*Math.cos(rad);  
    return ([xs,ys]);
  }
  
  function abs3d(vec) {
    return(Math.sqrt(vec[0]*vec[0]+vec[1]*vec[1]+vec[2]*vec[2]))
  }
  
  function getHeading(x,y) {
    var h = Math.atan2(y,x)*180/Math.PI;
    if (h<0) {h=h+360; }
    return h;
  }