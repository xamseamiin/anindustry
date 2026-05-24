'use client';

import React from 'react';
import { Package, Plus } from 'lucide-react';

interface Product {
    id: number;
    name: string;
    price: number;
    stock: number;
    color?: string; // For placeholder visual
    image?: string;
}

interface ProductCardProps {
    product: Product;
    onClick: () => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
    return (
        <div
            onClick={onClick}
            className="bg-white dark:bg-[#1f2937] rounded-2xl border border-gray-100 dark:border-gray-800 p-3 cursor-pointer group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
        >
            {/* Image Placeholder */}
            <div className={`h-32 rounded-xl mb-3 flex items-center justify-center ${product.color || 'bg-gray-100 dark:bg-gray-800'} relative overflow-hidden transition-colors`}>
                <Package size={32} className="opacity-20 text-gray-500" />
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Plus className="text-white drop-shadow-md" size={32} />
                </div>
            </div>

            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-bold text-gray-900 dark:text-white truncate w-24 sm:w-28 text-sm" title={product.name}>{product.name}</h4>
                    <p className={`text-xs ${product.stock < 10 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                        {product.stock} in stock
                    </p>
                </div>
                <div className="text-right">
                    <span className="block font-black text-[#3498DB] text-sm">{product.price}</span>
                    <span className="text-[10px] text-gray-400">ETB</span>
                </div>
            </div>
        </div>
    );
}
