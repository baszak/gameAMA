window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.oRequestAnimationFrame;

function loadXMLDoc(dname){
  if (window.XMLHttpRequest){
    xhttp=new XMLHttpRequest();
  }
  else{
    xhttp=new ActiveXObject("Microsoft.XMLDOM");
  }
	xhttp.open("GET",dname,false);
  if(xhttp.send())
  	console.log("file loaded");
  return xhttp.responseXML;
}

function sgn(x) {	return (x>0) - (x<0); }

Array.prototype.min = function(f){ if(!this.length) return null; var min = this[0]; var minval = f(min); for(var i = this.length; i--;) {if (f(this[i]) < minval) {minval = f(this[i]); min = this[i]}} return min; }

function fadeOut(object, property, startVal, endVal, time, callback){
	var startTime = new Date().getTime();
	if(object['currentAnimationId']) startVal = object[property];
	object[property] = startVal;
	clearInterval(object['currentAnimationId']||0);
	var intId = setInterval(function(){
		var currentTime = new Date().getTime();
		if((currentTime-startTime)>=time){
			clearInterval(intId);
			object[property] = endVal;
			object['currentAnimationId'] = null;
			if (callback)
				callback();
		}
		else
			object[property] = startVal + (endVal - startVal)*(currentTime-startTime)/time;
	}, 60);
	object['currentAnimationId'] = intId;
}
function isPointWithin(a, p) { return a.x <= p.x && a.x + a.w > p.x && a.y <= p.y && a.y + a.h > p.y; }
function dist(a, b) {
	return Math.sqrt((a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y));
}
CanvasRenderingContext2D.prototype.drawRotatedImage = function(image, x, y, w, h, angle) {
	this.save(); 
	this.translate(x, y);
	this.rotate(angle);
	this.drawImage(image, -(image.width/2), -(image.height/2), w, h);
	this.restore();
}
CanvasRenderingContext2D.prototype.drawRotatedAnim = function(image, partX, partY, w, h, x, y, angle, size) {
	this.save(); 
	this.translate(x, y);
	this.rotate(angle);
	this.drawImage(image, partX, partY, w, h, -w/2*size, -h/2*size, w*size, h*size);
	this.restore();
}

function Missiles(){
  var id = 0;
  this.push = function(projectile){
    projectile.id = ++id;
    this[projectile.id] = projectile;
  }
  this.update = function(){
    for (var p in this) {
      if(!isNaN(p)) {
        this[p].update();
      }
    }
  }
  this.draw = function(ctx){
    for (var p in this) {
      if(!isNaN(p)) {
        this[p].draw(ctx);
      }
    }
  }
}
function MovementQueue(){
	this.currentPath = [];
  this.findPath = function(x, y, x_dest, y_dest){
		this.currentPath = findPath(map.world, [x, y], [x_dest, y_dest]);
		this.currentPath.shift();
  }
  this.queueMove = function(x, y){
  	this.currentPath = [[x, y]];
  }
  this.getLength = function(){
  	return this.currentPath.length;
	}
	this.getMove = function(){
		return this.currentPath.shift();
	}
}
function loadJSON(path, success, error)
{
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function()
    {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                if (success)
                    success(JSON.parse(xhr.responseText));
            } else {
                if (error)
                    error(xhr);
            }
        }
    };
    xhr.open("GET", path, true);
    xhr.send();
}