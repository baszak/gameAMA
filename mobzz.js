var tempImg = new Image();
tempImg.src = 'img/bat_sprite.png';

var UrlDict = {
  'Bat':      'img/bat_sprite.png',
  'BigBat':  'img/bat_sprite_big.png'
}

function Mob(tx, ty, healthMax, healthCur, speed, name, spriteX, spriteY, spriteN){
  this.img = new Image();
  this.img.src = UrlDict[name];
  this.data = {
    name: name,
    x: tx,
    y: ty,
    tx: tx,
    ty: ty,
    healthMax: healthMax,
    healthCur: healthCur,
    speed: speed,
    animStart: frameTime,
    moving: false,
    animationSpeed: 200,
    spriteX: spriteX || 84,
    spriteY: spriteY || 84,
    spriteN: spriteN || 8,
    isVisible: true
  }
  this.lastTime = frameTime;
  this.update = function(){
    this.data.x += Math.sign(this.data.tx-this.data.x) * Math.min((frameTime - this.lastTime)/speed, Math.abs(this.data.tx-this.data.x));
    this.data.y += Math.sign(this.data.ty-this.data.y) * Math.min((frameTime - this.lastTime)/speed, Math.abs(this.data.ty-this.data.y));


    if(this.data.healthCur <=0){
      this.die();
    }

    this.lastTime = frameTime;
  }
  this.draw = function(ctx){
    this.animationFrame = Math.floor(frameTime / this.data.animationSpeed)%this.data.spriteN;
    ctx.drawImage(this.img, this.animationFrame*this.data.spriteX, 0, this.data.spriteX, this.data.spriteY, (this.data.x)*gh, (this.data.y)*gh, gh, gh);
    // if(targetedMob==this){
    //   ctx.strokeStyle = "rgba(255, 0, 0, 1)";
    //   ctx.strokeRect((this.x + this.ax)*gh, (this.y + this.ay)*gh, gh, gh);
    // }
    if(this.data.isVisible){
      ctx.fillStyle = '#FF371D';
      ctx.fillRect((this.data.x+this.data.ax)*gh + gh/6, (this.data.y+this.data.ay)*gh -gh/6, 24, 2);
      ctx.fillStyle = '#87E82B';
      ctx.fillRect((this.data.x+this.data.ax)*gh + gh/6, (this.data.y+this.data.ay)*gh -gh/6, 24 * (this.data.healthCur/this.data.healthMax), 2);
      ctx.strokeStyle = '#000';
      ctx.strokeRect((this.data.x+this.data.ax)*gh + gh/6, (this.data.y+this.data.ay)*gh -gh/6, 24, 2);
    }
  }
  this.die = function(){
    delete mobzz[this.data.id];
  }
}

function populateMobs(spawner){
  // for(var i = 0; i< 10000; i++)
  spawner.createSpawn(Bat, 7, 9, 5);
  spawner.createSpawn(Bat, 19, 18, 45);
  spawner.createSpawn(Bat, 12, 20, 45);
  spawner.createSpawn(Bat, 12, 9, 45);
  spawner.createSpawn(Shroom, 33, 6, 45);
}
function Ahmed(id, spawn_x, spawn_y){
  Foe.call(this,'Ahmed','img/ahmed_sprite.png',id,spawn_x,spawn_y,true);
}
Ahmed.prototype = Object.create(Foe.prototype);
Ahmed.prototype.constructor = Ahmed;


function BigBat(id, spawn_x, spawn_y){
  Foe.call(this,'Big Bat','img/bat_sprite_big.png',id,spawn_x,spawn_y,true);
  this.healthMax = 800;
  this.healthCur = 800;
  this.exp = 120;
  this.speed -= 130;
  this.damageMin = 8;
  this.damageMax = 32;
  this.defenseRating = 9;
}
BigBat.prototype = Object.create(Foe.prototype);
BigBat.prototype.constructor = BigBat;


function Bat(id, spawn_x, spawn_y){
  Foe.call(this,'Bat','img/bat_sprite.png',id,spawn_x,spawn_y,true);
  this.healthMax = 20;
  this.healthCur = 20;
  this.exp = 12;
  this.damageMin = 0;
  this.damageMax = 6;
  this.defenseRating = 2;
}
Bat.prototype = Object.create(Foe.prototype);
Bat.prototype.constructor = Bat;


function Ogre(id, spawn_x, spawn_y){
  Foe.call(this,'Ogre','img/ogre_sprite.png',id,spawn_x,spawn_y,true);
  this.healthMax = 1200;
  this.healthCur = 1200;
  this.exp = 720;
  this.damageMin = 40;
  this.damageMax = 180;
  this.attackCooldown = 450;
  this.defenseRating = 21;
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