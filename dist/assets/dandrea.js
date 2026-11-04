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
    document.getElementById(t.getAttribute('aria-controls')).hidden = !active;
  });
}
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
  const step = () => Math.max(track.clientWidth * 0.85, 260);
  $('.prev', carousel)?.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: REDUCED ? 'auto' : 'smooth' }));
  $('.next', carousel)?.addEventListener('click', () => track.scrollBy({ left: step(), behavior: REDUCED ? 'auto' : 'smooth' }));
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
    quote: 'Pedir orçamento', formTitle: 'Peça seu orçamento', formSub: 'Conte o que a sua operação precisa.', formSubmit: 'Solicitar orçamento',
    name: 'Nome completo*', phone: 'Telefone / WhatsApp*', company: 'Empresa*', email: 'E-mail*', message: 'Conte o que precisa: produto, aplicação e capacidade*',
    heroButton: 'Conhecer todas as soluções', heroLink: 'Qual é a sua aplicação? Conheça nossas linhas →', subtitle: 'Inovando · Construindo · Superando, sempre',
    floatAria: 'Fale com a D’Andrea pelo WhatsApp'
  },
  es: {
    quote: 'Pedir presupuesto', formTitle: 'Solicite un presupuesto', formSub: 'Cuéntenos qué necesita su operación.', formSubmit: 'Enviar solicitud',
    name: 'Nombre completo*', phone: 'Teléfono / WhatsApp*', company: 'Empresa*', email: 'Correo electrónico*', message: 'Cuéntenos qué necesita: producto, aplicación y capacidad*',
    heroButton: 'Conocer todas las soluciones', heroLink: '¿Cuál es su aplicación? Conozca nuestras líneas →', subtitle: 'Innovando · Construyendo · Superando, siempre',
    floatAria: 'Hable con D’Andrea por WhatsApp'
  },
  us: {
    quote: 'Request a quote', formTitle: 'Request a quote', formSub: 'Tell us what your operation needs.', formSubmit: 'Submit request',
    name: 'Full name*', phone: 'Phone / WhatsApp*', company: 'Company*', email: 'E-mail*', message: 'Tell us what you need: product, application, and capacity*',
    heroButton: 'Explore all solutions', heroLink: 'What is your application? Explore our product lines →', subtitle: 'Innovating · Building · Overcoming, always',
    floatAria: 'Contact us on FaceTime'
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
  document.body.dataset.country = code;
  document.documentElement.lang = conf.lang || 'pt-BR';
  $$('.lang-switch .flag-btn').forEach(b => b.classList.toggle('active', b.dataset.country === code));
  const wa = $('.float-wa');
  if (wa && conf.wa) {
    const url = `https://wa.me/${conf.wa}?text=${encodeURIComponent(conf.waMsg || '')}`;
    wa.href = url; wa.setAttribute('aria-label', conf.floatAria || 'WhatsApp');
  }
  const ft = $('.float-ft');
  if (ft) {
    ft.setAttribute('aria-label', conf.floatAria || 'FaceTime');
    if (conf.facetime) {
      ft.href = `facetime:${conf.facetime}`;
      ft.removeAttribute('aria-disabled');
      ft.title = '';
    } else {
      ft.href = '#';
      ft.setAttribute('aria-disabled', 'true');
      ft.title = 'FaceTime destination pending validation';
    }
  }
  const t = I18N[code] || I18N.br;
  $$('[data-i18n="form_title"]').forEach(el => { el.textContent = t.formTitle; });
  $$('[data-i18n="form_sub"]').forEach(el => { el.textContent = t.formSub; });
  $$('.quote-form').forEach(form => {
    setLabel(form.querySelector('button[type="submit"]'), t.formSubmit);
    const fields = { name: t.name, phone: t.phone, company: t.company, email: t.email, message: t.message };
    Object.entries(fields).forEach(([name, text]) => {
      const field = form.elements[name]; if (!field) return;
      field.placeholder = text;
      const label = field.closest('label');
      if (label) { const span = $('span', label); if (span) span.textContent = text.replace('*', ''); }
    });
  });
  const quote = $('.header-actions > .btn');
  setLabel(quote, t.quote);
  const heroButton = $('.hero-copy .btn'); setLabel(heroButton, t.heroButton);
  const heroLink = $('.hero-secondary'); setLabel(heroLink, t.heroLink);
  const subtitle = $('.hero-subtitle'); if (subtitle) subtitle.textContent = t.subtitle;
}
$$('.lang-switch .flag-btn').forEach(b => b.addEventListener('click', () => {
  const code = b.dataset.country;
  try { localStorage.setItem('dandrea-country', code); } catch (e) {}
  applyCountry(code);
}));
let savedCountry = 'br';
try { savedCountry = localStorage.getItem('dandrea-country') || 'br'; } catch (e) {}
applyCountry(LOCALES[savedCountry] ? savedCountry : 'br');

/* FaceTime fallback for non-Apple devices */
const ftBtn = $('.float-ft');
const ftFallback = $('.float-fallback');
if (ftBtn && ftFallback) {
  ftBtn.addEventListener('click', e => {
    if (!isApple() || ftBtn.getAttribute('aria-disabled') === 'true') {
      e.preventDefault();
      ftFallback.hidden = !ftFallback.hidden;
    }
  });
  document.addEventListener('click', e => {
    if (!ftFallback.hidden && !e.target.closest('.floating-contact')) ftFallback.hidden = true;
  });
}

/* ---------- Quote forms ---------- */
const FORM_MSGS = {
  br: {
    fill: 'Preencha os campos obrigatórios corretamente.',
    email: 'Informe um e-mail válido.',
    sending: 'Enviando…',
    noEndpoint: 'Recebemos seu pedido? Ainda não: o envio automático ainda não está configurado neste site. Por favor, fale com a D’Andrea pelo WhatsApp ou pelos telefones exibidos na página de contato.',
    ok: 'Solicitação enviada! Nossa equipe entrará em contato.',
    err: 'Não foi possível enviar agora. Tente novamente ou use o WhatsApp.'
  },
  es: {
    fill: 'Complete los campos obligatorios correctamente.',
    email: 'Introduzca un correo electrónico válido.',
    sending: 'Enviando…',
    noEndpoint: 'El envío automático todavía no está configurado en este sitio. Escríbanos por WhatsApp o por los teléfonos de la página de contacto.',
    ok: '¡Solicitud enviada! Nuestro equipo se pondrá en contacto.',
    err: 'No se pudo enviar ahora. Inténtelo de nuevo o use WhatsApp.'
  },
  us: {
    fill: 'Please fill in the required fields correctly.',
    email: 'Please enter a valid e-mail address.',
    sending: 'Sending…',
    noEndpoint: 'Automatic submission is not configured on this site yet. Please call the phone number shown on the contact page.',
    ok: 'Request sent! Our team will get in touch.',
    err: 'Could not send right now. Please try again or use FaceTime.'
  },
};
function msgs() { return FORM_MSGS[document.body.dataset.country] || FORM_MSGS.br; }
$$('.quote-form').forEach(form => {
  const product = new URLSearchParams(location.search).get('produto');
  if (product) form.elements.message.value = `Gostaria de informações sobre ${product}.`;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const status = form.querySelector('.form-status');
    const m = msgs();
    const show = (text, cls) => { status.hidden = false; status.textContent = text; status.className = 'form-status ' + (cls || ''); };
    if (form.elements.website && form.elements.website.value) return; // honeypot: silently drop bots
    let valid = true, emailOk = true;
    [...form.querySelectorAll('input[required], textarea[required]')].forEach(f => {
      const ok = f.checkValidity() && f.value.trim().length >= (parseInt(f.getAttribute('minlength') || '0', 10));
      if (!ok) valid = false;
      if (f.type === 'email' && f.value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.value)) emailOk = false;
    });
    if (!valid) return show(m.fill, 'err');
    if (!emailOk) return show(m.email, 'err');
    const button = form.querySelector('button[type=submit]');
    if (button.disabled) return; // prevent double submit
    button.disabled = true;
    const original = button.innerHTML;
    button.textContent = m.sending;
    const endpoint = CFG.formEndpoint;
    if (!endpoint) {
      // No submission backend configured: never fake a success.
      show(m.noEndpoint, 'err');
      button.disabled = false; button.innerHTML = original;
      return;
    }
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: form.elements.name.value, phone: form.elements.phone.value,
          company: form.elements.company.value, email: form.elements.email.value,
          message: form.elements.message.value, page: location.pathname,
        }),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      show(m.ok, 'ok'); form.reset();
    } catch (err) {
      show(m.err, 'err');
    } finally {
      button.disabled = false; button.innerHTML = original;
    }
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
