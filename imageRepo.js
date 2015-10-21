var urlDict = {
  'placeholder': {src: 'img/placeholder.png', spriteX: 32, spriteY: 32, spriteN: 1},
  'Bat': { src: 'img/mobs/bat_sprite.png', spriteX: 32, spriteY: 32, spriteN: 8 },
  'BigBat': { src: 'img/mobs/bat_sprite_big.png', spriteX: 32, spriteY: 21, spriteN: 8 },
  'Dummy': {src: 'img/mobs/training_dummy.png', spriteX: 64, spriteY: 77, spriteN: 1},
  'Fly_right': {src: 'img/mobs/fly_run_right.png', spriteX: 32, spriteY: 32, spriteN: 4},
  'Fly_left': {src: 'img/mobs/fly_run_left.png', spriteX: 32, spriteY: 32, spriteN: 4},
  'Rayman_right': {src: 'img/player/player_rayman_right.png', spriteX: 32, spriteY: 48, spriteN: 1},
  'Rayman_left': {src: 'img/player/player_rayman_left.png', spriteX: 32, spriteY: 48, spriteN: 1},
  'Rayman_down': {src: 'img/player/player_rayman_down.png', spriteX: 32, spriteY: 48, spriteN: 1},
  'Rayman_up': {src: 'img/player/player_rayman_up.png', spriteX: 32, spriteY: 48, spriteN: 1},
  'Rayman_run_right': {src: 'img/player/player_rayman_run_right.png', spriteX: 32, spriteY: 48, spriteN: 13},
  'Rayman_run_left': {src: 'img/player/player_rayman_run_left.png', spriteX: 32, spriteY: 48, spriteN: 13},
  'Rayman_run_down': {src: 'img/player/player_rayman_run_down.png', spriteX: 32, spriteY: 48, spriteN: 13},
  'Rayman_run_up': {src: 'img/player/player_rayman_run_up.png', spriteX: 32, spriteY: 48, spriteN: 13},

  // 'Heal': { src: 'img/heal_sprite.png'},
  'skill_test': { src: 'img/skill_test_sprite.png'},
  'blood_big' : { src: 'img/blood_spatter_big.png', spriteX: 32, spriteY: 32, spriteN: 24},
  'blood_small': { src: 'img/blood_spatter_small.png', spriteX: 32, spriteY: 32, spriteN: 8},
  'green_player': {src: 'img/knight_green.png'},
  'red_player': {src: 'img/knight.png', spriteX: 16, spriteY: 16, spriteN: 1},
  'sword_slash': {src: 'img/slash_sword.png', spriteX: 25, spriteY: 18, spriteN: 3},
  'big_sword_slash': {src: 'img/slash_big_sword.png', spriteX: 24, spriteY: 72, spriteN: 3},
  'big_sword_bloody_slash': {src: 'img/slash_big_sword_bloody.png', spriteX: 24, spriteY: 72, spriteN: 3},
  'arrow': {src: 'img/items/arrow.png', spriteX: 32, spriteY: 32, spriteN: 1},
  'explosion': {src: 'img/explo.png', spriteX: 84, spriteY: 84, spriteN: 7},
  'arrow_hit': {src: 'img/arrow_hit.png', spriteX: 32, spriteY: 32, spriteN: 7},
  'blood_hit': {src: 'img/blood_hit.png', spriteX: 32, spriteY: 32, spriteN: 7},
  'spawn_puff': {src: 'img/spawn_puff.png', spriteX: 32, spriteY: 32, spriteN: 8},
  'spawn_puff_2': {src: 'img/spawn_puff_2.png', spriteX: 32, spriteY: 32, spriteN: 7},
  'bubba': {src: 'img/mobs/bubba.png', spriteX: 64, spriteY: 64, spriteN: 4},
  'skill_sword': {src: 'img/skills/skill_tiles/skill_sword.png', spriteX: 32, spriteY: 32, spriteN: 1},
  'skill_sword_cd': {src: 'img/skills/skill_tiles/skill_sword_cd.png', spriteX: 32, spriteY: 32, spriteN: 1},
  'arrow_new': {src: 'img/items/arrow_new.png', spriteX: 32, spriteY: 32, spriteN: 1, init_angle: -Math.PI/4},
  'skill_fireball': {src: 'img/skills/Fireball.jpg', spriteX: 32, spriteY: 32, spriteN: 1},
  'skill_fireball_cd': {src: 'img/skills/Fireball_cd.jpg', spriteX: 32, spriteY: 32, spriteN: 1},
  'stomp': {src: 'img/skills/stomp.png', spriteX: 96, spriteY: 96, spriteN: 1, offsetX: 32, offsetY: 32},
  'tp_static': {src: 'img/tp_static.png', spriteX: 32, spriteY: 32, spriteN: 1},
  'action_bar_new': {src: 'img/actionbar/a_bar_new.png', spriteX: 1024, spriteY: 256, spriteN: 1},
  'xp_bar_new': {src: 'img/actionbar/xp_bar_new.png', spriteX: 568, spriteY: 8, spriteN: 1},
  'hp_full': {src: 'img/actionbar/hp_bar_full.png', spriteX: 130, spriteY: 16, spriteN: 1},
  'mana_full': {src: 'img/actionbar/mana_bar_full.png', spriteX: 130, spriteY: 16, spriteN: 1},

  //ITEMS
  'sword' : {src: 'img/items/epee.png', spriteX: 32, spriteY: 32, spriteN: 1},
  'armor' : {src: 'img/items/armor.png', spriteX: 32, spriteY: 32, spriteN: 1},
  'Lightsaber' : {src: 'img/items/green_jedi_sword.png', spriteX: 32, spriteY: 32, spriteN: 1},

  //SKILLS
  'skill_sword': {src: 'img/skills/skill_tiles/skill_sword.png', spriteX: 32, spriteY: 32, spriteN: 1},
  'skill_sword_cd': {src: 'img/skills/skill_tiles/skill_sword_cd.png', spriteX: 32, spriteY: 32, spriteN: 1},
  'skill_bow_cd': {src: 'img/skills/skill_tiles/skill_bow_cd.png', spriteX: 32, spriteY: 32, spriteN: 1},
  'skill_bow': {src: 'img/skills/skill_tiles/skill_bow.png', spriteX: 32, spriteY: 32, spriteN: 1},
  'skill_bleeding': {src: 'img/skills/skill_tiles/skill_sword.png', spriteX: 32, spriteY: 32, spriteN: 1},
  'skill_heal': {src: 'img/skills/skill_tiles/skill_sword.png', spriteX: 32, spriteY: 32, spriteN: 1}
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
    urlDict[i].hasOwnProperty('offsetX') && (allImages[i].offsetX = urlDict[i].offsetX);
    urlDict[i].hasOwnProperty('offsetY') && (allImages[i].offsetY = urlDict[i].offsetY);
    urlDict[i].hasOwnProperty('init_angle') && (allImages[i].init_angle = urlDict[i].init_angle);
}