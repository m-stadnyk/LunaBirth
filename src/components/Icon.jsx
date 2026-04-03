/**
 * Lightweight inline SVG icon component.
 * Uses currentColor so icons inherit the surrounding text color.
 * All paths are 24×24 viewBox, stroke-based (no fill).
 */

const ICONS = {
  wave:     ({ sw }) => <path strokeWidth={sw} d="M2 12c2-4 5-4 7 0s5 4 7 0 5-4 7 0" />,
  drop:     ({ sw }) => <path strokeWidth={sw} d="M12 3C12 3 6 10 6 15a6 6 0 0 0 12 0C18 10 12 3 12 3z" />,
  leaf:     ({ sw }) => (
    <>
      <path strokeWidth={sw} d="M17 8C8 10 5.9 16.17 3.82 22" />
      <path strokeWidth={sw} d="M9 21.89C10.91 14.29 14.8 10.58 20 9" />
    </>
  ),
  sparkle:  ({ sw }) => <path strokeWidth={sw} d="M12 3l1.8 5.5 5.7 1.5-5.7 1.5L12 17l-1.8-5.5L4.5 10l5.7-1.5L12 3z" />,
  moon:     ({ sw }) => <path strokeWidth={sw} d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
  seedling: ({ sw }) => (
    <>
      <path strokeWidth={sw} d="M12 22V12" />
      <path strokeWidth={sw} d="M12 12a5 5 0 0 0 5-5H7a5 5 0 0 0 5 5z" />
    </>
  ),
  phone:    ({ sw }) => <path strokeWidth={sw} d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.1 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />,
  calendar: ({ sw }) => (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={sw} />
      <line x1="16" y1="2" x2="16" y2="6" strokeWidth={sw} />
      <line x1="8" y1="2" x2="8" y2="6" strokeWidth={sw} />
      <line x1="3" y1="10" x2="21" y2="10" strokeWidth={sw} />
    </>
  ),
  bulb:     ({ sw }) => (
    <>
      <path strokeWidth={sw} d="M9 21h6m-3-3v-2.5" />
      <path strokeWidth={sw} d="M12 3a5 5 0 0 1 5 5c0 2.5-1.5 4-3 5.5H10C8.5 12 7 10.5 7 8a5 5 0 0 1 5-5z" />
    </>
  ),
  image:    ({ sw }) => (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth={sw} />
      <circle cx="8.5" cy="8.5" r="1.5" strokeWidth={sw} />
      <polyline points="21 15 16 10 5 21" strokeWidth={sw} />
    </>
  ),
  check:    ({ sw }) => <polyline points="20 6 9 17 4 12" strokeWidth={sw} />,
  star:     ({ sw }) => <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" strokeWidth={sw} />,
  close:    ({ sw }) => (
    <>
      <line x1="18" y1="6" x2="6" y2="18" strokeWidth={sw} />
      <line x1="6" y1="6" x2="18" y2="18" strokeWidth={sw} />
    </>
  ),
};

export function Icon({ name, size = 16, color = "currentColor", strokeWidth = 1.75, style }) {
  const Render = ICONS[name];
  if (!Render) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...style }}
    >
      <Render sw={strokeWidth} />
    </svg>
  );
}
