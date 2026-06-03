const wrapperStyle = {
  fontSize: '0.75rem',
  color: '#fff',
  lineHeight: 1.4,
};

const linkStyle = {
  color: 'var(--brand-accent-light)',
  textDecoration: 'underline',
  textUnderlineOffset: '2px',
};

export function FmpAttribution() {
  return (
    <span style={wrapperStyle}>
      Data provided by{' '}
      <a
        href="https://financialmodelingprep.com"
        target="_blank"
        rel="noopener noreferrer"
        style={linkStyle}
      >
        FMP
      </a>
    </span>
  );
}
