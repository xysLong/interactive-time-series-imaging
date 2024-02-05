let isDrawing = false;
let coordinates = [];

const canvas = document.getElementById('curveCanvas');
const ctx = canvas.getContext('2d');


canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseleave', stopDrawing);

function startDrawing(e) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    isDrawing = true;
    coordinates = [];
    coordinates.push({x: e.pageX - canvas.offsetLeft, y: e.pageY - canvas.offsetTop});
    ctx.beginPath();
    ctx.moveTo(e.pageX - canvas.offsetLeft, e.pageY - canvas.offsetTop);
}

function draw(e) {
    if (!isDrawing) return;
    coordinates.push({x: e.pageX - canvas.offsetLeft, y: e.pageY - canvas.offsetTop});
    ctx.lineTo(e.pageX - canvas.offsetLeft, e.pageY - canvas.offsetTop);
    ctx.stroke();
}

function stopDrawing() {
    if (!isDrawing) return;
    ctx.closePath();
    isDrawing = false;
    if (!isMonotonicallyIncreasing()) {
        alert('Warning: x values are not monotonically increasing!');
    } else {
        updatePlot();
    }
}

function changePlotType() {
    const plotType = document.getElementById('plotType').value.toString();
    document.getElementById("colormap").value = plotType.startsWith('mtf') ? 'viridis' : 'seismic';
    updatePlot();
}

function updatePlot() {
    if (coordinates.length === 0) return;
    const plotType = document.getElementById('plotType').value.toString();
    const colorMap = document.getElementById('colormap').value.toString();
    const plotContainer = document.getElementById('plotContainer');
    plotContainer.innerHTML = '';
    fetch('/process_coordinates', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            "coordinates": coordinates,
            "plotType": plotType,
            "colorMap": colorMap
        }),
    })
        .then(response => response.json())
        .then(data => {
            const minX = Math.min(...coordinates.map(point => point.x));
            const maxX = Math.max(...coordinates.map(point => point.x));
            const plotWidth = maxX - minX;
            const plotImage = new Image();
            plotImage.src = 'data:image/png;base64,' + data.image;
            plotImage.style.width = plotWidth + 'px';
            plotImage.style.height = plotWidth + 'px';
            plotImage.style.marginLeft = minX + 'px';
            console.log(minX, maxX, plotImage.style.width, plotImage.style.marginLeft);
            plotContainer.appendChild(plotImage);
        });
}

function isMonotonicallyIncreasing() {
    for (let i = 1; i < coordinates.length; i++) {
        if (coordinates[i].x < coordinates[i - 1].x) {
            return false;
        }
    }
    return true;
}


document.addEventListener("DOMContentLoaded", function () {
    const centerY = 0.5 * canvas.height;
    const amplitude = 50;
    const frequency = 0.05;
    const animationSpeed = 0.02;

    function initialize() {
        let startX = Math.random() * (canvas.width / 4);
        let endX = (3 * canvas.width / 4) + Math.random() * (canvas.width / 4);
        let previousX = startX;
        let previousY = centerY + amplitude * Math.sin(frequency * startX);
        let t = 0;
        return [startX, endX, previousX, previousY, t]
    }

    let [startX, endX, previousX, previousY, t] = initialize();
    let animationId;
    let isAnimationStopped = false;
    let alpha = 1.0;

    async function drawRandomStroke() {
        const currentX = startX + (endX - startX) * t;
        const currentY = centerY + Math.random() * amplitude * Math.sin(frequency * currentX);

        ctx.beginPath();
        ctx.moveTo(previousX, previousY);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
        ctx.closePath();

        previousX = currentX;
        previousY = currentY;
        t += animationSpeed;
        if (t >= 1.0) {
            await delay(1000);
            while (alpha > 0) {
                alpha -= 0.05;
                const tempCanvas = document.createElement('canvas');
                if (canvas instanceof HTMLCanvasElement) {
                    tempCanvas.width = canvas.width;
                    tempCanvas.height = canvas.height;
                    const tempContext = tempCanvas.getContext('2d');
                    tempContext.drawImage(canvas, 0, 0);
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.globalAlpha = alpha;
                    ctx.drawImage(tempCanvas, 0, 0);
                    ctx.globalAlpha = 1.0;
                    await delay(100);
                }
            }
            alpha = 1;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            [startX, endX, previousX, previousY, t] = initialize();
        }
        if (!isAnimationStopped) {
            animationId = requestAnimationFrame(drawRandomStroke);
        }
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function stopAnimation() {
        isAnimationStopped = true;
        cancelAnimationFrame(animationId);
        canvas.removeEventListener("mousemove", stopAnimation);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }


    drawRandomStroke().then(() => {
    });
    canvas.addEventListener("mousemove", stopAnimation);
});
