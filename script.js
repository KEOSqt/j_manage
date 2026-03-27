/* ====== Simple Worker Manager (localStorage + CSV) ====== */

const LS_KEY = 'wm_workers_v1';

let state = {
  workers: loadWorkers(),
  sortKey: 'name',
  sortDir: 'asc',
  page: 1,
  rowsPerPage: 10,
  filters: { q: '', jobType: '', status: '' }
};

/* ---------- Helpers ---------- */
function uid(){ return Math.random().toString(36).slice(2,10); }
function loadWorkers(){
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
  catch(e){ return []; }
}
function saveWorkers(){
  localStorage.setItem(LS_KEY, JSON.stringify(state.workers));
  render();
}

function currency(n){
  if (n === '' || n === undefined || n === null) return '';
  return Number(n).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2});
}

function chipStatus(s){
  const map = { 'Active':'green', 'On Leave':'amber', 'Inactive':'red' };
  return `<span class="chip ${map[s]||''}">${s||''}</span>`;
}

/* ---------- Rendering ---------- */
function getFiltered(){
  const {q, jobType, status} = state.filters;
  const ql = q.trim().toLowerCase();
  return state.workers.filter(w=>{
    const okQ = !ql || [w.name,w.phone,w.nationalId,w.address].some(v=> (v||'').toLowerCase().includes(ql));
    const okJ = !jobType || w.jobType === jobType;
    const okS = !status || w.status === status;
    return okQ && okJ && okS;
  });
}
function sortBy(arr, key, dir){
  return arr.sort((a,b)=>{
    const va = (a[key] ?? '').toString().toLowerCase();
    const vb = (b[key] ?? '').toString().toLowerCase();
    if (va < vb) return dir === 'asc' ? -1 : 1;
    if (va > vb) return dir === 'asc' ? 1 : -1;
    return 0;
  });
}
function paginate(arr){
  const per = state.rowsPerPage;
  const totalPages = Math.max(1, Math.ceil(arr.length / per));
  state.page = Math.min(state.page, totalPages);
  const start = (state.page - 1) * per;
  return { slice: arr.slice(start, start + per), totalPages };
}

function renderKPIs(){
  const total = state.workers.length;
  const active = state.workers.filter(w=> w.status==='Active').length;
  const leave = state.workers.filter(w=> w.status==='On Leave').length;
  const dailyCost = state.workers
    .filter(w=> w.status==='Active')
    .reduce((s,w)=> s + (Number(w.dailyWage)||0), 0);
  $('#kpiTotal').textContent = total;
  $('#kpiActive').textContent = active;
  $('#kpiLeave').textContent = leave;
  $('#kpiDailyCost').textContent = currency(dailyCost) + ' TND';
}

function renderTable(){
  const tbody = $('#tbody');
  const arr = getFiltered();
  sortBy(arr, state.sortKey, state.sortDir);
  const { slice, totalPages } = paginate(arr);

  tbody.innerHTML = slice.map(w=> `
    <tr>
      <td>${escapeHtml(w.name)}</td>
      <td class="hide-sm">${escapeHtml(w.phone||'')}</td>
      <td>${escapeHtml(w.jobType||'')}</td>
      <td class="hide-sm">${w.dailyWage!==''? currency(w.dailyWage)+' TND':''}</td>
      <td class="hide-md">${escapeHtml(w.nationalId||'')}</td>
      <td>${chipStatus(w.status||'')}</td>
      <td style="text-align:right">
        <button class="btn" onclick="onEdit('${w.id}')">Edit</button>
        <button class="btn" onclick="onDelete('${w.id}')">Delete</button>
      </td>
    </tr>
  `).join('');

  $('#pageInfo').textContent = `Page ${state.page} / ${totalPages}`;
  $('#prevPage').disabled = state.page<=1;
  $('#nextPage').disabled = state.page>=totalPages;
}
function render(){ renderKPIs(); renderTable(); }

/* ---------- DOM utils ---------- */
function $(sel, ctx=document){ return ctx.querySelector(sel); }
function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }

/* ---------- Modal (Add/Edit) ---------- */
const modal = $('#modal');
const frm = $('#frm');
$('#btnAdd').addEventListener('click', ()=> openModal());
$('#closeModal').addEventListener('click', ()=> modal.close());
$('#btnCancel').addEventListener('click', ()=> modal.close());

function openModal(worker=null){
  frm.reset();
  frm.id.value = worker?.id || '';
  $('#modalTitle').textContent = worker ? 'Edit Worker' : 'Add Worker';
  if (worker){
    frm.name.value = worker.name || '';
    frm.phone.value = worker.phone || '';
    frm.nationalId.value = worker.nationalId || '';
    frm.jobType.value = worker.jobType || '';
    frm.dailyWage.value = worker.dailyWage ?? '';
    frm.status.value = worker.status || 'Active';
    frm.address.value = worker.address || '';
    frm.notes.value = worker.notes || '';
  } else {
    frm.status.value = 'Active';
  }
  if (typeof modal.showModal === 'function') modal.showModal();
  else modal.setAttribute('open','');
}

frm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const data = Object.fromEntries(new FormData(frm).entries());
  // Basic validation
  if(!data.name || !data.phone || !data.jobType || !data.dailyWage){
    alert('Please fill all required fields (Name, Phone, Job Type, Daily Wage).');
    return;
  }
  data.dailyWage = Number(data.dailyWage);

  if (data.id){ // update
    const idx = state.workers.findIndex(x=> x.id === data.id);
    if (idx > -1) state.workers[idx] = {...state.workers[idx], ...data};
  } else { // create
    data.id = uid();
    state.workers.unshift(data);
  }
  saveWorkers();
  modal.close();
});

/* ---------- Edit / Delete ---------- */
window.onEdit = function(id){
  const w = state.workers.find(x=> x.id === id);
  if (w) openModal(w);
};
window.onDelete = function(id){
  if (!confirm('Delete this worker?')) return;
  state.workers = state.workers.filter(x=> x.id !== id);
  saveWorkers();
};

/* ---------- Sorting ---------- */
document.querySelectorAll('th[data-sort]').forEach(th=>{
  th.addEventListener('click', ()=>{
    const key = th.getAttribute('data-sort');
    if (state.sortKey === key){ state.sortDir = state.sortDir==='asc'?'desc':'asc'; }
    else { state.sortKey = key; state.sortDir = 'asc'; }
    renderTable();
  });
});

/* ---------- Filters & Pagination ---------- */
$('#search').addEventListener('input', e=>{ state.filters.q = e.target.value; state.page=1; renderTable(); });
$('#filterJob').addEventListener('change', e=>{ state.filters.jobType = e.target.value; state.page=1; renderTable(); });
$('#filterStatus').addEventListener('change', e=>{ state.filters.status = e.target.value; state.page=1; renderTable(); });
$('#rowsPerPage').addEventListener('change', e=>{ state.rowsPerPage = Number(e.target.value); state.page=1; renderTable(); });
$('#prevPage').addEventListener('click', ()=>{ if(state.page>1){ state.page--; renderTable(); }});
$('#nextPage').addEventListener('click', ()=>{ state.page++; renderTable(); });

/* ---------- Export / Import / Print ---------- */
$('#btnExport').addEventListener('click', ()=>{
  const headers = ['id','name','phone','jobType','dailyWage','nationalId','status','address','notes'];
  const rows = [headers.join(',')].concat(state.workers.map(w=> headers.map(h=>{
    const val = (w[h] ?? '').toString().replace(/"/g,'""');
    return /[,"\n]/.test(val) ? `"${val}"` : val;
  }).join(',')));
  const blob = new Blob([rows.join('\n')], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `workers_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
});

$('#fileImport').addEventListener('change', async (e)=>{
  const file = e.target.files[0];
  if (!file) return;
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter(Boolean);
  const headers = lines.shift().split(',').map(h=>h.trim());
  const arr = lines.map(line=>{
    const cells = parseCsvLine(line);
    const obj = {};
    headers.forEach((h,i)=> obj[h] = cells[i] ?? '');
    if (!obj.id) obj.id = uid();
    if (obj.dailyWage!=='') obj.dailyWage = Number(obj.dailyWage);
    return obj;
  });
  if (!confirm(`Import ${arr.length} workers? This will replace current list.`)) return;
  state.workers = arr;
  saveWorkers();
  e.target.value = '';
});

function parseCsvLine(line){
  // Simple CSV parser for our controlled export format
  const out=[]; let cur=''; let inQ=false;
  for(let i=0;i<line.length;i++){
    const ch=line[i], nxt=line[i+1];
    if (inQ){
      if (ch === '"' && nxt === '"'){ cur+='"'; i++; }
      else if (ch === '"'){ inQ=false; }
      else cur+=ch;
    } else {
      if (ch === ','){ out.push(cur); cur=''; }
      else if (ch === '"'){ inQ=true; }
      else cur+=ch;
    }
  }
  out.push(cur);
  return out;
}

$('#btnPrint').addEventListener('click', ()=> window.print());

/* ---------- Demo data (optional) ---------- */
if (state.workers.length === 0){
  state.workers = [
    {id:uid(), name:'Ahmed Ben Salah', phone:'55 123 456', jobType:'Mason', dailyWage:50, nationalId:'C1234567', status:'Active', address:'Monastir', notes:''},
    {id:uid(), name:'Hatem Gharbi', phone:'21 987 654', jobType:'Electrician', dailyWage:65, nationalId:'B7654321', status:'On Leave', address:'Sousse', notes:'Family leave'},
    {id:uid(), name:'Lotfi Jlassi', phone:'99 222 333', jobType:'Laborer', dailyWage:40, nationalId:'A1112223', status:'Active', address:'Mahdia', notes:''}
  ];
  saveWorkers(); // will trigger render()
} else {
  render();
}