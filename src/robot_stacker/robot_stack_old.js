let game;
let gameOptions = {
    timeLimit: 30,
    gravity: 1,
    crateHeight: 700,
    crateRange: [-300, 300],
    crateSpeed: 1000
}

window.onload = function() {
    let config = {
        type: Phaser.AUTO,
        width: 640,
        height: 960,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            
        },
        physics: {
            default: "matter",
            matter: {
                gravity: {
                    y: gameOptions.gravity
                },
                debug: false
            }
        },
        scene: playGame
    }
    game = new Phaser.Game(config);
    window.focus();
}

class playGame extends Phaser.Scene{
    constructor() {
        super("PlayGame");
    }

    preload() {
        this.load.image("ground", "assets/sprites/ground.png");
        this.load.image("sky", "assets/sprites/sky.png");
        this.load.image("crate", "assets/sprites/crate.png");
        this.load.image("crane-vertical", "assets/sprites/crane-vertical.png");
        this.load.image("crane-horizontal", "assets/sprites/crane-horizontal.png");
        this.load.bitmapFont("font", "assets/fonts/font.png", "assets/fonts/font.fnt");
    }

    create() {
        this.matter.world.update30Hz();
        this.canDrop = true;
        this.timer = 0;
        this.timerEvent = null;
        this.addSky();
        this.addGround();
        this.addMovingCrate();
        this.timeText = this.add.bitmapText(10, 10, "font", gameOptions.timeLimit.toString(), 72);
        this.crateGroup = this.add.group();
        this.addCraneStructure();
        this.matter.world.on("collisionstart", this.checkCollision, this);
        this.setCameras();
        this.input.on("pointerdown", this.dropCrate, this);
    }

    update() {
        this.crateGroup.getChildren().forEach(function(crate){
            if(crate.y > game.config.height + crate.displayHeight){
                if(!crate.body.hit){
                    this.nextCrate();
                }
                crate.destroy();
            }
        }, this);
    }



    addCraneStructure() {
        this.craneVertical = this.add.sprite(game.config.width - 83, game.config.height / 2, "crane-vertical");
        this.craneHorizontal = this.add.sprite(game.config.width / 2, this.movingCrate.y, "crane-horizontal");
        this.craneVertical.scaleY = 1.05;
        // this.craneGroup = this.add.group();
        // const verticalBlock = this.add.rectangle(game.config.width - 25, game.config.height / 2, 50, game.config.height, 0x71797E); // x, y, width, height, color
        // const horizontalBlock = this.add.rectangle(game.config.width / 2, this.movingCrate.y, game.config.width, 50, 0x71797E);
        // this.craneGroup.add(horizontalBlock);
        // this.craneGroup.add(verticalBlock);
        // this.matter.add.gameObject(this.craneGroup, { isStatic: true });
    }
    

    
    addSky() {
        this.sky = this.add.sprite(0, 0, "sky");
        this.sky.displayWidth = game.config.width;
        this.sky.setOrigin(0, 0);
    }

    addGround() {
        this.ground = this.matter.add.sprite(game.config.width / 2, game.config.height, "ground");
        this.ground.setBody({
            type: "rectangle",
                width: this.ground.displayWidth,
                height: this.ground.displayHeight * 2
        });
        this.ground.setOrigin(0.5, 1);
        this.ground.setStatic(true);
    }

    addMovingCrate() {
        this.movingCrate = this.add.sprite(game.config.width / 2 - gameOptions.crateRange[0], this.ground.getBounds().top - gameOptions.crateHeight, "crate");
        this.tweens.add({
            targets: this.movingCrate,
            x: game.config.width / 2 - gameOptions.crateRange[1],
            duration: gameOptions.crateSpeed,
            yoyo: true,
            repeat: -1
        })
    }

    checkCollision(e, b1, b2) {
        if(b1.isCrate && !b1.hit){
            b1.hit = true;
            this.nextCrate();
        }
        if(b2.isCrate && !b2.hit){
            b2.hit = true;
            this.nextCrate();
        }
    }

    setCameras() {
        this.actionCamera = this.cameras.add(0, 0, game.config.width, game.config.height);
        this.actionCamera.ignore([this.sky, this.timeText, this.craneVertical, this.craneHorizontal]);
        this.cameras.main.ignore([this.ground, this.movingCrate]);
    }

    dropCrate() {
        if(this.canDrop && this.timer < gameOptions.timeLimit){
            this.addTimer();
            this.canDrop = false;
            this.movingCrate.visible = false;
            this.addFallingCrate();
        }
    }
    
    addTimer() {
        if(this.timerEvent == null){
            this.timerEvent = this.time.addEvent({
                delay: 1000,
                callback: this.tick,
                callbackScope: this,
                loop: true
            });
        }
    }

    addFallingCrate() {
        let fallingCrate = this.matter.add.sprite(this.movingCrate.x, this.movingCrate.y, "crate");
        fallingCrate.body.isCrate = true;
        fallingCrate.body.hit = false;
        this.crateGroup.add(fallingCrate);
        this.cameras.main.ignore(fallingCrate)
    }

    nextCrate() {
        this.zoomCamera();
        this.canDrop = true;
        this.movingCrate.visible = true;
    }

    zoomCamera() {
        let maxHeight = 0;
        this.crateGroup.getChildren().forEach(function(crate){
            if(crate.body.hit){
                maxHeight = Math.max(maxHeight, Math.round((this.ground.getBounds().top - crate.getBounds().top) / crate.displayWidth));
            }
        }, this);
        this.movingCrate.y = this.ground.getBounds().top - maxHeight * this.movingCrate.displayWidth - gameOptions.crateHeight;
        let zoomFactor = gameOptions.crateHeight / (this.ground.getBounds().top - this.movingCrate.y);
        this.actionCamera.zoomTo(zoomFactor, 500);
        let newHeight = game.config.height / zoomFactor;
        this.actionCamera.pan(game.config.width / 2, game.config.height / 2 - (newHeight - game.config.height) / 2, 500)
    }

    tick() {
        this.timer++;
        this.timeText.text = (gameOptions.timeLimit - this.timer).toString()
        if(this.timer >= gameOptions.timeLimit){
            this.timerEvent.remove();
            this.movingCrate.destroy();
            this.time.addEvent({
                delay: 2000,
                callback: function(){
                    this.removeEvent = this.time.addEvent({
                        delay: 500,
                        callback: this.removeCrate,
                        callbackScope: this,
                        loop: true
                    })
                },
                callbackScope: this
            });
        }
    }

    removeCrate() {
        if(this.crateGroup.getChildren().length > 0){
            this.crateGroup.getFirstAlive().destroy();
        }
        else{
            this.removeEvent.remove();
            this.scene.start("PlayGame");
        }
    }
}
