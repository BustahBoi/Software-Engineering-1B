function Level(plan) {
    this.width = plan[0].length;
    this.height = plan.length;
    this.grid = [];
    this.actors = [];

    for (let y = 0; y < this.height; y++) {
        let line = plan[y],
            gridLine = [];
        for (let x = 0; x < this.width; x++) {
            let ch = line[x],
                fieldType = null;
            let Actor = actorChars[ch];
            if (Actor)
                this.actors.push(new Actor(new Vector(x, y), ch));
            else if (ch == "x")
                fieldType = "wall";
            else if (ch == "!")
                fieldType = "lava";
			else if (ch == "p")
				fieldType = "pothole";
            gridLine.push(fieldType);
        }
        this.grid.push(gridLine);
    }

    this.player = this.actors.filter(function(actor) {
        return actor.type == "player";
    })[0];
    this.status = this.finishDelay = null;

}

let mode = false;

Level.prototype.isFinished = function() {
    return this.status != null && this.finishDelay < 0;
};

function Vector(x, y) {
    this.x = x;
    this.y = y;
}
Vector.prototype.plus = function(other) {
    return new Vector(this.x + other.x, this.y + other.y);
};
Vector.prototype.times = function(factor) {
    return new Vector(this.x * factor, this.y * factor);
};

let actorChars = {
    "@": Player,
    "o": Coin,
    "=": Lava,
    "|": Lava,
    "v": Lava,
    "b": Boost,
	"p": Pothole,
	"h": Person,
	"H": Person
};

function Player(pos) {
    this.pos = pos.plus(new Vector(0, 0));
    this.size = new Vector(1, 1);
    this.speed = new Vector(0, 0);
    /*all the added ish that changes*/
    this.angle = 0;
    this.facingX = 0;
    this.facingY = 0;
    this.movingX = 0;
    this.movingY = 0;
    this.forwardSpeed = 0.2;

    this.x = 0;
    this.y = 0;
    this.boostTime = 0;

}

Player.prototype.type = "player";

function Lava(pos, ch) {
    this.pos = pos;
    this.size = new Vector(1, 1);
    if (ch == "=" && menu === false) {
        this.speed = new Vector(2, 0);
    } else if (ch == "|") {
        this.speed = new Vector(0, 2);
    } else if (ch == "v") {
        this.speed = new Vector(0, 3);
        this.repeatPos = pos;
    }
}
Lava.prototype.type = "lava";

function Person (pos, ch) {
	this.pos = pos;
	this.size = new Vector(1,2);
	if (ch == 'h') {
		this.speed = new Vector(2,0);
	} else if (ch == "H") {
		this.speed = new Vector(2,-2);
	} 
}

Person.prototype.type = "person";

function Coin(pos) {
    this.basePos = this.pos = pos.plus(new Vector(0.2, 0.1));
    this.size = new Vector(0.6, 1.2);
}
Coin.prototype.type = "coin";

function Pothole(pos) {
    this.basePos = this.pos = pos.plus(new Vector(0.2, 0.1));
    this.size = new Vector(1, 1);
}

Pothole.prototype.type = "pothole";


function Boost(pos) {
    this.basePos = this.pos = pos.plus(new Vector(0.2, 0.1));
    this.size = new Vector(0.6, 0.6);
}

Boost.prototype.type = "boost";

function elt(name, className) {
    let elt = document.createElement(name);
    if (className) elt.className = className;
    return elt;
}

let scale = 20;

Level.prototype.obstacleAt = function(pos, size) {
    let xStart = Math.floor(pos.x);
    let xEnd = Math.ceil(pos.x + size.x);
    let yStart = Math.floor(pos.y);
    let yEnd = Math.ceil(pos.y + size.y);

    if (xStart < 0 || xEnd > this.width || yStart < 0|| yEnd > this.height)
        return "wall";
   /*  if (yEnd > this.height)
        return "lava"; */
    for (let y = yStart; y < yEnd; y++) {
        for (let x = xStart; x < xEnd; x++) {
            let fieldType = this.grid[y][x];
            if (fieldType) return fieldType;
        }
    }
};

Level.prototype.actorAt = function(actor) {
    for (let i = 0; i < this.actors.length; i++) {
        let other = this.actors[i];
        if (other != actor &&
            actor.pos.x + actor.size.x > other.pos.x &&
            actor.pos.x < other.pos.x + other.size.x &&
            actor.pos.y + actor.size.y > other.pos.y &&
            actor.pos.y < other.pos.y + other.size.y)
            return other;
    }
};

let maxStep = 0.05;

Level.prototype.animate = function(step, keys) {
    //i know this is nasty but im piggy backing off this function to continue onto the game from welcome screen
    //DON'T FORGET TO UNCOMMENT THIS SO PEOPLE CAN'T CHEAT!!!!this.
    if (stage < 1 || stage > 4) {
        if (keys.space) {
            this.status = "won";
            this.finishDelay = 0.5;
        }
    }

    if (this.status != null)
        this.finishDelay -= step;

    while (step > 0) {
        let thisStep = Math.min(step, maxStep);
        //this.actors.forEach(function(actor) {
        for (let actor of this.actors) {
            actor.act(thisStep, this, keys);
        }
        step -= thisStep;
    }


    if (keys.escape) {
        this.status = "won";
        this.finishDelay = 0.5;
    }
//time for each stage until death on time trial
    if (stage === 1 && mode === true) {
        if (animateTime > 10) {
            this.status = "lost";
        }
    }
};

Lava.prototype.act = function(step, level) {
    let newPos = this.pos.plus(this.speed.times(step));
    if (!level.obstacleAt(newPos, this.size))
        this.pos = newPos;
    else if (this.repeatPos)
        this.pos = this.repeatPos;
    else
        this.speed = this.speed.times(-1);
};

Coin.prototype.act = function(step) {
    this.pos = this.basePos.plus(new Vector(0, 0));
};

Person.prototype.act = function(step, level) {
	let newPos = this.pos.plus(this.speed.times(step));
	if (!level.obstacleAt(newPos, this.size))
		this.pos = newPos;
	else if (this.repeatPos)
		this.pos = repeatPos;
	else
		this.speed = this.speed.times(-1);
};

Pothole.prototype.act = function(step) {
    this.pos = this.basePos.plus(new Vector(0, 0));
};

Boost.prototype.act = function(step) {
    this.pos = this.basePos.plus(new Vector(0, 0));
};

let playerSpeed = 7;

Player.prototype.decrementAngle = function() {
    this.angle -= 3;
    if (this.angle < 0) {
        this.angle = 360;
    }

};

Player.prototype.incrementAngle = function() {
    this.angle += 3;
    if (this.angle > 360) {
        this.angle = 0;
    }

};

Player.prototype.moveX = function(step, level, keys) {
    let x = 0,
        y = 0;

    if (keys.right) {
        this.incrementAngle();
    }

    if (keys.left) {
        this.decrementAngle();
    }

    let motion = new Vector(x, y);
    let newPos = this.pos.plus(motion);
    let obstacle = level.obstacleAt(newPos, this.size);
    if (obstacle)
        level.playerTouched(obstacle);
    else
        this.pos = newPos;
};

Player.prototype.moveY = function(step, level, keys) {
    this.speed.y = 0;
    let angle = this.angle,
        facingX = this.facingX,
        facingY = this.facingY,
        movingX = this.movingX,
        movingY = this.movingY,
        forwardSpeed = this.forwardSpeed,
        x = this.x,
        y = this.y;

    if (keys.up) {
        angleInRadians = angle * Math.PI / 180;
        facingX = Math.cos(angleInRadians);
        facingY = Math.sin(angleInRadians);
        movingX += forwardSpeed * facingX;
        movingY += forwardSpeed * facingY;
    }

    if (keys.down) {
        angleInRadians = angle * Math.PI / 180;
        facingX = Math.cos(angleInRadians);
        facingY = Math.sin(angleInRadians);
        movingX -= forwardSpeed * facingX;
        movingY -= forwardSpeed * facingY;
    }

    x += movingX;
    y += movingY;

    let motion = new Vector(x, y);
    let newPos = this.pos.plus(motion);
    let obstacle = level.obstacleAt(newPos, this.size);
    if (obstacle) //this is so i can walk up and down through objects
        level.playerTouched(obstacle);
    else
        this.pos = newPos;
};

Player.prototype.option = function(keys) {
    if (mode === false) {
        if (keys.up) {
            mode = true;
        } 
    }
    if (mode === true) {
        if (keys.down) {
            mode = false;
        }
    }
	
	if (option) {
		if (keys.space) {
			this.status = "lost"
		}
	}
    /* 	if (keys.up) {
    		if (mode === 0) {
    			mode = 1;
    		} else if (keys.down) {
    		mode = 0;
    		//console.log(mode);
    	}
    	} */
};


Player.prototype.menu = function (keys) {
	if (keys.up) {
		option = !option;
	} else if (keys.down) {
		option = !option;
	}
	console.log(option);
};


let menu, option;
menu = false;
option = false;

Player.prototype.act = function(step, level, keys) {
	let stop;
    if (stage > 0 && stage < 5) {
		if (menu === false) {
        this.moveX(step, level, keys);
        this.moveY(step, level, keys);
		}  else if (menu === true) {
		this.menu(keys);
		} 
	}
	addEventListener("keydown", function(event){
            if (event.keyCode == 105) { 
				menu = !menu;
			}
	});

	

    if (stage === 0) {
        this.option(keys);
    }
    //this.moveXY(step, level, keys);
    // this.moveYX(step, level, keys);

    let otherActor = level.actorAt(this);
    if (otherActor)
        level.playerTouched(otherActor.type, otherActor);

    // Losing animation
    /*if (level.status == "lost") {
        this.pos.y += step;
        this.size.y -= step;
		console.log("lost");
	}
*/


};


Level.prototype.playerTouched = function(type, actor) {

    if (type == "lava" && this.status == null || type == "pothole" && this.status == null) {
        this.status = "lost";
        this.finishDelay = 0.5;
	
    } else if (type == "coin") {
        //somehow changes coin to not an actor, changes to other, removing the coin
        this.actors = this.actors.filter(function(other) {
            return other != actor;
        });
        //if there arent any coins then go to the next level
        if (!this.actors.some(function(actor) {
                return actor.type == "coin";
            })) {
            //variables needed to continue to next stage
            this.status = "won";
            this.finishDelay = 1;
        }
    } else if (type == "boost") {
        this.actors = this.actors.filter(function(other) {
            return other != actor;
        });
        let nTime = animateTime - 0.1;
        nTime += 2.1;
        this.player.boostTime = nTime;

        //this.player.forwardSpeed += 0.2;
    } else if (type == "person") {
		this.status = "lost";
		this.finishDelay = 1;
	
	}
    if (this.player.boostTime > animateTime) {
        this.player.forwardSpeed = 0.4;
        console.log(this.player.forwardSpeed);
    } else {
        this.player.forwardSpeed = 0.2;
        console.log(this.player.forwardSpeed);
    }
};

/* Level.prototype.welcomeStart = function() {
	if (stage === 0) {
		if (keys.space) {
			console.log("space");
			this.status = "won";
            this.finishDelay = 1;
		}
	}
} */

let arrowCodes = {
    100: "left",
    104: "up",
    102: "right",
    98: "down",
    97: "downLeft",
    99: "downRight",
    105: "upRight",
    103: "upLeft",
    27: "escape",
    32: "space"
};

function trackKeys(codes) {
    let pressed = Object.create(null);

    function handler(event) {
        if (codes.hasOwnProperty(event.keyCode)) {
            //console.log(codes);
            //means if a key is pressed down then it evaluates to true, if not then false
            let down = event.type == "keydown";
            /*I made this to test
            let up = event.type == "keyup";
            console.log(up = event.type == "keyup");*/
            //console.log(down = event.type == "keydown");
            pressed[codes[event.keyCode]] = down;
            event.preventDefault();


        }
    }
    //keydown is a reserved js event, event is fires when a key is pressed
    addEventListener("keydown", handler);


    //The keyup event is fired when a key is released.
    addEventListener("keyup", handler);




    return pressed;
}

let animateTime = null;

function runAnimation(frameFunc) {
    let lastTime = null;

    function frame(time) {
        let stop = false;
        if (lastTime != null) {
            let timeStep = Math.min(time - lastTime, 100) / 1000;
            stop = frameFunc(timeStep) === false;

        }
        lastTime = time;
        if (!stop)
            requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

}

let arrows = trackKeys(arrowCodes);

//andThen will wait for other functions to complete
function runLevel(level, Display, andThen) {
    let display = new Display(document.body, level);

    /* let paused = false; */

    /*     addEventListener("keydown", function(event){
            if (event.keyCode == 105) {
                paused = !paused;
            }
        });
    		 */
    runAnimation(function(step) {
        /* if (!paused){ */
		//console.log(level.player.menu);
        level.animate(step, arrows);
		if (menu === false) {
        animateTime += step;
		}
        display.drawFrame(step);
        if (level.isFinished()) {
            display.clear();
            if (andThen)
                andThen(level.status);
            //this shit works 
            /*
            console.log(level.lives);*/

            return false;
        }
        /* } */
    });
}
/*
function welcomeScreen() {
	
}*/
//wanted a global variable so it shows the lives and actually counts
let lives = 3;
let stage = 0;

function runGame(plans, Display) {
    function startLevel(n) {
        runLevel(new Level(plans[n]), Display, function(status) {
            if (status == "lost") {
                //when you lose you lose a life
                lives--;
                //when you hit 0 it starts on the first level
                if (lives < 0) {
                    startLevel(6);
                    stage = 6;
                    //gives 3 lives on reset
                    animateTime = 0;
                    //if life is greater than 0 just continue
                } else if (lives > -1) {
                    startLevel(n);
                    animateTime = 0;
                }
            } else if (n < plans.length - 1) {
                stage++;
                if (stage < 6) {
                    startLevel(n + 1);
                    animateTime = 0;
                } else {
                    startLevel(1);
                    stage = 1;
                    lives = 3;
                    animateTime = 0;
                }
            } else if (status == "menu") {
			startLevel(0);
			lives = 3;
				
			} else {
                startLevel(1);
                stage = 1;
                lives = 3;
                animateTime = 0;
            }
        });
    }
    startLevel(0);
    animateTime = 0;
}