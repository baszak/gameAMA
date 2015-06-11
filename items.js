var ifac = new ItemFactory();

function Item(id, name, stackable, quantity, type){
	this.id = id;
	this.name = name;
	this.type = type;
	this.stackable = stackable;
	this.quantity = quantity;
}
Weapon.prototype = Object.create(Item.prototype);
Weapon.prototype.constructor = Weapon;
function Weapon(id, name, stackable, quantity, type, level, damageMin, damageMax, damageMod, speedMod, range, hitrateMod, armorPenetration){
	Item.call(this, id, name, stackable, quantity, type);
	this.level = level;
	this.damageMin = damageMin;
	this.damageMax = damageMax;
	this.damageMod = damageMod;
	this.speedMod = speedMod;
	this.range = range;
	this.hitrateMod = hitrateMod;
	this.armorPenetration = armorPenetration;
}

Armor.prototype = Object.create(Item.prototype);
Armor.prototype.constructor = Armor;
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
		var range = 1.45;
		var hitrateMod = 0;
		var armorPenetration = 0;
		var stackable = false;
		var quantity = 1;
		return (new Weapon(this.curId++, 'sword', stackable, quantity, itemType.WEAPON_1H, level, damageMin, damageMax, damageMod, speedMod, range, hitrateMod, armorPenetration));
	}
	this.createMoney = function(quantity){
		var stackable = true;
		return (new Item(this.curId++, 'gold', stackable, quantity, itemType.GOLD));
	}
	this.createArmor = function(level){
		var stackable = false;
		var quantity = 1;
		var rating = level;
		var dmgred = 0;
		return (new Armor(this.curId++, 'armor', stackable, quantity, itemType.ARMOR, rating, dmgred));
	}
	this.createSkill = function(type, target, range, effect, buff, debuff, duration){
		switch(type){
			case skillType.INSTANT:
				switch(target){
					case targetType.SELF:
						switch(effect){
							case skillEffect.HEAL:
								
								break;
							case skillEffect.DAMAGE:

								break;
							case skillEffect.BUFF:

								break;
							case skillEffect.DEBUFF:

								break;
							case skillEffect.STUN:

								break;
							case skillEffect.SLOW:

								break;
							case skillEffect.LIFESTEAL:

								break;
					}
						break;
					case targetType.TARGET:

						break;
					case targetType.AREA:

						break;
				}


				break;
			case skillType.TIMED:
				


				break;
			case skillType.PASSIVE:
				


				break;
		}






		var stackable = false;
		var quantity = 1;
		var range = user.data.equipment.primary.range;
		return (new Skill(this.curId++, 'skill_test', stackable, quantity, type, targetType.SELF, range, skillEffect.BUFF, buffType.DMGBOOST));
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















