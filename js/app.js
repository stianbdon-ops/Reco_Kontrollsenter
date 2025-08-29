
const views={'#/dashboard':document.getElementById('view-dashboard'),'#/status':document.getElementById('view-status')};
function route(){ Object.values(views).forEach(v=>v&&(v.style.display='none')); const h=location.hash||'#/dashboard'; (views[h]||views['#/dashboard']).style.display='block'; document.querySelectorAll('nav a').forEach(a=>{a.classList.remove('active'); if(a.getAttribute('href')===h)a.classList.add('active');});}
window.addEventListener('hashchange',route); route();

const overlay=document.getElementById('loginOverlay');
const btnOverlay=document.getElementById('btnOverlayLogin');
const userBadge=document.getElementById('userBadge');

btnOverlay.onclick=()=> window.netlifyIdentity && netlifyIdentity.open('login');

function applyUser(u){
  if(!u){ overlay.style.display='flex'; userBadge.textContent='Ikke innlogget'; }
  else { overlay.style.display='none'; userBadge.textContent=u.email; }
}

function addCheck(ok, msg){ const div=document.createElement('div'); div.className='badge '+(ok?'ok':'err'); div.textContent=(ok?'✓ ':'✗ ')+msg; document.getElementById('checkList').appendChild(div); }

function selfTest(){
  addCheck(location.protocol==='https:','HTTPS');
  addCheck(!!window.netlifyIdentity,'Netlify Identity script lastet');
  if(window.netlifyIdentity){
    netlifyIdentity.on('init', u=> applyUser(u));
    netlifyIdentity.on('login', u=>{ applyUser(u); netlifyIdentity.close(); });
    netlifyIdentity.on('logout', ()=> applyUser(null));
    try{ netlifyIdentity.init(); addCheck(true,'Identity init() kalt'); }catch(e){ addCheck(false,'Identity init feilet'); }
  }
}
selfTest();
