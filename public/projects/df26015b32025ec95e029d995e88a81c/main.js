const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let clicks = 0;

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#4caf50';
  ctx.font = '24px Arial';
  ctx.fillText(`Clicks: ${clicks}`, 120, 150);
}

canvas.addEventListener('click', () => {
  clicks++;
  draw();
});

draw();
