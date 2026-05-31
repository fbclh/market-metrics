'use client';

import { Logo } from './Logo';
import { Nav } from './nav';
import { SearchForm } from './SearchForm';
import styles from '../../styles/Header.module.css';

export function SubpageHeader() {
  return (
    <header className={styles.subpageHeader}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Logo />
        </div>
        <div className={styles.navWrap}>
          <Nav />
        </div>
        <SearchForm />
      </div>
    </header>
  );
}
