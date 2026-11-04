/* D'Andrea — modern interactions (menu, tabs, catalog, reveal, counters,
   country selector, floating contact, carousel, forms, image dialog). */
'use strict';
document.documentElement.classList.add('js');
const CFG = window.DANDREA || { contacts: {}, formEndpoint: '' };
const LOCALES = CFG.contacts || {};
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Mobile menu ---------- */
const menuButton = $('.menu-toggle');
const menu = $('#main-menu');
if (menuButton && menu) {
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menu.hidden = !open;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menuButton.textContent = open ? '×' : '☰';
    if (open) menu.querySelector('a')?.focus();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !menu.hidden) { menuButton.click(); menuButton.focus(); }
  });
}

/* ---------- Header mega-menu and global product search ---------- */
const solutionToggle = $('[data-solutions-toggle]');
const solutionMenu = $('#solutions-menu');
if (solutionToggle && solutionMenu) {
  solutionToggle.addEventListener('click', () => {
    const open = solutionToggle.getAttribute('aria-expanded') !== 'true';
    solutionToggle.setAttribute('aria-expanded', String(open));
    solutionMenu.hidden = !open;
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.nav-dropdown')) {
      solutionToggle.setAttribute('aria-expanded', 'false');
      solutionMenu.hidden = true;
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !solutionMenu.hidden) {
      solutionToggle.setAttribute('aria-expanded', 'false'); solutionMenu.hidden = true; solutionToggle.focus();
    }
  });
}
const searchToggle = $('[data-search-toggle]');
const searchPanel = $('#header-search');
if (searchToggle && searchPanel) {
  searchToggle.addEventListener('click', () => {
    const open = searchToggle.getAttribute('aria-expanded') !== 'true';
    searchToggle.setAttribute('aria-expanded', String(open)); searchPanel.hidden = !open;
    if (open) $('#header-search-input')?.focus();
  });
  searchPanel.addEventListener('submit', event => {
    event.preventDefault();
    const query = $('#header-search-input')?.value.trim() || '';
    location.href = `/produtos/${query ? `?q=${encodeURIComponent(query)}` : ''}`;
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !searchPanel.hidden) {
      searchPanel.hidden = true; searchToggle.setAttribute('aria-expanded', 'false'); searchToggle.focus();
    }
  });
}

/* ---------- Featured tabs ---------- */
const tabs = $$('[data-feature]');
function selectFeature(tab) {
  tabs.forEach(t => {
    const active = t === tab;
    t.setAttribute('aria-selected', String(active));
    t.tabIndex = active ? 0 : -1;
    const panel = document.getElementById(t.getAttribute('aria-controls'));
    panel.hidden = !active;
    if (active) {
      panel.classList.add('in');
      panel.classList.remove('feature-active');
      requestAnimationFrame(() => panel.classList.add('feature-active'));
    } else panel.classList.remove('feature-active');
  });
}
function moveFeature(direction) {
  if (!tabs.length) return;
  const active = Math.max(0, tabs.findIndex(t => t.getAttribute('aria-selected') === 'true'));
  selectFeature(tabs[(active + direction + tabs.length) % tabs.length]);
}
$('[data-feature-prev]')?.addEventListener('click', () => moveFeature(-1));
$('[data-feature-next]')?.addEventListener('click', () => moveFeature(1));
tabs.forEach((tab, i) => {
  tab.tabIndex = i ? -1 : 0;
  tab.addEventListener('click', () => selectFeature(tab));
  tab.addEventListener('keydown', event => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
      : (i + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    selectFeature(tabs[next]); tabs[next].focus();
  });
});
$$('.featured-panel').forEach(panel => {
  let startX = 0;
  panel.addEventListener('pointerdown', event => { startX = event.clientX; }, { passive: true });
  panel.addEventListener('pointerup', event => {
    const dx = event.clientX - startX;
    if (Math.abs(dx) > 55) moveFeature(dx < 0 ? 1 : -1);
  }, { passive: true });
});

/* ---------- Header scroll state ---------- */
const header = $('[data-header]');
if (header) {
  const onScroll = () => header.classList.toggle('scrolled', scrollY > 12);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
}

/* ---------- Scroll reveal (fade-up 24px, 650ms, stagger in CSS) ---------- */
if ('IntersectionObserver' in window && !REDUCED) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal, .reveal-section').forEach(el => io.observe(el));
} else {
  $$('.reveal, .reveal-section').forEach(el => el.classList.add('in'));
}

/* ---------- Animated counters (run once when visible) ---------- */
function animateCount(el) {
  const target = parseInt(el.dataset.count, 10) || 0;
  const suffix = el.dataset.suffix || '';
  if (REDUCED) { el.textContent = target + suffix; return; }
  const dur = 1500, t0 = performance.now();
  const tick = now => {
    const p = Math.min((now - t0) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * eased) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
const counters = $$('[data-count]');
if (counters.length && 'IntersectionObserver' in window) {
  const cio = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { animateCount(en.target); cio.unobserve(en.target); }
    });
  }, { threshold: 0.4 });
  counters.forEach(el => cio.observe(el));
} else counters.forEach(animateCount);

/* ---------- Carousel controls ---------- */
$$('[data-carousel]').forEach(carousel => {
  const track = $('.carousel-track', carousel);
  const cards = $$('.product-card', track);
  const step = () => Math.max(track.clientWidth * 0.85, 260);
  const prev = $('.prev', carousel), next = $('.next', carousel);
  prev?.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: REDUCED ? 'auto' : 'smooth' }));
  next?.addEventListener('click', () => track.scrollBy({ left: step(), behavior: REDUCED ? 'auto' : 'smooth' }));
  if (cards.length > 1) {
    const dots = document.createElement('div'); dots.className = 'carousel-dots'; dots.setAttribute('role', 'group'); dots.setAttribute('aria-label', 'Choose a featured solution');
    const buttons = cards.map((card, i) => {
      const button = document.createElement('button'); button.type = 'button'; button.setAttribute('aria-label', `Solution ${i + 1} of ${cards.length}`); button.setAttribute('aria-pressed', String(i === 0));
      button.addEventListener('click', () => track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: REDUCED ? 'auto' : 'smooth' }));
      dots.append(button); return button;
    });
    carousel.append(dots);
    let scheduled = false;
    track.addEventListener('scroll', () => {
      if (scheduled) return; scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        const center = track.scrollLeft + track.clientWidth / 2;
        let active = 0, nearest = Infinity;
        cards.forEach((card, i) => { const dist = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center); if (dist < nearest) { active = i; nearest = dist; } });
        buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === active)));
      });
    }, { passive: true });
  }
});

/* ---------- Catalog filters + search ---------- */
const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const catalog = $('#catalog');
if (catalog) {
  const cardsEls = [...catalog.querySelectorAll('.product-card')];
  const search = $('#catalog-search');
  const initialQuery = new URLSearchParams(location.search).get('q');
  if (initialQuery && search) search.value = initialQuery;
  const filters = [...catalog.querySelectorAll('[data-filter]')];
  let selected = 'all';
  const update = () => {
    const words = normalize(search.value).trim().split(/\s+/).filter(Boolean);
    let count = 0;
    cardsEls.forEach(card => {
      const visible = (selected === 'all' || card.dataset.category === selected)
        && words.every(w => normalize(card.dataset.search).includes(w));
      card.hidden = !visible; if (visible) count++;
    });
    filters.forEach(button => {
      const active = button.dataset.filter === selected;
      button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active));
    });
    const code = document.body.dataset.country || 'br';
    const resultText = code === 'us' ? (count === 1 ? 'solution found' : 'solutions found') : code === 'es' ? (count === 1 ? 'solución encontrada' : 'soluciones encontradas') : (count === 1 ? 'solução encontrada' : 'soluções encontradas');
    document.getElementById('result-count').textContent = `${count} ${resultText}`;
    document.getElementById('empty-state').hidden = count !== 0;
  };
  search.addEventListener('input', update);
  catalog.addEventListener('countrychange', update);
  filters.forEach(button => button.addEventListener('click', () => { selected = button.dataset.filter; update(); }));
  $('#clear-filters')?.addEventListener('click', () => { selected = 'all'; search.value = ''; update(); search.focus(); });
  update();
}

/* ---------- Country / language selector + floating contact ---------- */
const I18N = {
  br: {
    quote: 'Pedir orçamento', formTitle: 'Peça seu orçamento', formSub: 'Conte o que a sua operação precisa.', formSubmit: 'Preparar mensagem',
    name: 'Nome completo*', phone: 'Telefone / WhatsApp*', company: 'Empresa*', email: 'E-mail*', message: 'Conte o que precisa: produto, aplicação e capacidade*',
    consent: 'Autorizo a abertura do WhatsApp com os dados preenchidos para que eu possa revisar e enviar o pedido à D’Andrea.',
    heroHeadline: ['90+ ANOS', 'DE TECNOLOGIA', 'CONVERSÃO DE PAPEL'], heroLead: 'Mais de 90 anos impulsionando a indústria: máquinas e soluções para conversão de papel, embalagens, papel tissue e equipamentos complementares.', heroButton: 'Conhecer todas as soluções', heroLink: 'Qual é a sua aplicação? Conheça nossas linhas →', heroSub: 'Inovando · Construindo · Superando, sempre',
    nav: ['Nossa história', 'Soluções', 'Contato'], story: 'Nossa história', solutions: 'Soluções', contact: 'Contato', all_solutions: 'Todas as soluções', catalog: 'Ver catálogo', search_label: 'Buscar entre 24 soluções', search_button: 'Buscar', topbar: 'Máquinas e soluções industriais · Desde 1934 · Brasil e Estados Unidos', heroDynamic: ['CONVERSÃO DE PAPEL','EMBALAGENS','PAPEL TISSUE','TECNOLOGIA INDUSTRIAL','SOLUÇÕES DE CONVERSÃO'],
    contactLabel: 'Fale com a D’Andrea pelo WhatsApp', contactCall: 'Ligar para o contato D’Andrea nos Estados Unidos', facetimeLabel: 'Contactar a D’Andrea pelo FaceTime'
  },
  es: {
    quote: 'Pedir presupuesto', formTitle: 'Solicite un presupuesto', formSub: 'Cuéntenos qué necesita su operación.', formSubmit: 'Preparar mensaje',
    name: 'Nombre completo*', phone: 'Teléfono / WhatsApp*', company: 'Empresa*', email: 'Correo electrónico*', message: 'Cuéntenos qué necesita: producto, aplicación y capacidad*',
    consent: 'Autorizo abrir WhatsApp con los datos completados para revisar y enviar mi solicitud a D’Andrea.',
    heroHeadline: ['MÁS DE 90 AÑOS', 'DE TECNOLOGÍA', 'CONVERSIÓN DE PAPEL'], heroLead: 'Más de 90 años impulsando la industria: máquinas y soluciones para conversión de papel, embalajes, papel tissue y equipos complementarios.', heroButton: 'Ver todas las soluciones', heroLink: '¿Cuál es su aplicación? Conozca nuestras líneas →', heroSub: 'Innovando · Construyendo · Superando, siempre',
    nav: ['Nuestra historia', 'Soluciones', 'Contacto'], story: 'Nuestra historia', solutions: 'Soluciones', contact: 'Contacto', all_solutions: 'Todas las soluciones', catalog: 'Ver catálogo', search_label: 'Buscar entre 24 soluciones', search_button: 'Buscar', topbar: 'Máquinas y soluciones industriales · Desde 1934 · Atención en español', heroDynamic: ['CONVERSIÓN DE PAPEL','EMBALAJES','PAPEL TISSUE','TECNOLOGÍA INDUSTRIAL','SOLUCIONES DE CONVERSIÓN'],
    contactLabel: 'Hable con D’Andrea por WhatsApp', contactCall: 'Llamar al contacto de D’Andrea en Estados Unidos', facetimeLabel: 'Contactar con D’Andrea por FaceTime'
  },
  us: {
    quote: 'Request a quote', formTitle: 'Request a quote', formSub: 'Tell us what your operation needs.', formSubmit: 'View contact options',
    name: 'Full name*', phone: 'Phone*', company: 'Company*', email: 'Email*', message: 'Tell us what you need: product, application, and capacity*',
    consent: 'I understand that messaging is unavailable for U.S. inquiries and I can contact D’Andrea by phone.',
    heroHeadline: ['90+ YEARS', 'OF TECHNOLOGY', 'PAPER FORWARD'], heroLead: 'More than 90 years advancing industry with machinery and solutions for paper converting, packaging, tissue paper, and complementary equipment.', heroButton: 'Explore all solutions', heroLink: 'What is your application? Explore our product lines →', heroSub: 'Innovating · Building · Overcoming, always',
    nav: ['Our history', 'Solutions', 'Contact'], story: 'Our history', solutions: 'Solutions', contact: 'Contact', all_solutions: 'All solutions', catalog: 'View catalog', search_label: 'Search 24 solutions', search_button: 'Search', topbar: 'Industrial machinery and solutions · Since 1934 · U.S. and Brazil', heroDynamic: ['PAPER CONVERTING','PACKAGING','TISSUE PAPER','INDUSTRIAL TECHNOLOGY','CONVERTING SOLUTIONS'],
    contactLabel: 'Contact us on FaceTime', contactCall: 'Call D’Andrea in the United States', facetimeLabel: 'Contact D’Andrea on FaceTime'
  },
};
const FOOTER_I18N = {
  br: {footer_tagline:'Seu sonho realizado', footer_description:'Soluções para conversão de papel, embalagens, papel tissue e equipamentos complementares.', footer_institutional:'Institucional', footer_home:'Início', footer_contact:'Fale conosco', footer_privacy:'Informações sobre privacidade'},
  es: {footer_tagline:'Su sueño hecho realidad', footer_description:'Soluciones para conversión de papel, embalajes, papel tissue y equipos complementarios.', footer_institutional:'Empresa', footer_home:'Inicio', footer_contact:'Contáctenos', footer_privacy:'Información sobre privacidad'},
  us: {footer_tagline:'Your dream realized', footer_description:'Solutions for paper converting, packaging, tissue and complementary equipment.', footer_institutional:'Company', footer_home:'Home', footer_contact:'Contact us', footer_privacy:'Privacy information'}
};
const CATEGORY_LABELS = {
  br: ['Conversão de Papel', 'Embalagens', 'Conversão de Papel Tissue', 'Equipamentos Complementares'],
  es: ['Conversión de papel', 'Embalajes', 'Conversión de papel tissue', 'Equipos complementarios'],
  us: ['Paper converting', 'Packaging', 'Tissue converting', 'Complementary equipment']
};
function setLabel(el, text) {
  if (!el) return;
  const textNode = [...el.childNodes].find(node => node.nodeType === Node.TEXT_NODE);
  if (textNode) textNode.nodeValue = text + ' ';
  else el.prepend(document.createTextNode(text + ' '));
}
function isApple() {
  return /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent || navigator.platform || '');
}
let heroWordIndex = 0;
function applyCountry(code) {
  const conf = LOCALES[code]; if (!conf) return;
  const t = I18N[code] || I18N.br;
  document.body.dataset.country = code;
  document.documentElement.lang = conf.lang || 'pt-BR';
  $$('.lang-switch .flag-btn').forEach(b => { const active = b.dataset.country === code; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active)); });
  const topPhone = $('[data-contact-phone]');
  if (topPhone && conf.phone) {
    topPhone.href = `tel:${conf.phone.replace(/[ ()-]/g, '')}`;
    const phoneText = $('span', topPhone); if (phoneText) phoneText.textContent = conf.phone;
  }
  const wa = $('.float-wa');
  if (wa) {
    wa.hidden = code === 'us';
    if (conf.wa) {
      const url = `https://wa.me/${conf.wa}?text=${encodeURIComponent(conf.waMsg || '')}`;
      wa.href = url; wa.setAttribute('aria-label', t.contactLabel);
    }
  }
  const ft = $('.float-ft');
  if (ft) {
    ft.hidden = code !== 'us';
    ft.setAttribute('aria-hidden', String(ft.hidden));
    ft.setAttribute('aria-label', t.facetimeLabel);
    if (code === 'us' && conf.facetime) ft.href = `facetime:${conf.facetime}`;
  }
  const usInfo = $('.float-us-info');
  if (usInfo) {
    usInfo.hidden = code !== 'us' || isApple();
    usInfo.setAttribute('aria-label', t.contactCall);
  }
  $$('[data-i18n="form_title"]').forEach(el => { el.textContent = t.formTitle; });
  $$('[data-i18n="form_sub"]').forEach(el => { el.textContent = t.formSub; });
  $$('.quote-form').forEach(form => {
    setLabel(form.querySelector('button[type="submit"]'), t.formSubmit);
    const fields = { name: t.name, phone: t.phone, company: t.company, email: t.email, message: t.message };
    Object.entries(fields).forEach(([name, text]) => {
      const field = form.elements[name]; if (!field) return;
      field.placeholder = text;
      const label = field.closest('label');
      if (label) { const span = $('span', label); if (span && !label.classList.contains('form-consent')) span.textContent = text.replace('*', ''); }
    });
    const consent = form.querySelector('.form-consent span'); if (consent) consent.textContent = t.consent;
    const product = form.elements.message?.dataset.defaultProduct;
    if (product) form.elements.message.value = `${code === 'es' ? 'Me gustaría recibir información sobre ' : code === 'us' ? 'I would like information about ' : 'Gostaria de informações sobre '}${product}.`;
  });
  $$('[data-i18n]').forEach(el => {
    const categoryMatch = /^category_(\d)$/.exec(el.dataset.i18n);
    const label = categoryMatch ? CATEGORY_LABELS[code][Number(categoryMatch[1])] : (t[el.dataset.i18n] || FOOTER_I18N[code][el.dataset.i18n]); if (!label) return;
    if (el.matches('.nav-solutions')) { const child = $('[data-i18n]', el); if (child) child.textContent = label; }
    else if (el.matches('a,button')) setLabel(el, label); else el.textContent = label;
  });
  const topbar = $('.topbar [data-i18n="topbar"]'); if (topbar) topbar.textContent = t.topbar;
  $$('.feature-tabs button').forEach((button, index) => setLabel(button, CATEGORY_LABELS[code][index]));
  $$('.featured-panel .eyebrow').forEach((element, index) => { element.textContent = CATEGORY_LABELS[code][index]; });
  const empty = $('#empty-state');
  if (empty) {
    const emptyTexts = code === 'us' ? ['No solutions found', 'Try another search or choose a different product line.', 'Clear search'] : code === 'es' ? ['No se encontraron soluciones', 'Pruebe otro término o seleccione otra línea.', 'Limpiar búsqueda'] : ['Nenhuma solução encontrada', 'Tente outro termo ou selecione outra linha.', 'Limpar busca'];
    $('h2', empty).textContent = emptyTexts[0]; $('p', empty).textContent = emptyTexts[1]; $('#clear-filters').textContent = emptyTexts[2];
    const catalogSearch = $('#catalog-search'); catalogSearch.placeholder = code === 'us' ? 'Search solutions…' : code === 'es' ? 'Buscar soluciones…' : 'Buscar soluções…';
    catalog.dispatchEvent(new Event('countrychange'));
  }
  setLabel($('.quote-header'), t.quote);
  setLabel($('.catalog-btn'), t.catalog);
  setLabel($('.header-search button[type="submit"]'), t.search_button);
  const searchLabel = $('.header-search label'); if (searchLabel) searchLabel.textContent = t.search_label;
  const searchInput = $('#header-search-input'); if (searchInput) searchInput.placeholder = code === 'us' ? 'Ex.: paper tubes' : code === 'es' ? 'Ej.: tubos de papel' : 'Ex.: tubos de papel';
  const heroButton = $('.hero-copy .btn'); setLabel(heroButton, t.heroButton);
  const heroLink = $('.hero-secondary'); setLabel(heroLink, t.heroLink);
  const subtitle = $('.hero-subtitle'); if (subtitle) subtitle.textContent = t.heroSub;
  const heroLabel = $('.hero-copy .red-label'); if (heroLabel) heroLabel.textContent = code === 'us' ? 'D’Andrea Company · Since 1934' : 'D’Andrea Company · Desde 1934';
  const heroPrefix = $('[data-hero-prefix]'); if (heroPrefix) heroPrefix.textContent = code === 'us' ? 'for' : 'para';
  const statLabels = code === 'us' ? ['Founded', 'Countries with D’Andrea machinery', 'Catalog solutions'] : code === 'es' ? ['Fundación', 'Países con máquinas D’Andrea', 'Soluciones en el catálogo'] : ['Fundação', 'Países com máquinas D’Andrea', 'Soluções no catálogo'];
  $$('.hero-stats span').forEach((element, index) => { element.textContent = statLabels[index]; });
  const lead = $('.hero-copy > .lead'); if (lead) lead.textContent = t.heroLead;
  $$('.hero-line').forEach((line, i) => {
    if (i === 2) { const dynamic = $('[data-hero-dynamic]', line); if (dynamic) dynamic.textContent = t.heroDynamic[0]; return; }
    const words = (t.heroHeadline[i] || '').split(' ');
    line.replaceChildren(...words.map((word, j) => {
      const span = document.createElement('span');
      span.className = 'hero-word'; span.style.setProperty('--wd', `${0.05 + i * 0.12 + j * 0.06}s`);
      span.textContent = word + (j < words.length - 1 ? ' ' : ''); return span;
    }));
  });
  heroWordIndex = 0;
}
$$('.lang-switch .flag-btn').forEach(b => b.addEventListener('click', () => {
  const code = b.dataset.country;
  try { localStorage.setItem('dandrea-country', code); } catch (e) {}
  applyCountry(code);
}));
let savedCountry = 'br';
try { savedCountry = localStorage.getItem('dandrea-country') || 'br'; } catch (e) {}
applyCountry(LOCALES[savedCountry] ? savedCountry : 'br');

const dynamicHero = $('[data-hero-dynamic]');
if (dynamicHero && !REDUCED) {
  setInterval(() => {
    dynamicHero.classList.add('hero-changing');
    setTimeout(() => {
      const locale = I18N[document.body.dataset.country] || I18N.br;
      heroWordIndex = (heroWordIndex + 1) % locale.heroDynamic.length;
      dynamicHero.textContent = locale.heroDynamic[heroWordIndex];
      dynamicHero.classList.remove('hero-changing');
    }, 250);
  }, 4000);
}

/* ---------- Quote forms ---------- */
const FORM_MSGS = {
  br: { fill: 'Preencha os campos obrigatórios corretamente.', email: 'Informe um e-mail válido.', ready: 'Mensagem preparada. Revise o texto no WhatsApp e toque em Enviar para concluir.', us: 'Não foi possível abrir um canal de mensagem para os EUA. Consulte as opções de contato.', open: 'Revisar e enviar no WhatsApp' },
  es: { fill: 'Complete los campos obligatorios correctamente.', email: 'Introduzca un correo electrónico válido.', ready: 'Mensaje preparado. Revíselo en WhatsApp y pulse Enviar para finalizar.', us: 'No se pudo abrir un canal de mensajes para EE. UU. Consulte las opciones de contacto.', open: 'Revisar y enviar por WhatsApp' },
  us: { fill: 'Please complete the required fields correctly.', email: 'Please enter a valid email address.', ready: 'Message prepared. Review it in WhatsApp and press Send to finish.', us: 'Messaging is not available for U.S. inquiries yet. Please see the contact options.', open: 'View U.S. contact options' },
};
function msgs() { return FORM_MSGS[document.body.dataset.country] || FORM_MSGS.br; }
$$('.quote-form').forEach(form => {
  const product = new URLSearchParams(location.search).get('produto');
  if (product) form.elements.message.value = `Gostaria de informações sobre ${product}.`;
  let handoffStarted = false;
  form.addEventListener('input', () => {
    if (!handoffStarted) return;
    handoffStarted = false;
    form.querySelector('button[type="submit"]').disabled = false;
    form.querySelector('.form-status').hidden = true;
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const status = form.querySelector('.form-status');
    const m = msgs();
    const showText = text => { status.replaceChildren(document.createTextNode(text)); status.hidden = false; status.className = 'form-status info'; };
    if (form.elements.website?.value) return;
    if (!form.reportValidity()) { showText(m.fill); return; }
    if (handoffStarted) return;
    if (document.body.dataset.country === 'us') {
      showText(m.us);
      const link = document.createElement('a'); link.href = '/contact-us/'; link.textContent = m.open;
      link.className = 'form-contact-link'; status.append(document.createTextNode(' '), link); status.hidden = false;
      return;
    }
    const contact = LOCALES[document.body.dataset.country || 'br'];
    if (!contact?.wa) { showText(m.us); return; }
    const fields = [form.elements.name.value.trim(), form.elements.company.value.trim(), form.elements.phone.value.trim(), form.elements.email.value.trim(), form.elements.message.value.trim()].filter(Boolean);
    const url = `https://wa.me/${contact.wa}?text=${encodeURIComponent(fields.join('\n'))}`;
    showText(m.ready);
    const link = document.createElement('a'); link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer';
    link.textContent = m.open; link.className = 'form-contact-link';
    status.append(document.createElement('br'), link); status.hidden = false;
    handoffStarted = true;
    const button = form.querySelector('button[type="submit"]'); if (button) button.disabled = true;
  });
});

/* ---------- Image zoom dialog ---------- */
const dialog = $('#image-dialog');
$$('[data-zoom]').forEach(button => button.addEventListener('click', () => {
  const image = dialog.querySelector('img');
  image.src = button.dataset.zoom; image.alt = button.dataset.caption;
  dialog.querySelector('p').textContent = button.dataset.caption;
  dialog.showModal();
}));
dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
