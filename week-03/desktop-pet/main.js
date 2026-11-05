// 바탕화면 창 만들기: 테두리 없음, 배경 투명, 항상 맨 위
const path = require('path');
const { app, BrowserWindow, Menu, ipcMain, screen } = require('electron');

const PET_SIZE = 250;

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
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});
