function autopilotChangePower(obj) {
    var left = document.getElementById("ap-power-left").value;
    var right = document.getElementById("ap-power-right").value;
    var max = document.getElementById("ap-power-sum").max;
    var sum = document.getElementById("ap-power-sum").value;
    var slider = document.getElementById("ap-power-slider").value;
    if (obj.getAttribute("id")=="ap-power-left") {
        if (left+right<=max) sum = left+right; else right=sum-left;
    }
    if (obj.getAttribute("id")=="ap-power-right") {
        if (left+right<=max) sum = left+right; else left=sum-right;
    }
    if (obj.getAttribute("id")=="ap-power-sum") {
        var x = (slider+100)/200; // L...R = 0...1
        //var sum = left+right;
        left = sum*(1-x);
        if (left>max/2) { left=max/2; right=sum-left; slider = (1-left/sum)*200-100; }
        right = sum*x;
        if (right>max/2) { right=max/2; left=sum-right; slider = 200*right/sum-100; }
    }
    if (obj.getAttribute("id")=="ap-power-slider") {
        var x = (slider+100)/200; // L...R = 0...1
        if (sum*(1-x)>max/2) { left=max/2; right=sum-left; slider = 200*right/sum-100; } else { left = sum*(1-x); }
        var x = (slider+100)/200; // L...R = 0...1
        if (sum*x>max/2) { right=max/2; left=sum-right; slider = 200*right/sum-100; } else { right = sum*x; }
    }
    
        
    sum=left+right;
    if (sum>0) slider = (right-left)/sum*100; else slider = 0;

    document.getElementById("ap-power-left").value = parseInt(left);
    document.getElementById("ap-power-right").value = parseInt(right);
    document.getElementById("ap-power-slider").value = slider;
    if (obj.getAttribute("id")!="ap-power-slider")
        document.getElementById("ap-power-sum").value = parseInt(sum);

    var mode = autopilotModeChange();
    
    // update ground data:
    commands.autopilot.mode = mode; 
    commands.autopilot.power = [parseInt(left),parseInt(right)]; // W

    // add to command que:
    addToCommandQue("autopilot");

}


function autopilotChangeRpm(obj) {
    var left = document.getElementById("ap-rpm-left").value;
    var right = document.getElementById("ap-rpm-right").value;
    var max = document.getElementById("ap-rpm-sum").max;
    var sum = document.getElementById("ap-rpm-sum").value;
    var slider = document.getElementById("ap-rpm-slider").value;
    if (obj.getAttribute("id")=="ap-rpm-left") {
        if (left+right<=max) sum = left+right; else right=sum-left;
    }
    if (obj.getAttribute("id")=="ap-rpm-right") {
        if (left+right<=max) sum = left+right; else left=sum-right;
    }
    if (obj.getAttribute("id")=="ap-rpm-sum") {
        var x = (slider+100)/200; // L...R = 0...1
        //var sum = left+right;
        left = sum*(1-x);
        if (left>max/2) { left=max/2; right=sum-left; slider = (1-left/sum)*200-100; }
        right = sum*x;
        if (right>max/2) { right=max/2; left=sum-right; slider = 200*right/sum-100; }
    }
    if (obj.getAttribute("id")=="ap-rpm-slider") {
        var x = (slider+100)/200; // L...R = 0...1
        if (sum*(1-x)>max/2) { left=max/2; right=sum-left; slider = 200*right/sum-100; } else { left = sum*(1-x); }
        var x = (slider+100)/200; // L...R = 0...1
        if (sum*x>max/2) { right=max/2; left=sum-right; slider = 200*right/sum-100; } else { right = sum*x; }
    }
    
        
    sum=left+right;
    if (sum>0) slider = (right-left)/sum*100; else slider = 0;

    document.getElementById("ap-rpm-left").value = parseInt(left);
    document.getElementById("ap-rpm-right").value = parseInt(right);
    document.getElementById("ap-rpm-slider").value = slider;
    if (obj.getAttribute("id")!="ap-rpm-slider")
        document.getElementById("ap-rpm-sum").value = parseInt(sum);

    var mode = autopilotModeChange();
    
    // update ground data:
    commands.autopilot.mode = mode; 
    commands.autopilot.rpm = [parseInt(left),parseInt(right)]; // rpm

    // add to command que:
    addToCommandQue("autopilot");

}

function autopilotModeChange() {
    var mode = -1;
    if (document.getElementById("ap-mode-power").hasAttribute("toggled")) {
        mode=0;
        var left = document.getElementById("ap-power-left").value;
        var right = document.getElementById("ap-power-right").value;
        commands.autopilot.power = [parseInt(left),parseInt(right)]; // W
    }

    if (document.getElementById("ap-mode-rpm").hasAttribute("toggled")) {
        mode=1;
        var left = document.getElementById("ap-rpm-left").value;
        var right = document.getElementById("ap-rpm-right").value;
        commands.autopilot.rpm = [parseInt(left),parseInt(right)]; // rpm
    }

    if (document.getElementById("ap-mode-heading").hasAttribute("toggled")) {
        mode=2;
    }

    if (mode!=commands.autopilot.mode) {
        commands.autopilot.mode = mode; 
        addToCommandQue("autopilot");
    }
    return (mode);
}
