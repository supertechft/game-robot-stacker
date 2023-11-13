
/*
* Game Options
*/
let game;
const levelGoals = [0, 2, 4, 7]; // Number of blocks to stack for each level. 0 is unused.
const gameOptions = {
    timeLimit: 30,
    gravity: 1,
    crateHeight: 700,
    crateRange: [-300, 300],
    crateSpeed: 1250,
    goalLineColor: 0x00ff00, // Green
}
const font = {
    fontFamily: "Atarian",
    fontSize: "72px",
    fill: "#ffffff",
}



/*
* Phaser Setup
*/
window.onload = function () {
    const config = {
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
        scene: [RobotStacker, PauseMessage]
    }
    game = new Phaser.Game(config);
    window.focus();
}

/*
* Scene to display messages
*/
class PauseMessage extends Phaser.Scene {
    constructor() {
        super("PauseMessage");
    }

    /*
    * Scene Setup
    */
    preload() {
        this.load.image("youtube", "assets/sprites/youtube.png");
    }

    // Get message from the scene that called this scene
    // caller: the scene that called this scene
    // message: the message to display
    init(data) {
        this.caller = data.caller;
        this.message = data.message;
        this.gameOver = data.gameOver;
    }

    create() {
        this.addBackground();
        this.displayMessage();
        if (this.gameOver)
            this.displayYouTubeButton();    // Display YouTube button if game over

        // Click to continue
        this.input.on("pointerdown", () => {
            if (this.gameOver)  // Restart the game if game over
                this.scene.start(this.caller);
            else    // Otherwise, resume the game
                this.scene.resume(this.caller);
            this.scene.stop();
        });
    }

    /*
    * Helper Functions
    */

    // Create a semi-transparent black background
    addBackground() {
        const background = this.add.rectangle(0, 0, game.config.width, game.config.height, 0x000000, 0.75);
        background.setOrigin(0, 0);
    }

    // Create the text message in the center of the screen
    displayMessage() {
        let messageFont = Object.assign(font, {
            align: "center",
            wordWrap: { width: game.config.width - 50, useAdvancedWrap: true }
        });

        if (this.gameOver) {    // Make the font smaller if game over
            messageFont = Object.assign(messageFont, { fontSize: "48px" });
        }

        this.text = this.add.text(game.config.width / 2, game.config.height / 2, this.message, messageFont);
        this.text.setOrigin(0.5, 0.5);
    }

    // Display a YouTube button to the bottom of the screen
    displayYouTubeButton() {
        // Add the button image to the scene
        const button = this.add.image(game.config.width / 2, game.config.height - 200, 'youtube')
        button.setScale(0.4);
        button.setInteractive({ useHandCursor: true });
        button.on('pointerdown', function () {
            window.open('https://www.youtube.com/watch?v=O76LjTigHA8', '_blank');
        });
    }
}



/*
* Main Game Scene
*/
class RobotStacker extends Phaser.Scene {
    constructor() {
        super("RobotStacker");
        this.started = false;
    }

    /*
    * Game Scene Setup
    */

    preload() {
        this.load.image("sky", "assets/sprites/sky.png");
        this.load.image("ground", "assets/sprites/ground.png");
        this.load.image("claw", "assets/sprites/claw-extended.png");
        this.load.image("block_red", "assets/sprites/block_red.png");
        this.load.image("block_blue", "assets/sprites/block_blue.png");
        this.load.image("block_gift", "assets/sprites/block_gift.png");
        this.load.image("block_green", "assets/sprites/block_green.png");
        this.load.image("block_yellow", "assets/sprites/block_yellow.png");
    }

    create() {
        if (!this.started) {
            this.scene.pause();
            this.started = true
            this.scene.launch('PauseMessage', {
                caller: this.scene.key,
                message: `Welcome to the Robot Dropper!
                
                Click to drop the blocks and build as high as you can!
                
                Click to start!`
            })
        }

        this.matter.world.update30Hz(); // Runs update() at 30Hz
        this.canDrop = true;
        this.highestCrateHeight = game.config.height;
        this.currentBlock = this.getRandomBlock();
        this.currentLevel = 1;

        // Add Game Objects
        this.addSky();
        this.addGround();
        this.addTimer();
        this.addClawBlock();
        this.addGoalLine();
        if (game.config.physics.matter.debug) {
            this.createGrid(this, 100, 0xfffffff);
        }

        this.crateGroup = this.add.group();
        this.matter.world.on("collisionstart", this.checkCollision, this);
        this.setCameras();
        this.input.on("pointerdown", this.dropCrate, this);
    }

    update() {
        // console.log(this.highestCrateHeight)
        this.crateGroup.getChildren().forEach(function (crate) {
            // If the crate falls off bottom of the screen
            if (crate.y > game.config.height + crate.displayHeight) {
                // If the crate does not collide, spawn next crate
                // checkCollision() spawns another crate anyway otherwise
                if (!crate.body.hit) {
                    this.nextCrate();
                }
                crate.destroy();
            } else {
                if (crate.body.hit && crate.getBounds().top < this.highestCrateHeight && crate.body.speed < 0.1)
                    this.highestCrateHeight = crate.getBounds().top
            }
        }, this);
    }



    /*
    * Game Objects
    */

    addTimer() {
        this.timer = 0;
        this.timerEvent = null;
        this.timeText = this.add.text(20, 10, gameOptions.timeLimit.toString(), font)
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
            height: this.ground.displayHeight * 2,
        });
        this.ground.setOrigin(0.5, 1);
        this.ground.setStatic(true);
    }

    // Move claw with block back and forth on the top of the screen
    addClawBlock() {
        const x = game.config.width / 2 - gameOptions.crateRange[0];
        const y = this.ground.getBounds().top - gameOptions.crateHeight;
        this.clawBlock = this.add.sprite(x, y, this.currentBlock);
        this.claw = this.add.sprite(x, y, "claw");
        this.claw.setOrigin(0.5, 1);
        this.tweens.add({
            targets: [this.clawBlock, this.claw],
            x: game.config.width / 2 - gameOptions.crateRange[1],
            duration: gameOptions.crateSpeed,
            yoyo: true,
            repeat: -1
        })
    }

    addGoalLine(update = false) {
        if (update) {
            this.goalLine.clear();                  // Clears the old goal line
        } else {
            this.goalLine = this.add.graphics();    // Adds goal line to the scene for the first time
        }

        const dotSpacing = 10; // Adjust the spacing between dots
        this.goalLine.fillStyle(gameOptions.goalLineColor); // Set line color
        for (let x = 0; x < game.config.width; x += dotSpacing * 2) {
            this.goalLine.fillRect(x, this.getGoalY(), dotSpacing, 3); // Create a dotted line (x, y, spacing, thickness)
        }
    }

    setCameras() {
        this.actionCamera = this.cameras.add(0, 0, game.config.width, game.config.height);
        this.actionCamera.ignore([this.sky, this.timeText]);
        this.cameras.main.ignore([this.ground, this.clawBlock]);
    }



    /*
    * Game Logic
    */

    checkCollision(e, b1, b2) {
        if (b1.isCrate && !b1.hit) {
            b1.hit = true;
            this.nextCrate();
        }
        if (b2.isCrate && !b2.hit) {
            b2.hit = true;
            this.nextCrate();
        }
    }



    dropCrate() {
        if (this.canDrop && this.timer < gameOptions.timeLimit) {
            this.startTimer();
            this.canDrop = false;
            this.clawBlock.visible = false;

            if (this.currentLevel < levelGoals.length) {
                // this.time.delayedCall(1000, () => { if (this.highestCrateHeight <= this.getGoalY()) {
                if (this.highestCrateHeight <= this.getGoalY()) {
                    this.scene.pause();
                    this.scene.launch('PauseMessage', {
                        caller: this.scene.key,
                        message: `Great job!
                        You completed level ${this.currentLevel}
                        
                        Click to continue.`
                    })
                    this.currentLevel++;
                    this.addGoalLine(true);
                }
                // }})
            } else {
                // Game completed, show a final message and restart the game from level 1
                this.scene.pause();
                this.scene.launch('PauseMessage', {
                    caller: this.scene.key,
                    message: `You did it!
                        You completed all ${levelGoals.length} levels!
                        
                        Click to restart.`
                })

                this.scene.restart();
            }

            this.addFallingCrate();
        }
    }



    /*
    * Helper Functions
    */

    getRandomBlock() {
        const blockArray = ["block_red", "block_blue", "block_green", "block_gift", "block_yellow"];
        return blockArray[Math.floor(Math.random() * blockArray.length)];
    }

    getGoalY() {
        return this.ground.getBounds().top - levelGoals[this.currentLevel] * this.clawBlock.height
    }

    addFallingCrate() {
        const fallingCrate = this.matter.add.sprite(this.clawBlock.x, this.clawBlock.y, this.currentBlock);
        fallingCrate.body.isCrate = true;
        fallingCrate.body.hit = false;
        this.crateGroup.add(fallingCrate);
        // this.cameras.main.ignore(fallingCrate)
    }

    nextCrate() {
        // this.zoomCamera();
        this.currentBlock = this.getRandomBlock();
        this.clawBlock.setTexture(this.currentBlock);
        this.canDrop = true;
        this.clawBlock.visible = true;
    }

    // Starts the timer and ticks every second
    startTimer() {
        if (this.timerEvent == null) {
            this.timerEvent = this.time.addEvent({
                delay: 1000,
                callback: this.tick,
                callbackScope: this,
                loop: true
            });
        }
    }

    // Tick function for the timer
    tick() {
        this.timer++;   // Updates the timer text
        this.timeText.text = (gameOptions.timeLimit - this.timer).toString()
        if (this.timer >= gameOptions.timeLimit) {
            this.timerEvent.remove();
            this.clawBlock.destroy();   // Remove the claw block

            // After 2 seconds, remove all crates
            this.time.addEvent({
                delay: 2000,
                callback: function () {
                    this.removeEvent = this.time.addEvent({
                        delay: 500,
                        callback: this.removeCrate,
                        callbackScope: this,
                        loop: true
                    })
                },
                callbackScope: this
            });

            this.scene.launch('PauseMessage', {
                caller: this.scene.key,
                message: `Game Over!
                You ran out of time.

                Having trouble concentrating?
                Check out a video of us demonstrating focus using a brainwave headset from Neurosky.
                
                Click to restart.`,
                gameOver: true,
            })
        }
    }

    // Remove crates one by one and restart the game when all crates are removed
    removeCrate() {
        if (this.crateGroup.getChildren().length > 0) {
            this.crateGroup.getFirstAlive().destroy();
        }
        else {
            this.removeEvent.remove();
            // this.scene.start("RobotStacker");
        }
    }

    createGrid(scene, gridSize, color) {
        const graphics = scene.add.graphics();
        graphics.lineStyle(1, color); // Set line style (thickness and color)

        // Vertical lines
        for (let x = 0; x < scene.game.config.width; x += gridSize) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, scene.game.config.height);
        }

        // Horizontal lines
        for (let y = 0; y < scene.game.config.height; y += gridSize) {
            graphics.moveTo(0, y);
            graphics.lineTo(scene.game.config.width, y);
        }

        // Render the grid
        graphics.strokePath();
    }


    /*
    * Unused Functions
    */

    zoomCamera() {
        const maxHeight = 0;
        this.crateGroup.getChildren().forEach(function (crate) {
            if (crate.body.hit) {
                maxHeight = Math.max(maxHeight, Math.round((this.ground.getBounds().top - crate.getBounds().top) / crate.displayWidth));
            }
        }, this);
        this.clawBlock.y = this.ground.getBounds().top - maxHeight * this.clawBlock.displayWidth - gameOptions.crateHeight;
        const zoomFactor = gameOptions.crateHeight / (this.ground.getBounds().top - this.clawBlock.y);
        this.actionCamera.zoomTo(zoomFactor, 500);
        const newHeight = game.config.height / zoomFactor;
        this.actionCamera.pan(game.config.width / 2, game.config.height / 2 - (newHeight - game.config.height) / 2, 500)
    }

}
