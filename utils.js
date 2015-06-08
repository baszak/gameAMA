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
	player.speedCur = player.speedCur>=80?Math.round(player.speedBase * (1-player.equipment.boots.speedMod)):80;//speed cap at 80.less is faster
}
function levelUp(player){
	player.level++;
	if(player.level>9)
		player.skillPoints++;
	player.attrPoints += 3;
	player.speedBase = 600 - 0.9*(player.level - 1);
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
/*function drawPlayers(ctx){
	if(!player1.ready) return;
	for(var sId in server_dataBuffer[0]){
	      // if(server_onlinePlayersData[sId].id == player1.data.id)//skip drawing player locally
	      //   continue;
	      var that = server_dataBuffer[0][sId];//current iteration player.data


	      if(that.x < that.tx)
	        that.direction = 3;
	      else if(that.x > that.tx)
	        that.direction = 2;
	      else if(that.y < that.ty)
	        that.direction = 0;
	      else if(that.y > that.ty)
	        that.direction = 1;

	      ctx.drawImage(player1.img_knight_green, that.direction*16, 0, 16, 16, (that.x + that.ax)*gh, (that.y + that.ay)*gh, gh, gh);
  }
}*/
function OtherPlayer(id, name, level, pos_x, pos_y, healthMax, healthCur, speedCur, img_url, limboState){
	this.img = new Image();
	this.img.src = img_url || 'img/knight_green.png';
	this.data = {
		id: id,
		name: name,
		level: level,
		x: pos_x,
		y: pos_y,
		tx: pos_x,
		ty: pos_y,
		ax: 0,
		ay: 0,
		last_ax: 0,
		last_ay: 0,
		direction: 0,
		animStart: frameTime,
		moving: false,
		speedCur: speedCur*0.8,
		limboState: limboState || false,
		healthMax: healthMax,
		healthCur: healthCur,
		moveBuffer: [],
		isVisible: true
	}
  this.lastTime = frameTime;
	this.update = function(){
		/*if(!this.data.moving){
			for(var i=0; i<this.data.moveBuffer.length; i++){
				if(this.data.tx == this.data.moveBuffer[0].tx && this.data.ty == this.data.moveBuffer[0].ty)
					this.data.moveBuffer.shift();
				else{
					this.data.tx = this.data.moveBuffer[0].tx;
					this.data.ty = this.data.moveBuffer[0].ty;
					this.data.animStart = frameTime;
					this.data.moving = true;
				}
			}
		}*/

		//this.data.ax += (this.data.tx - this.data.x) * (frameTime - this.data.animStart) / this.data.speedCur;
    //this.data.ay += (this.data.ty - this.data.y) * (frameTime - this.data.animStart) / this.data.speedCur;

    if (Math.abs(this.data.x-this.data.tx) < 0.05) {
      this.data.x = this.data.tx;
    }else{
    this.data.x += Math.sign(this.data.tx-this.data.x) * (frameTime - this.lastTime)/400;
    }
    if (Math.abs(this.data.y-this.data.ty) < 0.05) {
      this.data.y=this.data.ty;
    
    }else{
    this.data.y += Math.sign(this.data.ty-this.data.y) * (frameTime - this.lastTime)/400;
    }
    
    /*if (Math.abs(this.data.ax) >= 1) {
      this.data.moving = false;
      this.data.x = this.data.tx;
      this.data.ax = 0;
    }
    if (Math.abs(this.data.ay) >= 1) {
      this.data.moving = false;
      this.data.y = this.data.ty;
      this.data.ay = 0
    }*/
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
    
    if(this.data.limboState){
      // ctx.drawImage(this.img_limbo, this.data.direction*32, 0, 32, 32, (this.data.x+this.data.ax)*gh, (this.data.y+this.data.ay)*gh, gh, gh);
    }
    else
      ctx.drawImage(this.img, this.data.direction*16, 0, 16, 16, (this.data.x+this.data.ax)*gh, (this.data.y+this.data.ay)*gh, gh, gh);
	}
}
