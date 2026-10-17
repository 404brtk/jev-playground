"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function SiteNavigation() {
  const pathname = usePathname();
  const previous = useRef(pathname);
  useEffect(() => {
    if (previous.current !== pathname) {
      document.querySelector<HTMLElement>("main")?.focus();
      previous.current = pathname;
    }
  }, [pathname]);
  return (
    <>
      <a
        href="#main-content"
        className="fixed inset-s-2 top-2 z-50 translate-y-[-200%] bg-primary px-4 py-3 text-primary-foreground focus:translate-y-0"
      >
        Skip to content
      </a>
      <nav
        aria-label="Main navigation"
        className="mx-auto flex w-full max-w-360 gap-2 px-3 pt-3 sm:px-8 sm:pt-5"
      >
        <Link
          href="/"
          aria-current={pathname === "/" ? "page" : undefined}
          className="inline-flex min-h-10 items-center rounded-lg px-3.5 py-2 text-[0.8125rem] text-muted-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground"
        >
          Playground
        </Link>
        <Link
          href="/arcade"
          aria-current={pathname.startsWith("/arcade") ? "page" : undefined}
          className="inline-flex min-h-10 items-center rounded-lg px-3.5 py-2 text-[0.8125rem] text-muted-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground"
        >
          Arcade
        </Link>
      </nav>
    </>
  );
}
