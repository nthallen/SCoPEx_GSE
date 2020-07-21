
function drawCompass(hdg, thrusts, ws, wsh, as, ash, gs, gsh) {
    var blue = '#4e7deb';
    var cyan = '#0f8f9d';
    var red = '#9d0f0f';
    var green = '#1c9d0f';
    var grey = '#666666';

    //hdg=hdg+180;
    var img = document.getElementById("compass");

    var c = document.getElementById("compassCanvas");
    var ctx = c.getContext("2d");
    var w = c.width;
    var h = c.height;
    ctx.clearRect(0, 0, w, h);

    // heading marker:
    var x0 = w/2;
    var y0 = 30;
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0+5,y0-5);
    ctx.lineTo(x0-5,y0-5);
    ctx.lineTo(x0,y0);
    ctx.fillStyle = 'black';
    ctx.fill();

    // base horiz line:
    ctx.moveTo(w*0.1, h/2);
    ctx.lineTo(w*0.9, h/2);
    ctx.strokeStyle = 'black';
    ctx.stroke();

    // thrusts:
    var scale=1.8;
    drawArrow(ctx,w/2-w*0.4,h/2,thrusts[0]*scale,0,blue)
    drawArrow(ctx,w/2+w*0.4,h/2,thrusts[1]*scale,0,blue)

    // wind speed:
    scale = 35;
    drawArrow(ctx,w/2,h/2,ws*scale,wsh-hdg+180,cyan);

    // air speed:
    drawArrow(ctx,w/2,h/2,as*scale,ash-hdg,red);

    // ground speed:
    drawArrow(ctx,w/2,h/2,gs*scale,gsh-hdg,green);


    // compass image:
    
    var x = 160;
    var y = 160;
    var width = img.width/2.2;
    var height = img.height/2.2;
  
    ctx.translate(x, y);
    ctx.rotate(-hdg/180*Math.PI);
    ctx.drawImage(img, -width / 2, -height / 2, width, height);
    ctx.rotate(hdg/180*Math.PI);
    ctx.translate(-x, -y);

}

function drawArrow(ctx,x,y,l,hdg,color) {
    var aw = 12; var al = 12
    if (l<al) { aw=l; al=l; }
    ctx.translate(x, y);
    ctx.rotate(hdg/180*Math.PI);
    ctx.beginPath();
    ctx.moveTo(-2, 0);
    ctx.lineTo(+2, 0);
    ctx.lineTo(+2, -l+al);
    ctx.lineTo(+aw/2, -l+al);
    ctx.lineTo(0, -l);
    ctx.lineTo(-aw/2, -l+al);
    ctx.lineTo(-2, -l+al);
    ctx.lineTo(-2, 0);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.stroke();
    ctx.fill();
    ctx.rotate(-hdg/180*Math.PI);
    ctx.translate(-x, -y);
}


function initCompassCanvas() {
    drawCompass(0,[0,0],0,0,0,0,0,0);
}