'use client';

import { useEffect, useState } from 'react';
import { Logo } from './layout/Logo';
import { Nav } from './layout/nav';
import styles from '../styles/Header.module.css';

interface HeaderProps {
  characters: string;
  handleOnChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

function SearchIcon() {
  return (
    <svg
      className={styles.searchIcon}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 3.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="m14 14 3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export const Header = ({
  characters,
  handleOnChange,
  handleSubmit,
}: HeaderProps) => {
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
          <Logo />
        </div>
        <div className={styles.navWrap}>
          <Nav />
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.searchWrap}>
            <SearchIcon />
            <input
              className={styles.input}
              type="search"
              placeholder="Search stocks, ETFs..."
              value={characters}
              onChange={handleOnChange}
              aria-label="Search stocks"
            />
          </div>
        </form>
      </div>
    </header>
  );
};
