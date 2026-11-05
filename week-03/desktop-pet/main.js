// 바탕화면 창 만들기: 테두리 없음, 배경 투명, 항상 맨 위
const { app, BrowserWindow } = require('electron');

const PET_SIZE = 250;

function createWindow() {
  const win = new BrowserWindow({
    width: PET_SIZE,
    height: PET_SIZE,
    frame: false,        // 창 테두리·제목줄 없음
    transparent: true,   // 고양이 둘레를 투명하게
    alwaysOnTop: true,   // 다른 창보다 항상 위
    resizable: false,
    hasShadow: false,
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});
