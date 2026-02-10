/**
 * features/back-to-top.js
 * 返回頂部按鈕功能
 */

export function initBackToTop() {
  const backToTopBtn = document.getElementById('back-to-top')
  if (!backToTopBtn) return

  // 監聽滾動，顯示/隱藏按鈕
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      backToTopBtn.classList.add('back-to-top--show')
    } else {
      backToTopBtn.classList.remove('back-to-top--show')
    }
  })

  // 點擊回到頂部
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  })
}
