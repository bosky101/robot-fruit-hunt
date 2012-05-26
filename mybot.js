/**
 * Bhasker Kode aka Bosky
 */
var bot;
var BOT = function(_board){
    bot.log('new bot');
    var _this = this;
    _this.board = _board;
};

BOT.refresh = function(){
    
    bot = new BOT(get_board());
    bot.log('REFRESH');
    
    // first direction determined by most valuable fruit
    /*var x_start, x_end;
    if(bot.isOnLeft()){
	bot.next.x = bot.x();x_end = bot.x();
    }else{
	x_start = bot.x();x_end = WIDTH;
    }
    var y_start, y_end;
    if(bot.isOnLeft()){
	y_start = 0;y_end = bot.y();
    }else{
	y_start = bot.y();y_end = HEIGHT;
    }
    var startWithX = (x_start < y_start ) ? 'x':'y'; 
    bot.log('X: move from '+x_start+' to '+ x_end);
    bot.log('Y: move from '+y_start+' to '+ y_end);
    bot.log('startWithDirection: '+ startWithX);
    */

    var _area = WIDTH*HEIGHT;
    var numberOfGrids = _area/9;
    bot.log('grids: ',numberOfGrids,' for wxh: ',WIDTH,HEIGHT);
    
    //TODO: interchange width/height based on direction above
    var i=1,j=1,cont=1;
    bot.grid = [];bot.sorted=[];
    while(cont){
	bot.log('find points for radar: ',i,j,' =>');
	var pts = bot.getPointsForRadar(i,j);
	var _items=0,item_pts=[]
	for(var _pt in pts){
	    var pt = pts[_pt];
	    //bot.log(' pt',pt.x,',',pt.y);	
	    if(bot.board[pt.x]){
		var _found = has_item(bot.board[pt.x][pt.y]);
		if(_found){
		    bot.log('bot.board['+pt.x+']['+pt.y+'] has item! => ',has_item(bot.board[pt.x][pt.y]));
		    _items+=1;
		    item_pts.push({x:pt.x,y:pt.y});
		}
	    }
	}
	if(_items){
	    bot.log('range bot.board['+i+']['+j+'] has '+_items+' items!');
	}
	
	bot.grid.push( {key:i+','+j, x:i, y:j, value:_items, pts:pts, items:item_pts}); 
	
	if(i>WIDTH-1){
	    i=1;j+=1;
	}else{
	    i+=2;
	}
	if(j>HEIGHT){
	    bot.log('stop');
	    cont=false;
	}
    }
    bot.grid=bot.grid.sort( function(a,b){return (b.value) - (a.value);});
    
    for(var obj in bot.grid){
	var toadd = [];
	var pt = bot.grid[obj];
	bot.log('bot.board['+pt.key+'] has '+pt.value+' items!',pt.items);
	for(var _pt in pt.items){
	    var temppt = pt.items[_pt];
	    temppt.value = pt.value;
	    temppt.key = temppt.x+','+temppt.y;
	    if(!bot.hash[temppt.key]){
		toadd.push(temppt);
		bot.hash[temppt.key]=1;
	   }	
	}
	bot.todo = bot.todo.concat(toadd);
    }

    for(var _pt in bot.todo){
	var pt = bot.todo[_pt];
	bot.log('move to ',pt.x,pt.y,' => ',pt.value+' =>'+ has_item(bot.board[pt.x][pt.y]));
    }
    if(bot.todo[0]){
	bot.log('bot is at ',bot.x(),bot.y(),' move to',bot.todo[0].key);
    }
};

BOT.prototype = { 
    DEBUG:0,
    radar:1,
    todo:[],
    hash:{},
    x:function(){
	return get_my_x();
    },
    y: function(){
	return get_my_y();
    },
    isOnLeft: function(){
	return( this.x()< WIDTH/2);
    },
    isOnTop: function(){
	return( this.y()< HEIGHT/2);
    },
    start:{},end:{},moves:[],
    getPointsForRadar: function(x,y){
	var temp = [];
	var radar = this.radar;
	var done = radar*-1;
	//bot.log('make sure ',x*done,' > 0 < ',WIDTH,' and done ', done,' < radar ',radar);
	
	for(var a=0;a<=2*radar;a++){
	    var next_x = x - ( radar - a); 
	    for(var b=0;b<=2*radar;b++){
		var next_y = y + ( radar - b);
		temp.push({x:next_x,y:next_y});
	    }
	}

	/*for(var i=x-1;i>0 && i<=WIDTH && i< radar;i++){
	    for(var j=y-1;j>0 && j<=HEIGHT && <radar;j++){
		bot.log('i,j => ',i,j);
		temp.push({x:i,y:j});
	    }
	}*/
	return temp;
    },
    log: function(){
	if(this.DEBUG){
	    console.log.apply(console,arguments);
	}
    },
    pop: function(x,y,_lost){
	var _this = this;
	if(!x){
	    var _first = _this.todo[0];
	    var _removed = _this.todo.shift();
	    bot.log('\t'+_first,' == ',_removed , ' so removed to give next as ', _this.todo[0]);
	}else{
	    if(_lost){
		bot.log('\topponent took over ',x,y);
	    }
	    var temp=[],_found=[],_todo=_this.todo;
	    for(var _pt in _todo){
		var pt = _todo[_pt];
		if(pt.x == x && pt.y == y){
		    _found.push(_pt);
		}else{
		    temp.push(pt);
		}
	    }
	    if(temp.length){
		bot.log('\tstumbled on ',x,y,' so todo reduces from ',_this.todo.length,' to ',temp.length,' at indexes ',_found,' in ',_this.todo);
		_this.todo = temp;
	    }
	}
    }
};

function new_game() {
    // the magic
   BOT.refresh();
};

function make_move() {
   var board = get_board();
   
    var _target = bot.todo[0];
    if(!_target){ 
	bot.log('pass since no more moves in ', bot.todo);
	BOT.refresh();
	return PASS;
    }
    var message = bot.todo.length +' left: move from '+bot.x() +','+bot.y()+' to '+ _target.x+','+_target.y;
    
    var x_diff = _target.x - bot.x(); 
    x_diff *= (x_diff<0)? -1:1;
    var y_diff = _target.y - bot.y(); 
    y_diff *= (y_diff<0)? -1:1;

    // we found an item! take it!
    if (has_item(board[get_my_x()][get_my_y()]) > 0) {
	bot.log('\tFOUND next item at ', bot.x(),bot.y(),' remove ',_target.x,_target.y);
	if(_target.x == get_my_x() && _target.y == get_my_y()){
	    bot.pop();
	}else{
	    //found something on the way, remove this
	    bot.pop(bot.x(),bot.y());
	}
	return TAKE;
    }

    if(has_item(board[get_opponent_x()][get_opponent_y()])){
	bot.pop(get_opponent_x(),get_opponent_y(),true);
    }

    bot.log('diffs for x,y are ',x_diff , y_diff);
    var check_y = function(){
	if(_target.y > bot.y()){
	    bot.log(message+': move down');
	    return SOUTH;
	}else{
	    if(_target.y != bot.y()){
		bot.log(message+': move up');
		return NORTH;
	    }else{
		bot.log(message+': y is same, check x?');
		return check_x();
	    }
	}
    };
    var check_x = function(){
	if(_target.x > bot.x()){
	    bot.log(message+': move right');
	    return EAST;
	}else{
	    if(_target.x == bot.x()){
		bot.log(message+': both x are same, so do y');
		if(_target.y == bot.y()){
		    bot.log(message+': too late, skip ',bot.todo[0].key);
		    bot.pop();make_move();
		}else{
		    return check_y();
		}
	    }else{
		bot.log(message+': move left');
		return WEST;
	    }
	}
    };
    if(x_diff > y_diff){
	return check_x();
    }else{
	return check_y();
    }

   var rand = Math.random() * 4;

   if (rand < 1) return NORTH;
   if (rand < 2) return SOUTH;
   if (rand < 3) return EAST;
   if (rand < 4) return WEST;

   return PASS;
}
