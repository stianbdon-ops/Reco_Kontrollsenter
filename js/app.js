
import { jsPDF } from "jspdf";

// Router
const views={'#/dashboard':g('view-dashboard'),'#/kalkyle':g('view-kalkyle'),'#/rapport':g('view-rapport')};
function g(id){return document.getElementById(id)}
function to(h){Object.values(views).forEach(v=>v&&(v.style.display='none'));(views[h]||views['#/dashboard']).style.display='block';document.querySelectorAll('nav a').forEach(a=>a.classList.remove('active'));const act=document.querySelector(`nav a[href="${h}"]`);if(act)act.classList.add('active');if(location.hash!==h)location.hash=h;}
document.querySelectorAll('nav a').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();to(a.getAttribute('href'))}));
window.addEventListener('hashchange',()=>to(location.hash)); to(location.hash||'#/dashboard');

// Auth guard
const overlay=g('loginOverlay'), btnOverlay=g('btnOverlayLogin');
const userBadge=g('userBadge'), btnLogin=g('btnLogin'), btnLogout=g('btnLogout');
btnOverlay.onclick = ()=> window.netlifyIdentity && netlifyIdentity.open('login');
btnLogin.onclick   = ()=> window.netlifyIdentity && netlifyIdentity.open('login');
btnLogout.onclick  = ()=> window.netlifyIdentity && netlifyIdentity.logout();
function applyUser(u){
  if(!u){ overlay.style.display='flex'; userBadge.textContent='Ikke innlogget'; btnLogin.style.display=''; btnLogout.style.display='none'; }
  else { overlay.style.display='none'; const roles=(u.app_metadata&&u.app_metadata.roles)||[]; userBadge.textContent = u.email + (roles.length?' · '+roles.join(','):''); btnLogin.style.display='none'; btnLogout.style.display=''; }
}
function readyIdentity(fn,tries=40){ if(window.netlifyIdentity && netlifyIdentity.currentUser!==undefined){ try{fn();}catch(e){} return; } if(tries<=0){ console.warn('Identity ikke klar'); return;} setTimeout(()=>readyIdentity(fn,tries-1),150); }
readyIdentity(()=>{ netlifyIdentity.on('init', applyUser); netlifyIdentity.on('login', u=>{applyUser(u); netlifyIdentity.close();}); netlifyIdentity.on('logout', ()=>applyUser(null)); netlifyIdentity.init(); });

// Load demo ICC + materiell
const ICC=[]; const MAT={};
async function loadICC(){ const files=['katalog_maling.json','katalog_gips.json','katalog_gulv.json','katalog_membran.json']; for(const f of files){ try{ const j=await (await fetch('data/'+f)).json(); (j.posts||[]).forEach(p=> ICC.push(p)); }catch(e){} } }
async function loadMAT(){ try{ const j=await (await fetch('data/materiell.json')).json(); Object.assign(MAT,j); }catch(e){} }
function tokens(s){ return (s||'').toLowerCase().replace(/[^a-z0-9æøå ]/g,' ').split(/\s+/).filter(Boolean); }
function score(q, title){ const A=new Set(tokens(q)), B=new Set(tokens(title)); let i=0; A.forEach(t=>{if(B.has(t)) i++}); return i/Math.max(1, Math.max(A.size,B.size)); }
const iccStr=g('iccStruktur'), iccSearch=g('iccSearch'), iccList=g('iccList');
function rebuildICC(){ const st=iccStr.value, q=(iccSearch.value||'').toLowerCase(); const base=ICC.filter(p=>!st||p.struktur===st).sort((a,b)=> score(q,b.tittel)-score(q,a.tittel)); iccList.innerHTML=''; base.slice(0,400).forEach(p=>{ const opt=document.createElement('option'); opt.value=p.kode; opt.textContent=`${p.tittel} · ${p.struktur} · ${p.enhet} · ${p.prisArbeid} kr`; iccList.appendChild(opt); }); }

// Kalkyle Pro
const LINES=[]; const tb=document.querySelector('#tblK tbody');
const iWork=g('pWork'), iMat=g('pMat'), iVAT=g('pVAT');
function mapCat(title){ const s=(title||'').toLowerCase(); if(s.includes('mal')) return 'Maling'; if(s.includes('gips')) return 'Gips'; if(s.includes('parkett')||s.includes('laminat')||s.includes('gulv')) return 'Gulv'; return 'Tilbehør'; }
function matSelect(i, field, cat, cur){ const list=(MAT[cat]||[]).slice(0,200); const opts=['<option value="">(velg)</option>'].concat(list.map(it=>`<option value="${it.id}" ${it.id===cur?'selected':''}>${it.navn} · ${it.nobb||''} · ${it.pris} kr</option>`)); return `<select data-bind="${i}:${field}:${cat}">${opts.join('')}</select>`; }
function render(){ const W=(Number(iWork.value||0)/100)||0, M=(Number(iMat.value||0)/100)||0, VAT=(Number(iVAT.value||0)/100)||0; tb.innerHTML=''; let ex=0;
  LINES.forEach((ln,i)=>{ const cat=mapCat(ln.tittel); const find=(c,id)=> (MAT[c]||[]).find(x=>x.id===id); const unitMat=((ln.m1&&find(cat,ln.m1)?.pris)||0)+((ln.t2&&find('Tilbehør',ln.t2)?.pris)||0)+((ln.t3&&find('Tilbehør',ln.t3)?.pris)||0); const sW=(ln.mengde||0)*(ln.prisArbeid||0)*(1+W); const sM=(ln.mengde||0)*unitMat*(1+M); const line=sW+sM; ex+=line;
    const tr=document.createElement('tr'); tr.innerHTML=`<td>${i+1}</td><td><input data-i="${i}" data-k="rom" value="${ln.rom||''}"/></td><td>${ln.struktur||''}</td><td><input data-i="${i}" data-k="tittel" style="width:220px" value="${ln.tittel||''}"/></td><td>${ln.enhet||''}</td><td><input data-i="${i}" data-k="mengde" type="number" min="0" step="0.1" value="${ln.mengde||0}"/></td><td><input data-i="${i}" data-k="prisArbeid" type="number" min="0" step="0.01" value="${ln.prisArbeid||0}"/></td><td>${matSelect(i,'m1',cat, ln.m1||'')}</td><td>${matSelect(i,'t2','Tilbehør', ln.t2||'')}</td><td>${matSelect(i,'t3','Tilbehør', ln.t3||'')}</td><td>${sM.toFixed(2)}</td><td>${line.toFixed(2)}</td><td><button data-del="${i}" class="btn ghost">✕</button></td>`; tb.appendChild(tr); });
  g('sumEx').textContent=ex.toFixed(2); g('sumInc').textContent=(ex*(1+VAT)).toFixed(2);
  tb.querySelectorAll('input').forEach(inp=> inp.oninput=()=>{ const i=+inp.dataset.i,k=inp.dataset.k; LINES[i][k]=(k==='rom'||k==='tittel')?inp.value:Number(inp.value||0); render(); });
  tb.querySelectorAll('button[data-del]').forEach(b=> b.onclick=()=>{ const i=+b.dataset.del; LINES.splice(i,1); render(); });
  tb.querySelectorAll('select[data-bind]').forEach(sel=> sel.onchange=()=>{ const [i,field,cat]=sel.dataset.bind.split(':'); LINES[+i][field]=sel.value||''; render(); });
}
g('btnAddICC').onclick=()=>{ const code=g('iccList').value; const p=ICC.find(x=>x.kode===code); if(!p){ alert('Ingen treff'); return; } LINES.push({rom:'', struktur:p.struktur, tittel:p.tittel, enhet:p.enhet, prisArbeid:p.prisArbeid, mengde:1, m1:'', t2:'', t3:''}); render(); };

// Rapport (demo)
g('btnAnalyze').onclick=()=>{ const txt=(g('rapportText').value||'').trim(); const score=Math.min(100, Math.round(txt.length/2)); g('rapportResult').innerHTML=`<div class="badge">Score: ${score}%</div>`; };

// Eksport
g('btnExportPDF').onclick=()=>{ const doc=new jsPDF({unit:'pt',format:'a4'}); const W=595,H=842,M=36; doc.text('RECO Kalkyle', M, 40); let y=70; LINES.forEach((ln,i)=>{ doc.text(`${i+1}. ${ln.rom||''} – ${ln.tittel||''} (${ln.mengde||0})`, M, y); y+=14; if(y>H-60){ doc.addPage(); y=40; } }); doc.save('reco-prosjekt.pdf'); };
g('btnExportXLSX').onclick=()=>{ try{ const rows=[['Rom','Struktur','Tittel','Enhet','Mengde','Pris arbeid','Mat.sum','Linje']]; const Wm=Number(iWork.value||0)/100, Mm=Number(iMat.value||0)/100; const find=(c,id)=> (MAT[c]||[]).find(x=>x.id===id); LINES.forEach(ln=>{ const cat=mapCat(ln.tittel); const unitMat=((ln.m1&&find(cat,ln.m1)?.pris)||0)+((ln.t2&&find('Tilbehør',ln.t2)?.pris)||0)+((ln.t3&&find('Tilbehør',ln.t3)?.pris)||0); const sum=(ln.mengde||0)*(ln.prisArbeid||0)*(1+Wm)+(ln.mengde||0)*unitMat*(1+Mm); rows.push([ln.rom||'',ln.struktur||'',ln.tittel||'',ln.enhet||'',ln.mengde||0,ln.prisArbeid||0,unitMat||0,Number(sum.toFixed(2))]); }); const ws=XLSX.utils.aoa_to_sheet(rows); const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Kalkyle'); XLSX.writeFile(wb, 'reco-prosjekt.xlsx'); }catch(e){ alert('Klarte ikke eksportere til Excel (trenger nettilgang til SheetJS CDN).'); } };

// Init
(async()=>{ await loadICC(); await loadMAT(); rebuildICC(); })();
