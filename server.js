var io = require('socket.io')(6767);
var fs = require('fs');
var gameloop = require('node-gameloop');
var findPath = require('./astar_server.js');
// var calcLineOfSight = require('./bresenhams_server.js');
// var Player = require('./player_server.js');
// var foe = require('./foe_server.js');
// require('./player_server.js');
// require('./classes_server.js');
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
    if(allPlayers.hasOwnProperty(new_player_id)){
      io.to(socket.id).emit('player-login-success', {id: new_player_id, playerData: allPlayers[new_player_id]});
    }
    else{
      allPlayers[new_player_id] = new Player(new_player_id, 2, 4);
      io.to(socket.id).emit('player-login-failure', {id: new_player_id, playerData: allPlayers[new_player_id]});
    }
      onlinePlayersData[socket.id] = allPlayers[new_player_id].data;
      allPlayers[new_player_id].socket = socket.id;

    //notify all players that a player connected
    for(var sId in onlinePlayersData){
      var export_data = {};
      var o = onlinePlayersData[socket.id];
      export_data.id = o.id;
      export_data.level = o.level;
      export_data.x = o.tx;
      export_data.y = o.ty;
      export_data.healthMax = o.healthMax;
      export_data.healthCur = o.healthCur;
      export_data.speedCur = o.speedCur;
      export_data.name = o.name;
      io.to(sId).emit('player-connected', export_data);
    }
    //connecting player gets onlinePlayersData initially
    var export_mobs = {};
    for(var i in mobzz){
      if(!neighbourChunk(onlinePlayersData[socket.id].chunk, mobzz[i].chunk))
        continue;
      export_mobs[i] = {};
      export_mobs[i].tx = mobzz[i].tx;
      export_mobs[i].ty = mobzz[i].ty;
      export_mobs[i].healthMax = mobzz[i].healthMax;
      export_mobs[i].healthCur = mobzz[i].healthCur;
      export_mobs[i].speed = mobzz[i].speed;
      export_mobs[i].name = mobzz[i].name;
      export_mobs[i].id = mobzz[i].id;
    }
    var export_players = {};
    for(var sId in onlinePlayersData){
      if(!neighbourChunk(onlinePlayersData[socket.id].chunk, onlinePlayersData[sId].chunk))
        continue;
      export_players[sId] = {};
      export_players[sId].id = onlinePlayersData[sId].id;
      export_players[sId].level = onlinePlayersData[sId].level;
      export_players[sId].x = onlinePlayersData[sId].x;
      export_players[sId].y = onlinePlayersData[sId].y;
      export_players[sId].healthMax = onlinePlayersData[sId].healthMax;
      export_players[sId].healthCur = onlinePlayersData[sId].healthCur;
      export_players[sId].speedCur = onlinePlayersData[sId].speedCur;
      export_players[sId].name = onlinePlayersData[sId].name;
    }
    io.to(socket.id).emit('player-initiate-current-objects', {players: export_players, mobs: export_mobs});

  });
  socket.on('ping', function(data){
    io.to(socket.id).emit('ping back', data);
    for(var i=0; i<mobzz.length; i++){
      console.log('id: '+ mobzz[i].id + ' i' + i)
    }
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
      for(var sId in onlinePlayersData)//tell all clients that this id is no more
        io.to(sId).emit('player-disconnected', onlinePlayersData[socket.id].id);
      //no longer update player that disconnected.
      delete onlinePlayersData[socket.id];
    }
  });
  socket.on('player-attack', function (data){
    if(data.type == 1){
      var id = onlinePlayersData[socket.id].id;
      allPlayers[id].attack(data.id, data.type);
    }
  });
});
function emitSpawning(foe){
  for(var sId in onlinePlayersData){
    if(!neighbourChunk(onlinePlayersData[sId].chunk, foe.chunk)) continue;
    var export_mob = {};
    export_mob.tx = foe.tx;
    export_mob.ty = foe.ty;
    export_mob.healthMax = foe.healthMax;
    export_mob.healthCur = foe.healthCur;
    export_mob.speed = foe.speed;
    export_mob.name = foe.name;
    export_mob.id = foe.id;
    io.to(sId).emit('mob-spawned', export_mob);
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

  var export_players = {};
  for(var sId in onlinePlayersData){
    if(!onlinePlayersData[sId]) continue;
    var id = onlinePlayersData[sId].id;
    export_players[id] = {};
    export_players[id].id = allPlayers[id].data.id;
    export_players[id].healthCur = allPlayers[id].data.healthCur;
  }
  var export_mobs = {};
  for(var i in mobzz){
    export_mobs[i] = {};
    export_mobs[i].tx = mobzz[i].tx;
    export_mobs[i].ty = mobzz[i].ty;
    export_mobs[i].healthMax = mobzz[i].healthMax;
    export_mobs[i].healthCur = mobzz[i].healthCur;
    export_mobs[i].speed = mobzz[i].speed;
    export_mobs[i].name = mobzz[i].name;
    export_mobs[i].id = mobzz[i].id;
  }
    io.to(sId).emit('data-update', {mobs: export_mobs, players: export_players});
}, 1000/16);

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
    this.world[x][y] = 0.5;
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
  // for(var i = 0; i< 100; i++)
  this.createSpawn(Bat, 7, 9, 2);
  this.createSpawn(Bat, 19, 18, 8);
  this.createSpawn(Bat, 12, 20, 8);
  this.createSpawn(Bat, 12, 9, 8);
  this.createSpawn(Stonoga, 21, 10, 10);
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
    type: 0,
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
    moveValid: 1,
    isDead: false,
    isVisible: true,
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
    equipment: {  primary: {damageMin: 5, damageMax: 10, damageMod: 0, dmgOverTime: 0, speedMod: 0, type: "bow", range: 8*1.45},// o()XXXX[{::::::::::::::>
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
          // map.free(this.data.x, this.data.y);
          this.data.tx = nextMove[0];
          this.data.ty = nextMove[1];
          // map.occupy(this.data.tx, this.data.ty);
          for(var sId in onlinePlayersData)
            io.to(sId).emit('players-move-update', {tx: this.data.tx, ty: this.data.ty, id: this.data.id});
        }
      }
    }

    updateStats(this.data);
    if(this.data.experience<0) this.data.experience = 0;
    
    this.data.chunk[0] = Math.floor(this.data.tx/32);
    this.data.chunk[1] = Math.floor(this.data.ty/16);
  }
  this.move = function(dx, dy, dir){
    if(map.isValid(this.data.tx + dx, this.data.ty + dy))
      this.data.moveQ.queueMove(this.data.tx + dx, this.data.ty + dy);
  }
  this.attack = function(target_id, target_type){//check for attacker type, assumes its mob anyway when dealing damage
    var id = null;
    if(!this.data.isDead){
      if(target_type == 1){//if target is mob get mobs place in mobzz
        for(var i=0; i<mobzz.length; i++){
          if(mobzz[i].id == target_id){
            id = i;
            break;
          }
        }
      }
      target_type==0 && (id = target_id);//for players this is sufficient
      if(frameTime - this.data.lastAttack > (this.data.attackCooldown * (1 - (this.data.equipment.primary.speedMod + this.data.equipment.secondary.speedMod))) && mobzz[id] && dist(this.data, mobzz[id])<this.data.equipment.primary.range){
        if(this.data.equipment.primary.type == 'bow' && calcLineOfSight(this.data.tx, this.data.ty, mobzz[id].tx, mobzz[id].ty)){
          var damage = calcDamage(this.data, mobzz[id])
          target_type==0 ? allPlayers[id].takeDamage(this.data.id, damage) : mobzz[id].takeDamage(this.data.id, damage)
        }
        this.data.lastAttack = frameTime;
      }
    }
  }
  this.takeDamage = function(attackerId, damage){

    var dmg = Math.min(damage, this.data.healthCur);
    
    this.data.healthCur -= dmg;

    io.to(this.socket).emit('player-take-damage', {id: this.data.id, dmg: dmg})

    this.data.damageInfo[attackerId] = this.data.damageInfo[attackerId] || 0;
    this.data.damageInfo[attackerId] += dmg;
    this.data.damageInfo.totalDamage += dmg;

    if(this.data.healthCur <= 0 && !this.data.isDead){
      this.die();
    }
  }
  this.die = function(){
    this.data.deathTime = new Date().getTime();
    this.data.isDead = true;
    this.data.isVisible = false;
    io.to(this.socket).emit('player-death', {});
  }
}
function Foe(name, id, spawn_x, spawn_y, mobile){//need to make separate check for player and other mobs positions regarding collisions
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
  this.targetId = null;
  this.aggro = false;
  this.aggroRange = 4;
  this.leeshTimer = frameTime;
  this.animStart = frameTime;
  this.lastMoved = frameTime;
  this.lastAttack = frameTime;
  this.attackCooldown = 1750;
  this.damageInfo = {totalDamage: 0};
  this.damageMin = 15;
  this.damageMax = 45;
  this.defenseRating = 0;
  this.loot = {gold: 0, silver: 0, copper: Math.floor(Math.random()*100)%25};
  
  // map.occupy(this.x, this.y);

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
    return this;
  }
  
  this.rlyMove = function(tx,ty){
    this.animStart = frameTime;
    this.moving = true;
    // map.free(this.x, this.y);
    this.tx = tx; this.ty = ty;
    // map.occupy(this.tx, this.ty);
  }
  this.move = function(){
    if(!this.mobile) return;
    
    if(this.aggro){
        if(!this.moving){
          if(!this.targetId) return;
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
      if(this.targetId){//check if target isn't lost
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
        for(var sId in onlinePlayersData){
          var id = onlinePlayersData[sId].id;
          if(!allPlayers[id]) continue;
          if(allPlayers[id].data.isVisible && dist(this, allPlayers[id].data) < this.aggroRange && calcLineOfSight(this.tx, this.ty, allPlayers[id].data.tx, allPlayers[id].data.ty)){
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
    if(!allPlayers[this.targetId]) return;
    if(this.aggro && frameTime - this.lastAttack > this.attackCooldown && dist(allPlayers[this.targetId].data, this)<1.45){
      var damage = Math.round((Math.random()*100) % (this.damageMax-this.damageMin) + this.damageMin);
      allPlayers[this.targetId].takeDamage(this, damage);
      this.lastAttack = frameTime;
    }
  }
  this.takeDamage = function(attackerId, damage){
    if(!this.targetId) this.targetId = attackerId;
    var damageTaken = Math.min(damage, this.healthCur);
    for(sId in onlinePlayersData)
      io.to(sId).emit('mob-take-damage', {id: this.id, dmg: damageTaken})
    this.aggro = true;
    this.leeshTimer = new Date().getTime();

    this.healthCur -= damageTaken;
    this.damageInfo[attackerId] = this.damageInfo[attackerId] || 0;
    this.damageInfo[attackerId] += damageTaken;
    this.damageInfo.totalDamage += damageTaken;

    if(this.healthCur <= 0)
      this.die(attackerId);
  }
  this.die = function(killerId){
    for(var i=0; i<mobzz.length; i++){
      if(mobzz[i].id == this.id){
        for(sId in onlinePlayersData){
          io.to(sId).emit('mob-death', this.id);
        }
        mobzz.splice(i,1);
        // map.free(this.tx, this.ty);
        this.dropExperience(killerId);
        // this.dropLoot();
        this.isDead = true;
      }
    }
  }
  this.dropExperience = function(killerId){
    for(var id in this.damageInfo){
      if(id == 'totalDamage') continue;
      var exp = 0.5 * this.exp * (this.damageInfo[id]/this.damageInfo.totalDamage) + (allPlayers[id].data.id==killerId?0.5*this.exp:0);
      if(!exp) continue;
      exp = Math.floor(exp);
      allPlayers[id].data.experience += exp;
      io.to(allPlayers[id].socket).emit('gained-exp', {totalExp: allPlayers[id].data.experience, gainedExp: exp});
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
  player.speedCur = player.speedCur>=80?Math.floor(player.speedBase * player.equipment.boots.speedMod):80;//speed cap at 80.less is faster
}

// ******************  UTILS
function dist(a, b) {
  return Math.sqrt((a.tx-b.tx)*(a.tx-b.tx)+(a.ty-b.ty)*(a.ty-b.ty));
}

//************   MOBS ****************//
function Ahmed(id, spawn_x, spawn_y){
  Foe.call(this,'Ahmed',id,spawn_x,spawn_y,true);
}
Ahmed.prototype = Object.create(Foe.prototype);
Ahmed.prototype.constructor = Ahmed;


function BigBat(id, spawn_x, spawn_y){
  Foe.call(this,'BigBat',id,spawn_x,spawn_y,true);
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
  Foe.call(this,'Bat',id,spawn_x,spawn_y,true);
  this.healthMax = 20;
  this.healthCur = 20;
  this.exp = 10000;
  this.damageMin = 0;
  this.damageMax = 12;
  this.defenseRating = 2;
}
Bat.prototype = Object.create(Foe.prototype);
Bat.prototype.constructor = Bat;


function Ogre(id, spawn_x, spawn_y){
  Foe.call(this,'Ogre',id,spawn_x,spawn_y,true);
}
Ogre.prototype = Object.create(Foe.prototype);
Ogre.prototype.constructor = Ogre;


function Goblin(id, spawn_x, spawn_y){
  Foe.call(this,'Goblin',id,spawn_x,spawn_y,true);
}
Goblin.prototype = Object.create(Foe.prototype);
Goblin.prototype.constructor = Goblin;


function Dummy(id, spawn_x, spawn_y){
  Foe.call(this,'Dummy',id,spawn_x,spawn_y,false);
}
Dummy.prototype = Object.create(Foe.prototype);
Dummy.prototype.constructor = Dummy;

function Stonoga(id, spawn_x, spawn_y){
  Foe.call(this,'Stonoga',id,spawn_x,spawn_y,false);
}
Stonoga.prototype = Object.create(Foe.prototype);
Stonoga.prototype.constructor = Stonoga;

function Shroom(id, spawn_x, spawn_y){
  Foe.call(this,'Shroom',id,spawn_x,spawn_y,false);
}
Shroom.prototype = Object.create(Foe.prototype);
Shroom.prototype.constructor = Shroom;

function calcLineOfSight (x1, y1, x2, y2) {
  var coordinatesArray = [];
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
    if(map.world[x][y] >= 1) return false;
  }
  return true;
}