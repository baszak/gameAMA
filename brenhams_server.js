module.exports = function calcLineOfSight (start_x, start_y, end_x, end_y) {
  var coordinatesArray = [];
  var x1 = start_x;
  var y1 = start_y;
  var x2 = end_x;
  var y2 = end_y;
  var dx = Math.abs(x2 - x1);
  var dy = Math.abs(y2 - y1);
  var sx = (x1 < x2) ? 1 : -1;
  var sy = (y1 < y2) ? 1 : -1;
  var err = dx - dy;
  coordinatesArray.push([y1, x1]);
  // Main loop
  while (!((x1 == x2) && (y1 == y2))) {
    var e2 = err << 1;
    if (e2 > -dy) {
      err -= dy;
      x1 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y1 += sy;
    }
    coordinatesArray.push([y1, x1]);
  }
  for(var i=0; i<coordinatesArray.length; i++){
    var y = coordinatesArray[i][0];
    var x = coordinatesArray[i][1];
    if(map.world[x][y] >= 1) return false;
  }
  return true;
}