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
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !menu.hidden) menuButton.click();
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
    document.getElementById('result-count').textContent = `${count} ${count === 1 ? 'solução encontrada' : 'soluções encontradas'}`;
    document.getElementById('empty-state').hidden = count !== 0;
  };
  search.addEventListener('input', update);
  filters.forEach(button => button.addEventListener('click', () => { selected = button.dataset.filter; update(); }));
  $('#clear-filters')?.addEventListener('click', () => { selected = 'all'; search.value = ''; update(); search.focus(); });
}

/* ---------- Country / language selector + floating contact ---------- */
const I18N = {
  br: {
    quote: 'Pedir orçamento', formTitle: 'Peça seu orçamento', formSub: 'Conte o que a sua operação precisa.', formSubmit: 'Preparar mensagem',
    name: 'Nome completo*', phone: 'Telefone / WhatsApp*', company: 'Empresa*', email: 'E-mail*', message: 'Conte o que precisa: produto, aplicação e capacidade*',
    consent: 'Autorizo a abertura do WhatsApp com os dados preenchidos para que eu possa revisar e enviar o pedido à D’Andrea.',
    heroHeadline: ['90+ ANOS', 'MOVENDO O', 'FUTURO DO PAPEL'], heroLead: 'Mais de 90 anos impulsionando a indústria: máquinas e soluções para conversão de papel, embalagens, papel tissue e equipamentos complementares.', heroButton: 'Conhecer todas as soluções', heroLink: 'Qual é a sua aplicação? Conheça nossas linhas →', heroSub: 'Inovando · Construindo · Superando, sempre',
    nav: ['Nossa história', 'Soluções', 'Contato'], topbar: 'Máquinas e soluções industriais · Desde 1934 · Brasil e Estados Unidos',
    contactLabel: 'Fale com a D’Andrea pelo WhatsApp', contactPending: 'Os dados de contato dos EUA ainda não foram confirmados.'
  },
  es: {
    quote: 'Pedir presupuesto', formTitle: 'Solicite un presupuesto', formSub: 'Cuéntenos qué necesita su operación.', formSubmit: 'Preparar mensaje',
    name: 'Nombre completo*', phone: 'Teléfono / WhatsApp*', company: 'Empresa*', email: 'Correo electrónico*', message: 'Cuéntenos qué necesita: producto, aplicación y capacidad*',
    consent: 'Autorizo abrir WhatsApp con los datos completados para revisar y enviar mi solicitud a D’Andrea.',
    heroHeadline: ['MÁS DE 90 AÑOS', 'IMPULSANDO', 'LA INDUSTRIA'], heroLead: 'Más de 90 años impulsando la industria: máquinas y soluciones para conversión de papel, embalajes, papel tissue y equipos complementarios.', heroButton: 'Ver todas las soluciones', heroLink: '¿Cuál es su aplicación? Conozca nuestras líneas →', heroSub: 'Innovando · Construyendo · Superando, siempre',
    nav: ['Nuestra historia', 'Soluciones', 'Contacto'], topbar: 'Máquinas y soluciones industriales · Desde 1934 · Brasil y Estados Unidos',
    contactLabel: 'Hable con D’Andrea por WhatsApp', contactPending: 'Los datos de contacto de EE. UU. aún no están confirmados.'
  },
  us: {
    quote: 'Request a quote', formTitle: 'Request a quote', formSub: 'Tell us what your operation needs.', formSubmit: 'Prepare message',
    name: 'Full name*', phone: 'Phone / WhatsApp*', company: 'Company*', email: 'Email*', message: 'Tell us what you need: product, application, and capacity*',
    consent: 'I agree to open WhatsApp with the information above so I can review and send my request to D’Andrea.',
    heroHeadline: ['90+ YEARS', 'MOVING', 'PAPER FORWARD'], heroLead: 'More than 90 years advancing industry with machinery and solutions for paper converting, packaging, tissue paper, and complementary equipment.', heroButton: 'Explore all solutions', heroLink: 'What is your application? Explore our product lines →', heroSub: 'Innovating · Building · Overcoming, always',
    nav: ['Our history', 'Solutions', 'Contact'], topbar: 'Industrial machinery and solutions · Since 1934 · Brazil and United States',
    contactLabel: 'See U.S. contact options', contactPending: 'U.S. contact details have not been confirmed.'
  },
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
function applyCountry(code) {
  const conf = LOCALES[code]; if (!conf) return;
  const t = I18N[code] || I18N.br;
  document.body.dataset.country = code;
  document.documentElement.lang = conf.lang || 'pt-BR';
  $$('.lang-switch .flag-btn').forEach(b => b.classList.toggle('active', b.dataset.country === code));
  const wa = $('.float-wa');
  if (wa) {
    wa.hidden = code === 'us';
    if (conf.wa) {
      const url = `https://wa.me/${conf.wa}?text=${encodeURIComponent(conf.waMsg || '')}`;
      wa.href = url; wa.setAttribute('aria-label', t.contactLabel);
    }
  }
  const ft = $('.float-ft');
  if (ft) { ft.hidden = true; ft.setAttribute('aria-hidden', 'true'); }
  const usInfo = $('.float-us-info');
  if (usInfo) {
    usInfo.hidden = code !== 'us';
    usInfo.setAttribute('aria-label', t.contactLabel);
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
  $$('.desktop-nav a').forEach((link, i) => { if (t.nav[i]) link.textContent = t.nav[i]; });
  $$('.mobile-menu > a').forEach((link, i) => { if (t.nav[i]) link.textContent = t.nav[i]; });
  const topbar = $('.topbar .wrap > span'); if (topbar) topbar.textContent = t.topbar;
  const quote = $('.header-actions > .btn'); setLabel(quote, t.quote);
  const heroButton = $('.hero-copy .btn'); setLabel(heroButton, t.heroButton);
  const heroLink = $('.hero-secondary'); setLabel(heroLink, t.heroLink);
  const subtitle = $('.hero-subtitle'); if (subtitle) subtitle.textContent = t.heroSub;
  const lead = $('.hero-copy > .lead'); if (lead) lead.textContent = t.heroLead;
  $$('.hero-line').forEach((line, i) => {
    const words = (t.heroHeadline[i] || '').split(' ');
    line.replaceChildren(...words.map((word, j) => {
      const span = document.createElement('span');
      span.className = 'hero-word'; span.style.setProperty('--wd', `${0.05 + i * 0.12 + j * 0.06}s`);
      span.textContent = word;
      if (i === 2 && j === words.length - 1) { const em = document.createElement('em'); em.append(span); return em; }
      return span;
    }));
  });
}
$$('.lang-switch .flag-btn').forEach(b => b.addEventListener('click', () => {
  const code = b.dataset.country;
  try { localStorage.setItem('dandrea-country', code); } catch (e) {}
  applyCountry(code);
}));
let savedCountry = 'br';
try { savedCountry = localStorage.getItem('dandrea-country') || 'br'; } catch (e) {}
applyCountry(LOCALES[savedCountry] ? savedCountry : 'br');

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
