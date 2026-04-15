/**
 * 讀墨省錢計算機 — Content Script（書籍頁面）
 * 在 readmoo.com/book/* 自動偵測書價，顯示浮動計算面板
 */

(function () {
  'use strict';

  // 避免重複注入
  if (document.getElementById('rmc-panel')) return;

  /**
   * 從書頁 DOM 抓價格
   */
  function getBookPrice() {
    var result = { price: null, salePrice: null, title: '' };

    // 書名
    var titleEl = document.querySelector('h2[itemprop="name"], .book-header h2, h1');
    if (titleEl) result.title = titleEl.textContent.trim();

    // 主價格區
    var priceBox = document.querySelector('.book-price .price-box');
    if (!priceBox) return result;

    // 電子書售價
    var ourPrice = priceBox.querySelector('.price.our-price strong[itemprop="price"], .price.our-price strong');
    if (ourPrice) {
      result.price = parseInt(ourPrice.textContent.trim(), 10);
    }

    // 紙本定價（用來判斷是否有活動折扣）
    var fixedPrice = priceBox.querySelector('.price.fixed-price strong');
    if (fixedPrice) {
      var original = parseInt(fixedPrice.textContent.trim(), 10);
      // 如果電子書價 < 紙本定價的 7 折，很可能是活動特價
      // 但讀墨電子書本來就比紙本便宜，所以要用 data-on-sale 判斷
    }

    // 活動特價偵測：書頁主體的 price-info 有 data-on-sale
    var priceInfo = document.querySelector('.book-price .price-info');
    if (priceInfo) {
      var onSale = priceInfo.getAttribute('data-on-sale');
      if (onSale === 'true') {
        // 有活動折扣，目前顯示的就是特價
        // 嘗試找原價（通常在 del 標籤裡）
        var origEl = priceBox.querySelector('.price.fixed-price del strong, del strong');
        if (origEl) {
          var origPrice = parseInt(origEl.textContent.trim(), 10);
          // 電子書原價可能在別的地方，這裡先用紙本定價做參考
          result.salePrice = result.price;
          // 讀墨的活動折扣通常是電子書本身再打折
          // 如果有 del 標記的電子書原價
          var allPrices = priceBox.querySelectorAll('.price');
          allPrices.forEach(function (el) {
            var del = el.querySelector('del strong');
            if (del && !el.classList.contains('fixed-price')) {
              result.price = parseInt(del.textContent.trim(), 10);
            }
          });
          // 如果沒找到電子書原價，salePrice 維持 null（不觸發疊疊樂）
          if (result.price === result.salePrice) {
            result.salePrice = null;
          }
        }
      }
    }

    return result;
  }

  /**
   * 建立浮動面板
   */
  function createPanel(data) {
    var panel = document.createElement('div');
    panel.id = 'rmc-panel';
    panel.className = 'rmc-panel';

    var r = data.result;
    if (!r) {
      panel.innerHTML = '<div class="rmc-title">讀墨省錢計算機</div><div class="rmc-empty">偵測不到書價</div>';
      return panel;
    }

    var html = '';
    html += '<div class="rmc-header">';
    html += '<div class="rmc-title">省錢計算機</div>';
    html += '<button class="rmc-close" id="rmc-close">&times;</button>';
    html += '</div>';

    // 省多少 — 最醒目
    if (r.saved > 0) {
      html += '<div class="rmc-saved-banner">';
      html += '<small>用 ' + r.best.name + '</small> 省 $' + r.saved;
      html += '</div>';
    }

    // 書價
    html += '<div class="rmc-price-row">';
    html += '<span class="rmc-label">書價</span>';
    html += '<span class="rmc-value">$' + r.price + '</span>';
    if (r.salePrice) {
      html += '<span class="rmc-sale-badge">活動價 $' + r.salePrice + '</span>';
    }
    html += '</div>';

    // 四種方案
    html += '<div class="rmc-methods">';
    r.methods.forEach(function (m, i) {
      var isBest = (i === 0);
      var cls = 'rmc-method' + (isBest ? ' rmc-best' : '');
      html += '<div class="' + cls + '">';
      html += '<span class="rmc-method-name">' + m.name;
      if (m.points) html += ' (' + m.points + '\u9ede)';
      html += '</span>';
      html += '<span class="rmc-method-cost">$' + m.cost + '</span>';
      if (isBest) html += '<span class="rmc-badge">\u6700\u7701</span>';
      html += '</div>';
    });
    html += '</div>';

    // 疊疊樂
    if (r.stack) {
      html += '<div class="rmc-stack">';
      html += '<div class="rmc-stack-title">疊疊樂</div>';
      html += '<div class="rmc-method' + (r.stack.cost <= r.methods[0].cost ? ' rmc-best' : '') + '">';
      html += '<span class="rmc-method-name">' + r.stack.name + '</span>';
      html += '<span class="rmc-method-cost">$' + r.stack.cost + '</span>';
      if (r.stack.cost <= r.methods[0].cost) {
        html += '<span class="rmc-badge">\u6700\u7701</span>';
      }
      html += '</div>';
      html += '</div>';
    }

    // 建議
    html += '<div class="rmc-advice">' + r.advice + '</div>';

    // 甜蜜區提醒
    var price = r.salePrice || r.price;
    if (price >= 50 && price <= 199) {
      html += '<div class="rmc-sweet">\u629850\u5238\u6700\u5f37\u89e3\uff01\u4e0d\u9650\u91d1\u984d\u6298$50</div>';
    } else if (price >= 224 && price <= 250) {
      html += '<div class="rmc-sweet">\u7518\u871c\u5340\uff011 \u9ede\u9818\u66f8\u6700\u8d85\u503c</div>';
    } else if (price >= 445 && price <= 500) {
      html += '<div class="rmc-sweet">2 \u9ede\u9818\u66f8 $334\uff0c\u6bd4 75 \u6298\u4fbf\u5b9c</div>';
    }

    // 連結到網頁版
    html += '<div class="rmc-footer">';
    html += '<a href="https://tools.helloruru.com/readmoo-buy/" target="_blank" class="rmc-link">完整計算機 &rarr;</a>';
    html += '</div>';

    panel.innerHTML = html;
    return panel;
  }

  /**
   * 建立迷你觸發按鈕（面板關閉後顯示）
   */
  function createToggle() {
    var btn = document.createElement('button');
    btn.id = 'rmc-toggle';
    btn.className = 'rmc-toggle';
    btn.textContent = '$';
    btn.title = '讀墨省錢計算機';
    btn.style.display = 'none';
    return btn;
  }

  /**
   * 初始化
   */
  function init() {
    var bookData = getBookPrice();
    if (!bookData.price) return;

    var result = ReadmooCalc.calculate(bookData.price, bookData.salePrice);
    bookData.result = result;

    var panel = createPanel(bookData);
    var toggle = createToggle();

    document.body.appendChild(panel);
    document.body.appendChild(toggle);

    // 關閉面板
    panel.addEventListener('click', function (e) {
      if (e.target.id === 'rmc-close') {
        panel.style.display = 'none';
        toggle.style.display = 'flex';
      }
    });

    // 重新打開
    toggle.addEventListener('click', function () {
      panel.style.display = '';
      toggle.style.display = 'none';
    });
  }

  // 等頁面完全載入
  if (document.readyState === 'complete') {
    init();
  } else {
    window.addEventListener('load', function () {
      setTimeout(init, 500);
    });
  }
})();
