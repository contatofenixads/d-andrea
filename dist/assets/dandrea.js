const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('#main-menu');
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menu.hidden = !open;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  menuButton.textContent = open ? '×' : '☰';
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !menu.hidden) menuButton.click();
});
const tabs = [...document.querySelectorAll('[data-feature]')];
function selectFeature(tab) {
  tabs.forEach(t => {
    const active = t === tab;
    t.setAttribute('aria-selected', String(active));
    t.tabIndex = active ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).hidden = !active;
  });
}
tabs.forEach((tab,i) => {
  tab.tabIndex = i ? -1 : 0;
  tab.addEventListener('click', () => selectFeature(tab));
  tab.addEventListener('keydown', event => {
    if (!['ArrowRight','ArrowLeft','Home','End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length-1 : (i+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
    selectFeature(tabs[next]);tabs[next].focus();
  });
});
const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const catalog = document.getElementById('catalog');
if (catalog) {
  const cards = [...catalog.querySelectorAll('.product-card')];
  const search = document.getElementById('catalog-search');
  const filters = [...catalog.querySelectorAll('[data-filter]')];
  let selected = 'all';
  const update = () => {
    const words = normalize(search.value).trim().split(/\s+/).filter(Boolean);
    let count = 0;
    cards.forEach(card => {
      const visible = (selected === 'all' || card.dataset.category === selected) && words.every(w => normalize(card.dataset.search).includes(w));
      card.hidden = !visible;if(visible)count++;
    });
    filters.forEach(button => {
      const active = button.dataset.filter === selected;
      button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));
    });
    document.getElementById('result-count').textContent = `${count} ${count === 1 ? 'solução encontrada' : 'soluções encontradas'}`;
    document.getElementById('empty-state').hidden = count !== 0;
  };
  search.addEventListener('input', update);
  filters.forEach(button => button.addEventListener('click', () => {selected=button.dataset.filter;update();}));
  document.getElementById('clear-filters').addEventListener('click', () => {selected='all';search.value='';update();search.focus();});
}
document.querySelectorAll('.quote-form').forEach(form => {
  const product = new URLSearchParams(location.search).get('produto');
  if (product) form.elements.message.value = `Gostaria de informações sobre ${product}.`;
  form.addEventListener('submit', event => {
    event.preventDefault();
    const status=form.querySelector('.form-status');status.hidden=false;
    status.textContent='Esta versão é para revisão. Nenhum dado foi enviado. Para falar com a D’Andrea, use os telefones informados na página de contato.';
  });
});
const dialog = document.getElementById('image-dialog');
document.querySelectorAll('[data-zoom]').forEach(button => button.addEventListener('click', () => {
  const image = dialog.querySelector('img');image.src=button.dataset.zoom;image.alt=button.dataset.caption;
  dialog.querySelector('p').textContent=button.dataset.caption;dialog.showModal();
}));
dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
