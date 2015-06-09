var ifac = new ItemFactory();

var TypeEnum = {
	WEAPON_1H: 0,
	WEAPON_2H: 1,
	ARMOR: 2,
	LEGS: 3,
	BOOTS: 4,
	HELMET: 5,
	BELT: 6,
	NECKLACE: 7,
	RING1: 8,
	RING2: 9,
	BACKPACK: 10,
	GOLD: 11
}
if(Object.freeze){
	Object.freeze(TypeEnum);
}else console.warn("your browser doesn't support obj.freeze");


function Item(id, name, stackable, quantity, type){
	this.id = id;
	this.name = name;
	this.type = type;
	this.stackable = stackable;
	this.quantity = quantity;
}
Weapon.prototype = Object.create(Item.prototype);
Weapon.prototype.constructor = Weapon;
function Weapon(id, name, stackable, quantity, type, level, damageMin, damageMax, damageMod, speedMod, range){
	Item.call(this, id, name, stackable, quantity, type);
	this.level = level;
	this.damageMin = damageMin;
	this.damageMax = damageMax;
	this.damageMod = damageMod;
	this.speedMod = speedMod;
	this.range = range;
}

Armor.prototype = Object.create(Item.prototype);
Armor.prototype.constructor = Weapon;
function Armor(id, name, stackable, quantity, type, rating, dmgred){
	Item.call(this, id, name, stackable, quantity, type);
	this.rating = rating;
	this.dmgReduction = dmgred;
}
function ItemFactory(){
	this.curId = 0;
	this.createWeapon = function(level){
		var baseDmg = Math.abs(level*level/24);
		var damageMin = Math.floor(baseDmg + Math.random()*0.3 * level);
		var damageMax = Math.floor(baseDmg + Math.random()*1.8 * level);
		var damageMod = 0;
		var speedMod = 0;
		// var speedMod = Math.random() * 0.02;
		var range = 1.45;
		return (new Weapon(this.curId++, 'sword', false, 1, TypeEnum.WEAPON_1H, level, damageMin, damageMax, damageMod, speedMod, range));
	}
	this.createMoney = function(quantity){
		return (new Item(this.curId++, 'gold', true, quantity, TypeEnum.GOLD));
	}
	this.createArmor = function(level){
		var rating = level;
		var dmgred = 0;
		return (new Armor(this.curId++, 'armor', false, 1, TypeEnum.ARMOR, rating, dmgred));
	}
}

function Container(max_size, parent_container){
	this.name = 'container';
	this.size = max_size || 16;
	this.contents = [];

	this.getFirstEmptyIndex = function(){
		for(var i = 0; i < this.size; i++){
			if(!this.contents[i]){
				return i;
			}
		}
		return (-1);
	}
	this.addItem = function(item, position){
		var index = this.getFirstEmptyIndex();
		if(index == -1) return;
		if(position >= this.size) return;
		if(this.contents[position]){
			if(this.contents[position].name == item.name && item.stackable){
				this.stackItem(this.contents[position], item);
				return;
			}
			this.contents[index] = item;
		}
		else{
			this.contents[position] = item;
		}
	}
	this.stackItem = function(item1, item2){
		item1.quantity += item2.quantity;
		console.log('stacking')
	}
}















