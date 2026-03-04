/* ─── Card Maker — App Logic ─── */

(function () {
  'use strict';

  /* ─── State ─── */
  let currentTemplate = 'tool-intro';
  let currentSize = 'square';
  let currentTheme = 'rose';
  let currentTexture = 'none';
  let fieldData = {};
  let uploadedImage = null;
  window.__watermarkOn = true;
  window.__watermarkText = 'helloruru.com';

  /* ─── DOM Refs ─── */
  const previewCanvas = document.getElementById('previewCanvas');
  const previewWrapper = document.getElementById('previewWrapper');
  const fieldsContainer = document.getElementById('fieldsContainer');
  const imageUploadSection = document.getElementById('imageUploadSection');
  const uploadArea = document.getElementById('uploadArea');
  const imageInput = document.getElementById('imageInput');
  const clearImageBtn = document.getElementById('clearImageBtn');
  const exportBtn = document.getElementById('exportBtn');
  const watermarkToggle = document.getElementById('watermarkToggle');
  const sizeHint = document.getElementById('sizeHint');
  const toast = document.getElementById('toast');

  /* ─── Init ─── */
  function init() {
    bindTemplateButtons();
    bindSizeButtons();
    bindThemeButtons();
    bindTextureButtons();
    bindImageUpload();
    bindWatermark();
    bindExport();
    bindFabPreview();
    bindScrollArrows();
    buildFields();
    renderPreview();
    updatePreviewSize();
    window.addEventListener('resize', updatePreviewSize);
  }

  /* ─── Template Buttons ─── */
  function bindTemplateButtons() {
    document.querySelectorAll('.template-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.template-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTemplate = btn.dataset.template;
        fieldData = {};
        uploadedImage = null;
        buildFields();
        toggleImageUpload();
        renderPreview();
      });
    });
  }

  /* ─── Size Buttons ─── */
  function bindSizeButtons() {
    document.querySelectorAll('.size-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.size-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSize = btn.dataset.size;
        sizeHint.textContent = SIZES[currentSize].label;
        updatePreviewSize();
        renderPreview();
      });
    });
  }

  /* ─── Theme Buttons ─── */
  function bindThemeButtons() {
    document.querySelectorAll('.theme-dot').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.theme-dot').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTheme = btn.dataset.theme;
        renderPreview();
      });
    });
  }

  /* ─── Texture Buttons ─── */
  function bindTextureButtons() {
    document.querySelectorAll('.texture-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.texture-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTexture = btn.dataset.texture;
        renderPreview();
      });
    });
  }

  /* ─── Build Form Fields ─── */
  function buildFields() {
    const tmpl = TEMPLATES[currentTemplate];
    if (!tmpl) return;

    fieldsContainer.innerHTML = tmpl.fields.map(f => {
      const tag = f.type === 'textarea'
        ? `<textarea id="field-${f.id}" placeholder="${f.placeholder || ''}" maxlength="${f.maxLength || 200}" rows="2"></textarea>`
        : `<input type="text" id="field-${f.id}" placeholder="${f.placeholder || ''}" maxlength="${f.maxLength || 100}">`;

      return `<div class="field-group">
        <label for="field-${f.id}">${f.label}</label>
        ${tag}
      </div>`;
    }).join('');

    /* Bind input events */
    tmpl.fields.forEach(f => {
      const el = document.getElementById(`field-${f.id}`);
      if (el) {
        el.addEventListener('input', () => {
          fieldData[f.id] = el.value;
          renderPreview();
        });
      }
    });

    toggleImageUpload();
  }

  /* ─── Toggle Image Upload Section ─── */
  function toggleImageUpload() {
    const tmpl = TEMPLATES[currentTemplate];
    imageUploadSection.style.display = tmpl && tmpl.hasImage ? 'block' : 'none';
    resetImageUpload();
  }

  /* ─── Image Upload ─── */
  function bindImageUpload() {
    uploadArea.addEventListener('click', () => imageInput.click());

    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) handleImageFile(file);
    });

    imageInput.addEventListener('change', () => {
      const file = imageInput.files[0];
      if (file) handleImageFile(file);
    });

    clearImageBtn.addEventListener('click', () => {
      resetImageUpload();
      renderPreview();
    });
  }

  function handleImageFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      resizeImage(e.target.result, 1920, 0.85, (resized) => {
        uploadedImage = resized;
        uploadArea.classList.add('has-image');
        uploadArea.innerHTML = `<img src="${uploadedImage}" alt="uploaded preview">`;
        clearImageBtn.style.display = 'inline-flex';
        renderPreview();
      });
    };
    reader.readAsDataURL(file);
  }

  /**
   * 自動壓縮圖片：限制最大邊 maxPx，輸出 JPEG quality
   * 如果原圖已夠小則不壓縮
   */
  function resizeImage(dataUrl, maxPx, quality, callback) {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      /* 已經夠小，不壓縮 */
      if (width <= maxPx && height <= maxPx) {
        callback(dataUrl);
        return;
      }
      /* 等比縮放 */
      if (width > height) {
        height = Math.round(height * maxPx / width);
        width = maxPx;
      } else {
        width = Math.round(width * maxPx / height);
        height = maxPx;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      callback(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = dataUrl;
  }

  function resetImageUpload() {
    uploadedImage = null;
    uploadArea.classList.remove('has-image');
    uploadArea.innerHTML = `
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
      <p>拖放圖片或點選上傳</p>`;
    clearImageBtn.style.display = 'none';
    imageInput.value = '';
  }

  /* ─── Watermark Toggle + Text ─── */
  function bindWatermark() {
    const watermarkTextInput = document.getElementById('watermarkText');
    const watermarkFieldGroup = document.getElementById('watermarkFieldGroup');

    watermarkToggle.addEventListener('change', () => {
      window.__watermarkOn = watermarkToggle.checked;
      watermarkFieldGroup.style.display = watermarkToggle.checked ? 'block' : 'none';
      renderPreview();
    });

    watermarkTextInput.addEventListener('input', () => {
      window.__watermarkText = watermarkTextInput.value || 'helloruru.com';
      renderPreview();
    });
  }

  /* ─── Scroll Arrows ─── */
  function bindScrollArrows() {
    const panel = document.getElementById('controlsPanel');
    const arrowUp = document.getElementById('scrollArrowUp');
    const arrowDown = document.getElementById('scrollArrowDown');
    if (!panel || !arrowUp || !arrowDown) return;

    function updateArrows() {
      const { scrollTop, scrollHeight, clientHeight } = panel;
      arrowUp.classList.toggle('hidden', scrollTop < 10);
      arrowDown.classList.toggle('hidden', scrollTop + clientHeight >= scrollHeight - 10);
    }

    arrowUp.addEventListener('click', () => {
      panel.scrollBy({ top: -150, behavior: 'smooth' });
    });

    arrowDown.addEventListener('click', () => {
      panel.scrollBy({ top: 150, behavior: 'smooth' });
    });

    panel.addEventListener('scroll', updateArrows, { passive: true });
    /* 初次 + resize 重新判斷 */
    window.addEventListener('resize', updateArrows);
    setTimeout(updateArrows, 100);
  }

  /* ─── Floating Preview Button (mobile) ─── */
  function bindFabPreview() {
    const fab = document.getElementById('fabPreview');
    if (!fab) return;

    fab.addEventListener('click', () => {
      previewWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    function checkVisibility() {
      if (window.innerWidth > 900) { fab.classList.add('hidden'); return; }
      const rect = previewWrapper.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      fab.classList.toggle('hidden', inView);
    }

    window.addEventListener('scroll', checkVisibility, { passive: true });
    window.addEventListener('resize', checkVisibility);
    checkVisibility();
  }

  /* ─── Render Preview ─── */
  function renderPreview() {
    const tmpl = TEMPLATES[currentTemplate];
    if (!tmpl) return;
    previewCanvas.innerHTML = tmpl.render(fieldData, currentTheme, currentSize, uploadedImage, currentTexture);
  }

  /* ─── Preview Sizing ─── */
  function updatePreviewSize() {
    const sz = SIZES[currentSize];
    const wrapperW = previewWrapper.clientWidth - 40;
    const maxH = currentSize === 'story' ? 600 : window.innerHeight * 0.75;

    const scaleX = wrapperW / sz.w;
    const scaleY = maxH / sz.h;
    const scale = Math.min(scaleX, scaleY, 0.6);

    previewCanvas.style.width = sz.w + 'px';
    previewCanvas.style.height = sz.h + 'px';
    previewCanvas.style.transform = `scale(${scale})`;
    previewCanvas.style.transformOrigin = 'top center';

    previewWrapper.style.height = (sz.h * scale + 40) + 'px';
  }

  /* ─── Export PNG ─── */
  function bindExport() {
    exportBtn.addEventListener('click', async () => {
      exportBtn.classList.add('loading');
      exportBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        產生中...`;

      try {
        /* Wait for fonts */
        await document.fonts.ready;

        const sz = SIZES[currentSize];

        /* Temporarily remove scale for capture */
        previewCanvas.style.transform = 'none';
        previewCanvas.style.width = sz.w + 'px';
        previewCanvas.style.height = sz.h + 'px';

        const canvas = await html2canvas(previewCanvas, {
          width: sz.w,
          height: sz.h,
          scale: 1,
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
        });

        /* Restore scale */
        updatePreviewSize();

        /* Download */
        const link = document.createElement('a');
        const templateName = TEMPLATES[currentTemplate]?.name || 'card';
        link.download = `helloruru-${templateName}-${sz.w}x${sz.h}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        showToast('PNG 已下載');
      } catch (err) {
        console.error('Export error:', err);
        showToast('匯出失敗，請再試一次');
      } finally {
        exportBtn.classList.remove('loading');
        exportBtn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          下載 PNG`;
      }
    });
  }

  /* ─── Toast ─── */
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }

  /* ─── Go ─── */
  document.addEventListener('DOMContentLoaded', init);
})();
