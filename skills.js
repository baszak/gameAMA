function playerIsReady(player, range, mana){
  if(!targetedMob) {
      statusMessage.showMessage("No target!", 1000);
    } else if(player.exhausted > frameTime) {
      statusMessage.showMessage("You are exhausted! ", 1000);
    } else if(dist(player,targetedMob) > range) {
      statusMessage.showMessage("Target out of range!", 1000);
    } else if(player.manaCur < mana) {
      statusMessage.showMessage("Not enough mana!", 1000);
    } else
      return 1;
}
function Projectile(url, target, caller, skill){
  this.img = new Image();
  this.img.src = url || "img/projectile_new.png"
  this.explo_img = new Image();
  this.explo_img.src = "img/explo.png"
  this.x = caller.x || player1.data.x;
  this.y = caller.y || player1.data.y;
  this.animStart = frameTime;
  this.speed = 30*dist(player1.data, target);
  this.state = 1;
  this.animationSpeed = 120;
  player1.data.exhausted = this.exhausted;
  // this.damage = Math.random() * (player.intelligence + 85) + 15;
  this.angle = Math.atan2(target.y-this.y,target.x-this.x) + Math.PI/2;


  this.update = function(){
    if(this.state){
      this.ax = (target.x - this.x) * (frameTime - this.animStart) / this.speed;
      this.ay = (target.y - this.y) * (frameTime - this.animStart) / this.speed;
      if(frameTime - this.animStart >= this.speed){
        this.hit();
        this.state = 0;
        this.animStart = frameTime;
        this.x = target.x;
        this.y = target.y;
      }
    } 
    else{
      this.animationFrame = Math.floor((frameTime - this.animStart) / this.animationSpeed);
      if(this.animationFrame > 6) delete missiles[this.id];
    }
  }
  this.draw = function(ctx){
    if(this.state)
      ctx.drawRotatedImage(this.img, (this.x+this.ax)*gh+gh/2, (this.y+this.ay)*gh+gh/2, gh, gh, this.angle);
    else
      ctx.drawImage(this.explo_img, this.animationFrame*84, 0, 84, 84, this.x * gh, this.y*gh, gh, gh);
  }
  this.hit = function(){
    target.takeDamage(player1.data, this.damage);
  }
}
function Fireball(target, skill){
    this.damage = Math.round(Math.random()) * player1.data.intelligence + 85;
    player1.data.manaCur -= 200;
    this.exhausted = frameTime + 500;
    player1.data.skills[0].cooldown = frameTime + 2000;
    Projectile.call(this, 'img/projectile_new.png', target, player1.data, skill);
}
function RocketLauncher(target, skill){
    this.damage = this.damage = Math.random() * 0.7 * (player1.data.intelligence + 45) +10;
    player1.data.manaCur -= 200;
    this.exhausted = frameTime + 500;
    player1.data.skills[1].cooldown = frameTime + 750;
    Rocket.call(this, 'img/missile.png', target, player1, skill);
}
function Rocket(url, target, caller, skill){
  this.img = new Image();
  this.img.src = "img/missile.png"
  this.puff = new Image();
  this.puff.src = "img/puff.png"
  this.explo_img = new Image();
  this.explo_img.src = "img/explo.png"
  this.x = caller.x * gh + gh/2;
  this.y = caller.y * gh + gh/2;
  this.lastFrame = frameTime;
  // this.damage = this.damage = Math.random() * 0.7 * (player.intelligence + 45) +10;
  this.speed = 6;
  this.dir = 0;//Math.atan2((target.y*gh + gh/2 - this.y),(target.x*gh + gh/2 - this.x))+2*Math.PI;
  this.puffs = [];
  this.homing = true;
  player1.data.exhausted = frameTime + 100;
  this.update = function(){
    if(this.homing) {
      if(target.isDead){
        this.homing = false;
        this.animStart = frameTime;
      }
      var dir = Math.atan2((target.y*gh + gh/2 - this.y),(target.x*gh + gh/2 - this.x));
      if(Math.abs(this.dir)>Math.PI){
        this.dir -= ((this.dir>0)?1:-1)*2*Math.PI;
      }
      var wlewo = dir-this.dir;
      wlewo = wlewo < 0 ? 2*Math.PI+wlewo : wlewo;
      this.dir += Math.min(0.1,Math.max(-0.1, wlewo < Math.PI ? wlewo:-2*Math.PI+wlewo ));
      
      this.x += Math.cos(this.dir)*this.speed;
      this.y += Math.sin(this.dir)*this.speed;    
      if (frameTime - this.lastFrame > 80 && this.homing) {
        this.puffs.push({x: this.x, y: this.y, frame: frameTime});
        this.lastFrame = frameTime;
      }
      for( var i = 0; i < this.puffs.length; i++) {
        if((frameTime - this.puffs[i].frame) > 399) {
          this.puffs.splice(i,1);
        }
      }
      if(dist(target, {x:Math.floor(this.x/gh), y:Math.floor(this.y/gh)})<=0) {
        this.homing = false;
        this.animStart = frameTime;
        target.takeDamage(player1.data, this.damage);
        //if(this.puffs.length == 0)
      }
    } else {
      this.animationFrame = Math.floor((frameTime - this.animStart) / 120);
      if(this.animationFrame > 6) delete missiles[this.id];
    }
  }
  this.draw = function(ctx){
    for( var i = 0; i < this.puffs.length; i++) {
      ctx.drawImage(this.puff, Math.floor((frameTime - this.puffs[i].frame)/100)*32, 0, 32, 32, this.puffs[i].x-gh/2, this.puffs[i].y-gh/2, gh, gh);
    }
    if(!this.homing) {
      ctx.drawImage(this.explo_img, this.animationFrame*84, 0, 84, 84, this.x-gh/2, this.y-gh/2, gh, gh);
    }else{
      ctx.drawRotatedImage(this.img, this.x, this.y, gh, gh, this.dir+Math.PI/2);
    }
  }
}
function Explosion(){
  this.explo_img = new Image();
  this.explo_img.src = "img/explo.png"
  this.x = player1.data.tx;
  this.y = player1.data.ty;
  this.animStart = frameTime;
  this.animationSpeed = 120;
  player1.data.exhausted = frameTime + 1500;
  this.update = function(){
    this.animationFrame = Math.floor((frameTime - this.animStart) / this.animationSpeed);
    if(this.animationFrame > 6)delete missiles[this.id];
  }
  this.draw = function(ctx){
    for(x = this.x - 1; x < this.x + 2; x++){
      for( y = this.y - 1; y < this.y + 2; y++){
        if(x == this.x && y == this.y) continue;
        ctx.drawImage(this.explo_img, this.animationFrame*84, 0, 84, 84, x * gh, y*gh, gh, gh);
      }
    }
  }
  this.hit = function(){

  }
}
// **************** ATTRIBUTE SPENDING SHIT ***********************








