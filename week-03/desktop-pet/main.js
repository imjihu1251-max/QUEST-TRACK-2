// 바탕화면 창 만들기: 테두리 없음, 배경 투명, 항상 맨 위
const path = require('path');
const { app, BrowserWindow, Menu, ipcMain, screen } = require('electron');
const { uIOhook, UiohookKey: K } = require('uiohook-napi');

const PET_SIZE = 250;

// 키보드 왼쪽 절반의 키. 여기 없는 키는 모두 오른쪽으로 본다
const LEFT_KEYS = new Set([
  K.Escape, K.F1, K.F2, K.F3, K.F4, K.F5, K.F6,
  K.Backquote, K[1], K[2], K[3], K[4], K[5],
  K.Tab, K.Q, K.W, K.E, K.R, K.T,
  K.CapsLock, K.A, K.S, K.D, K.F, K.G,
  K.Shift, K.Z, K.X, K.C, K.V, K.B,
  K.Ctrl, K.Meta, K.Alt,
]);

// 지킬 것: 어떤 키를 눌렀는지는 저장도 전송도 하지 않고, 몇 번 눌렀는지만 센다.
// 키 번호는 아래 함수 안에서 왼쪽·오른쪽을 고르는 데만 쓰고 바로 버린다.
// 화면(pet.js)에는 'left' / 'right' 만 보낸다.
let keyCount = 0;

function watchKeyboard(win) {
  uIOhook.on('keydown', (e) => {
    keyCount += 1;
    const side = LEFT_KEYS.has(e.keycode) ? 'left' : 'right';
    if (!win.isDestroyed()) win.webContents.send('key-press', side);
  });
  uIOhook.start();
}

// 잠드는 시간(초). 시험할 때는 PET_SLEEP_SECONDS=10 처럼 줄여서 켤 수 있다
const SLEEP_SECONDS = Number(process.env.PET_SLEEP_SECONDS) || 60;

function createWindow() {
  const win = new BrowserWindow({
    width: PET_SIZE,
    height: PET_SIZE,
    frame: false,        // 창 테두리·제목줄 없음
    transparent: true,   // 고양이 둘레를 투명하게
    alwaysOnTop: true,   // 다른 창보다 항상 위
    resizable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadFile('index.html', { query: { sleep: String(SLEEP_SECONDS) } });

  // 오른쪽 클릭 → "종료" 메뉴
  // app.quit() 은 창만 닫히고 프로그램이 남는 일이 있어서 app.exit() 로 바로 끝낸다
  // (저장할 것이 없어서 바로 끝내도 괜찮다)
  const menu = Menu.buildFromTemplate([
    { label: '종료', click: () => app.exit(0) },
  ]);
  win.webContents.on('context-menu', () => {
    menu.popup({ window: win });
  });

  // 끌어서 옮기기: 누른 순간 마우스와 창 사이의 거리를 기억하고,
  // 움직일 때마다 그 거리를 유지하도록 창을 옮긴다
  let grab = null;
  ipcMain.on('drag-start', () => {
    const cursor = screen.getCursorScreenPoint();
    const [x, y] = win.getPosition();
    grab = { dx: cursor.x - x, dy: cursor.y - y };
  });
  ipcMain.on('drag-move', () => {
    if (!grab) return;
    const cursor = screen.getCursorScreenPoint();
    // setPosition 만 쓰면 화면 배율에 따라 창 크기가 바뀌는 일이 있어서 크기도 같이 정한다
    win.setBounds({
      x: cursor.x - grab.dx,
      y: cursor.y - grab.dy,
      width: PET_SIZE,
      height: PET_SIZE,
    });
  });
  ipcMain.on('drag-end', () => {
    grab = null;
  });

  watchKeyboard(win);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});
