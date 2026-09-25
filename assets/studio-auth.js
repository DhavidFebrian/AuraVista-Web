(() => {
 let authorization='';
 window.studioFetch=(url,options={})=>{
  const target=new URL(url,location.origin);
  if(target.origin!==location.origin || !['/api/portfolio','/api/sync-theme'].includes(target.pathname))throw new Error('Invalid studio endpoint');
  return fetch(target,{...options,headers:{...options.headers,Authorization:authorization}});
 };
 window.initAuth=()=>{
  document.getElementById('login-view').classList.remove('hidden');
  document.getElementById('app-view').classList.add('hidden');
  window.lucide?.createIcons();
 };
 window.handleLogin=async event=>{
  event.preventDefault();
  const form=event.target,button=form.querySelector('[type="submit"]'),error=document.getElementById('login-error');
  const user=document.getElementById('login-username').value.trim(),field=document.getElementById('login-password');
  authorization='Basic '+btoa(Array.from(new TextEncoder().encode(user+':'+field.value),byte=>String.fromCharCode(byte)).join(''));
  button.disabled=true;error.classList.add('hidden');
  try{
   const response=await window.studioFetch('/api/portfolio');
   const data=await response.json();
   if(!response.ok||!data.success||!Array.isArray(data.items))throw new Error(data.error||'Studio tidak tersedia. Coba lagi.');
   field.value='';
   document.getElementById('login-view').classList.add('hidden');document.getElementById('app-view').classList.remove('hidden');
   currentPortfolioList=data.items;updateDashboardStats(data.items);renderPortfolioList();window.lucide?.createIcons();
  }catch(problem){authorization='';error.textContent=problem.message==='Failed to fetch'?'Koneksi gagal. Silakan coba lagi.':problem.message;error.classList.remove('hidden');}
  finally{button.disabled=false;}
 };
 window.handleLogout=()=>{authorization='';location.reload();};
})();
