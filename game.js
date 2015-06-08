var player_id = prompt('id: ');

var socket = io.connect('http://localhost:6767');
  socket.on('players-data-update', function(data){
    if(serverDataInitialized){
      for(var i in data.playersData){
        if(!otherPlayers[i]) continue;
          otherPlayers[i].data.moveBuffer.push({tx: data.playersData[i].tx, ty: data.playersData[i].ty})
      }
      for(var i in data.mobs){
        if(!mobzz[i]) continue;
          mobzz[i].data.moveBuffer.push({tx: data.mobs[i].tx, ty: data.mobs[i].ty})
      }
    }
  });
socket.on('player-disconnected', function (data){
  if(otherPlayers.hasOwnProperty(data))
    delete otherPlayers[data];
});
socket.on('ping back', function(data){
  console.log(frameTime - data);
});
socket.on('player-connected', function (data){
  console.log('player ' + data.playerData.id + ' connected.');
  otherPlayers[data.id] = new OtherPlayer(data.playerData.name, data.playerData.level, data.playerData.x, data.playerData.y, data.playerData.healthMax, data.playerData.healthCur, data.playerData.speedCur);
  otherPlayers[data.id].data = data.playerData;
});
socket.on('player-login-success', function (data){
  statusMessage.showMessage('login succesful ' + data.id, 3000);
});
socket.on('player-login-failure', function (data){
  statusMessage.showMessage('no player ' + data.id + ' has been found...creating', 3000);
});
socket.on('reconnect', function(){
  socket.emit('player-login-attempt', player_id);
  statusMessage.showMessage('wolcome back', 3000);
});
socket.on('send-map-world', function (data){
  map.world = data;
});
socket.emit('player-login-attempt', player_id);
socket.on('player-initiate-current-objects', function(data){
  for(var sId in data.players)
    otherPlayers[sId] = new OtherPlayer(data.players[sId].id, data.players[sId].name, data.players[sId].level, data.players[sId].x, data.players[sId].y, data.players[sId].healthMax , data.players[sId].healthCur , data.players[sId].speedCur);
  for(var i in data.mobs){
    mobzz[data.mobs[6]] = new Mob(data.mobs[i][0], data.mobs[i][1], data.mobs[i][2], data.mobs[i][3, data.mobs[i][4]], data.mobs[i][5]);
    console.log(mobzz[data[6]].img.src)
  }
  serverDataInitialized = true;
});
socket.on('mob-spawned', function (data){
  console.log('gets here')
  mobzz[data[6]] = new Mob(data[0], data[1], data[2], data[3], data[4], data[5]);
});

var server_dataBuffer = [];
var mobzz = {};
var gh = 32;
var game_size = {w: 32, h: 16};
var map = new Map(null, 75, 75);
socket.emit('request-map-world', {});
var canvas = document.getElementById('game');
canvas.width = game_size.w*gh;
canvas.height = game_size.h*gh;
// canvas.style.cursor = "none";
var ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
var lastKeyEvent;
var frameTime = new Date().getTime();
var lastFrame = new Date().getTime();
var mousepos = {x:0, y:0};

// loadXMLDoc("test.xml");
// console.log("XML document loaded: " + xhttp.statusText);

// var players = [];
var player1 = new Player('img/knight.png', player_id, 2, 4);
var otherPlayers = {};
var showBackpack = false;
// players.push(new Player("img/training_dummy.png", 2));//just for testing. doesnt get drawn

// var spawner = new MonsterSpawner();
// spawner.populateMobs();

var entities = new EntityManager();
var popups = [];


var actionBar = new ActionBar();
var experienceBar = new ExperienceBar();
var webFilter = new FilterManager();

var audio = new AudioManager();
var targetedMob = null;

var missiles = new Missiles();

var statusMessage = new StatusMessage(canvas);
// var tooltipMessage = new TooltipMessage(canvas);

function autoTarget(){
  if(targetedMob) targetedMob.isTargeted = false;
  targetedMob = mobzz.min(function(e){
    return Math.pow((e.x - player1.data.x), 2)+ Math.pow((e.y - player1.data.y), 2);
  });  
  targetedMob && (targetedMob.isTargeted = true);
}

function handleClick(e) {
  mousepos = {x: (e.clientX - canvas.getBoundingClientRect().left), y:(e.clientY - canvas.getBoundingClientRect().top)};
  if(mousepos.y>430){
    //this is for now so won't move by clicking on the action bar
  }
  else{
    clientX = Math.floor((mousepos.x - map.x)/gh);
    clientY = Math.floor((mousepos.y - map.y)/gh);
    player1.data.moveQ.findPath(player1.data.tx, player1.data.ty, clientX, clientY);
    for(var i = mobzz.length; i--;) {
      var enemy = mobzz[i];
      if(Math.floor((mousepos.x - map.x)/gh) == enemy.tx && Math.floor((mousepos.y - map.y)/gh) == enemy.ty){
        if(targetedMob && targetedMob != enemy) targetedMob.isTargeted = false;
          (targetedMob = enemy).isTargeted = !(targetedMob.isTargeted);
          player1.data.moveQ.currentPath = [];
      }
    }
  }
}
function draw(ctx){
  ctx.clearRect(0, 0, game_size.w*gh, game_size.h*gh);

  map.drawBackground(ctx);
  map.drawForeground(ctx);
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(Math.floor(mousepos.x/gh)*gh,Math.floor(mousepos.y/gh)*gh,gh,gh);
  ctx.translate(map.x, map.y);

  for(var i = 0; i< entities.allEntities.length; i++) entities.allEntities[i].draw();


  player1.draw(ctx);
  for(var i in otherPlayers) otherPlayers[i].draw(ctx);
  for(var i in mobzz) mobzz[i].draw(ctx);


  // drawPlayers(ctx);
  if(showBackpack){
    ctx.font = "12px Impact";
    for(var i=0, j=0, k=0; i<player1.data.equipment.backpack.contents.length; i++, j++){
      if(j==5){
        j=0;
        k++;
      }
      ctx.fillStyle = '#3c3c3c';
      ctx.fillRect(400 + j*gh - map.x, gh*k+150-map.y, gh-3, gh-3);
      ctx.fillStyle = '#e1e2df';
      if(player1.data.equipment.backpack.contents[i])
        ctx.fillText(player1.data.equipment.backpack.contents[i].name, 400+j*gh - map.x, gh*k+166 -map.y);
    }
  }

//************ DRAW MOBS FROM SERVER *** deving
  ctx.fillStyle = 'green';
  for(var i in mobzz){
    var animationFrame = Math.floor(frameTime / mobzz[i].animationSpeed)%mobzz[i].spriteN;
    ctx.fillRect((mobzz[i].x + mobzz[i].ax)*gh, (mobzz[i].y + mobzz[i].ay)*gh, gh, gh);
    // ctx.drawImage(tempImg, animationFrame*mobzz[i].spriteX, 0, mobzz[i].spriteX, mobzz[i].spriteY, (mobzz[i].x + mobzz[i].ax)*gh, (mobzz[i].y + mobzz[i].ay)*gh, gh, gh);
    if(targetedMob == mobzz[i]){
      ctx.strokeStyle = "rgba(255, 0, 0, 1)";
      ctx.strokeRect((mobzz[i].x + mobzz[i].ax)*gh, (mobzz[i].y + mobzz[i].ay)*gh, gh, gh);
    }
  }
//********************************************************//
//********** DRAW OTHER PLAYERS FROM SERVER *************//

  missiles.draw(ctx);
  for(var i = 0; i<popups.length; i++) popups[i].draw(ctx);

  ctx.translate(-map.x, -map.y);
  map.drawFront(ctx);

  actionBar.draw(ctx);
  experienceBar.draw(ctx);
}

var drugX = 0, drugY = 1, fadeStage = 0, fadeTime = 2000;
function update(){
  // console.log(frameTime - ping);
  frameTime = new Date().getTime();
  
  if(player1.data.isDrugged){
    drugX = (drugX+1) % 360; drugY = Math.abs(Math.sin(drugX*Math.PI/180)+1);
    canvas.style.cssText="-webkit-filter:hue-rotate("+drugX+"deg) blur("+drugY+"px)";
  }
  if(player1.data.limboState && player1.data.dying){
    webFilter.die();
  }
  audio.update();
  
  checkInput();
  
  map.update(player1.data);

  experienceBar.update();
  // for(var i=0; i < mobzz.length; i++) {mobzz[i].update(); }
  player1.update();
  for(var i in otherPlayers) otherPlayers[i].update();

  // spawner.update();
  missiles.update();
  
  statusMessage.update();
  for(var i = 0; i<popups.length;i++) {popups[i].update();}
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
  if (key == "73") showBackpack = !showBackpack;
  if (key == "117"/* F6 */) {
    socket.emit('ping', frameTime);
  }
  if (key == "32") autoTarget();
  if (key == "49" || key == "97") player1.attack();
  player1["slot_"+ (key > 97 ? key - 97 : key -  49)] && player1["slot_"+ (key > 97 ? key - 97 : key -  49)]();

  lastKeyEvent = null;
}

$(document).ready(function(){

  requestAnimationFrame(update);
  $(document).keydown(function(e){ lastKeyEvent = e; });
  $('img').mousemove(function(e){ mousepos = {x: (e.clientX - canvas.getBoundingClientRect().left), y:(e.clientY - canvas.getBoundingClientRect().top)}; });
  // $('img').mousedown(handleClick).on('dragstart', function(e) { e.preventDefault(); });
});