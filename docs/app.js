const $ = (sel) => document.querySelector(sel);

const els = {
  backend: $("#backend"),
  connect: $("#btnConnect"),
  status:  $("#status"),
  info:    $("#info"),
  root:    $("#root"),
  count:   $("#count"),
  list:    $("#list"),
  table:   $("#tbl tbody"),
  rowTpl:  $("#row-tpl"),
  player:  $("#player"),
  audio:   $("#audio"),
  now:     $("#nowPlaying"),
  download:$("#downloadLink"),
  toast:   $("#toast"),
  autoToggle: $("#autoPlayToggle")
};

// Simple toast
function showToast(msg, kind="ok", timeout=2600){
  els.toast.textContent = msg;
  els.toast.className = `toast ${kind}`;
  els.toast.classList.remove("hidden");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=>els.toast.classList.add("hidden"), timeout);
}

function human(n){
  if(n < 1024) return `${n} B`;
  if(n < 1024**2) return `${(n/1024).toFixed(1)} KB`;
  if(n < 1024**3) return `${(n/1024**2).toFixed(1)} MB`;
  return `${(n/1024**3).toFixed(1)} GB`;
}

// ---- App state ----
const state = {
  base: "",          // backend base URL
  files: [],         // current file list
  currentIndex: -1,  // what we're playing
  autoplay: false
};

async function ping(base){
  const r = await fetch(new URL("/ping", base), { method: "GET" });
  if(!r.ok) throw new Error(`Ping failed (${r.status})`);
  const j = await r.json();
  if(!j.ok) throw new Error("Ping not OK");
}

async function listFiles(base){
  const r = await fetch(new URL("/files", base), { method: "GET" });
  if(!r.ok) throw new Error(`Files failed (${r.status})`);
  return r.json();
}

// Centralized play function by index
function playByIndex(i){
  if(!state.files || state.files.length === 0) return;
  if(i < 0 || i >= state.files.length) return;

  const f = state.files[i];
  const url = new URL("/stream/" + encodeURI(f.path), state.base).toString();

  els.audio.src = url;
  els.audio.play().catch(()=>{});
  els.now.textContent = f.path;
  els.download.href = url;
  els.download.download = f.name || f.path.split("/").pop();
  els.player.classList.remove("hidden");

  state.currentIndex = i;
}

// Build table rows and wire buttons
function renderList(base, files, root){
  state.base = base;
  state.files = Array.isArray(files) ? files : [];
  state.currentIndex = -1;

  els.table.innerHTML = "";
  els.root.textContent = root;
  els.count.textContent = state.files.length;

  state.files.forEach((f, i) => {
    const tr = els.rowTpl.content.firstElementChild.cloneNode(true);
    tr.querySelector(".name").textContent = f.path;
    tr.querySelector(".size").textContent = human(f.size);
    tr.querySelector(".play").addEventListener("click", () => playByIndex(i));
    els.table.appendChild(tr);
  });

  els.list.classList.remove("hidden");
  els.info.classList.remove("hidden");
}

// Connect button
async function connect(){
  const base = els.backend.value.trim() || "https://localhost:8443";
  localStorage.setItem("bear_down_backend", base);
  els.status.textContent = "Connecting…";
  els.status.className = "muted";

  try{
    await ping(base);
    const data = await listFiles(base);
    renderList(base, data.files, data.root);
    els.status.textContent = "Connected";
    els.status.className = "ok";
    showToast("Connected to backend", "ok");
  }catch(e){
    els.status.textContent = e.message;
    els.status.className = "err";
    showToast(e.message, "err", 4000);
  }
}

// Restore saved settings (backend URL + autoplay toggle)
function restore(){
  const savedBase = localStorage.getItem("bear_down_backend");
  els.backend.value = savedBase || "https://localhost:8443";

  const savedAutoplay = localStorage.getItem("bear_down_autoplay");
  state.autoplay = savedAutoplay === "true";
  if (els.autoToggle) els.autoToggle.checked = state.autoplay;
}

// Toggle handler for autoplay
function wireAutoplayToggle(){
  if(!els.autoToggle) return;
  els.autoToggle.addEventListener("change", () => {
    state.autoplay = els.autoToggle.checked;
    localStorage.setItem("bear_down_autoplay", String(state.autoplay));
    showToast(state.autoplay ? "Auto play: ON" : "Auto play: OFF", "ok");
  });
}

// Auto-advance when a track ends (if autoplay is ON)
function wireAudioEvents(){
  els.audio.addEventListener("ended", () => {
    if(!state.autoplay) return;
    const next = state.currentIndex + 1;
    if (next < state.files.length) {
      playByIndex(next);
    } else {
      // reached end — stop; do not loop
      showToast("End of list", "ok");
    }
  });

  // Optional: If an audio error occurs, try advancing (or show a toast)
  els.audio.addEventListener("error", () => {
    showToast("Audio error on current file", "err");
    if(state.autoplay){
      const next = state.currentIndex + 1;
      if(next < state.files.length) playByIndex(next);
    }
  });
}

els.connect.addEventListener("click", connect);
restore();
wireAutoplayToggle();
wireAudioEvents();
