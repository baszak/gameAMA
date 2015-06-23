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


Object.defineProperty(Object.prototype, "min", { 
    value: function(f) {
        var min = null; var minval = null; for(var i in this) { if (minval ==null || f(this[i]) < minval) {minval = f(this[i]); min = this[i]}} return min;
    },
    enumerable : false
});
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
	return Math.sqrt((a.tx-b.tx)*(a.tx-b.tx)+(a.ty-b.ty)*(a.ty-b.ty));
}
CanvasRenderingContext2D.prototype.drawRotatedImage = function(image, x, y, w, h, angle) {
	this.save(); 
	this.translate(x, y);
	this.init_angle = image.init_angle || 0;
	this.rotate(angle + this.init_angle);
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
function calcDamage(attacker, enemy){
	var baseDamage = (Math.random()*100) % (attacker.equipment.primary.damageMax - attacker.equipment.primary.damageMin) + attacker.equipment.primary.damageMin;
	var critDamage = Math.random()<attacker.critChance?attacker.critDamage:1;
	baseDamage += attacker.strength + 0.3*attacker.agility + 0.2*attacker.level;
	baseDamage -= enemy.defenseRating;//basically damage absorbtion
	var damage = (baseDamage * critDamage);//apply critical damage after enemy armor/defense modifiers
	damage += damage*attacker.equipment.primary.damageMod;
	return (damage>=0)?Math.round(damage):0;//keep it in integers
}
function updateStats(player){
	player.speedCur = player.speedCur>=80?Math.floor(player.speedBase * (1-player.equipment.boots.speedMod)):80;//speed cap at 80.less is faster
}
function levelUp(player){
	player.level++;
	if(player.level>9)
		player.skillPoints++;
	player.attrPoints += 3;
	player.speedBase = 400 - 0.9*(player.level - 1);
  statusMessage.showMessage("You advanced to level " + player.level, 3000);
}
function levelDown(player){
//this should technically never happen
//for there is currently no way to lose xp
	player.level--;
	statusMessage.showMessage("You feel weaker with each defeat", 3000);
}
function deathPenalty(player){

}
function spendAttrPoints(str, agi, int){//do when grid/windows are implemented

}
function levelUpFormula(level){//xp needed for the next lvl
  return (50*(level*level-5*level+8));
}
function levelExpFormula(level){//
  return ((50/3)*(level*level*level-6*level*level+17*level-12));
}
function drawHealthBar(obj){
  ctx.fillStyle = '#FF371D';
  ctx.fillRect((obj.data.x)*gh + gh/6, (obj.data.y)*gh -gh/6, 24, 3);
  ctx.fillStyle = '#87E82B';
  ctx.fillRect((obj.data.x)*gh + gh/6, (obj.data.y)*gh -gh/6, 24 * (obj.data.healthCur/obj.data.healthMax), 3);
  ctx.strokeStyle = '#000';
  ctx.strokeRect((obj.data.x)*gh + gh/6, (obj.data.y)*gh -gh/6, 24, 3);
}
function calcLineOfSight (start_x, start_y, end_x, end_y) {
  var coordinatesArray = [];
  var x1 = start_x;
  var y1 = start_y;
  var x2 = end_x;
  var y2 = end_y;
  var dx = Math.abs(x2 - x1);
  var dy = Math.abs(y2 - y1);
  var sx = (x1 < x2) ? 1 : -1;
  var sy = (y1 < y2) ? 1 : -1;
  var err = dx - dy;
  coordinatesArray.push([y1, x1]);
  // Main loop
  while (!((x1 == x2) && (y1 == y2))) {
    var e2 = err << 1;
    if (e2 > -dy) {
      err -= dy;
      x1 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y1 += sy;
    }
    coordinatesArray.push([y1, x1]);
  }
  for(var i=0; i<coordinatesArray.length; i++){
  	var y = coordinatesArray[i][0];
  	var x = coordinatesArray[i][1];
  	if(map.world[x][y] >= 1) return {isClear: false, obstacle: {x: x, y:y}};
  }
  return {isClear: true};
}
function OtherPlayer(id, name, level, pos_x, pos_y, healthMax, healthCur, speedCur, img_name, limboState){
	this.data = {
		id: id,
		name: name,
		level: level,
		x: pos_x,
		y: pos_y,
		tx: pos_x,
		ty: pos_y,
		direction: 0,
		animStart: frameTime,
		moving: false,
		speedCur: speedCur,
		limboState: limboState,
		healthMax: healthMax,
		healthCur: healthCur,
		isDead: false,
		isVisible: true,
		isTargeted: false
	}
  this.lastTime = frameTime;
	this.update = function(){

		this.data.x += Math.sign(this.data.tx-this.data.x) * Math.min((frameTime - this.lastTime)/speedCur, Math.abs(this.data.tx-this.data.x));
    this.data.y += Math.sign(this.data.ty-this.data.y) * Math.min((frameTime - this.lastTime)/speedCur, Math.abs(this.data.ty-this.data.y));

    if(this.data.healthCur <=0){
      this.die();
    }

    this.lastTime = frameTime;
	}
	this.draw = function(ctx){
		if(this.data.x < this.data.tx)
        this.data.direction = 3;
      else if(this.data.x > this.data.tx)
        this.data.direction = 2;
      else if(this.data.y < this.data.ty)
        this.data.direction = 0;
      else if(this.data.y > this.data.ty)
        this.data.direction = 1;
    
    if(this.data.isVisible && this.data.id != player1.data.id){
    	ctx.drawImage(allImages[img_name], (this.data.x)*gh, (this.data.y)*gh, gh, gh);
      drawHealthBar(this);
    }
	}
  this.die = function(){
    delete otherPlayers[this.data.id];
  }
}