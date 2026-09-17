/* Conway Travel Collective — Main Script */

/* Light-only theme — force light */
document.documentElement.setAttribute('data-theme', 'light');

/* ── Nav: dark glass over hero, compact on scroll ────────────── */
(function () {
  const header = document.getElementById('header');
  const hero   = document.querySelector('.hero');
  if (!header || !hero) return;

  const heroBottom = () => hero.getBoundingClientRect().bottom;

  function updateNav() {
    const overHero = heroBottom() > 0;
    header.classList.toggle('header--dark', overHero);
  }

  updateNav();
  window.addEventListener('scroll', updateNav, { passive: true });
})();

/* ── Hamburger / mobile menu ─────────────────────────────────── */
(function () {
  const btn  = document.getElementById('hamburger');
  const menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('is-open');
    btn.classList.toggle('is-open', isOpen);
    btn.setAttribute('aria-expanded', isOpen);
    menu.setAttribute('aria-hidden', !isOpen);
  });

  // Close on nav link click
  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      menu.classList.remove('is-open');
      btn.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
    });
  });
})();

/* ── Testimonial carousel ────────────────────────────────────── */
(function () {
  const track = document.getElementById('testimonialsTrack');
  if (!track) return;

  const testimonials = Array.from(track.querySelectorAll('.testimonial'));
  const dots = Array.from(document.querySelectorAll('.dot-btn'));
  let current = 0;
  let timer;

  function goTo(index) {
    testimonials[current].classList.remove('testimonial--active');
    dots[current].classList.remove('dot-btn--active');
    dots[current].setAttribute('aria-selected', 'false');

    current = index;

    testimonials[current].classList.add('testimonial--active');
    dots[current].classList.add('dot-btn--active');
    dots[current].setAttribute('aria-selected', 'true');
  }

  function next() {
    goTo((current + 1) % testimonials.length);
  }

  function startAuto() {
    timer = setInterval(next, 4500);
  }

  function stopAuto() {
    clearInterval(timer);
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      stopAuto();
      goTo(i);
      startAuto();
    });
  });

  // Keyboard navigation
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { stopAuto(); next(); startAuto(); }
    if (e.key === 'ArrowLeft') {
      stopAuto();
      goTo((current - 1 + testimonials.length) % testimonials.length);
      startAuto();
    }
  });

  startAuto();
})();

/* ── Smooth anchor scroll with offset ───────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', function (e) {
    const id = this.getAttribute('href').slice(1);
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const offset = 100;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

/* ── Contact form ────────────────────────────────────────────── */
(function () {
  const form = document.getElementById('contactForm');
  if (!form) return;
  const CONCIERGE = 'concierge@conwaytravelcollective.com';

  function mailtoFor(data) {
    const body = [
      'Name: ' + data.name,
      'Email: ' + data.email,
      data.tripType ? 'Service: ' + data.tripType : null,
      '',
      data.message
    ].filter(Boolean).join('\n');
    return 'mailto:' + CONCIERGE +
      '?subject=' + encodeURIComponent('Itinerary inquiry from ' + data.name) +
      '&body=' + encodeURIComponent(body);
  }

  function showThanks(title, body, mailto) {
    form.innerHTML =
      '<p class="eyebrow">Begin Here</p>' +
      '<h3 class="form-success-title">' + title + '</h3>' +
      '<p>' + body + '</p>' +
      (mailto
        ? '<div class="form-btn-row" style="margin-top:1.25rem"><a class="btn btn-primary btn-full" href="' + mailto + '">Open email to concierge</a></div>'
        : '') +
      '<p class="form-note">We respond to all inquiries within 24 hours.</p>';
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const err = document.getElementById('formError');
    if (err) { err.hidden = true; err.textContent = ''; }

    const honey = form.querySelector('[name="website"]');
    if (honey && honey.value) return;

    const firstName = (form.firstName.value || '').trim();
    const lastName = (form.lastName.value || '').trim();
    const email = (form.email.value || '').trim();
    const tripType = (form.tripType.value || '').trim();
    const message = (form.message.value || '').trim();

    if (!firstName || !lastName || !email || !message) {
      if (err) {
        err.hidden = false;
        err.textContent = 'Please complete the required fields.';
      }
      return;
    }

    const btn = form.querySelector('[type="submit"]');
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Sending…';

    const payload = {
      _subject: 'Itinerary inquiry from ' + firstName + ' ' + lastName,
      _template: 'table',
      _captcha: 'false',
      _replyto: email,
      name: firstName + ' ' + lastName,
      email: email,
      tripType: tripType,
      message: message
    };

    try {
      const res = await fetch('https://formsubmit.co/ajax/' + CONCIERGE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json().catch(function () { return {}; });
      const msg = String(json.message || '').toLowerCase();
      const ok = json.success === true || json.success === 'true';
      const needsActivation = msg.indexOf('activate') !== -1 || msg.indexOf('confirm') !== -1;

      if (ok) {
        showThanks(
          'Thank you. We have your note.',
          'It is on its way to ' + CONCIERGE + '. We respond to all inquiries within 24 hours.'
        );
        return;
      }
      if (needsActivation) {
        showThanks(
          'Confirm the inbox once.',
          'FormSubmit sent a one-time confirmation to ' + CONCIERGE + '. Open that email and click confirm. After that, inquiries arrive in the inbox.'
        );
        return;
      }
      showThanks(
        'We could not send that automatically.',
        'Use the button below to send it from your own email, or write ' + CONCIERGE + ' directly.',
        mailtoFor(payload)
      );
    } catch (ex) {
      showThanks(
        'We could not send that automatically.',
        'Use the button below to send it from your own email, or write ' + CONCIERGE + ' directly.',
        mailtoFor(payload)
      );
    } finally {
      if (form.querySelector('[type="submit"]')) {
        btn.disabled = false;
        btn.textContent = original;
      }
    }
  });
})();
