// 複製 HEX 色碼功能
export async function copyColor(hex, usage) {
  try {
    await navigator.clipboard.writeText(hex);
    showToast(`已複製 ${usage} 色碼：${hex}`);
  } catch (err) {
    console.error('複製失敗:', err);
    // Fallback: 使用傳統方法
    fallbackCopy(hex, usage);
  }
}

// Fallback 複製方法（支援舊瀏覽器）
function fallbackCopy(text, usage) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();

  try {
    document.execCommand('copy');
    showToast(`已複製 ${usage} 色碼：${text}`);
  } catch (err) {
    console.error('Fallback 複製失敗:', err);
    showToast('複製失敗，請手動複製');
  } finally {
    document.body.removeChild(textarea);
  }
}

// 顯示 Toast 通知
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}
