'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Nav.module.css';

const NAV_ITEMS = [
  { href: '/watchlist', label: 'My Portfolio' },
  { href: '/analytics', label: 'Dashboard' },
] as const;

export function Nav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    const currentPath = pathname ?? '/';

    return currentPath === href || currentPath.startsWith(`${href}/`);
  };

  return (
    <nav className={styles.nav} aria-label="Primary">
      {NAV_ITEMS.map(({ href, label }) => {
        const active = isActive(href);

        return (
          <Link
            key={href}
            href={href}
            className={`${styles.link}${active ? ` ${styles.linkActive}` : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
