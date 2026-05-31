import Link from 'next/link';
import styles from './Logo.module.css';

type LogoProps = {
  href?: string;
  className?: string;
};

export function Logo({ href = '/', className }: LogoProps) {
  return (
    <Link
      href={href}
      className={`${styles.logoLink}${className ? ` ${className}` : ''}`}
      aria-label="MarketMetrics home"
    >
      <span className={styles.brandName}>
        Market<span className={styles.brandAccent}>Metrics</span>
      </span>
    </Link>
  );
}
