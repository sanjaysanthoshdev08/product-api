import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode; // the nav links
  className?: string; // class for the <nav> (e.g. "page-nav")
}

// Nav links shown inline on wide screens. On small screens (see styles.css)
// they are hidden and open from a three-line (hamburger) circle button.
export default function NavMenu({ children, className }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const navId = useId();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onPointer(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  return (
    <div className="nav-menu" ref={rootRef}>
      <button
        type="button"
        className="icon-btn menu-btn"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls={navId}
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>
      <nav
        id={navId}
        className={[className, open ? "open" : ""].filter(Boolean).join(" ")}
        // choosing a link closes the menu
        onClick={() => setOpen(false)}
      >
        {children}
      </nav>
    </div>
  );
}
