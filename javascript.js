// ===== CONFIGURACIÓN GLOBAL =====
const app = {
    currentScreen: 'welcome-screen',
    colorblindType: 'normal',
    fontSize: 1,
    highContrast: false,
    soundEnabled: true,
    achievements: 0,
    testResults: {
        score: 0,
        answers: []
    },
    gameState: {
        colorGameScore: 0,
        colorGameLevel: 1,
        memoryMoves: 0,
        memoryPairs: 0,
        patternScore: 0,
        patternLevel: 1
    }
};

// ===== SISTEMA DE SONIDOS =====
const sounds = {
    click: () => playTone(400, 0.1),
    correct: () => playMelody([523, 659, 784], [0.1, 0.1, 0.2]),
    wrong: () => playTone(200, 0.3),
    achievement: () => playMelody([523, 659, 784, 1047], [0.15, 0.15, 0.15, 0.4]),
    levelUp: () => playMelody([392, 523, 659, 784], [0.1, 0.1, 0.1, 0.3]),
    complete: () => playMelody([523, 587, 659, 784, 880, 988, 1047], [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.3])
};

function playTone(frequency, duration) {
    if (!app.soundEnabled) return;
    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

function playMelody(frequencies, durations) {
    if (!app.soundEnabled) return;
    
    let time = 0;
    frequencies.forEach((freq, index) => {
        setTimeout(() => playTone(freq, durations[index]), time * 1000);
        time += durations[index];
    });
}

function toggleSound() {
    app.soundEnabled = !app.soundEnabled;
    const indicator = document.getElementById('sound-indicator');
    if (app.soundEnabled) {
        indicator.textContent = '🔊 Sonido: ON';
        indicator.classList.remove('muted');
        sounds.click();
    } else {
        indicator.textContent = '🔇 Sonido: OFF';
        indicator.classList.add('muted');
    }
}

// ===== SISTEMA DE RECOMPENSAS =====
function showReward(type, message) {
    const modal = document.getElementById('reward-modal');
    const icon = document.getElementById('reward-icon');
    const title = document.getElementById('reward-title');
    const messageEl = document.getElementById('reward-message');
    const starsContainer = document.getElementById('reward-stars');
    
    const rewards = {
        testComplete: {
            icon: '🎊',
            title: '¡Test Completado!',
            stars: 3,
            sound: 'complete'
        },
        levelUp: {
            icon: '⬆️',
            title: '¡Nivel Superado!',
            stars: 2,
            sound: 'levelUp'
        },
        gameWin: {
            icon: '🏆',
            title: '¡Victoria!',
            stars: 3,
            sound: 'complete'
        },
        achievement: {
            icon: '🌟',
            title: '¡Nuevo Logro!',
            stars: 1,
            sound: 'achievement'
        }
    };
    
    const reward = rewards[type] || rewards.achievement;
    
    icon.textContent = reward.icon;
    title.textContent = reward.title;
    messageEl.textContent = message;
    
    // Generar estrellas
    starsContainer.innerHTML = '';
    for (let i = 0; i < reward.stars; i++) {
        const star = document.createElement('span');
        star.className = 'star';
        star.textContent = '⭐';
        starsContainer.appendChild(star);
    }
    
    modal.classList.add('active');
    sounds[reward.sound]();
    createConfetti();
    
    // Incrementar logros
    app.achievements += reward.stars;
    updateAchievementsBadge();
}

function closeReward() {
    const modal = document.getElementById('reward-modal');
    modal.classList.remove('active');
    sounds.click();
}

function updateAchievementsBadge() {
    document.getElementById('achievement-count').textContent = app.achievements;
}

// ===== EFECTOS VISUALES =====
function createConfetti() {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.top = '-10px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 3000);
        }, i * 30);
    }
}

function createParticle(x, y, emoji) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.textContent = emoji;
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    document.body.appendChild(particle);
    
    setTimeout(() => particle.remove(), 1000);
}

function createClickEffect(event) {
    const emojis = ['✨', '⭐', '💫', '🌟'];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    createParticle(event.clientX, event.clientY, emoji);
}

// ===== TEST DE DALTONISMO =====
const colorblindTest = {
    currentQuestion: 0,
    questions: [
        {
            image: 'https://centrooftalmologicoperera.com/wp-content/uploads/2020/05/prueba-daltonismo.jpg',
            correctAnswers: {
                normal: '74',
                protanopia: '21',
                deuteranopia: '21',
                tritanopia: '74'
            },
            options: ['74', '21', '71', 'Ninguno']
        },
        {
            image: 'https://www.es.colorlitelens.com/images/tesztek/ishihara/Ishihara_00.jpg',
            correctAnswers: {
                normal: '12',
                protanopia: '12',
                deuteranopia: '12',
                tritanopia: '12'
            },
            options: ['12', '15', '18', 'Ninguno']
        },
        {
            image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRQfRS0xmePsFyxmSssWRjTBZ1jWgyFu4_sZA&s',
            correctAnswers: {
                normal: '26',
                protanopia: '6',
                deuteranopia: '6',
                tritanopia: '26'
            },
            options: ['26', '6', '28', 'Ninguno']
        },
        {
            image: 'https://i.ytimg.com/vi/ZVid-9U-_QQ/mqdefault.jpg',
            correctAnswers: {
                normal: '3',
                protanopia: 'Ninguno',
                deuteranopia: 'Ninguno',
                tritanopia: '3'
            },
            options: ['3', '5', '8', 'Ninguno']
        },
        {
            image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQlv1N7FJds-gueLw5xxLhn37NyqlG8taAIGg&s',
            correctAnswers: {
                normal: '42',
                protanopia: '2',
                deuteranopia: '2',
                tritanopia: '42'
            },
            options: ['42', '2', '4', 'Ninguno']
        },
        {
            image: 'https://statics-cuidateplus.marca.com/cms/images/prueba-daltonismo.jpg',
            correctAnswers: {
                normal: '5',
                protanopia: 'Ninguno',
                deuteranopia: 'Ninguno',
                tritanopia: '5'
            },
            options: ['5', '2', '3', 'Ninguno']
        },
        {
            image: 'https://c8.alamy.com/compes/bnjgft/las-fuerzas-armadas-el-daltonismo-test-de-vision-de-color-pseudo-placa-isochromatic-probando-la-percepcion-del-color-rojo-verde-prueba-daltonicos-bnjgft.jpg',
            correctAnswers: {
                normal: '15',
                protanopia: '15',
                deuteranopia: '15',
                tritanopia: 'Ninguno'
            },
            options: ['15', '17', '13', 'Ninguno']
        }
    ]
};

// ===== FUNCIONES DE NAVEGACIÓN =====
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    app.currentScreen = screenId;
    
    // Scroll al inicio
    window.scrollTo(0, 0);
}

// ===== MASCOTA =====
function showMascotMessage(message, duration = 3000) {
    const mascotMessage = document.getElementById('mascot-message');
    mascotMessage.textContent = message;
    mascotMessage.classList.add('active');
    
    setTimeout(() => {
        mascotMessage.classList.remove('active');
    }, duration);
}

// ===== ACCESIBILIDAD =====
function increaseFontSize() {
    app.fontSize = Math.min(app.fontSize + 0.1, 1.5);
    document.documentElement.style.setProperty('--font-size-multiplier', app.fontSize);
    showMascotMessage('¡Texto más grande!');
}

function decreaseFontSize() {
    app.fontSize = Math.max(app.fontSize - 0.1, 0.8);
    document.documentElement.style.setProperty('--font-size-multiplier', app.fontSize);
    showMascotMessage('¡Texto más pequeño!');
}

function toggleHighContrast() {
    app.highContrast = !app.highContrast;
    document.body.classList.toggle('high-contrast', app.highContrast);
    showMascotMessage(app.highContrast ? '¡Alto contraste activado!' : '¡Alto contraste desactivado!');
}

function resetAccessibility() {
    app.fontSize = 1;
    app.highContrast = false;
    document.documentElement.style.setProperty('--font-size-multiplier', 1);
    document.body.classList.remove('high-contrast');
    showMascotMessage('¡Configuración restablecida!');
}

// ===== APLICAR TEMA DE DALTONISMO =====
function applyColorblindTheme(type) {
    const body = document.body;
    body.classList.remove('normal', 'protanopia', 'deuteranopia', 'tritanopia');
    body.classList.add(type);
    app.colorblindType = type;
    
    const messages = {
        normal: '¡Tema de visión normal aplicado!',
        protanopia: '¡Tema adaptado para protanopía!',
        deuteranopia: '¡Tema adaptado para deuteranopía!',
        tritanopia: '¡Tema adaptado para tritanopía!'
    };
    
    showMascotMessage(messages[type]);
}

// ===== VISTA PREVIA DE COLORES =====
function updateColorPreview(type) {
    const colorThemes = {
        normal: {
            primary: '#4A90E2',
            secondary: '#50C878',
            accent: '#FF6B6B',
            description: 'Colores brillantes y variados - Perfecto para ver todos los detalles'
        },
        protanopia: {
            primary: '#3A7BC8',
            secondary: '#8B8B00',
            accent: '#B8860B',
            description: 'Tonos azules y amarillos - Optimizado para dificultad con el rojo'
        },
        deuteranopia: {
            primary: '#4169E1',
            secondary: '#DAA520',
            accent: '#8B4513',
            description: 'Azules y dorados intensos - Diseñado para dificultad con el verde'
        },
        tritanopia: {
            primary: '#DC143C',
            secondary: '#00CED1',
            accent: '#FF1493',
            description: 'Rojos y cianes vibrantes - Adaptado para dificultad con el azul'
        }
    };
    
    const theme = colorThemes[type];
    if (!theme) return;
    
    document.getElementById('preview-primary').style.backgroundColor = theme.primary;
    document.getElementById('preview-secondary').style.backgroundColor = theme.secondary;
    document.getElementById('preview-accent').style.backgroundColor = theme.accent;
    document.getElementById('preview-description').textContent = theme.description;
    
    // Animación de cambio
    const boxes = document.querySelectorAll('.preview-box');
    boxes.forEach(box => {
        box.style.transform = 'scale(0.8)';
        setTimeout(() => {
            box.style.transform = 'scale(1)';
        }, 100);
    });
}

// ===== TEST DE DALTONISMO =====
function startTest() {
    colorblindTest.currentQuestion = 0;
    app.testResults = { score: 0, answers: [] };
    showScreen('test-screen');
    showMascotMessage('¡Vamos a descubrir cómo ves los colores!', 4000);
    loadTestQuestion();
}

function loadTestQuestion() {
    const question = colorblindTest.questions[colorblindTest.currentQuestion];
    
    document.getElementById('test-image').src = question.image;
    document.getElementById('current-question').textContent = colorblindTest.currentQuestion + 1;
    
    const testOptions = document.querySelector('.test-options');
    testOptions.innerHTML = '';
    
    question.options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'test-option';
        btn.textContent = option;
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-checked', 'false');
        btn.onclick = () => answerTestQuestion(option);
        testOptions.appendChild(btn);
    });
    
    document.querySelector('.test-progress').setAttribute('aria-valuenow', 
        Math.round((colorblindTest.currentQuestion / colorblindTest.questions.length) * 100));
}

function answerTestQuestion(answer) {
    app.testResults.answers.push(answer);
    sounds.click();
    
    colorblindTest.currentQuestion++;
    
    if (colorblindTest.currentQuestion < colorblindTest.questions.length) {
        loadTestQuestion();
        showMascotMessage('¡Bien! Siguiente imagen...');
    } else {
        analyzeTestResults();
    }
}

function analyzeTestResults() {
    const scores = {
        normal: 0,
        protanopia: 0,
        deuteranopia: 0,
        tritanopia: 0
    };
    
    app.testResults.answers.forEach((answer, index) => {
        const question = colorblindTest.questions[index];
        Object.keys(question.correctAnswers).forEach(type => {
            if (question.correctAnswers[type] === answer) {
                scores[type]++;
            }
        });
    });
    
    let maxScore = 0;
    let detectedType = 'normal';
    
    Object.keys(scores).forEach(type => {
        if (scores[type] > maxScore) {
            maxScore = scores[type];
            detectedType = type;
        }
    });
    
    showTestResults(detectedType);
}

function showTestResults(detectedType) {
    showReward('testComplete', '¡Has completado el test de colores! Ahora sabremos cómo adaptar la aplicación para ti.');
    
    setTimeout(() => {
        showScreen('results-screen');
        
        const typeNames = {
            normal: 'Visión Normal de Colores',
            protanopia: 'Protanopía (dificultad con el rojo)',
            deuteranopia: 'Deuteranopía (dificultad con el verde)',
            tritanopia: 'Tritanopía (dificultad con el azul)'
        };
        
        const messages = {
            normal: '¡Excelente! Parece que puedes ver todos los colores sin problema.',
            protanopia: 'Parece que tienes dificultad para ver el color rojo. ¡Pero no te preocupes, juntos aprenderemos a manejarlo!',
            deuteranopia: 'Parece que tienes dificultad para ver el color verde. ¡Es normal y podemos adaptarnos!',
            tritanopia: 'Parece que tienes dificultad para ver el color azul. ¡Vamos a aprender juntos!'
        };
        
        document.getElementById('result-message').textContent = messages[detectedType];
        document.getElementById('detected-type').textContent = typeNames[detectedType];
        
        const radio = document.querySelector(`input[value="${detectedType}"]`);
        if (radio) {
            radio.checked = true;
            updateColorPreview(detectedType);
        }
        
        showMascotMessage('¡Terminamos el test! Ahora elige cómo te sientes más cómodo.', 5000);
    }, 2000);
}

function confirmColorblindType() {
    const selectedType = document.querySelector('input[name="colorblind-type"]:checked');
    
    if (!selectedType) {
        showMascotMessage('¡Selecciona una opción primero!');
        sounds.wrong();
        return;
    }
    
    applyColorblindTheme(selectedType.value);
    sounds.correct();
    showReward('achievement', '¡La aplicación está lista para ti! Ahora todos los juegos se adaptarán a tu forma de ver.');
    
    setTimeout(() => {
        showScreen('main-menu');
        showMascotMessage('¡Perfecto! Ahora la aplicación está adaptada para ti.', 4000);
    }, 2000);
}

// ===== JUEGO: ENCUENTRA EL COLOR DIFERENTE =====
function startColorGame() {
    showScreen('game-colors-screen');
    app.gameState.colorGameScore = 0;
    app.gameState.colorGameLevel = 1;
    updateColorGameUI();
    generateColorGameGrid();
    showMascotMessage('¡Encuentra el cuadro diferente!');
}

function generateColorGameGrid() {
    const grid = document.getElementById('color-game-grid');
    grid.innerHTML = '';
    
    const gridSize = 4 + Math.floor(app.gameState.colorGameLevel / 3);
    const totalBoxes = gridSize * gridSize;
    
    const baseColors = getAdaptedColors();
    const baseColor = baseColors[Math.floor(Math.random() * baseColors.length)];
    const differentIndex = Math.floor(Math.random() * totalBoxes);
    
    grid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    
    // Ajustar dificultad basada en nivel y tipo de daltonismo
    const colorDifference = getColorDifferenceByType(app.gameState.colorGameLevel);
    
    for (let i = 0; i < totalBoxes; i++) {
        const box = document.createElement('div');
        box.className = 'color-box';
        box.setAttribute('role', 'button');
        box.setAttribute('tabindex', '0');
        box.setAttribute('aria-label', i === differentIndex ? 'Cuadro diferente' : 'Cuadro normal');
        
        if (i === differentIndex) {
            box.style.backgroundColor = adjustColor(baseColor, colorDifference);
            box.onclick = () => correctColorAnswer();
            box.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') correctColorAnswer();
            };
        } else {
            box.style.backgroundColor = baseColor;
            box.onclick = () => wrongColorAnswer();
            box.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') wrongColorAnswer();
            };
        }
        
        grid.appendChild(box);
    }
}

function getColorDifferenceByType(level) {
    // Ajustar la diferencia de color según el tipo de daltonismo
    // Para personas con daltonismo, hacemos diferencias más marcadas
    const baseDifference = {
        normal: 30 - (level * 2),
        protanopia: 50 - (level * 2),
        deuteranopia: 50 - (level * 2),
        tritanopia: 50 - (level * 2)
    };
    
    return Math.max(baseDifference[app.colorblindType] || 30, 15);
}

function getAdaptedColors() {
    const colorSets = {
        normal: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'],
        protanopia: ['#3A7BC8', '#8B8B00', '#B8860B', '#4682B4', '#DAA520'],
        deuteranopia: ['#4169E1', '#DAA520', '#8B4513', '#1E90FF', '#CD853F'],
        tritanopia: ['#DC143C', '#00CED1', '#FF1493', '#20B2AA', '#FF69B4']
    };
    
    return colorSets[app.colorblindType] || colorSets.normal;
}

function adjustColor(color, amount) {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

function correctColorAnswer() {
    app.gameState.colorGameScore += 10 * app.gameState.colorGameLevel;
    app.gameState.colorGameLevel++;
    updateColorGameUI();
    sounds.correct();
    showMascotMessage('¡Correcto! ¡Muy bien!');
    
    // Recompensa cada 5 niveles
    if (app.gameState.colorGameLevel % 5 === 0) {
        setTimeout(() => {
            showReward('levelUp', `¡Has alcanzado el nivel ${app.gameState.colorGameLevel}!`);
        }, 500);
    }
    
    setTimeout(() => generateColorGameGrid(), 800);
}

function wrongColorAnswer() {
    sounds.wrong();
    showMascotMessage('¡Intenta de nuevo!');
}

function updateColorGameUI() {
    document.getElementById('game-score').textContent = app.gameState.colorGameScore;
    document.getElementById('game-level').textContent = app.gameState.colorGameLevel;
}

// ===== JUEGO: MEMORIA =====
function startMemoryGame() {
    showScreen('game-memory-screen');
    app.gameState.memoryMoves = 0;
    app.gameState.memoryPairs = 0;
    updateMemoryGameUI();
    generateMemoryGrid();
    showMascotMessage('¡Encuentra las parejas de formas!');
}

let memoryCards = [];
let flippedCards = [];
let lockBoard = false;

function generateMemoryGrid() {
    const grid = document.getElementById('memory-game-grid');
    grid.innerHTML = '';
    
    // Usar formas diferentes según el tipo de daltonismo para mejor diferenciación
    const shapeSets = {
        normal: ['⭐', '❤️', '🔷', '🔶', '🌙', '☀️'],
        protanopia: ['●', '■', '▲', '◆', '★', '✚'],
        deuteranopia: ['⬤', '◼', '▼', '◉', '✦', '✱'],
        tritanopia: ['○', '□', '△', '◇', '☆', '＋']
    };
    
    const shapes = shapeSets[app.colorblindType] || shapeSets.normal;
    const cards = [...shapes, ...shapes];
    
    cards.sort(() => Math.random() - 0.5);
    
    memoryCards = [];
    flippedCards = [];
    
    cards.forEach((shape, index) => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.dataset.shape = shape;
        card.dataset.index = index;
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', 'Carta de memoria');
        
        card.onclick = () => flipCard(card);
        card.onkeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') flipCard(card);
        };
        
        grid.appendChild(card);
        memoryCards.push(card);
    });
}

function flipCard(card) {
    if (lockBoard) return;
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
    if (flippedCards.includes(card)) return;
    
    card.classList.add('flipped');
    card.textContent = card.dataset.shape;
    flippedCards.push(card);
    
    if (flippedCards.length === 2) {
        app.gameState.memoryMoves++;
        updateMemoryGameUI();
        checkMemoryMatch();
    }
}

function checkMemoryMatch() {
    lockBoard = true;
    
    const [card1, card2] = flippedCards;
    
    if (card1.dataset.shape === card2.dataset.shape) {
        card1.classList.add('matched');
        card2.classList.add('matched');
        app.gameState.memoryPairs++;
        updateMemoryGameUI();
        sounds.correct();
        showMascotMessage('¡Pareja encontrada!');
        
        flippedCards = [];
        lockBoard = false;
        
        if (app.gameState.memoryPairs === 6) {
            setTimeout(() => {
                showReward('gameWin', `¡Completaste el juego en ${app.gameState.memoryMoves} movimientos!`);
                showMascotMessage('¡Ganaste! ¡Todas las parejas encontradas!', 5000);
            }, 500);
        }
    } else {
        sounds.wrong();
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            card1.textContent = '';
            card2.textContent = '';
            flippedCards = [];
            lockBoard = false;
        }, 1000);
    }
}

function resetMemoryGame() {
    app.gameState.memoryMoves = 0;
    app.gameState.memoryPairs = 0;
    updateMemoryGameUI();
    generateMemoryGrid();
    showMascotMessage('¡Juego reiniciado!');
}

function updateMemoryGameUI() {
    document.getElementById('memory-moves').textContent = app.gameState.memoryMoves;
    document.getElementById('memory-pairs').textContent = app.gameState.memoryPairs;
}

// ===== JUEGO: DETECTIVE DE PATRONES =====
const patternTypes = ['stripes', 'dots', 'numbers', 'shapes', 'zigzag', 'grid'];

function startPatternGame() {
    showScreen('game-patterns-screen');
    app.gameState.patternScore = 0;
    app.gameState.patternLevel = 1;
    updatePatternGameUI();
    generatePatternGrid();
    showMascotMessage('¡Encuentra el patrón diferente!');
}

function generatePatternGrid() {
    const grid = document.getElementById('pattern-game-grid');
    grid.innerHTML = '';
    
    const level = app.gameState.patternLevel;
    const gridSize = Math.min(3 + Math.floor(level / 3), 5);
    const totalBoxes = Math.min(9 + level, 16);
    
    // Adaptar tipos de patrones según el daltonismo
    let availablePatterns = [...patternTypes];
    
    // Para niveles altos, usar patrones más complejos
    if (level > 5) {
        availablePatterns = ['stripes', 'dots', 'zigzag', 'grid', 'numbers', 'shapes'];
    } else if (level > 10) {
        availablePatterns = patternTypes; // Todos los patrones
    }
    
    const patternType = availablePatterns[Math.floor(Math.random() * availablePatterns.length)];
    document.getElementById('pattern-type').textContent = getPatternTypeName(patternType);
    
    grid.style.gridTemplateColumns = `repeat(${Math.ceil(Math.sqrt(totalBoxes))}, 1fr)`;
    
    const differentIndex = Math.floor(Math.random() * totalBoxes);
    
    for (let i = 0; i < totalBoxes; i++) {
        const box = document.createElement('div');
        box.className = 'pattern-box';
        box.setAttribute('role', 'button');
        box.setAttribute('tabindex', '0');
        
        const isDifferent = i === differentIndex;
        const pattern = createPattern(patternType, isDifferent, level);
        box.appendChild(pattern);
        
        if (isDifferent) {
            box.setAttribute('aria-label', 'Patrón diferente');
            box.onclick = () => correctPatternAnswer(box);
            box.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') correctPatternAnswer(box);
            };
        } else {
            box.setAttribute('aria-label', 'Patrón normal');
            box.onclick = () => wrongPatternAnswer(box);
            box.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') wrongPatternAnswer(box);
            };
        }
        
        grid.appendChild(box);
    }
}

function getPatternTypeName(type) {
    const names = {
        stripes: 'Rayas',
        dots: 'Puntos',
        numbers: 'Números',
        shapes: 'Formas',
        zigzag: 'Zigzag',
        grid: 'Cuadrícula'
    };
    return names[type] || type;
}

function createPattern(type, isDifferent, level) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'pattern-content');
    svg.setAttribute('viewBox', '0 0 100 100');
    
    const colors = getPatternColors();
    
    switch(type) {
        case 'stripes':
            createStripesPattern(svg, colors, isDifferent, level);
            break;
        case 'dots':
            createDotsPattern(svg, colors, isDifferent, level);
            break;
        case 'numbers':
            createNumbersPattern(svg, colors, isDifferent, level);
            break;
        case 'shapes':
            createShapesPattern(svg, colors, isDifferent, level);
            break;
        case 'zigzag':
            createZigzagPattern(svg, colors, isDifferent, level);
            break;
        case 'grid':
            createGridPattern(svg, colors, isDifferent, level);
            break;
    }
    
    return svg;
}

function getPatternColors() {
    const colorSets = {
        normal: {
            primary: '#4A90E2',
            secondary: '#50C878',
            accent: '#FF6B6B',
            background: '#F0F0F0'
        },
        protanopia: {
            primary: '#3A7BC8',
            secondary: '#8B8B00',
            accent: '#B8860B',
            background: '#F0F0F0'
        },
        deuteranopia: {
            primary: '#4169E1',
            secondary: '#DAA520',
            accent: '#8B4513',
            background: '#F0F0F0'
        },
        tritanopia: {
            primary: '#DC143C',
            secondary: '#00CED1',
            accent: '#FF1493',
            background: '#F0F0F0'
        }
    };
    
    return colorSets[app.colorblindType] || colorSets.normal;
}

function createStripesPattern(svg, colors, isDifferent, level) {
    const stripeWidth = isDifferent ? 15 : 10;
    const color = isDifferent ? colors.accent : colors.primary;
    
    for (let x = 0; x < 100; x += stripeWidth * 2) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', 0);
        rect.setAttribute('width', stripeWidth);
        rect.setAttribute('height', 100);
        rect.setAttribute('fill', color);
        svg.appendChild(rect);
    }
}

function createDotsPattern(svg, colors, isDifferent, level) {
    const dotSize = isDifferent ? 8 : 5;
    const spacing = isDifferent ? 20 : 15;
    const color = isDifferent ? colors.accent : colors.secondary;
    
    for (let y = spacing / 2; y < 100; y += spacing) {
        for (let x = spacing / 2; x < 100; x += spacing) {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', dotSize);
            circle.setAttribute('fill', color);
            svg.appendChild(circle);
        }
    }
}

function createNumbersPattern(svg, colors, isDifferent, level) {
    const number = isDifferent ? (level + 1) % 10 : level % 10;
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', 50);
    text.setAttribute('y', 60);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', isDifferent ? '50' : '40');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('fill', isDifferent ? colors.accent : colors.primary);
    text.textContent = number;
    svg.appendChild(text);
}

function createShapesPattern(svg, colors, isDifferent, level) {
    const color = isDifferent ? colors.accent : colors.secondary;
    
    if (isDifferent) {
        // Triángulo
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', '50,20 80,70 20,70');
        polygon.setAttribute('fill', color);
        svg.appendChild(polygon);
    } else {
        // Círculo
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', 50);
        circle.setAttribute('cy', 50);
        circle.setAttribute('r', 30);
        circle.setAttribute('fill', color);
        svg.appendChild(circle);
    }
}

function createZigzagPattern(svg, colors, isDifferent, level) {
    const amplitude = isDifferent ? 20 : 10;
    const color = isDifferent ? colors.accent : colors.primary;
    
    let pathData = 'M 0 50';
    for (let x = 0; x < 100; x += 10) {
        const y = 50 + (x % 20 === 0 ? amplitude : -amplitude);
        pathData += ` L ${x} ${y}`;
    }
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', isDifferent ? '4' : '3');
    path.setAttribute('fill', 'none');
    svg.appendChild(path);
}

function createGridPattern(svg, colors, isDifferent, level) {
    const gridSize = isDifferent ? 20 : 25;
    const color = isDifferent ? colors.accent : colors.secondary;
    
    for (let i = 0; i < 100; i += gridSize) {
        // Líneas verticales
        const vline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        vline.setAttribute('x1', i);
        vline.setAttribute('y1', 0);
        vline.setAttribute('x2', i);
        vline.setAttribute('y2', 100);
        vline.setAttribute('stroke', color);
        vline.setAttribute('stroke-width', 2);
        svg.appendChild(vline);
        
        // Líneas horizontales
        const hline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        hline.setAttribute('x1', 0);
        hline.setAttribute('y1', i);
        hline.setAttribute('x2', 100);
        hline.setAttribute('y2', i);
        hline.setAttribute('stroke', color);
        hline.setAttribute('stroke-width', 2);
        svg.appendChild(hline);
    }
}

function correctPatternAnswer(box) {
    box.classList.add('correct');
    app.gameState.patternScore += 10 * app.gameState.patternLevel;
    app.gameState.patternLevel++;
    updatePatternGameUI();
    sounds.correct();
    showMascotMessage('¡Excelente! ¡Encontraste el patrón diferente!');
    
    // Recompensa cada 3 niveles
    if (app.gameState.patternLevel % 3 === 0) {
        setTimeout(() => {
            showReward('levelUp', `¡Nivel ${app.gameState.patternLevel} alcanzado! Eres un Detective de Patrones.`);
        }, 500);
    }
    
    setTimeout(() => {
        generatePatternGrid();
    }, 1200);
}

function wrongPatternAnswer(box) {
    box.classList.add('wrong');
    sounds.wrong();
    showMascotMessage('¡Intenta de nuevo! Ese no es el diferente.');
    
    setTimeout(() => {
        box.classList.remove('wrong');
    }, 500);
}

function updatePatternGameUI() {
    document.getElementById('pattern-level').textContent = app.gameState.patternLevel;
    document.getElementById('pattern-score').textContent = app.gameState.patternScore;
}

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', () => {
    // Accesibilidad
    document.getElementById('btn-increase-font').onclick = increaseFontSize;
    document.getElementById('btn-decrease-font').onclick = decreaseFontSize;
    document.getElementById('btn-high-contrast').onclick = toggleHighContrast;
    document.getElementById('btn-reset-settings').onclick = resetAccessibility;
    
    // Control de sonido
    document.getElementById('sound-indicator').onclick = toggleSound;
    
    // Modal de recompensa
    document.getElementById('btn-close-reward').onclick = closeReward;
    
    // Contador de logros
    document.getElementById('achievements-badge').onclick = () => {
        showMascotMessage(`¡Has ganado ${app.achievements} estrellas! Sigue así, eres increíble.`, 4000);
        sounds.achievement();
    };
    
    // Navegación principal
    document.getElementById('btn-start-test').onclick = startTest;
    document.getElementById('btn-parent-info').onclick = () => {
        showScreen('parent-info-screen');
        showMascotMessage('Información importante para los padres');
    };
    document.getElementById('btn-back-welcome').onclick = () => showScreen('welcome-screen');
    
    // Test
    document.getElementById('btn-confirm-type').onclick = confirmColorblindType;
    
    // Menú principal
    document.getElementById('btn-game-colors').onclick = startColorGame;
    document.getElementById('btn-game-memory').onclick = startMemoryGame;
    document.getElementById('btn-game-patterns').onclick = startPatternGame;
    document.getElementById('btn-learn').onclick = () => {
        showScreen('learn-screen');
        showMascotMessage('¡Aprende sobre el daltonismo!');
    };
    document.getElementById('btn-change-type').onclick = () => {
        showScreen('results-screen');
        showMascotMessage('Puedes cambiar tu configuración aquí');
    };
    
    // Botones de volver
    document.getElementById('btn-back-menu-1').onclick = () => showScreen('main-menu');
    document.getElementById('btn-back-menu-2').onclick = () => showScreen('main-menu');
    document.getElementById('btn-back-menu-3').onclick = () => showScreen('main-menu');
    document.getElementById('btn-back-menu-4').onclick = () => showScreen('main-menu');
    
    // Juegos
    document.getElementById('btn-reset-memory').onclick = resetMemoryGame;
    
    // Selector de tipo de daltonismo con vista previa
    document.querySelectorAll('input[name="colorblind-type"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            updateColorPreview(e.target.value);
            sounds.click();
            showMascotMessage('¡Mira cómo se verá la aplicación con esta opción!');
        });
    });
    
    // Efectos de clic en botones
    document.querySelectorAll('button, .menu-card').forEach(btn => {
        btn.addEventListener('click', (e) => {
            sounds.click();
            createClickEffect(e);
        });
    });
    
    // Mascota interactiva
    document.getElementById('mascot').onclick = () => {
        const messages = [
            '¡Hola! ¿En qué puedo ayudarte?',
            '¡Estás haciendo un gran trabajo!',
            '¿Sabías que el daltonismo es más común de lo que crees?',
            '¡Sigue explorando y aprendiendo!',
            '¡Eres increíble tal como eres!',
            '¡Me encanta jugar contigo!',
            '¿Quieres intentar un juego diferente?',
            '¡Cada día aprendes más!'
        ];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        showMascotMessage(randomMessage, 3000);
        sounds.click();
    };
    
    // Mensaje de bienvenida
    setTimeout(() => {
        showMascotMessage('¡Hola! Soy Colorín y te voy a ayudar en esta aventura.', 4000);
        sounds.achievement();
    }, 1000);
});

// ===== TECLADO ACCESIBLE =====
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (app.currentScreen !== 'welcome-screen' && app.currentScreen !== 'main-menu') {
            showScreen('main-menu');
        }
    }
});