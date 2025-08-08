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

// Add permission button
const permissionBtn = document.createElement('button');
permissionBtn.id = 'permission-btn';
permissionBtn.textContent = 'Enable Inclinometer';
permissionBtn.style.cssText = `
    font-size: 1.5em;
    padding: 10px 20px;
    background: #444;
    border: none;
    color: #fff;
    border-radius: 5px;
    margin: 10px;
    cursor: pointer;
`;
document.getElementById('inclinometer').appendChild(permissionBtn);

function updateGauge(event) {
    let pitch = event.beta !== null ? event.beta : 0;
    let roll = event.gamma !== null ? event.gamma : 0;

    // Log for debugging
    console.log('Orientation - Beta:', event.beta, 'Gamma:', event.gamma);

    // Apply offsets
    pitch -= pitchOffset;
    roll -= rollOffset;

    // Limit pitch and roll to ±90°
    pitch = Math.max(-90, Math.min(90, pitch));
    roll = Math.max(-90, Math.min(90, roll));

    // Update display
    pitchDisplay.textContent = pitch.toFixed(1);
    rollDisplay.textContent = roll.toFixed(1);

    // Calculate bubble position
    const gauge = document.getElementById('gauge');
    const gaugeSize = gauge.offsetWidth || 300; // Fallback size
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
                    alert('Permission denied for device orientation. Inclinometer will not function.');
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