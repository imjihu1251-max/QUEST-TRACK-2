// 화면(pet.js)이 창 옮기기를 부탁할 수 있게 해 주는 연결 통로
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pet', {
  dragStart: () => ipcRenderer.send('drag-start'),
  dragMove: () => ipcRenderer.send('drag-move'),
  dragEnd: () => ipcRenderer.send('drag-end'),
  // 키를 누르면 'left' 또는 'right' 만 받는다 (무슨 키인지는 오지 않음)
  onKeyPress: (callback) => ipcRenderer.on('key-press', (_event, side) => callback(side)),
});
