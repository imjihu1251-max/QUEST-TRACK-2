// 고양이 움직임: 손 흔들기, 클릭하면 두 손, 1분 지나면 잠자기, 끌어서 옮기기
const cat = document.getElementById('cat');

const WAVE_MS = 2000;        // 손을 바꾸는 간격
const HAPPY_MS = 2000;       // 두 손을 들고 있는 시간
const DRAG_PX = 5;           // 이만큼 넘게 움직이면 클릭이 아니라 끌기
const SLEEP_MS = (Number(new URLSearchParams(location.search).get('sleep')) || 60) * 1000;

// 'awake'(손 흔들기) / 'happy'(두 손) / 'sleeping'(눈 감기)
let state = 'awake';
let waveRight = true;
let happyTimer = null;
let sleepTimer = null;

function show(frame) {
  cat.className = frame;
}

// 평소: 오른손·왼손 번갈아
setInterval(() => {
  if (state !== 'awake') return;
  waveRight = !waveRight;
  show(waveRight ? 'right-paw' : 'left-paw');
}, WAVE_MS);

// 만질 때마다 잠드는 시간을 처음부터 다시 센다
function touched() {
  clearTimeout(sleepTimer);
  sleepTimer = setTimeout(fallAsleep, SLEEP_MS);
}

function fallAsleep() {
  clearTimeout(happyTimer);
  state = 'sleeping';
  show('sleeping');
}

// 클릭: 두 손을 들고, 잠들었으면 깨어난다
function onClick() {
  state = 'happy';
  show('both-paws');
  clearTimeout(happyTimer);
  happyTimer = setTimeout(() => {
    state = 'awake';
    show(waveRight ? 'right-paw' : 'left-paw');
  }, HAPPY_MS);
  touched();
}

// 왼쪽 버튼으로 누르고 → 조금 움직이고 떼면 클릭, 많이 움직이면 끌기
let press = null;

cat.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  press = { x: e.screenX, y: e.screenY, dragging: false };
  cat.setPointerCapture(e.pointerId);
  window.pet.dragStart();
});

cat.addEventListener('pointermove', (e) => {
  if (!press) return;
  if (!press.dragging) {
    const moved = Math.hypot(e.screenX - press.x, e.screenY - press.y);
    if (moved > DRAG_PX) press.dragging = true;
  }
  if (press.dragging) window.pet.dragMove();
});

cat.addEventListener('pointerup', (e) => {
  if (!press || e.button !== 0) return;
  window.pet.dragEnd();
  if (press.dragging) {
    touched();
  } else {
    onClick();
  }
  press = null;
});

touched();
