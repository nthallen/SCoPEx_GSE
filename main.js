const { app, BrowserWindow } = require('electron')
const electron = require('electron'),
ipc = electron.ipcMain;

var isSim = 1;

var debug = 0;

let win
let data

let simulatorWindow
let ScopexVMWindow

ipc.on('openFlightGearWindow', (event, args) => {
  createSimulatorWindow();
  event.returnValue = 'ok';
 });

ipc.on('openScopexVMWindow', (event, args) => {
  createScopexVMWindow();
  event.returnValue = 'ok';
 });
 
 // VM commands:
ipc.on('ground_adds_cmd', (event, args) => {
  // if in sim mode, send command straight to VM
  if (isSim>0) {
    if (ScopexVMWindow) ScopexVMWindow.webContents.send('ground_sends_cmd',args)
   } else { 
    // send command to satphone handler
   }
  event.returnValue = 'ok';
 });



 // other
 ipc.on('FS_sends_starting_data', (event, args) => {
  if (win) win.webContents.send('FS_sends_starting_data',args)
  event.returnValue = 'ok';
 });
 

 ipc.on('VM_sends_all_data', (event, args) => {
  if (win) win.webContents.send('VM_sends_all_data',args)
  event.returnValue = 'ok';
 });


 ipc.on('VM_requests_data', (event, args) => {
  if (win) win.webContents.send('VM_requests_data',args)
  event.returnValue = 'ok';
 });
 ipc.on('data_to_VM', (event, args) => {
  //data = args[0];
  if (ScopexVMWindow) ScopexVMWindow.webContents.send('data_for_VM',args)
  event.returnValue = 'ok';
});


ipc.on('FS_requests_data', (event, args) => {
  if (win) win.webContents.send('FS_requests_data',args)
  event.returnValue = 'ok';
 });
 ipc.on('data_to_FS', (event, args) => {
  //data = args[0];
  if (simulatorWindow) simulatorWindow.webContents.send('data_for_FS',args)
  event.returnValue = 'ok';
});



function createMainWindow () {
  var w = 600; var h = 780;
  if (debug>0) {  w=900; }
  win = new BrowserWindow({
    width: w,
    height: h,
    webPreferences: {
      nodeIntegration: true
    }
  })
  win.setMenuBarVisibility(false);

  // and load the index.html of the app.
  win.loadFile('index.html');

  // Open the DevTools.
  if (debug>0) win.webContents.openDevTools();

  // Emitted when the window is closed.
  win.on('closed', () => {
    win = null
  })
}


function createSimulatorWindow () {
  var w = 300; var h = 350;
  if (debug>0) {  w=600; h=500; }
  simulatorWindow = new BrowserWindow({
    width: w,
    height: h,
    show: false,
    webPreferences: {
      nodeIntegration: true
    }
  })

  simulatorWindow.setMenuBarVisibility(false);

  // and load the index.html of the app.
  simulatorWindow.loadFile('FlightGear.html')

  simulatorWindow.once('ready-to-show', () => {
    simulatorWindow.show()
  })

  // Open the DevTools.
  if (debug>0) simulatorWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  simulatorWindow.on('closed', () => {
    simulatorWindow = null
  })
}

function createScopexVMWindow () {
  var w = 300; var h = 350;
  if (debug>0) {  w=600; h=500; }
  ScopexVMWindow = new BrowserWindow({
    width: w,
    height: h,
    show: false,
    webPreferences: {
      nodeIntegration: true
    }
  })

  ScopexVMWindow.setMenuBarVisibility(false)
  //ScopexVMWindow.setMenu(null);


  // and load the index.html of the app.
  ScopexVMWindow.loadFile('ScopexVM.html')

  ScopexVMWindow.once('ready-to-show', () => {
    ScopexVMWindow.show()
  })

  // Open the DevTools.
  if (debug>1) ScopexVMWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  ScopexVMWindow.on('closed', () => {
    ScopexVMWindow = null
  })
}


app.on('ready', createMainWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

