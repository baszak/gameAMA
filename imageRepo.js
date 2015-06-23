var urlDict = {
  'Bat': { src: 'img/bat_sprite.png', spriteX: 84, spriteY: 84, spriteN: 8 },
  'BigBat': { src: 'img/bat_sprite_big.png', spriteX: 84, spriteY: 84, spriteN: 8 },
  'Dummy': {src: 'img/training_dummy.png', spriteX: 64, spriteY: 77, spriteN: 1},
  // 'Heal': { src: 'img/heal_sprite.png'},
  'skill_test': { src: 'img/skill_test_sprite.png'},
  'blood_big' : { src: 'img/blood_spatter_big.png', spriteX: 32, spriteY: 32, spriteN: 24},
  'blood_small': { src: 'img/blood_spatter_small.png', spriteX: 32, spriteY: 32, spriteN: 8},
  'green_player': {src: 'img/knight_green.png'},
  'red_player': {src: 'img/knight.png', spriteX: 16, spriteY: 16, spriteN: 1},
  'sword': {src: 'img/slash_sword.png', spriteX: 25, spriteY: 18, spriteN: 3},
  'big_sword': {src: 'img/slash_big_sword.png', spriteX: 24, spriteY: 72, spriteN: 3},
  'big_sword_bloody': {src: 'img/slash_big_sword_bloody.png', spriteX: 24, spriteY: 72, spriteN: 3},
  'arrow': {src: 'img/items/arrow.png', spriteX: 32, spriteY: 32, spriteN: 1},
  'explosion': {src: 'img/explo.png', spriteX: 84, spriteY: 84, spriteN: 7},
  'arrow_hit': {src: 'img/arrow_hit.png', spriteX: 32, spriteY: 32, spriteN: 7},
  'spawn_puff': {src: 'img/spawn_puff.png', spriteX: 32, spriteY: 32, spriteN: 8},
  'spawn_puff_2': {src: 'img/spawn_puff_2.png', spriteX: 32, spriteY: 32, spriteN: 7},
  'bubba': {src: 'img/bubba.png', spriteX: 64, spriteY: 64, spriteN: 4},
  'skill_sword': {src: '/img/skills/skill_tiles/skill_sword.png', spriteX: 32, spriteY: 32, spriteN: 1},
  'skill_sword_cd': {src: '/img/skills/skill_tiles/skill_sword_cd.png', spriteX: 32, spriteY: 32, spriteN: 1},
  'arrow_new': {src: 'img/arrow_new.png', spriteX: 32, spriteY: 32, spriteN: 1, init_angle: -Math.PI/4},
  'skill_fireball': {src: 'img/skills/Fireball.jpg', spriteX: 32, spriteY: 32, spriteN: 1},
  'skill_fireball_cd': {src: 'img/skills/Fireball_cd.jpg', spriteX: 32, spriteY: 32, spriteN: 1}
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
    urlDict[i].hasOwnProperty('init_angle') && (allImages[i].init_angle = urlDict[i].init_angle);
}