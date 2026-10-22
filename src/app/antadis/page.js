'use client';

import dynamic from 'next/dynamic';

const AntadisShowroom = dynamic(
  () => import('@/components/antadis/AntadisShowroom'),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#131b28',
          color: '#FAF6F0',
          fontFamily: 'Inter, sans-serif',
          zIndex: 9999,
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(217, 155, 82, 0.25)',
            borderTopColor: '#D99B52',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '1rem',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: '0.85rem', letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.85 }}>
          Initialisation du Showroom 3D...
        </span>
      </div>
    ),
  }
);

export default function AntadisPage() {
  return <AntadisShowroom />;
}
