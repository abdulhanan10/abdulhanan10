(() => {
  const targets = document.querySelectorAll('section .section-head, section .card, section .item, section .skill, section .achievement, .proof');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  targets.forEach((el, i) => {
    el.classList.add('js-reveal');
    if (el.matches('.card,.achievement,.skill')) el.style.transitionDelay = `${(i % 3) * 70}ms`;
  });
  if (reduced || !('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, {threshold: 0.12, rootMargin: '0px 0px -35px 0px'});
  targets.forEach(el => observer.observe(el));
})();
