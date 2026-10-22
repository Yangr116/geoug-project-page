const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const videos = [...document.querySelectorAll('video')];
let motionEnabled = !reducedMotion.matches;
const visibleVideos = new Set();
const manualPauses = new Set();
const autoPauses = new WeakSet();
function loadVideo(video) {
  if (video.dataset.lazy) {video.preload='metadata';delete video.dataset.lazy;video.load();}
}
function playVideo(video) {loadVideo(video);video.play().catch(()=>{});}
function pauseAutomatically(video) {
  if (!video.paused) {autoPauses.add(video);video.pause();}
}
videos.forEach(video=>{
  video.autoplay=false;
  video.loop=true;
  video.muted=true;
  if(!motionEnabled)pauseAutomatically(video);
  video.addEventListener('pause',()=>{
    if(autoPauses.has(video))autoPauses.delete(video);
    else if(!video.ended)manualPauses.add(video);
  });
  video.addEventListener('play',()=>manualPauses.delete(video));
  video.addEventListener('pointerdown',()=>loadVideo(video),{once:true});
  video.addEventListener('keydown',()=>loadVideo(video),{once:true});
});
const loader=new IntersectionObserver(entries=>entries.forEach(entry=>{
 if(entry.isIntersecting){loadVideo(entry.target);loader.unobserve(entry.target);}
}),{rootMargin:'200px'});
videos.forEach(video=>loader.observe(video));
const visibility=new IntersectionObserver(entries=>entries.forEach(entry=>{
 const video=entry.target;
 if(entry.isIntersecting){visibleVideos.add(video);if(motionEnabled&&!manualPauses.has(video)&&!document.hidden)playVideo(video);}
 else{visibleVideos.delete(video);pauseAutomatically(video);}
}),{threshold:0.25});
videos.forEach(video=>visibility.observe(video));
document.addEventListener('visibilitychange',()=>{
 if(document.hidden)videos.forEach(pauseAutomatically);
 else if(motionEnabled)visibleVideos.forEach(video=>{if(!manualPauses.has(video))playVideo(video);});
});
const motionButton=document.getElementById('motion-toggle');
function updateMotionButton(){motionButton.textContent=motionEnabled?'Pause animations':'Play animations';motionButton.setAttribute('aria-pressed',String(!motionEnabled));}
motionButton.addEventListener('click',()=>{
 motionEnabled=!motionEnabled;
 if(!motionEnabled)videos.forEach(pauseAutomatically);
 else{manualPauses.clear();visibleVideos.forEach(playVideo);}
 updateMotionButton();
});
reducedMotion.addEventListener('change',event=>{motionEnabled=!event.matches;if(!motionEnabled)videos.forEach(pauseAutomatically);else visibleVideos.forEach(playVideo);updateMotionButton();});
updateMotionButton();
document.querySelectorAll('[data-time]').forEach(button=>button.addEventListener('click',()=>{
 const video=document.getElementById(button.dataset.video);
 const seek=()=>{video.currentTime=Number(button.dataset.time);manualPauses.delete(video);playVideo(video);};
 loadVideo(video);
 if(video.readyState>=1)seek();else video.addEventListener('loadedmetadata',seek,{once:true});
}));
const reasoningVideo=document.getElementById('reasoning-video');
reasoningVideo.addEventListener('timeupdate',()=>{
 const buttons=[...document.querySelectorAll('[data-time]')];
 const active=buttons.filter(b=>Number(b.dataset.time)<=reasoningVideo.currentTime).at(-1);
 buttons.forEach(b=>{b.classList.toggle('active',b===active);if(b===active)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
});
const comparisons=[{name:'Direct',acc:[91.4,75.4,71.7],gen:[0,0,0]},{name:'Always-generate',acc:[97.4,91.3,94.9],gen:[100,100,100]},{name:'GeoUG',acc:[97.9,90.8,94.2],gen:[50.3,67.4,72.4]}];

const chartRoot=document.getElementById('comparison-charts');
['CV-Bench-3D','3DCueBench','DA-2K'].forEach((dataset,index)=>{
 const panel=document.createElement('section');panel.className='dataset-chart';
 const title=document.createElement('h4');title.textContent=dataset;panel.append(title);
 comparisons.forEach(model=>{
  const row=document.createElement('div');row.className='chart-row';
  const name=document.createElement('span');name.textContent=model.name;row.append(name);
  const bars=document.createElement('div');
  ['acc','gen'].forEach(type=>{
   const value=model[type][index];const line=document.createElement('div');line.className='bar-line';
   line.setAttribute('aria-label',`${model.name}, ${type==='acc'?'circular accuracy':'generation rate'}: ${value}%`);
   const track=document.createElement('div');track.className='bar-track';
   const bar=document.createElement('div');bar.className=`bar ${type==='gen'?'gen':''}`;bar.style.width=`${value}%`;track.append(bar);
   const text=document.createElement('b');text.textContent=`${value.toFixed(1)}%`;line.append(track,text);bars.append(line);
  });row.append(bars);panel.append(row);
 });chartRoot.append(panel);
});

// Keep each input/baseline/output comparison together while sliding horizontally.
const carousel=document.querySelector('.comparison-carousel');
const track=carousel.querySelector('.carousel-track');
const slides=[...carousel.querySelectorAll('.comparison-slide')];
const carouselPause=document.getElementById('comparison-pause');
let slideIndex=0, slideDirection=1, carouselPaused=false, carouselVisible=false;
let nextSlideAt=Date.now()+2000;
function showComparison(index){
 slideIndex=(index+slides.length)%slides.length;
 track.style.transform=`translateX(-${slideIndex*100}%)`;
 document.getElementById('comparison-count').textContent=`${String(slideIndex+1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;
 slides.forEach((slide,i)=>slide.setAttribute('aria-hidden',String(i!==slideIndex)));
 nextSlideAt=Date.now()+2000;
}
function setCarouselPaused(paused){
 carouselPaused=paused;
 carouselPause.textContent=paused?'Play slideshow':'Pause slideshow';
 carouselPause.setAttribute('aria-pressed',String(paused));
 nextSlideAt=Date.now()+2000;
}
document.getElementById('comparison-prev').addEventListener('click',()=>{showComparison(slideIndex-1);setCarouselPaused(true);});
document.getElementById('comparison-next').addEventListener('click',()=>{showComparison(slideIndex+1);setCarouselPaused(true);});
carousel.querySelector('.carousel-viewport').addEventListener('click',()=>setCarouselPaused(true));
carouselPause.addEventListener('click',()=>setCarouselPaused(!carouselPaused));
new IntersectionObserver(entries=>{
 carouselVisible=entries[0].isIntersecting;nextSlideAt=Date.now()+2000;
},{threshold:0.35}).observe(carousel);
setInterval(()=>{
 if(!motionEnabled||carouselPaused||!carouselVisible||document.hidden){nextSlideAt=Date.now()+2000;return;}
 if(Date.now()<nextSlideAt)return;
 if(slideIndex===slides.length-1)slideDirection=-1;
 if(slideIndex===0)slideDirection=1;
 showComparison(slideIndex+slideDirection);
},500);
showComparison(0);


// Quiet, non-modal contents: revealed by scrolling or keyboard focus.
const contentsPanel=document.querySelector('.page-toc');
const tocLinks=[...contentsPanel.querySelectorAll('a')];
let contentsTimer;
function updateContents(){
 let active=tocLinks[0];
 tocLinks.forEach(link=>{const target=document.querySelector(link.hash);if(target&&target.getBoundingClientRect().top<=180)active=link;});
 tocLinks.forEach(link=>{if(link===active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
}
window.addEventListener('scroll',()=>{
 updateContents();
 contentsPanel.classList.toggle('scroll-visible',scrollY>160);
 clearTimeout(contentsTimer);
 contentsTimer=setTimeout(()=>contentsPanel.classList.remove('scroll-visible'),1600);
},{passive:true});
window.addEventListener('resize',updateContents);
updateContents();

const reasonCarousel=document.querySelector('.reasoning-carousel');
const reasonCards=[...reasonCarousel.querySelectorAll('.reasoning-case')];
let reasonIndex=0,reasonPaused=false,reasonVisible=false,reasonNext=Date.now()+2000;
function showReason(index){
 reasonIndex=(index+reasonCards.length)%reasonCards.length;
 reasonCarousel.querySelector('.reasoning-track').style.transform=`translateX(-${reasonIndex*100}%)`;
 reasonCards.forEach((card,i)=>{card.setAttribute('aria-hidden',String(i!==reasonIndex));card.inert=i!==reasonIndex;});
 document.getElementById('reasoning-count').textContent=`${String(reasonIndex+1).padStart(2,'0')} / ${String(reasonCards.length).padStart(2,'0')}`;
}
function pauseReason(paused){reasonPaused=paused;const b=document.getElementById('reasoning-pause');b.textContent=paused?'Play slideshow':'Pause slideshow';b.setAttribute('aria-pressed',String(paused));reasonNext=Date.now()+2000;}
document.getElementById('reasoning-prev').addEventListener('click',()=>{pauseReason(true);showReason(reasonIndex-1);});
document.getElementById('reasoning-next').addEventListener('click',()=>{pauseReason(true);showReason(reasonIndex+1);});
document.getElementById('reasoning-pause').addEventListener('click',()=>pauseReason(!reasonPaused));
reasonCarousel.querySelector('.reasoning-viewport').addEventListener('click',()=>pauseReason(true));
new IntersectionObserver(entries=>{reasonVisible=entries[0].isIntersecting;reasonNext=Date.now()+2000;},{threshold:.2}).observe(reasonCarousel);
setInterval(()=>{if(!motionEnabled||reasonPaused||!reasonVisible||document.hidden){reasonNext=Date.now()+2000;return;}if(Date.now()>=reasonNext){showReason(reasonIndex+1);reasonNext=Date.now()+2000;}},200);
showReason(0);

// One progressive diagram: draft first, then choose one of two paths.
const draftFlow=document.querySelector('.draft-flow');
let flowVisible=false,flowPhase=0;
new IntersectionObserver(entries=>{flowVisible=entries[0].isIntersecting;},{threshold:.3}).observe(draftFlow);
function paintFlow(){
 const steps=['input','draft','decide'];
 steps.forEach((name,i)=>draftFlow.querySelector(`[data-flow="${name}"]`).classList.toggle('flow-active',flowPhase>=i));
 draftFlow.querySelector('[data-flow="direct"]').classList.toggle('flow-active',flowPhase===3);
 draftFlow.querySelector('[data-flow="generate"]').classList.toggle('flow-active',flowPhase===4);
}
paintFlow();
setInterval(()=>{if(!motionEnabled||!flowVisible||document.hidden)return;flowPhase=(flowPhase+1)%6;paintFlow();},1400);

// Crisp HTML labels track the real video timeline (including scrubbing/pausing).
const showcaseVideo=document.getElementById('hero-orbit');
const showcaseStages=[
 [0,'IMAGE + INSTRUCTION','One scene. Multiple geometric tasks.',''],
 [1.5,'DEPTH GENERATION','Recover the geometry behind the image.','RGB → metric depth'],
 [4.4,'MMDC · THREE-CHANNEL REPRESENTATION','Metric depth through the image interface.','Fixed scales: 2 m · 8 m · 32 m'],
 [5.9,'MMDC · DECODE','Recover depth in metres.','Three channels → metric depth'],
 [6.65,'GEOMETRY','Locate objects in 3D.','Reconstruction from generated depth'],
 [12.3,'SPATIAL REASONING','Which object is closer to the head?','Measure the folding chair and blue light'],
 [15.3,'MEASURE → REVISE','Answer: the folding chair.','Chair 3.82 m · Blue light 6.85 m'],
 [17.95,'EXO → EGO GENERATION','Generate a first-person view from the original image.','Input: third-person image · Target: the pianist’s viewpoint'],
 [23.25,'COMPOSE TASKS · EGO → DEPTH','Use the generated ego image as the next input.','Generated ego → predicted depth → 3D reconstruction'],
 [25.25,'EXO + GENERATED EGO','Expand the scene across viewpoints.','Illustrative alignment · Original surfaces + generated-view geometry'],
 [32.5,'IMAGE + INSTRUCTION','One scene. Multiple geometric tasks.','']
];
function updateShowcase(){
 const stage=showcaseStages.filter(s=>s[0]<=showcaseVideo.currentTime).at(-1);
 document.getElementById('showcase-task').textContent=stage[1];
 document.getElementById('showcase-result').textContent=stage[2];
 document.getElementById('showcase-detail').textContent=stage[3];
 document.querySelector('.showcase-points').hidden=showcaseVideo.currentTime>=1.5;
 const t=showcaseVideo.currentTime;
 document.querySelector('.ego-context').hidden=!(t>=17.95&&t<25.25);
 const outputLabel=document.querySelector('.ego-output-label');
 outputLabel.hidden=!(t>=17.95&&t<25.25);
 outputLabel.textContent=t<23.25?'OUTPUT · GENERATED FIRST-PERSON VIEW':'GENERATED EGO → PREDICTED DEPTH';
}
showcaseVideo.addEventListener('timeupdate',updateShowcase);
showcaseVideo.addEventListener('loadedmetadata',updateShowcase);updateShowcase();
