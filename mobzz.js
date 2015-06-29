function Mob(id, tx, ty, healthMax, healthCur, speed, name){
  this.img = allImages[name] || allImages['placeholder'];
  this.data = {
    id: id,
    name: name,
    type: objType.MOB,
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
    spriteX: this.img.spriteX || 84,
    spriteY: this.img.spriteY || 84,
    spriteN: this.img.spriteN || 8,
    isVisible: true
  }
  this.lastTime = frameTime;
  this.update = function(){
    this.data.x += Math.sign(this.data.tx-this.data.x) * Math.min((frameTime - this.lastTime)/speed, Math.abs(this.data.tx-this.data.x));
    this.data.y += Math.sign(this.data.ty-this.data.y) * Math.min((frameTime - this.lastTime)/speed, Math.abs(this.data.ty-this.data.y));

    this.lastTime = frameTime;
  }
  this.draw = function(ctx){
    this.animationFrame = Math.floor(frameTime / this.data.animationSpeed)%this.data.spriteN;
    ctx.drawImage(this.img, this.animationFrame*this.data.spriteX, 0, this.data.spriteX, this.data.spriteY, (this.data.x)*gh, (this.data.y)*gh, gh, gh);
    if(this.isTargeted){
      ctx.strokeStyle = "rgba(255, 0, 0, 1)";
      ctx.strokeRect((this.data.x)*gh, (this.data.y)*gh, gh, gh);
    }
    if(this.data.isVisible){
      drawHealthBar(this);
    }
  }
  this.takeDamage = function(damage){
    if(damage>0)
      entities.newEntity('blood_big', this.data.tx, this.data.ty, 15, 2.5);
    popups.push(new numberPopup(this.data.tx, this.data.ty, damage, 'damage', 1200));
  }
  this.die = function(){
    if(targetedMob.data.id == this.data.id)
      targetedMob = null;
    delete mobzz[this.data.id];
  }
}