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
  var skillUser = this;
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
    healthRegenBase: 100,
    healthRegen: 100,
    manaRegen: 300,
    mmr: 1400,
    speedBase: 400,
    speedCur: 400,
    baseAttackCooldown: 800,
    /* percentage */
    critChance: 0.5,
    critDamage: 1,
    lifeSteal: 0,
    dmgMod: 1,
    atkSpeedBoost: 1,
    evasion: 0,
    dmgReflect: 0,
    blockChance: 0,
    magicImmunity: 0,
    physicalImmunity: 0,
    /* bools */
    silenced: false,
    stunned: false,
    disarmed: false,
    stealthed: false,
    bleeding: false,
    onFire: false,
    poisoned: false,
        //other shit
    moveValid: 1,
    isVisible: true,
    limboState: false,
    dying: false,
    deathTime: frameTime,
    moveQ: new MovementQueue(),
    animStart: frameTime,
    lastAttack: frameTime,
    exhausted: 0,
    buffTimer: 0,
    damageInfo: {totalDamage: 0},
    skills: [],

    equipment: {  primary: {damageMin: 1, damageMax: 5, damageMod: 0, dmgOverTime: 0, speedMod: 0, type: "bow", range: 8*1.45},// o()XXXX[{::::::::::::::>
                  secondary: {damageMin: 1, damageMax: 5, damageMod: 0, dmgOverTime: 0, speedMod: 0, type: "sword", range: 1.45}, // ¤=[]:::;;>
                  body: {},
                  legs: {},
                  boots: {speedMod: 0},
                  head: {},
                  backpack: new Container(1000)
                }
  }
	this.update = function(){
    for(var i=0; i<this.data.skills.length; i++){
      if(this.data.skills[i])
        this.data.skills[i].update();
    }
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
        socket.emit('player-input-move', {x: nextMove[0]-this.data.tx, y: nextMove[1]-this.data.ty});
          this.data.animStart = frameTime;
          this.data.moving = true;
          this.data.tx = nextMove[0];
          this.data.ty = nextMove[1];
        }
      }
    }

    updateStats(this.data);
    if(this.data.experience<0) this.data.experience = 0;
  }
  this.move = function(dx, dy, dir){
    if(map.isValid(this.data.tx + dx, this.data.ty + dy))
      this.data.moveQ.queueMove(this.data.tx + dx, this.data.ty + dy);
  }
  this.attack = function(){ //autoattacks with primary hand
    if(!this.data.limboState){
      if(frameTime - this.data.lastAttack > (this.data.baseAttackCooldown * (1 - (this.data.equipment.primary.speedMod + this.data.equipment.secondary.speedMod))) && targetedMob && dist(this.data, targetedMob.data)<this.data.equipment.primary.range){
        socket.emit('player-attack', {id: targetedMob.data.id, type: targetedMob.data.type});
        switch(this.data.equipment.primary.type){
          case 'bow':
            missiles.push(new Projectile(this.data.tx, this.data.ty, targetedMob.data.tx, targetedMob.data.ty, 'arrow_new', 'arrow_hit'))
          case 'sword':
            // missiles.push(new AttackAnimation(targetedMob.data, this.data, this.data.equipment.primary.type));
        }


        this.data.lastAttack = frameTime;
      }
    }
  }
  this.takeDamage = function(data){
    if(data.dmg>0)
      entities.newEntity('blood_big', this.data.tx, this.data.ty, 15, 2.5);
    popups.push(new numberPopup(this.data.tx, this.data.ty, data.dmg, 'damage', 1200));
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
        this.data.direction = 2;
      else if(this.data.x > this.data.tx)
        this.data.direction = 1;
      else if(this.data.y < this.data.ty)
        this.data.direction = 0;
      else if(this.data.y > this.data.ty)
        this.data.direction = 3;
    
    if(!this.data.limboState)
      ctx.drawImage(allImages['red_player'], this.data.direction*allImages['red_player'].spriteX, 0, allImages['red_player'].spriteX, allImages['red_player'].spriteY, (this.data.x+this.data.ax)*gh, (this.data.y+this.data.ay)*gh, gh, gh);

    if(!this.data.isDead){
      ctx.fillStyle = '#FF371D';
      ctx.fillRect((this.data.x+this.data.ax)*gh + gh/6, (this.data.y+this.data.ay)*gh -gh/6, 24, 3);
      ctx.fillStyle = '#87E82B';
      ctx.fillRect((this.data.x+this.data.ax)*gh + gh/6, (this.data.y+this.data.ay)*gh -gh/6, 24 * (this.data.healthCur/this.data.healthMax), 3);
      ctx.strokeStyle = '#000';
      ctx.strokeRect((this.data.x+this.data.ax)*gh + gh/6, (this.data.y+this.data.ay)*gh -gh/6, 24, 3);
    }
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
    // if(frameTime - player1.data.skills[0].cooldown < 0)
    //   ctx.drawImage(this.img_01_cd, 0, 248*(frameTime-player1.data.skills[0].cooldown+2000)/2000, 248, -248*(frameTime-player1.data.skills[0].cooldown)/2000, canvas.width/2-262, 38*(frameTime-player1.data.skills[0].cooldown+2000)/2000+canvas.height-59, 38, -38*(frameTime-player1.data.skills[0].cooldown)/2000);
      // ctx.drawImage(this.img_01_cd, 0, 0, 248, 248*(frameTime-player1.data.exhausted+1000)/1000, canvas.width/2-262, canvas.height-59, 38, 38*(frameTime-player1.data.exhausted+1000)/1000);
      // ctx.drawImage(this.img_01_cd, 0, 0, 248, -248*(frameTime-player1.data.exhausted)/2000, canvas.width/2-262, (canvas.height-59), 38, -38*(frameTime-player1.data.exhausted)/2000);
      /* dont delete those */
    ctx.drawImage(this.img_border, canvas.width/2-262, canvas.height-59, 38, 38);
  }
}

function numberPopup(unit_x, unit_y, content, type, duration){
    this.type = type;
    this.x = unit_x;
    this.y = unit_y;
    this.susp = (this.y)*gh - 3;
    this.content = content;
    this.messageTime = frameTime + duration;
    this.susp -= 2;
  this.draw = function(ctx){
    switch(type){
      case 'damage':
        ctx.font = "12px Tibia Font";
        ctx.fillStyle = 'rgba(210, 0, 0, '+(this.messageTime-frameTime)/duration+')';
        ctx.fillText(this.content, (this.x)*gh +14, this.susp);
        break;
      case 'heal':
        ctx.fillStyle = 'rgba(0, 210, 0, '+(this.messageTime-frameTime)/duration+')';
        ctx.fillText(this.content, (this.x)*gh +14, this.susp)
        break;
      case 'exp':
        ctx.font = "12px Tibia Font";
        ctx.fillStyle = 'rgba(255, 255, 255, '+(this.messageTime-frameTime)/duration+')';
        // ctx.strokeStyle = 'rgba(55, 55, 55, 1)';
        // ctx.strokeText(this.content, (this.x)*gh +10, this.susp - 4);
        ctx.fillText(this.content, (this.x)*gh +14, this.susp - 4);
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
function AttackAnimation(target, caller, type){//add 
  this.x = caller.x*gh + gh/2 + (target.x - caller.x)*gh/4*3;
  this.y = caller.y*gh + gh/2 + (target.y - caller.y)*gh/4*3;
  this.angle = Math.atan2(target.y-caller.y,target.x-caller.x);
  this.animStart = frameTime;
  this.animationSpeed = 60;
  this.altSprite = Math.random()>0.5?false:true;
  this.type = type;
  this.update = function(){
    this.animationFrame = Math.floor((frameTime - this.animStart) / this.animationSpeed);
    if(this.animationFrame > allImages[this.type].spriteN) delete missiles[this.id];
  }
  this.draw = function(ctx){
    switch(this.type){
      case 'sword':
        ctx.drawRotatedAnim(allImages[this.type], this.animationFrame*allImages[this.type].spriteX, 0, allImages[this.type].spriteX, allImages[this.type].spriteY, this.x, this.y, this.angle, 1.6);
        break;
      case 'short_sword':
        ctx.drawRotatedAnim(this.img_sword, this.animationFrame*25, 0, 25, 18, this.x, this.y, this.angle, 1);
        break;
      case 'big_sword':
        if(this.altSprite){
          //this one is broken --- ???
          ctx.drawRotatedAnim(allImages[this.type], this.animationFrame*allImages[this.type].spriteX, 0, allImages[this.type].spriteX, allImages[this.type].spriteY, this.x, this.y, this.angle, 0.7);
        }
        else
          ctx.drawRotatedAnim(allImages[this.type], allImages[this.type].spriteX*(allImages[this.type].spriteN) + this.animationFrame*allImages[this.type].spriteX, 0, allImages[this.type].spriteX, allImages[this.type].spriteY, this.x, this.y, this.angle, 0.7);
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
  this.newEntity = function(img_name, x, y, decay_time, fade_time){
    this.allEntities.push( new Entity(img_name, x, y, decay_time, fade_time) );
      
  }
  this.clearEntities = function(){
    this.curId = 0;
    this.allEntities = [];
  }
  this.update = function() {
    for(var i=0; i<this.allEntities.length; i++){
      if(frameTime - this.allEntities[i].startTime > this.allEntities[i].decayTime){
        this.allEntities.splice(i, 1);
      }
    }
  }
}

function Entity(img_name, x, y, decay_time, fade_time){
  this.name = img_name;
  this.id = this.curId++;
  this.startTime = new Date().getTime();
  this.decayTime = decay_time*1000;
  this.fadeTime = fade_time * 1000;
  this.x = x;
  this.y = y;
  this.spriteX = allImages[img_name].spriteX || 0;
  this.spriteY = allImages[img_name].spriteY || 0;
  this.spritePart = Math.floor(Math.random()*100)%allImages[img_name].spriteN;
  this.draw = function(ctx){
    if(this.decayTime && this.fadeTime && frameTime > (this.startTime + this.decayTime - this.fadeTime)){
      ctx.globalAlpha = (this.startTime + this.decayTime - frameTime)/ this.fadeTime;
      ctx.globalAlpha < 0 && (ctx.globalAlpha = 0);
    }
    ctx.drawImage(allImages[img_name], this.spritePart*this.spriteX, 0, gh, gh, this.x*gh+map.x, this.y*gh+map.y, gh, gh);
    ctx.globalAlpha = 1;
  }
}

