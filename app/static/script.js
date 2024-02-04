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