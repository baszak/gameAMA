function Map(url, w, h){
  this.img = new Image();
  this.img.src = url || "img/map_16tiles_background_resized.png";
  this.img2 = new Image();
  this.img2.src = url || "img/map_16tiles_foreground_resized.png";
  this.img3 = new Image();
  this.img3.src = url || "img/map_16tiles_front_resized.png";
  this.w = w;
  this.h = h;
  this.x = -49*gh;
  this.y = -45*gh;
  this.world = [[]];
	this.update = function(player){
    if ((player.x+player.ax)*gh + this.x > (game_size.w-5)*gh)
      this.x = Math.max((game_size.w-5-player.x-player.ax) * gh, -this.w*gh + game_size.w*gh);
    if ((player.x+player.ax)*gh + this.x < 4*gh)
      this.x = Math.min(-(player.x+player.ax-4)*gh,0);
    if ((player.y+player.ay)*gh + this.y > (game_size.h-5)*gh) 
      this.y = Math.max((game_size.h-5-player.y-player.ay) * gh, -this.h*gh + game_size.h*gh);
    if ((player.y+player.ay)*gh + this.y < 4*gh)
      this.y = Math.min(-(player.y+player.ay-4)*gh,0);
	}
  this.drawBackground = function(ctx){
    ctx.drawImage(this.img, this.x, this.y, this.img.width, this.img.height);
  }
  this.drawForeground = function(ctx){
    ctx.drawImage(this.img2, this.x, this.y, this.img.width, this.img.height);
  }
  this.drawFront = function(ctx){
    ctx.drawImage(this.img3, this.x, this.y, this.img.width, this.img.height);
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
		for (var y=-1; y < h+1; y++){
      if(x == -1 || x == w)
        this.world[x][y] = 1;
      else if(y == -1 || y == h+1)
        this.world[x][y] = 1;
      else
        this.world[x][y] = 0;
    }
	}
}

function Player(url, id, spawn_x, spawn_y, data_from_server){
    this.img_knight = new Image(),
    this.img_knight.src = url || "img/knight.png",
    this.img_knight_green = new Image(),
    this.img_knight_green.src = url || "img/knight_green.png",
    this.img_limbo = new Image(),
    this.img_limbo.src = url || "img/knight_limbo.png",
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
                        boots: {speedMod: 0},
                        head: {},
                        backpack: new Container
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
          this.data.tx = nextMove[0];
          this.data.ty = nextMove[1];
          map.occupy(this.data.tx, this.data.ty);
        }
      }
    }

    updateStats(this.data);
    if(this.data.experience<0) this.data.experience = 0;//into level up function soon
    

    //handling regen. to be rewritten into ticks? maybe regen every sec to avoid floats
    this.data.manaCur = Math.min(this.data.manaMax, this.data.manaCur + (frameTime - lastFrame)/1000*this.data.manaRegen);
    this.data.healthCur = Math.min(this.data.healthMax, this.data.healthCur + (frameTime - lastFrame)/1000*this.data.healthRegen);
    // socket.emit('players-data-update', this.data);
  }
  this.move = function(dx, dy, dir){
    // socket.emit('player-input-move', {dx: dx, dy: dy});
    socket.emit('player-input-move', {x: dx, y: dy});
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
	this.draw = function(ctx){  
      if(this.data.x < this.data.tx)
        this.data.direction = 3;
      else if(this.data.x > this.data.tx)
        this.data.direction = 2;
      else if(this.data.y < this.data.ty)
        this.data.direction = 0;
      else if(this.data.y > this.data.ty)
        this.data.direction = 1;
    
    if(this.data.limboState)
      ctx.drawImage(this.img_limbo, this.data.direction*32, 0, 32, 32, (this.data.x+this.data.ax)*gh, (this.data.y+this.data.ay)*gh, gh, gh);
    else
      ctx.drawImage(this.img_knight, this.data.direction*16, 0, 16, 16, (this.data.x+this.data.ax)*gh, (this.data.y+this.data.ay)*gh, gh, gh);

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
          this.moveQ.findPath(this.tx, this.ty, player1.data.tx, player1.data.ty);
          if(!this.moveQ.getLength())
            this.aggro = false;
          if(Math.max(Math.abs(this.ty-player1.data.ty),Math.abs(this.tx-player1.data.tx))>1){
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
        var cy = (Math.random() < (this.y - spawn_y + 4)/8)?1:-1; //prefer movement towards spawn point. obsolete?
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
      if(dist(this, player1.data)<this.aggroRange && player1.data.isVisible){
        this.aggro = true;
        this.leeshTimer = new Date().getTime();
      }
      if(frameTime - this.leeshTimer > 5000 && dist(this.spawnPoint, player1.data) > 10){
        this.aggro = false;
      }
      if(!player1.data.isVisible)
        this.aggro = false;
    }

  }
  this.attack = function(){
    if(this.aggro && frameTime - this.lastAttack > this.attackCooldown && dist(player1.data, this)<1.45){
      var damage = Math.round((Math.random()*100) % (this.damageMax-this.damageMin) + this.damageMin);
      player1.takeDamage(this, damage);
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
	this.draw = function(ctx){
    this.animationFrame = Math.floor(frameTime / this.animationSpeed)%this.spriteN;
    ctx.drawImage(this.img, this.animationFrame*this.spriteX, 0, this.spriteX, this.spriteY, (this.x + this.ax)*gh, (this.y + this.ay)*gh, gh, gh);
    if(targetedMob==this){
      ctx.strokeStyle = "rgba(255, 0, 0, 1)";
      ctx.strokeRect((this.x + this.ax)*gh, (this.y + this.ay)*gh, gh, gh);
    }
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
function AudioManager(){
  var loc_audios = [
    {area: {x:24, y:16, w:4, h:4}, audio: new Audio("audio/audio1.mp3")},
    {area: {x:37, y:10, w:2, h:2}, audio: new Audio("audio/audio2.mp3")},
    {area: {x:45, y:12, w:1, h:1}, audio: new Audio("audio/audio3.mp3")},
    // {area: {x:0, y:0, w: map.w, h: map.h}, audio: new Audio("C:/Users/Adam/Downloads/celtic.mp4")},
    {area: {x:23, y:14, w:1, h:1}, audio: new Audio("audio/welcome.mp4"), oneshot: true}
  ];
  this.update = function(){
    for(var i = 0; i<loc_audios.length; i++) {
      var entry = loc_audios[i];
      if(isPointWithin(entry.area,player1.data) && !entry.active){
        entry.audio.play();
        if(!entry.oneshot)
          fadeOut(entry.audio, 'volume', 0, 1, 5000);
        else
          entry.audio.currentTime = 0;
        entry.active = true;
      }
      else if (!isPointWithin(entry.area,player1.data) && entry.active){
        if(!entry.oneshot){
          fadeOut(entry.audio, 'volume', 1, 0, 3000, function(a){return function(){a.pause();}}(entry.audio));
        }
        entry.active = false;
      }
    }
  }
}

function ExperienceBar(){
  this.img = new Image();
  this.img.src = 'img/fullxpBar.png';
  this.update = function(){
  this.expPercent = ((player1.data.experience - levelExpFormula(player1.data.level))/levelUpFormula(player1.data.level+1));
    if(this.expPercent < 0) this.expPercent = 0;
    if(player1.data.experience >= levelExpFormula(player1.data.level+1)){
      levelUp(player1.data);
    }
    else if(player1.data.experience < levelExpFormula(player1.data.level)){
      levelDown(player1.data);
    }
  }

  this.draw = function(ctx){
    ctx.drawImage(this.img, 0, 0, 539*this.expPercent/0.8, 10, canvas.width/2-271, canvas.height-77, 539*this.expPercent, 9)
  }
}

function ActionBar(){
  this.img = new Image();
  this.img.src = 'img/actionbar.png';
  this.img_01 = new Image();
  this.img_01.src = 'img/skills/Fireball.jpg';
  this.img_01_cd = new Image();
  this.img_01_cd.src = 'img/skills/Fireball_cd.jpg';
  this.img_border = new Image();
  this.img_border.src = 'img/skills/48x_grey_border.png';

  this.draw = function(ctx){
    ctx.beginPath();
    ctx.arc(canvas.width/2 - 280 - 60, canvas.height - 70, 60, 0, 2*Math.PI);  
    var gradientRed=ctx.createLinearGradient(0,canvas.height - 65 - 60,0,canvas.height-15);
    gradientRed.addColorStop("0","rgba(0,0,0,0)");
    gradientRed.addColorStop(Math.max(1 - player1.data.healthCur/player1.data.healthMax - 0.05,0),"rgba(0,0,0,0)");
    gradientRed.addColorStop(1 - player1.data.healthCur/player1.data.healthMax,"rgba(255,0,0,0.5)");
    gradientRed.addColorStop(Math.min(1 - player1.data.healthCur/player1.data.healthMax + 0.05,1),"rgba(255,0,0,0.9)");
    gradientRed.addColorStop("1.0","rgba(255,0,0,0.9)");
    ctx.fillStyle = gradientRed;
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(canvas.width/2 + 270 + 60, canvas.height - 70, 60, 0, 2*Math.PI);
    var gradientBlue=ctx.createLinearGradient(0,canvas.height - 65 - 60,0,canvas.height-15);
    gradientBlue.addColorStop("0","rgba(0,0,0,0)");
    gradientBlue.addColorStop(Math.max(1 - player1.data.manaCur/player1.data.manaMax - 0.05,0),"rgba(0,0,0,0)");
    gradientBlue.addColorStop(1 - player1.data.manaCur/player1.data.manaMax,"rgba(0,0,255,0.5)");
    gradientBlue.addColorStop(Math.min(1 - player1.data.manaCur/player1.data.manaMax + 0.05,1),"rgba(0,0,255,0.9)");
    gradientBlue.addColorStop("1.0","rgba(0,0,255,0.9)");
    ctx.fillStyle = gradientBlue;
    ctx.fill();
    
    ctx.drawImage(this.img, canvas.width/2-520,canvas.height-140, 1040, 144)
    ctx.drawImage(this.img_01, canvas.width/2-262, canvas.height-59, 38, 38);
    if(frameTime - player1.data.skills[0].cooldown < 0)
      ctx.drawImage(this.img_01_cd, 0, 248*(frameTime-player1.data.skills[0].cooldown+2000)/2000, 248, -248*(frameTime-player1.data.skills[0].cooldown)/2000, canvas.width/2-262, 38*(frameTime-player1.data.skills[0].cooldown+2000)/2000+canvas.height-59, 38, -38*(frameTime-player1.data.skills[0].cooldown)/2000);
      // ctx.drawImage(this.img_01_cd, 0, 0, 248, 248*(frameTime-player1.data.exhausted+1000)/1000, canvas.width/2-262, canvas.height-59, 38, 38*(frameTime-player1.data.exhausted+1000)/1000);
      // ctx.drawImage(this.img_01_cd, 0, 0, 248, -248*(frameTime-player1.data.exhausted)/2000, canvas.width/2-262, (canvas.height-59), 38, -38*(frameTime-player1.data.exhausted)/2000);
      /* dont delete those */
    ctx.drawImage(this.img_border, canvas.width/2-262, canvas.height-59, 38, 38);
  }
}

function numberPopup(unitdata, content, type, duration){
    this.type = type;
    this.x = unitdata.x;
    this.y = unitdata.y;
    this.susp = (this.y)*gh - 3;
    this.content = content;
    this.messageTime = frameTime + duration;
    this.susp += 1;
  this.draw = function(ctx){
    switch(type){
      case 'damage':
        ctx.font = "12px Impact";
        ctx.fillStyle = 'rgba(180, 0, 0, '+(this.messageTime-frameTime)/duration+')';
        ctx.fillText(this.content, (this.x)*gh +10, this.susp);
        break;
      case 'heal':
        ctx.fillStyle = 'rgba(0, 210, 0, '+(this.messageTime-frameTime)/duration+')';
        ctx.fillText(this.content, (this.x)*gh +10, this.susp)
        break;
      case 'exp':
        ctx.font = "12px Impact";
        ctx.fillStyle = 'rgba(255, 255, 255, '+(this.messageTime-frameTime)/duration+')';
        // ctx.strokeStyle = 'rgba(55, 55, 55, 1)';
        // ctx.strokeText(this.content, (this.x)*gh +10, this.susp - 4);
        ctx.fillText(this.content, (this.x)*gh +10, this.susp - 4);
        break;
    }
  }
  this.update = function(){
    if(frameTime > this.messageTime){
      popups.shift();
    }
    switch(type){
      case 'damage': this.susp -= 0.1;
        break;
      case 'exp': this.susp -= 0.05;
        break;
      case 'heal': this.susp += 0.1;
    }
  }
}
// function TooltipMessage(canvas) { //not finished
//   this.canvas = canvas;
//   this.elem = document.createElement("div");
//   this.elem.class = "exp";
//   this.elem.style.position = "absolute";
//   this.elem.style.left = "240px";
//   this.elem.style.top = canvas.height-75 + "px";
//   this.elem.style.height = "10px";
//   this.elem.style.width = "540px";  
//   this.elem.style.background = "#000";
//   this.elem.style.color = "#fff";
//   document.getElementById("c1").appendChild(this.elem);

//   this.showMessage = function(){
//     console.log("current xp: " + player1.data.experience + "/" + experienceBar.levelExpFormula(player1.data.level+1));
//   }
// }
function StatusMessage(canvas) {//client only
  this.message = "The game is ready for you";
  this.messageTime = frameTime + 3000;
  this.active = true;
  this.canvas = canvas;
  this.elem = document.createElement("div");
  
  this.elem.style.position = "absolute";
  this.elem.style.left = "0px";
  this.elem.style.top = canvas.height-100 + "px";
  this.elem.style.height = "20px";
  this.elem.style.width = canvas.width + "px";  
  this.elem.style.color = "white";
  this.elem.style.textAlign = "center";
  this.elem.innerHTML = this.message;
  this.elem.style.textShadow = "0 0 5px black, 0 0 5px black, 0 0 5px black";
  document.getElementById("c1").appendChild(this.elem);
  
  
  this.update = function() {
    if(frameTime > this.messageTime && this.active) { 
      $(this.elem).fadeOut();
      this.active = false;
    }
  }
  
  this.showMessage = function(message, time) {
    this.message = message;
    this.elem.innerHTML = this.message;
    this.messageTime = frameTime + time;
    if(!this.active)      
      $(this.elem).fadeIn();
    this.active = true;    
  }
}
function MonsterSpawner(){//server only
  var k = 0;
  this.spawns = [];
  this.populateMobs = function(){
  // for(var i = 0; i< 10000; i++)
  this.createSpawn(Bat, 7, 9, 5);
  this.createSpawn(Bat, 19, 18, 45);
  this.createSpawn(Bat, 12, 20, 45);
  this.createSpawn(Bat, 12, 9, 45);
  this.createSpawn(Shroom, 33, 6, 45);
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
        this.spawns[i].foe = new this.spawns[i].foe_class(k++,this.spawns[i].spawn_x,this.spawns[i].spawn_y)        
        mobzz.push(this.spawns[i].foe);
      }else if(this.spawns[i].foe && this.spawns[i].foe.isDead) {
        this.spawns[i].died_at = frameTime;
        this.spawns[i].foe = null;
      }
    }
  }
}
function AttackAnimation(target, caller, type){//client only
  this.img_sword = new Image();
  this.img_sword.src = "img/slash_sword.png";
  this.img_2hsword = new Image();
  this.img_2hsword.src = "img/slash_2hsword.png";
  this.img_2hsword_mirror = new Image();
  this.img_2hsword_mirror.src = "img/slash_2hsword_mirror.png";
  this.x = caller.x*gh + gh/2 + (target.x - caller.x)*gh/4*3;
  this.y = caller.y*gh + gh/2 + (target.y - caller.y)*gh/4*3;
  this.angle = Math.atan2(target.y-caller.y,target.x-caller.x);
  this.animStart = frameTime;
  this.animationSpeed = 60;
  this.spriteN = 3;
  this.altSprite = Math.random()>0.5?false:true;
  this.type = type;
  this.update = function(){
    this.animationFrame = Math.floor((frameTime - this.animStart) / this.animationSpeed);
    if(this.animationFrame > this.spriteN) delete missiles[this.id];
  }
  this.draw = function(ctx){
    switch(this.type){
      case 'sword':
        ctx.drawRotatedAnim(this.img_sword, this.animationFrame*25, 0, 25, 18, this.x, this.y, this.angle, 1.6);
        break;
      case 'short_sword':
        ctx.drawRotatedAnim(this.img_sword, this.animationFrame*25, 0, 25, 18, this.x, this.y, this.angle, 1);
        break;
      case '2hsword':
        if(this.altSprite)
          ctx.drawRotatedAnim(this.img_2hsword, this.animationFrame*24, 0, 24, 72, this.x, this.y, this.angle, 0.7);
        else
          ctx.drawRotatedAnim(this.img_2hsword_mirror, this.animationFrame*24, 0, 24, 72, this.x, this.y, this.angle, 0.7);
        break;
    }
  }
}
function FilterManager(){
  this.val1 = 0;
  this.val2 = 1;
  this.fadeTime = 2000;
  this.update = function(type){
  }
  this.die = function(){
    console.log('dying')
    if(this.val1 != 1){
      this.val1 = (Math.floor(frameTime - player1.data.deathTime)%this.fadeTime)/this.fadeTime;
      this.val2 = 1 - 0.3*this.val1;
    }
      canvas.style.cssText="-webkit-filter:grayscale("+this.val1+") brightness("+this.val2+")";
      if(this.val1.toFixed(3) > 0.99)
        player1.data.dying = false;
  }
  this.clearFilters = function(){
    canvas.style.cssText="-webkit-filter:none";
    player1.data.isDrugged = false;
  }
}
function EntityManager(){
  this.curId = 0;
  this.allEntities = [];

  this.newEntity = function(id, x, y, loot){
    var decayTime = 17;
    this.allEntities.push({
      id: this.curId++,
      dropTime: new Date().getTime(),
      decayTime: 0,
      x: x,
      y: y,
      lootGround: loot,
      getLoot: function(){
        for(item in loot){
          var t = {};
          t[item] = loot[item];
          player1.data.equipment.backpack.push(t);
          console.log("looted " + item + ":" + loot[item]);
        }
        for(var i =0; i< entities.allEntities.length; i++){
          if(entities.allEntities[i].id == this.id)
            entities.allEntities.splice(this.id, 1);
        }
      },
      draw: function(){
        ctx.fillStyle = "#FF0";
        ctx.strokeStyle = "#FFCC00";
        ctx.fillRect(x*gh+16, y*gh+16, 5, 5);
        ctx.strokeRect(x*gh+16, y*gh+16, 5, 5);
      }
    });
  }
  this.clearEntities = function(){
    this.curId = 0;
    this.allEntities = [];
  }
}

//create function returning damage, taking attacker and attacked as arguments
