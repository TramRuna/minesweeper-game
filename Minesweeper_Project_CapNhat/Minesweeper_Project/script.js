(() => {
  "use strict";
  const SIZE = 10, MINES = 15;
  const boardEl = document.getElementById("board");
  const mineCountEl = document.getElementById("mineCount");
  const timerEl = document.getElementById("timer");
  const statusEl = document.getElementById("status");
  const messageEl = document.getElementById("message");
  const flagModeEl = document.getElementById("flagMode");
  let cells = [], gameOver = false, started = false, firstReveal = true, seconds = 0, timerId = null, hintCells = [];

  const idx = (r,c) => r * SIZE + c;
  function neighbors(i) {
    const r = Math.floor(i / SIZE), c = i % SIZE, out = [];
    for (let dr=-1; dr<=1; dr++) for (let dc=-1; dc<=1; dc++) {
      if (!dr && !dc) continue;
      const nr=r+dr, nc=c+dc;
      if (nr>=0 && nr<SIZE && nc>=0 && nc<SIZE) out.push(idx(nr,nc));
    }
    return out;
  }
  function say(text, kind="") { messageEl.textContent=text; messageEl.className="message"+(kind ? " "+kind : ""); }
  function updateStats() {
    mineCountEl.textContent = String(Math.max(0, MINES - cells.filter(x=>x.flagged).length)).padStart(2,"0");
    timerEl.textContent = `${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`;
  }
  function startTimer() {
    if (started) return; started=true; statusEl.textContent="Đang chơi";
    timerId=setInterval(()=>{ if (!gameOver) { seconds++; updateStats(); } },1000);
  }
  function makeGame() {
    clearInterval(timerId); timerId=null; seconds=0; started=false; gameOver=false; firstReveal=true; hintCells=[];
    cells=Array.from({length:SIZE*SIZE},()=>({mine:false,adj:0,revealed:false,flagged:false}));
    let placed=0;
    while(placed<MINES) { const i=Math.floor(Math.random()*cells.length); if(!cells[i].mine){cells[i].mine=true;placed++;} }
    cells.forEach((cell,i)=>cell.adj=neighbors(i).filter(n=>cells[n].mine).length);
    statusEl.textContent="Sẵn sàng"; updateStats(); say("Mở ô để bắt đầu. Số cho biết có bao nhiêu mìn ở 8 ô xung quanh.");
    render();
  }
  function render() {
    boardEl.innerHTML="";
    cells.forEach((cell,i)=>{
      const b=document.createElement("button");
      b.className="cell "+(cell.revealed?"revealed":"hidden");
      b.type="button"; b.setAttribute("role","gridcell");
      b.setAttribute("aria-label",cell.revealed?(cell.mine?"Mìn":`Ô đã mở, ${cell.adj} mìn xung quanh`):(cell.flagged?"Ô đã cắm cờ":"Ô chưa mở"));
      if(cell.revealed) {
        if(cell.mine){b.textContent="💣";b.classList.add("mine");}
        else if(cell.adj>0){b.textContent=cell.adj;b.classList.add("n"+cell.adj);}
      } else if(cell.flagged) { b.textContent="🚩"; b.classList.add("flagged"); }
      if(hintCells.includes(i) && !cell.revealed) b.classList.add(cell.mine?"hint-mine":"hint-safe");
      b.addEventListener("click",()=>{ if(flagModeEl.checked) toggleFlag(i); else reveal(i); });
      b.addEventListener("contextmenu",e=>{e.preventDefault();toggleFlag(i);});
      boardEl.appendChild(b);
    });
  }
  function toggleFlag(i) {
    if(gameOver || cells[i].revealed) return;
    startTimer(); cells[i].flagged=!cells[i].flagged; hintCells=[]; updateStats(); render();
  }
  function reveal(i) {
    if(gameOver || cells[i].revealed || cells[i].flagged) return;
    // Bảo đảm lượt mở đầu tiên luôn an toàn bằng cách chuyển mìn đi nơi khác.
    if(firstReveal) {
      firstReveal=false;
      if(cells[i].mine) {
        cells[i].mine=false;
        const candidates=cells.map((cell,j)=>j).filter(j=>j!==i && !cells[j].mine);
        const replacement=candidates[Math.floor(Math.random()*candidates.length)];
        cells[replacement].mine=true;
        cells.forEach((cell,j)=>cell.adj=neighbors(j).filter(n=>cells[n].mine).length);
      }
    }
    startTimer(); hintCells=[];
    if(cells[i].mine) { cells[i].revealed=true; finish(false); return; }
    floodReveal(i); render(); checkWin();
  }
  // Mở lan: mở ô được chọn; nếu ô có 0 mìn lân cận, mở tiếp vùng trống
  // và các ô số nằm sát vùng đó (không mở ô có mìn hoặc ô đã cắm cờ).
  function floodReveal(start) {
    const stack=[start];
    const queued=new Set([start]);
    while(stack.length) {
      const i=stack.pop(), cell=cells[i];
      if(cell.revealed || cell.flagged || cell.mine) continue;
      cell.revealed=true;
      if(cell.adj===0) {
        for(const n of neighbors(i)) {
          if(!queued.has(n) && !cells[n].revealed && !cells[n].flagged && !cells[n].mine) {
            queued.add(n);
            stack.push(n);
          }
        }
      }
    }
  }
  function finish(won) {
    gameOver=true; clearInterval(timerId);
    if(!won) cells.forEach(c=>{if(c.mine)c.revealed=true;});
    statusEl.textContent=won?"Chiến thắng!":"Thua cuộc";
    say(won?"Chúc mừng! Bạn đã mở tất cả ô an toàn.":"Bạn đã chạm phải mìn. Hãy chơi lại để thử sức nhé.",won?"good":"warn");
    render();
  }
  function checkWin() { if(cells.every(c=>c.mine || c.revealed)) finish(true); }

  // Rule-based inference. Assumes flags placed by the player are correct.
  function infer() {
    const safe=new Set(), mines=new Set();
    cells.forEach((cell,i)=>{
      if(!cell.revealed || cell.mine || cell.adj===0) return;
      const ns=neighbors(i), hidden=ns.filter(n=>!cells[n].revealed && !cells[n].flagged), flags=ns.filter(n=>cells[n].flagged).length;
      if(hidden.length===0) return;
      if(cell.adj-flags===0) hidden.forEach(n=>safe.add(n));
      if(cell.adj-flags===hidden.length) hidden.forEach(n=>mines.add(n));
    });
    mines.forEach(i=>safe.delete(i));
    return {safe:[...safe], mines:[...mines]};
  }
  function aiHint() {
    if(gameOver){say("Ván chơi đã kết thúc. Hãy bấm Chơi lại.");return;}
    const result=infer();
    if(result.safe.length) {
      const i=result.safe[0]; hintCells=[i]; render();
      say(`AI suy luận: ô hàng ${Math.floor(i/SIZE)+1}, cột ${i%SIZE+1} là ô an toàn theo các số và cờ hiện tại.`, "good");
    } else if(result.mines.length) {
      const i=result.mines[0]; hintCells=[i]; render();
      say(`AI suy luận: ô hàng ${Math.floor(i/SIZE)+1}, cột ${i%SIZE+1} chắc chắn là mìn theo các số và cờ hiện tại.`, "warn");
    } else {
      say("AI chưa tìm thấy nước đi chắc chắn từ các ô đã mở. Hãy mở thêm thông tin hoặc tự chọn một ô.");
    }
  }
  function aiMove() {
    if(gameOver){say("Ván chơi đã kết thúc. Hãy bấm Chơi lại.");return;}
    const result=infer();
    if(result.safe.length) {
      const i=result.safe[0]; say(`AI mở ô an toàn hàng ${Math.floor(i/SIZE)+1}, cột ${i%SIZE+1}.`,"good"); reveal(i);
    } else if(result.mines.length) {
      const i=result.mines[0]; hintCells=[i]; render();
      say(`AI nhận diện ô hàng ${Math.floor(i/SIZE)+1}, cột ${i%SIZE+1} là mìn. AI đánh dấu ô này để bạn xác nhận.`, "warn");
    } else {
      say("AI chưa có nước đi chắc chắn. Để tránh đoán mò, AI không tự mở ô ngẫu nhiên.");
    }
  }
  document.getElementById("newGame").addEventListener("click",makeGame);
  document.getElementById("hintBtn").addEventListener("click",aiHint);
  document.getElementById("aiMoveBtn").addEventListener("click",aiMove);
  makeGame();
})();