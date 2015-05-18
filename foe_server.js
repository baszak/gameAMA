exports.Foe = function Foe(name, url, id, spawn_x, spawn_y, mobile, spriteX, spriteY, spriteN){
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