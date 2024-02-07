let isMTF = false;
let isDrawing = false;
let currentX = -1;
let coordinates = [];
let gafColormapOptions = ['seismic', 'coolwarm', 'bwr', 'Spectral', 'PiYG', 'RdBu'];
let mtfColormapOptions = ['viridis', 'plasma', 'inferno', 'magma', 'cividis'];

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
    const currentY = e.pageY - canvas.offsetTop;
    coordinates.push({x: currentX, y: currentY});
    ctx.beginPath();
    ctx.moveTo(currentX, currentY);
}

function draw(e) {
    if (!isDrawing) return;
    const currentX_ = e.pageX - canvas.offsetLeft;
    if (currentX_ > currentX) {
        currentX = currentX_;
        const currentY = e.pageY - canvas.offsetTop;
        coordinates.push({x: currentX, y: currentY});
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
    }

}

function stopDrawing() {
    if (!isDrawing) return;
    ctx.closePath();
    isDrawing = false;
    updatePlot();
}

function changeImaging() {
    const imaging = document.getElementById('imaging').value.toString();
    if (isMTF !== imaging.startsWith('mtf')) {
        isMTF = !isMTF;
        updateColormapOptions();
    }
    updatePlot();
}

function updateColormapOptions() {
    const selectElement = document.getElementById("colormap");
    selectElement.innerHTML = "";
    let colormapOptions = isMTF ? mtfColormapOptions : gafColormapOptions;
    colormapOptions.forEach(function (option) {
        const optionElement = document.createElement("option");
        optionElement.value = option;
        optionElement.textContent = option;
        selectElement.appendChild(optionElement);
    });
    document.getElementById("colormap").value = colormapOptions[0];
}

function updatePlot() {
    if (coordinates.length === 0) return;
    const imaging = document.getElementById('imaging').value.toString();
    const colormap = document.getElementById('colormap').value.toString();
    const plotContainer = document.getElementById('plotContainer');
    plotContainer.innerHTML = '';
    fetch('/process_coordinates', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            "coordinates": coordinates,
            "imaging": imaging,
            "colormap": colormap
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


document.addEventListener("DOMContentLoaded", function () {
    updateColormapOptions();
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
