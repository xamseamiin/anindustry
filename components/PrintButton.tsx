'use client';

import { useEffect, useState } from 'react';

export default function PrintButton() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <button
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 print:hidden"
        >
            <span>Download / Print PDF</span>
        </button>
    );
}
