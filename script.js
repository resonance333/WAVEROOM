/* WAVEROOM: progressive enhancement for a static GitHub Pages demonstration. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const PRICES = Object.freeze({ vocal: 8000, mix: 12000, podcast: 16000 });
  const LABELS = Object.freeze({ vocal: 'Vocal Recording', mix: 'Track Mixing', podcast: 'Turnkey Podcast' });
  const STORAGE_KEY = 'waveroom-bookings-v1';
  const THEME_KEY = 'waveroom-color-theme';
  let latestBooking = null;

  function readStorage(key, fallback) {
    try { const stored = localStorage.getItem(key); return stored === null ? fallback : JSON.parse(stored); }
    catch { return fallback; }
  }
  function saveStorage(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { return false; }
  }
  function getBookings() {
    const saved = readStorage(STORAGE_KEY, []);
    return Array.isArray(saved) ? saved.filter(x => x && typeof x === 'object') : [];
  }
  const currency = value => new Intl.NumberFormat('ru-RU').format(value) + ' ₸';
  const dateLocal = date => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  const today = () => dateLocal(new Date());
  const minutesFromTime = time => {const parts = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time || '');return parts ? Number(parts[1]) * 60 + Number(parts[2]) : NaN;};
  const el = id => document.getElementById(id);

  /* Color theme: remember the preference in the local browser. */
  function setTheme(theme) {
    const chosen = theme === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.theme = chosen;
    $$('.theme-toggle').forEach(btn => btn.setAttribute('aria-label', `Switch to ${chosen === 'light' ? 'dark' : 'light'} theme`));
    const themeName = el('theme-name');
    if (themeName) themeName.textContent = chosen === 'light' ? 'Light' : 'Dark';
    const themeMeta = $('meta[name="theme-color"]');
    if (themeMeta) themeMeta.content = chosen === 'light' ? '#f9f8ff' : '#0c0b13';
    saveStorage(THEME_KEY, chosen);
  }
  setTheme(readStorage(THEME_KEY, 'dark'));
  $$('.theme-toggle, .footer-theme-toggle').forEach(btn => btn.addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light')));

  /* Accessible mobile menu: only visible below desktop breakpoint. */
  const menuBtn = $('.menu-toggle');
  const menu = el('mobile-menu');
  function closeMenu() {
    menu.hidden = true;
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'Open navigation menu');
  }
  menuBtn.addEventListener('click', () => {
    const opening = menu.hidden;
    menu.hidden = !opening;
    menuBtn.setAttribute('aria-expanded', String(opening));
    menuBtn.setAttribute('aria-label', opening ? 'Close navigation menu' : 'Open navigation menu');
  });
  $$('a', menu).forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  document.addEventListener('click', event => { if (!menu.hidden && !event.target.closest('.site-header')) closeMenu(); });
  window.addEventListener('resize', () => { if (window.innerWidth >= 1024) closeMenu(); });
  el('year').textContent = new Date().getFullYear();

  /* Front-end demo booking form. No third-party API or backend is connected. */
  const form = el('booking-form');
  const service = el('service');
  const date = el('date');
  const time = el('time');
  const duration = el('duration');
  const engineer = el('engineer');
  const estimate = el('estimate');
  const error = el('form-error');
  const success = el('booking-success');
  date.min = today();

  function reservationClashes(dateValue, startTime, hours, bookings) {
    const start = minutesFromTime(startTime);
    const end = start + Number(hours) * 60;
    return bookings.some(b => {
      if (b.date !== dateValue) return false;
      const otherStart = minutesFromTime(b.time);
      const otherEnd = otherStart + Number(b.duration) * 60;
      return start < otherEnd && otherStart < end;
    });
  }
  function updateTimeOptions() {
    const bookingHours = Number(duration.value || 1);
    const current = time.value;
    const now = new Date();
    const options = $$('option', time).slice(1);
    const stored = getBookings();
    options.forEach(opt => {
      const start = minutesFromTime(opt.value);
      const withinHours = start + bookingHours * 60 <= 22 * 60;
      const inPast = date.value && (date.value < today() || (date.value === today() && start <= now.getHours() * 60 + now.getMinutes()));
      const reserved = date.value && reservationClashes(date.value, opt.value, bookingHours, stored);
      opt.disabled = !withinHours || Boolean(inPast) || Boolean(reserved);
      opt.textContent = opt.value + (reserved ? ' — reserved' : !withinHours ? ' — too late' : inPast ? ' — past' : '');
    });
    if (current && time.selectedOptions[0]?.disabled) time.value = '';
  }
  function updateEstimate() {
    const rate = PRICES[service.value];
    const hours = Number(duration.value);
    estimate.textContent = rate && hours ? currency((rate + (engineer.checked ? 4000 : 0)) * hours) : '— ₸';
  }
  function showError(message) { error.textContent = message; error.hidden = !message; }
  for (const control of [service, duration, engineer, date, time]) {
    control.addEventListener('change', () => { updateTimeOptions(); updateEstimate(); showError(''); });
  }
  $$('[data-book-service]').forEach(link => link.addEventListener('click', () => {
    service.value = link.dataset.bookService;
    updateEstimate();
  }));

  function renderBookings() {
    const bookings = getBookings().slice().sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time));
    el('booking-count').textContent = `${bookings.length} SAVED`;
    el('empty-bookings').hidden = bookings.length !== 0;
    const list = el('booking-list');
    list.replaceChildren();
    bookings.forEach(b => {
      const li = document.createElement('li');
      const info = document.createElement('p');
      const name = document.createElement('strong');
      name.textContent = LABELS[b.service] || 'Session';
      const details = document.createElement('span');
      details.textContent = `${b.date} · ${b.time} · ${b.duration} h`;
      info.append(name, details);
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'cancel-booking';
      remove.textContent = 'Cancel';
      remove.setAttribute('aria-label', `Cancel ${name.textContent} on ${b.date} at ${b.time}`);
      remove.addEventListener('click', () => {
        if (!confirm('Cancel this demo reservation?')) return;
        saveStorage(STORAGE_KEY, getBookings().filter(r => r.id !== b.id));
        renderBookings(); updateTimeOptions();
      });
      li.append(info, remove); list.append(li);
    });
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    showError('');
    if (!form.reportValidity()) return;
    const start = minutesFromTime(time.value);
    const hours = Number(duration.value);
    if (date.value < today()) return showError('Please choose today or a future date.');
    if (!Number.isFinite(start) || start < 9*60 || start + hours*60 > 22*60 || hours < 1 || hours > 4) return showError('Your session must finish by 22:00 (opening hours: 09:00–22:00).');
    const now = new Date();
    if (date.value === today() && start <= now.getHours()*60 + now.getMinutes()) return showError('Please choose a future starting time.');
    const bookings = getBookings();
    if (reservationClashes(date.value,time.value,hours,bookings)) { updateTimeOptions(); return showError('This time slot is already reserved on this device. Please choose another.'); }
    if (!Object.hasOwn(PRICES,service.value)) return showError('Please choose a service.');
    const booking = {
      id: `WR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`,
      service:service.value, date:date.value,time:time.value,duration:hours,
      engineer:engineer.checked,name:el('name').value.trim(),phone:el('phone').value.trim(),email:el('email').value.trim(),
      amount:(PRICES[service.value]+(engineer.checked?4000:0))*hours
    };
    if (booking.name.length < 2) return showError('Please enter a name with at least two characters.');
    if (!saveStorage(STORAGE_KEY,[...bookings,booking])) return showError('Local storage is unavailable. Please allow site storage to save the demo reservation.');
    latestBooking = booking;
    const container = el('success-details'); container.replaceChildren();
    const lines = [
      ['Reference',booking.id],['Service',LABELS[booking.service]],['Date',booking.date],
      ['Time',`${booking.time} · ${booking.duration} hour(s)`],['Engineer',booking.engineer ? 'Included' : 'Not included'],
      ['Total',currency(booking.amount)],['Name',booking.name],['Phone',booking.phone],['Email',booking.email]
    ];
    for (const [label,value] of lines) { const line=document.createElement('p');const strong=document.createElement('strong');strong.textContent=`${label}: `;line.append(strong,document.createTextNode(value));container.append(line); }
    form.hidden=true;success.hidden=false;renderBookings();updateTimeOptions();
    success.scrollIntoView({behavior:'smooth',block:'center'});
  });
  el('another-button').addEventListener('click', () => {
    success.hidden = true; form.hidden = false; form.reset();date.min=today();updateTimeOptions();updateEstimate();showError('');service.focus();
  });
  el('calendar-button').addEventListener('click', () => {
    if (!latestBooking) return;
    const b=latestBooking;
    const calendarTimestamp=(d,t)=>d.replaceAll('-','')+'T'+t.replace(':','')+'00';
    const finishHour=Number(b.time.slice(0,2))+b.duration;
    const end=String(finishHour).padStart(2,'0')+b.time.slice(2);
    const escapeICS=s=>String(s).replaceAll('\\','\\\\').replaceAll(';','\\;').replaceAll(',','\\,').replaceAll('\n','\\n');
    const text=[
      'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//WAVEROOM//Student Demo//EN','BEGIN:VEVENT',
      'UID:'+b.id+'@waveroom-demo.invalid','DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,''),
      'DTSTART:'+calendarTimestamp(b.date,b.time),'DTEND:'+calendarTimestamp(b.date,end),
      'SUMMARY:'+escapeICS('Demo — '+LABELS[b.service]),
      'DESCRIPTION:'+escapeICS('Educational browser-only demo booking. Reference '+b.id),
      'END:VEVENT','END:VCALENDAR',''
    ].join('\r\n');
    const blob=new Blob([text],{type:'text/calendar;charset=utf-8'});
    const uri=URL.createObjectURL(blob);const link=document.createElement('a');link.href=uri;link.download=`waveroom-${b.date}.ics`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(uri),1000);
  });
  updateTimeOptions();updateEstimate();renderBookings();
})();
