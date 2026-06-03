'use client';

import { useEffect, useState } from 'react';
import { Logo } from './Logo';
import { Nav } from './nav';
import { SearchForm } from './SearchForm';
import styles from '../../styles/Header.module.css';

type HomeHeaderProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (query: string) => void;
  onLogoClick?: () => void;
};

export function HomeHeader({
  searchValue,
  onSearchChange,
  onSearchSubmit,
  onLogoClick,
}: HomeHeaderProps) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 0) {
        setHidden(false);
      } else if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setHidden(true);
      } else if (currentScrollY < lastScrollY) {
        setHidden(false);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header
      className={`${styles.header} ${hidden ? styles.headerHidden : ''}`}
    >
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Logo href="/" onClick={onLogoClick} />
        </div>
        <div className={styles.navWrap}>
          <Nav />
        </div>
        <SearchForm
          value={searchValue}
          onChange={onSearchChange}
          onSubmit={onSearchSubmit}
        />
      </div>
    </header>
  );
}
