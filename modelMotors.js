// model to emulate T1101 motors from 'Torque Systems' and Sensenich 1.88m diamter carbon fiber props
// based on analysis by Craig Mascarenhas
//
//  Physics:
//  Torque Q = k_Q * roh * n^2 * D^5    [Nm]
//      k_Q     ... torque coeff []
//      roh     ... air density [kg/m3]
//      n       ... revs/s [1/s]
//      D       ... Propeller diameter [m]
//  
//  Thrust T = k_T * roh * n^2 * D^4    [N]
//      k_T     ... thrust coeff []
//
//  Power P = 2*pi * n * Q         [W]
//
//  Dynamics: change in n due to changed power setting:
//      Torque Q = I * alpha
//          I       ... Moment of inertia of prop+hub (estimated)  [kg m2]
//          alpha   ... change in revs/s [1/s2]
// 
var dt = 10; // ms

var propulsion = {};

// parameters:
propulsion.kT = [0.066, 0.066]; // [], thrust coefficient, tuned to match Craigs graph 'Thrust vs. rpm' on slide 19 in 'prop-analysis-MAIN.pptx'
propulsion.kQ = [0.0036, 0.0036]; // [], torque coefficient (=2*pi*power coeff), tuned to match Craigs graph 'Torque vs. rpm' on slide 19 in 'prop-analysis-MAIN.pptx'
propulsion.propDiameter = [1.88, 1.88]; // [m], Sensenich prop
propulsion.I = [0.5, 0.5]; // [kg m2], estimated moment of inertia of prop+hub

propulsion.motorEfficiency = 0.95; // [ ], guesses at the moment
propulsion.converterEfficiency = 0.92; // [ ],  guesses at the moment

// data:
propulsion.power = [0,0]; // [W]
propulsion.thrust = [0,0]; // [N]
propulsion.n = [0,0]; // [revs/s]
propulsion.rpm = [0,0]; // [revs/min]


// autopilot settings:
propulsion.autopilot = {}
propulsion.autopilot.mode = 0; // 1...manual rpm set; 2...heading control; others: t.b.a.
propulsion.autopilot.rpm = [0,0]; // only used in mode 1
propulsion.autopilot.heading = 0; // deg
propulsion.autopilot.power = [0,0]; // W


propulsion.mainTimer = {}
propulsion.regRpmTimer = {};

propulsion.running = 0;


propulsion.start = function() {
    this.mainTimer = setInterval(this.step, dt);
    console.log('started')
    propulsion.running = 1;
}
propulsion.stop = function() {
    clearInterval(this.mainTimer);
    propulsion.running = 0;
}


propulsion.step = function() {
    if (propulsion.running <1) { return; }
    var roh = 0.089; // kg/m3
    for (var k=0;k<2;k++) {
        var Q_act = propulsion.kQ[k] * roh * Math.pow(Math.max(propulsion.n[k],0),2) * Math.pow(propulsion.propDiameter[k],5); 
        var Q = propulsion.power[k]/(2*Math.PI*Math.max(propulsion.n[k],1/60));
        var delta_Q = Q-Q_act;
        delta_n = delta_Q/propulsion.I[k]*dt/1000; // Hz pro time-step
        
        var maxChange = 0.1; // spin-up problem: allow only a 10% change in rpm per time step
        
        if (delta_n>maxChange*propulsion.n[k]) {
            var dt_new = dt/(delta_n/(dt/1000))/100;
            var t_new=0;
            while (t_new<dt) {
                t_new=t_new+dt_new;
                Q_act = propulsion.kQ[k] * roh * Math.pow(Math.max(propulsion.n[k],0),2) * Math.pow(propulsion.propDiameter[k],5); 
                Q = propulsion.power[k]/(2*Math.PI*Math.max(propulsion.n[k],1/60));
                delta_Q = Q-Q_act;
                delta_n = delta_Q/propulsion.I[k]*dt_new/1000; // Hz pro time-step
                propulsion.n[k] = propulsion.n[k]+delta_n;
                //console.log(parseInt(propulsion.n*60))
            }
    
        } else {
            propulsion.n[k] = propulsion.n[k]+delta_n;
        }
    
        propulsion.rpm[k] = parseInt(propulsion.n[k]*60);
        propulsion.thrust[k] = propulsion.kT[k] * roh * Math.pow(propulsion.n[k],2) * Math.pow(propulsion.propDiameter[k],4);
    
    }
    // update power consumption:
    p0 = propulsion.power[0]/propulsion.motorEfficiency/propulsion.converterEfficiency;
    p1 = propulsion.power[1]/propulsion.motorEfficiency/propulsion.converterEfficiency;
    if (powerSys.running==1 && powerSys.initialized==1) powerSys.dynamicLoads.motors = [0,p0+p1];

    //console.log(propulsion.n)
}



propulsion.regRpmStart = function() {
    if (propulsion.running <1) {
        console.log('propulsion system is not running; op canceled')
        return
    }
    clearInterval(this.regRpmTimer);
    this.regRpmTimer = setInterval(this.regRpmStep, 10);
    console.log('rpm reg started')
}
propulsion.stop = function() {
    clearInterval(this.regRpmTimer);
}

// ============================================= PID control =======================================
propulsion.previous_deltaN = [0,0];
propulsion.integral = [0,0];

propulsion.regRpmStep = function() {
    if (propulsion.autopilot.mode==0) { // constant power mode
        propulsion.power = propulsion.autopilot.power;
        //console.log(propulsion.autopilot.power);
        return;
    }
    var Kp = [10+5*Math.max(propulsion.n[0],1),10+5*Math.max(propulsion.n[1],1)];
    var Ki = [0.7*Math.max(propulsion.n[0],1),0.7*Math.max(propulsion.n[1],1)];
    var Kd = [3*Math.max(propulsion.n[0],1),3*Math.max(propulsion.n[1],1)];
    var dt = 0.01;
    var roh = 0.089;

    // update setpoints from autopilot:
    propulsion.RPMsetpoint = propulsion.autopilot.rpm;

    for (var k=0;k<2;k++) {
        Ki[k]=Ki[k]/0.089*roh;
        var setpoint = propulsion.autopilot.rpm[k]/60;
        var deltaN = setpoint - propulsion.n[k];
    
        var derivative = 0;
        if (propulsion.previous_deltaN[k]>0) {
            propulsion.integral[k] = propulsion.integral[k] + deltaN * dt;
            derivative = (deltaN - propulsion.previous_deltaN[k]) / dt;
        } 
        var output = Kp[k] * deltaN + Ki[k] * propulsion.integral[k] + Kd[k] * derivative;
    
        if (output>1000) { output = 1000 }
        if (output<0) { output = 0; propulsion.integral[k] = 0}
        propulsion.power[k] = output;
        propulsion.previous_deltaN[k] = deltaN;
    }
    //console.log(parseInt(propulsion.n[0]*60),parseInt(propulsion.n[1]*60));
}


    //var dt=100;
    //var error = setpoint - measured_value;
    //var integral = integral + error * dt;
    //var derivative = (error - previous_error) / dt;
    //var output = Kp * error + Ki * integral + Kd * derivative;
    //var previous_error = error;



propulsion.regRpmStepOld = function() {
    var nTarget = [20,20]; // Hz
    // algorithm is designed to ramp up/down rpm on both motors equally
    var roh = 0.089; // [kg/m3]
    // parameters needed to estimate change in rpm as a function of power applied:
    var kT = [0.066, 0.066]; // [], thrust coefficient, best estimate
    var kQ = [0.0036, 0.0036]; // [], torque coefficient, best estimate
    var propDiameter = [1.88, 1.88]; // [m], Sensenich prop
    var I = [0.5, 0.5]; // [kg m2], best estimate

    // define desired rpm change:
    var err = nTarget[0]-propulsion.n[0];
    var p=0;
    if (err>0) {
        var dn = 14/Math.max(propulsion.n[0],1); // [Hz/s] this function defines the ramp-up we want.
        if (dn>3) { dn = 3; } // limit superfast spin-up at low rpm's
        if (err<dn) { dn=err; }

        // calculate power required:
        dQ = kQ[0]*roh*Math.pow(propDiameter[0],5) * (Math.pow(propulsion.n[0]+dn,2)-Math.pow(propulsion.n[0],2));
        //console.log(dQ);
        dP = 2*Math.PI*(propulsion.n[0]+dn)*dQ
        p = propulsion.power[0]+dP;
        console.log('increase',parseInt(p),parseInt(propulsion.n[0]*60));

    } else {
        var dn = 0.002156*Math.pow(propulsion.n[0],2);
        if (Math.abs(err)<dn) dn = Math.abs(err);
        dQ = kQ[0]*roh*Math.pow(propDiameter[0],5) * (Math.pow(propulsion.n[0]-dn,2)-Math.pow(propulsion.n[0],2));
        dP = 2*Math.PI*(propulsion.n[0]+dn)*dQ
        p = propulsion.power[0]+dP;
        console.log('decrease',parseInt(p),parseInt(propulsion.n[0]*60));
    }

    propulsion.power = [p,p]; // apply power



}