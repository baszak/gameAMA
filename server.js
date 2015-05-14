var io = require('socket.io')(6767);
var fs = require('fs');
var gameloop = require('node-gameloop');
// require('./foe_server.js');
// require('./player_server.js');
// require('./classes_server.js');
// require('./mobzz.js');


var gh = 32;
var game_size = {w: 32, h: 16};
console.log("Listening on 6767...");
var map = new Map(75, 75);
map.loadCollisions();
var mobzz = [];
var spawner = new MonsterSpawner();
// populateMobs(spawner);
var frameTime = new Date().getTime();
var lastFrame = new Date().getTime();
var clients = {};
var allPlayers = {};
var onlinePlayersData = {};

io.on('connection', function (socket) {
	clients[socket.id] = socket;


	socket.on('player-login-attempt', function (new_player_id){
		console.log('connecting ' + new_player_id + ' ...');
		var playerFound = false;
		for(i in allPlayers){
				if(allPlayers[i].data.id == new_player_id){
					playerFound = true;
					break;
				}
		}
		if(playerFound){
			//pull existing player from database, so he can be updated
			onlinePlayersData[socket.id] = allPlayers[new_player_id].data;
			//just send id for now. later send entire player data
			socket.emit('player-login-success', new_player_id);
		}
		else{
			allPlayers[new_player_id] = new Player(new_player_id, 2, 4);
			onlinePlayersData[socket.id] = allPlayers[new_player_id].data;
			socket.emit('player-login-failure', new_player_id);
		}
	});
  socket.on('players-data-update', function (data) {
  	onlinePlayersData[socket.id] = data;

  });
  socket.on('player-input-move', function (data){
  	var id = onlinePlayersData[socket.id].id;
  	allPlayers[id].move(data.dx, data.dy);
  });
  socket.on('request-map-world', function(){
  	socket.emit('send-map-world', map.world);
  });
  socket.on('disconnect', function () { //crashes when a game was running when server started and disconncted
    delete clients[socket.id];
    	var id = onlinePlayersData[socket.id].id;
    //pull disconnecting player back into database.
    console.log('disconnecting' + id);
    allPlayers[id].data = onlinePlayersData[socket.id];
    //no longer update player that disconnected.
    delete onlinePlayersData[socket.id];
  });
});


var physicsLoop = gameloop.setGameLoop(function(delta){//~66 updates/s = 15ms/update
	frameTime = new Date().getTime();
//server side game physics are all calculated here
//client veirfication goes here
//take client input and process


	for(var i in onlinePlayersData){
		if(!allPlayers[onlinePlayersData[i].id])
			continue;
		allPlayers[onlinePlayersData[i].id].update();
	}
	for(var i=0; i < mobzz.length; i++) mobzz[i].update();
	spawner.update();



	lastFrame = frameTime;
}, 1000/66);

var updateLoop = gameloop.setGameLoop(function(delta){//~22 updates/s = 45ms/update
//all client server comunication goes here
//send game-state to all clients
//emit appropriate map.worldPart
//emit mobs
//emit other player positions - done


	for(var sId in clients)
		io.to(sId).emit('players-data-update', onlinePlayersData);

}, 1000/22);

function Map(h, w){
  this.h = h;
  this.w = w;
  this.world = [[]];
  this.loadCollisions = function(){
    var fileContents;
    fs.readFile('map_16tiles_resized.json', 'utf-8', function (err, data) {
      if (err) throw err;
      data = eval("("+data+")");
      var x, y, h, w;
      for(var o in data.objects){
        h = Math.round(data.objects[o].height/gh);
        w = Math.round(data.objects[o].width/gh);
        x = Math.round(data.objects[o].x/gh);
        y = Math.round(data.objects[o].y/gh);
        for(var i = x; i < (x+w); i++){
          for(var j = y; j < (y+h); j++){
            map.world[i][j] = 1;
          }
        }
      }
    });
    console.log("map collisions loaded");
  }
	this.isValid = function(x, y) {
		return (this.world[x][y] == 0);
	}
	this.occupy = function(x, y){
    this.world[x][y] = 1;
  }
  this.free = function(x, y){
    this.world[x][y] = 0;
  }
  for (var x=-1; x < w+1; x++) {
    this.world[x] = [];
    for (var y=-1; y < h+1; y++)
      if(x == -1 || x == w)
        this.world[x][y] = 1;
      else if(y == -1 || y == h+1)
        this.world[x][y] = 1;
      else
        this.world[x][y] = 0;
  }
}


function MonsterSpawner(){//server only
  var k = 0;
  this.spawns = [];

  this.createSpawn = function(foe_class, spawn_x, spawn_y, respawn_time) {
    this.spawns.push({
      foe_class: foe_class,
      spawn_x: spawn_x,
      spawn_y: spawn_y,      
      foe: null,
      died_at: frameTime,
      respawn_time: respawn_time
    });
  }
  this.update = function(){
    for(var i = 0; i < this.spawns.length; i++) {
      if(!this.spawns[i].foe && frameTime - this.spawns[i].died_at > this.spawns[i].respawn_time*1000) {
        this.spawns[i].foe = new this.spawns[i].foe_class(k++,this.spawns[i].spawn_x,this.spawns[i].spawn_y)        
        mobzz.push(this.spawns[i].foe);
      }else if(this.spawns[i].foe && this.spawns[i].foe.isDead) {
        this.spawns[i].died_at = frameTime;
        this.spawns[i].foe = null;
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
function Player(id, spawn_x, spawn_y){
  this.data = {
    id: id || 1,
    name : "Playerino",
    //player resources
  	x: spawn_x,
  	y: spawn_y,
    tx: spawn_x,
    ty: spawn_y,
    direction: 0,
    //rpg shit
    level : 1,
    experience : 0,
    expPenalty: 0,
    strength: 1,
    agility: 1,
    intelligence : 1,
    attrPoints: 0,
    skillPoints: 0,
    healthMax: 100,
    healthCur: 100,
    manaMax: 900,
    manaCur: 900,
    healthRegen: 0,
    manaRegen: 300,
    mmr: 1400,
    speedBase: 400,
    speedCur: 400,
    critChance: 0.5,
    critDamage: 1,
    //other shit
    moveValid: 1,
    isVisible: true,
    limboState: false,
    dying: false,
    deathTime: frameTime,
    moveQ: new MovementQueue(),
    animStart: frameTime,
    lastAttack: frameTime,
    attackCooldown: 800,
    exhausted: 0,
    buffTimer: 0,
    damageInfo: {totalDamage: 0},
    skills: [
      {cooldown: 0, action: 0},
      {cooldown: 0, action: 0},
      {cooldown: 0, action: 0},
      {cooldown: 0, action: 0}
    ],
    equipment: {  primary: {damageMin: 1, damageMax: 5, damageMod: 0, dmgOverTime: 0, speedMod: 0, type: "sword", range: 1.45},// o()XXXX[{::::::::::::::>
                        secondary: {damageMin: 1, damageMax: 3, damageMod: 0.11, dmgOverTime: 0.12, speedMod: 0, type: "sword", range: 1.45}, // ¤=[]:::;;>
                        body: {},
                        legs: {},
                        boots: {speedMod: 0.6},
                        head: {},
                        backpack: []
                      }
  }
	this.update = function(){
    this.data.ax = (this.data.tx - this.data.x) * (frameTime - this.data.animStart) / this.data.speedCur;
    this.data.ay = (this.data.ty - this.data.y) * (frameTime - this.data.animStart) / this.data.speedCur;
    
    if (Math.abs(this.data.ax) >= 1) {
      this.data.moving = false;
      this.data.x = this.data.tx;
      this.data.ax = 0;
    }
    if (Math.abs(this.data.ay) >= 1) {
      this.data.moving = false;
      this.data.y = this.data.ty;
      this.data.ay = 0
    }
    
    if(!this.data.moving) {
      var nextMove = this.data.moveQ.getMove();
      if(nextMove) {
        if(!map.isValid(nextMove[0], nextMove[1]) && this.data.moveQ.getLength() > 0){
          this.data.moveQ.findPath(this.data.x, this.data.y, clientX, clientY);
          nextMove = this.data.moveQ.getMove();
        }
        if(nextMove && map.isValid(nextMove[0], nextMove[1])) {
          this.data.animStart = frameTime;
          this.data.moving = true;
          map.free(this.data.x, this.data.y);
          this.data.tx = nextMove[0]
          this.data.ty = nextMove[1]
          map.occupy(this.data.tx, this.data.ty);
        }
      }
    }

    updateStats(this.data);
    if(this.data.experience<0) this.data.experience = 0;//into level up function soon
    

    //handling regen. to be rewritten into ticks? maybe regen every sec to avoid floats
    this.data.manaCur = Math.min(this.data.manaMax, this.data.manaCur + (frameTime - lastFrame)/1000*this.data.manaRegen);
    this.data.healthCur = Math.min(this.data.healthMax, this.data.healthCur + (frameTime - lastFrame)/1000*this.data.healthRegen);
  }
  this.move = function(dx, dy, dir){
    if(map.isValid(this.data.tx + dx, this.data.ty + dy))
      this.data.moveQ.queueMove(this.data.tx + dx, this.data.ty + dy);
  }
  this.attack = function(){ //autoattacks with primary hand
    if(!this.data.limboState){
      if(frameTime - this.data.lastAttack > (this.data.attackCooldown * (1 - (this.data.equipment.primary.speedMod + this.data.equipment.secondary.speedMod))) && targetedMob && dist(this.data,targetedMob)<this.data.equipment.primary.range){
        var damage = calcDamage(this.data, targetedMob)
        missiles.push(new AttackAnimation(targetedMob, this.data, this.data.equipment.primary.type));
        targetedMob.takeDamage(this.data, damage);
        this.data.lastAttack = frameTime;
      }
    }
  }
  this.takeDamage = function(attacker, damage, debuff){
    if(attacker instanceof Shroom)
      this.data.isDrugged = true;
    var dmg = Math.min(damage, this.data.healthCur);

    popups.push(new numberPopup(this.data, Math.round(dmg), 'damage', 1200));
    
    this.data.healthCur -= dmg;
    this.data.attacker = attacker.id;

    this.data.damageInfo[this.data.attacker] = this.data.damageInfo[this.data.attacker] || 0;
    this.data.damageInfo[this.data.attacker] += dmg;
    this.data.damageInfo.totalDamage += dmg;

    if(this.data.healthCur <= 0 && !this.data.isDead){
      this.die();
    }
  }
  this.die = function(){
    this.data.deathTime = new Date().getTime();
    this.data.isDrugged = false;
    webFilter.die();
    this.data.dying = true;
    this.data.limboState = true;
    this.data.isVisible = false;
  }
  this.slot_1 = function(){
    if(playerIsReady(this.data, 8, 200)){
      if(this.data.skills[0].cooldown <= frameTime || this.data.skills[0].cooldown == 0)
        this.data.skills[0].action = missiles.push(new Fireball(targetedMob, 0));
      else
        statusMessage.showMessage("You are exhausted! ", 1000);
    }
  }
  this.slot_2 = function(){
    if(playerIsReady(this.data, 6, 200)){
      if(this.data.skills[1].cooldown <= frameTime || this.data.skills[1].cooldown == 0)
        this.data.skills[1].action = missiles.push(new RocketLauncher(targetedMob, 1));
      else
        statusMessage.showMessage("You are exhausted! ", 1000);
    }
  }

  this.slot_3 = function(){
    if(this.data.exhausted > frameTime) {
      statusMessage.showMessage("You are exhausted! " + (this.data.exhausted-frameTime) + "ms left", 1000);
    } else if(this.data.manaCur <600){
      statusMessage.showMessage("Not enough mana!", 1000);
    } else {
      this.data.manaCur -= 600;
      missiles.push(new Explosion());
    }
  }
  this.slot_4 = function(){ //dev's regen hp
    if(this.data.exhausted > frameTime) {
      statusMessage.showMessage("You are exhausted! " + (this.data.exhausted-frameTime) + "ms left", 1000);
    } else if(this.data.manaCur < 100){
      statusMessage.showMessage("Not enough mana!", 1000);
    } else if(this.data.speedBase == this.data.speedCur){
      this.data.buffTimer = new Date().getTime();
      this.data.manaCur -= 100;
      this.data.exhausted = frameTime + 500;
      this.data.speedCur *= 0.35;
      webFilter.clearFilters();
    } else{
      this.data.buffTimer = new Date().getTime();
      this.data.manaCur -= 60;
      this.data.healthCur += 50;
      this.data.speedCur *= 0.35;
      this.data.exhausted = frameTime + 500;
      this.data.buffTimer += 12000;
      webFilter.clearFilters();
    }
    var healValue = Math.min(this.data.healthMax-this.data.healthCur, 230);
    this.data.healthCur += healValue;
    popups.push(new numberPopup(this.data, healValue, 'heal', 1200));
  }
  this.slot_5 = function(){

  }
}
function Foe(name, url, id, spawn_x, spawn_y, mobile, spriteX, spriteY, spriteN){
  this.img = new Image();
  this.img.src = url;
	this.name = name;
  this.id = id;
  this.x = spawn_x || 10;
  this.y = spawn_y || 10;
  this.spawnPoint = {x: spawn_x, y: spawn_y};
  this.healthMax = 100;
  this.healthCur = this.healthMax;
  this.exp = 85;
  this.mmr = 1400;
  this.speed = 600;
  this.type = 1;
  this.moveInterval = 1500;
  this.tx = this.x;
  this.ty = this.y;
  this.mobile = mobile;
  this.moveQ = new MovementQueue();
  this.aggro = false;
  this.aggroRange = 4;
  this.leeshTimer = frameTime;
  this.animStart = frameTime;
  this.animationSpeed = 200;
  this.spriteX = spriteX || 84; 
  this.spriteY = spriteY || 84;
  this.spriteN = spriteN || 8; //number of animation frames
  this.lastMoved = frameTime;
  this.lastAttack = frameTime;
  this.attackCooldown = 1750;
  this.damageInfo = {totalDamage: 0};
  this.damageMin = 15;
  this.damageMax = 45;
  this.defenseRating = 0;
  this.loot = {gold: 0, silver: 0, copper: Math.floor(Math.random()*100)%25};
  
  map.occupy(this.x, this.y);

	this.update = function(){
    // var kara = Math.sqrt((this.tx - this.x)*(this.tx - this.x) + (this.ty - this.y)*(this.ty - this.y));
    // kara = kara || 1;
    var kara = 1;
    this.ax = (this.tx - this.x) * (frameTime - this.animStart) / this.speed / kara;
    this.ay = (this.ty - this.y) * (frameTime - this.animStart) / this.speed / kara;
    
    if (Math.abs(this.ax) >= 1) {
      this.moving = false;
      this.x = this.tx;
      this.ax = 0;
    }
    
    if (Math.abs(this.ay) >= 1) {
      this.moving =  false;
      this.y = this.ty;
      this.ay = 0;
    }
    this.aggroCheck();
    this.move();
    this.attack();
    return this;
	}
  
	this.rlyMove = function(tx,ty){
    this.animStart = frameTime;
    this.moving = true;
    map.free(this.x, this.y);
    this.tx = tx; this.ty = ty;
    map.occupy(this.tx, this.ty);
  }
  this.move = function(){
    if(!this.mobile) return;
    
    if(this.aggro){
        if(!this.moving){
          this.moveQ.findPath(this.tx, this.ty, players[0].tx, players[0].ty);
          if(!this.moveQ.getLength())
            this.aggro = false;
          if(Math.max(Math.abs(this.ty-players[0].ty),Math.abs(this.tx-players[0].tx))>1){
            var nextMove;
            if((nextMove = this.moveQ.getMove())){
              this.rlyMove(nextMove[0],nextMove[1]);
            }
          }
        }
      }

    if(!this.aggro) this.passiveMovement();    
  }
  this.passiveMovement = function(){
    if(frameTime-this.lastMoved > this.moveInterval){
      if(Math.random()<0.5){
        var cx = (Math.random() < (this.x - spawn_x + 4)/8)?1:-1;
        if(map.isValid(this.x-cx, this.y)){
          if(!this.moving){
            this.rlyMove(this.x - cx,this.ty);
          }
        }
      }
      else{
        var cy = (Math.random() < (this.y - spawn_y + 4)/8)?1:-1;
        if(map.isValid(this.x, this.y-cy)){
          if(!this.moving){
            this.rlyMove(this.tx,this.y - cy);
          }
        }
      }
      this.lastMoved = frameTime;
    }
    return this;
  }
  this.aggroCheck = function(){
    if(this.type == 0){ //passive

    }
    else if(this.type == 1){ //aggressive
      if(dist(this, players[0])<this.aggroRange && players[0].isVisible){
        this.aggro = true;
        this.leeshTimer = new Date().getTime();
      }
      if(frameTime - this.leeshTimer > 5000 && dist(this.spawnPoint, players[0]) > 10){
        this.aggro = false;
      }
      if(!players[0].isVisible)
        this.aggro = false;
    }

  }
  this.attack = function(){
    if(this.aggro && frameTime - this.lastAttack > this.attackCooldown && dist(players[0], this)<1.45){
      var damage = Math.round((Math.random()*100) % (this.damageMax-this.damageMin) + this.damageMin);
      players[0].takeDamage(this, damage);
      this.onHit();
      this.lastAttack = frameTime;
    }
  }
  this.onHit = function(){
  }
	this.sound = function(){
		ogre_squeal.currentTime = 0;
		ogre_squeal.play();
	}
  this.takeDamage = function(attacker, damage, debuff){
    this.damage = Math.min(damage, this.healthCur);
    
    this.aggro = true;
    this.leeshTimer = new Date().getTime();

    popups.push(new numberPopup(this, this.damage, 'damage', 1200));
    
    this.healthCur -= this.damage;
    this.damageInfo[attacker.id] = this.damageInfo[attacker.id] || 0;
    this.damageInfo[attacker.id] += this.damage;
    this.damageInfo.totalDamage += this.damage;

    if(this.healthCur <= 0)
      this.die(attacker);
  }
  this.die = function(killer){//do kurwy dlaczego to jest tutaj -Adam
    for(var i=0; i<mobzz.length; i++){
      if(mobzz[i] == this){
        for(var j = 0; j<players.length; j++){
          var exp = 0.5 * this.exp * (this.damageInfo[players[j].id]/this.damageInfo.totalDamage) + (players[j]==killer?0.5*this.exp:0);
          if(!exp) continue;
          exp = Math.floor(exp);
          players[j].experience += exp;
          popups.push(new numberPopup(players[j], exp, 'exp', 1800));
        }
        mobzz.splice(i,1);
        map.free(this.tx, this.ty);
        this.dropLoot();
        if(this.id == targetedMob.id)
          targetedMob = 0;
        this.isDead = true;
      }
    }
  }
  this.dropLoot = function(){
    entities.newEntity(this.id, this.tx, this.ty, this.loot);
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
	player.speedCur = player.speedCur>=80?Math.round(player.speedBase * player.equipment.boots.speedMod):80;//speed cap at 80.less is faster
}