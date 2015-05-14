var player_id = prompt('id: ');
var socket = io.connect('http://10.10.10.102:6767');
socket.on('players-data-update', function(data){
  onlinePlayersData = data;
  //aready getting data about existing player1s. reqrite shit to make it work
});
socket.on('player-login-success', function (data){
  alert('login succesful ' + data);
});
socket.on('player-login-failure', function (data){
  alert('no player' + data + ' has been found...creating');
});
socket.on('reconnect', function(){
  socket.emit('player-login-attempt', player_id);
  alert('welcome back');
});
socket.on('send-map-world', function (data){
  map.world = data;
  // for (var x=0; x < map.w; x++) {
  //   for (var y=0; y < map.h; y++){
  //     map.world[x][y] = data[x][y];
  //   }
  // }
});
  socket.emit('player-login-attempt', player_id);
  

var onlinePlayersData = {};
var gh = 32;
var game_size = {w: 32, h: 16};
var map = new Map(null, 75, 75);
socket.emit('request-map-world', {});
var canvas = document.getElementById('game');
canvas.width = game_size.w*gh;
canvas.height = game_size.h*gh;
// canvas.style.cursor = "none";
var ctx = canvas.getContext('2d');
// ctx.imageSmoothingEnabled = false;
// ctx.mozImageSmoothingEnabled = false;
// ctx.webkitImageSmoothingEnabled = false;
var lastKeyEvent;
var frameTime = new Date().getTime();
var lastFrame = new Date().getTime();
var mousepos = {x:0, y:0};

// loadXMLDoc("test.xml");
// console.log("XML document loaded: " + xhttp.statusText);

// var players = [];
var player1 = new Player('img/knight.png', player_id, 2, 4);
// players.push(new Player("img/training_dummy.png", 2));//just for testing. doesnt get drawn

var mobzz = [];
// var spawner = new MonsterSpawner();
var entities = new EntityManager();
var popups = [];

// populateMobs();

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
var m = [0, 0];
var tm = m;

var y_det=0, x_det=0;
var rad = 12;
//2 lines for the balls
function draw(ctx){
  ctx.clearRect(0, 0, game_size.w*gh, game_size.h*gh);
  //EARTHQUAKE
  // if(tm[0] == m[0] && tm[1] == m[1]){
  //   tm[0] = Math.round(5+Math.random()*10);
  //   tm[1] = Math.round(5+Math.random()*10);
  // }
  // m[0] += tm[0]>m[0]?0.5:-0.5;
  // m[1] += tm[1]>m[1]?0.5:-0.5;
  // ctx.translate(m[0], m[1]);

  map.drawBackground(ctx);
  map.drawForeground(ctx);
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(Math.floor(mousepos.x/gh)*gh,Math.floor(mousepos.y/gh)*gh,gh,gh);
  ctx.translate(map.x, map.y);

    for(var i = 0; i< entities.allEntities.length; i++) entities.allEntities[i].draw();
    for(var i = mobzz.length; i--;) {mobzz[i].draw(ctx);}

    player1.draw(ctx);
//********************************************************//
//********** DRAW OTHER PLAYERS FROM SERVER *************//
    for(var sId in onlinePlayersData){
      if(onlinePlayersData[sId].id == player1.data.id)
        continue;
      var that = onlinePlayersData[sId];

      if(that.x < that.tx)
        that.direction = 3;
      else if(that.x > that.tx)
        that.direction = 2;
      else if(that.y < that.ty)
        that.direction = 0;
      else if(that.y > that.ty)
        that.direction = 1;

      ctx.drawImage(player1.img_knight, that.direction*16, 0, 16, 16, (that.x + that.ax)*gh, (that.y + that.ay)*gh, gh, gh);
    }
//********** DRAW OTHER PLAYERS FROM SERVER ***************//
//********************************************************//
    missiles.draw(ctx);
    for(var i = 0; i<popups.length; i++) {popups[i].draw(ctx);}

  ctx.translate(-map.x, -map.y);
  map.drawFront(ctx);

  //EARTHQUAKE
  // ctx.translate(-m[0], -m[1]);
  actionBar.draw(ctx);
  experienceBar.draw(ctx);
}

var drugX = 0, drugY = 1, fadeStage = 0, fadeTime = 2000;

function update(){
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
  for(var i=0; i < mobzz.length; i++) {mobzz[i].update(); }
  for(var i=0; i < 1; i++) {player1.update(); }
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
  if (key == "32") autoTarget();
  if (key == "49" || key == "97") player1.attack();
  player1["slot_"+ (key > 97 ? key - 97 : key -  49)] && player1["slot_"+ (key > 97 ? key - 97 : key -  49)]();

  lastKeyEvent = null;
}

$(document).ready(function(){

  requestAnimationFrame(update);
  
  // $.getJSON('map_16tiles_resized.json',{},
  //     function(data){
  //       var x, y, h, w;
  //       for(var o in data.objects){
  //         h = Math.round(data.objects[o].height/gh);
  //         w = Math.round(data.objects[o].width/gh);
  //         x = Math.round(data.objects[o].x/gh);
  //         y = Math.round(data.objects[o].y/gh);
  //         for(var i = x; i < (x+w); i++){
  //           for(var j = y; j < (y+h); j++){
  //             map.world[i][j] = 1;
  //           }
  //         }
  //       }
  //     }
  //   );
  $(document).keydown(function(e){ lastKeyEvent = e; });
  $('img').mousemove(function(e){ mousepos = {x: (e.clientX - canvas.getBoundingClientRect().left), y:(e.clientY - canvas.getBoundingClientRect().top)}; });
  // $('img').mousedown(handleClick).on('dragstart', function(e) { e.preventDefault(); });
});