let isDrawing = false;
let currentX = -1;
let currentY = -1;
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
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'black';
    currentX = e.pageX - canvas.offsetLeft;
    currentY = e.pageY - canvas.offsetTop;
    coordinates.push({x: currentX, y: currentY});
    ctx.beginPath();
    ctx.moveTo(currentX, currentY);
}

function draw(e) {
    if (!isDrawing) return;
    const currentX_ = e.pageX - canvas.offsetLeft;
    const currentY_ = e.pageY - canvas.offsetTop;
    if (currentX_ !== currentX || Math.abs(currentY_ - currentY) >= 10) {
        currentX = currentX_;
        currentY = currentY_;
        coordinates.push({x: currentX, y: currentY});
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
    }
}

function stopDrawing() {
    if (!isDrawing) return;
    ctx.closePath();
    isDrawing = false;
    const nonIncreasingSequences = findNonIncreasingSequences();
    if (nonIncreasingSequences.length > 0) {
        ctx.lineWidth = 5;
        ctx.strokeStyle = 'coral';
        for (const sequence of nonIncreasingSequences) {
            ctx.beginPath();
            ctx.moveTo(sequence[0].x, sequence[0].y);
            for (let i = 1; i < sequence.length; i++) {
                ctx.lineTo(sequence[i].x, sequence[i].y);
            }
            ctx.stroke();
            ctx.closePath();
        }
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


function findNonIncreasingSequences() {
    const result = [];
    let sequence = [];

    for (let i = 1; i < coordinates.length; i++) {
        if (coordinates[i].x <= coordinates[i - 1].x) {
            sequence.push(coordinates[i - 1]);
        } else {
            if (sequence.length > 0) {
                sequence.push(coordinates[i - 1]);
                result.push(sequence);
                sequence = [];
            }
        }
    }

    if (sequence.length > 0) {
        sequence.push(coordinates[coordinates.length - 1]);
        result.push(sequence);
    }

    return result;
}


document.addEventListener("DOMContentLoaded", function () {
    const centerY = 0.5 * canvas.height;
    const amplitude = 30;
    const frequency = 0.05;
    const animationSpeed = 0.02;

    function f(x) {
        return centerY + Math.random() * amplitude * Math.sin(frequency * x);
    }

    function initialize() {
        let startX = Math.random() * (canvas.width / 4);
        let endX = (3 * canvas.width / 4) + Math.random() * (canvas.width / 4);
        return [startX, endX, startX, f(startX), 0., 1.]
    }

    let [startX, endX, previousX, previousY, t, alpha] = initialize();
    let animationId;
    let isAnimating = true;

    async function drawRandomStroke() {
        if (t > 1.0) {
            await delay(1000);
            await fadeOut();
            [startX, endX, previousX, previousY, t, alpha] = initialize();
        }
        if (isAnimating) {
            t += animationSpeed;
            const currentX = startX + (endX - startX) * t;
            const currentY = f(currentX);
            ctx.beginPath();
            ctx.moveTo(previousX, previousY);
            ctx.lineTo(currentX, currentY);
            ctx.stroke();
            ctx.closePath();
            previousX = currentX;
            previousY = currentY;
            animationId = requestAnimationFrame(drawRandomStroke);
        }
    }

    async function fadeOut() {
        while (isAnimating && alpha > 0) {
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
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function stopAnimation() {
        isAnimating = false;
        cancelAnimationFrame(animationId);
        canvas.removeEventListener("mousemove", stopAnimation);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }


    drawRandomStroke().then();
    canvas.addEventListener("mousemove", stopAnimation);
});
