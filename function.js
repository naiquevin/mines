function removeFromArray(needle,arr) {
    for (i in arr) {
	if (arr[i] == needle) {
	    arr.splice(i, 1);
	}
    }
}

function cmpArrays(arr1,arr2) {
    if (arr1.length !== arr2.length) {
	return false;
    }
    for (i in arr2) {
	if ($.inArray(arr2[i],arr1) < 0) {
	    return false;
        }
    }
    return true;
}


/* TIMER CLASS */

var timer = function (fn) {
    this.c = 0;
    this.t;
    this.fn = fn;
    this.callee;
    this.state = false; //on
    this.start();
}

timer.prototype.keepTime = function () {
    if (!this.state) {
	return false;
    }
    if (typeof this.fn == 'function') {
	this.fn.call(this.callee,this.c);
	//1st arg will be accesible as the callee object in the function and 2nd arg as c of this obj!
    }
    this.c=this.c+1;
    thisObj = this;
    this.t=setTimeout("thisObj.keepTime()",1000);
}

timer.prototype.start = function () {
    if (!this.state) {
	this.state=true;
	this.keepTime();
    }
}

timer.prototype.pause = function () {
    this.state = false;
}

timer.prototype.resume = function () {
    this.start();
}

timer.prototype.stop = function () {
    this.state = false;
    this.c = 0;
    clearTimeout(this.t);
}
