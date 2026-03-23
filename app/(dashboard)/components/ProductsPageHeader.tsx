'use client';

import Link from 'next/link';
import { PlusOutlined } from '@ant-design/icons';

export interface ProductsPageHeaderProps {
  onAddProduct: () => void;
}

export function ProductsPageHeader({ onAddProduct }: ProductsPageHeaderProps) {
  return (
    <div className="products-page-header-compact" style={{ padding: 'var(--space-4) var(--space-8)', borderBottom: '1px solid var(--gray-200)', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--gray-500)' }}>
        <Link href="/dashboard" style={{ color: 'inherit', textDecoration: 'none' }}>
          Нүүр
        </Link>
        <span>/</span>
        <span style={{ color: 'var(--gray-800)', fontWeight: 500 }}>Бараа материал</span>
      </nav>
      <button type="button" className="btn-primary" onClick={onAddProduct}>
        <PlusOutlined style={{ fontSize: 14 }} />
        Бараа нэмэх
      </button>
    </div>
  );
}
