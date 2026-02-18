const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Игровые переменные
let gameState = 'story'; // story, playing, levelComplete, gameOver, ending
let currentLevel = 1;
let maxLevel = 20; // Можем расширить до 3000
let totalTorches = 0;
let totalKeys = 0;
let health = 3;
let maxHealth = 3;
let monsterAppeared = false;
let storyProgress = 0;

// Объект игрока
const player = {
    x: 100,
    y: 500,
    width: 30,
    height: 40,
    velocityY: 0,
    velocityX: 0,
    jumping: false,
    speed: 5,
    jumpPower: 12,
    grounded: false
};

// Массивы для игровых объектов
let platforms = [];
let enemies = [];
let items = [];
let particles = [];
let monster = null;

// Ввод
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ') {
        e.preventDefault();
        if (player.grounded) {
            player.velocityY = -player.jumpPower;
            player.grounded = false;
        }
    }
});
window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Класс платформы
class Platform {
    constructor(x, y, width, height, color = '#4a4a4a') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.moving = false;
        this.moveSpeed = 0;
        this.moveRange = 0;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }

    update() {
        if (this.moving) {
            this.x += this.moveSpeed;
            if (Math.abs(this.x - this.initialX) > this.moveRange) {
                this.moveSpeed *= -1;
            }
        }
    }
}

// Класс врага
class Enemy {
    constructor(x, y, width, height, speed = 2, patrolRange = 150) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
        this.patrolRange = patrolRange;
        this.direction = 1;
        this.startX = x;
        this.alive = true;
    }

    draw() {
        if (!this.alive) return;
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        // Глаза
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(this.x + 5, this.y + 5, 8, 8);
        ctx.fillRect(this.x + this.width - 13, this.y + 5, 8, 8);
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 6, this.y + 6, 4, 4);
        ctx.fillRect(this.x + this.width - 12, this.y + 6, 4, 4);
    }

    update() {
        if (!this.alive) return;
        this.x += this.speed * this.direction;

        if (Math.abs(this.x - this.startX) > this.patrolRange) {
            this.direction *= -1;
        }
    }

    checkCollision(rect) {
        return this.x < rect.x + rect.width &&
               this.x + this.width > rect.x &&
               this.y < rect.y + rect.height &&
               this.y + this.height > rect.y;
    }
}

// Класс предмета
class Item {
    constructor(x, y, type = 'torch') { // torch, key, artifact
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.type = type;
        this.collected = false;
        this.bobbing = 0;
    }

    draw() {
        if (this.collected) return;
        this.bobbing += 0.05;
        const bobY = this.y + Math.sin(this.bobbing) * 5;

        if (this.type === 'torch') {
            ctx.fillStyle = '#ffaa00';
            ctx.fillRect(this.x, bobY, this.width, this.height);
            ctx.fillStyle = '#ff6600';
            ctx.fillRect(this.x + 5, bobY - 10, 10, 8);
        } else if (this.type === 'key') {
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(this.x + 5, bobY + 5, 10, 10);
            ctx.fillRect(this.x, bobY + 8, 5, 4);
        } else if (this.type === 'artifact') {
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.arc(this.x + 10, bobY + 10, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#0088ff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    checkCollision(rect) {
        return this.x < rect.x + rect.width &&
               this.x + this.width > rect.x &&
               this.y < rect.y + rect.height &&
               this.y + this.height > rect.y;
    }
}

// Класс монстра (босс)
class Monster {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 80;
        this.health = 5;
        this.speed = 3;
        this.phase = 0;
        this.attacking = false;
    }

    draw() {
        // Большое чёрное тело
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Красные глаза
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x + 10, this.y + 15, 12, 12);
        ctx.fillRect(this.x + this.width - 22, this.y + 15, 12, 12);

        // Белые зрачки
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x + 13, this.y + 18, 6, 6);
        ctx.fillRect(this.x + this.width - 19, this.y + 18, 6, 6);

        // Большой рот
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + 50, 15, 0, Math.PI);
        ctx.stroke();
    }

    update(playerX) {
        if (playerX < this.x) {
            this.x -= this.speed;
        } else {
            this.x += this.speed;
        }

        // Пытается атаковать игрока
        this.phase = (this.phase + 1) % 60;
        if (this.phase === 0) {
            this.attacking = true;
        }
        if (this.phase === 10) {
            this.attacking = false;
        }
    }

    checkCollision(rect) {
        return this.x < rect.x + rect.width &&
               this.x + this.width > rect.x &&
               this.y < rect.y + rect.height &&
               this.y + this.height > rect.y;
    }
}

// Функция создания уровней
function createLevel(levelNum) {
    platforms = [];
    enemies = [];
    items = [];
    monster = null;
    monsterAppeared = false;

    // Земля
    platforms.push(new Platform(0, 560, 800, 40, '#2a2a2a'));

    const difficulty = Math.min(levelNum / 5, 3); // Сложность растёт

    if (levelNum === 1) {
        // Первый уровень - простой
        platforms.push(new Platform(200, 480, 150, 20));
        platforms.push(new Platform(450, 400, 150, 20));
        platforms.push(new Platform(150, 320, 200, 20));
        items.push(new Item(250, 450, 'torch'));
        enemies.push(new Enemy(400, 520, 30, 30, 2, 100));
    } else if (levelNum === 2) {
        platforms.push(new Platform(100, 480, 120, 20));
        platforms.push(new Platform(300, 420, 120, 20));
        platforms.push(new Platform(500, 360, 150, 20));
        platforms.push(new Platform(200, 300, 100, 20));
        items.push(new Item(350, 390, 'torch'));
        items.push(new Item(550, 330, 'key'));
        enemies.push(new Enemy(150, 520, 30, 30, 3, 150));
        enemies.push(new Enemy(450, 520, 30, 30, 2.5, 120));
    } else if (levelNum >= 3 && levelNum <= 5) {
        // Уровни 3-5: средняя сложность
        for (let i = 0; i < 5 + Math.floor(difficulty); i++) {
            const x = Math.random() * 650;
            const y = 150 + i * 80;
            platforms.push(new Platform(x, y, 80 + Math.random() * 50, 15));
        }
        for (let i = 0; i < Math.floor(difficulty) + 1; i++) {
            items.push(new Item(Math.random() * 700, Math.random() * 400, 'torch'));
        }
        items.push(new Item(600, 200, 'key'));
        for (let i = 0; i < Math.floor(difficulty) + 1; i++) {
            enemies.push(new Enemy(Math.random() * 700, 520, 30, 30, 2 + difficulty, 150));
        }
    } else if (levelNum >= 6 && levelNum <= 15) {
        // Уровни 6-15: высокая сложность
        for (let i = 0; i < 6 + Math.floor(difficulty); i++) {
            const x = Math.random() * 650;
            const y = 100 + i * 70;
            const width = 60 + Math.random() * 60;
            platforms.push(new Platform(x, y, width, 15));
        }
        for (let i = 0; i < 2 + Math.floor(difficulty); i++) {
            items.push(new Item(Math.random() * 700, Math.random() * 450, 'torch'));
        }
        for (let i = 0; i < Math.floor(difficulty); i++) {
            items.push(new Item(Math.random() * 700, Math.random() * 450, 'key'));
        }
        for (let i = 0; i < 2 + Math.floor(difficulty); i++) {
            enemies.push(new Enemy(Math.random() * 700, 520, 30, 30, 2.5 + difficulty, 200));
        }
    } else if (levelNum >= 16 && levelNum < maxLevel) {
        // Уровни перед финалом
        for (let i = 0; i < 8 + Math.floor(difficulty); i++) {
            const x = Math.random() * 650;
            const y = 80 + i * 60;
            const width = 50 + Math.random() * 80;
            platforms.push(new Platform(x, y, width, 15));
        }
        for (let i = 0; i < 3 + Math.floor(difficulty); i++) {
            items.push(new Item(Math.random() * 700, Math.random() * 400, 'torch'));
        }
        for (let i = 0; i < 2 + Math.floor(difficulty); i++) {
            items.push(new Item(Math.random() * 700, Math.random() * 400, 'key'));
        }
        items.push(new Item(700, 100, 'artifact'));
        for (let i = 0; i < 3 + Math.floor(difficulty); i++) {
            enemies.push(new Enemy(Math.random() * 700, 520, 30, 30, 3 + difficulty, 250));
        }
    } else if (levelNum === maxLevel) {
        // Финальный уровень - МОНСТР
        platforms.push(new Platform(100, 450, 150, 20));
        platforms.push(new Platform(350, 380, 150, 20));
        platforms.push(new Platform(600, 310, 150, 20));
        platforms.push(new Platform(200, 250, 400, 20));
        items.push(new Item(400, 200, 'artifact'));
        monster = new Monster(650, 100);
    }

    // Граница потока (падение = смерть)
    platforms.push(new Platform(0, 600, 800, 10, '#8B0000'));

    player.x = 50;
    player.y = 500;
    player.velocityY = 0;
    player.velocityX = 0;
    player.grounded = false;
}

// Обновление игрока
function updatePlayer() {
    // Горизонтальное движение
    if (keys['ArrowLeft'] || keys['a']) {
        player.velocityX = -player.speed;
    } else if (keys['ArrowRight'] || keys['d']) {
        player.velocityX = player.speed;
    } else {
        player.velocityX *= 0.8;
    }

    player.x += player.velocityX;

    // Гравитация
    player.velocityY += 0.5;
    player.y += player.velocityY;
    player.grounded = false;

    // Границы карты
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Проверка падения
    if (player.y > 600) {
        health--;
        if (health <= 0) {
            gameState = 'gameOver';
            document.getElementById('gameOverMessage').textContent = 
                'Ребёнок упал в темноту... Игра окончена.';
        } else {
            player.y = 500;
            player.velocityY = 0;
        }
    }

    // Коллизии с платформами
    for (let platform of platforms) {
        if (player.velocityY > 0 && // Падаем вниз
            player.y + player.height <= platform.y + 5 &&
            player.y + player.height + player.velocityY >= platform.y &&
            player.x + player.width > platform.x &&
            player.x < platform.x + platform.width) {
            player.y = platform.y - player.height;
            player.velocityY = 0;
            player.grounded = true;
        }
    }
}

// Отрисовка
function draw() {
    // Фон
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Эффект мрака
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Платформы
    for (let platform of platforms) {
        platform.draw();
    }

    // Враги
    for (let enemy of enemies) {
        enemy.draw();
    }

    // Предметы
    for (let item of items) {
        item.draw();
    }

    // Монстр
    if (monster) {
        monster.draw();
    }

    // Игрок
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    // Лицо
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(player.x + 7, player.y + 8, 6, 6);
    ctx.fillRect(player.x + 17, player.y + 8, 6, 6);
    ctx.fillStyle = '#000';
    ctx.fillRect(player.x + 8, player.y + 9, 4, 4);
    ctx.fillRect(player.x + 18, player.y + 9, 4, 4);

    // Рот - эмоция страха
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x + 15, player.y + 20, 4, 0, Math.PI);
    ctx.stroke();
}

// Основной цикл игры
function update() {
    if (gameState !== 'playing') return;

    updatePlayer();

    // Обновление платформ
    for (let platform of platforms) {
        platform.update();
    }

    // Обновление врагов
    for (let enemy of enemies) {
        enemy.update();
        if (enemy.checkCollision(player)) {
            health--;
            player.y -= 50;
            player.velocityY = -8;
            if (health <= 0) {
                gameState = 'gameOver';
                document.getElementById('gameOverMessage').textContent = 
                    'Монстр поймал ребёнка...';
            }
        }
    }

    // Сбор предметов
    for (let item of items) {
        if (!item.collected && item.checkCollision(player)) {
            item.collected = true;
            if (item.type === 'torch') {
                totalTorches++;
            } else if (item.type === 'key') {
                totalKeys++;
            }
        }
    }

    // Монстр (финальный уровень)
    if (monster) {
        if (!monsterAppeared && player.y < 300) {
            monsterAppeared = true;
            document.getElementById('message').textContent = '⚠️ ЧТО-ТО ОГРОМНОЕ ПРОСНУЛОСЬ! ⚠️';
        }

        if (monsterAppeared) {
            monster.update(player.x);
            if (monster.checkCollision(player)) {
                if (totalKeys >= 2) {
                    // Хороший конец
                    gameState = 'ending';
                    document.getElementById('endingTitle').textContent = 'СПАСЕНИЕ';
                    document.getElementById('endingText').textContent = 
                        'Ребёнок использует артефакты, чтобы заперкся на чердаке.\n\n' +
                        'Внезапно раздаётся звук взрыва.\n' +
                        'Монстр исчезает в чёрной пыли.\n\n' +
                        'Когда утром приходит полиция, они находят ребёнка живым.\n' +
                        'Остаётся только вопрос: куда исчезли родители?...\n\n' +
                        '===== КОНЕЦ =====';
                } else {
                    // Плохой конец
                    gameState = 'ending';
                    document.getElementById('endingTitle').textContent = 'ПРАВДА';
                    document.getElementById('endingText').textContent = 
                        'Так же, как его родители, ребёнка поглотила тьма.\n\n' +
                        'Монстр был голоден.\n' +
                        'Монстр был в доме.\n' +
                        'Монстр был всегда.\n\n' +
                        'И теперь он снова наполнен.\n' +
                        'Он ждёт следующую жертву.\n' +
                        'Он ждёт вас...\n\n' +
                        '===== КОНЕЦ =====';
                }
            }
        }
    }

    // Проверка завершения уровня
    if (player.x > canvas.width - 50 && player.y < 100) {
        gameState = 'levelComplete';
        storyProgress++;

        let message = '';
        if (currentLevel === 5) {
            message = 'Ты находишь старый дневник... на нём кровь.';
        } else if (currentLevel === 10) {
            message = 'В подвале ты слышишь странные звуки. Что-то дышит в темноте...';
        } else if (currentLevel === 15) {
            message = 'Ты видишь фотографии родителей на стене. Они улыбаются. Но их глаза чёрные...';
        } else if (currentLevel === maxLevel - 1) {
            message = 'Ты добираешься до последней комнаты. Дверь медленно открывается...';
        }

        document.getElementById('levelMessage').textContent = message;
    }

    // Обновление UI
    document.getElementById('levelInfo').textContent = `Уровень: ${currentLevel}/${maxLevel}`;
    document.getElementById('healthInfo').textContent = `❤️ ${health}`;
    document.getElementById('itemsInfo').textContent = `🔦 ${totalTorches} | 🔑 ${totalKeys}`;

    draw();
}

// Функция начала игры
function startGame() {
    document.getElementById('storyScreen').classList.add('hidden');
    gameState = 'playing';
    createLevel(1);
}

// Функция следующего уровня
function nextLevel() {
    document.getElementById('levelComplete').classList.add('hidden');
    currentLevel++;

    if (currentLevel > maxLevel) {
        gameState = 'ending';
        document.getElementById('endingTitle').textContent = 'ЭПИЛОГ';
        document.getElementById('endingText').textContent = 
            'Ты выбежал из дома на рассвете.\n\n' +
            'Полиция уже ждала снаружи.\n' +
            'Они говорят, что дом пустой.\n' +
            'Что там никого не было уже несколько лет.\n\n' +
            'Но ты знаешь правду.\n' +
            'Ты чувствовал его дыхание.\n' +
            'Ты видел его глаза.\n\n' +
            'И теперь, ночью, когда ты закрываешь глаза,\n' +
            'ты всё ещё слышишь его голос...\n\n' +
            '===== КОНЕЦ =====';
        document.getElementById('endingScreen').classList.remove('hidden');
        return;
    }

    gameState = 'playing';
    createLevel(currentLevel);
}

// Главный игровой цикл
setInterval(update, 1000 / 60); // 60 FPS
