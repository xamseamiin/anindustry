'use client';

import { useEffect } from 'react';

export default function GoogleTranslate() {
  useEffect(() => {
    // Ensure element exists
    let element = document.getElementById('google_translate_element');
    if (!element) {
      element = document.createElement('div');
      element.id = 'google_translate_element';
      element.style.cssText = 'position: absolute; top: -9999px; left: -9999px; width: 1px; height: 1px; overflow: hidden; opacity: 0; pointer-events: none;';
      document.body.appendChild(element);
    }
  }, []);

  return (
    <div 
      id="google_translate_element" 
      style={{ 
        position: 'absolute', 
        top: '-9999px', 
        left: '-9999px',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
        opacity: 0,
        pointerEvents: 'none' as const
      }} 
    />
  );
}


