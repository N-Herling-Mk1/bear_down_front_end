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
  toast:   $("#toast")
};

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

function renderList(base, files, root){
  els.table.innerHTML = "";
  els.root.textContent = root;
  els.count.textContent = files.length;

  files.forEach(f => {
    const tr = els.rowTpl.content.firstElementChild.cloneNode(true);
    tr.querySelector(".name").textContent = f.path;
    tr.querySelector(".size").textContent = human(f.size);
    tr.querySelector(".play").addEventListener("click", () => {
      const url = new URL("/stream/" + encodeURI(f.path), base).toString();
      els.audio.src = url;
      els.audio.play().catch(()=>{});
      els.now.textContent = f.path;
      els.download.href = url;
      els.download.download = f.name || f.path.split("/").pop();
      els.player.classList.remove("hidden");
    });
    els.table.appendChild(tr);
  });

  els.list.classList.remove("hidden");
  els.info.classList.remove("hidden");
}

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

function restore(){
  const saved = localStorage.getItem("bear_down_backend");
  if(saved) els.backend.value = saved;
  else els.backend.value = "https://localhost:8443";
}

els.connect.addEventListener("click", connect);
restore();
