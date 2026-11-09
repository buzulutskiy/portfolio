(() => {
  const messages = [...document.querySelectorAll('.chat-animate')];
  if (!messages.length || !('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let nextAppearance = 0;
  const observer = new IntersectionObserver(entries => {
    entries.filter(entry => entry.isIntersecting)
      .sort((a, b) => messages.indexOf(a.target) - messages.indexOf(b.target))
      .forEach(({ target }) => {
        observer.unobserve(target);
        const now = performance.now();
        const delay = Math.max(0, nextAppearance - now);
        nextAppearance = now + delay + 90;
        window.setTimeout(() => target.classList.remove('is-waiting'), delay);
      });
  }, { threshold: 0.08 });

  messages.forEach(message => {
    message.classList.add('chat-message', 'is-waiting');
    observer.observe(message);
  });
})();

(() => {
  const dialog = document.querySelector('.background-case');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const cases = {
    agenton: { title: 'Рамблер. Недвижимость', description: 'Сервис для агентов недвижимости', task: 'Создать удобный инструмент для быстрой и продуктивной работы агентов недвижимости.', team: 'Арт-директор — Евгений Маскаев. Дизайнеры — Антон Бузулуцкий, Наталья Рыбьякова. Менеджер — Сергей Дубовенко.', files: ['01.png', '02.jpg', '03.png', '04.png', '05.png', '06.png'] },
    dashbords: { title: 'MYBOX', description: 'ERP-система для федеральной сети ресторанов', task: 'Разработать сервис для аналитики показателей компании MYBOX.', team: 'Арт-директор — Евгений Маскаев. Дизайнер — Антон Бузулуцкий. Технологи — Денис Греков, Сергей Пичужкин, Михаил Греков.', files: ['01.jpg', '02.png', '03.png', '04.png', '05.png', '06.png', '07.png'] },
    youhookhacrm: { title: 'YouhookahCRM', description: 'Система управления кальянной', task: 'Спроектировать CRM.', team: 'Арт-директор — Евгений Маскаев. Дизайнеры — Антон Бузулуцкий, Виктория Чичиль.', files: ['01.png', '02.png', '03.png', '04.png', '05.png', '06.png', '07.png', '08.png'] }
  };
  let opener;
  document.querySelectorAll('[data-background-case]').forEach(link => link.addEventListener('click', event => {
    const item = cases[link.dataset.backgroundCase];
    if (!item || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    opener = link;
    dialog.querySelector('#background-case-title').textContent = item.title;
    dialog.querySelector('.background-case-description').textContent = item.description;
    const blocks = window.backgroundCaseBlocks?.[link.dataset.backgroundCase];
    const caseBlocks = [{ title: 'Задача', text: item.task }, ...(blocks || item.files.map(file => ({ image: `assets/background-cases/${link.dataset.backgroundCase}/${file}` }))), { title: 'Над проектом работали', text: item.team }];
    const content = caseBlocks.map((block, index) => {
      if (block.image) {
        const image = document.createElement('img');
        image.src = block.image;
        image.alt = `${item.title} — изображение ${index + 1}`;
        image.loading = 'lazy';
        return image;
      }
      const section = document.createElement('section');
      section.className = 'background-case-text';
      if (block.title) { const heading = document.createElement('h3'); heading.textContent = block.title; section.append(heading); }
      const paragraph = document.createElement('p'); paragraph.textContent = block.text; section.append(paragraph);
      return section;
    });
    dialog.querySelector('.background-case-images').replaceChildren(...content);
    dialog.showModal();
    dialog.scrollTop = 0;
    dialog.querySelector('.background-case-close').focus();
  }));
  dialog.querySelector('.background-case-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => opener?.focus({ preventScroll: true }));
})();

(() => {
  const dialog = document.querySelector('.plugin-preview');
  if (!dialog) return;
  const previews = {
    keiko: ['Трекер чтения', 'Для себя я захотел сделать книжный трекер, в котором можно узнавать о книге больше, не обращаясь к разным источникам. Добавил идею игровых механик: маршруты героев, интересные факты и награды за чтение.\n\nВ проекте экспериментировал с ИИ, изучал GitHub и подключал Яндекс.Карты через API.'],
    task: ['Подготовка файла по задаче', 'Для каждой задачи приходилось вручную создавать страницы с нужными названиями, оформлять обложку и добавлять ссылку на Jira. Мне хотелось убрать эту повторяющуюся работу.\n\nЯ сделал плагин для Figma: он подключается к серверной Jira по токену, подтягивает информацию о задаче и помогает подготовить файл — создать страницы и обложку со ссылкой на задачу.'],
    components: ['Перенос компонентов в библиотеку', 'В Figma перенос компонентов между файлами требует нескольких действий: нужно подготовить библиотеку, перенести компоненты и перепривязать их экземпляры.\n\nЯ собрал плагин, который проводит через этот процесс и учитывает ограничения Figma. Часть действий выполняется вручную, но последовательность видна прямо в интерфейсе.'],
    catalog: ['Каталог экранов', 'Помогает искать и открывать нужные экраны в Figma.']
  };
  let opener = null;
  document.querySelectorAll('.plugin-link').forEach(button => {
    button.addEventListener('click', () => {
      const preview = previews[button.dataset.plugin];
      if (!preview) return;
      opener = button;
      dialog.querySelector('#plugin-preview-title').textContent = preview[0];
      dialog.querySelector('.plugin-preview-tag').hidden = button.dataset.plugin !== 'keiko';
      const video = dialog.querySelector('.plugin-case-video');
      video.hidden = button.dataset.plugin !== 'task';
      if (video.hidden) video.pause();
      dialog.querySelector('.keiko-screens').hidden = button.dataset.plugin !== 'keiko';
      dialog.querySelector('.plugin-preview-description').textContent = preview[1];
      dialog.showModal();
      dialog.querySelector('.plugin-preview-close').focus();
    });
  });
  dialog.querySelector('.plugin-preview-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { dialog.querySelector('.plugin-case-video').pause(); if (opener) opener.focus({ preventScroll: true }); });
})();

(() => {
  const dialogs = document.querySelectorAll('.background-case');
  const projects = dialog => [...document.querySelectorAll(
    dialog.matches('.plugin-preview') ? '.plugin-link[data-plugin]' : '[data-background-case]'
  )];
  let active = null;
  let navigating = false;
  document.querySelectorAll('.plugin-link[data-plugin], [data-background-case]').forEach(item => {
    item.addEventListener('click', event => {
      if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) active = item;
    });
  });
  dialogs.forEach(dialog => {
    const shell = dialog.querySelector('.plugin-preview-shell, .background-case-shell');
    const nav = document.createElement('nav');
    nav.className = 'case-navigation';
    nav.setAttribute('aria-label', 'Навигация по проектам');
    for (const [direction, label, symbol] of [[-1, 'Предыдущий проект', '←'], [1, 'Следующий проект', '→']]) {
      const button = document.createElement('button');
      button.type = 'button'; button.innerHTML = direction < 0 ? '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14.5 5 7.5 12l7 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9.5 5 7 7-7 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'; button.setAttribute('aria-label', label); button.title = label; const caption = document.createElement('span'); caption.textContent = label; if (direction < 0) button.append(caption); else button.prepend(caption);
      button.addEventListener('click', () => {
        const items = projects(dialog);
        const index = items.indexOf(active);
        if (index < 0 || !items.length) return;
        navigating = true;
        dialog.close();
        items[(index + direction + items.length) % items.length].click();
        navigating = false;
      });
      nav.append(button);
    }
    shell.append(nav);
  });
})();

(() => {
  const video = document.querySelector('.wolf-preview');
  const source = video?.querySelector('source[data-src]');
  if (!source) return;
  const load = () => { source.src = source.dataset.src; delete source.dataset.src; video.load(); };
  if (!('IntersectionObserver' in window)) { load(); return; }
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); load(); }
  }, { rootMargin: '300px' });
  observer.observe(video);
})();

(() => {
  const images = [...document.querySelectorAll('.keiko-screens .keiko-crop')];
  const viewer = document.createElement('dialog');
  viewer.className = 'keiko-viewer';
  viewer.setAttribute('aria-label', 'Просмотр экрана');
  viewer.innerHTML = '<button type="button" class="keiko-viewer-close" aria-label="Закрыть просмотр">×</button><div class="keiko-viewer-image"></div><div class="keiko-viewer-caption"></div>';
  document.body.append(viewer);
  let opener;
  images.forEach((frame) => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'keiko-open';
    button.setAttribute('aria-label', 'Увеличить: ' + frame.querySelector('img').alt);
    frame.replaceWith(button); button.append(frame);
    button.addEventListener('click', () => {
      opener = button;
      viewer.querySelector('.keiko-viewer-image').replaceChildren(frame.cloneNode(true));
      viewer.querySelector('.keiko-viewer-caption').textContent = frame.querySelector('img').alt;
      viewer.showModal(); viewer.querySelector('.keiko-viewer-close').focus();
    });
  });
  document.querySelector('.background-case-images')?.addEventListener('click', event => {
    const img = event.target.closest('img');
    if (!img) return;
    opener = img;
    const copy = img.cloneNode(true); copy.className = 'case-full-image';
    viewer.querySelector('.keiko-viewer-image').replaceChildren(copy);
    viewer.querySelector('.keiko-viewer-caption').textContent = img.alt;
    viewer.showModal(); viewer.querySelector('.keiko-viewer-close').focus();
  });
  viewer.querySelector('.keiko-viewer-close').addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', event => { if (event.target === viewer) viewer.close(); });
  viewer.addEventListener('close', () => opener?.focus({ preventScroll: true }));
})();
