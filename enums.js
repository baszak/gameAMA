var skillType = {
  INSTANT: 0,
  PASSIVE: 1,
}

var skillEffect = {
  HEAL: 0,
  DAMAGE: 1,
  BLEEDING: 2,
  FIRE: 3,
  POISON: 4,
  MAGICSHIELD: 5,
  /*PERCENTAGE EFFECT*/
  LIFESTEAL: 6,
  DMGBOOST: 7,
  ATKSPEEDBOOST: 8,
  EVASIONBOOST: 9,
  CRITBOOST: 10,
  DMGREFLECT: 11,
  WEAKNESS: 12,
  BREAKSHIELD: 13,
  SPEEDBST: 14,
  IMMUNITY: 15,
  SLOW: 16,
  /*FULL EFFECT NEED DURATION*/
  SILENCE: 17,
  STUN: 18,
  DISARM: 19,
  STEALTH: 20
}

var skillTarget = {
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
  Object.freeze(skillType);
  Object.freeze(skillEffect);
  Object.freeze(skillTarget);
  Object.freeze(objType);
  Object.freeze(itemType);
}else console.log('nie bangla')


var urlDict = {
  'Bat': { src: 'img/bat_sprite.png', spriteX: 84, spriteY: 84, spriteN: 8 },
  'BigBat': { src: 'img/bat_sprite_big.png', spriteX: 84, spriteY: 84, spriteN: 8 },
  'Dummy': {src: 'img/training_dummy.png', spriteX: 64, spriteY: 77, spriteN: 1},
  // 'Heal': { src: 'img/heal_sprite.png'},
  'skill_test': { src: 'img/skill_test_sprite.png'},
  'blood_big' : { src: 'img/blood_spatter_big.png', spriteX: 32, spriteY: 32, spriteN: 24},
  'blood_small': { src: 'img/blood_spatter_small.png', spriteX: 32, spriteY: 32, spriteN: 8},
  'green_player': {src: 'img/knight_green.png'},
  'red_player': {src: 'img/knight.png'},
  'sword': {src: 'img/slash_sword.png', spriteX: 25, spriteY: 18, spriteN: 3},
  'big_sword': {src: 'img/slash_big_sword.png', spriteX: 24, spriteY: 72, spriteN: 3},
  'big_sword_bloody': {src: 'img/slash_big_sword_bloody.png', spriteX: 24, spriteY: 72, spriteN: 3},
  'arrow': {src: 'img/arrow.png', spriteX: 32, spriteY: 32, spriteN: 1},
  'explosion': {src: 'img/explo.png', spriteX: 84, spriteY: 84, spriteN: 7},
  'arrow_hit': {src: 'img/arrow_hit.png', spriteX: 32, spriteY: 32, spriteN: 7},
  'spawn_puff': {src: 'img/spawn_puff.png', spriteX: 32, spriteY: 32, spriteN: 8}
}
var totalImageCount = 0;
for(i in urlDict) totalImageCount++;
var allImages = {};
var loadedImages = 0;
for(i in urlDict){
    allImages[i] = new Image();
    allImages[i].onload = function(){ loadedImages++; }
    urlDict[i].hasOwnProperty('src') && (allImages[i].src = urlDict[i].src);
    urlDict[i].hasOwnProperty('spriteX') && (allImages[i].spriteX = urlDict[i].spriteX);
    urlDict[i].hasOwnProperty('spriteY') && (allImages[i].spriteY = urlDict[i].spriteY);
    urlDict[i].hasOwnProperty('spriteN') && (allImages[i].spriteN = urlDict[i].spriteN);
}
