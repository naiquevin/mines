/*
 * minesweeper/mines in javascript (using jquery)
 * author : vineet naik | naikvin@gmail.com | http://vineetnaik.me/blog
 * date : 20.06.2010 *
 */

var IE = /*@cc_on!@*/false;

var mines = function () {

    //disable the right click through out the grid
    $("#grid").bind("contextmenu", function (e) {
        e.preventDefault();
    });

    this.config = {
	'env' : 'live'	//debug for testing
    }

    this.R = 10;
    this.C = 10;

    this.totalCells = this.R*this.C;

    this.totalMines;
    this.mines = new Array; //cells that are mines

    this.digits = new Array; //cell ids of safe cells

    this.safe = new Array; //array of safe cell objects

    /*
     * to hold cells that are already evaluated. or
     * those cells for which numbers are visible
     */
    this.safelyWalked = new Array;

    this.flagged = new Array; //to hold cells that are marked as mines by the user

    this.clickCaptured = new Array; //to check which click has been captured

    this.alreadyClicked = new Array;

    //set the mines in random places
    this.setMines();

    //build the grid
    this.build();

    this.setDigits();

    this.bindMouseDn();

    this.bindMouseUp();

    //start the timer
    this.timer = new timer(this.updateTimer);

    this.timer.callee = this;

    this.paused = false;

    this.initBindings();
}


mines.prototype.initBindings = function () {

    var thisObj = this;

    $("#pause-btn").click(function () {
	thisObj.pause();
    });

    $("#resume-btn").click(function () {
	thisObj.resume();
    });
}

mines.prototype.build = function () {

    var grid = '';

    for (var i = 1; i <= this.totalCells ; i++) {

	var className = i%this.R == 1 ? 'clear bleft' : '';
	className += (Math.floor(i/this.R) == 0 || i == this.R) ? ' btop' : '';

	var txt = '';

	if (!this.isMine(i)) {
	    this.digits.push(i);
	}

	else if (this.config.env == 'debug') {
	    txt = '*';
	}

	grid += '<li id="cell_'+i+'" class="'+className+'">'+txt+'</li>';

    }

    $("#grid").append(grid);
}

mines.prototype.setMines = function () {

    this.totalMines = Math.ceil(this.R*this.C * 0.2);

    for (var i = 1; i <= this.totalMines; i++) {

	var rand = Math.floor(Math.random()*(this.totalCells+1));

	if (this.isMine(rand) || rand == 0) {
	    i--;
	    continue;
	}

	this.mines.push(rand);
    }

    $("#mine-counter").text('0/'+this.totalMines);

    //console.log(this.mines);
}

mines.prototype.setDigits = function () {

    for (i in this.digits) {
	var arr = this.getSurrounding(this.digits[i]);
	this.safe[this.digits[i]] = arr;
    }
}

mines.prototype.getSurrounding = function (cell) {

    //find the row and col
    var row = Math.ceil(cell/this.C);
    var col = cell%this.C != 0 ? cell%this.C : this.C;

    //if (i == 20)
    //	console.log(row+'~'+col);

    //one row above
    var r = row - 1;
    var c = col - 1;

    var num_M = 0; //number of mines surrounding this element

    var surr = new Array;
    var minesAround = new Array;
    var safesAround = new Array;

    for (x = r; x < r+3; x++) {
	//lies outside
	if (x <= 0 || x > this.R) {
	    continue;
        }

	for (y = c; y < c+3; y++) {

	    if (y <= 0 || y > this.C) {
                //lies outside
		continue;
            }

	    var nC = (x - 1)*this.C + y;

	    //check if this is a mine
	    if (this.isMine(nC)) {
		num_M++;
		minesAround.push(nC);
	    }

	    else {
		if (nC != cell) {
		    safesAround.push(nC);
                }
	    }

	    //add to the surrounding array if its not the current interation cell!
	    if (nC != cell) {
		surr.push(nC);
	    }
	}
    }

    var arr = {
	'cell' : cell,
	'surrMines' :  num_M,
	'surrounding' : surr,
	'minesAround' : minesAround,
	'safesAround' : safesAround
    }

    return arr;
}


/*
 * function to check if the cell is a mine
 */
mines.prototype.isMine = function (cell) {
    var r = $.inArray(cell,this.mines);
    if (r != -1 && r != 'undefined') {
	return true;
    }
}

/*
 * function to check if the cell is flagged by the user as a mine
 */
mines.prototype.isFlagged = function (cell) {
    var r = $.inArray(cell,this.flagged);
    if (r != -1 && r != 'undefined') {
	return true;
    }
}

/*
 * function to check if the cell is already evaluated as safe
 */
mines.prototype.isSafelyWalked = function (cell) {
    var r = $.inArray(cell,this.safelyWalked);
    if (r != -1 && r != 'undefined') {
	return true;
    }
}

//function to check if the cell is already flagged or safe
mines.prototype.isActionTaken = function (cell) {
    var r = $.inArray(cell,this.alreadyClicked);
    if (r != -1 && r != 'undefined') {
	return true;
    }
}

/*
 * will recursively find and open safe cells if the clicked cell has 0 surrounding
 * mines
 */
mines.prototype.computeRecursive = function (cell) {

    //check if this cell has been already evaulated
    if (this.isSafelyWalked(cell)) {
	return false;
    }

    var surrMines = this.safe[cell]['surrMines'];

    /*
     * if this cell is a mine then return false without any action
     * first iteration will always fail this condition.
     * only for recursion
     */
    if (this.isMine(cell)) {
	return false;
    }

    //if non mine flagged as a mine - end game
    if (this.isFlagged(cell)) {
	this.gameOver();
	$("#cell_"+cell).addClass('flag').addClass('no-mine');
	return false;
    }

    //if there is a mine in the surrounding, show the number and return
    if (surrMines != 0) {
	$("#cell_"+cell).text(surrMines);
	this.safelyWalked.push(cell);
	return false;
    }

    $("#cell_"+cell).text(surrMines);

    //keep a flag that this cell was safely walked through
    this.safelyWalked.push(cell);

    //if there is no mine then find the surrounding cells and recurse
    var safesAround = this.safe[cell]['safesAround'];

    for (i in safesAround) {
	this.computeRecursive(safesAround[i]);
    }
}


mines.prototype.bindMouseDn = function () {
    var thisObj = this;
    $("li","#grid").bind('mousedown',function (e) {
	thisObj.clickCaptured.push(e.button);
    });
}

mines.prototype.bindMouseUp = function () {

    var thisObj = this;

    $("li","#grid").bind('mouseup',function (e) {
	//alert(thisObj.clickCaptured[0]); uncomment for IE debugging
	//if game is paused, resume it
	if (thisObj.paused) {
	    thisObj.resume();
        }

	/*
	 * if nothing in click then return. this case means that,
	 * both were clicked and in mouseup of the first click, the array was
	 * emptied.
	 */
	if (thisObj.clickCaptured.length == 0) {
	    return false;
	}

	//check the contents of the clickcaptured array
	var id = $(this).attr('id');
	var idArr = id.split('_');

	var cell = parseInt(idArr[1]);

	//both are clicked
	if (thisObj.clickCaptured.length == 2 || (thisObj.clickCaptured[0] == 1 && !IE)) {
	    thisObj.bothClick(cell);
	    return;
	}

	//otherwise if length is 1, only 1 is clicked..2 cases
	if (thisObj.clickCaptured[0] == 0 || (thisObj.clickCaptured[0] == 1 && IE)) {  //left button clicked+ie hack
	    thisObj.leftClick(cell);
	}

	else if (thisObj.clickCaptured[0] == 2) {
	    thisObj.rightClick(cell);
	    $("#mine-counter").text(thisObj.flagged.length+'/'+thisObj.totalMines);
	}

	//check if game won
	if (cmpArrays(thisObj.mines,thisObj.flagged)) {
	    thisObj.gameWon();
        }
    });
}

mines.prototype.leftClick = function (cell) {

    //empty the click captured array
    this.clickCaptured = [];

    //if this cell is already evaluated return false
    if (this.isActionTaken(cell))
	return false;

    //check if its a mine ~ GAME OVER!!
    if (this.isMine(cell)) {
	this.gameOver();
	return false;
    }

    this.computeRecursive(cell);

    this.alreadyClicked.push(cell);
}

mines.prototype.rightClick = function (cell) {
    //empty the click captured array
    this.clickCaptured = [];

    //if already flagged, unflag it
    if (this.isFlagged(cell)) {
	$("#cell_"+cell).removeClass('flag');
	removeFromArray(cell,this.alreadyClicked);
	removeFromArray(cell,this.flagged);
	return false;
    }

    //user tried to click on a previously open cell
    if (this.isSafelyWalked(cell)) {
	return false;
    }

    //alert('right click');
    $("#cell_"+cell).addClass('flag');

    this.flagged.push(cell);
    this.alreadyClicked.push(cell);
}

mines.prototype.bothClick = function (cell) {
    //empty the click captured array
    this.clickCaptured = [];

    //if this is a mine.. return false
    if (this.isMine(cell)) {
	return false;
    }

    /*	var minesAround = this.safe[cell]['minesAround'];

	for (i in minesAround) {
	console.log(minesAround[i]);
	//if even one of surrounding mines are not flagged bothclick must do nothing
	if (!this.isFlagged(minesAround[i]))
	return false;
	}
    */

    //check if num cells flagged in surr = num mines
    var surr = this.safe[cell]['surrounding'];
    var n = 0;
    for (i in surr) {
	if (this.isFlagged(surr[i])) {
	    n++;
        }
    }

    //if n is more than the num mines ,.. game over!
    if (n > this.safe[cell]['surrMines']) {
	this.gameOver();
	return false;
    }

    if (n != this.safe[cell]['surrMines']) {
	return false;
    }

    //if there is no mine then find the surrounding cells and recurse
    var safesAround = this.safe[cell]['safesAround'];

    for (i in safesAround) {
	this.computeRecursive(safesAround[i]);
    }

    this.alreadyClicked.push(cell);
}

mines.prototype.updateTimer = function (time) {
    var min = Math.floor(time/60);
    var sec = time%60;
    if (sec < 10) {
	sec = '0'+sec;
    }
    if (min < 10) {
	min = '0'+min;
    }
    $("#timer").text(min+':'+sec);
}

mines.prototype.pause = function () {
    this.timer.pause();
    $("#pause-btn").hide();
    $("#resume-btn").show();
    this.paused = true;
}

mines.prototype.resume = function () {
    this.timer.resume();
    $("#resume-btn").hide();
    $("#pause-btn").show();
    this.paused = false;
}

mines.prototype.gameWon = function () {
    this.timer.stop();
    $("#new-btn").after('<p id="game-won">YOU WON!!</p>');
    if (this.config.env != 'debug') {
	this.destroy();
    }
}

mines.prototype.gameOver = function () {
    //show all mines
    for (i in this.mines)
	$("#cell_"+this.mines[i]).addClass('mine');

    //show all non mines that were flagged
    for (i in this.digits) {
	if (this.isFlagged(this.digits[i])) {
	    $("#cell_"+this.digits[i]).addClass('flag').addClass('no-mine');
        }
    }

    this.timer.stop();

    $("#new-btn").after('<p id="game-over">GAME OVER!</p>');

    if (this.config.env != 'debug') {
	this.destroy();
    }
}

mines.prototype.destroy = function () {
    $("#grid>li").unbind('mouseup mousedown').bind('mouseup mousedown', function () { return false; });
    this.timer.stop();

    //unbind the events on the pause and resume buttons
    $("#pause-btn").unbind('click');
    $("resume-btn").unbind('click');
}
