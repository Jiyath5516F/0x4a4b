// API layer: GitHub + simple cache + optional token + localStorage fallback
const GITHUB_USER = "Jiyath5516F";
const cache = new Map();

function ghHeaders(){
  const token = localStorage.getItem('gh_token');
  const h = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };
  if(token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

function readLS(key){
  try{ const raw = localStorage.getItem(key); if(!raw) return null; return JSON.parse(raw); }catch{ return null; }
}
function writeLS(key, data){
  try{ localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); }catch{}
}

async function fetchJSON(url, opts = {}){
  const key = url;
  if(cache.has(key)) return cache.get(key);
  const lsKey = `ghcache:${key}`;
  try{
    const res = await fetch(url, { headers: ghHeaders(), ...opts });
    if(!res.ok){
      // If rate limited (403) or any error, try localStorage cache within 24h
      const body = await res.text().catch(()=>"");
      const stored = readLS(lsKey);
      if(stored && (Date.now() - stored.ts) < 24*60*60*1000) return stored.data;
      throw new Error(`HTTP ${res.status} for ${url}${body?` — ${body}`:''}`);
    }
    const data = await res.json();
    cache.set(key, data);
    writeLS(lsKey, data);
    return data;
  }catch(err){
    const stored = readLS(lsKey);
    if(stored && (Date.now() - stored.ts) < 24*60*60*1000) return stored.data;
    throw err;
  }
}

export async function getProfile(){
  return fetchJSON(`https://api.github.com/users/${GITHUB_USER}`);
}

export async function getRepos(){
  // includes forks=false by client-side filter; GitHub API v3 returns 30/page by default
  const repos = await fetchJSON(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`);
  return repos.filter(r => !r.archived);
}

export function scoreRepoPopular(repo){
  // Hotness score: stars (3x) + watchers (2x) + forks (2x) + recent push recency + issues
  const stars = repo.stargazers_count || 0;
  const watchers = repo.watchers_count || 0;
  const forks = repo.forks_count || 0;
  const issues = repo.open_issues_count || 0;
  const pushedAt = new Date(repo.pushed_at).getTime();
  const ageDays = (Date.now() - pushedAt) / (1000*60*60*24);
  const recencyBoost = Math.max(0, 60 - ageDays) / 60; // 0..1 if updated within ~2 months
  return stars*3.2 + watchers*2 + forks*1.8 + issues*0.4 + recencyBoost*6;
}

export function scoreRepoHot(repo){
  // Alias for scoreRepoPopular for backward compatibility
  return scoreRepoPopular(repo);
}

export function scoreRepoClean(repo){
  // Alternative score: prioritize recent activity and description presence; fewer forks
  const descBonus = repo.description ? 2 : 0;
  const pushedAt = new Date(repo.pushed_at).getTime();
  const ageDays = (Date.now() - pushedAt) / (1000*60*60*24);
  const recency = Math.max(0, 120 - ageDays) / 120 * 10;
  return (repo.stargazers_count||0) + recency + descBonus;
}
