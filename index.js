const { PI, cos, atan2, abs, ceil } = Math;
let SCREEN_WIDTH = 0,
    SCREEN_HEIGHT = 0,
    graphics = null,
    audioBG = null,
    DEVICE_MOTION = null,
    canvas = null,
    ctx = null,
    bg = null,
    player = null,
    track = [],
    entities = [];
const KEY_EVENTS = {
    ArrowUp: 0,
    ArrowDown: 0,
    ArrowLeft: 0,
    ArrowRight: 0
};


async function main() {
    howToPlay();
    await loadMedia();

    setupScreen();
    setupBGParalax();
    setupGameEvents();
    setupControls();


    track = createTrack(25, 250, 1000);
    player = new Player(graphics.get("moto"));
    new Renderer(update).start();
}

window.onload = main;

function update(dt) {
    bg.speed = player.speed.x;
    bg.update(ctx, dt * 0.5)
    ctx.fillStyle = "#000";

    ctx.beginPath();
    ctx.moveTo(0, SCREEN_HEIGHT)
    for (let i = 0; i < SCREEN_WIDTH; ++i) {
        ctx.lineTo(i, SCREEN_HEIGHT - noise(player.distance + i) * 0.25);
    }
    ctx.lineTo(SCREEN_WIDTH, SCREEN_HEIGHT);
    ctx.fill();

    entities.forEach((entity, i) => {
        entity.render(ctx);
        entity.update(dt);
        if (entity.isKilled) {
            if (entity.name == "player") {
                gameOver();
            } else {
                entities.splice(i, 1);
            }
        }
    });

    ctx.fillText((abs(player.speed.x) * 40 | 0) + "km/h", 20, 20);
    ctx.fillText("score: " + player.score, 20, 40);
    ctx.fillText("HI: " + player.HI, 20, 60);
}

/******* Program *******/

function gameOver() {
    player.reset();
    setupBGParalax();
}

function randomInt(min, max) {
    return Math.random() * (++max - min) + min | 0;
}

function lerp(a, b, t) {
    return a + (b - a) * (1 - cos(t * PI)) / 2;
}

function noise(x) {
    x = x * 0.01 % 255;
    return lerp(track[x | 0], track[ceil(x)], x - (x | 0))
}

function createTrack(minHeight, maxHeight, size) {
    const arr = [];
    for (let i = 0; i < 12; ++i) {
        arr.push(randomInt(25, 100));
    }
    for (let i = arr.length; i < size; ++i) {
        arr.push(randomInt(minHeight, maxHeight));
    }
    return arr;
}

/******* util *********/
function $(selectors) {
    return document.querySelector(selectors);
}

function createScreen(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return [canvas, canvas.getContext("2d")];
}

function isMobile() {
    return navigator.userAgent.match(/Android|webOS|iPhone|iPod|iPad|BlackBerry/i);
}
function isDeviceMotionAvailable() {
    return window.DeviceOrientationEvent;
}

function setupScreen() {
    SCREEN_WIDTH = innerWidth;
    SCREEN_HEIGHT = innerHeight;

    if (canvas) {
        canvas.remove();
    }
    [canvas, ctx] = createScreen(SCREEN_WIDTH, SCREEN_HEIGHT);
    ctx.font = "15px pixel";
    document.body.appendChild(canvas);
}

async function loadMedia() {
    graphics = new Graphics({
        moto: "moto.svg",
        sky: "layers/1-2.png",
        rocks: "layers/2-2.png",
        rocks2: "layers/3-2.png"
    });

    [audioBG] = await Promise.all([
        loadAudio("https://luis72353.github.io/extreme-motorcycle/audio/Epic Action Rock.mp3"),
        graphics.load(),
    ]);

    audioBG.loop = true;
    audioBG.volume = 0.5;
    window.onclick = () => audioBG.play();
}

function setupBGParalax() {
    bg = new ParalaxBackground();
    bg.addBackground("sky", {
        velocity: 0.1,
        x: 0,
        y: 0.5
    });
    bg.addBackground("rocks", {
        velocity: 0.5,
        x: 0,
        y: 20
    });
    bg.addBackground("rocks2", {
        velocity: 1,
        x: 0,
        y: 40
    });
}

function setupControls() {
    DEVICE_MOTION = new Vector();

    onkeydown = e => KEY_EVENTS[e.key] = 1;
    onkeyup = e => KEY_EVENTS[e.key] = 0;


    if (isMobile()) {
        if (isDeviceMotionAvailable()) {
            $("#A").ontouchstart = () => {
                KEY_EVENTS.ArrowUp = 1;
                KEY_EVENTS.ArrowDown = 0;
            }
            $("#A").ontouchend = () => {
                KEY_EVENTS.ArrowUp = 0;
            }

            $("#B").ontouchstart = () => {
                KEY_EVENTS.ArrowUp = 0;
                KEY_EVENTS.ArrowDown = 1;
            }
            $("#B").ontouchend = () => {
                KEY_EVENTS.ArrowDown = 0;
            }
            $("#C").remove();
            window.ondevicemotion = e => {
                DEVICE_MOTION.y = e.accelerationIncludingGravity.y;
                const { y } = DEVICE_MOTION;
                if (y > 4) y = 4; else if (y < -4) y = -4;

                if (y > 0) {
                    KEY_EVENTS.ArrowRight = y / 2;
                    KEY_EVENTS.ArrowLeft = 0;
                } else {
                    KEY_EVENTS.ArrowLeft = abs(y) / 3;
                    KEY_EVENTS.ArrowRight = 0;
                }
            }
        } else {
            $("#A").innerHTML = "R";
            $("#B").innerHTML = "L";
            $("#A").ontouchstart = () => {
                KEY_EVENTS.ArrowRight = 1;
                KEY_EVENTS.ArrowLeft = 0;
            }
            $("#A").ontouchend = () => {
                KEY_EVENTS.ArrowRight = 0;
            }

            $("#B").ontouchstart = () => {
                KEY_EVENTS.ArrowRight = 0;
                KEY_EVENTS.ArrowLeft = 1;
            }
            $("#B").ontouchend = () => {
                KEY_EVENTS.ArrowLeft = 0;
            }
            let clicks = -1;
            $("#C").onclick = () => {
                ++clicks;
                if (clicks == 0) {
                    KEY_EVENTS.ArrowUp = 1;
                    $("#C").innerHTML = "←";
                } else if (clicks == 1) {
                    KEY_EVENTS.ArrowUp = 0;
                    KEY_EVENTS.ArrowDown = 1;
                    $("#C").innerHTML = "→←";
                } else if (clicks == 2) {
                    KEY_EVENTS.ArrowDown = 0;
                    clicks = -1;
                    $("#C").innerHTML = "→"
                }
            }
        }
    } else {
        $("#controls").remove();
    }
}

function setupGameEvents() {
    $("#start").onclick = () => {
        entities.push(player);
        $("#home").remove();
    }
    $("#howToPlay-next").onclick = () => {
        howToPlay();
    }

    window.onresize = () => {
        setupScreen();
        player.pos.x = innerWidth / 2;
    }
}

/***** classes *****/
class TextEffect {
    constructor(pos, text) {
        this.pos = pos;
        this.alpha = 1;
        this.distance = -20;
        this.text = text;
    }

    get isKilled() {
        return this.alpha <= 0;
    }

    update(dt) {
        this.alpha -= dt * 0.0005;
        this.distance -= dt * 0.1;
    }

    render(ctx) {
        ctx.save();
        ctx.fillStyle = `rgba(0,0,0,${abs(this.alpha)})`;
        ctx.fillText(this.text, this.pos.x | 0, (this.pos.y + this.distance) | 0);
        ctx.restore();
    }
}

class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    get copy() {
        return new Vector(this.x, this.y);
    }

    set(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
}

class Player {
    constructor(sprite) {
        this.pos = new Vector(SCREEN_WIDTH / 2, 0)
        this.rot = 0;
        this.sprite = sprite;
        this.distance = 0;

        this.rSpeed = 0;
        this.speed = new Vector(0, 0);
        this.grounded = 0;

        this.distance = 0;

        this.score = 0;
        this.HI = 0;
        this.airTime = 0;

        this._iskilled = false;
        this.name = "player";
    }

    get isKilled() {
        return this._iskilled;
    }

    update(dt) {

        this.speed.x -= (this.speed.x - (KEY_EVENTS.ArrowUp - KEY_EVENTS.ArrowDown)) * 0.01;
        if (player.distance <= 0 && this.speed.x <= 0) {
            this.speed.x = 0;
            this.distance = 0;
        }
        this.distance += 7 * player.speed.x;
        let p1 = SCREEN_HEIGHT - noise(this.distance + this.pos.x) * 0.25;
        let p2 = SCREEN_HEIGHT - noise(this.distance + 5 + this.pos.x) * 0.25;

        if (p1 - 15 > this.pos.y) {
            this.speed.y += 0.1;
            this.grounded = 0;
        } else {
            this.speed.y -= this.pos.y - (p1 - 15);
            if (this.speed.y < -6) this.speed.y = -6;
            this.pos.y = p1 - 15;
            this.grounded = 1
            if (abs(this.rot) > 2) {
                this._iskilled = true;
            }

        }
        if (((p2 - 15) - this.pos.y) > 0 && this.grounded) {
            this.speed.x += 0.01;
        } else if (((p2 - 15) - this.pos.y) | 0 < 0 && this.grounded) {
            this.speed.x -= 0.01;
        }

        if (!this.grounded) {
            this.airTime += dt;
        } else {
            let scoreWon = (this.airTime / 200) | 0;
            if (scoreWon > 2) {
                this.addScore(scoreWon);
            }
            this.airTime = 0;
        }

        let angle = atan2((p2 - 15) - this.pos.y, (this.pos.x + 5) - this.pos.x);
        this.pos.y += this.speed.y;

        if (this.grounded) {
            this.rot -= (this.rot - angle) * 0.5;
            this.rSpeed = this.rSpeed - (angle - this.rot);
        }
        this.rSpeed = (KEY_EVENTS.ArrowLeft - KEY_EVENTS.ArrowRight) * 0.2 + (((p2 - 15) - this.pos.y > (this.pos.x + 5) - this.pos.x) ? 0.05 : -0.05);
        this.rot -= this.rSpeed * 0.3;

        if (this.rot > PI) {
            this.rot = -PI;

            this.addScore(200, "front flip");
        }
        if (this.rot < -PI) {
            this.rot = PI;
            this.addScore(100, "Back flip");
        }



    }

    addScore(score, msg = "") {
        this.score += score;
        entities.push(new TextEffect(this.pos.copy, `${msg} +${score}`));
        if (this.score > this.HI) {
            this.HI = this.score;
        }
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.rot)
        ctx.drawImage(this.sprite, -13, -13, 32, 32);
        ctx.restore();
    }

    reset() {
        this.pos.y = innerHeight / 2;
        this.score = 0;
        this._iskilled = false;
        this.distance = 0;
        this.rot = 0;
        this.speed.x = 0;
        entities = entities.filter(entity => entity instanceof Player);
    }
}



class ParalaxBackground {
    constructor() {
        this.backgrounds = new Map();
        this.speed = 0;
    }

    update(ctx, dt) {
        this.backgrounds.forEach(background => {
            let counter = 0;
            background.offsetX += (background.velocity * (dt / 10)) * (this.speed * 2);
            while (background.x * counter + (background.width * counter) - background.offsetX < SCREEN_WIDTH) {
                ctx.drawImage(background.image, (background.x * counter + ((background.width) * counter) - background.offsetX) | 0, background.y | 0);
                counter++;
            }
        });
    }

    addBackground(name, options = {}) {
        options.y = !options.y ? SCREEN_HEIGHT - image.height : options.y;
        const image = graphics.get(name);
        this.backgrounds.set(name, { image, ...options, offsetX: 0, width: image.width });
    }
}

class Graphics {
    constructor(src, path = "https://luis72353.github.io/extreme-motorcycle/") {
        this._buffer = {};
        this.src = src;
        this.path = path;
    }

    get(name) {
        return this._buffer[name];
    }

    async load() {
        const loads = [];
        const names = Object.keys(this.src);

        for (let name in this.src) {
            loads.push(Graphics.loadImage(this.path + this.src[name]))
        }

        (await Promise.all(loads)).forEach((img, i) => {
            this._buffer[names[i]] = img;
        });
    }

    static loadImage(url) {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = url;
        })
    }

}
function loadAudio(url) {
    return new Promise(resolve => {
        const audio = new Audio();
        audio.oncanplay = () => resolve(audio);
        audio.src = url;
    })
}

class Renderer {
    constructor(callback) {
        this.lt = 0;

        this.loop = ms => {
            if (ms) callback(ms - this.lt);
            this.lt = ms;
            requestAnimationFrame(this.loop);
        }
    }

    start() {
        this.loop(0)
    }
}


const howToPlaySections = [
    [`<h3>Mobile Controlls with motion sensors</h3>
    <hr>
    <ul>
        <li>turn on motion sensors</li>
        <li>rotate left or right to rotate the moto</li>
        <li>touch A to accelerate</li>
        <li>touch B to brake</li>
    </ul>`,
        `<h3>Mobile Controlls without motion sensors</h3>
    <hr>
    <ul>
        <li>touch L to rotate right</li>
        <li>touch R to totate left</li>
        <li>touch "→" or "←" to go or brake</li>
    </ul>`],
    `
    <h3>PC Controlls (Arrows)</h3>
    <hr>
    <ul>
        <li>AU ↑ accelerate</li>
        <li>AD ↓ brake</li>
        <li>AR → rotate rigth</li>
        <li>AL ← rotate left</li>
    </ul>`,
    `<h3>Score</h3>
    <hr>
    <table>
        <thead>
            <th>Action</th>
            <th>score</th>
        </thead>
        <tbody>
            <tr>
                <td>Back flip</td>
                <td>100</td>
            </tr>
            <tr>
                <td>Front flip</td>
                <td>200</td>
            </tr>
            <tr>
                <td>Spend on air 1 second</td>
                <td>5</td>
            </tr>
        </tbody>
    </table>`, `
     <h3>Game over</h3>
     <hr>
     <p>Game ends when Motorcycle falls from head</p>
    `];
let howToPlayIndex = 0;
function howToPlay() {
    if (howToPlayIndex == 0) {
        $("#howToPlaySection").innerHTML = howToPlaySections[howToPlayIndex++][isDeviceMotionAvailable() ? 0 : 1];
    } else {
        $("#howToPlaySection").innerHTML = howToPlaySections[howToPlayIndex++];
    }
    if (howToPlayIndex == howToPlaySections.length) {
        $("#howToPlay").remove();
    }
}