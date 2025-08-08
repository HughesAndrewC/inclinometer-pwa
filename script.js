const pitchLine = document.getElementById('pitch-line');
const rollBox = document.getElementById('roll-box');
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
const smoothingFactor = 0.03; // Stronger smoothing
let lastAlpha = 0; // Track last alpha for delta-based roll

// Add permission button
const permissionBtn = document.createElement('button');
permissionBtn.id = 'permission-btn';
permissionBtn.textContent = 'Enable Inclinometer';
document.getElementById('inclinometer').appendChild(permissionBtn);

// Generate degree markings
function generateDegreeMarks() {
    const pitchMarks = document.getElementById('pitch-marks');
    const rollMarks = document.getElementById('roll-marks');
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
    // Raw sensor data
    let beta = event.beta !== null ? event.beta : 0; // x-axis (pitch)
    let alpha = event.alpha !== null ? event.alpha : 0; // z-axis (roll)

    // Log raw data
    console.log('Raw - Beta:', beta, 'Alpha:', alpha, 'Gamma:', event.gamma);

    // Adjust for mounted orientation (screen facing rear)
    let pitch, roll;
    const orientation = window.orientation || screen.orientation.angle || 0;
    if (orientation === 0 || orientation === 180) { // Portrait or upside-down
        // Screen facing rear: z-axis (alpha) is roll, beta is pitch
        pitch = beta;
        roll = alpha;
    } else { // Landscape (90 or -90)
        // Adjust for landscape: beta may need inversion, alpha may need rotation
        pitch = beta; // May need adjustment based on testing
        roll = alpha + (orientation === 90 ? -90 : 90); // Rotate alpha
    }

    // Apply offsets
    pitch -= pitchOffset;
    roll = ((roll - rollOffset) % 360 + 360) % 360;
    if (roll > 180) roll -= 360; // ±180°

    // Limit pitch to ±90°
    pitch = Math.max(-90, Math.min(90, pitch));

    // Delta-based roll smoothing to prevent jumps
    let deltaRoll = roll - lastAlpha;
    if (deltaRoll > 180) deltaRoll -= 360;
    if (deltaRoll < -180) deltaRoll += 360;
    roll = lastRoll + smoothingFactor * deltaRoll;
    lastAlpha = alpha;

    // Apply smoothing for pitch
    pitch = lastPitch + smoothingFactor * (pitch - lastPitch);
    lastPitch = pitch;
    lastRoll = roll;

    // Update display
    pitchDisplay.textContent = pitch.toFixed(1);
    rollDisplay.textContent = roll.toFixed(1);

    // Rotate lines: pitch clockwise for positive, counterclockwise for negative
    // Roll box rotates opposite to appear level
    pitchLine.style.transform = `rotate(${pitch}deg)`;
    rollBox.style.transform = `rotate(${-roll}deg)`;

    // Log processed values
    console.log('Processed - Pitch:', pitch, 'Roll:', roll, 'Orientation:', orientation);
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