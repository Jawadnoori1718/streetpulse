import { createPortal } from 'react-dom';

/** Renders children at the end of <body> so popups/modals are always on top. */
export default function Portal({ children }: { children: React.ReactNode }) {
  return createPortal(children, document.body);
}
