var input = document.getElementById('price-input');
var resultsEl = document.getElementById('results');

input.addEventListener('input', function () {
  var price = parseInt(this.value, 10);
  if (!price || price < 50) {
    resultsEl.style.display = 'none';
    return;
  }

  var r = ReadmooCalc.calculate(price);
  if (!r) {
    resultsEl.style.display = 'none';
    return;
  }

  var html = '';

  // 省多少橫幅
  if (r.saved > 0) {
    html += '<div class="saved-banner">';
    html += '<small>\u7528 ' + r.best.name + '</small> \u7701 $' + r.saved;
    html += '</div>';
  }

  // 四種方案
  html += '<div class="methods">';
  r.methods.forEach(function (m, i) {
    var isBest = (i === 0);
    var cls = 'method' + (isBest ? ' best' : '');
    html += '<div class="' + cls + '">';
    html += '<span class="method-name">' + m.name;
    if (m.points) html += ' (' + m.points + '\u9ede)';
    html += '</span>';
    html += '<span class="method-cost">$' + m.cost + '</span>';
    if (isBest) html += '<span class="badge">\u6700\u7701</span>';
    html += '</div>';
  });
  html += '</div>';

  // 建議
  html += '<div class="advice">' + r.advice + '</div>';

  // 甜蜜區
  if (price >= 50 && price <= 199) {
    html += '<div class="sweet">\u629850\u5238\u6700\u5f37\u89e3\uff01\u4e0d\u9650\u91d1\u984d\u6298$50</div>';
  } else if (price >= 224 && price <= 250) {
    html += '<div class="sweet">\u7518\u871c\u5340\uff011 \u9ede\u9818\u66f8\u6700\u8d85\u503c</div>';
  } else if (price >= 445 && price <= 500) {
    html += '<div class="sweet">2 \u9ede\u9818\u66f8 $333\uff0c\u6bd4 75 \u6298\u4fbf\u5b9c</div>';
  }

  resultsEl.innerHTML = html;
  resultsEl.style.display = 'block';
});
