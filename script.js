// Load stored offsets or initialize to zero
let pitchOffset = Number(localStorage.getItem('pitchOffset')) || 0;
let rollOffset = Number(localStorage.getItem('rollOffset')) || 0;

const bubble = document.getElementById('bubble');
const pitchDisplay = document.getElementById('pitch');
const rollDisplay = document.getElementById('roll');
const settingsBtn = document.getElementById('settings-btn');
const settingsMenu = document.getElementById('settings-menu');
const zeroBtn = document.getElementById('zero-btn');
const closeSettings = document.getElementById('close-settings');

function updateGauge(event) {
    // Get raw pitch (beta) and roll (gamma) from DeviceOrientationEvent
    let pitch = event.beta || 0; // Rotation around X-axis (degrees)
    let roll = event.gamma || 0; // Rotation around Y-axis (degrees)

    // Apply offsets
    pitch -= pitchOffset;
    roll -= rollOffset;

    // Limit pitch and roll to ±90° for practical use
    pitch = Math.max(-90, Math.min(90, pitch));
    roll = Math.max(-90, Math.min(90, roll));

    // Update display
    pitchDisplay.textContent = pitch.toFixed(1);
    rollDisplay.textContent = roll.toFixed(1);

    // Calculate bubble position (map ±90° to gauge dimensions)
    const gauge = document.getElementById('gauge');
    const gaugeSize = gauge.offsetWidth;
    const maxBubbleOffset = (gaugeSize - 20) / 2; // 20 is bubble size
    const x = (roll / 90) * maxBubbleOffset;
    const y = (pitch / 90) * maxBubbleOffset;

    // Update bubble position
    bubble.style.transform = `translate(${x}px, ${y}px)`;
}

// Zero the pitch and roll
function zeroGauge() {
    const event = window.lastOrientation || { beta: 0, gamma: 0 };
    pitchOffset = event.beta || 0;
    rollOffset = event.gamma || 0;
    localStorage.setItem('pitchOffset', pitchOffset);
    localStorage.setItem('rollOffset', rollOffset);
    updateGauge(event);
}

// Handle device orientation events
window.addEventListener('deviceorientation', (event) => {
    window.lastOrientation = event; // Store for zeroing
    updateGauge(event);
});

// Settings menu toggle
settingsBtn.addEventListener('click', () => {
    settingsMenu.classList.remove('hidden');
});

closeSettings.addEventListener('click', () => {
    settingsMenu.classList.add('hidden');
});

zeroBtn.addEventListener('click', zeroGauge);

// Request permission for DeviceOrientationEvent on iOS
if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission()
        .then(permissionState => {
            if (permissionState === 'granted') {
                console.log('Device orientation permission granted');
            } else {
                alert('Permission denied for device orientation. Inclinometer will not function.');
            }
        })
        .catch(console.error);
}
