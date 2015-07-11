var ifac = new ItemFactory();

function Item(id, name, stackable, quantity, type){
	this.id = id;
	this.name = name;
	this.type = type;
	this.stackable = stackable;
	this.quantity = quantity;
}
Skill.prototype = Object.create(Item.prototype);
Skill.prototype.constructor = Skill;
function Skill(id, name, stackable, quantity, type, abilities, cooldown){
  Item.call(this, id, name, stackable, quantity, type);
  this.abilities = abilities;
  this.cooldown = cooldown;
  this.lastUseTime = new Date().getTime();
  this.ready = false;
  this.equip = function(user, slot) {
  	if(user.data.skills[slot] || slot > 3) return;
  	user.data.skills[slot] = this;
  	this.lastUseTime = frameTime;
  	for(var i=0; i<this.abilities.length; i++){
  		var a = this.abilities[i];
  		if(a.type == skillType.PASSIVE)
  			if(a.target == skillTarget.SELF)
					if(a.effect == skillEffect.HEAL){
  					if(a.valueType == valueType.PERCENT){
  						user.data.healthRegen += user.data.healthRegenBase * a.value;
  					}
  					else if(a.valueType == valueType.STATIC){
  						user.data.healthRegen += a.value;
  					}
  				}
  				else if(a.effect == skillEffect.DMGBOOST){
  					if(a.valueType == valueType.PERCENT){
  						user.data.dmgMod += user.data.dmgModBase * a.value;
  					}
  					else if(a.valueType == valueType.STATIC){
  						user.data.dmgMod += a.value;
  					}
  				}
  				else if(a.effect == skillEffect.LIFESTEAL){
  					if(a.valueType == valueType.PERCENT){
  						user.data.lifeSteal += user.data.lifeStealBase * a.value;
  					}
  					else if(a.valueType == valueType.STATIC){
  						user.data.lifeSteal += a.value;
  					}
  				}
  				else if(a.effect == skillEffect.ATKSPEEDBOOST){
  					if(a.valueType == valueType.PERCENT){
  						user.data.atkSpeedBoost += user.data.atkSpeedBase * a.value;
  					}
            else if(a.valueType == valueType.STATIC){
              user.data.atkSpeedBoost += a.value;
            }
  				}
  				else if(a.effect == skillEffect.EVASIONBOOST){
  					if(a.valueType == valueType.PERCENT){
  						user.data.evasionBoost += user.data.evasionBase * a.value;
  					}
            else if(a.valueType == valueType.STATIC){
              user.data.evasionBoost += a.value;
            }
  				}
  				else if(a.effect == skillEffect.CRITDMG){
  					if(a.valueType == valueType.PERCENT){
  						user.data.critDamage += user.data.critDamageBase * a.value;
  					}
  					else if(a.valueType == valueType.STATIC){
  						user.data.critDamage += a.value;
  					}
  				}
  				else if(a.effect == skillEffect.CRITCHANCE){
  					if(a.valueType == valueType.PERCENT){
  						user.data.critChance += user.data.critChanceBase*a.value;
  					}
  					else if(a.valueType == valueType.STATIC){
  						user.data.critChance += a.value;
  					}
  				}
  				else if(a.effect == skillEffect.DMGREFLECT){
  					if(a.valueType == valueType.PERCENT){
              user.data.dmgReflect += user.data.dmgReflectBase*a.value;
  					}
  					else if(a.valueType == valueType.STATIC){
  						user.data.dmgReflect += a.value;
  					}
  				}
  				else if(a.effect == skillEffect.SPEEDBST){
  					if(a.valueType == valueType.PERCENT){
  						user.data.speedCur += user.data.speedBase*a.value;
  					}
            else if(a.valueType == valueType.STATIC){
              user.data.speedCur += a.value;
            }
  				}
  				else if(a.effect == skillEffect.MAGICIMMUNITY){
  					if(a.valueType == valueType.PERCENT){
  						user.data.magicImmunity += user.data.magicImmunityBase*a.value;
  					}
            else if(a.valueType == valueType.STATIC){
              user.data.magicImmunity += a.value;
            }
  				}
  				else if(a.effect == skillEffect.PHYSICALIMMUNITY){
  					if(a.valueType == valueType.PERCENT){
  						user.data.physicalImmunity += user.data.physicalImmunityBase*a.value;
  					}
            else if(a.valueType == valueType.STATIC){
              user.data.physicalImmunity += a.value;
            }
  				}
          else if(a.effect == skillEffect.BLOCKCHANCE){
            if(a.valueType == valueType.PERCENT){
              user.data.blockChance += user.data.blockChanceBase*a.value;
            }
            else if(a.valueType == valueType.STATIC){
              user.data.blockChance += a.value;
            }
          }
  	}
  };
  this.takeOff = function(user, slot) {
  	if(!user.data.skills[slot] || slot>3) return;
  	user.data.skills[slot] = 0;
  	for(var i=0; i<this.abilities.length; i++){
  		var a = this.abilities[i]
  		if(a.type == skillType.PASSIVE){
        if(a.target == skillTarget.SELF){
          if(a.effect == skillEffect.HEAL){
            if(a.valueType == valueType.PERCENT){
              user.data.healthRegen -= user.data.healthRegenBase * a.value;
            }
            else if(a.valueType == valueType.STATIC){
              user.data.healthRegen -= a.value;
            }
          }
          else if(a.effect == skillEffect.DMGBOOST){
            if(a.valueType == valueType.PERCENT){
              user.data.dmgMod -= user.data.dmgModBase * a.value;
            }
            else if(a.valueType == valueType.STATIC){
              user.data.dmgMod -= a.value;
            }
          }
          else if(a.effect == skillEffect.LIFESTEAL){
            if(a.valueType == valueType.PERCENT){
              user.data.lifeSteal -= user.data.lifeStealBase * a.value;
            }
            else if(a.valueType == valueType.STATIC){
              user.data.lifeSteal -= a.value;
            }
          }
          else if(a.effect == skillEffect.ATKSPEEDBOOST){
            if(a.valueType == valueType.PERCENT){
              user.data.atkSpeed -= user.data.atkSpeedBase * a.value;
            }
            else if(a.valueType == valueType.STATIC){
              user.data.atkSpeed -= a.value;
            }
          }
          else if(a.effect == skillEffect.EVASIONBOOST){
            if(a.valueType == valueType.PERCENT){
              user.data.evasion -= user.data.evasionBase * a.value;
            }
            else if(a.valueType == valueType.STATIC){
              user.data.evasion -= a.value;
            }
          }
          else if(a.effect == skillEffect.CRITDMG){
            if(a.valueType == valueType.PERCENT){
              user.data.critDamage -= user.data.critDamageBase * a.value;
            }
            else if(a.valueType == valueType.STATIC){
              user.data.critDamage -= a.value;
            }
          }
          else if(a.effect == skillEffect.CRITCHANCE){
            if(a.valueType == valueType.PERCENT){
              user.data.critChance -= user.data.critChanceBase*a.value;
            }
            else if(a.valueType == valueType.STATIC){
              user.data.critChance -= a.value;
            }
          }
          else if(a.effect == skillEffect.DMGREFLECT){
            if(a.valueType == valueType.PERCENT){
              user.data.dmgReflect -= user.data.dmgReflectBase*a.value;
            }
            else if(a.valueType == valueType.STATIC){
              user.data.dmgReflect -= a.value;
            }
          }
          else if(a.effect == skillEffect.SPEEDBST){
            if(a.valueType == valueType.PERCENT){
              user.data.speedCur -= user.data.speedBase*a.value;
            }
            else if(a.valueType == valueType.STATIC){
              user.data.speedCur -= a.value;
            }
          }
          else if(a.effect == skillEffect.MAGICIMMUNITY){
            if(a.valueType == valueType.PERCENT){
              user.data.magicImmunity -= user.data.magicImmunityBase*a.value;
            }
            else if(a.valueType == valueType.STATIC){
              user.data.magicImmunity -= a.value;
            }
          }
          else if(a.effect == skillEffect.PHYSICALIMMUNITY){
            if(a.valueType == valueType.PERCENT){
              user.data.physicalImmunity -= user.data.physicalImmunityBase*a.value;
            }
            else if(a.valueType == valueType.STATIC){
              user.data.physicalImmunity -= a.value;
            }
          }
          else if(a.effect == skillEffect.BLOCKCHANCE){
            if(a.valueType == valueType.PERCENT){
              user.data.blockChance -= user.data.blockChanceBase*a.value;
            }
            else if(a.valueType == valueType.STATIC){
              user.data.blockChance -= a.value;
            }
          }
      }
    }
  	}
  	console.log('user: %o', user);
};
  this.activate = function() {
  	this.lastUseTime = new Date().getTime();

  };
  this.update = function() {
  	(frameTime - this.lastUseTime > this.cooldown)?(this.ready = true):(this.ready = false);

  };

}

// [{type: skillType.INSTANT, target: skillTarget.SELF, effect: skillEffect.HEAL, value: 35, valueType: valueType.STATIC, duration: 0}]);


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
	this.createSkill = function(array, cooldown){
		var abilities = array;
		var cooldown = cooldown;


		var stackable = false;
		var quantity = 1;
		return (new Skill(this.curId++, 'skill_test', stackable, quantity, itemType.SKILL, abilities, cooldown));
	}
}
var test = ifac.createSkill([{type: skillType.INSTANT, target: skillTarget.SELF, effect: skillEffect.HEAL, value: 35, valueType: valueType.STATIC, duration: 0}], 40);

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















