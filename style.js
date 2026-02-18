* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: Arial, sans-serif;
    background: #1a1a1a;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    color: #fff;
}

#gameContainer {
    position: relative;
    background: #000;
    border: 3px solid #444;
    box-shadow: 0 0 20px rgba(255, 0, 0, 0.3);
}

canvas {
    display: block;
    background: linear-gradient(180deg, #0a0a0a 0%, #1a0a0a 100%);
}

#ui {
    background: rgba(0, 0, 0, 0.9);
    padding: 10px;
    border-top: 2px solid #444;
}

#stats {
    display: flex;
    justify-content: space-around;
    font-size: 16px;
    margin-bottom: 5px;
}

#stats span {
    color: #4f4;
}

#message {
    text-align: center;
    height: 20px;
    color: #ff6b6b;
    font-weight: bold;
}

.screen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.95);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    font-family: Arial, sans-serif;
}

.screen.hidden {
    display: none;
}

#storyScreen {
    background: linear-gradient(135deg, #1a0a2e 0%, #0f3460 100%);
}

.storyContent {
    text-align: center;
    max-width: 600px;
    padding: 40px;
    background: rgba(0, 0, 0, 0.8);
    border: 3px solid #ff0000;
    border-radius: 10px;
    box-shadow: 0 0 30px rgba(255, 0, 0, 0.5);
}

.storyContent h1 {
    font-size: 48px;
    margin-bottom: 30px;
    color: #ff0000;
    text-shadow: 0 0 10px #ff0000;
}

.storyContent p {
    font-size: 18px;
    margin: 15px 0;
    line-height: 1.6;
    color: #ccc;
}

.storyContent .warning {
    color: #ff6b6b;
    font-weight: bold;
    font-size: 20px;
    margin: 30px 0;
}

.screenContent {
    text-align: center;
    padding: 40px;
    background: rgba(0, 0, 0, 0.9);
    border: 2px solid #ff0000;
    border-radius: 10px;
    max-width: 500px;
}

.screenContent h2 {
    font-size: 36px;
    color: #ff0000;
    margin-bottom: 20px;
    text-shadow: 0 0 10px #ff0000;
}

.screenContent p {
    font-size: 16px;
    margin: 15px 0;
    color: #ddd;
    line-height: 1.6;
}

button {
    margin-top: 30px;
    padding: 12px 30px;
    font-size: 16px;
    background: #ff0000;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.3s;
    text-transform: uppercase;
}

button:hover {
    background: #ff3333;
    box-shadow: 0 0 20px rgba(255, 0, 0, 0.8);
    transform: scale(1.05);
}

button:active {
    transform: scale(0.95);
}

@keyframes flicker {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
}

.flicker {
    animation: flicker 0.2s infinite;
}
