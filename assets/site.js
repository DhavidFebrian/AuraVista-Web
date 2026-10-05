const brief=document.getElementById('project-brief');
const inquiry=document.getElementById('inquiry-link');
const inquiryStatus=document.getElementById('inquiry-status');
brief.addEventListener('input',()=>{inquiry.hidden=true;inquiry.removeAttribute('href');inquiryStatus.textContent='';});
brief.addEventListener('submit',event=>{
 event.preventDefault();
 for(const field of brief.querySelectorAll('[required]')){field.value=field.value.trim();}
 if(!brief.reportValidity())return;
 const data=new FormData(brief);
 const message=`Hello Aura Vista Media, I’d like to discuss a project.\n\nName: ${data.get('name')}\nLocation: ${data.get('location')}\nService: ${data.get('service')}\n\n${data.get('details')}`;
 inquiry.href='https://wa.me/6285169671344?text='+encodeURIComponent(message);
 inquiry.hidden=false;inquiryStatus.textContent='Your brief is ready. Continue to WhatsApp to review and send.';
});
const toggle=document.getElementById('navigation-toggle');
const navigation=document.getElementById('mobile-navigation');
function closeNavigation(){navigation.hidden=true;toggle.setAttribute('aria-expanded','false');}
toggle.addEventListener('click',()=>{navigation.hidden=!navigation.hidden;toggle.setAttribute('aria-expanded',String(!navigation.hidden));});
navigation.addEventListener('click',event=>{if(event.target.closest('a'))closeNavigation();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!navigation.hidden){closeNavigation();toggle.focus();}});
document.addEventListener('click',event=>{if(!event.target.closest('header'))closeNavigation();});
