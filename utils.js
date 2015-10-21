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
  ctx.fillRect((obj.x)*gh + gh/6, (obj.y)*gh -gh/6, 24, 3);
  ctx.fillStyle = '#87E82B';
  ctx.fillRect((obj.x)*gh + gh/6, (obj.y)*gh -gh/6, 24 * (obj.healthCur/obj.healthMax), 3);
  ctx.strokeStyle = '#000';
  ctx.strokeRect((obj.x)*gh + gh/6, (obj.y)*gh -gh/6, 24, 3);
}
function teleportManager(){
  this.teleportList = [];
  this.teleportList[0] = {x: 34, y: 12};
  this.teleportList[1] = {x: 34, y: 18};
  this.draw = function(ctx){
    for(var i = 0; i<this.teleportList.length; i++){
      ctx.drawImage(allImages['tp_static'], this.teleportList[i].x*gh, this.teleportList[i].y*gh, 32, 32);
    }
  }
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
  	if(map.world[x][y] >= 1) return {isClear: false, obstacle: {x: x, y: y}};
  }
  return {isClear: true};
}
function OtherPlayer(id, name, level, pos_x, pos_y, healthMax, healthCur, speedCur, img_name, limboState){
	this.id = id;
  this.type = enums.objType.PLAYER;
	this.name = name;
	this.level = level;
	this.x = pos_x;
	this.y = pos_y;
	this.tx = pos_x;
	this.ty = pos_y;
	this.direction = 0;
	this.animStart = frameTime;
	this.moving = false;
	this.speedCur = speedCur;
	this.limboState = limboState;
	this.healthMax = healthMax;
	this.healthCur = healthCur;
	this.isDead = false;
	this.isVisible = true;
	this.isTargeted = false;
  this.lastTime = frameTime;
	this.update = function(){

		this.x += Math.sign(this.tx-this.x) * Math.min((frameTime - this.lastTime)/speedCur, Math.abs(this.tx-this.x));
    this.y += Math.sign(this.ty-this.y) * Math.min((frameTime - this.lastTime)/speedCur, Math.abs(this.ty-this.y));

    if(this.healthCur <=0){
      this.die();
    }

    this.lastTime = frameTime;
	}
	this.draw = function(ctx){
		if(this.x < this.tx)
        this.direction = 3;
      else if(this.x > this.tx)
        this.direction = 2;
      else if(this.y < this.ty)
        this.direction = 0;
      else if(this.y > this.ty)
        this.direction = 1;
    
    if(this.isVisible && this.id != player1.id){
    	ctx.drawImage(allImages[img_name], (this.x)*gh, (this.y)*gh, gh, gh);
      drawHealthBar(this);
    }
    if(this.isTargeted){
      ctx.strokeStyle = "rgba(255, 0, 0, 1)";
      ctx.strokeRect((this.x)*gh, (this.y)*gh, gh, gh);
    }
	}
  this.takeDamage = function(attackerId, damage) {
    if(damage>0)
      entities.newEntity('blood_big', this.tx, this.ty, 15, 2.5);
    popups.push(new numberPopup(this.tx, this.ty, damage, 'damage', 1200));
  }
  this.die = function(){
    delete otherPlayers[this.id];
  }
}
function Inventory(player){
  this.div = $('#win1 .content .slot');
  this.x = this.div.attr("size_x");
  this.y = this.div.attr("size_y");
  this.populate = function(container) {
    while (this.div[0].firstChild)
    this.div[0].removeChild(this.div[0].firstChild);
    var item = 0;
    var newChild = 0;
    for(var i=0; i< this.x; i++){
      for(var j=0; j< this.y; j++){
        item = container[i][j];
        if(item){
          newChild = document.createElement('img');
          $(newChild).makeItem(1, 1, this.div, i, j, item.id, urlDict[item.name].src);

        }
      }
    }
  };
}
// testing into console.
// var inv = new Inventory(player1);
// player1.equipment.backpack.addItem(ifac.createWeapon(5), [0, 1]);
// player1.equipment.backpack.addItem(ifac.createArmor(5), [0, 0]);
// inv.populate(player1.equipment.backpack.contents)
