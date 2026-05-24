'use client';

import React from 'react';

export default function InvoicePrintStyles() {
    return (
        <style jsx global>{`
      @media print {
        body { 
          margin: 0; 
          padding: 0; 
          background: white;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        @page { 
          size: A4; 
          margin: 0; 
        }
      }
    `}</style>
    );
}
