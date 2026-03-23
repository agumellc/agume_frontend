'use client';

import React from 'react';

export interface OrderItemForPdf {
  id?: number;
  product_name?: string;
  product_unit?: string;
  quantity?: number;
  unit_price?: number;
  total_price?: number;
}

export interface OrderForPdf {
  order_number?: string;
  order_date?: string;
  customer_name?: string;
  driver_name?: string;
  total_amount?: number;
  items?: OrderItemForPdf[];
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    width: '210mm',
    minHeight: '297mm',
    padding: '15mm',
    fontFamily: 'Helvetica, Arial, sans-serif',
    fontSize: '10px',
    color: '#000',
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#25671E',
    color: '#fff',
    padding: '12px 16px',
    marginBottom: 20,
    textAlign: 'center',
  },
  title: { fontSize: '16px', fontWeight: 'bold', margin: 0 },
  info: { marginBottom: 16 },
  label: { fontWeight: 'bold', marginBottom: 4 },
  table: { width: '100%', borderCollapse: 'collapse' as const, marginTop: 12 },
  th: {
    backgroundColor: '#25671E',
    color: '#fff',
    padding: '8px 6px',
    textAlign: 'left' as const,
    fontWeight: 'bold',
    fontSize: '9px',
  },
  td: { padding: '6px', borderBottom: '1px solid #e0e0e0' },
  totalRow: { marginTop: 12, textAlign: 'right' as const, fontWeight: 'bold', fontSize: '12px', color: '#25671E' },
  signatures: { marginTop: 48, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 24 },
  sigBlock: { minWidth: 180 },
  sigLine: { borderBottom: '1px solid #000', marginTop: 32, paddingBottom: 4, fontSize: '9px' },
};

export function VoucherPdfTemplate({ order }: { order: OrderForPdf }) {
  const items = order?.items ?? [];
  const total = Number(order?.total_amount ?? 0);

  return (
    <div style={styles.page} id="voucher-pdf-content">
      <div style={styles.header}>
        <div style={styles.title}>ЗАРЛАГИЙН БАРИМТ</div>
      </div>
      <div style={styles.info}>
        <div style={styles.label}>Баримтын дугаар: {order?.order_number ?? '–'}</div>
        <div style={styles.label}>Огноо: {order?.order_date ?? '–'}</div>
        <div style={styles.label}>Харилцагч: {order?.customer_name ?? '–'}</div>
        {order?.driver_name ? <div style={styles.label}>Жолооч: {order.driver_name}</div> : null}
      </div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={{ ...styles.th, width: 30 }}>№</th>
            <th style={styles.th}>Барааны нэр</th>
            <th style={{ ...styles.th, width: 60, textAlign: 'right' }}>Тоо</th>
            <th style={{ ...styles.th, width: 50 }}>Нэгж</th>
            <th style={{ ...styles.th, width: 80, textAlign: 'right' }}>Үнэ</th>
            <th style={{ ...styles.th, width: 90, textAlign: 'right' }}>Нийт</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item?.id ?? idx}>
              <td style={styles.td}>{idx + 1}</td>
              <td style={styles.td}>{item?.product_name ?? '–'}</td>
              <td style={{ ...styles.td, textAlign: 'right' }}>{item?.quantity != null ? Number(item.quantity) : '–'}</td>
              <td style={styles.td}>{item?.product_unit ?? '–'}</td>
              <td style={{ ...styles.td, textAlign: 'right' }}>{item?.unit_price != null ? `${Number(item.unit_price).toLocaleString()} ₮` : '–'}</td>
              <td style={{ ...styles.td, textAlign: 'right' }}>{item?.total_price != null ? `${Number(item.total_price).toLocaleString()} ₮` : '–'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={styles.totalRow}>НИЙТ: {total.toLocaleString()} ₮</div>
      <div style={styles.signatures}>
        <div style={styles.sigBlock}>
          <div style={styles.sigLine}>Тушаасан: ___________________</div>
          <div style={styles.sigLine}>Огноо: ___________________</div>
        </div>
        <div style={styles.sigBlock}>
          <div style={styles.sigLine}>Хүлээн авсан: ___________________</div>
          <div style={styles.sigLine}>Огноо: ___________________</div>
        </div>
      </div>
    </div>
  );
}
