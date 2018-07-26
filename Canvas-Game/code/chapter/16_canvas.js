function rotate(context, x, y, angle) {
    context.translate(x, y);
    context.rotate(angle*Math.PI/180);
	//context.setTransform(1,0,0,1,0,0);
    context.translate(-x, -y);
}

function flipHorizontally(context, around) {
  context.translate(around, 0);
  context.scale(-1, 1);
  context.translate(-around, 0);
}

function CanvasDisplay(parent, level) {
	this.canvas = document.createElement("canvas");

    this.canvas.width = Math.min(600, level.width * scale);//this.canvas.width = Math.min(window.innerWidth - 50, level.width * scale );
    this.canvas.height = Math.min(450, level.height * scale);//this.canvas.height = Math.max (window.innerHeight , level.height * scale);
    parent.appendChild(this.canvas);
    this.cx = this.canvas.getContext("2d");

    this.level = level;
    this.animationTime = 0;
    this.flipPlayer = false;
    this.viewport = {
        left: 0,
        top: 0,
        width: this.canvas.width / scale,
        height: this.canvas.height / scale
    };

    this.drawFrame(0);
	this.center = null;
}

CanvasDisplay.prototype.clear = function() {
    this.canvas.parentNode.removeChild(this.canvas);
};

CanvasDisplay.prototype.drawFrame = function(step) {
    this.animationTime += step;

    this.updateViewport();
    this.clearDisplay();
    this.drawBackground();
	if (stage > 0 && stage < 5) {
    this.drawActors();
	this.drawLives();
    this.showStage();
	if (mode === true) {
		this.timer();
	}
	if (menu) {
		this.menu();
	}
	
	}
};

CanvasDisplay.prototype.updateViewport = function() {
    let view = this.viewport,
        margin = view.width / 3;
    let player = this.level.player;
    let center = player.pos.plus(player.size.times(0.5));

    if (center.x < view.left + margin)
        view.left = Math.max(center.x - margin, 0);
    else if (center.x > view.left + view.width - margin)
        view.left = Math.min(center.x + margin - view.width,
            this.level.width - view.width);
    if (center.y < view.top + margin)
        view.top = Math.max(center.y - margin, 0);
    else if (center.y > view.top + view.height - margin)
        view.top = Math.min(center.y + margin - view.height,
            this.level.height - view.height);
	
};

CanvasDisplay.prototype.clearDisplay = function() {
    if (this.level.status == "won")
        this.cx.fillStyle = "rgb(68, 191, 255)";
    else if (this.level.status == "lost")
        this.cx.fillStyle = "rgb(44, 136, 214)";
    else if (stage > 0 && stage < 5) {
        //this.cx.drawImage(life2,0,0,this.canvas.width,this.canvas.height);
        //background color
        this.cx.fillStyle = "rgb(179, 179, 179)";
        this.cx.fillRect(0, 0,
            this.canvas.width, this.canvas.height);
    } else if (stage === 6) {
		this.losingScreen();
	} else if (stage === 5) {
		this.winningScreen();
	} else{
        this.welcome();

    }
	
	
};

let otherSprites1 = document.createElement("img");
otherSprites1.src = "img/sprites5.png";



CanvasDisplay.prototype.drawBackground = function() {
    let view = this.viewport;
    let xStart = Math.floor(view.left);
    let xEnd = Math.ceil(view.left + view.width);
    let yStart = Math.floor(view.top);
    let yEnd = Math.ceil(view.top + view.height);

    for (let y = yStart; y < yEnd; y++) {
        for (let x = xStart; x < xEnd; x++) {
            let tile = this.level.grid[y][x];
		if (tile == null) continue;
            let tileY;
			if (tile == "pothole") {
				tileY = otherSprites1.height;
			} else if (tile == "lava") {
				if (this.animationTime - parseInt(this.animationTime) > 0.5) {
					tileY = 0;
				} else {
					tileY = otherSprites1.height/2;
				}			
			} else {
				tileY = 0;
			}
		
			//tileY= tile == "pothole" ? otherSprites1.height:0;//= tile == "lava" ? (this.animationTime - parseInt(this.animationTime) > 0.5 ? 0 : otherSprites1.height/2) : 0;
            let screenX = (x - view.left) * scale;
            let screenY = (y - view.top) * scale;
            let tileX = tile == "lava" ? scale : 0;
            this.cx.drawImage(otherSprites1,
                tileX, tileY, scale, scale,
                screenX, screenY, scale, scale);
        }
    }
};

let playerSprites = document.createElement("img");
playerSprites.src = "img/car2.png";


CanvasDisplay.prototype.drawPlayer = function(x, y, width,
    height) {
			
        let player = this.level.player;
        
		if (player.angle !== 0)
            this.move = player.angle > 0;

        this.cx.save();
        if (this.move)
            rotate(this.cx, x, y + playerSprites.height/4, player.angle);

		if (this.level.status == "lost") {
        this.cx.drawImage(playerSprites,
          0, 0, playerSprites.width, playerSprites.height/2,
            x-width, y+height, playerSprites.width, playerSprites.height/2);	
		} else {
        this.cx.drawImage(playerSprites,
          0, playerSprites.height/2, playerSprites.width, playerSprites.height/2,
            x-width, y+height/4, playerSprites.width/4*3, playerSprites.height/2);
		}
		//Temporary, need to see where everything is.
		/* this.cx.fillStyle = "white";
		this.cx.rect(x,y,10,10);
		this.cx.fill();
         */
		 this.cx.restore();
};


let life = document.createElement("img");
life.src = "img/life2.png";

let person = document.createElement("img");
person.src = "img/person.png";

CanvasDisplay.prototype.drawActors = function() {
	let sprites, tileX, tileY, nWidth, nHeight,nH,nW,nnH, flipActor, ny,nx;
	flipActor = false;
    this.level.actors.forEach(function(actor) {
        let width = actor.size.x * scale;
        let height = actor.size.y * scale;
        let x = (actor.pos.x - this.viewport.left) * scale;
        let y = (actor.pos.y - this.viewport.top) * scale;
        if (actor.type == "player") {
			//dont show the actor on stage 0
			
            this.drawPlayer(x, y, width, height);
			
        } else {
			if (actor.type !== "person") {
			sprites = otherSprites1;
            tileX = (actor.type == "coin"||actor.type == "boost" ? 2 : (actor.type == "pothole" ? 0:1)) * scale;
			tileY = actor.type == "boost" ||actor.type == "pothole" ? otherSprites1.height/2 : actor.type == "coin" ? 0: 0;
		
			nWidth = (actor.type == "coin" || actor.type == "boost"  ? width * 2 : width);
			nHeight = (actor.type == "boost"  ? height * 3 : actor.type == "coin" ? height*1.5:height);
			nH = height;
			if (actor.type == "coin") {
				nnH = height;
			} else if (actor.type == "boost") {
				nnH = height*2;
			} else {
				nnH = nH
			};
			nW = width;
			 this.cx.drawImage(sprites,
                tileX, tileY, nW, nnH/* nnH = actor.type == "coin" ? height / 2:actor.type == "boost" ? height*2:nH */,
                x-width/2, ny = actor.type == "boost" ? y - height-5 : y-height/2, nWidth, nHeight);
			//let tileY = (actor.type == "lava" ? (this.animationTime - parseInt(this.animationTime) > 0.5 ? 0 : otherSprites1.height/2) : 0);
			} else if (actor.type == "person") {
			sprites = person;
			tileY = 0;
			nWidth = person.width/8;
			nHeight = person.height;
			nW = 24;
			nH = 30;
			tileX = (Math.floor(this.animationTime * 12) % 8) * nW;
			overLap = 4;
			width += overLap * 2;
			x -= overLap;			
			if (actor.speed.x !== 0) {
				flipActor = actor.speed.x < 0;
			}
			let nX = x + width/2;
			this.cx.save();
			
			if (flipActor) {
			this.cx.translate(nX, 0);
			this.cx.scale(-1, 1);
			this.cx.translate(-nX, 0);
			}
			this.cx.drawImage(sprites,
                tileX, tileY, nW, nnH = actor.type == "coin" ? height * 2:actor.type == "boost" ? height*2:nH,
                x, y, nWidth, nHeight);
			
			this.cx.restore();
			
		}
		/* this.cx.fillStyle = "white";
		this.cx.rect(x,y,10,10);
		this.cx.fill(); */
        }
    }, this);

};

let welcome = document.createElement("img");
welcome.src = "img/carpark.jpg";
let rcr = document.createElement("img");
rcr.src = "img/RCR.png";
let rcr2 = document.createElement("img");
rcr2.src = "img/RCR2.png";

CanvasDisplay.prototype.welcome = function() {

    this.cx.drawImage(welcome, 0, 0, this.canvas.width, this.canvas.height);
    
	if (this.isEven(parseInt(this.animationTime))) {
		this.cx.drawImage(rcr, 0, 0, this.canvas.width, this.canvas.height);
	} else {
		this.cx.drawImage(rcr2, 0, 0, this.canvas.width, this.canvas.height);
	}
	if (mode === false) {
		this.cx.fillStyle = "red";
		 this.cx.font = "35px Verdana";
		  this.cx.fillText("Play", 300, 300);
	} else {
		this.cx.fillStyle = "red";
		 this.cx.font = "35px Verdana";
		  this.cx.fillText("Time Trial", 300, 340);
	}
	
    this.cx.fillStyle = "white";
    this.cx.font = "25px Verdana";
    this.cx.fillText("Press the space key to start game!", 100, 100);

};

let died = document.createElement("img");
died.src = "img/died.jpg";

CanvasDisplay.prototype.losingScreen = function () {
	this.cx.drawImage(died, 0, 0, this.canvas.width, this.canvas.height);
	this.cx.fillStyle = "white";
    this.cx.font = "20px Verdana";
    this.cx.fillText("Press the space to restart!", this.canvas.width/8, (this.canvas.height/2)*1.5);
	this.cx.font = "8px Verdana";
	this.cx.fillText("loser...", this.canvas.width/8, (this.canvas.height/5)*4);
	
};

let winning = document.createElement("img");
winning.src = "img/winning.png";

CanvasDisplay.prototype.winningScreen = function () {
		this.cx.drawImage(winning, 0, 0, this.canvas.width, this.canvas.height);
	this.cx.fillStyle = "black";
    this.cx.font = "20px Verdana";
    this.cx.fillText("Press the space to restart! WINNER", this.canvas.width/8, (this.canvas.height/2)*1.5);
	this.cx.font = "8px Verdana";
	this.cx.fillText("winner...", this.canvas.width/8, (this.canvas.height/5)*4);
};

CanvasDisplay.prototype.isEven = function (n) {
	return n % 2 === 0;
};

CanvasDisplay.prototype.isOdd = function (n) {
	return Math.abs(n%2)===1;
};

CanvasDisplay.prototype.timer = function () {
	
       this.cx.fillStyle = "black";
        this.cx.font = "20px Verdana";
        this.cx.fillText(`Time ${parseInt(animateTime)}`, 150, 50);
    
};

CanvasDisplay.prototype.drawLives = function() {
  
        if (lives === 1) {
            this.cx.drawImage(life, 0, 0, life.width / 2, life.height, this.canvas.width / 30 * 1, this.canvas.height / 30, life.width, life.height * 1.5);
        } else if (lives === 2) {
            this.cx.drawImage(life, 0, 0, life.width / 2, life.height, this.canvas.width / 30 * 1, this.canvas.height / 30, life.width, life.height * 1.5);
            this.cx.drawImage(life, 0, 0, life.width / 2, life.height, this.canvas.width / 30 * 2, this.canvas.height / 30, life.width, life.height * 1.5);
        } else if (lives === 3) {
            this.cx.drawImage(life, 0, 0, life.width / 2, life.height, this.canvas.width / 30 * 1, this.canvas.height / 30, life.width, life.height * 1.5);
            this.cx.drawImage(life, 0, 0, life.width / 2, life.height, this.canvas.width / 30 * 2, this.canvas.height / 30, life.width, life.height * 1.5);
            this.cx.drawImage(life, 0, 0, life.width / 2, life.height, this.canvas.width / 30 * 3, this.canvas.height / 30, life.width, life.height * 1.5);
        }
        if (lives === 2) {
            this.cx.drawImage(life, life.width / 2, 0, life.width / 2, life.height, this.canvas.width / 30 * 3, this.canvas.height / 30, life.width, life.height * 1.2);
        } else if (lives === 1) {
            this.cx.drawImage(life, life.width / 2, 0, life.width / 2, life.height, this.canvas.width / 30 * 3, this.canvas.height / 30, life.width, life.height * 1.2);
            this.cx.drawImage(life, life.width / 2, 0, life.width / 2, life.height, this.canvas.width / 30 * 2, this.canvas.height / 30, life.width, life.height * 1.2);
        } else if (lives === 0) {
            this.cx.drawImage(life, life.width / 2, 0, life.width / 2, life.height, this.canvas.width / 30 * 3, this.canvas.height / 30, life.width, life.height * 1.2);
            this.cx.drawImage(life, life.width / 2, 0, life.width / 2, life.height, this.canvas.width / 30 * 2, this.canvas.height / 30, life.width, life.height * 1.2);
            this.cx.drawImage(life, life.width / 2, 0, life.width / 2, life.height, this.canvas.width / 30 * 1, this.canvas.height / 30, life.width, life.height * 1.2);
        }
   
};

CanvasDisplay.prototype.showStage = function() {
   
        this.cx.fillStyle = "black";
        this.cx.font = "20px Verdana";
        this.cx.fillText(`Level ${stage}`, 50, 50);
    
};

CanvasDisplay.prototype.menu = function() {
	this.cx.fillStyle = "black";
	this.cx.rect(this.canvas.width/2, this.canvas.height/2,100,100);
	this.cx.fill();
	if (option) {
		this.cx.fillStyle = "white";
		this.cx.fillText("options", this.canvas.width/2, this.canvas.height/2);
	} else if (option === false) {
		this.cx.fillStyle = "white";
		this.cx.fillText("no options", this.canvas.width/2, this.canvas.height/2);
	}
};
