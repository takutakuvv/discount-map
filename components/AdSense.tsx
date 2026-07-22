'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export default function AdSense() {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block' }}
      data-ad-client="ca-pub-2913908713051662"
      data-ad-slot="5466935314"
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
