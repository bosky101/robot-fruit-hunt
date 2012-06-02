/**
 * Bhasker Kode aka Bosky
 */
var bot;
var BOT = function(_board){
    var _this = this;
    _this.board = _board;
};

BOT.refresh = function(){
    
    bot = new BOT(get_board());
    bot.log('REFRESH');
  
    //TODO: interchange width/height based on direction above
    var i=1,j=1,cont=1;
    bot.grid = [];bot.sorted=[];
    while(cont){
	bot.log('find points for radar: ',i,j,' =>');
	var pts = bot.getPointsForRadar(i,j);
	var _items=WIDTH*HEIGHT,item_pts=[];
	var first_done=0;
	for(var _pt in pts){
	    var pt = pts[_pt];
	    if(bot.board[pt.x]){
		var _found = has_item(bot.board[pt.x][pt.y]);
		if(_found){
		    bot.log('bot.board['+pt.x+']['+pt.y+'] has item! => ',has_item(bot.board[pt.x][pt.y]));
		    //_items+=1;
		    var _type = bot.board[pt.x][pt.y];
		    var _delta = get_total_item_count(_type)  ;
		    bot.log('there are only '+ _delta+' of type '+_type,' when centre at ',i,',',j ,' pts ',pts);
		    //_items+= _delta;
		    
		    _items = (_delta < _items) ? (first_done<4)?_delta:_items:_items;
		    first_done++;
		    if(_delta==1){
			bot.log('\tthis should be first,_items is ', _items); 
		    }
		    item_pts.push({x:pt.x,y:pt.y});
		}
	    }
	}
	//item_pts = item_pts.reverse();
	if(_items){
	    //bot.log('range bot.board['+i+']['+j+'] has '+_items+' items!');
	}
	
	bot.grid.push( {key:i+','+j, x:i, y:j, val:_items, pts:pts, items:item_pts}); 
	
	if(i>WIDTH-1){
	    i=1;j+=3;
	}else{
	    i+=3;
	}
	if(j>HEIGHT){
	    bot.log('stop');
	    cont=false;
	}
    }
    bot.grid=bot.grid.sort( function(a,b){
	return (a.val) - (b.val);
    });
    
    for(var obj in bot.grid){
	var toadd = [];
	var pt = bot.grid[obj];
	bot.log('bot.board['+pt.key+'] has ',pt.val,' items!',pt.items);
	if(pt.items.length > 0){
	    for(var _pt in pt.items){
		var temppt = pt.items[_pt];
		temppt.val = pt.val;
		temppt.key = temppt.x+','+temppt.y;
		if(!bot.hash[temppt.key]){
		    toadd.push(temppt);
		    bot.hash[temppt.key]=1;
		}	
	    }
	    bot.todo = bot.todo.concat(toadd);
	}
    }
    
    bot.print();
    
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
		var _row = {x:next_x,y:next_y};
		if(next_x>=WIDTH){ 
		    next_x=WIDTH-1;
		}
		if(next_y>=HEIGHT){
		    next_y=HEIGHT-1;
		}
		var _type = this.board[next_x][next_y];
		if(_type){
		    var _delta = get_total_item_count(_type);
		    _row.val=_delta;
		}else{
		    _row.val=WIDTH*HEIGHT;
		}
		temp.push(_row);
	    }
	}
	temp = temp.sort(function(a,b){ return a.val - b.val;});
	return temp;
    },
    log: function(){
	if(this.DEBUG){
	    console.log.apply(console,arguments);
	}
    },
    pop: function(x,y,_lost){
	
	var _this = this;
	var _first = _this.todo[0]; 
	var nextunsorted=[];
	var cont=true,resort=false,_change=_first.val;
	for(var i=1;i<_this.todo.length && cont;i++){
	    if(_change!=_this.todo[i].val){
		cont=false;resort=_this.todo[i].val;
		console.log('\tchange since ',_first.val,' != ',_this.todo[i].val);
		continue;
	    }
	}
	
	if(!x){
	    var _removed = _this.todo.shift();
	    //bot.log('\t'+_first,' == ',_removed , ' so removed to give next as ', _this.todo[0]);
	}else{
	    if(_lost){
		//bot.log('\topponent took over ',x,y);
	    }
	    var temp=[],_found=[],_todo=_this.todo;
	    for(var _pt in _todo){
		var pt = _todo[_pt];
		if(pt.x == x && pt.y == y){
		    _found.push(_pt);
		    bot.log('\topponent took over ',x,y);
		}else{
		    temp.push(pt);
		}
		if(resort==pt.val){
		    nextunsorted.push(pt);
		}
	    }
	    
	    if(temp.length){
		bot.log('\tstumbled on ',x,y,' so todo reduces from ',_this.todo.length,' to ',temp.length,' at indexes ',_found,' in ',_this.todo);
		_this.todo = temp;
	    }
	}

	if(resort){
	    _this.print('before nextunsorted is ',nextunsorted);
	    var nextresorted = nextunsorted.sort( function(a,b){
		if(a.val == resort){
		    //console.log('resort: ',resort, b.x+b.y,a.x+a.y,'=>',a,b);
		    return (a.x-b.x) + (a.y-b.y);
		}else{
		    return false;
		}
	    });
	    
	    _this.print('after nextunsorted is ',nextresorted);
	   
	    for(var i=0,j=0;i<_this.todo.length;i++){
		if(_this.todo[i].val == resort){
		    console.log('\t\t',_this.todo[i],' j = ',j,' in ',nextresorted);
		    console.log('\tsubstitute ',_this.todo[i].x,_this.todo[i].y,' with [',j,'] ',nextresorted[j].x,nextresorted[j].y);
		    j++;
		    //_this.todo[i] = nextresorted.shift();
		}
	    }
	    console.log('bot is at ',_this.x(),_this.y(),' resort is ',resort);
	    
	    _this.print('todo is ');
	}
    },
    print: function(msg,_array,FORCELOG){
	var _msg = (msg)?msg+': ':'';
	_array = (_array)? _array:this.todo; 
	for(var _pt in _array){
	    var pt = _array[_pt];
	    var _log;
	    if(FORCELOG){
		_log = console.log;
	    }else{
		_log = bot.log
	    }
	    _log(_msg+'move to ',pt.x,pt.y,' => ',pt.val+' =>'+ has_item(bot.board[pt.x][pt.y]));
	    
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
	//bot.log('\tFOUND next item at ', bot.x(),bot.y(),' remove ',_target.x,_target.y);
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

    var check_y = function(){
	if(_target.y > bot.y()){
	    bot.log(message+': move down');
	    return SOUTH;
	}else{
	    if(_target.y != bot.y()){
		bot.log(message+': move up');
		return NORTH;
	    }else{
		bot.log('\t'+message+': y is same, check x?');
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
		    bot.pop();return make_move();
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

}

// Optionally include this function if you'd like to always reset to a 
// certain board number/layout. This is useful for repeatedly testing your
// bot(s) against known positions.
//
//function default_board_number() {
//    return 123;
//}
