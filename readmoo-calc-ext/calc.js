/**
 * 讀墨省錢計算機 — 核心計算模組
 * 與網頁版 app.js 邏輯同步，供 content script 和 cart script 共用
 */

var ReadmooCalc = (function () {
  'use strict';

  var PLAN_COST = 999;
  var PLAN_POINTS = 6;
  var POINT_COST = PLAN_COST / PLAN_POINTS; // 166.5
  var POINT_LIMIT = 250;

  function pointsNeeded(price) {
    return Math.ceil(price / POINT_LIMIT);
  }

  function redeemCost(price) {
    return pointsNeeded(price) * POINT_COST;
  }

  /**
   * 計算六種方案（與網頁版 app.js 同步）
   * @param {number} price - 電子書售價
   * @param {number} [salePrice] - 活動特價（有的話算疊疊樂）
   * @returns {object} { methods, advice, best, saved, stack }
   */
  function calculate(price, salePrice) {
    if (!price || price < 50) return null;

    var effectivePrice = salePrice || price;

    var methods = [
      { name: '7\u6298\u5238', cost: Math.round(effectivePrice * 0.7), tag: '7\u6298\u512a\u60e0\u5238' },
      { name: '75\u6298\u5238', cost: Math.round(effectivePrice * 0.75), tag: '375\u5238\uff083\u672c\u4ee5\u4e0a75\u6298\uff09' },
      { name: '8\u6298\u5238', cost: Math.round(effectivePrice * 0.8), tag: '\u55ae\u672c8\u6298' },
      {
        name: '\u629850\u5238',
        cost: Math.max(effectivePrice - 50, 0),
        tag: effectivePrice >= 250 ? '\u6eff250\u6298$50\uff08\u7d05\u5229\u514c\u63db\uff09' : '\u4e0d\u9650\u91d1\u984d\u6298$50'
      },
      {
        name: '\u9818\u66f8\u984d\u5ea6',
        cost: Math.round(redeemCost(effectivePrice)),
        tag: '\u55dc\u8b80999\uff081\u9ede=$167\uff09',
        points: pointsNeeded(effectivePrice)
      },
      { name: '\u539f\u50f9', cost: effectivePrice, tag: '\u7121\u6298\u6263' }
    ];

    methods.sort(function (a, b) { return a.cost - b.cost; });

    var best = methods[0];
    var saved = effectivePrice - best.cost;

    // 疊疊樂：活動折扣 + 優惠券
    var stack = null;
    if (salePrice && salePrice < price) {
      var stackWith70 = Math.round(salePrice * 0.7);
      var stackWith75 = Math.round(salePrice * 0.75);
      var stackWith80 = Math.round(salePrice * 0.8);
      var stackBest = Math.min(stackWith70, stackWith75, stackWith80);
      var stackName;
      if (stackBest === stackWith70) stackName = '\u6d3b\u52d5\u50f9 + 7\u6298';
      else if (stackBest === stackWith75) stackName = '\u6d3b\u52d5\u50f9 + 75\u6298';
      else stackName = '\u6d3b\u52d5\u50f9 + 8\u6298';
      var stackSaved = price - stackBest;

      stack = {
        name: stackName,
        cost: stackBest,
        saved: stackSaved,
        originalPrice: price,
        salePrice: salePrice
      };

      if (stackBest < best.cost) {
        best = { name: stackName, cost: stackBest };
        saved = price - stackBest;
      }
    }

    var advice = getAdvice(effectivePrice, methods, stack);

    return {
      methods: methods,
      best: best,
      saved: saved,
      stack: stack,
      advice: advice,
      price: price,
      salePrice: salePrice || null
    };
  }

  function getAdvice(price, methods, stack) {
    if (!methods) return '';

    // 疊疊樂最划算
    if (stack && stack.cost <= methods[0].cost) {
      return '\u758a\u758a\u6a02\u6700\u5283\u7b97\uff01' + stack.name + ' $' + stack.cost + '\uff0c\u7701 $' + stack.saved;
    }

    var best = methods[0];
    var saved = price - best.cost;
    var pts = pointsNeeded(price);
    var isRedeem = best.name === '\u9818\u66f8\u984d\u5ea6';
    var isCoupon50 = best.name === '\u629850\u5238';

    if (isCoupon50) {
      return '\u629850\u5238\u6700\u7701\uff0c\u7701 $' + saved + '\u3002\u4fbf\u5b9c\u66f8\u76f4\u63a5\u7528\u629850\u5238\u6700\u5283\u7b97\uff0c\u6253\u6298\u5238\u548c\u9818\u66f8\u984d\u5ea6\u7559\u7d66\u8cb4\u7684\u66f8\u3002';
    }

    if (isRedeem) {
      if (pts === 1) {
        return '\u9818\u66f8\u7684\u751c\u871c\u5340\uff0c' + pts + ' \u9ede $' + best.cost + '\uff0c\u7701 $' + saved;
      }
      return '\u9818\u66f8\u984d\u5ea6\uff08' + pts + '\u9ede\uff09\u6700\u5283\u7b97\uff0c\u7701 $' + saved;
    }

    if (price > 500) {
      return best.name + '\u6700\u7701\uff0c\u7701 $' + saved + '\u3002\u8cb7 3 \u672c\u4ee5\u4e0a\u642d 375 \u5238\u53ef\u80fd\u66f4\u597d\uff0c\u4e5f\u53ef\u4ee5\u7b49\u6d3b\u52d5\u758a\u758a\u6a02\u3002';
    }

    var second = methods[1];
    var gap = second.cost - best.cost;
    if (gap <= 5) {
      return best.name + '\u548c' + second.name + '\u5dee\u4e0d\u591a\uff08\u53ea\u5dee $' + gap + '\uff09\uff0c\u770b\u624b\u908a\u6709\u54ea\u5f35\u5238\u5c31\u7528\u54ea\u5f35\u3002';
    }
    return best.name + '\u6700\u7701\uff0c\u7701 $' + saved;
  }

  /**
   * 購物車最佳組合
   */
  function cartOptimize(books) {
    if (!books || books.length === 0) return null;

    var results = books.map(function (book) {
      var r = calculate(book.price, book.salePrice);
      return {
        title: book.title,
        price: book.price,
        salePrice: book.salePrice || null,
        result: r
      };
    });

    var totalOriginal = 0;
    var totalOptimized = 0;

    results.forEach(function (r) {
      totalOriginal += r.price;
      if (r.result) {
        var bestCost = r.result.best.cost;
        if (r.result.stack && r.result.stack.cost < bestCost) {
          bestCost = r.result.stack.cost;
        }
        totalOptimized += bestCost;
      } else {
        totalOptimized += r.price;
      }
    });

    return {
      books: results,
      totalOriginal: totalOriginal,
      totalOptimized: totalOptimized,
      totalSaved: totalOriginal - totalOptimized
    };
  }

  return {
    calculate: calculate,
    cartOptimize: cartOptimize,
    pointsNeeded: pointsNeeded,
    redeemCost: redeemCost,
    POINT_COST: POINT_COST,
    POINT_LIMIT: POINT_LIMIT
  };
})();

if (typeof module !== 'undefined') {
  module.exports = ReadmooCalc;
}
