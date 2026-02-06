// Force dynamic rendering for 404 page
export const dynamic = 'force-dynamic';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#0A0A0A',
      color: '#F5F3F0',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>404</h1>
        <p style={{ fontSize: '1.25rem', opacity: 0.7 }}>Page not found</p>
        <Link 
          href="/" 
          style={{ 
            display: 'inline-block',
            marginTop: '2rem',
            padding: '12px 24px',
            backgroundColor: '#C5A572',
            color: '#0A0A0A',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: 600
          }}
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
