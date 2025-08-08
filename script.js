const pitchIndicator = document.getElementById('pitch-indicator');
const rollIndicator = document.getElementById('roll-indicator');
const pitchDisplay = document.getElementById('pitch');
const rollDisplay = document.getElementById('roll');
const settingsBtn = document.getElementById('settings-btn');
const settingsMenu = document.getElementById('settings-menu');
const zeroBtn = document.getElementById('zero-btn');
const closeSettings = document.getElementById('close-settings');

// Load stored offsets
let pitchOffset = Number(localStorage.getItem('pitchOffset')) || 0;
let rollOffset = Number(localStorage.getItem('rollOffset')) || 0;

// Smoothing variables
let lastPitch = 0;
let lastRoll = 0;
const smoothingFactor = 0.1; // Adjust for smoother transitions

// Add permission button
const permissionBtn = document.createElement('button');
permissionBtn.id = 'permission-btn';
permissionBtn.textContent = 'Enable Inclinometer';
document.getElementById('inclinometer').appendChild(permissionBtn);

function updateGauge(event) {
    // Pitch: beta (x-axis), Roll: alpha (z-axis)
    let pitch = event.beta !== null ? event.beta : 0;
    let roll = event.alpha !== null ? event.alpha : 0;

    // Log for debugging
    console.log('Raw - Beta (pitch):', event.beta, 'Alpha (roll):', event.alpha, 'Gamma:', event.gamma);

    // Apply offsets
    pitch -= pitchOffset;
    roll = ((roll - rollOffset) % 360 + 360) % 360; // Normalize to 0-360°
    if (roll > 180) roll -= 360; // Convert to ±180°

    // Limit pitch to ±90°
    pitch = Math.max(-90, Math.min(90, pitch));

    // Apply smoothing
    pitch = lastPitch + smoothingFactor * (pitch - lastPitch);
    roll = lastRoll + smoothingFactor * (roll - lastRoll);
    lastPitch = pitch;
    lastRoll = roll;

    // Update display
    pitchDisplay.textContent = pitch.toFixed(1);
    rollDisplay.textContent = roll.toFixed(1);

    // Rotate indicators
    pitchIndicator.style.transform = `rotate(${pitch}deg)`;
    rollIndicator.style.transform = `rotate(${roll}deg)`;
}

// Zero the pitch and roll
function zeroGauge() {
    const event = window.lastOrientation || { beta: 0, alpha: 0 };
    pitchOffset = event.beta || 0;
    rollOffset = event.alpha || 0;
    localStorage.setItem('pitchOffset', pitchOffset);
    localStorage.setItem('rollOffset', rollOffset);
    updateGauge(event);
}

// Request orientation permission
function requestOrientationPermission() {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === 'granted') {
                    console.log('Device orientation permission granted');
                    window.addEventListener('deviceorientation', (event) => {
                        window.lastOrientation = event;
                        updateGauge(event);
                    });
                    permissionBtn.style.display = 'none';
                } else {
                    alert('Permission denied. Inclinometer will not function.');
                }
            })
            .catch(error => {
                console.error('Permission error:', error);
                alert('Failed to request orientation permission.');
            });
    } else {
        console.log('No permission required, starting orientation listener');
        window.addEventListener('deviceorientation', (event) => {
            window.lastOrientation = event;
            updateGauge(event);
        });
        permissionBtn.style.display = 'none';
    }
}

// Event listeners
settingsBtn.addEventListener('click', () => {
    settingsMenu.classList.remove('hidden');
});

closeSettings.addEventListener('click', () => {
    settingsMenu.classList.add('hidden');
});

zeroBtn.addEventListener('click', zeroGauge);
permissionBtn.addEventListener('click', requestOrientationPermission);

// Check if permission is already granted
if (typeof DeviceOrientationEvent.requestPermission !== 'function') {
    console.log('Directly starting orientation listener');
    window.addEventListener('deviceorientation', (event) => {
        window.lastOrientation = event;
        updateGauge(event);
        permissionBtn.style.display = 'none';
    });
}