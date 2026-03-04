/**
 * 共用 Footer 元件 — DS 2.0 經典版
 * 漸層淡線 + 底線滑入連結
 */
export default function Footer() {
  const startYear = 2026;
  const currentYear = new Date().getFullYear();
  const yearDisplay = currentYear > startYear
    ? `${startYear}\u2013${currentYear}`
    : `${startYear}`;

  return (
    <footer
      className="footer-gradient-line text-center py-8 text-sm"
      style={{ color: 'var(--text-muted)' }}
    >
      <p>
        &copy; {yearDisplay} Kaoru Tsai. All Rights Reserved. |{' '}
        <a
          href="mailto:hello@helloruru.com"
          style={{ color: 'var(--accent-primary)' }}
        >
          hello@helloruru.com
        </a>
      </p>
    </footer>
  );
}
