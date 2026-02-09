/**
 * SVG 圖標（Lucide 風格，stroke 1.5-2px）
 */

export const icons = {
  copy: '<svg viewBox="0 0 24 24" width="20" height="20" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" stroke="currentColor"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',

  check: '<svg viewBox="0 0 24 24" width="20" height="20" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg>',

  zap: '<svg viewBox="0 0 24 24" width="16" height="16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" stroke="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',

  edit: '<svg viewBox="0 0 24 24" width="16" height="16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" stroke="currentColor"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',

  eye: '<svg viewBox="0 0 24 24" width="16" height="16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" stroke="currentColor"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',

  text: '<svg viewBox="0 0 24 24" width="16" height="16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',

  paste: '<svg viewBox="0 0 24 24" width="14" height="14" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" stroke="currentColor"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>',

  facebook: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',

  instagram: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>',

  threads: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.761 2.105-1.197 3.545-1.262 1.07-.05 2.063.088 2.964.374-.075-.87-.342-1.55-.803-2.03-.584-.607-1.497-.918-2.713-.924h-.036c-.89.005-1.629.26-2.199.756l-1.385-1.529c.882-.768 2.012-1.19 3.364-1.257h.046c1.705.009 3.054.562 4.013 1.643.878.99 1.347 2.347 1.392 4.032.585.263 1.109.588 1.564.972 1.023.863 1.728 2.023 2.042 3.356.42 1.782.14 3.874-1.3 5.391-1.81 1.907-4.145 2.712-7.372 2.738zm-1.34-7.865c-.756.035-1.373.26-1.785.653-.378.362-.574.843-.55 1.355.039.708.426 1.267 1.12 1.617.597.302 1.326.432 2.11.388 1.07-.058 1.89-.455 2.439-1.18.407-.537.684-1.226.82-2.042-1.213-.423-2.628-.608-4.153-.533v-.258z"/></svg>',

  sun: '<svg viewBox="0 0 24 24" width="18" height="18" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',

  moon: '<svg viewBox="0 0 24 24" width="18" height="18" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" stroke="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',

  smartphone: '<svg viewBox="0 0 24 24" width="14" height="14" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" stroke="currentColor"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',

  monitor: '<svg viewBox="0 0 24 24" width="14" height="14" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" stroke="currentColor"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',

  smile: '<svg viewBox="0 0 24 24" width="16" height="16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',

  grid: '<svg viewBox="0 0 24 24" width="16" height="16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" stroke="currentColor"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',

  type: '<svg viewBox="0 0 24 24" width="16" height="16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" stroke="currentColor"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>',

  alertTriangle: '<svg viewBox="0 0 24 24" width="14" height="14" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" stroke="currentColor"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',

  shield: '<svg viewBox="0 0 24 24" width="14" height="14" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" stroke="currentColor"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',

  flower: '<svg viewBox="0 0 24 24" width="20" height="20" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" stroke="currentColor"><path d="M12 7.5a4.5 4.5 0 1 1 4.5 4.5M12 7.5a4.5 4.5 0 1 0-4.5 4.5M12 7.5V9m-4.5 3a4.5 4.5 0 1 0 4.5 4.5M7.5 12H9m7.5 0a4.5 4.5 0 1 1-4.5 4.5m4.5-4.5H15m-3 4.5V15"/><circle cx="12" cy="12" r="3"/><path d="m8 15 1.88-1.88M16 8l-1.88 1.88M8 8l1.88 1.88M16 15l-1.88-1.88"/></svg>',

  thumbsUp: '<svg viewBox="0 0 24 24" width="18" height="18" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" stroke="currentColor"><path d="M7 22V11l5-8 1.5 1L12 8h7a2 2 0 0 1 2 2.4l-1.8 9A2 2 0 0 1 17.2 21H7z"/><path d="M4 11H2v11h2"/></svg>',

  messageCircle: '<svg viewBox="0 0 24 24" width="18" height="18" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" stroke="currentColor"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',

  share: '<svg viewBox="0 0 24 24" width="18" height="18" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" stroke="currentColor"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>',

  heart: '<svg viewBox="0 0 24 24" width="18" height="18" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" stroke="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',

  trash: '<svg viewBox="0 0 24 24" width="14" height="14" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" stroke="currentColor"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
}
