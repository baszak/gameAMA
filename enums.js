var skillType = {
  INSTANT: 0,
  TIMED: 1,
  PASSIVE: 3,
  NEXT_ATTACK: 4
}

var skillEffect = {
  HEAL: 0,
  DAMAGE: 1,
  BUFF: 2,
  DEBUFF: 3,
  LIFESTEAL: 6,
}

var buffType = {
  REGEN: 0,
  SHIELD: 1,
  DMGBOOST: 2,
  STEALTH: 3,
  SPEEDBST: 4,
  ATKSPEEDBST: 5,
  IMMUNITY: 6,
  DMGREFLECT: 7,
  NEXT_ATK: 8
}
var debuffType = {
  BLEEDING: 0,
  POISON: 1,
  SLOW: 2,
  FIRE: 3,
  DISARM: 4,
  STUN: 5,
  SILENCE: 6,
  WEAKNESS: 7,
  FRAGILE: 8
}

var targetType = {
  SELF: 0,
  TARGET: 1,
  AREA: 2
}

var objType = {
  PLAYER: 0,
  MOB: 1
}

var itemType = {
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
  GOLD: 11,
  SKILL: 12
}


if(Object.freeze){
  Object.freeze(targetType);
  Object.freeze(buffType);
  Object.freeze(skillEffect);
  Object.freeze(skillType);
  Object.freeze(objType);
  Object.freeze(itemType);
}


var UrlDict = {
  mob: {
    'Bat': { src: 'img/bat_sprite.png', spriteX: 84, spriteY: 84, spriteN: 8 },
    'BigBat': { src: 'img/bat_sprite_big.png', spriteX: 84, spriteY: 84, spriteN: 8 }
  },
  skill: {
    'Heal': { src: 'img/heal_sprite.png'},
    'skill_test': {src: 'img/skill_test_sprite.png'}
  },
  item: {
    // 'sword': {src: 'img/sword.png'}
  }
}
