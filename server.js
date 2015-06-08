var io = require('socket.io')(6767);
var fs = require('fs');
var gameloop = require('node-gameloop');
var findPath = require('./astar_server.js');
// var Player = require('./player_server.js');
// var foe = require('./foe_server.js');
// require('./player_server.js');
// require('./classes_server.js');
// require('./mobzz.js');


var gh = 32;
var game_size = {w: 32, h: 16};
var frameTime = new Date().getTime();
var lastFrame = new Date().getTime();
console.log("Listening on 6767...");
var map = new Map(75, 75);
map.loadCollisions();
var mobzz = [];
var spawner = new MonsterSpawner();
spawner.populateMobs();
var allPlayers = {};
var onlinePlayersData = {};

io.on('connection', function (socket) {


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
      //just send id for now. later send entire player data
      io.to(socket.id).emit('player-login-success', {id: new_player_id, playerData: allPlayers[new_player_id]});
    }
    else{
      allPlayers[new_player_id] = new Player(new_player_id, 2, 4);
      io.to(socket.id).emit('player-login-failure', {id: new_player_id, playerData: allPlayers[new_player_id]});
    }
      onlinePlayersData[socket.id] = allPlayers[new_player_id].data;

    //notify all players that a player connected
    for(var sId in onlinePlayersData)
      io.to(sId).emit('player-connected', {id: socket.id, playerData: onlinePlayersData[socket.id]});
    //connecting player gets onlinePlayersData initially
    var export_mobs = {};
    var mobsSent = 0;
    for(var i in mobzz){
      if(!neighbourChunk(onlinePlayersData[socket.id].chunk, mobzz[i].chunk))
        continue;
      export_mobs[i] = [];
      export_mobs[i][0] = mobzz[i].tx;
      export_mobs[i][1] = mobzz[i].ty;
      export_mobs[i][2] = mobzz[i].healthMax;
      export_mobs[i][3] = mobzz[i].healthCur;
      export_mobs[i][4] = mobzz[i].speed;
      export_mobs[i][5] = mobzz[i].name;
      export_mobs[i][6] = mobzz[i].id;
      mobsSent++;
    }
    io.to(socket.id).emit('player-initiate-current-objects', {players: onlinePlayersData, mobs: export_mobs, mobsSent: mobsSent});

  });
  socket.on('ping', function(data){
    io.to(socket.id).emit('ping back', data);
    console.log(onlinePlayersData[socket.id].x, onlinePlayersData[socket.id].y);
    console.log(mobzz.length)
  });
  socket.on('player-input-move', function (data){
    if(onlinePlayersData.hasOwnProperty(socket.id)){//i shouldn't have to check that
      var id = onlinePlayersData[socket.id].id;
      allPlayers[id].move(data.x, data.y);
    }
  });
  socket.on('request-map-world', function(){
    socket.emit('send-map-world', map.world);
  });
  socket.on('disconnect', function () {
    if(onlinePlayersData.hasOwnProperty(socket.id)){
      var id = onlinePlayersData[socket.id].id;
      //pull disconnecting player back into database.
      console.log('disconnecting' + id);
      map.free(allPlayers[id].data.tx, allPlayers[id].data.ty);
      //no longer update player that disconnected.
      delete onlinePlayersData[socket.id];
    }
    for(var sId in onlinePlayersData)//tell all cleints that this socket.id is no more
      io.to(sId).emit('player-disconnected', socket.id);
  });
});
function emitSpawning(foe){
  for(var sId in onlinePlayersData){
    if(!neighbourChunk(onlinePlayersData[sId].chunk, foe.chunk)) continue;
    var export_array = [];
    export_array[0] = foe.tx;
    export_array[1] = foe.ty;
    export_array[2] = foe.healthMax;
    export_array[3] = foe.healthCur;
    export_array[4] = foe.speed;
    export_array[5] = foe.name;
    export_array[6] = foe.id;
    io.to(sId).emit('mob-spawned', export_array);
  }
}


var physicsLoop = gameloop.setGameLoop(function(delta){//~66 updates/s = 15ms/update
  frameTime = new Date().getTime();
  //server side game physics are all calculated here
  //client veirfication goes here
  //take client input and process


  for(var sId in onlinePlayersData){
    if(!allPlayers[onlinePlayersData[sId].id])
      continue;
    allPlayers[onlinePlayersData[sId].id].update();
  }

  spawner.update();
  for(var i=0; i < mobzz.length; i++) mobzz[i].update();



  lastFrame = frameTime;
}, 1000/60);

var updateLoop = gameloop.setGameLoop(function(delta){//~22 updates/s = 45ms/update
  //all client server comunication goes here
  //send game-state to all clients
  //emit appropriate map.worldPart
  //emit mobs
  //emit other player positions
  var export_mobs = {};
  for(var i in mobzz){
    export_mobs[i] = [];
    export_mobs[i][0] = mobzz[i].tx;
    export_mobs[i][1] = mobzz[i].ty;
    export_mobs[i][2] = mobzz[i].healthMax;
    export_mobs[i][3] = mobzz[i].healthCur;
    export_mobs[i][4] = mobzz[i].speed;
    export_mobs[i][5] = mobzz[i].name;
    export_mobs[i][6] = mobzz[i].id;
  }
  for(var sId in onlinePlayersData)
    io.to(sId).emit('players-data-update', {playersData: onlinePlayersData, mobs: export_mobs, timeStamp: frameTime});

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
  var curId = 0;
  this.spawns = [];
  this.populateMobs = function(){
  // for(var i = 0; i< 10000; i++)
  this.createSpawn(Bat, 7, 9, 2);
  this.createSpawn(BigBat, 19, 18, 8);
  this.createSpawn(BigBat, 12, 20, 8);
  this.createSpawn(BigBat, 12, 9, 8);
  // this.createSpawn(Shroom, 33, 6, 8);
}
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
        this.spawns[i].foe = new this.spawns[i].foe_class(curId++,this.spawns[i].spawn_x,this.spawns[i].spawn_y)        
        console.log('pushing ' + this.spawns[i].foe.name + ' to mobzz');
        mobzz.push(this.spawns[i].foe);
        emitSpawning(this.spawns[i].foe);
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
    ax: 0,
    ay: 0,
    chunk: [Math.floor(spawn_x/game_size.w), Math.floor(spawn_y/game_size.h)],
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
                        boots: {speedMod: 1},
                        head: {},
                        backpack: []
                      }
  }
  console.log(this.data.chunk[0], this.data.chunk[1])
  this.update = function(){
    this.data.lastChunk = this.data.chunk;
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
      this.data.ay = 0;
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
          this.data.tx = nextMove[0];
          this.data.ty = nextMove[1];
          map.occupy(this.data.tx, this.data.ty);
          console.log('player ' + this.data.id + ' moved to: ' + this.data.tx + ', ' + this.data.ty);
        }
      }
    }

    updateStats(this.data);
    if(this.data.experience<0) this.data.experience = 0;//into level up function soon
    

    //handling regen. to be rewritten into ticks? maybe regen every sec to avoid floats
    this.data.manaCur = Math.min(this.data.manaMax, this.data.manaCur + (frameTime - lastFrame)/1000*this.data.manaRegen);
    this.data.healthCur = Math.min(this.data.healthMax, this.data.healthCur + (frameTime - lastFrame)/1000*this.data.healthRegen);

    this.data.chunk[0] = Math.floor(this.data.tx/32);
    this.data.chunk[1] = Math.floor(this.data.ty/16);
  }
  this.move = function(dx, dy, dir){
    if(map.isValid(this.data.tx + dx, this.data.ty + dy))
      this.data.moveQ.queueMove(this.data.tx + dx, this.data.ty + dy);
  }
  this.attack = function(){ //rewrite to serverside
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
function Foe(name, url, id, spawn_x, spawn_y, mobile, spriteX, spriteY, spriteN){//need to make separate check for player and other mobs positions regarding collisions
  this.imgUrl = url;
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
  this.chunk = [];
  this.chunk[0] = Math.floor(this.tx/game_size.w),
  this.chunk[1] = Math.floor(this.ty/game_size.h),
  this.mobile = mobile;
  this.moveQ = new MovementQueue();
  this.targetId;
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
    this.chunk[0] = Math.floor(this.tx/32);
    this.chunk[1] = Math.floor(this.ty/16);
    return this;//why?
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
          this.moveQ.findPath(this.tx, this.ty, allPlayers[this.targetId].data.tx, allPlayers[this.targetId].data.ty);
          if(!this.moveQ.getLength())
            this.aggro = false;
          if(Math.max(Math.abs(this.ty-allPlayers[this.targetId].data.ty),Math.abs(this.tx-allPlayers[this.targetId].data.tx))>1){
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
      var cx=0, cy=0;
      if(Math.random()<0.5)
        cx = (Math.random() < (this.x - this.spawnPoint.x + 4)/8)?1:-1;
      else
        cy = (Math.random() < (this.y - this.spawnPoint.y + 4)/8)?1:-1;
      if(map.isValid(this.x-cx, this.y-cy)){
          if(!this.moving){
            this.rlyMove(this.x - cx, this.ty -cy);
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
      if(this.targetId){//check if target is lost
        if(!allPlayers[this.targetId].data.isVisible){//that only means player is dead. for now.
          this.targetId = null;
          this.aggro = false;
        }
        else if(frameTime - this.leeshTimer > 5000 && dist(this.spawnPoint, allPlayers[this.targetId].data) > 10){
          this.targetId = null;
          this.aggro = false;
        }
      }
      else{//no target -> look for target
        for(var i in onlinePlayersData){
          var id = onlinePlayersData[i].id;
          if(!allPlayers[id]) continue;
          if(dist(this, allPlayers[id].data) < this.aggroRange && allPlayers[id].data.isVisible){
            this.aggro = true;
            this.targetId = id;
            this.leeshTimer = new Date().getTime();
            break;
          }
        }
      }
    }
  }
  this.attack = function(){
    if(this.aggro && frameTime - this.lastAttack > this.attackCooldown && dist(allPlayers[this.targetId].data, this)<1.45){
      var damage = Math.round((Math.random()*100) % (this.damageMax-this.damageMin) + this.damageMin);
      allPlayers[this.targetId].takeDamage(this, damage);
      this.onHit();
      this.lastAttack = frameTime;
    }
  }
  this.onHit = function(){
    //only triggered in this.attack() above
  }
  this.sound = function(){

  }
  this.takeDamage = function(attackerId, damage, debuff){
    var damageTaken = Math.min(damage, this.healthCur);
    
    this.aggro = true;
    this.leeshTimer = new Date().getTime();

    this.healthCur -= damageTaken;
    this.damageInfo[attackerId] = this.damageInfo[attackerId.id] || 0;
    this.damageInfo[attackerId] += damageTaken;
    this.damageInfo.totalDamage += damageTaken;

    if(this.healthCur <= 0)
      this.die(attackerId);
  }
  this.die = function(killerId){
    for(var i=0; i<mobzz.length; i++){
      if(mobzz[i] == this){
        mobzz.splice(i,1);
        map.free(this.tx, this.ty);
        this.dropExperience(killerId);
        this.dropLoot();
        this.isDead = true;
      }
    }
  }
  this.dropExperience = function(killerId){
    for(var id in this.damageInfo){
          var exp = 0.5 * this.exp * (this.damageInfo[id]/this.damageInfo.totalDamage) + (allPlayers[id].data.id==killerId?0.5*this.exp:0);
          if(!exp) continue;
          exp = Math.floor(exp);
          allPlayers[id].data.experience += exp;
        }
  }
  this.dropLoot = function(){
    // entities.newEntity(this.id, this.tx, this.ty, this.loot);
  }
}

function neighbourChunk(p_c, o_c){
  return (o_c[0] >= p_c[0]-1 && o_c[0] <= p_c[0]+1 && o_c[1] >= p_c[1]-1 && o_c[1] <= p_c[1]+1)?true:false;
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

// ******************  UTILS
function dist(a, b) {
  return Math.sqrt((a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y));
}

//************   MOBS ****************//
function Ahmed(id, spawn_x, spawn_y){
  Foe.call(this,'Ahmed','img/ahmed_sprite.png',id,spawn_x,spawn_y,true);
}
Ahmed.prototype = Object.create(Foe.prototype);
Ahmed.prototype.constructor = Ahmed;


function BigBat(id, spawn_x, spawn_y){
  Foe.call(this,'BigBat','img/bat_sprite_big.png',id,spawn_x,spawn_y,true);
  this.healthMax = 800;
  this.healthCur = 800;
  this.exp = 1200;
  this.speed -= 130;
  this.damageMin = 85;
  this.damageMax = 245;
  this.defenseRating = 9;
}
BigBat.prototype = Object.create(Foe.prototype);
BigBat.prototype.constructor = BigBat;


function Bat(id, spawn_x, spawn_y){
  Foe.call(this,'Bat','img/bat_sprite.png',id,spawn_x,spawn_y,true);
  this.healthMax = 20;
  this.healthCur = 20;
  this.exp = 1000;
  this.damageMin = 0;
  this.damageMax = 6;
  this.defenseRating = 2;
}
Bat.prototype = Object.create(Foe.prototype);
Bat.prototype.constructor = Bat;


function Ogre(id, spawn_x, spawn_y){
  Foe.call(this,'Ogre','img/ogre_sprite.png',id,spawn_x,spawn_y,true);
}
Ogre.prototype = Object.create(Foe.prototype);
Ogre.prototype.constructor = Ogre;


function Goblin(id, spawn_x, spawn_y){
  Foe.call(this,'Goblin','img/goblin_sprite.png',id,spawn_x,spawn_y,true);
}
Goblin.prototype = Object.create(Foe.prototype);
Goblin.prototype.constructor = Goblin;


function Dummy(id, spawn_x, spawn_y){
  Foe.call(this,'Dummy','img/training_dummy.png',id,spawn_x,spawn_y,false);
  this.draw = function(ctx){
    ctx.drawImage(this.img, (this.x + this.ax)*gh, (this.y + this.ay)*gh, gh, gh);
  }
}
Dummy.prototype = Object.create(Foe.prototype);
Dummy.prototype.constructor = Dummy;

function Shroom(id, spawn_x, spawn_y){
  Foe.call(this,'Shroom','img/shroom_sprite.png',id,spawn_x,spawn_y,false, 25, 24, 10);
}
Shroom.prototype = Object.create(Foe.prototype);
Shroom.prototype.constructor = Shroom;