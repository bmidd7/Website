const PROJECTS = [
    { label: "School", url: "/School/", orbitDistance: getOrbitRadius},
    { label: "Chemistry", url: "/School/Chem/", orbitDistance: getOrbitRadius},
    { label: "Project Three", url: "#", orbitDistance: getOrbitRadius},
    { label: "Project Four", url: "#", orbitDistance: getOrbitRadius},
    { label: "Project Five", url: "#", orbitDistance: getOrbitRadius},
];

const orbitRadiusMin = window.innerHeight * 1/4;
const orbitRadiusMax = window.innerHeight * 1/3;
// Angle offset so first node sits at top 
const ANGLE_OFFSET = -Math.PI / 2;

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');
const orbEl = document.getElementById('orb') as HTMLDivElement;
const nodeEls = [];

let width: number, height: number, centerX: number, centerY: number;


function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    centerX = width / 2;
    centerY = height / 2;
    orbEl.style.left = centerX + 'px';
    orbEl.style.top = centerY + 'px';
    positionNodes();
}

function getOrbitRadius() {
  let min = Math.ceil(orbitRadiusMin);
  let max = Math.floor(orbitRadiusMax);
  return Math.floor(Math.random() * (max - min + 1)) + min; //
}


PROJECTS.forEach((proj, i) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'node';

    const btn = document.createElement('button');
    btn.textContent = proj.label;
    btn.onclick = () => { window.location.href = proj.url; };

    wrapper.appendChild(btn);
    document.body.appendChild(wrapper);
    nodeEls.push(wrapper);
});

function positionNodes() {
    const n = PROJECTS.length;
    PROJECTS.forEach((proj, i) => {
        const angle = ANGLE_OFFSET + (2 * Math.PI * i) / n;
        const x = centerX + proj.orbitDistance() * Math.cos(angle);
        const y = centerY + proj.orbitDistance() * Math.sin(angle);
        nodeEls[i].style.left = x + 'px';
        nodeEls[i].style.top = y + 'px';
        nodeEls[i]._angle = angle;
        nodeEls[i]._x = x;
        nodeEls[i]._y = y;
    });
}

// Draw tendril lines
function drawTendrils() {
    ctx.clearRect(0, 0, width, height);

    PROJECTS.forEach((proj, i) => {
        const nodeX = nodeEls[i]._x;
        const nodeY = nodeEls[i]._y;
        if (nodeX === undefined) return;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(nodeX, nodeY);

        ctx.strokeStyle = 'rgba(100, 140, 255, 0.18)';
        ctx.lineWidth = 1;
        ctx.stroke();
    });
}

// Loop
function loop() {
    drawTendrils();
    requestAnimationFrame(loop);
}

window.addEventListener('resize', resize);
resize();
loop();
