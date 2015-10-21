function Mob(id, tx, ty, healthMax, healthCur, speed, name){
  this.img = allImages[name] || allImages['placeholder'];
    this.id = id;
    this.name = name;
    this.type = enums.objType.MOB;
    this.x = tx;
    this.y = ty;
    this.tx = tx;
    this.ty = ty;
    this.healthMax = healthMax;
    this.healthCur = healthCur;
    this.speed = speed;
    this.animStart = frameTime;
    this.moving = false;
    this.animationSpeed = 200;
    this.spriteX = this.img.spriteX || 84;
    this.spriteY = this.img.spriteY || 84;
    this.spriteN = this.img.spriteN || 8;
    this.isVisible = true;
    this.lastTime = frameTime;
  this.update = function(){
    this.x += Math.sign(this.tx-this.x) * Math.min((frameTime - this.lastTime)/speed, Math.abs(this.tx-this.x));
    this.y += Math.sign(this.ty-this.y) * Math.min((frameTime - this.lastTime)/speed, Math.abs(this.ty-this.y));

    this.lastTime = frameTime;
  }
  this.draw = function(ctx){
    this.animationFrame = Math.floor(frameTime / this.animationSpeed)%this.spriteN;
    ctx.drawImage(this.img, this.animationFrame*this.spriteX, 0, this.spriteX, this.spriteY, (this.x)*gh, (this.y)*gh, gh, gh);
    if(this.isTargeted){
      ctx.strokeStyle = "rgba(255, 0, 0, 1)";
      ctx.strokeRect((this.x)*gh, (this.y)*gh, gh, gh);
    }
    if(this.isVisible){
      drawHealthBar(this);
    }
  }
  this.takeDamage = function(damage){
    if(damage>0)
      entities.newEntity('blood_big', this.tx, this.ty, 15, 2.5);
    popups.push(new numberPopup(this.tx, this.ty, damage, 'damage', 1200));
  }
  this.die = function(){
    if(targetedUnit && targetedUnit.id == this.id)
      targetedUnit = null;
    delete mobzz[this.id];
  }
}