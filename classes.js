function Map(url, w, h){
  this.img = new Image();
  this.img.src = url || "img/map_16tiles_background_resized.png";
  this.img2 = new Image();
  this.img2.src = url || "img/map_16tiles_foreground_resized.png";
  this.img3 = new Image();
  this.img3.src = url || "img/map_16tiles_front_resized.png";
  this.images = [];
  for(var i=0; i< 9; i++){

  }
  this.w = w;
  this.h = h;
  this.x = 0;
  this.y = 0;
  this.offset_x = (game_size.w/2 * gh);
  this.offset_y = (game_size.h/2 * gh);
  this.world = [[]];
	this.update = function(player){
    // if ((player.x+player.ax)*gh + this.x > (game_size.w-5)*gh)
    //   this.x = Math.max((game_size.w-5-player.x-player.ax) * gh, -this.w*gh + game_size.w*gh);
    // if ((player.x+player.ax)*gh + this.x < 4*gh)
    //   this.x = Math.min(-(player.x+player.ax-4)*gh,0);
    // if ((player.y+player.ay)*gh + this.y > (game_size.h-5)*gh) 
    //   this.y = Math.max((game_size.h-5-player.y-player.ay) * gh, -this.h*gh + game_size.h*gh);
    // if ((player.y+player.ay)*gh + this.y < 4*gh)
    //   this.y = Math.min(-(player.y+player.ay-4)*gh,0);
    this.x = -(player.x+player.ax)*gh + this.offset_x;
    this.y = -(player.y+player.ay)*gh + this.offset_y;
  }
  this.drawBackground = function(ctx){
    ctx.drawImage(this.img, this.x, this.y, this.img.width, this.img.height);
  }
  this.drawForeground = function(ctx){
    ctx.drawImage(this.img2, this.x, this.y, this.img2.width, this.img2.height);
  }
  this.drawFront = function(ctx){
    ctx.drawImage(this.img3, this.x, this.y, this.img3.width, this.img3.height);
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

function Player(id, spawn_x, spawn_y, level, experience, name, healthMax, healthCur, manaMax, manaCur, speedCur, attrPoints, skillPoints, eq){ //reminder:remove properti es unused by the client when done rewriting server code.
  console.log(eq)
  this.img_right = allImages['Rayman_right'];
  this.img_left = allImages['Rayman_left'];
  this.img_down = allImages['Rayman_down'];
  this.img_up = allImages['Rayman_up'];
  this.img_run_right = allImages['Rayman_run_right'];
  this.img_run_left = allImages['Rayman_run_left'];
  this.img_run_down = allImages['Rayman_run_down'];
  this.img_run_up = allImages['Rayman_run_up'];
  this.offsetY = this.img_right.spriteY - gh;
  this.animationSpeed = 80;
  this.id = id || 1;
  this.name  = name || "Playerino";
  //player resources
	this.x = spawn_x;
	this.y = spawn_y;
  this.tx = spawn_x;
  this.ty = spawn_y;
  this.direction = 0;
  //rpg shit
  this.level = level || 1;
  this.experience = experience || 0;
  this.expPenalty = 0;
  this.strength = 1;
  this.agility = 1;
  this.intelligence = 1;
  this.attrPoints = 0;
  this.skillPoints = 0;
  this.healthMax = healthMax || 300;
  this.healthCur = healthCur || 300;
  this.manaMax = manaMax || 900;
  this.manaCur = manaCur || 900;
  this.healthRegenBase = 0;
  this.healthRegen = 2;
  this.manaRegen = 300;
  this.mmr = 1400;
  this.speedBase = 400;
  this.speedCur = speedCur || 400;
  this.attackCooldown = 2000;
    /* percentage */
    this.critChanceBase = 0;
    this.critChance = 0.5;
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
      //other shit
  this.moveValid = 1;
  this.isVisible = true;
  this.isMeditating = false;
  this.isDead = false;
  this.dying = false;
  this.deathTime = frameTime;
  this.moveQ = new MovementQueue();
  this.animStart = frameTime;
  this.lastAttack = frameTime;
  this.exhausted = 0;
  this.buffTimer = 0;
  this.damageInfo = {totalDamage: 0};
  this.skills = [];


  // this.createWeapon = function(name, type, level, damageMin, damageMax, damageMod, speedMod, range, hitrateMod, armorPenetration){
  this.equipment = {
    primary: eq.primary || 0,
    secondary: eq.secondary || 0, // ¤=[]:::;;>
    body: eq.body || 0,
    legs: eq.legs || 0,
    boots: eq.boots || 0,
    head: eq.head || 0,
    backpack: eq.backpack || 0//default 4x5
  };
	this.update = function(){
    for(var i=0; i<this.skills.length; i++){ //updating existing skills cooldowns.
      if(this.skills[i])
        this.skills[i].update();
    }
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
      this.ay = 0
    }
    
    if(!this.moving) {
      var nextMove = this.moveQ.getMove();
      if(nextMove) {
        if(!map.isValid(nextMove[0], nextMove[1]) && this.moveQ.getLength() > 0){
          this.moveQ.findPath(this.x, this.y, clientX, clientY);
          nextMove = this.moveQ.getMove();
        }
        if(nextMove && map.isValid(nextMove[0], nextMove[1])) {
        socket.emit('player-input-move', {x: nextMove[0]-this.tx, y: nextMove[1]-this.ty});
          this.animStart = frameTime;
          // this.animationFrame = 0;
          this.moving = true;
          this.tx = nextMove[0];
          this.ty = nextMove[1];
        }
      }
    }

    // updateStats(this);//this comes from the server
    if(this.experience<0) this.experience = 0;
  }
  this.move = function(dx, dy, dir){
    if(map.isValid(this.tx + dx, this.ty + dy))
      this.moveQ.queueMove(this.tx + dx, this.ty + dy);
  }
  this.attack = function(){ //autoattacks with primary hand
    if(!this.isDead){
      if(frameTime - this.lastAttack > (this.attackCooldown/this.atkSpeed * (1 - (this.equipment.primary.speedMod + (this.equipment.secondary.speedMod || 0)))) && targetedUnit && dist(this, targetedUnit)<this.equipment.primary.range){
        //SERVER
        console.log('attack')

        socket.emit('player-attack', {id: targetedUnit.id, type: targetedUnit.type});

        //ANIMATIONS
        switch(this.equipment.primary.type){
          case 'bow':
            missiles.push(new Projectile(this.tx, this.ty, targetedUnit.tx, targetedUnit.ty, 'arrow_new', 'blood_hit', 'arrow_hit'));
            break;
          case 'sword':
            missiles.push(new AttackAnimation(targetedUnit, this, this.equipment.primary.type));
            break;
          case 'big_sword':
          missiles.push(new AttackAnimation(targetedUnit, this, this.equipment.primary.type));
          break;
        }


        this.lastAttack = frameTime;
      }
    }
  }
  this.takeDamage = function(data){
    if(data.dmg>0)
      entities.newEntity('blood_big', this.tx, this.ty, 15, 2.5);
    popups.push(new numberPopup(this.tx, this.ty, data.dmg, 'damage', 1200));
  }
  this.die = function(){
    this.deathTime = new Date().getTime();
    this.isDrugged = false;
    webFilter.die();
    this.dying = true;
    this.isDead = true;
    this.isVisible = false;
  }
  this.toggleRegen = function(){
    this.isMeditating = !this.isMeditating;
    socket.emit('player-toggle-regen', {});
  }
	this.draw = function(ctx){
    this.animationFrame = Math.floor(frameTime / this.animationSpeed)%this.img_right.spriteN;
    if(!this.moving)
      this.animationFrame_run = 0;
    else
      this.animationFrame_run = Math.floor(frameTime/ this.animationSpeed)%this.img_run_right.spriteN;

      if(this.x < this.tx)//right  make enums of this shit
        this.direction = 2;
      else if(this.x > this.tx)//left
        this.direction = 1;
      else if(this.y < this.ty)//down
        this.direction = 0;
      else if(this.y > this.ty)//up
        this.direction = 3;
    
    if(!this.moving){
      if(this.direction == 2)
        ctx.drawImage(this.img_right, this.animationFrame * this.img_right.spriteX, 0, this.img_right.spriteX, this.img_right.spriteY, (this.x+this.ax)*gh, (this.y+this.ay)*gh - this.offsetY, this.img_right.spriteX, this.img_right.spriteY);
      else if(this.direction == 1)
        ctx.drawImage(this.img_left, this.animationFrame * this.img_left.spriteX, 0, this.img_left.spriteX, this.img_left.spriteY, (this.x+this.ax)*gh, (this.y+this.ay)*gh - this.offsetY, this.img_left.spriteX, this.img_left.spriteY);
      else if(this.direction == 0)
        ctx.drawImage(this.img_down, this.animationFrame * this.img_down.spriteX, 0, this.img_down.spriteX, this.img_down.spriteY, (this.x+this.ax)*gh, (this.y+this.ay)*gh - this.offsetY, this.img_down.spriteX, this.img_down.spriteY);
      else if(this.direction == 3)
        ctx.drawImage(this.img_up, this.animationFrame * this.img_up.spriteX, 0, this.img_up.spriteX, this.img_up.spriteY, (this.x+this.ax)*gh, (this.y+this.ay)*gh - this.offsetY, this.img_up.spriteX, this.img_up.spriteY);

    }
    else{
      if(this.direction == 2)
        ctx.drawImage(this.img_run_right, this.animationFrame_run * this.img_run_right.spriteX, 0, this.img_run_right.spriteX, this.img_run_right.spriteY, (this.x+this.ax)*gh, (this.y+this.ay)*gh - this.offsetY, this.img_run_right.spriteX, this.img_run_right.spriteY);
      else if(this.direction == 1)
        ctx.drawImage(this.img_run_left, this.animationFrame_run * this.img_run_left.spriteX, 0, this.img_run_left.spriteX, this.img_run_left.spriteY, (this.x+this.ax)*gh, (this.y+this.ay)*gh - this.offsetY, this.img_run_left.spriteX, this.img_run_left.spriteY);
      else if(this.direction == 0)
        ctx.drawImage(this.img_run_down, this.animationFrame_run * this.img_run_down.spriteX, 0, this.img_run_down.spriteX, this.img_run_down.spriteY, (this.x+this.ax)*gh, (this.y+this.ay)*gh - this.offsetY, this.img_run_down.spriteX, this.img_run_down.spriteY);
      else if(this.direction == 3)
        ctx.drawImage(this.img_run_up, this.animationFrame_run * this.img_run_up.spriteX, 0, this.img_run_up.spriteX, this.img_run_up.spriteY, (this.x+this.ax)*gh, (this.y+this.ay)*gh - this.offsetY, this.img_run_up.spriteX, this.img_run_up.spriteY);

    }

    if(!this.isDead){ //draw healthbar
      ctx.fillStyle = '#FF371D';
      ctx.fillRect((this.x+this.ax)*gh + gh/6, (this.y+this.ay)*gh - this.offsetY, 24, 3);
      ctx.fillStyle = '#87E82B';
      ctx.fillRect((this.x+this.ax)*gh + gh/6, (this.y+this.ay)*gh - this.offsetY, 24 * (this.healthCur/this.healthMax), 3);
      ctx.strokeStyle = '#000';
      ctx.strokeRect((this.x+this.ax)*gh + gh/6, (this.y+this.ay)*gh - this.offsetY, 24, 3);
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
      if(isPointWithin(entry.area,player1) && !entry.active){
        entry.audio.play();
        if(!entry.oneshot)
          fadeOut(entry.audio, 'volume', 0, 1, 5000);
        else
          entry.audio.currentTime = 0;
        entry.active = true;
      }
      else if (!isPointWithin(entry.area,player1) && entry.active){
        if(!entry.oneshot){
          fadeOut(entry.audio, 'volume', 1, 0, 3000, function(a){return function(){a.pause();}}(entry.audio));
        }
        entry.active = false;
      }
    }
  }
}

function ExperienceBar(){
  this.img = allImages['xp_bar_new'];
  this.expPercent = 0;

  this.update = function(){
  this.expPercent = ((player1.experience - levelExpFormula(player1.level))/levelUpFormula(player1.level+1));
    if(this.expPercent < 0) this.expPercent = 0;
    if(player1.experience >= levelExpFormula(player1.level+1)){
      levelUp(player1);
    }
    else if(player1.experience < levelExpFormula(player1.level)){
      levelDown(player1);
    }
  }

  this.draw = function(ctx){
    ctx.drawImage(this.img, 0, 0, this.img.spriteX*this.expPercent, this.img.spriteY, 228, canvas.height - 71, this.img.spriteX*this.expPercent, this.img.spriteY)
  }
}

function ActionBar(){

  this.bar_new = allImages['action_bar_new'];
  this.hp_full  = allImages['hp_full'];
  this.mana_full  = allImages['mana_full'];
  this.skill1 = allImages['skill_' + player1.equipment.primary.type];
  this.skill1_cd = allImages['skill_' + player1.equipment.primary.type + '_cd'] || this.skill1;
  this.update = function(ctx) {
    this.skill1 = allImages['skill_' + player1.equipment.primary.type];
    this.skill1_cd = allImages['skill_' + player1.equipment.primary.type + '_cd'] || this.skill1;
  };
  this.draw = function(ctx){

    //HP & MANA
    ctx.drawImage(this.bar_new, 0 , canvas.height-256, 1024, 256);
    this.hpPercent = (player1.healthCur/player1.healthMax)*130;
    ctx.drawImage(this.hp_full, 0, 0, this.hpPercent, 16, 87 , canvas.height-45, this.hpPercent, 16);
    this.manaPercent = (player1.manaCur/player1.manaMax)*130;
    ctx.drawImage(this.mana_full, 0, 0, this.manaPercent, 16, 87 , canvas.height-22, this.manaPercent, 16, 16);

    //hotbar skills drawing
    ctx.drawImage(this.skill1, 243, canvas.height-51, this.skill1.spriteX, this.skill1.spriteY);

    //player1.skills drawing
    
    // for(var i = 0, var img = 0; i < player1.skills.length; i++){
    //   img = allImages[player1.skills[i].name]
    //   ctx.drawImage(img, 243 + i*48, canvas.height -51, img.spriteX, img.spriteY)
    // };

    if(frameTime - player1.lastAttack < player1.attackCooldown){
      this.part1 = (player1.lastAttack - frameTime + player1.attackCooldown) / player1.attackCooldown; //1->0
      this.part2 = (frameTime - player1.lastAttack) / player1.attackCooldown; // 0->1

      ctx.drawImage(this.skill1_cd, 0, 32*this.part2, 32, 32*this.part1, 243, 32*this.part2 + canvas.height-51, 32, 32*this.part1) //DEFAULT - draws full and slides down.
      // ctx.drawImage(this.skill1_cd, 243,canvas.height-51, this.skill1.spriteX, this.skill1.spriteY); //normal cd image no animation
      // ctx.drawImage(this.skill1_cd, 0, 32*this.part1, 32, -32*this.part1, 243, 32*this.part1 + canvas.height-51, 32, -32*this.part1) //draws full first, and slides up in time T
      // ctx.drawImage(this.skill1_cd, 0, 32*this.part2, 32, -32*this.part2, 243, 32*this.part2 + canvas.height-51, 32, -32*this.part2) //just draws anim down from 0 in time T
    }
  };
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
function AttackAnimation(target, caller, type){
  this.x = caller.x*gh + gh/2 + (target.x - caller.x)*gh/4*3;
  this.y = caller.y*gh + gh/2 + (target.y - caller.y)*gh/4*3;
  this.angle = Math.atan2(target.y-caller.y,target.x-caller.x);
  this.animStart = frameTime;
  this.animationSpeed = 60;
  this.altSprite = Math.random()>0.5?false:true;
  this.type = type + '_slash';
  this.update = function(){
    this.animationFrame = Math.floor((frameTime - this.animStart) / this.animationSpeed);
    if(this.animationFrame > allImages[this.type].spriteN) delete missiles[this.id];
  }
  this.draw = function(ctx){
    switch(this.type){
      case 'sword_slash':
        ctx.drawRotatedAnim(allImages[this.type], this.animationFrame*allImages[this.type].spriteX, 0, allImages[this.type].spriteX, allImages[this.type].spriteY, this.x, this.y, this.angle, 1.6);
        break;
      case 'big_sword_slash':
        ctx.drawRotatedAnim(allImages[this.type], this.animationFrame*allImages[this.type].spriteX, 0, allImages[this.type].spriteX, allImages[this.type].spriteY, this.x, this.y, this.angle, 0.7);
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
      this.val1 = (Math.floor(frameTime - player1.deathTime)%this.fadeTime)/this.fadeTime;
      this.val2 = 1 - 0.3*this.val1;
    }
      canvas.style.cssText="-webkit-filter:grayscale("+this.val1+") brightness("+this.val2+")";
      if(this.val1.toFixed(3) > 0.99)
        player1.dying = false;
  }
  this.clearFilters = function(){
    canvas.style.cssText="-webkit-filter:none";
    player1.isDrugged = false;
  }
}
function EntityManager(){
  this.curId = 0;
  this.allEntities = [];
  this.newEntity = function(img_name, x, y, decay_time, fade_time){
    this.allEntities.push( new Entity(img_name, x, y, decay_time, fade_time) );
      
  }
  this.newFloorEntity = function(){

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
  this.offsetX = allImages[img_name].offsetX || 0;
  this.offsetY = allImages[img_name].offsetY || 0;
  this.spritePart = Math.floor(Math.random()*100)%allImages[img_name].spriteN; //random part of the image
  this.draw = function(ctx){
    if(this.decayTime && this.fadeTime && frameTime > (this.startTime + this.decayTime - this.fadeTime)){
      ctx.globalAlpha = (this.startTime + this.decayTime - frameTime)/ this.fadeTime;
      ctx.globalAlpha < 0 && (ctx.globalAlpha = 0);
    }
    ctx.drawImage(allImages[img_name], this.spritePart*this.spriteX, 0, this.spriteX, this.spriteY, this.x*gh+map.x - this.offsetX, this.y*gh+map.y - this.offsetY, this.spriteX, this.spriteY);
    ctx.globalAlpha = 1;
  }
}

