import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode; // the nav links
  navClassName?: string; // class for the <nav> (e.g. "page-nav")
  extra?: ReactNode; // account actions (user name, log out, ...)
  extraClassName?: string; // class for the wrapper around `extra`
}

// Wide screens: the links and the account actions sit inline in the header
// (the wrappers use `display: contents`, see styles.css).
// Small screens: both move into a panel that drops down from a three-line
// circle button at the top right.
export default function NavMenu({
  children,
  navClassName,
  extra,
  extraClassName,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

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
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>
      <div
        id={panelId}
        className={open ? "nav-panel open" : "nav-panel"}
        // choosing anything in the menu closes it
        onClick={() => setOpen(false)}
      >
        <nav className={navClassName}>{children}</nav>
        {extra !== undefined && (
          <div className={["nav-extra", extraClassName].filter(Boolean).join(" ")}>
            {extra}
          </div>
        )}
      </div>
    </div>
  );
}
