/**
 * 共用 Footer 元件
 * 符合 Hello Ruru Design System v1.3
 * 年份自動更新：2026 或 2026–2027（依當前年份）
 */
export default function Footer() {
  const startYear = 2026;
  const currentYear = new Date().getFullYear();
  const yearDisplay = currentYear > startYear 
    ? `${startYear}–${currentYear}` 
    : `${startYear}`;

  return (
    <footer 
      className="text-center py-8 text-sm"
      style={{ color: 'var(--text-muted)' }}
    >
      <p>
        © {yearDisplay} Kaoru Tsai. All Rights Reserved. |{' '}
        <a 
          href="mailto:hello@helloruru.com"
          className="transition-colors hover:opacity-80"
          style={{ color: 'var(--accent-primary)' }}
        >
          hello@helloruru.com
        </a>
      </p>
    </footer>
  );
}
