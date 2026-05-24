'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

const generateFingerprint = () => {
  let fp = localStorage.getItem('revlo_visitor_fp');
  if (!fp) {
    fp = 'fp_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('revlo_visitor_fp', fp);
  }
  return fp;
};

const getBrowser = (userAgent: string) => {
  if (userAgent.includes('Firefox/')) return 'Firefox';
  if (userAgent.includes('Edg/')) return 'Edge';
  if (userAgent.includes('Chrome/')) return 'Chrome';
  if (userAgent.includes('Safari/')) return 'Safari';
  return 'Unknown';
};

const getOS = (userAgent: string) => {
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('like Mac')) return 'iOS';
  return 'Unknown';
};

const getDevice = () => {
  if (typeof window === 'undefined') return 'Unknown';
  if (window.innerWidth < 768) return 'Mobile';
  if (window.innerWidth < 1024) return 'Tablet';
  return 'Desktop';
};

export default function AnalyticsProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [visitorId, setVisitorId] = useState<string | null>(null);

  useEffect(() => {
    // Generate or get fingerprint on mount
    setVisitorId(generateFingerprint());
  }, []);

  useEffect(() => {
    if (!visitorId || !pathname) return;

    // Track page visit
    const trackVisit = async () => {
      try {
        const payload = {
          visitorId,
          path: pathname,
          referrer: document.referrer,
          browser: navigator.userAgent ? getBrowser(navigator.userAgent) : 'Unknown',
          os: navigator.userAgent ? getOS(navigator.userAgent) : 'Unknown',
          device: getDevice(),
          timestamp: new Date().toISOString()
        };

        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
      } catch (error) {
        console.error('Failed to track visit', error);
      }
    };

    // Debounce tracking slightly to avoid rapid double-fires from strict mode
    const timeout = setTimeout(trackVisit, 500);
    return () => clearTimeout(timeout);

  }, [pathname, searchParams, visitorId, session]);

  return null;
}
