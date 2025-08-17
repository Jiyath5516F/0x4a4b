// UI helpers: templating and DOM utilities
export function el(tag, attrs={}, children=[]) {
  const node = document.createElement(tag);
  for(const [k,v] of Object.entries(attrs)){
    if(k === 'class') node.className = v;
    else if(k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if(k === 'html') node.innerHTML = v;
    else node.setAttribute(k, v);
  }
  for(const child of children){
    if(child == null) continue;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return node;
}

export function mount(parent, child){ if(!parent || !child) return child; parent.append(child); return child; }
export function clear(node){ if(!node) return; while(node.firstChild) node.removeChild(node.firstChild); }

export function formatNumber(n){ return Intl.NumberFormat().format(n); }
export function formatDate(date){
  try{ return new Intl.DateTimeFormat(undefined, { year:'numeric', month:'short'}).format(new Date(date)); }
  catch{ return String(date).slice(0,10); }
}

export function tag(text){ return el('span', { class:'tag'}, [text]); }
