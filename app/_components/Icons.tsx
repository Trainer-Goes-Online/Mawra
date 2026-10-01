// Shared inline-SVG icons.
//
// Kept as components so pages import a name instead of pasting path data —
// the WhatsApp glyph alone was duplicated across three files before this.
// Every icon takes a className so the caller owns sizing and colour, and
// paints with `currentColor` so it inherits the button's text colour.

type IconProps = { className?: string };

export function WhatsAppIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35M12.04 2h-.01C6.5 2 2.01 6.49 2.01 12.02c0 1.77.46 3.5 1.34 5.02L2 22l5.1-1.33a9.96 9.96 0 0 0 4.94 1.29h.01c5.52 0 10.01-4.49 10.01-10.02C22.06 6.49 17.56 2 12.04 2m5.83 15.85a8.28 8.28 0 0 1-5.83 2.42h-.01a8.28 8.28 0 0 1-4.22-1.16l-.3-.18-3.13.82.84-3.05-.2-.31a8.25 8.25 0 0 1-1.27-4.41c0-4.58 3.73-8.31 8.32-8.31 2.22 0 4.31.87 5.88 2.44a8.26 8.26 0 0 1 2.43 5.88c0 4.58-3.73 8.31-8.31 8.31Z"
      />
    </svg>
  );
}
