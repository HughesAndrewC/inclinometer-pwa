const pitchLine = document.getElementById('pitch-line');
const rollLine = document.getElementById('roll-line');
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
const smoothingFactor = 0.05; // Stronger smoothing to reduce jumps

// Add permission button
const permissionBtn = document.createElement('button');
permissionBtn.id = 'permission-btn';
permissionBtn.textContent = 'Enable Inclinometer';
document.getElementById('inclinometer').appendChild(permissionBtn);

// Generate degree markings dynamically
function generateDegreeMarks() {
    const pitchMarks = document.querySelector('#pitch-gauge .degree-marks');
    const rollMarks = document.querySelector('#roll-gauge .degree-marks');
    for (let i = 0; i < 36; i++) {
        const angle = i * 10;
        const mark = `
            <g transform="rotate(${angle}, 100, 100)">
                <line x1="100" y1="10" x2="100" y2="20" stroke="#666" stroke-width="2"/>
                <text x="100" y="35" text-anchor="middle" fill="#fff" font-size="10" transform="rotate(${-angle}, 100, 100)">${angle - 180}°</text>
            </g>`;
        pitchMarks.innerHTML += mark;
        rollMarks.innerHTML += mark;
    }
}
generateDegreeMarks();

function updateGauge(event) {
    // Pitch: beta (x-axis), Roll: alpha (z-axis)
    let pitch = event.beta !== null ? event.beta : 0;
    let roll = event.alpha !== null ? event.alpha : 0;

    // Log for debugging
    console.log('Raw - Beta (pitch):', event.beta, 'Alpha (roll):', event.alpha, 'Gamma:', event.gamma);
    console.log('Processed - Pitch:', pitch, 'Roll:', roll);

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

    // Rotate lines: pitch clockwise for positive, counterclockwise for negative
    // Roll line rotates opposite to phone roll to appear level
    pitchLine.style.transform = `rotate(${pitch}deg)`;
    rollLine.style.transform = `rotate(${-roll}deg)`;
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