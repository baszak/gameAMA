var gh = 32;
var game_size = {w: 32, h: 16};
var map = new Map(null, 75, 75);
var canvas = document.getElementById('game');
canvas.width = game_size.w*gh;
canvas.height = game_size.h*gh;
//canvas.style.cursor = "none";
var ctx = canvas.getContext('2d');
var lastKeyEvent;
var frameTime = new Date().getTime();
var lastFrame = new Date().getTime();
var mousepos = {x:0, y:0};

// loadXMLDoc("test.xml");
// console.log("XML document loaded: " + xhttp.statusText);

var players = [];
players.push(new Player());
players.push(new Player("img/training_dummy.png", 2));

var mobzz = [];
var spawner = new MonsterSpawner();
var entities = new EntityManager();
var popups = [];

populateMobs();

var actionBar = new ActionBar();
var experienceBar = new ExperienceBar();
var webFilter = new FilterManager();

var audio = new AudioManager();
var targetedMob = null;

var missiles = new Missiles();

var statusMessage = new StatusMessage(canvas);
var tooltipMessage = new TooltipMessage(canvas);

function autoTarget(){
  if(targetedMob) targetedMob.isTargeted = false;
	targetedMob = mobzz.min(function(e){
    return Math.pow((e.x - players[0].x), 2)+ Math.pow((e.y - players[0].y), 2);
  });  
  targetedMob && (targetedMob.isTargeted = true);
}

function handleClick(e) {
  mousepos = {x: (e.clientX - canvas.getBoundingClientRect().left), y:(e.clientY - canvas.getBoundingClientRect().top)};
  if(mousepos.y>430){

  }
  else{
    clientX = Math.floor((mousepos.x - map.x)/gh);
    clientY = Math.floor((mousepos.y - map.y)/gh);
    players[0].moveQ.findPath(players[0].tx, players[0].ty, clientX, clientY);
    for(var i = mobzz.length; i--;) {
      var enemy = mobzz[i];
      if(Math.floor((mousepos.x - map.x)/gh) == enemy.tx && Math.floor((mousepos.y - map.y)/gh) == enemy.ty){
        if(targetedMob && targetedMob != enemy) targetedMob.isTargeted = false;
          (targetedMob = enemy).isTargeted = !(targetedMob.isTargeted);
          players[0].moveQ.currentPath = [];
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
  ctx.clearRect(0, 0, game_size.w*gh, game_size.h*gh);//is that needed?
  //EARTHQUAKE
  if(tm[0] == m[0] && tm[1] == m[1]){
    tm[0] = Math.round(5+Math.random()*10);
    tm[1] = Math.round(5+Math.random()*10);
  }
  m[0] += tm[0]>m[0]?0.5:-0.5;
  m[1] += tm[1]>m[1]?0.5:-0.5;
  // ctx.translate(m[0], m[1]);

  map.drawBackground(ctx);
  map.drawForeground(ctx);
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(Math.floor(mousepos.x/gh)*gh,Math.floor(mousepos.y/gh)*gh,gh,gh);
  ctx.translate(map.x, map.y);

    for(var i = 0; i< entities.allEntities.length; i++) entities.allEntities[i].draw();
    for(var i = mobzz.length; i--;) {mobzz[i].draw(ctx);}
    for(var i = 0; i<players.length; i++) {players[i].draw(ctx);}
    missiles.draw(ctx);
    for(var i = 0; i<popups.length; i++) {popups[i].draw(ctx);}

  ctx.translate(-map.x, -map.y);
  map.drawFront(ctx);

  // ctx.translate(-m[0], -m[1]);
  //EARTHQUAKE
  actionBar.draw(ctx);
  experienceBar.draw(ctx);
}

function checkInput(){
  if (!lastKeyEvent) return;
  
  var e = lastKeyEvent;
  var key = e.which;
	if (key == "65") players[0].move(-1, 0, 'left');
  if (key == "87") players[0].move(0, -1, 'up');
  if (key == "68") players[0].move(1, 0, 'right');
  if (key == "83") players[0].move(0, 1, 'down');
	if (key == "32") autoTarget();
  if (key == "49" || key == "97") players[0].attack();
  players[0]["slot_"+ (key > 97 ? key - 97 : key -  49)] && players[0]["slot_"+ (key > 97 ? key - 97 : key -  49)]();

  lastKeyEvent = null;
}

var drugX = 0, drugY = 1, fadeStage = 0, fadeTime = 2000;

function update(){
  frameTime = new Date().getTime();
	
  if(players[0].isDrugged){
    drugX = (drugX+1) % 360; drugY = Math.abs(Math.sin(drugX*Math.PI/180)+1);
    canvas.style.cssText="-webkit-filter:hue-rotate("+drugX+"deg) blur("+drugY+"px)";
  }
  if(players[0].limboState && players[0].puttingToSleep){
    webFilter.limbo();
  }
  audio.update();
  
  checkInput();
	
  map.update(players[0]);

  experienceBar.update();
  for(var i=0; i < mobzz.length; i++) {mobzz[i].update(); }
  for(var i=0; i < 1; i++) {players[i].update(); }
  spawner.update();
  missiles.update();
  
	statusMessage.update();
	for(var i = 0; i<popups.length;i++) {popups[i].update();}
	draw(ctx);
  lastFrame = frameTime;
	requestAnimationFrame(update);
}

$(document).ready(function(){

  requestAnimationFrame(update);
  
  $.getJSON('map_16tiles_resized.json',{},
      function(data){
        var x, y, h, w;
        for(var o = 0; o < data.layers[4].objects.length; o++){
          h = Math.round(data.layers[4].objects[o].height/gh);
          w = Math.round(data.layers[4].objects[o].width/gh);
          x = Math.round(data.layers[4].objects[o].x/gh);
          y = Math.round(data.layers[4].objects[o].y/gh);
          // console.log(h, w, x, y)
          for(var i = x; i < (x+w); i++){
            for(var j = y; j < (y+h); j++){
              map.world[i][j] = 1;
            }
          }
        }
      }
    );
  $(document).keydown(function(e){ lastKeyEvent = e; });
  $('img').mousemove(function(e){ mousepos = {x: (e.clientX - canvas.getBoundingClientRect().left), y:(e.clientY - canvas.getBoundingClientRect().top)}; });
  $('img').mousedown(handleClick).on('dragstart', function(e) { e.preventDefault(); });
});