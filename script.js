const WA_NUMBER = '5542999114157';

document.addEventListener('DOMContentLoaded', function () {

  // Hamburger menu
  const btnHamburger = document.getElementById('btn-hamburger');
  const mainNav = document.getElementById('main-nav');

  btnHamburger.addEventListener('click', function () {
    const isOpen = mainNav.classList.toggle('open');
    this.classList.toggle('open');
    this.setAttribute('aria-expanded', String(isOpen));
  });

  // Close menu when clicking a nav link (mobile)
  document.querySelectorAll('.main-nav a').forEach(a => {
    a.addEventListener('click', () => {
      if (mainNav.classList.contains('open')) {
        mainNav.classList.remove('open');
        btnHamburger.classList.remove('open');
        btnHamburger.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // Filtering
  const filterBtns = Array.from(document.querySelectorAll('.filter-btn'));
  const productCards = Array.from(document.querySelectorAll('.product-card'));
  const grid = document.getElementById('grid-products');

  function setActiveFilter(btn) {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  function filterProducts(filter) {
    productCards.forEach(card => {
      const cat = card.getAttribute('data-category');
      if (filter === 'all' || cat === filter) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter');
      setActiveFilter(btn);
      filterProducts(filter);
      // accessibility: move focus to grid
      grid.focus?.();
    });
  });

  // Smooth scroll (anchors)
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href').slice(1);
      if (!targetId) return;
      const target = document.getElementById(targetId);
      if (target) {
        e.preventDefault();
        if (mainNav.classList.contains('open')) mainNav.classList.remove('open');
        const offset = 70; // header height offset
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // Year in footer
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ===== Modal logic (imagem + receita) =====
  const modal = document.getElementById('image-modal');
  const modalPanel = modal.querySelector('.modal-panel');
  const modalImg = document.getElementById('modal-img');
  const modalTitle = document.getElementById('modal-title');
  const modalRecipe = document.getElementById('modal-recipe');
  const modalClose = modal.querySelector('.modal-close');
  const btnCopy = document.getElementById('btn-copy-recipe');
  const btnShareWhatsapp = document.getElementById('btn-share-whatsapp');

  let lastFocusedElement = null;

  // Helper: find recipe JSON by id
  function getRecipeById(id) {
    if (!id) return null;
    const script = document.getElementById(`recipe-${id}`);
    if (!script) return null;
    try {
      return JSON.parse(script.textContent);
    } catch (err) {
      console.warn('Erro ao parsear receita', id, err);
      return null;
    }
  }

  // Open modal and populate
  function openModal({ imgSrc, title, recipeHtml, shareText }) {
    lastFocusedElement = document.activeElement;
    modalImg.src = imgSrc || '';
    modalImg.alt = title || 'Imagem do produto';
    modalTitle.textContent = title || '';
    modalRecipe.innerHTML = recipeHtml || '<p><em>Receita não disponível para este item.</em></p>';

    // Setup WhatsApp share button
    const textToShare = shareText || `${title} - Estou interessado(a).`;
    const encoded = encodeURIComponent(textToShare);
    btnShareWhatsapp.setAttribute('href', `https://wa.me/${WA_NUMBER}?text=${encoded}`);

    // make modal visible
    modal.setAttribute('aria-hidden', 'false');

    // focus management
    modalClose.focus();

    // disable background scroll
    document.documentElement.style.overflow = 'hidden';
  }

  // Close modal
  function closeModal() {
    modal.setAttribute('aria-hidden', 'true');
    modalImg.src = '';
    modalTitle.textContent = '';
    modalRecipe.innerHTML = '';
    document.documentElement.style.overflow = '';
    // restore focus
    if (lastFocusedElement) {
      try { lastFocusedElement.focus(); } catch (e) {}
      lastFocusedElement = null;
    }
  }

  // Click handlers: open modal when clicking image
  productCards.forEach(card => {
    const img = card.querySelector('img');
    const titleEl = card.querySelector('.product-name');
    const recipeId = card.dataset.recipeId;

    // image click opens modal with recipe
    if (img) {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', (e) => {
        e.stopPropagation(); // don't bubble to card click (if later used)
        const title = titleEl ? titleEl.textContent.trim() : '';
        let recipeObj = getRecipeById(recipeId);
        const recipeHtml = recipeObj ? recipeObj.recipe : null;
        const shareText = recipeObj ? `${recipeObj.title} - ${stripTags(recipeObj.recipe).slice(0,120)}...` : `${title} - Tenho interesse`;
        openModal({ imgSrc: img.src, title, recipeHtml, shareText });
      });
    }

    // keyboard activate on card (Enter / Space triggers image click)
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        // simulate image click if exists
        const triggerImg = card.querySelector('img');
        if (triggerImg) triggerImg.click();
      }
    });
  });

  // copy button
  btnCopy.addEventListener('click', async () => {
    // copy text version of recipe (strip HTML)
    const text = stripTags(modalRecipe.innerHTML);
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      btnCopy.textContent = 'Copiado!';
      setTimeout(() => btnCopy.textContent = 'Copiar receita', 1800);
    } catch (err) {
      // fallback: select and prompt
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        btnCopy.textContent = 'Copiado!';
      } catch (e) {
        alert('Não foi possível copiar automaticamente. Selecione e copie manualmente.');
      }
      ta.remove();
      setTimeout(() => btnCopy.textContent = 'Copiar receita', 1800);
    }
  });

  // close handlers
  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    // close when clicking the overlay outside modal-panel
    if (e.target === modal) closeModal();
  });

  // keyboard: Esc to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
      closeModal();
    }
  });

  // small utility: strip HTML tags preserving newlines for copy
  function stripTags(html) {
    if (!html) return '';
    // Replace <br> and </p> with newlines
    let text = html.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<\/p>/gi, '\n');
    // remove all remaining tags
    text = text.replace(/<\/?[^>]+(>|$)/g, '');
    // decode HTML entities (basic)
    text = text.replace(/&nbsp;/g, ' ');
    const txt = document.createElement('textarea');
    txt.innerHTML = text;
    return txt.value.trim();
  }

  // ===== Floating WhatsApp button -> use general message already in href in HTML =====
  const whatsappFloat = document.getElementById('whatsapp-float');
  if (whatsappFloat && WA_NUMBER && WA_NUMBER !== 'SEUNUMERO') {
    const encodedDefaultMsg = encodeURIComponent('Olá, tenho interesse nos produtos de crochê');
    whatsappFloat.setAttribute('href', `https://wa.me/${WA_NUMBER}?text=${encodedDefaultMsg}`);
  }

  // Accessibility: trap focus inside modal when open (simple)
  document.addEventListener('focus', function (event) {
    if (modal.getAttribute('aria-hidden') === 'false') {
      if (!modal.contains(event.target)) {
        // move focus back to close button
        modalClose.focus();
      }
    }
  }, true);

});
