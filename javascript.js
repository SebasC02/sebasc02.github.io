// ===== CONFIGURACIÓN GLOBAL =====
const app = {
    currentScreen: 'welcome-screen',
    colorblindType: 'normal',
    fontSize: 1,
    highContrast: false,
    soundEnabled: true,
    achievements: 0,
    navigationHistory: [],
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
    },
    // Sistema de navegación por flechas
    arrowNavigation: {
        enabled: true,
        currentIndex: 0,
        navigableElements: [],
        currentScreen: null
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
        indicator.setAttribute('aria-label', 'Desactivar sonido. Sonido actualmente encendido');
        indicator.setAttribute('aria-pressed', 'true');
        sounds.click();
    } else {
        indicator.textContent = '🔇 Sonido: OFF';
        indicator.classList.add('muted');
        indicator.setAttribute('aria-label', 'Activar sonido. Sonido actualmente apagado');
        indicator.setAttribute('aria-pressed', 'false');
    }
}

// ===== SISTEMA DE NAVEGACIÓN POR FLECHAS =====

// Inicializar navegación por flechas para la pantalla actual
function initArrowNavigation() {
    const currentScreen = document.querySelector('.screen.active');
    if (!currentScreen) return;
    
    // Obtener todos los elementos navegables en orden visual (de arriba hacia abajo)
    const navigableElements = getNavigableElements(currentScreen);
    
    app.arrowNavigation.navigableElements = navigableElements;
    app.arrowNavigation.currentIndex = 0;
    app.arrowNavigation.currentScreen = currentScreen.id;
    
    // Aplicar clase de navegación a todos los elementos
    navigableElements.forEach((el, index) => {
        el.classList.add('arrow-navigable');
        el.setAttribute('data-nav-index', index);
    });
    
    // Seleccionar el primer elemento
    if (navigableElements.length > 0) {
        selectElement(0);
    }
}

// Obtener elementos navegables en orden lógico - COMPLETO para screen readers
function getNavigableElements(container) {
    const elements = [];
    
    // Definir jerarquía lógica de navegación por tipo de elemento
    const navigationHierarchy = [
        // 1. ENCABEZADOS - Primero para contexto
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        
        // 2. CONTENIDO INFORMATIVO - Textos y descripciones
        'p', '.welcome-content', '.info-text', '.description',
        
        // 3. IMÁGENES Y MEDIOS - Con descripciones
        'img', 'svg', 'figure', '.mascot-body',
        
        // 4. INSTRUCCIONES Y AYUDA - Información importante
        '.keyboard-help', '.game-instructions', '.help-text',
        
        // 5. BOTONES PRINCIPALES DE ACCIÓN
        'button.btn-primary',
        
        // 6. BOTONES SECUNDARIOS
        'button.btn-secondary',
        
        // 7. BOTONES DE NAVEGACIÓN
        '.nav-button', '.menu-card',
        
        // 8. ELEMENTOS INTERACTIVOS DE JUEGOS
        '.color-box', '.memory-card:not(.matched)', '.pattern-box',
        
        // 9. OPCIONES DE TEST/SELECCIÓN
        '.test-option', '.option-card', '.selector-option',
        
        // 10. CONTROLES DE JUEGO
        '.game-controls button', '#btn-restart-game', '#btn-next-level',
        
        // 11. OTROS BOTONES INTERACTIVOS
        'button:not([disabled]):not([tabindex="-1"])',
        
        // 12. ENLACES
        'a[href]:not([tabindex="-1"])',
        
        // 13. CAMPOS DE FORMULARIO
        'input:not([disabled]):not([tabindex="-1"])',
        'select:not([disabled]):not([tabindex="-1"])',
        'textarea:not([disabled]):not([tabindex="-1"])',
        
        // 14. ELEMENTOS CON ROLE
        '[role="button"]:not([disabled]):not([tabindex="-1"])',
        '[role="link"]:not([tabindex="-1"])',
        
        // 15. ELEMENTOS ADICIONALES CON INFORMACIÓN
        '.score-display', '.game-info', '.stats',
        
        // 16. ELEMENTOS CON ARIA-LABEL (información adicional)
        '[aria-label]:not(button):not(a):not(input)'
    ];
    
    // Recorrer la jerarquía y recopilar elementos en orden
    navigationHierarchy.forEach(selector => {
        try {
            const found = container.querySelectorAll(selector);
            found.forEach(el => {
                // Evitar duplicados y elementos ocultos
                if (!elements.includes(el) && isVisible(el)) {
                    // Hacer el elemento enfocable si no lo es
                    if (!el.hasAttribute('tabindex')) {
                        el.setAttribute('tabindex', '0');
                    }
                    
                    // Asegurar que tenga aria-label descriptivo
                    ensureAccessibleLabel(el);
                    
                    elements.push(el);
                }
            });
        } catch (e) {
            // Si el selector no es válido, continuar
            console.warn('Selector no válido:', selector);
        }
    });
    
    return elements;
}

// Asegurar que cada elemento tenga una etiqueta accesible
function ensureAccessibleLabel(element) {
    // Si ya tiene aria-label o aria-labelledby, no hacer nada
    if (element.hasAttribute('aria-label') || element.hasAttribute('aria-labelledby')) {
        return;
    }
    
    // Obtener texto visible del elemento
    let labelText = '';
    
    // Para encabezados, usar su texto
    if (element.tagName.match(/^H[1-6]$/)) {
        labelText = `Encabezado nivel ${element.tagName[1]}: ${element.textContent.trim()}`;
    }
    // Para párrafos
    else if (element.tagName === 'P') {
        const text = element.textContent.trim();
        labelText = text.length > 100 ? `Párrafo: ${text.substring(0, 100)}...` : `Párrafo: ${text}`;
    }
    // Para imágenes
    else if (element.tagName === 'IMG') {
        labelText = element.alt || 'Imagen sin descripción';
    }
    // Para SVG
    else if (element.tagName === 'SVG' || element.tagName === 'svg') {
        labelText = element.getAttribute('aria-label') || 'Gráfico o icono';
    }
    // Para divs con clases específicas
    else if (element.classList.contains('welcome-content')) {
        labelText = 'Contenido de bienvenida';
    }
    else if (element.classList.contains('keyboard-help')) {
        labelText = 'Ayuda de navegación por teclado: ' + element.textContent.trim();
    }
    else if (element.classList.contains('game-instructions')) {
        labelText = 'Instrucciones del juego: ' + element.textContent.trim();
    }
    else if (element.classList.contains('score-display')) {
        labelText = 'Puntuación: ' + element.textContent.trim();
    }
    // Para botones sin label
    else if (element.tagName === 'BUTTON' && !element.hasAttribute('aria-label')) {
        const text = element.textContent.trim();
        labelText = text || 'Botón sin etiqueta';
    }
    // Para elementos con texto general
    else if (element.textContent && element.textContent.trim()) {
        const text = element.textContent.trim();
        labelText = text.length > 50 ? text.substring(0, 50) + '...' : text;
    }
    
    // Aplicar el aria-label si se generó uno
    if (labelText) {
        element.setAttribute('aria-label', labelText);
    }
    
    // Marcar el rol si no está definido
    if (!element.hasAttribute('role') && element.tagName !== 'BUTTON' && element.tagName !== 'A') {
        if (element.tagName.match(/^H[1-6]$/)) {
            element.setAttribute('role', 'heading');
            element.setAttribute('aria-level', element.tagName[1]);
        } else if (element.tagName === 'P' || element.classList.contains('description')) {
            element.setAttribute('role', 'region');
        }
    }
}


// Verificar si un elemento es visible
function isVisible(element) {
    return element.offsetWidth > 0 && 
           element.offsetHeight > 0 && 
           window.getComputedStyle(element).visibility !== 'hidden' &&
           window.getComputedStyle(element).display !== 'none';
}

// Seleccionar un elemento específico
function selectElement(index) {
    const elements = app.arrowNavigation.navigableElements;
    
    if (index < 0 || index >= elements.length) return;
    
    // Remover selección anterior
    elements.forEach(el => {
        el.classList.remove('arrow-selected');
        el.setAttribute('aria-selected', 'false');
    });
    
    // Seleccionar nuevo elemento
    const selectedElement = elements[index];
    selectedElement.classList.add('arrow-selected');
    selectedElement.setAttribute('aria-selected', 'true');
    
    app.arrowNavigation.currentIndex = index;
    
    // Scroll suave al elemento si está fuera de vista
    selectedElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
    });
    
    // Anunciar el elemento seleccionado
    announceSelection(selectedElement);
    
    // Sonido de navegación
    if (app.soundEnabled) {
        playTone(300, 0.05);
    }
}

// Anunciar el elemento seleccionado para accesibilidad - MEJORADO para screen readers
function announceSelection(element) {
    // Construir anuncio detallado según el tipo de elemento
    let announcement = '';
    const tagName = element.tagName.toLowerCase();
    const role = element.getAttribute('role');
    const ariaLabel = element.getAttribute('aria-label');
    const textContent = element.textContent.trim();
    
    // Determinar el tipo de elemento y contexto
    let elementType = '';
    let elementInfo = '';
    
    // ENCABEZADOS
    if (tagName.match(/^h[1-6]$/)) {
        const level = tagName[1];
        elementType = `Encabezado de nivel ${level}`;
        elementInfo = textContent || ariaLabel;
    }
    // PÁRRAFOS Y TEXTOS
    else if (tagName === 'p' || element.classList.contains('description')) {
        elementType = 'Párrafo de texto';
        elementInfo = textContent.length > 150 ? textContent.substring(0, 150) + '...' : textContent;
    }
    // BOTONES
    else if (tagName === 'button' || role === 'button') {
        if (element.classList.contains('btn-primary')) {
            elementType = 'Botón principal';
        } else if (element.classList.contains('btn-secondary')) {
            elementType = 'Botón secundario';
        } else if (element.classList.contains('color-box')) {
            elementType = 'Cuadro de color interactivo';
        } else if (element.classList.contains('memory-card')) {
            elementType = 'Tarjeta de memoria';
        } else if (element.classList.contains('pattern-box')) {
            elementType = 'Casilla de patrón';
        } else if (element.classList.contains('test-option')) {
            elementType = 'Opción de respuesta';
        } else if (element.classList.contains('menu-card')) {
            elementType = 'Tarjeta de menú';
        } else {
            elementType = 'Botón';
        }
        elementInfo = ariaLabel || textContent;
    }
    // ENLACES
    else if (tagName === 'a') {
        elementType = 'Enlace';
        elementInfo = ariaLabel || textContent;
        const href = element.getAttribute('href');
        if (href) {
            elementInfo += `. Destino: ${href}`;
        }
    }
    // CAMPOS DE FORMULARIO
    else if (tagName === 'input') {
        const type = element.getAttribute('type') || 'text';
        elementType = `Campo de entrada de tipo ${type}`;
        elementInfo = ariaLabel || element.getAttribute('placeholder') || 'Sin etiqueta';
    }
    // IMÁGENES
    else if (tagName === 'img') {
        elementType = 'Imagen';
        elementInfo = element.alt || 'Sin descripción de imagen';
    }
    // SVG / GRÁFICOS
    else if (tagName === 'svg') {
        elementType = 'Gráfico o icono';
        elementInfo = ariaLabel || 'Elemento visual';
    }
    // ELEMENTOS ESPECIALES
    else if (element.classList.contains('keyboard-help')) {
        elementType = 'Información de ayuda';
        elementInfo = textContent;
    }
    else if (element.classList.contains('game-instructions')) {
        elementType = 'Instrucciones del juego';
        elementInfo = textContent;
    }
    else if (element.classList.contains('score-display') || element.classList.contains('game-info')) {
        elementType = 'Información del juego';
        elementInfo = textContent;
    }
    // ELEMENTOS GENÉRICOS
    else {
        elementType = role ? `Elemento con rol de ${role}` : 'Elemento interactivo';
        elementInfo = ariaLabel || textContent || 'Sin descripción';
    }
    
    // Agregar información de posición
    const currentIndex = app.arrowNavigation.currentIndex + 1;
    const totalElements = app.arrowNavigation.navigableElements.length;
    const positionInfo = `Elemento ${currentIndex} de ${totalElements}`;
    
    // Construir anuncio completo
    announcement = `${positionInfo}. ${elementType}: ${elementInfo}`;
    
    // Agregar instrucciones contextuales
    let instructions = '';
    if (tagName === 'button' || role === 'button') {
        instructions = 'Presiona Enter o Espacio para activar';
    } else if (tagName === 'a') {
        instructions = 'Presiona Enter para seguir el enlace';
    } else if (tagName === 'input') {
        instructions = 'Presiona Enter para editar';
    }
    
    if (instructions) {
        announcement += `. ${instructions}`;
    }
    
    // Crear o actualizar el live region para anuncios
    let announcer = document.getElementById('arrow-nav-announcer');
    if (!announcer) {
        announcer = document.createElement('div');
        announcer.id = 'arrow-nav-announcer';
        announcer.className = 'sr-only';
        announcer.setAttribute('role', 'status');
        announcer.setAttribute('aria-live', 'assertive');
        announcer.setAttribute('aria-atomic', 'true');
        document.body.appendChild(announcer);
    }
    
    // Limpiar y luego actualizar para forzar el anuncio
    announcer.textContent = '';
    setTimeout(() => {
        announcer.textContent = announcement;
    }, 50);
    
    // También hacer focus en el elemento para asegurar que el screen reader lo detecte
    element.focus();
}


// Navegar hacia arriba
function navigateUp() {
    const newIndex = app.arrowNavigation.currentIndex - 1;
    if (newIndex >= 0) {
        selectElement(newIndex);
    } else {
        // Circular: ir al último elemento
        selectElement(app.arrowNavigation.navigableElements.length - 1);
    }
}

// Navegar hacia abajo
function navigateDown() {
    const newIndex = app.arrowNavigation.currentIndex + 1;
    if (newIndex < app.arrowNavigation.navigableElements.length) {
        selectElement(newIndex);
    } else {
        // Circular: volver al primer elemento
        selectElement(0);
    }
}

// Navegar hacia la izquierda (para grids)
function navigateLeft() {
    const elements = app.arrowNavigation.navigableElements;
    const currentElement = elements[app.arrowNavigation.currentIndex];
    const currentRect = currentElement.getBoundingClientRect();
    
    // Buscar el elemento más cercano a la izquierda en la misma fila
    let closestIndex = -1;
    let closestDistance = Infinity;
    
    elements.forEach((el, index) => {
        if (index === app.arrowNavigation.currentIndex) return;
        
        const rect = el.getBoundingClientRect();
        
        // Si está en la misma fila aproximadamente y a la izquierda
        if (Math.abs(rect.top - currentRect.top) < 10 && rect.left < currentRect.left) {
            const distance = currentRect.left - rect.left;
            if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = index;
            }
        }
    });
    
    if (closestIndex !== -1) {
        selectElement(closestIndex);
    } else {
        // Si no hay elemento a la izquierda, navegar al elemento anterior
        navigateUp();
    }
}

// Navegar hacia la derecha (para grids)
function navigateRight() {
    const elements = app.arrowNavigation.navigableElements;
    const currentElement = elements[app.arrowNavigation.currentIndex];
    const currentRect = currentElement.getBoundingClientRect();
    
    // Buscar el elemento más cercano a la derecha en la misma fila
    let closestIndex = -1;
    let closestDistance = Infinity;
    
    elements.forEach((el, index) => {
        if (index === app.arrowNavigation.currentIndex) return;
        
        const rect = el.getBoundingClientRect();
        
        // Si está en la misma fila aproximadamente y a la derecha
        if (Math.abs(rect.top - currentRect.top) < 10 && rect.left > currentRect.left) {
            const distance = rect.left - currentRect.left;
            if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = index;
            }
        }
    });
    
    if (closestIndex !== -1) {
        selectElement(closestIndex);
    } else {
        // Si no hay elemento a la derecha, navegar al siguiente elemento
        navigateDown();
    }
}

// Activar el elemento seleccionado
function activateSelectedElement() {
    const elements = app.arrowNavigation.navigableElements;
    const selectedElement = elements[app.arrowNavigation.currentIndex];
    
    if (!selectedElement) return;
    
    // Simular clic en el elemento
    selectedElement.click();
    
    // Si es un input, darle foco real
    if (selectedElement.tagName === 'INPUT') {
        selectedElement.focus();
    }
}

// Event listener global para flechas
function handleArrowKeys(e) {
    // No interceptar si estamos en un input de texto
    if (e.target.tagName === 'INPUT' && e.target.type === 'text') return;
    
    // No interceptar si el modal de recompensa está activo
    const rewardModal = document.getElementById('reward-modal');
    if (rewardModal && rewardModal.classList.contains('active')) return;
    
    switch(e.key) {
        case 'ArrowUp':
            e.preventDefault();
            navigateUp();
            break;
        case 'ArrowDown':
            e.preventDefault();
            navigateDown();
            break;
        case 'ArrowLeft':
            e.preventDefault();
            navigateLeft();
            break;
        case 'ArrowRight':
            e.preventDefault();
            navigateRight();
            break;
        case 'Enter':
        case ' ':
            // Solo activar si hay un elemento seleccionado con flechas
            if (app.arrowNavigation.navigableElements.length > 0) {
                const selectedElement = app.arrowNavigation.navigableElements[app.arrowNavigation.currentIndex];
                if (selectedElement && selectedElement.classList.contains('arrow-selected')) {
                    e.preventDefault();
                    activateSelectedElement();
                }
            }
            break;
    }
}

// Reiniciar navegación cuando cambia la pantalla
function resetArrowNavigation() {
    // Limpiar selecciones anteriores
    app.arrowNavigation.navigableElements.forEach(el => {
        el.classList.remove('arrow-selected', 'arrow-navigable');
        el.removeAttribute('data-nav-index');
        el.setAttribute('aria-selected', 'false');
    });
    
    // Reinicializar
    setTimeout(() => {
        initArrowNavigation();
    }, 100);
}

// ===== SISTEMA DE RECOMPENSAS =====
let previousFocusElement = null; // Guardar el elemento que tenía el foco antes del modal

function showReward(type, message) {
    const modal = document.getElementById('reward-modal');
    const icon = document.getElementById('reward-icon');
    const title = document.getElementById('reward-title');
    const messageEl = document.getElementById('reward-message');
    const starsContainer = document.getElementById('reward-stars');
    const closeButton = document.getElementById('btn-close-reward');
    
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
        star.setAttribute('aria-hidden', 'true');
        starsContainer.appendChild(star);
    }
    
    // Guardar el elemento que actualmente tiene el foco
    previousFocusElement = document.activeElement;
    
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    sounds[reward.sound]();
    createConfetti();
    
    // Incrementar logros
    app.achievements += reward.stars;
    updateAchievementsBadge();
    
    // Establecer focus en el botón y activar focus trap
    setTimeout(() => {
        closeButton.focus();
        activateFocusTrap(modal);
    }, 100);
}

function activateFocusTrap(modal) {
    // Obtener todos los elementos enfocables dentro del modal
    const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    
    // Función para manejar el evento de teclado
    function handleFocusTrap(e) {
        // Si presiona Tab
        if (e.key === 'Tab') {
            // Si presiona Shift + Tab y está en el primer elemento
            if (e.shiftKey && document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable.focus();
            }
            // Si presiona Tab y está en el último elemento
            else if (!e.shiftKey && document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable.focus();
            }
        }
        
        // Si presiona Escape, cerrar el modal
        if (e.key === 'Escape') {
            e.preventDefault();
            closeReward();
        }
    }
    
    // Función para prevenir que el foco salga del modal
    function handleFocusOut(e) {
        // Si el elemento enfocado no está dentro del modal, devolver el foco
        if (!modal.contains(e.target)) {
            e.preventDefault();
            firstFocusable.focus();
        }
    }
    
    // Agregar los eventos
    modal.addEventListener('keydown', handleFocusTrap);
    document.addEventListener('focus', handleFocusOut, true);
    
    // Guardar las referencias para poder removerlas después
    modal._focusTrapHandler = handleFocusTrap;
    modal._focusOutHandler = handleFocusOut;
}

function closeReward() {
    const modal = document.getElementById('reward-modal');
    
    // Remover el focus trap
    if (modal._focusTrapHandler) {
        modal.removeEventListener('keydown', modal._focusTrapHandler);
        modal._focusTrapHandler = null;
    }
    
    // Remover el evento de focus out
    if (modal._focusOutHandler) {
        document.removeEventListener('focus', modal._focusOutHandler, true);
        modal._focusOutHandler = null;
    }
    
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    sounds.click();
    
    // Restaurar el foco al elemento que lo tenía antes
    if (previousFocusElement && previousFocusElement.focus) {
        setTimeout(() => {
            previousFocusElement.focus();
            previousFocusElement = null;
        }, 100);
    }
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
            confetti.setAttribute('aria-hidden', 'true');
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
    particle.setAttribute('aria-hidden', 'true');
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

// ===== NAVEGACIÓN Y HISTORIA =====
function showScreen(screenId) {
    const previousScreen = app.currentScreen;
    
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    const newScreen = document.getElementById(screenId);
    newScreen.classList.add('active');
    
    // Guardar en historial si es una pantalla diferente
    if (previousScreen !== screenId) {
        app.navigationHistory.push(previousScreen);
    }
    
    app.currentScreen = screenId;
    
    // Actualizar botón de regresar
    updateBackButton();
    
    // Actualizar selectores rápidos
    
    // MEJORA DE ACCESIBILIDAD: Mejorar todos los elementos de la pantalla
    enhanceScreenAccessibility(screenId);
    updateQuickSelectors();
    
    // Scroll al inicio y focus en contenido principal
    window.scrollTo(0, 0);
    
    // Dar focus al título de la pantalla para lectores de pantalla
    setTimeout(() => {
        const mainHeading = newScreen.querySelector('h1');
            
            // Anunciar el cambio de pantalla
            const screenTitle = mainHeading.textContent.trim();
            announceScreenChange(screenId, screenTitle);
        if (mainHeading) {
            mainHeading.setAttribute('tabindex', '-1');
            mainHeading.focus();
        }
    }, 100);
    
    // Reiniciar navegación por flechas para la nueva pantalla
    resetArrowNavigation();
}

function goBack() {
    if (app.navigationHistory.length > 0) {
        const previousScreen = app.navigationHistory.pop();
        
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        document.getElementById(previousScreen).classList.add('active');
        app.currentScreen = previousScreen;
        
        updateBackButton();
        sounds.click();
        showMascotMessage('Regresando...');
        
        window.scrollTo(0, 0);
    } else {
        // Si no hay historial, ir a welcome
        showScreen('welcome-screen');
    }
}

function updateBackButton() {
    const backButton = document.getElementById('btn-back-nav');
    
    // Mostrar botón de regresar en todas las pantallas excepto welcome
    if (app.currentScreen === 'welcome-screen') {
        backButton.style.display = 'none';
    } else {
        backButton.style.display = 'block';
    }
}

// ===== SELECTORES RÁPIDOS DE DALTONISMO =====
function updateQuickSelectors() {
    document.querySelectorAll('.quick-selector-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
    });
    
    const activeBtn = document.querySelector(`.quick-selector-btn[data-type="${app.colorblindType}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.setAttribute('aria-pressed', 'true');
    }
}

function setupQuickSelectors() {
    document.querySelectorAll('.quick-selector-btn').forEach(btn => {
        btn.onclick = () => {
            const type = btn.dataset.type;
            applyColorblindTheme(type);
            updateQuickSelectors();
            sounds.click();
        };
        
        btn.onkeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                btn.click();
            }
        };
    });
}


// ===== TEST DE DALTONISMO =====
const colorblindTest = {
    currentQuestion: 0,
    questions: [
        {
            image: 'https://centrooftalmologicoperera.com/wp-content/uploads/2020/05/prueba-daltonismo.jpg',
            alt: 'Prueba de daltonismo número 1: Círculos de colores de diferentes tamaños y tonalidades formando el número setenta y cuatro en color verde sobre un fondo compuesto por círculos rojos y tomate. Las personas con visión normal ven claramente el 74, mientras que las personas con protanopía o deuteranopía pueden ver el número 21.',
            description: 'Imagen con círculos de colores formando números. Visión normal ve 74. Protanopía y deuteranopía ven 21.',
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
            alt: 'Prueba de daltonismo número 2: Círculos de colores formando el número doce en color tomate sobre un fondo de círculos verdes de diferentes tonalidades. Este número es visible para todos los tipos de visión de color, incluyendo visión normal, protanopía, deuteranopía y tritanopía.',
            description: 'Imagen con círculos formando el número 12. Visible para todos los tipos de daltonismo.',
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
            alt: 'Prueba de daltonismo número 3: Círculos de diversos tamaños y colores formando el número veintiséis en tonos rosados sobre un fondo de círculos grises y negros. Las personas con visión normal ven 26, mientras que las personas con protanopía o deuteranopía pueden ver solo el número 6.',
            description: 'Imagen con círculos formando números. Visión normal ve 26. Protanopía y deuteranopía ven 6.',
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
            alt: 'Prueba de daltonismo número 4: Círculos de colores formando el número tres en color verde sobre un fondo de círculos rojos y rosados de diferentes intensidades. Las personas con visión normal y tritanopía ven claramente el 3, mientras que las personas con protanopía o deuteranopía no pueden distinguir ningún número.',
            description: 'Imagen con círculos formando el número 3. Visión normal y tritanopía lo ven. Protanopía y deuteranopía no ven ningún número.',
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
            alt: 'Prueba de daltonismo número 5: Círculos de colores formando el número cuarenta y dos en rojo intenso sobre un fondo de círculos de rojo menos intenso y tonos rosados. Las personas con visión normal ven 42, mientras que las personas con protanopía o deuteranopía pueden ver solo el número 2.',
            description: 'Imagen con círculos formando números. Visión normal ve 42. Protanopía y deuteranopía ven 2.',
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
            alt: 'Prueba de daltonismo número 6: Círculos de colores formando el número cinco en tonos rojos y rosados sobre un fondo de círculos verdes oscuros y claros de diferentes tamaños. Las personas con visión normal y tritanopía ven el 5, mientras que las personas con protanopía o deuteranopía no pueden distinguir ningún número.',
            description: 'Imagen con círculos formando el número 5. Visión normal y tritanopía lo ven. Protanopía y deuteranopía no ven ningún número.',
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
            alt: 'Prueba de daltonismo número 7: Círculos de colores en una combinación de azul, celeste, verde claro y verde oscuro formando el número quince sobre un fondo de círculos rojos y naranjas. Las personas con visión normal, protanopía y deuteranopía ven el 15, mientras que las personas con tritanopía no pueden distinguir ningún número.',
            description: 'Imagen con círculos formando el número 15. Visión normal, protanopía y deuteranopía lo ven. Tritanopía no ve ningún número.',
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

// ===== MASCOTA =====
function showMascotMessage(message, duration = 3000) {
    const mascotMessage = document.getElementById('mascot-message');
    mascotMessage.textContent = message;
    mascotMessage.classList.add('active');
    
    // Anunciar a lectores de pantalla
    mascotMessage.setAttribute('aria-live', 'polite');
    
    setTimeout(() => {
        mascotMessage.classList.remove('active');
    }, duration);
}

// ===== ACCESIBILIDAD =====
function increaseFontSize() {
    app.fontSize = Math.min(app.fontSize + 0.1, 1.5);
    document.documentElement.style.setProperty('--font-size-multiplier', app.fontSize);
    showMascotMessage('¡Texto más grande!');
    sounds.click();
}

function decreaseFontSize() {
    app.fontSize = Math.max(app.fontSize - 0.1, 0.8);
    document.documentElement.style.setProperty('--font-size-multiplier', app.fontSize);
    showMascotMessage('¡Texto más pequeño!');
    sounds.click();
}

function toggleHighContrast() {
    app.highContrast = !app.highContrast;
    document.body.classList.toggle('high-contrast', app.highContrast);
    showMascotMessage(app.highContrast ? '¡Alto contraste activado!' : '¡Alto contraste desactivado!');
    sounds.click();
}

function resetAccessibility() {
    app.fontSize = 1;
    app.highContrast = false;
    document.documentElement.style.setProperty('--font-size-multiplier', 1);
    document.body.classList.remove('high-contrast');
    showMascotMessage('¡Configuración restablecida!');
    sounds.click();
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
    
    // Detectar qué pantalla de juego está activa y reiniciar
    const colorGameScreen = document.getElementById('game-colors-screen');
    const memoryGameScreen = document.getElementById('game-memory-screen');
    const patternGameScreen = document.getElementById('game-patterns-screen');
    
    // Si el juego "Encuentra el Color" está activo, regenerar el grid
    if (colorGameScreen && colorGameScreen.classList.contains('active')) {
        generateColorGameGrid();
        showMascotMessage(messages[type] + ' El juego se ha actualizado.', 3000);
    }
    
    // Si el juego de Memoria está activo, reiniciar con nuevos colores
    if (memoryGameScreen && memoryGameScreen.classList.contains('active')) {
        const wasPlaying = memoryCards.length > 0;
        if (wasPlaying) {
            resetMemoryGame();
            showMascotMessage(messages[type] + ' El juego se ha reiniciado con nuevos colores.', 3000);
        }
    }
    
    // Si el juego "Detective de Patrones" está activo, regenerar el grid
    if (patternGameScreen && patternGameScreen.classList.contains('active')) {
        generatePatternGrid();
        showMascotMessage(messages[type] + ' Los patrones se han actualizado.', 3000);
    }
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

// ===== FUNCIONES DEL TEST =====
function startTest() {
    colorblindTest.currentQuestion = 0;
    app.testResults = { score: 0, answers: [] };
    showScreen('test-screen');
    showMascotMessage('¡Vamos a descubrir cómo ves los colores!', 4000);
    loadTestQuestion();
}

function loadTestQuestion() {
    const question = colorblindTest.questions[colorblindTest.currentQuestion];
    
    const testImage = document.getElementById('test-image');
    testImage.src = question.image;
    testImage.alt = question.alt;
    
    document.getElementById('current-question').textContent = colorblindTest.currentQuestion + 1;
    
    // Anunciar la pregunta a lectores de pantalla
    announceToScreenReader(`Pregunta ${colorblindTest.currentQuestion + 1} de 7. ${question.description}`);
    
    const testOptions = document.querySelector('.test-options');
    testOptions.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.className = 'test-option';
        btn.textContent = option;
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-checked', 'false');
        btn.setAttribute('aria-label', `Opción: ${option}`);
        btn.onclick = () => answerTestQuestion(option, btn);
        btn.onkeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                answerTestQuestion(option, btn);
            }
        };
        testOptions.appendChild(btn);
    });
    
    // Auto-focus en la primera opción para facilitar navegación por teclado
    setTimeout(() => {
        const firstOption = testOptions.querySelector('.test-option');
        if (firstOption) firstOption.focus();
    }, 100);
    
    document.querySelector('.test-progress').setAttribute('aria-valuenow', 
        Math.round((colorblindTest.currentQuestion / colorblindTest.questions.length) * 100));
}

function answerTestQuestion(answer, button) {
    // Marcar respuesta seleccionada
    document.querySelectorAll('.test-option').forEach(btn => {
        btn.classList.remove('selected');
        btn.setAttribute('aria-checked', 'false');
    });
    
    button.classList.add('selected');
    button.setAttribute('aria-checked', 'true');
    
    app.testResults.answers.push(answer);
    sounds.click();
    
    setTimeout(() => {
        colorblindTest.currentQuestion++;
        
        if (colorblindTest.currentQuestion < colorblindTest.questions.length) {
            loadTestQuestion();
            showMascotMessage('¡Bien! Siguiente imagen...');
        } else {
            analyzeTestResults();
        }
    }, 500);
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
    updateQuickSelectors();
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
    
    // Agregar animación de actualización
    grid.classList.add('game-updating');
    setTimeout(() => grid.classList.remove('game-updating'), 600);
    
    grid.innerHTML = '';
    
    const gridSize = 4 + Math.floor(app.gameState.colorGameLevel / 3);
    const totalBoxes = gridSize * gridSize;
    
    const baseColors = getAdaptedColors();
    const baseColor = baseColors[Math.floor(Math.random() * baseColors.length)];
    const differentIndex = Math.floor(Math.random() * totalBoxes);
    
    grid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    
    const colorDifference = getColorDifferenceByType(app.gameState.colorGameLevel);
    
    for (let i = 0; i < totalBoxes; i++) {
        const box = document.createElement('button');
        box.className = 'color-box';
        box.setAttribute('role', 'button');
        box.setAttribute('tabindex', '0');
        
        if (i === differentIndex) {
            box.style.backgroundColor = adjustColor(baseColor, colorDifference);
            box.setAttribute('aria-label', 'Cuadro de color diferente');
            box.onclick = () => correctColorAnswer();
            box.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    correctColorAnswer();
                }
            };
        } else {
            box.style.backgroundColor = baseColor;
            box.setAttribute('aria-label', 'Cuadro de color normal');
            box.onclick = () => wrongColorAnswer();
            box.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    wrongColorAnswer();
                }
            };
        }
        
        grid.appendChild(box);
    }
    
    // Auto-focus en el primer cuadro para facilitar navegación
    setTimeout(() => {
        const firstBox = grid.querySelector('.color-box');
        if (firstBox) firstBox.focus();
    }, 100);
    
    // MEJORA DE ACCESIBILIDAD: Mejorar elementos del juego
    enhanceGameElementsAccessibility(grid);
}

function getColorDifferenceByType(level) {
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
let memoryCards = [];
let flippedCards = [];
let lockBoard = false;

function startMemoryGame() {
    showScreen('game-memory-screen');
    app.gameState.memoryMoves = 0;
    app.gameState.memoryPairs = 0;
    updateMemoryGameUI();
    generateMemoryGrid();
    showMascotMessage('¡Encuentra las parejas de formas!');
}

function generateMemoryGrid() {
    const grid = document.getElementById('memory-game-grid');
    
    // Agregar animación de actualización
    grid.classList.add('game-updating');
    setTimeout(() => grid.classList.remove('game-updating'), 600);
    
    grid.innerHTML = '';
    
    // Definir formas geométricas en blanco y negro (usando SVG)
    const shapes = [
        { name: 'circle', path: 'M 50 20 A 30 30 0 1 1 50 80 A 30 30 0 1 1 50 20' },
        { name: 'square', path: 'M 25 25 L 75 25 L 75 75 L 25 75 Z' },
        { name: 'triangle', path: 'M 50 20 L 80 75 L 20 75 Z' },
        { name: 'star', path: 'M 50 15 L 58 40 L 85 40 L 63 57 L 71 82 L 50 65 L 29 82 L 37 57 L 15 40 L 42 40 Z' },
        { name: 'heart', path: 'M 50 75 C 50 75 20 55 20 40 C 20 30 25 25 30 25 C 38 25 45 30 50 40 C 55 30 62 25 70 25 C 75 25 80 30 80 40 C 80 55 50 75 50 75 Z' },
        { name: 'diamond', path: 'M 50 20 L 75 50 L 50 80 L 25 50 Z' }
    ];
    
    // Obtener paleta de colores según el tipo de daltonismo
    const colorPalettes = getMemoryColorPalette();
    
    // Crear pares de tarjetas (cada combinación de forma + color se repite)
    const cards = [];
    for (let i = 0; i < 6; i++) {
        const cardData = {
            shape: shapes[i],
            color: colorPalettes[i].bg,
            colorName: colorPalettes[i].name,
            id: i
        };
        cards.push({...cardData});
        cards.push({...cardData});
    }
    
    // Mezclar las tarjetas
    cards.sort(() => Math.random() - 0.5);
    
    memoryCards = [];
    flippedCards = [];
    
    cards.forEach((cardData, index) => {
        const card = document.createElement('button');
        card.className = 'memory-card';
        card.dataset.shapeName = cardData.shape.name;
        card.dataset.shapePath = cardData.shape.path;
        card.dataset.color = cardData.color;
        card.dataset.colorName = cardData.colorName;
        card.dataset.id = cardData.id;
        card.dataset.index = index;
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', 'Carta de memoria volteada');
        
        card.onclick = () => flipCard(card);
        card.onkeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                flipCard(card);
            }
        };
        
        grid.appendChild(card);
        memoryCards.push(card);
    });
    
    // Auto-focus en la primera carta
    setTimeout(() => {
        const firstCard = grid.querySelector('.memory-card');
        if (firstCard) firstCard.focus();
    }, 100);
}

// Función para obtener paleta de colores según tipo de daltonismo
function getMemoryColorPalette() {
    const palettes = {
        normal: [
            { bg: '#FF6B6B', name: 'Rojo' },
            { bg: '#4ECDC4', name: 'Turquesa' },
            { bg: '#FFD93D', name: 'Amarillo' },
            { bg: '#A8E6CF', name: 'Verde' },
            { bg: '#FF8B94', name: 'Rosa' },
            { bg: '#C7CEEA', name: 'Lavanda' }
        ],
        protanopia: [
            { bg: '#3A7BC8', name: 'Azul' },
            { bg: '#FFD700', name: 'Dorado' },
            { bg: '#00CED1', name: 'Turquesa' },
            { bg: '#8B8B00', name: 'Oliva' },
            { bg: '#4169E1', name: 'Azul Real' },
            { bg: '#DDA0DD', name: 'Ciruela' }
        ],
        deuteranopia: [
            { bg: '#4169E1', name: 'Azul Real' },
            { bg: '#DAA520', name: 'Dorado' },
            { bg: '#00CED1', name: 'Cian' },
            { bg: '#8B4513', name: 'Marrón' },
            { bg: '#9370DB', name: 'Púrpura' },
            { bg: '#FFD700', name: 'Amarillo' }
        ],
        tritanopia: [
            { bg: '#DC143C', name: 'Carmesí' },
            { bg: '#00CED1', name: 'Turquesa' },
            { bg: '#FF1493', name: 'Fucsia' },
            { bg: '#32CD32', name: 'Lima' },
            { bg: '#FF6347', name: 'Coral' },
            { bg: '#40E0D0', name: 'Aguamarina' }
        ]
    };
    
    return palettes[app.colorblindType] || palettes.normal;
}

function flipCard(card) {
    if (lockBoard) return;
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
    if (flippedCards.includes(card)) return;
    
    card.classList.add('flipped');
    
    // Aplicar color de fondo
    card.style.backgroundColor = card.dataset.color;
    
    // Crear contenido de la tarjeta: SVG + texto
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('class', 'memory-shape-svg');
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', card.dataset.shapePath);
    path.setAttribute('fill', 'black');
    path.setAttribute('stroke', 'white');
    path.setAttribute('stroke-width', '2');
    
    svg.appendChild(path);
    
    const colorLabel = document.createElement('div');
    colorLabel.className = 'memory-color-label';
    colorLabel.textContent = card.dataset.colorName;
    
    card.innerHTML = '';
    card.appendChild(svg);
    card.appendChild(colorLabel);
    
    card.setAttribute('aria-label', `Carta ${card.dataset.shapeName} ${card.dataset.colorName}`);
    flippedCards.push(card);
    sounds.click();
    
    if (flippedCards.length === 2) {
        app.gameState.memoryMoves++;
        updateMemoryGameUI();
        checkMemoryMatch();
    }
}

function checkMemoryMatch() {
    lockBoard = true;
    
    const [card1, card2] = flippedCards;
    
    if (card1.dataset.id === card2.dataset.id) {
        card1.classList.add('matched');
        card2.classList.add('matched');
        card1.setAttribute('aria-label', `Pareja encontrada: ${card1.dataset.shapeName} ${card1.dataset.colorName}`);
        card2.setAttribute('aria-label', `Pareja encontrada: ${card2.dataset.shapeName} ${card2.dataset.colorName}`);
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
            card1.style.backgroundColor = '';
            card2.style.backgroundColor = '';
            card1.innerHTML = '';
            card2.innerHTML = '';
            card1.setAttribute('aria-label', 'Carta de memoria volteada');
            card2.setAttribute('aria-label', 'Carta de memoria volteada');
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
    sounds.click();
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
    
    // Agregar animación de actualización
    grid.classList.add('game-updating');
    setTimeout(() => grid.classList.remove('game-updating'), 600);
    
    grid.innerHTML = '';
    
    const level = app.gameState.patternLevel;
    const gridSize = Math.min(3 + Math.floor(level / 3), 5);
    const totalBoxes = Math.min(9 + level, 16);
    
    let availablePatterns = [...patternTypes];
    
    if (level > 5) {
        availablePatterns = ['stripes', 'dots', 'zigzag', 'grid', 'numbers', 'shapes'];
    } else if (level > 10) {
        availablePatterns = patternTypes;
    }
    
    const patternType = availablePatterns[Math.floor(Math.random() * availablePatterns.length)];
    document.getElementById('pattern-type').textContent = getPatternTypeName(patternType);
    
    grid.style.gridTemplateColumns = `repeat(${Math.ceil(Math.sqrt(totalBoxes))}, 1fr)`;
    
    const differentIndex = Math.floor(Math.random() * totalBoxes);
    
    for (let i = 0; i < totalBoxes; i++) {
        const box = document.createElement('button');
        box.className = 'pattern-box';
        box.setAttribute('role', 'button');
        box.setAttribute('tabindex', '0');
        
        const isDifferent = i === differentIndex;
        const pattern = createPattern(patternType, isDifferent, level);
        box.appendChild(pattern);
        
        if (isDifferent) {
            box.setAttribute('aria-label', `Patrón diferente de tipo ${getPatternTypeName(patternType)}`);
            box.onclick = () => correctPatternAnswer(box);
            box.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    correctPatternAnswer(box);
                }
            };
        } else {
            box.setAttribute('aria-label', `Patrón normal de tipo ${getPatternTypeName(patternType)}`);
            box.onclick = () => wrongPatternAnswer(box);
            box.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    wrongPatternAnswer(box);
                }
            };
        }
        
        grid.appendChild(box);
    }
    
    // Auto-focus en el primer patrón
    setTimeout(() => {
        const firstBox = grid.querySelector('.pattern-box');
        if (firstBox) firstBox.focus();
    }, 100);
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
    svg.setAttribute('aria-hidden', 'true');
    
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
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', '50,20 80,70 20,70');
        polygon.setAttribute('fill', color);
        svg.appendChild(polygon);
    } else {
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
        const vline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        vline.setAttribute('x1', i);
        vline.setAttribute('y1', 0);
        vline.setAttribute('x2', i);
        vline.setAttribute('y2', 100);
        vline.setAttribute('stroke', color);
        vline.setAttribute('stroke-width', 2);
        svg.appendChild(vline);
        
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
    // Botón de navegación/regresar
    document.getElementById('btn-back-nav').onclick = goBack;
    
    // Accesibilidad
    document.getElementById('btn-increase-font').onclick = increaseFontSize;
    document.getElementById('btn-decrease-font').onclick = decreaseFontSize;
    document.getElementById('btn-high-contrast').onclick = toggleHighContrast;
    document.getElementById('btn-reset-settings').onclick = resetAccessibility;
    
    // Control de sonido
    document.getElementById('sound-indicator').onclick = toggleSound;
    
    // Modal de recompensa
    document.getElementById('btn-close-reward').onclick = closeReward;
    
    // Prevenir que el modal se cierre al hacer clic en el fondo
    const rewardModal = document.getElementById('reward-modal');
    rewardModal.addEventListener('click', (e) => {
        // Solo cerrar si se hace clic directamente en el modal (fondo), no en el contenido
        if (e.target === rewardModal) {
            e.preventDefault();
            // Opcionalmente, enfocar el botón como recordatorio visual
            const closeButton = document.getElementById('btn-close-reward');
            if (closeButton) {
                closeButton.focus();
                // Pequeño efecto de "shake" para indicar que deben usar el botón
                closeButton.style.animation = 'none';
                setTimeout(() => {
                    closeButton.style.animation = 'shakeButton 0.5s ease';
                }, 10);
            }
        }
    });
    
    // Contador de logros
    document.getElementById('achievements-badge').onclick = () => {
        showMascotMessage(`¡Has ganado ${app.achievements} estrellas! Sigue así, eres increíble.`, 4000);
        sounds.achievement();
    };
    
    // Navegación principal - Welcome screen
    document.getElementById('btn-start-test').onclick = () => {
        showScreen('test-options-screen');
        showMascotMessage('Elige cómo quieres continuar');
    };
    
    document.getElementById('btn-user-manual').onclick = () => {
        showScreen('user-manual-screen');
        showMascotMessage('Aquí está el manual de usuario');
    };
    
    document.getElementById('btn-parent-info').onclick = () => {
        showScreen('parent-info-screen');
        showMascotMessage('Información importante para los padres');
    };
    
    document.getElementById('btn-back-welcome').onclick = () => {
        showScreen('welcome-screen');
    };
    
    document.getElementById('btn-back-from-manual').onclick = () => {
        showScreen('welcome-screen');
    };
    
    // Opciones de test
    document.getElementById('btn-take-test').onclick = () => {
        startTest();
    };
    
    document.getElementById('btn-skip-test').onclick = () => {
        showScreen('results-screen');
        showMascotMessage('Selecciona el tipo de daltonismo que tienes', 5000);
        // Pre-seleccionar visión normal
        const normalRadio = document.querySelector('input[value="normal"]');
        if (normalRadio) {
            normalRadio.checked = true;
            updateColorPreview('normal');
        }
    };
    
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
    document.getElementById('btn-manual-menu').onclick = () => {
        showScreen('user-manual-screen');
        showMascotMessage('Aquí está el manual de usuario');
    };
    document.getElementById('btn-change-type').onclick = () => {
        showScreen('results-screen');
        showMascotMessage('Puedes cambiar tu configuración aquí');
    };
    
    // Botones de volver al menú
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
    
    // Selectores rápidos de daltonismo
    setupQuickSelectors();
    
    // Efectos de clic en botones
    document.querySelectorAll('button, .menu-card').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (!btn.classList.contains('color-box') && 
                !btn.classList.contains('memory-card') && 
                !btn.classList.contains('pattern-box')) {
                createClickEffect(e);
            }
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
    
    // Inicializar botón de navegación
    updateBackButton();
    
    // Mensaje de bienvenida
    setTimeout(() => {
        showMascotMessage('¡Hola! Soy Colorín y te voy a ayudar en esta aventura.', 4000);
        sounds.achievement();
    }, 1000);
});

// ===== NAVEGACIÓN POR TECLADO MEJORADA =====
document.addEventListener('keydown', (e) => {
    // ESC para volver al menú principal o pantalla anterior
    if (e.key === 'Escape') {
        if (document.getElementById('reward-modal').classList.contains('active')) {
            closeReward();
        } else if (app.currentScreen !== 'welcome-screen' && app.currentScreen !== 'main-menu') {
            goBack();
        }
    }
    
    // Navegación con flechas en grids de juegos
    if (e.key.startsWith('Arrow')) {
        const activeElement = document.activeElement;
        
        if (activeElement && (
            activeElement.classList.contains('color-box') ||
            activeElement.classList.contains('memory-card') ||
            activeElement.classList.contains('pattern-box') ||
            activeElement.classList.contains('test-option')
        )) {
            e.preventDefault();
            navigateGrid(activeElement, e.key);
        }
    }
});

function navigateGrid(currentElement, key) {
    const parent = currentElement.parentElement;
    const items = Array.from(parent.children);
    const currentIndex = items.indexOf(currentElement);
    
    const computedStyle = window.getComputedStyle(parent);
    const gridCols = computedStyle.gridTemplateColumns.split(' ').length;
    
    let nextIndex = currentIndex;
    
    switch(key) {
        case 'ArrowLeft':
            nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
            break;
        case 'ArrowRight':
            nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
            break;
        case 'ArrowUp':
            nextIndex = currentIndex - gridCols;
            if (nextIndex < 0) nextIndex = items.length + nextIndex;
            break;
        case 'ArrowDown':
            nextIndex = currentIndex + gridCols;
            if (nextIndex >= items.length) nextIndex = nextIndex - items.length;
            break;
    }
    
    if (items[nextIndex]) {
        items[nextIndex].focus();
    }
}

// ===== MANEJO DE FOCUS PARA MODALES =====
// Cuando se abre el modal de recompensa, mantener el focus dentro
document.getElementById('reward-modal').addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        const modal = document.getElementById('reward-modal');
        if (modal.classList.contains('active')) {
            e.preventDefault();
            document.getElementById('btn-close-reward').focus();
        }
    }
});

// ===== INICIALIZAR NAVEGACIÓN POR FLECHAS =====
// Event listener global para navegación con flechas
document.addEventListener('keydown', handleArrowKeys);

// Inicializar navegación por flechas al cargar la página
setTimeout(() => {
    initArrowNavigation();
}, 200);

// Reinicializar navegación cuando se generan nuevos elementos en juegos
// Esto se hace automáticamente cuando cambian las pantallas, pero también
// necesitamos hacerlo cuando se regeneran grids de juegos
const originalGenerateColorGameGrid = generateColorGameGrid;
generateColorGameGrid = function() {
    originalGenerateColorGameGrid.call(this);
    setTimeout(resetArrowNavigation, 100);
};

const originalGenerateMemoryGrid = generateMemoryGrid;
generateMemoryGrid = function() {
    originalGenerateMemoryGrid.call(this);
    setTimeout(resetArrowNavigation, 100);
};

const originalGeneratePatternGrid = generatePatternGrid;
generatePatternGrid = function() {
    originalGeneratePatternGrid.call(this);
    setTimeout(resetArrowNavigation, 100);
};

// ===== ANNOUNCER PARA LECTORES DE PANTALLA =====
function announceToScreenReader(message) {
    const announcer = document.createElement('div');
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.position = 'absolute';
    announcer.style.left = '-10000px';
    announcer.style.width = '1px';
    announcer.style.height = '1px';
    announcer.style.overflow = 'hidden';
    announcer.textContent = message;
    
    document.body.appendChild(announcer);
    
    setTimeout(() => {
        document.body.removeChild(announcer);
    }, 1000);
}

console.log('Aplicación de Daltonismo cargada correctamente - Versión accesible');
console.log('Navegación por teclado: TAB, FLECHAS ↑↓←→, ENTER, ESC');
console.log('Compatible con lectores de pantalla');
console.log('Navegación por flechas: ACTIVA');
// ===== FUNCIONES ADICIONALES PARA ACCESIBILIDAD COMPLETA =====

// Marcar todos los elementos de una pantalla como navegables y accesibles
function enhanceScreenAccessibility(screenId) {
    const screen = document.getElementById(screenId);
    if (!screen) return;
    
    // Asegurar que todos los textos importantes sean navegables
    const textElements = screen.querySelectorAll('p, span.important-text, .description, .info-text');
    textElements.forEach((el, index) => {
        if (isVisible(el) && el.textContent.trim()) {
            if (!el.hasAttribute('tabindex')) {
                el.setAttribute('tabindex', '0');
            }
            if (!el.hasAttribute('role')) {
                el.setAttribute('role', 'region');
            }
            if (!el.hasAttribute('aria-label')) {
                el.setAttribute('aria-label', `Texto informativo: ${el.textContent.trim().substring(0, 100)}`);
            }
        }
    });
    
    // Asegurar que las imágenes sean accesibles
    const images = screen.querySelectorAll('img, svg, .mascot-body, .shape');
    images.forEach((el, index) => {
        if (isVisible(el)) {
            if (!el.hasAttribute('tabindex') && !el.closest('[aria-hidden="true"]')) {
                el.setAttribute('tabindex', '0');
            }
            if (!el.hasAttribute('aria-label') && el.tagName.toLowerCase() === 'img') {
                el.setAttribute('aria-label', el.alt || `Imagen decorativa ${index + 1}`);
            }
        }
    });
    
    // Marcar secciones con encabezados claros
    const sections = screen.querySelectorAll('section, .game-container, .test-container');
    sections.forEach((section, index) => {
        if (isVisible(section)) {
            if (!section.hasAttribute('role')) {
                section.setAttribute('role', 'region');
            }
            const heading = section.querySelector('h1, h2, h3, h4, h5, h6');
            if (heading && !section.hasAttribute('aria-labelledby')) {
                if (!heading.id) {
                    heading.id = `section-heading-${index}`;
                }
                section.setAttribute('aria-labelledby', heading.id);
            }
        }
    });
}

// Anunciar cambios de pantalla para screen readers
function announceScreenChange(screenId, screenTitle) {
    let announcer = document.getElementById('screen-change-announcer');
    if (!announcer) {
        announcer = document.createElement('div');
        announcer.id = 'screen-change-announcer';
        announcer.className = 'sr-only';
        announcer.setAttribute('role', 'status');
        announcer.setAttribute('aria-live', 'assertive');
        announcer.setAttribute('aria-atomic', 'true');
        document.body.appendChild(announcer);
    }
    
    announcer.textContent = '';
    setTimeout(() => {
        announcer.textContent = `Navegando a: ${screenTitle}. Use las flechas del teclado para navegar entre elementos. Presione Tab o flechas para navegar.`;
    }, 100);
}

// Mejorar la accesibilidad de elementos de juego cuando se crean dinámicamente
function enhanceGameElementsAccessibility(container) {
    // Para color-box
    const colorBoxes = container.querySelectorAll('.color-box');
    colorBoxes.forEach((box, index) => {
        if (!box.hasAttribute('aria-label')) {
            box.setAttribute('aria-label', `Cuadro de color ${index + 1}. Presione Enter o Espacio si cree que es diferente.`);
        }
        box.setAttribute('role', 'button');
        box.setAttribute('aria-describedby', 'game-instructions');
    });
    
    // Para memory-card
    const memoryCards = container.querySelectorAll('.memory-card');
    memoryCards.forEach((card, index) => {
        if (!card.hasAttribute('aria-label')) {
            const color = card.dataset.color || 'desconocido';
            const shape = card.dataset.shape || 'desconocida';
            card.setAttribute('aria-label', `Tarjeta ${index + 1}: Color ${color}, Forma ${shape}. Presione Enter para voltear.`);
        }
        card.setAttribute('role', 'button');
        card.setAttribute('aria-describedby', 'memory-game-instructions');
    });
    
    // Para pattern-box
    const patternBoxes = container.querySelectorAll('.pattern-box');
    patternBoxes.forEach((box, index) => {
        if (!box.hasAttribute('aria-label')) {
            box.setAttribute('aria-label', `Casilla de patrón ${index + 1}. Presione Enter para seleccionar.`);
        }
        box.setAttribute('role', 'button');
    });
}