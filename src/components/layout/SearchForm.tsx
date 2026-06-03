'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import styles from '../../styles/Header.module.css';

type SearchFormProps = {
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (query: string) => void;
};

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

export function SearchForm({ value, onChange, onSubmit }: SearchFormProps) {
  const router = useRouter();
  const [internalValue, setInternalValue] = useState('');
  const isControlled = value !== undefined && onChange !== undefined;
  const inputValue = isControlled ? value : internalValue;

  const handleChange = (nextValue: string) => {
    if (isControlled) {
      onChange(nextValue);
    } else {
      setInternalValue(nextValue);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = inputValue.trim();
    if (!query) return;

    if (onSubmit) {
      onSubmit(query);
      return;
    }

    router.push(`/?search=${encodeURIComponent(query)}`);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.searchWrap}>
        <SearchIcon />
        <input
          className={styles.input}
          type="search"
          placeholder="Search stocks, ETFs..."
          value={inputValue}
          onChange={(event) => handleChange(event.target.value)}
          aria-label="Search stocks"
        />
      </div>
    </form>
  );
}
