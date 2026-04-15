/**
 * 讀墨省錢計算機 — Cart Script（購物車頁面）
 * 在 readmoo.com/cart 偵測所有書籍，計算整車最佳組合
 */

(function () {
  'use strict';

  if (document.getElementById('rmc-cart-panel')) return;

  /**
   * 從購物車 DOM 抓取所有書籍和價格
   * 購物車的結構需要登入才能看到，以下 selector 基於讀墨常見結構
   * 如果結構不對，會顯示手動輸入模式
   */
  function getCartBooks() {
    var books = [];

    // 嘗試多種常見 selector
    var selectors = [
      '.cart-item, .cart-list-item, .cartItem',
      'tr[class*="cart"], tr[class*="item"]',
      '[class*="cart"] [class*="item"]',
      '.rm-book-item, .book-item'
    ];

    var items = null;
    for (var i = 0; i < selectors.length; i++) {
      items = document.querySelectorAll(selectors[i]);
      if (items.length > 0) break;
    }

    if (!items || items.length === 0) {
      // fallback：掃描所有價格元素
      var priceEls = document.querySelectorAll('.price.our-price, [class*="price"] strong');
      priceEls.forEach(function (el) {
        var priceText = el.textContent.trim().replace(/[^\d]/g, '');
        var price = parseInt(priceText, 10);
        if (price > 0 && price < 10000) {
          // 嘗試找鄰近的書名
          var parent = el.closest('[class*="item"], tr, li, [class*="book"]');
          var titleEl = parent ? parent.querySelector('a[href*="/book/"], h3, h4, .title, [class*="title"]') : null;
          var title = titleEl ? titleEl.textContent.trim() : '未知書名';

          // 檢查是否有活動折扣
          var saleEl = parent ? parent.querySelector('[data-on-sale="true"], .bg-danger, [class*="sale"]') : null;

          books.push({
            title: title,
            price: price,
            salePrice: saleEl ? price : null
          });
        }
      });
    } else {
      items.forEach(function (item) {
        var titleEl = item.querySelector('a[href*="/book/"], h3, h4, .title, [class*="title"]');
        var priceEl = item.querySelector('.price.our-price strong, [class*="price"] strong');

        if (priceEl) {
          var priceText = priceEl.textContent.trim().replace(/[^\d]/g, '');
          var price = parseInt(priceText, 10);

          var saleEl = item.querySelector('[data-on-sale="true"], .bg-danger');

          books.push({
            title: titleEl ? titleEl.textContent.trim() : '未知書名',
            price: price,
            salePrice: saleEl ? price : null
          });
        }
      });
    }

    return books;
  }

  /**
   * 建立購物車面板
   */
  function createCartPanel(cartResult) {
    var panel = document.createElement('div');
    panel.id = 'rmc-cart-panel';
    panel.className = 'rmc-panel rmc-cart-panel';

    if (!cartResult || cartResult.books.length === 0) {
      panel.innerHTML = '<div class="rmc-header">' +
        '<div class="rmc-title">省錢計算機</div>' +
        '<button class="rmc-close" id="rmc-cart-close">&times;</button>' +
        '</div>' +
        '<div class="rmc-empty">偵測不到購物車書籍，可能結構有變。<br>請到 <a href="https://tools.helloruru.com/readmoo-buy/" target="_blank">網頁版</a> 手動計算。</div>';
      return panel;
    }

    var html = '';
    html += '<div class="rmc-header">';
    html += '<div class="rmc-title">購物車省錢攻略</div>';
    html += '<button class="rmc-close" id="rmc-cart-close">&times;</button>';
    html += '</div>';

    // 總計
    html += '<div class="rmc-cart-summary">';
    html += '<div class="rmc-summary-row">';
    html += '<span>原價總計</span>';
    html += '<span>$' + cartResult.totalOriginal + '</span>';
    html += '</div>';
    html += '<div class="rmc-summary-row rmc-summary-best">';
    html += '<span>最佳組合</span>';
    html += '<span>$' + cartResult.totalOptimized + '</span>';
    html += '</div>';
    html += '<div class="rmc-summary-row rmc-summary-saved">';
    html += '<span>共省</span>';
    html += '<span>$' + cartResult.totalSaved + '</span>';
    html += '</div>';
    html += '</div>';

    // 每本書的建議
    html += '<div class="rmc-cart-books">';
    cartResult.books.forEach(function (book) {
      if (!book.result) return;
      var best = book.result.best;
      html += '<div class="rmc-cart-book">';
      html += '<div class="rmc-cart-book-title">' + book.title.substring(0, 25) + '</div>';
      html += '<div class="rmc-cart-book-detail">';
      html += '<span class="rmc-label">$' + book.price + '</span>';
      html += '<span class="rmc-arrow">&rarr;</span>';
      html += '<span class="rmc-badge">' + best.name + ' $' + best.cost + '</span>';
      html += '</div>';
      html += '</div>';
    });
    html += '</div>';

    // 連結
    html += '<div class="rmc-footer">';
    html += '<a href="https://tools.helloruru.com/readmoo-buy/" target="_blank" class="rmc-link">完整計算機 &rarr;</a>';
    html += '</div>';

    panel.innerHTML = html;
    return panel;
  }

  function init() {
    // 等購物車內容載入
    var books = getCartBooks();

    if (books.length === 0) {
      // 購物車可能動態載入，觀察 DOM 變化
      var observer = new MutationObserver(function (mutations, obs) {
        books = getCartBooks();
        if (books.length > 0) {
          obs.disconnect();
          render(books);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });

      // 10 秒後放棄
      setTimeout(function () {
        observer.disconnect();
        if (books.length === 0) {
          render([]);
        }
      }, 10000);
    } else {
      render(books);
    }
  }

  function render(books) {
    var cartResult = ReadmooCalc.cartOptimize(books);
    var panel = createCartPanel(cartResult);
    document.body.appendChild(panel);

    panel.addEventListener('click', function (e) {
      if (e.target.id === 'rmc-cart-close') {
        panel.style.display = 'none';
      }
    });
  }

  if (document.readyState === 'complete') {
    setTimeout(init, 1000);
  } else {
    window.addEventListener('load', function () {
      setTimeout(init, 1500);
    });
  }
})();
