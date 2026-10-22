'use client';

import dynamic from 'next/dynamic';

const AntadisShowroom = dynamic(
  () => import('./AntadisShowroom'),
  {
    ssr: false,
    loading: () => null,
  }
);

export default function ClientShowroom() {
  return <AntadisShowroom />;
}
