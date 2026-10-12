const SUPABASE_URL = 'https://vflnyjevqdshcglsutql.supabase.co';
const SUPABASE_KEY = 'sb_publishable_J2Lz3bMkAQC4_ihooZTRvw_MaN1hNeo';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- Zeichenfläche ---

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const colorInput = document.getElementById('color');
const sizeInput = document.getElementById('size');

let drawing = false;

ctx.lineCap = 'round';
ctx.lineJoin = 'round';
resetCanvas();

function resetCanvas() {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function positionOf(event) {
  const box = canvas.getBoundingClientRect();
  const point = event.touches ? event.touches[0] : event;
  return {
    x: (point.clientX - box.left) * (canvas.width / box.width),
    y: (point.clientY - box.top) * (canvas.height / box.height)
  };
}

function startStroke(event) {
  event.preventDefault();
  drawing = true;
  const { x, y } = positionOf(event);
  ctx.beginPath();
  ctx.moveTo(x, y);
}

function continueStroke(event) {
  if (!drawing) return;
  event.preventDefault();
  const { x, y } = positionOf(event);
  ctx.strokeStyle = colorInput.value;
  ctx.lineWidth = sizeInput.value;
  ctx.lineTo(x, y);
  ctx.stroke();
}

function endStroke() {
  drawing = false;
}

canvas.addEventListener('mousedown', startStroke);
canvas.addEventListener('mousemove', continueStroke);
canvas.addEventListener('mouseup', endStroke);
canvas.addEventListener('mouseleave', endStroke);
canvas.addEventListener('touchstart', startStroke);
canvas.addEventListener('touchmove', continueStroke);
canvas.addEventListener('touchend', endStroke);

document.getElementById('clear').addEventListener('click', resetCanvas);

// --- Speichern ---

const form = document.getElementById('form');
const statusLine = document.getElementById('status');
const submitButton = document.getElementById('submit');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const title = document.getElementById('title').value.trim();
  const author = document.getElementById('author').value.trim() || 'Anonymous';
  const imageData = canvas.toDataURL('image/png');

  if (imageData.length > 300000) {
    statusLine.textContent = 'Das Bild ist zu groß. Mal es etwas schlichter.';
    return;
  }

  submitButton.disabled = true;
  statusLine.textContent = 'Wird aufgehängt …';

  const { error } = await db
    .from('doodles')
    .insert({ title, image_data: imageData, author });

  submitButton.disabled = false;

  if (error) {
    statusLine.textContent = 'Hat nicht geklappt: ' + error.message;
    return;
  }

  statusLine.textContent = 'Hängt an der Wand!';
  form.reset();
  resetCanvas();
  loadGallery();
});

// --- Galerie ---

const gallery = document.getElementById('gallery');

async function loadGallery() {
  const { data, error } = await db
    .from('doodles')
    .select('id, title, image_data, author, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    gallery.textContent = 'Galerie konnte nicht geladen werden.';
    return;
  }

  gallery.replaceChildren();

  for (const doodle of data) {
    const frame = document.createElement('figure');
    frame.className = 'frame';

    const img = document.createElement('img');
    img.src = doodle.image_data;
    img.alt = doodle.title;

    const caption = document.createElement('figcaption');
    const heading = document.createElement('strong');
    heading.textContent = doodle.title;
    const meta = document.createElement('span');
    meta.textContent = doodle.author + ' · ' +
      new Date(doodle.created_at).toLocaleDateString('de-DE', {
        month: 'short', year: 'numeric'
      });

    caption.append(heading, meta);
    frame.append(img, caption);
    gallery.append(frame);
  }
}

loadGallery();
