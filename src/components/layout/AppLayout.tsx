import { MassiveAttribution } from './massive-attribution';
import { Logo } from './Logo';

const layoutStyle = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column' as const,
};

const mainStyle = {
  flex: 1,
  paddingBottom: '1rem',
};

const footerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.75rem 1.5rem',
  marginTop: 'auto',
  backgroundColor: 'var(--nav-bg)',
  borderTop: '1px solid var(--border-subtle)',
};

const footerBrandStyle = {
  transform: 'scale(0.82)',
  transformOrigin: 'right center' as const,
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={layoutStyle}>
      <main style={mainStyle}>{children}</main>
      <footer style={footerStyle}>
        <MassiveAttribution />
        <div style={footerBrandStyle}>
          <Logo href="/" />
        </div>
      </footer>
    </div>
  );
}
