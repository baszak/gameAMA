var socket = io.connect('http://localhost:6767');
var player_id = prompt('id: '); //acts like authentication for reetarded children.
var mobzz = {};
var gh = 32;
var game_size = {w: 32, h: 16};
var map = new Map(null, 140, 260);
socket.emit('request-map-world', {});
var canvas = document.getElementById('game');
canvas.width = game_size.w*gh;
canvas.height = game_size.h*gh;
// canvas.style.cursor = "none";
var ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
var lastKeyEvent;
var frameTime = new Date().getTime();
var lastFrame = new Date().getTime();
var mousepos = {x:0, y:0};

var otherPlayers = {};
var statusMessage = new StatusMessage(canvas);

loadshit = function(){

  var entities = new EntityManager();
  var popups = [];

  var actionBar = new ActionBar();
  var experienceBar = new ExperienceBar();
  var webFilter = new FilterManager();

  var audio = new AudioManager();
  var targetedUnit = null;

  var missiles = new Missiles();

  // var tooltipMessage = new TooltipMessage(canvas);
}







socket.on('load-player', function(data) {
  player1 = new Player(data.id, data.x, data.y, data.level, data.experience, data.name, data.healthMax, data.healthCur, data.manaMax, data.manaCur, data.speedCur, data.attrPoints, data.skillPoints, data.eq);
  loadshit();
  requestAnimationFrame(update);
});
socket.on('players-move-update', function(data){
  if(serverDataInitialized){
    if(otherPlayers[data.id]){
      otherPlayers[data.id].tx = data.tx;
      otherPlayers[data.id].ty = data.ty;
      if(data.id == player1.id){
        player1.tx = data.tx;
        player1.ty = data.ty;
      }
    }
  }
});
socket.on('data-update', function (data){
  for(var i in data.mobs){
    var id = data.mobs[i].id
    if(!mobzz[id]) continue;
      mobzz[id].tx = data.mobs[i].tx;
      mobzz[id].ty = data.mobs[i].ty;
      mobzz[id].healthMax = data.mobs[i].healthMax;
      mobzz[id].healthCur = data.mobs[i].healthCur;
      mobzz[id].speed = data.mobs[i].speed;
  }
  for(var i in data.players){
    if(player1.id == i){
      player1.healthMax = data.players[i].healthMax;
      player1.healthCur = data.players[i].healthCur;
      player1.speedCur = data.players[i].speedCur;
    }
    if(!otherPlayers.hasOwnProperty(i))
      continue;
    otherPlayers[i].healthMax = data.players[i].healthMax;
    otherPlayers[i].healthCur = data.players[i].healthCur;
    otherPlayers[i].speedCur = data.players[i].speedCur;
  }
})

socket.on('player-disconnected', function (data){
  if(otherPlayers.hasOwnProperty(data))
    delete otherPlayers[data];
});
socket.on('ping back', function(data){
  console.log(frameTime - data);
});
socket.on('player-connected', function (data){
  otherPlayers[data.id] = new OtherPlayer(data.id, data.name, data.level, data.x, data.y, data.healthMax, data.healthCur, data.speedCur, 'green_player');
  missiles.push(new ShortAnimation(data.x, data.y, 'spawn_puff'));
});
socket.on('player-login-success', function (data){
  statusMessage.showMessage('login succesful ' + data.id, 3000);
});
socket.on('player-login-failure', function (data){
  statusMessage.showMessage('player ' + data.id + ' has been created', 3000);
});
socket.on('reconnect', function(){
  socket.emit('player-login-attempt', player_id);
  statusMessage.showMessage('welcome back', 3000);
});
socket.on('connect', function(){ //when socket establishes connection send login attempt
  socket.emit('player-login-attempt', player_id);
});
socket.on('send-map-world', function (data){
  map.world = data;
});
socket.on('player-initiate-current-objects', function(data){
  console.log('initiating current objects');
  for(var i in data.mobs)
    mobzz[data.mobs[i].id] = new Mob(data.mobs[i].id, data.mobs[i].tx, data.mobs[i].ty, data.mobs[i].healthMax, data.mobs[i].healthCur, data.mobs[i].speed, data.mobs[i].name);
  for(var id in data.players)
    otherPlayers[id] = new OtherPlayer(id, data.players[id].name, data.players[id].level, data.players[id].x, data.players[id].y, data.players[id].healthMax , data.players[id].healthCur , data.players[id].speedCur, 'green_player');
  serverDataInitialized = true;
});
socket.on('mob-spawned', function (data){
  mobzz[data.id] = new Mob(data.id, data.tx, data.ty, data.healthMax, data.healthCur, data.speed, data.name);
  missiles.push(new ShortAnimation(data.tx, data.ty, 'spawn_puff'));
});
socket.on('player-take-damage', function (data){
  player1.id==data.id ? player1.takeDamage(data) : (otherPlayers[data.id] && otherPlayers[data.id].takeDamage(data.id, data.dmg));
});
socket.on('mob-take-damage', function (data){
  mobzz[data.id] && mobzz[data.id].takeDamage(data.dmg);
});
socket.on('gained-exp', function (data){
  player1.experience != data.totalExp?(player1.experience = data.totalExp):player1.experience += data.gainedExp;
});
socket.on('mob-death', function (data){
  if(mobzz[data])
    mobzz[data].die();
});
socket.on('player-death', function (data){
  console.log("You're dead");
  setTimeout(function(){ location.reload(); }, 3000);
  // alert("You're dead son. Better luck next time.");
});
socket.on('player-attack-bow', function (data){
  if(data.id == player_id) return;
  missiles.push(new Projectile(otherPlayers[data.id].tx, otherPlayers[data.id].ty, data.target.x, data.target.y, 'arrow_new', 'blood_hit', 'arrow_hit'))
});
socket.on('player-teleport', function (data){
  player1.x = data.x;
  player1.y = data.y;
  player1.tx = data.x;
  player1.ty = data.y;
  player1.ax = 0;
  player1.ay = 0;
  player1.moving = false;
});

function autoTarget(){
  if(targetedUnit) targetedUnit.isTargeted = false;
  targetedUnit = mobzz.min(function(e){
    return Math.pow((e.x - player1.x), 2)+ Math.pow((e.y - player1.y), 2);
  });  
  targetedUnit && (targetedUnit.isTargeted = true);
}

function handleClick(e) {
  if(event.which == 2 || event.which == 3) return;//return on middle and right click
  mousepos = {x: (e.clientX - canvas.getBoundingClientRect().left), y:(e.clientY - canvas.getBoundingClientRect().top)};
  if(mousepos.y>430) return;

  clientX = Math.floor((mousepos.x - map.x)/gh);
  clientY = Math.floor((mousepos.y - map.y)/gh);
  player1.moveQ.findPath(player1.tx, player1.ty, clientX, clientY);
  
  for(var i in mobzz){
    var enemy = mobzz[i];
    if(Math.floor((mousepos.x - map.x)/gh) == enemy.tx && Math.floor((mousepos.y - map.y)/gh) == enemy.ty){
      if(targetedUnit && targetedUnit != enemy)
        targetedUnit.isTargeted = false;
      (targetedUnit = enemy).isTargeted = !(targetedUnit.isTargeted);
      player1.moveQ.currentPath = [];
      return;
    }
  }
  for(var i in otherPlayers){
    if(otherPlayers[i].id == player1.id) continue;
    var enemy = otherPlayers[i];
    if(Math.floor((mousepos.x - map.x)/gh) == enemy.tx && Math.floor((mousepos.y - map.y)/gh) == enemy.ty){
      if(targetedUnit && targetedUnit != enemy)
        targetedUnit.isTargeted = false;
      (targetedUnit = enemy).isTargeted = !(targetedUnit.isTargeted);
      player1.moveQ.currentPath = [];
      return;
    }
  }
}
function draw(ctx){
  ctx.clearRect(0, 0, game_size.w*gh, game_size.h*gh);

  map.drawBackground(ctx);
  map.drawForeground(ctx);
  for(var i=0; i<entities.allEntities.length; i++) entities.allEntities[i].draw(ctx);
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(Math.floor(mousepos.x/gh)*gh,Math.floor(mousepos.y/gh)*gh,gh,gh);
  ctx.translate(map.x, map.y);

  // teleports.draw(ctx);

  player1.draw(ctx);
  for(var i in otherPlayers) otherPlayers[i].draw(ctx);
  for(var i in mobzz) mobzz[i].draw(ctx);

  missiles.draw(ctx);
  for(var i = 0; i<popups.length; i++) popups[i].draw(ctx);

  ctx.translate(-map.x, -map.y);
  map.drawFront(ctx);

  actionBar.draw(ctx);
  experienceBar.draw(ctx);
}

var drugX = 0, drugY = 1, fadeStage = 0, fadeTime = 2000;
function update(){
  frameTime = new Date().getTime();
  if(frameTime - lastFrame > 5000){
    // ...
    console.log('tab off focus for > 5s');
  }

  if(player1.isDrugged){
    drugX = (drugX+1) % 360; drugY = Math.abs(Math.sin(drugX*Math.PI/180)+1);
    canvas.style.cssText="-webkit-filter:hue-rotate("+drugX+"deg) blur("+drugY+"px)";
  }
  if(player1.isDead && player1.dying){
    webFilter.die();
  }
  audio.update();
  
  checkInput();
  
  map.update(player1);
  entities.update();
  actionBar.update();
  experienceBar.update();

  player1.update();
  for(var i in otherPlayers) otherPlayers[i].update();
  for(var i in mobzz) mobzz[i].update();

  // spawner.update();
  missiles.update();
  
  statusMessage.update();
  for(var i = 0; i<popups.length;i++) popups[i].update();
  draw(ctx);
  lastFrame = frameTime;
  requestAnimationFrame(update);
}
function checkInput(){
  if (!lastKeyEvent) return;
  
  var e = lastKeyEvent;
  var key = e.which;
  if (key == "65") player1.move(-1, 0, 'left');
  if (key == "87") player1.move(0, -1, 'up');
  if (key == "68") player1.move(1, 0, 'right');
  if (key == "83") player1.move(0, 1, 'down');
  if (key == "73") console.log();
  if (key == "187") player1.toggleRegen();//=
  if (key == "117") {//f6
    var cheat = prompt('sup?');
    socket.emit('ping', {id: player_id, ch: cheat});
  }
  if (key == "32") autoTarget();
  if (key == "49" || key == "97") player1.attack();//1 or num1
  // if (key == "50" || key == "98") player1.skills[0].activate();//2 or num2
  player1["slot_"+ (key > 97 ? key - 97 : key -  49)] && player1["slot_"+ (key > 97 ? key - 97 : key -  49)]();

  lastKeyEvent = null;
}

$(document).ready(function(){

  $(document).keydown(function(e){ lastKeyEvent = e; });
  $('#c1 img').mousemove(function(e){ mousepos = {x: (e.clientX - canvas.getBoundingClientRect().left), y:(e.clientY - canvas.getBoundingClientRect().top)}; });
  $('#img2').mousedown(handleClick).on('dragstart', function(e) { e.preventDefault(); });
});