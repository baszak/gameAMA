
function Item(id, name, stackable, quantity){
  this.id = id;
  this.name = name;
  this.stackable = stackable;
  this.quantity = quantity;
}
Weapon.prototype = Object.create(Item.prototype);
Weapon.prototype.constructor = Weapon;
function Weapon(id, name, stackable, quantity, level, damageMin, damageMax, damageMod, speedMod, range){
  Item.call(this, id, name, stackable, quantity);
  this.level = level;
  this.damageMin = damageMin;
  this.damageMax = damageMax;
  this.damageMod = damageMod;
  this.speedMod = speedMod;
  this.range = range;
}

function WeaponFactory(){
	this.curId = 0;
	this.createWeapon = function(level){
		var baseDmg = Math.abs(level*level/24);
		var damageMin = Math.floor(baseDmg + Math.random()*0.3 * level);
		var damageMax = Math.floor(baseDmg + Math.random()*1.8 * level);
		var damageMod = 0;
		var speedMod = 0;
		// var speedMod = Math.random() * 0.02;
		var range = 1.45;
		return (new Weapon(this.curId++, 'sword', false, 1, level, damageMin, damageMax, damageMod, speedMod, range));
	}
	this.createMoney = function(quantity){
		return (new Item(this.curId++, 'gold', true, quantity));
	}
}
var wf = new WeaponFactory();

















