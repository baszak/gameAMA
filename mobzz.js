var tempImg = new Image();
tempImg.src = 'bat_sprite.png';

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