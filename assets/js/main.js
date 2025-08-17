import { getProfile, getRepos, scoreRepoPopular, scoreRepoClean } from './api.js';
import { el, mount, clear, tag, formatNumber, formatDate } from './ui.js';

const skills = [
  'Web','Software','AI/ML','IoT','Embedded','Minecraft Modding','JavaScript','Python','C/C++','Node.js'
];

function renderSkills(){
  const ul = document.getElementById('skills-list');
  if (!ul) return; // Prevent error if skills-list is missing
  skills.forEach(s => ul.append(tag(s)));
}

function projectCard(repo){
  const topics = (repo.topics||[]).slice(0,3);
  const lang = repo.language ? el('span', { class:'badge'}, [repo.language]) : null;
  return el('article', { class:'project-card', role:'article' }, [
    el('div', { class:'meta'}, [
      el('span', { class:'badge'}, ['★ ', formatNumber(repo.stargazers_count||0)]),
      el('span', { class:'badge'}, ['⑂ ', formatNumber(repo.forks_count||0)]),
      el('span', { class:'badge'}, ['◈ ', formatDate(repo.pushed_at)]),
      lang
    ]),
    el('h3', {}, [repo.name]),
    el('p', { class:'lede'}, [repo.description || 'No description']),
    topics.length ? el('div', { class:'tags'}, topics.map(t => tag(t))) : null,
    el('div', { class:'actions'}, [
      el('a', { class:'btn', href: repo.html_url, target:'_blank', rel:'noopener'}, ['Source'])
    ])
  ]);
}

function renderProjects(repos, usePopular=true){
  const grid = document.getElementById('projects-grid');
  if(!grid) return; // Not present on blogs page
  clear(grid);
  const sorter = usePopular ? scoreRepoPopular : scoreRepoClean;
  const sorted = [...repos]
    .filter(r => !r.fork)
    .sort((a,b) => sorter(b) - sorter(a))
    .slice(0,5);
  sorted.forEach(r => mount(grid, projectCard(r)));
}

function showProjectSkeletons(n=5){
  const grid = document.getElementById('projects-grid');
  if(!grid) return;
  clear(grid);
  for(let i=0;i<n;i++){
    const card = el('article', { class:'project-card' }, [
      el('div', { class:'meta'}, [
        el('span', { class:'badge skeleton', style:'width:60px;height:28px' }),
        el('span', { class:'badge skeleton', style:'width:60px;height:28px' }),
        el('span', { class:'badge skeleton', style:'width:110px;height:28px' })
      ]),
      el('div', { class:'skeleton', style:'height:20px;width:60%;margin-top:6px;border-radius:6px' }),
      el('div', { class:'skeleton', style:'height:14px;width:90%;margin-top:6px;border-radius:6px' }),
      el('div', { class:'skeleton', style:'height:14px;width:80%;margin-top:6px;border-radius:6px' })
    ]);
    mount(grid, card);
  }
}

async function hydrateProfile(){
  showProjectSkeletons(5);
  const profile = await getProfile();
  
  // Add null checks for elements that might not exist on all pages
  const devNameEl = document.getElementById('dev-name');
  const locationEl = document.getElementById('location');
  const avatarEl = document.getElementById('avatar');
  
  if (devNameEl) devNameEl.textContent = profile.name || 'Mohamed Jiyath Khan';
  if (locationEl) locationEl.textContent = profile.location || '—';
  if (avatarEl) avatarEl.src = profile.avatar_url;
}

function renderExperience(){
  const wrap = document.getElementById('experience-timeline');
  if (!wrap) return; // Prevent error if experience-timeline is missing
  
  const data = [
  { when:'2024 — Present', what:'Hobby Developer', where:'Independent', notes:'Web, Software, AI/ML, IoT, Embedded, and Minecraft modding.' },
    // You can update/extend
  ];
  data.forEach(item => {
    const row = el('div', { class:'timeline-item'}, [
      el('div', { class:'when'}, [item.when]),
      el('div', { class:'what'}, [
        el('div', { class:'strong'}, [`${item.what} · ${item.where}`]),
        el('div', { class:'muted'}, [item.notes])
      ])
    ]);
    mount(wrap, row);
  });
}

function initSortToggle(repos){
  const toggle = document.getElementById('sort-toggle');
  const label = document.getElementById('sort-label');
  if(!toggle || !label) return;
  toggle.addEventListener('change', () => {
    const usePopular = !toggle.checked; // default Popular when unchecked
    label.textContent = `Sort: ${usePopular ? 'Popular' : 'Recent'}`;
    renderProjects(repos, usePopular);
  });
}

function initActiveNav(){
  const links = Array.from(document.querySelectorAll('.nav a'));
  const map = links.map(a => ({ id: a.getAttribute('href').slice(1), el:a }));
  function setActive(id){
    for(const l of links) l.classList.remove('active');
    const t = map.find(m => m.id===id); if(t) t.el.classList.add('active');
  }
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if(e.isIntersecting) setActive(e.target.id); });
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0.01 });
  ['about','experience','projects','contact'].forEach(id => {
    const sec = document.getElementById(id); if(sec) obs.observe(sec);
  });
}

function initReveal(){
  const els = document.querySelectorAll('.reveal');
  const obs = new IntersectionObserver(entries => {
    for(const e of entries){ if(e.isIntersecting){ e.target.classList.add('visible'); obs.unobserve(e.target); } }
  }, { threshold: 0.1 });
  els.forEach(el => obs.observe(el));
}

function initTopButton(){
  const btn = document.getElementById('top-btn');
  if(!btn) return;
  window.addEventListener('scroll', () => {
    if(window.scrollY > 300) btn.classList.add('show'); else btn.classList.remove('show');
  });
  btn.addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth' }));
}

function initCopyEmail(){
  const btn = document.getElementById('copy-email');
  const email = document.getElementById('email-link');
  if(btn && email){
    btn.addEventListener('click', async () => {
      try{ await navigator.clipboard.writeText(email.href.replace('mailto:','')); btn.textContent='Copied!'; setTimeout(()=>btn.textContent='Copy email',1200);}catch{}
    });
  }
}

function initTheme(){
  const toggle = document.getElementById('theme-toggle');
  const label = document.getElementById('theme-label');
  const saved = localStorage.getItem('theme') || 'sand';
  const apply = (t)=>{
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('theme', t);
    if(label) label.textContent = t === 'sand' ? 'Light' : 'Dark';
    if(toggle) toggle.checked = (t === 'owl');
    const meta = document.querySelector('meta[name="theme-color"]');
    if(meta) meta.setAttribute('content', getComputedStyle(document.documentElement).getPropertyValue('--bg').trim());
    document.title = `Mohamed Jiyath Khan — 0x4a4b`;
    // Recolor particles to match theme text color
    try{
      const inst = (window.tsParticles && tsParticles.domItem(0));
      if(inst){
        const col = getComputedStyle(document.documentElement).getPropertyValue('--text').trim();
        inst.options.particles.color.value = col;
        inst.refresh();
      }
    }catch{}
  };
  apply(saved);
  if(toggle){ toggle.addEventListener('change', ()=> apply(toggle.checked ? 'owl' : 'sand')); }
}

function initMobileMenu(){
  const btn = document.getElementById('mobile-toggle');
  const nav = document.getElementById('primary-nav');
  if(!btn || !nav) return;
  btn.addEventListener('click', ()=>{
    const open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', ()=>{
    nav.classList.remove('open');
    btn.setAttribute('aria-expanded','false');
  }));
}

async function init(){
  renderSkills();
  renderExperience();
  const yearEl = document.getElementById('year'); if(yearEl) yearEl.textContent = new Date().getFullYear();
  initTheme();
  initMobileMenu();
  initActiveNav();
  initReveal();
  initTopButton();
  initCopyEmail();

  // Allow pages (like projects.html) to opt-out of homepage project hydrate
  // Also auto-skip if there's no projects grid in DOM (e.g., blogs.html)
  const skipProjects = (document.body && document.body.getAttribute('data-skip-projects') === 'true')
    || !document.getElementById('projects-grid');
  if(skipProjects) return;

  try{
    await hydrateProfile();
    const repos = await getRepos();
    initSortToggle(repos);
    renderProjects(repos, true);
    const grid = document.getElementById('projects-grid'); if(grid) grid.setAttribute('aria-busy','false');
  }catch(err){
    console.error(err);
    const grid = document.getElementById('projects-grid');
    if(grid){
      mount(grid, el('div', { class:'card'}, ['Could not load projects from GitHub right now.']));
      grid.setAttribute('aria-busy','false');
    }
  }
}

init();
