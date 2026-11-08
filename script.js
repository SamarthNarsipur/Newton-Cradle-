const canvas = document.getElementById('cradleCanvas');
const ctx = canvas.getContext('2d');

const momentumDisplay = document.getElementById('momentumFormula');
const energyDisplay = document.getElementById('energyFormula');

// Physics Setup Configuration
const numBobs = 10;
const bobRadius = 18; 
const stringLength = 220;
const gravity = 0.4; 
const mass = 1.0;    

const pivotY = 50;
const centerX = canvas.width / 2;
const startX = centerX - ((numBobs - 1) * bobRadius * 2) / 2;

let bobs = [];

class Bob {
    constructor(index) {
        this.index = index;
        this.pivotX = startX + index * bobRadius * 2;
        this.pivotY = pivotY;
        
        this.angle = 0;
        this.angularVelocity = 0;
        
        this.x = this.pivotX;
        this.y = this.pivotY + stringLength;
        this.isDragged = false;
    }

    update() {
        if (this.isDragged) return;

        let angularAcceleration = -(gravity / stringLength) * Math.sin(this.angle);
        this.angularVelocity += angularAcceleration;
        this.angle += this.angularVelocity;

        this.angularVelocity *= 0.999; 

        this.x = this.pivotX + stringLength * Math.sin(this.angle);
        this.y = this.pivotY + stringLength * Math.cos(this.angle);
    }

    getVelocity() {
        return this.angularVelocity * stringLength;
    }

    setVelocity(v) {
        this.angularVelocity = v / stringLength;
    }
}

for (let i = 0; i < numBobs; i++) {
    bobs.push(new Bob(i));
}

// Track multiple active dragged bobs simultaneously
let activeDraggedBobs = [];

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Check all bobs to see which ones intersect with the mouse click
    bobs.forEach(bob => {
        const dist = Math.hypot(mouseX - bob.x, mouseY - bob.y);
        if (dist < bobRadius + 5) { // broad hit box for easier selection
            bob.isDragged = true;
            if (!activeDraggedBobs.includes(bob)) {
                activeDraggedBobs.push(bob);
            }
        }
    });
});

canvas.addEventListener('mousemove', (e) => {
    if (activeDraggedBobs.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Move all currently grabbed bobs relative to the mouse coordinates
    activeDraggedBobs.forEach(bob => {
        let dx = mouseX - bob.pivotX;
        let dy = mouseY - bob.pivotY;
        let angle = Math.atan2(dx, dy);

        const maxAngle = (75 * Math.PI) / 180;
        bob.angle = Math.max(-maxAngle, Math.min(maxAngle, angle));
        
        bob.x = bob.pivotX + stringLength * Math.sin(bob.angle);
        bob.y = bob.pivotY + stringLength * Math.cos(bob.angle);
        bob.angularVelocity = 0; 
    });
});

window.addEventListener('mouseup', () => {
    activeDraggedBobs.forEach(bob => {
        bob.isDragged = false;
    });
    activeDraggedBobs = [];
});

function handleCollisions() {
    for (let i = 0; i < bobs.length - 1; i++) {
        let b1 = bobs[i];
        let b2 = bobs[i + 1];

        if (b1.x + bobRadius >= b2.x - bobRadius) {
            let v1 = b1.getVelocity();
            let v2 = b2.getVelocity();

            if (v1 > v2) {
                b1.setVelocity(v2);
                b2.setVelocity(v1);

                let overlap = (b1.x + bobRadius) - (b2.x - bobRadius);
                b1.x -= overlap / 2;
                b2.x += overlap / 2;
            }
        }
    }
}

// Clean and direct telemetry reporting
function updateMathFormulas() {
    let totalP = 0;
    let totalKE = 0;
    let totalPE = 0;
    
    bobs.forEach(bob => {
        let v = bob.getVelocity();
        totalP += mass * v;
        
        let ke = 0.5 * mass * v * v;
        let highestPointFloor = pivotY + stringLength;
        let h = highestPointFloor - bob.y;
        let pe = mass * (gravity * 10) * h; 
        
        totalKE += ke;
        totalPE += pe;
    });

    let totalE = totalKE + totalPE;

    // Clean display rendering formulas and output values directly
    momentumDisplay.innerHTML = `Formula: P = Σ(m × v)<br>Live Momentum Value = <strong>${totalP.toFixed(2)} kg·m/s</strong>`;
    energyDisplay.innerHTML = `Formula: E = Σ(½mv² + mgh)<br>Live Energy Value = <strong>${totalE.toFixed(2)} Joules</strong>`;
}

function engineLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(startX - bobRadius, pivotY);
    ctx.lineTo(startX + (numBobs - 1) * bobRadius * 2 + bobRadius, pivotY);
    ctx.stroke();

    bobs.forEach(bob => {
        bob.update();

        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(bob.pivotX, bob.pivotY);
        ctx.lineTo(bob.x, bob.y);
        ctx.stroke();

        let gradient = ctx.createRadialGradient(bob.x - 4, bob.y - 4, 2, bob.x, bob.y, bobRadius);
        gradient.addColorStop(0, '#e2e8f0');
        gradient.addColorStop(0.3, '#38bdf8');
        gradient.addColorStop(1, '#0369a1');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(bob.x, bob.y, bobRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1;
        ctx.stroke();
    });

    handleCollisions();
    updateMathFormulas();

    requestAnimationFrame(engineLoop);
}

engineLoop();
