
const SerialPort = require('serialport')
const Readline = SerialPort.parsers.Readline;
const ByteLength = SerialPort.parsers.ByteLength;
const ipc = require('electron').ipcRenderer;
const lineByLine = require('n-readlines');

const liner = new lineByLine('./gps-20200124-1.txt');

//var CanvasJS = require('canvasjs');
var fs = require('fs');
var wstream;
var timer1;
var port = null
var now = 0;

function GPSClass(comport) {
    this.lat = 0;
    this.long = 0;
    this.height = 0;
    this.heading = 0;
    this.vNorth = 0;
    this.vEast = 0;
    this.vDown = 0;
    this.roll = 0;
    this.pitch =0;
    this.aXYZ = [0,0,0];
    this.gForce = 0;
    this.vAngularXYZ = [0,0,0];
    this.unixtime = 0;
    this.status = 0;
    this.pressure = 0;
    this.bodyVelocityXYZ = [0,0,0];
    this.satellites = 0;
    this.GNSStext = '';
    this.GNSS = 0;
    this.DualAntennaHeadingActive = 0;
  }
var GPS = new GPSClass;



let portName = '';

var buf = new Uint8Array(255);
var bufCounter = 0;  
var msg = new Uint8Array(100);
var msgCounter=0;
var msgLength=0;
var header = new Uint8Array(4);
var headerFound = 0;


var t = 0;
var t0 = 0;
function switchChange() {
  obj = document.getElementById('switch-1');
  if (obj.hasAttribute('toggled')) {
    document.getElementById('label-1').innerText = 'on';
    portName = document.getElementById('COMport').getAttribute("value");
    startListening();
  }
  else {    
    document.getElementById('label-1').innerText = 'off';
    stopListening();
  }
}


function stopListening() {
  
  clearInterval(timer1);
  port.close();
  //wstream.end();
}

function startListening(){
  comport = document.getElementById('COMport').getAttribute("value");
  filename = document.getElementById('filename').getAttribute("value");
  baudrate = parseInt(document.getElementById('baudrate').getAttribute("value"));
  
  console.log(comport);
  //const port = new SerialPort('COM19', { baudRate: 115200 })
  port = new SerialPort(comport,  { baudRate: baudrate }, function (err) {
    if (err) {
      wstream = fs.createWriteStream(filename);
      timer1 = setInterval(displayUpdate, 20);
      now = Date.now();
      ipc.send('startGPS',[comport,now]);
      setInterval(simdata,10,comport);
      document.getElementById('label-1').innerText = 'sim';

      return console.log('Error: ', err.message)
    } else {
      //port.write('start\n', function(err) {
      //  if (err) {
      //    return console.log('Error on write: ', err.message)
      //  }
      //  console.log('message written')
        ipc.send('startGPS',[portName,now]);
        const parser = port.pipe(new ByteLength({length: 10}))
        parser.on('data', newData, portName)

        // create file:
        wstream = fs.createWriteStream(filename);

        // write header:
        k = Object.keys(GPS);
        //console.log(k)
    
        line=k[0];
        for (i=1;i<k.length;i++) {
            line=line+';'+k[i];
        }
        wstream.write(line+'\r\n');

        timer1 = setInterval(displayUpdate, 20);
        now = Date.now();
     // })
      
      
    }
  })
}

function LRC(header){
    j = 0;
    for (const b of header) {
        j=j+b;
      }
    lrc=j^0xFF;
    lrc=lrc%256+1;
    return lrc;
  }
  
  function crc(arr){
    crc16Table = [0x0000, 0x1021, 0x2042, 0x3063, 0x4084, 0x50a5, 0x60c6, 0x70e7, 0x8108, 0x9129, 0xa14a, 0xb16b, 0xc18c, 0xd1ad, 0xe1ce, 0xf1ef, 0x1231, 0x0210, 0x3273, 0x2252, 0x52b5, 0x4294, 0x72f7, 0x62d6, 0x9339, 0x8318, 0xb37b, 0xa35a, 0xd3bd, 0xc39c, 0xf3ff, 0xe3de, 0x2462, 0x3443, 0x0420, 0x1401, 0x64e6, 0x74c7, 0x44a4, 0x5485, 0xa56a, 0xb54b, 0x8528, 0x9509, 0xe5ee, 0xf5cf, 0xc5ac, 0xd58d, 0x3653, 0x2672, 0x1611, 0x0630, 0x76d7, 0x66f6, 0x5695, 0x46b4, 0xb75b, 0xa77a, 0x9719, 0x8738, 0xf7df, 0xe7fe, 0xd79d, 0xc7bc, 0x48c4, 0x58e5, 0x6886, 0x78a7, 0x0840, 0x1861, 0x2802, 0x3823, 0xc9cc, 0xd9ed, 0xe98e, 0xf9af, 0x8948, 0x9969, 0xa90a, 0xb92b, 0x5af5, 0x4ad4, 0x7ab7, 0x6a96, 0x1a71, 0x0a50, 0x3a33, 0x2a12, 0xdbfd, 0xcbdc, 0xfbbf, 0xeb9e, 0x9b79, 0x8b58, 0xbb3b, 0xab1a, 0x6ca6, 0x7c87, 0x4ce4, 0x5cc5, 0x2c22, 0x3c03, 0x0c60, 0x1c41, 0xedae, 0xfd8f, 0xcdec, 0xddcd, 0xad2a, 0xbd0b, 0x8d68, 0x9d49, 0x7e97, 0x6eb6, 0x5ed5, 0x4ef4, 0x3e13, 0x2e32, 0x1e51, 0x0e70, 0xff9f, 0xefbe, 0xdfdd, 0xcffc, 0xbf1b, 0xaf3a, 0x9f59, 0x8f78, 0x9188, 0x81a9, 0xb1ca, 0xa1eb, 0xd10c, 0xc12d, 0xf14e, 0xe16f, 0x1080, 0x00a1, 0x30c2, 0x20e3, 0x5004, 0x4025, 0x7046, 0x6067, 0x83b9, 0x9398, 0xa3fb, 0xb3da, 0xc33d, 0xd31c, 0xe37f, 0xf35e, 0x02b1, 0x1290, 0x22f3, 0x32d2, 0x4235, 0x5214, 0x6277, 0x7256, 0xb5ea, 0xa5cb, 0x95a8, 0x8589, 0xf56e, 0xe54f, 0xd52c, 0xc50d, 0x34e2, 0x24c3, 0x14a0, 0x0481, 0x7466, 0x6447, 0x5424, 0x4405, 0xa7db, 0xb7fa, 0x8799, 0x97b8, 0xe75f, 0xf77e, 0xc71d, 0xd73c, 0x26d3, 0x36f2, 0x0691, 0x16b0, 0x6657, 0x7676, 0x4615, 0x5634, 0xd94c, 0xc96d, 0xf90e, 0xe92f, 0x99c8, 0x89e9, 0xb98a, 0xa9ab, 0x5844, 0x4865, 0x7806, 0x6827, 0x18c0, 0x08e1, 0x3882, 0x28a3, 0xcb7d, 0xdb5c, 0xeb3f, 0xfb1e, 0x8bf9, 0x9bd8, 0xabbb, 0xbb9a, 0x4a75, 0x5a54, 0x6a37, 0x7a16, 0x0af1, 0x1ad0, 0x2ab3, 0x3a92, 0xfd2e, 0xed0f, 0xdd6c, 0xcd4d, 0xbdaa, 0xad8b, 0x9de8, 0x8dc9, 0x7c26, 0x6c07, 0x5c64, 0x4c45, 0x3ca2, 0x2c83, 0x1ce0, 0x0cc1, 0xef1f, 0xff3e, 0xcf5d, 0xdf7c, 0xaf9b, 0xbfba, 0x8fd9, 0x9ff8, 0x6e17, 0x7e36, 0x4e55, 0x5e74, 0x2e93, 0x3eb2, 0x0ed1, 0x1ef0];
    var crc = 0xFFFF;
    for (i = 0; i < arr.length; i++) {
        crc = ((crc << 8) ^ crc16Table[((crc>>>8) ^ arr[i])&0xFF])&0xFFFF;
    }
    return crc;
  }

function lookForHeader() {
    for (i = 0;i<buf.length-5;i++) {
        if (headerFound>0) return
        pid = buf[i+1];
        len = buf[i+2];
        if ((pid==20 && len==100) || (pid==28 && len==48) || (pid==30 && len==13) || (pid==36 && len==12)) {
            // check if header may be valid:
            
            if (LRC(buf.slice(i+1,i+5))==buf[i]) {
                headerFound=1;
                msgLength = buf[i+2];
                header = buf.slice(i+1,i+5);
                //console.log(header);
                msg.fill(0);
                msgCounter=0;
                for (k=i+5;k<bufCounter;k++) {
                    msg[msgCounter] = buf[k];
                    msgCounter++;
                }
            }
            
        }
    }
}

function parsePacket(header,packet) {
    pack = Buffer.from(packet);
    //console.log('package good!:'+header)
    if (header[0]==20) {
        //console.log(packet,pack)
        GPS.long = pack.readDoubleLE(20)*180.0/Math.PI;
        GPS.lat = pack.readDoubleLE(12)*180.0/Math.PI;
        GPS.height = pack.readDoubleLE(28);
        GPS.heading = pack.readFloatLE(72)*180.0/Math.PI;
        GPS.vNorth = pack.readFloatLE(36);
        GPS.vEast = pack.readFloatLE(40);
        GPS.vDown = pack.readFloatLE(44);
        GPS.roll = pack.readFloatLE(64)*180.0/Math.PI;
        GPS.pitch = pack.readFloatLE(68)*180.0/Math.PI;
        GPS.aXYZ = [pack.readFloatLE(48),pack.readFloatLE(52),pack.readFloatLE(56)];
        GPS.gForce = pack.readFloatLE(60);
        GPS.vAngularXYZ = [pack.readFloatLE(76),pack.readFloatLE(80),pack.readFloatLE(84)];
        GPS.unixtime = pack.readUInt32LE(4)+pack.readUInt32LE(8)/1000000.0;
        
        GPS.status = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
        tmp = pack.readUInt16LE(0).toString(2); // 16-bit string
        for (i=0;i<tmp.length;i++) { GPS.status[i]=parseInt(tmp[i]); }

        // filter status word:
        vals = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
        tmp = pack.readUInt16LE(2).toString(2); // 16-bit string
        for (i=0;i<tmp.length;i++) { vals[i]=parseInt(tmp[i]); }
        console.log(vals)
        GNSSfix = ['No GNSS fix','2D GNSS fix','3D GNSS fix','SBAS GNSS fix','Differential GNSS fix','Omnistar/Starfire GNSS fix',
            'RTK Float GNSS fix', 'RTK Fixed GNSS fix'];
        value = vals[6]*4+vals[5]*2+vals[4];
        GPS.GNSStext = GNSSfix[value];
        GPS.GNSS = value;
        GPS.DualAntennaHeadingActive = vals[10];
    }
    if (header[0]==28) {
        GPS.pressure = pack.readFloatLE(40);
    }
    if (header[0]==30) {
        GPS.satellites = pack.readUInt8(8)+pack.readUInt8(9)+pack.readUInt8(10)+pack.readUInt8(11)+pack.readUInt8(12);
    }
    if (header[0]==36) {
        GPS.bodyVelocityXYZ = [pack.readFloatLE(0),pack.readFloatLE(4),pack.readFloatLE(8)];
    }
    ipc.send('newNavData',[portName,GPS])
    saveGPSobj();
}

function saveGPSobj(){
    values = Object.values(GPS);
    line=values[0].toString();
    for (i=1;i<values.length;i++) {
        line=line+';'+values[i].toString();
    }
    wstream.write(line+'\r\n');
}

function newData(arr, comport){
  //console.log(msgCounter);
  //time = console.log(msg.readUInt32BE(4));
  //console.log(time);
  for (const b of arr) {
    buf[bufCounter] = b;
    bufCounter++;
  }
  if (bufCounter>200) { bufCounter=0; headerFound=1; buf.fill(0); }
  if (headerFound<1) {
      lookForHeader();
  } else {
    for (i=0;i<arr.length;i++) {
        if (msgCounter<msgLength) {
            msg[msgCounter] = arr[i];
            msgCounter++;    
        } else {
            // packet complete:
            crc1 = header[2]+header[3]*256;
            crc2 = crc(msg.slice(0,msgLength));
            if (crc1==crc2) {
                parsePacket(header,msg.slice(0,msgLength))
            } else {
                console.log('CRC error:')
                console.log(header);
                console.log(msg.slice(0,msgLength));
            }
            headerFound=0;
            msgCounter=0;
            msg.fill(0);
            buf.fill(0);
            bufCounter=0;
            for (l=i;l<arr.length;l++) {
                buf[bufCounter] = arr[l];
                bufCounter++;
            }
        }

      }
  }
  //console.log(msg);
}

function displayUpdate() {
  if (GPS.lat>1) {
    document.getElementById('lat').innerText = GPS.lat.toFixed(7);
    document.getElementById('long').innerText = GPS.long.toFixed(7);
    document.getElementById('height').innerText = GPS.height.toFixed(3);
  }
}

function simdata(comport){
  let line;
  line = liner.next();
  //console.log(line.toString('ascii'));
  line = line.toString('ascii');
  v = line.split(';');
  GPS.long = parseFloat(v[0]);
  GPS.lat = parseFloat(v[1]);
  GPS.height = parseFloat(v[2]);
  GPS.heading = parseFloat(v[3]);
  GPS.vNorth = parseFloat(v[4]);
  GPS.vEast = parseFloat(v[5]);
  GPS.vDown = parseFloat(v[6]);
  GPS.roll = parseFloat(v[7]);
  GPS.pitch = parseFloat(v[8]);
  GPS.aXYZ = [parseFloat(v[9]),0,0];
  GPS.gForce = parseFloat(v[10]);
  GPS.vAngularXYZ = [parseFloat(v[11]),0,0];
  //GPS.unixtime = pack.readUInt32LE(4)+pack.readUInt32LE(8)/1000000.0;
  
  GPS.status = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  tmp = parseInt(v[13]).toString(2); // 16-bit string
  for (i=0;i<tmp.length;i++) { GPS.status[i]=parseInt(tmp[i]); }

  GPS.pressure = parseFloat(v[14]);
  GPS.bodyVelocityXYZ = [parseFloat(v[15]),0,0];
  GPS.satellites = parseInt(v[16]);

  GPS.GNSStext = '3D'
  GPS.GNSS = 4;
  GPS.DualAntennaHeadingActive = parseInt(v[19]);
  



  console.log('data sent');
  ipc.send('newNavData',[portName,GPS])

}