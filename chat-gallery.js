(() => {
  const tracks = [...document.querySelectorAll('.gallery-track')];
  const viewer = document.querySelector('.work-viewer');
  if (!tracks.length || !viewer) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const works = [];
  const content = viewer.querySelector('.viewer-content');
  const title = viewer.querySelector('#viewer-title');
  const category = viewer.querySelector('.viewer-category');
  const counter = viewer.querySelector('.viewer-counter');
  const closeButton = viewer.querySelector('.viewer-close');
  const thumbnails = viewer.querySelector('.viewer-thumbnails');
  let selected = 0;
  let opener = null;

  tracks.forEach(track => {
    const strip = track.querySelector('.gallery-slides');
    const originals = [...strip.querySelectorAll('.gallery-slide')];
    if (!originals.length) return;

    originals.forEach(slide => {
      slide.dataset.workIndex = String(works.length);
      works.push({
        frame: slide.querySelector('.gallery-image'),
        title: slide.querySelector('figcaption strong').textContent,
        category: slide.querySelector('figcaption span').textContent
      });
    });

    const makeCopy = slide => {
      const copy = slide.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      copy.querySelectorAll('button, a').forEach(element => { element.tabIndex = -1; });
      return copy;
    };
    const before = originals.map(makeCopy);
    const after = originals.map(makeCopy);
    before.forEach(copy => strip.insertBefore(copy, originals[0]));
    after.forEach(copy => strip.appendChild(copy));
    const all = [...before, ...originals, ...after];
    const direction = Number(track.dataset.direction) === 1 ? 1 : -1;
    let current = 0, animation = 0, drag = null, hovered = false, focused = false;
    let visible = true, pauseUntil = 0, lastTime = 0, ready = false, autoPos = null;
    let suppressClick = false;
    const position = i => all[i].offsetLeft - all[0].offsetLeft;
    const period = () => originals[0].offsetLeft - all[0].offsetLeft;
    const pause = () => { autoPos = null; pauseUntil = performance.now() + 6500; };

    function nearest() {
      let best = 0;
      for (let i = 1; i < all.length; i++) {
        if (Math.abs(position(i) - track.scrollLeft) < Math.abs(position(best) - track.scrollLeft)) best = i;
      }
      return best;
    }
    function sync() {
      current = ((nearest() - before.length) % originals.length + originals.length) % originals.length;
    }
    function goTo(delta) {
      pause();
      let index = nearest();
      // Start navigation from the middle copy, leaving room for a full transition.
      if (index < before.length) {
        track.scrollLeft += period();
        index += originals.length;
      } else if (index >= before.length + originals.length) {
        track.scrollLeft -= period();
        index -= originals.length;
      }
      const next = index + delta;
      track.scrollTo({ left: position(next), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      current = ((next - before.length) % originals.length + originals.length) % originals.length;
    }
    const gallery = track.closest('.gallery-message');
    gallery.querySelector('.gallery-nav-prev').addEventListener('click', () => goTo(-1));
    gallery.querySelector('.gallery-nav-next').addEventListener('click', () => goTo(1));
    function init() {
      if (period() <= 0) return;
      track.scrollLeft = period();
      ready = true;
      sync();
    }

    track.addEventListener('click', event => {
      const button = event.target.closest('.gallery-open');
      if (!button || !track.contains(button)) return;
      if (suppressClick) { suppressClick = false; event.preventDefault(); return; }
      const slide = button.closest('.gallery-slide');
      pause();
      openWork(Number(slide.dataset.workIndex), button);
    });
    track.addEventListener('scroll', () => {
      cancelAnimationFrame(animation);
      animation = requestAnimationFrame(() => {
        const cycle = period();
        if (ready && cycle > 0) {
          // Reposition within the repeated strip before reaching either end.
          const shift = track.scrollLeft < cycle * .5 ? cycle :
            track.scrollLeft >= cycle * 2.5 ? -cycle : 0;
          if (shift) {
            track.scrollLeft += shift;
            if (drag) drag.left += shift;
            if (autoPos !== null) autoPos += shift;
          }
        }
        sync();
      });
    }, { passive: true });
    track.addEventListener('keydown', event => {
      if (event.key === 'ArrowRight') { event.preventDefault(); goTo(1); }
      else if (event.key === 'ArrowLeft') { event.preventDefault(); goTo(-1); }
    });
    track.addEventListener('mouseenter', () => { hovered = true; });
    track.addEventListener('mouseleave', () => { hovered = false; });
    track.addEventListener('focusin', () => { focused = true; });
    track.addEventListener('focusout', event => { if (!track.contains(event.relatedTarget)) focused = false; });
    track.addEventListener('pointerdown', event => {
      pause();
      suppressClick = false;
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      drag = { x: event.clientX, left: track.scrollLeft, moved: false };
    });
    track.addEventListener('pointermove', event => {
      if (!drag) return;
      const dx = event.clientX - drag.x;
      if (Math.abs(dx) > 5 && !drag.moved) {
        drag.moved = true;
        track.setPointerCapture(event.pointerId);
        track.classList.add('is-dragging');
      }
      if (drag.moved) track.scrollLeft = drag.left - dx;
    });
    function finish(event) {
      if (!drag) return;
      const moved = drag.moved;
      drag = null;
      track.classList.remove('is-dragging');
      if (moved) {
        suppressClick = true;
        if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
        pause();
      }
    }
    track.addEventListener('pointerup', finish);
    track.addEventListener('pointercancel', finish);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); },
        { threshold: .05 }).observe(track);
    }
    window.addEventListener('resize', () => {
      if (ready) { track.scrollLeft = position(before.length + current); sync(); }
      else init();
    });
    requestAnimationFrame(init);
    function tick(time) {
      if (lastTime && ready && visible && !document.hidden && !reduceMotion.matches &&
          !viewer.open && !hovered && !focused && !drag && time >= pauseUntil) {
        if (autoPos === null) autoPos = track.scrollLeft;
        autoPos += direction * Math.min(time - lastTime, 50) * .018;
        const cycle = period();
        if (autoPos < cycle) autoPos += cycle;
        else if (autoPos >= 2 * cycle) autoPos -= cycle;
        track.scrollLeft = autoPos;
      } else autoPos = null;
      lastTime = time;
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });

  const thumbnailButtons = works.map((work, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'viewer-thumb';
    button.setAttribute('aria-label', 'Открыть: ' + work.title);
    button.setAttribute('aria-pressed', 'false');
    const preview = work.frame.cloneNode(true);
    preview.setAttribute('aria-hidden', 'true');
    preview.querySelectorAll('img').forEach(image => { image.alt = ''; });
    button.appendChild(preview);
    button.addEventListener('click', () => { selected = index; renderWork(); });
    thumbnails.appendChild(button);
    return button;
  });

  function renderWork() {
    const work = works[selected];
    content.replaceChildren(work.frame.cloneNode(true));
    title.textContent = work.title;
    category.textContent = work.category;
    counter.textContent = (selected + 1) + ' / ' + works.length;
    thumbnailButtons.forEach((button, index) => {
      button.setAttribute('aria-pressed', String(index === selected));
    });
    const active = thumbnailButtons[selected];
    if (active.offsetLeft < thumbnails.scrollLeft) {
      thumbnails.scrollLeft = active.offsetLeft;
    } else if (active.offsetLeft + active.offsetWidth > thumbnails.scrollLeft + thumbnails.clientWidth) {
      thumbnails.scrollLeft = active.offsetLeft + active.offsetWidth - thumbnails.clientWidth;
    }
  }
  function openWork(index, button) {
    if (!Number.isInteger(index) || !works[index]) return;
    selected = index;
    opener = button;
    document.documentElement.classList.add('viewer-open');
    viewer.showModal();
    renderWork();
    closeButton.focus();
  }
  function changeWork(delta) {
    selected = (selected + delta + works.length) % works.length;
    renderWork();
  }
  viewer.querySelector('.viewer-prev').addEventListener('click', () => changeWork(-1));
  viewer.querySelector('.viewer-next').addEventListener('click', () => changeWork(1));
  closeButton.addEventListener('click', () => viewer.close());
  viewer.addEventListener('close', () => {
    document.documentElement.classList.remove('viewer-open');
    if (opener && opener.isConnected) opener.focus({ preventScroll: true });
  });
  viewer.addEventListener('click', event => { if (event.target === viewer) viewer.close(); });
  viewer.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); changeWork(-1); }
    else if (event.key === 'ArrowRight') { event.preventDefault(); changeWork(1); }
  });
})();
