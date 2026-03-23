'use client';

import React from 'react';
import type { InvoiceCompanyInfo } from '../config/invoiceCompany';

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
  customer_code?: string;
  customer_phone?: string;
  customer_address?: string;
  customer_register_number?: string;
  customer_tax_id?: string;
  customer_account_number?: string;
  total_amount?: number;
  items?: OrderItemForPdf[];
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    width: '210mm',
    minHeight: '297mm',
    padding: '12mm 15mm',
    fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
    fontSize: '10px',
    color: '#1a1a1a',
    backgroundColor: '#fff',
    boxSizing: 'border-box',
  },
  header: {
    borderBottom: '3px solid #25671E',
    paddingBottom: 12,
    marginBottom: 20,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flexWrap: 'wrap' as const,
    gap: 16,
  },
  logo: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#25671E',
    letterSpacing: '0.02em',
  },
  docTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#333',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  twoCol: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 24,
    marginBottom: 20,
    flexWrap: 'wrap' as const,
  },
  col: {
    flex: '1 1 280px',
    minWidth: 0,
  },
  blockTitle: {
    fontSize: '9px',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    color: '#25671E',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: '1px solid #e0e0e0',
  },
  line: { marginBottom: 4, lineHeight: 1.4 },
  lineLabel: { color: '#555', marginRight: 6 },
  meta: {
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap' as const,
    gap: 8,
    marginBottom: 16,
    padding: '10px 12px',
    backgroundColor: '#f8faf8',
    borderRadius: 4,
  },
  metaItem: { fontWeight: 600 },
  table: { width: '100%', borderCollapse: 'collapse' as const, marginTop: 8 },
  th: {
    backgroundColor: '#25671E',
    color: '#fff',
    padding: '10px 8px',
    textAlign: 'left' as const,
    fontWeight: 600,
    fontSize: '9px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.03em',
  },
  thRight: { textAlign: 'right' as const },
  td: { padding: '8px', borderBottom: '1px solid #e8e8e8', verticalAlign: 'top' as const },
  tdRight: { textAlign: 'right' as const },
  trEven: { backgroundColor: '#fafcfa' },
  totalWrap: {
    marginTop: 16,
    padding: '12px 16px',
    backgroundColor: '#f0f7f0',
    borderRadius: 4,
    textAlign: 'right' as const,
  },
  totalLabel: { fontSize: '11px', fontWeight: 700, color: '#25671E', marginBottom: 2 },
  totalAmount: { fontSize: '16px', fontWeight: 700, color: '#1a1a1a' },
  footer: {
    marginTop: 24,
    paddingTop: 12,
    borderTop: '1px solid #e0e0e0',
    fontSize: '9px',
    color: '#666',
    textAlign: 'center' as const,
  },
};

function Line({
  label,
  value,
  hideIfEmpty = true,
}: {
  label: string;
  value?: string | null;
  hideIfEmpty?: boolean;
}) {
  if (hideIfEmpty && (value == null || String(value).trim() === '')) return null;
  return (
    <div style={styles.line}>
      <span style={styles.lineLabel}>{label}:</span>
      <span>{value ?? '–'}</span>
    </div>
  );
}

export function InvoicePdfTemplate({
  order,
  company,
}: {
  order: OrderForPdf;
  company: InvoiceCompanyInfo;
}) {
  const items = order?.items ?? [];
  const total = Number(order?.total_amount ?? 0);

  return (
    <div style={styles.page} id="invoice-pdf-content">
      <header style={styles.header}>
        <div style={styles.logo}>{company.name}</div>
        <div style={styles.docTitle}>Нэхэмжлэх / Invoice</div>
      </header>

      <div style={styles.twoCol}>
        <div style={styles.col}>
          <div style={styles.blockTitle}>Нэхэмжлэх гаргагч байгууллага</div>
          <Line label="Байгууллагын нэр" value={company.name} hideIfEmpty={false} />
          <Line label="Регистрийн дугаар" value={company.registerNumber} />
          <Line label="Хаяг" value={company.address} />
          <Line label="Утас" value={company.phone} />
          <Line label="И-мэйл" value={company.email} />
          <Line label="Банк" value={company.bankName} />
          <Line label="Дансны дугаар" value={company.bankAccount} />
        </div>
        <div style={styles.col}>
          <div style={styles.blockTitle}>Харилцагч байгууллага</div>
          <Line label="Нэр" value={order?.customer_name} hideIfEmpty={false} />
          <Line label="Код" value={order?.customer_code} />
          <Line label="Регистрийн дугаар" value={order?.customer_register_number} />
          <Line label="ТТД" value={order?.customer_tax_id} />
          <Line label="Хаяг" value={order?.customer_address} />
          <Line label="Утас" value={order?.customer_phone} />
          <Line label="Дансны дэвтэр" value={order?.customer_account_number} />
        </div>
      </div>

      <div style={styles.meta}>
        <span style={styles.metaItem}>Нэхэмжлэхийн дугаар: {order?.order_number ?? '–'}</span>
        <span style={styles.metaItem}>Огноо: {order?.order_date ?? '–'}</span>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={{ ...styles.th, width: 36 }}>№</th>
            <th style={styles.th}>Барааны нэр</th>
            <th style={{ ...styles.th, width: 64, ...styles.thRight }}>Тоо хэмжээ</th>
            <th style={{ ...styles.th, width: 48 }}>Нэгж</th>
            <th style={{ ...styles.th, width: 88, ...styles.thRight }}>Нэгжийн үнэ</th>
            <th style={{ ...styles.th, width: 100, ...styles.thRight }}>Нийт дүн</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item?.id ?? idx} style={idx % 2 === 0 ? styles.trEven : undefined}>
              <td style={styles.td}>{idx + 1}</td>
              <td style={styles.td}>{item?.product_name ?? '–'}</td>
              <td style={{ ...styles.td, ...styles.tdRight }}>{item?.quantity != null ? Number(item.quantity).toLocaleString() : '–'}</td>
              <td style={styles.td}>{item?.product_unit ?? '–'}</td>
              <td style={{ ...styles.td, ...styles.tdRight }}>{item?.unit_price != null ? `${Number(item.unit_price).toLocaleString()} ₮` : '–'}</td>
              <td style={{ ...styles.td, ...styles.tdRight }}>{item?.total_price != null ? `${Number(item.total_price).toLocaleString()} ₮` : '–'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={styles.totalWrap}>
        <div style={styles.totalLabel}>НИЙТ ДҮН</div>
        <div style={styles.totalAmount}>{total.toLocaleString()} ₮</div>
      </div>

      <footer style={styles.footer}>
        {company.name}
        {company.registerNumber ? ` · РД ${company.registerNumber}` : ''}
        {company.bankName && company.bankAccount ? ` · ${company.bankName} ${company.bankAccount}` : ''}
      </footer>
    </div>
  );
}
