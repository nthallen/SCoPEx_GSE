var powerSys = {};

// [28V, 100V] systems
powerSys = {};
powerSys.nBoxes = [8,4]; // number of boxes installed
powerSys.nSeries = [8,28]; // total number of cells in series, per box
powerSys.nParallel = [12,3]; // total number of cells in parallel, per box
powerSys.energyPercent = [95,90]; // [%]
powerSys.energyMax = [0, 0]; // [W h] at 100% charged, calculated from cell info
powerSys.energy = [0, 0]; // [W h], available energy, calculated 
powerSys.voltage = [0,0]; // [V], calculated based on load, energyPercent
powerSys.load = [0,0]; // [W], current total load
powerSys.staticLoads = [0,0]; // [W]
powerSys.dynamicLoads = {};
powerSys.dynamicLoads.motors = [0,0]; // [W]
powerSys.dynamicLoads.ascender = [0,0]; // [W]
powerSys.current = [0,0]; // [A], current total amps
powerSys.Cvalue = [0,0]; // [ ], current discharge value C
powerSys.internalVoltageDrop = [0,0]; //[V], current internal voltage drop (calculated from C)
powerSys.dissipatedPower = [0,0]; // [W], internal power dissipated, heat

powerSys.running = 0;
powerSys.initialized = 0;
powerSys.updateTimeMs = 101;
powerSys.timer = {};


powerSys.init = function(energies) {
    powerSys.energyPercent = energies;
    for (var k=0;k<2;k++) {
        powerSys.energyMax[k] = 18*powerSys.nSeries[k]*powerSys.nParallel[k]*powerSys.nBoxes[k]; // [Wh], 18 W hrs per cell
        powerSys.energy[k] = 18*powerSys.nSeries[k]*powerSys.nParallel[k]*powerSys.nBoxes[k]*powerSys.energyPercent[k]/100; // [Wh]
    }
    powerSys.initialized = 1;
}

powerSys.start = function() {
    clearInterval(powerSys.timer);
    powerSys.timer = setInterval(powerSys.update,powerSys.updateTimeMs);    
    powerSys.running = 1;    
}

powerSys.stop = function() {
    clearInterval(powerSys.timer);
    powerSys.running = 0;    
}


powerSys.update = function() {
    console.log('update.')
    for (var k=0;k<2;k++) {
        var load = powerSys.staticLoads[k]+powerSys.dynamicLoads.motors[k]+powerSys.dynamicLoads.ascender[k]; // [W], delivered
        powerSys.voltage[k] = powerSys.nSeries[k]*(4.1-0.5*(100-powerSys.energyPercent[k])/100); // Volts, no load
        powerSys.Cvalue[k] = load/powerSys.voltage[k]/(powerSys.nParallel[k])/5; // 1C is 5 Amps
        powerSys.internalVoltageDrop[k] = 0.1*powerSys.Cvalue[k]*powerSys.nSeries[k]; // e.g., 0.1 V drop per C (0.1 V per 5 amps here)
        deliveredVoltage = powerSys.voltage[k]-powerSys.internalVoltageDrop[k];
        powerSys.current[k] = load/deliveredVoltage;
        powerSys.dissipatedPower[k] = powerSys.current[k]*powerSys.internalVoltageDrop[k];   
        
        powerSys.load[k] = load;
        powerSys.energy[k] = powerSys.energy[k]-load*powerSys.updateTimeMs/1000/3600;
        powerSys.energyPercent[k] = powerSys.energy[k]/powerSys.energyMax[k]*100;
        if (powerSys.energy[k]<0) {
            powerSys.current[k]=0;
            powerSys.energyPercent[k] = 0;
            powerSys.Cvalue[k] = 0;
            powerSys.dissipatedPower[k] = 0;
            powerSys.voltage[k] = 0;
        }
    }

}

powerSys.addStaticLoads = function(loads) {
    for (var k=0;k<2;k++) {
        powerSys.staticLoads[k] = powerSys.staticLoads[k]+loads[k];
        if (powerSys.staticLoads[k]<0) powerSys.staticLoads[k]=0;
    }
}


