'use client';

import React from 'react';
import type { InvoiceCompanyInfo } from '../config/invoiceCompany';

const ROW_COUNT = 10;

const cellBorder: React.CSSProperties = {
  border: '1px solid #000',
  padding: '2px 4px',
  verticalAlign: 'middle' as const,
};

const thBase: React.CSSProperties = {
  ...cellBorder,
  fontWeight: 700,
  textAlign: 'center' as const,
  fontSize: '7px',
  lineHeight: 1.2,
  backgroundColor: '#fff',
};

function fmtMoney(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtQty(n: number | undefined): string {
  if (n == null || Number.isNaN(n)) return '';
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
}

export interface ExpenditureVoucherItem {
  id?: number;
  product_name?: string;
  product_code?: string;
  product_unit?: string;
  quantity?: number;
  unit_price?: number;
  total_price?: number;
}

export interface ExpenditureVoucherOrder {
  order_number?: string;
  order_date?: string;
  customer_name?: string;
  customer_address?: string;
  customer_register_number?: string;
  customer_tax_id?: string;
  customer_account_number?: string;
  customer_code?: string;
  note?: string;
  created_by_name?: string;
  driver_name?: string;
  total_amount?: number;
  items?: ExpenditureVoucherItem[];
}

const fontStack =
  'var(--font-noto-sans, "Noto Sans"), system-ui, -apple-system, "Segoe UI", sans-serif';

function buyerIdsLine(o: ExpenditureVoucherOrder): string {
  const parts = [o.customer_register_number, o.customer_tax_id, o.customer_account_number]
    .map((s) => (typeof s === 'string' ? s.trim() : ''))
    .filter(Boolean);
  return parts.length ? parts.join(' ') : '';
}

function infoCell(o: ExpenditureVoucherOrder): string {
  const n = typeof o.note === 'string' ? o.note.trim() : '';
  if (n) return n;
  const c = typeof o.customer_code === 'string' ? o.customer_code.trim() : '';
  if (c) return c;
  return '–';
}

function materialLabel(item: ExpenditureVoucherItem | undefined): string {
  if (!item) return '';
  const name = item.product_name?.trim() || '';
  const code = item.product_code?.trim() || '';
  if (name && code) return `${name} (${code})`;
  return name || code || '';
}

function ExpenditureVoucherHalf({
  order,
  company,
}: {
  order: ExpenditureVoucherOrder;
  company: InvoiceCompanyInfo;
}) {
  const items = order.items ?? [];
  const rows: (ExpenditureVoucherItem | null)[] = [];
  for (let i = 0; i < ROW_COUNT; i++) rows.push(items[i] ?? null);
  const total = Number(order.total_amount ?? 0);

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        padding: '4mm 3mm',
        boxSizing: 'border-box' as const,
        fontFamily: fontStack,
        fontSize: '7px',
        color: '#000',
        lineHeight: 1.25,
      }}
    >
      <div
        style={{
          textAlign: 'center',
          fontWeight: 700,
          fontSize: '9px',
          marginBottom: '3px',
          letterSpacing: '0.02em',
        }}
      >
        ЗАРЛАГЫН БАРИМТ № {order.order_number ?? '–'}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4px' }}>
        <tbody>
          <tr>
            <td style={{ ...cellBorder, width: '50%', verticalAlign: 'top', padding: '3px' }}>
              <div style={{ fontWeight: 700, minHeight: '14px' }}>{company.name || '–'}</div>
              <div style={{ fontSize: '6px', marginTop: '1px' }}>(байгууллагын нэр)</div>
              <div style={{ borderBottom: '1px solid #000', minHeight: '12px', marginTop: '4px', fontWeight: 600 }}>
                {company.registerNumber || ''}
              </div>
              <div style={{ marginTop: '4px', fontWeight: 600 }}>{order.order_date ?? '–'}</div>
            </td>
            <td style={{ ...cellBorder, width: '50%', verticalAlign: 'top', padding: '3px' }}>
              <div style={{ fontWeight: 700, minHeight: '14px' }}>{order.customer_name ?? '–'}</div>
              <div style={{ fontSize: '6px', marginTop: '1px' }}>(худалдан авагчийн нэр)</div>
              <div style={{ borderBottom: '1px solid #000', minHeight: '12px', marginTop: '4px', wordBreak: 'break-word' }}>
                {buyerIdsLine(order) || '\u00a0'}
              </div>
              <div style={{ fontSize: '6px', marginTop: '2px' }}>(захиалагчийн албан тушаал, нэр)</div>
              <div style={{ borderBottom: '1px solid #000', minHeight: '12px', marginTop: '2px' }}>
                {order.created_by_name?.trim() || '\u00a0'}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr>
            <th rowSpan={2} style={{ ...thBase, width: '5%' }}>
              №
            </th>
            <th rowSpan={2} style={{ ...thBase, width: '34%' }}>
              Материалын үнэт зүйлийн нэр, зэрэг, дугаар
            </th>
            <th rowSpan={2} style={{ ...thBase, width: '6%', padding: '1px' }}>
              <span
                style={{
                  display: 'inline-block',
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                  maxHeight: '48px',
                  fontSize: '6px',
                  fontWeight: 700,
                }}
              >
                Хэмжих нэгж
              </span>
            </th>
            <th colSpan={4} style={{ ...thBase }}>
              Худалдах
            </th>
          </tr>
          <tr>
            <th style={{ ...thBase, width: '9%' }}>Тоо хэмжээ</th>
            <th style={{ ...thBase, width: '9%' }}>Экв. тоо</th>
            <th style={{ ...thBase, width: '14%' }}>Нэгж үнэ</th>
            <th style={{ ...thBase, width: '15%' }}>Нийт дүн</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item, idx) => (
            <tr key={idx}>
              <td style={{ ...cellBorder, textAlign: 'center' }}>{idx + 1}</td>
              <td style={{ ...cellBorder, textAlign: 'left', wordBreak: 'break-word' }}>{materialLabel(item ?? undefined)}</td>
              <td style={{ ...cellBorder, textAlign: 'center' }}>{item?.product_unit ?? ''}</td>
              <td style={{ ...cellBorder, textAlign: 'right' }}>{item ? fmtQty(item.quantity) : ''}</td>
              <td style={{ ...cellBorder, textAlign: 'center' }}>–</td>
              <td style={{ ...cellBorder, textAlign: 'right' }}>{item?.unit_price != null ? fmtMoney(Number(item.unit_price)) : ''}</td>
              <td style={{ ...cellBorder, textAlign: 'right' }}>{item?.total_price != null ? fmtMoney(Number(item.total_price)) : ''}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={6} style={{ ...cellBorder, fontWeight: 700, textAlign: 'center' }}>
              Дүн
            </td>
            <td style={{ ...cellBorder, fontWeight: 700, textAlign: 'right' }}>{fmtMoney(total)}</td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '3px' }}>
        <thead>
          <tr>
            <th style={{ ...thBase, width: '40%' }}>Хаяг</th>
            <th style={{ ...thBase, width: '35%' }}>Мэдээлэл</th>
            <th style={{ ...thBase, width: '25%' }}>Жолоочийн нэр</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ ...cellBorder, verticalAlign: 'top', minHeight: '28px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {order.customer_address?.trim() || '–'}
            </td>
            <td style={{ ...cellBorder, verticalAlign: 'top', wordBreak: 'break-word' }}>{infoCell(order)}</td>
            <td style={{ ...cellBorder, verticalAlign: 'top' }}>{order.driver_name?.trim() || ''}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: '6px', fontSize: '6.5px' }}>
        <div style={{ marginBottom: '3px' }}>
          Тэмдэглэл :{' '}
          <span style={{ borderBottom: '1px dotted #000', display: 'inline-block', minWidth: '60%' }} />
        </div>
        <div style={{ marginBottom: '2px' }}>
          Хүлээлгэн өгсөн эд хариуцагч :{' '}
          <span style={{ borderBottom: '1px dotted #000', display: 'inline-block', minWidth: '35%' }} /> / /
        </div>
        <div style={{ marginBottom: '2px' }}>
          Бараа материалыг бүрэн бүтэн хүлээн авсан :{' '}
          <span style={{ borderBottom: '1px dotted #000', display: 'inline-block', minWidth: '28%' }} /> / /
        </div>
        <div style={{ marginBottom: '4px' }}>
          Бараа материалыг шалгаж хүлээн авсан :{' '}
          <span style={{ borderBottom: '1px dotted #000', display: 'inline-block', minWidth: '30%' }} /> / /
        </div>
        <div style={{ fontSize: '5.5px', lineHeight: 1.35, color: '#111' }}>
          <div>Бараа материалыг заавал падаантай тулган шалгаж авна уу.</div>
          <div>Зөрчил илэрвэл тухайн үед харилцан тэмдэглэл үйлдэх шаардлагатай.</div>
          <div>Тэмдэглэлгүйгээр хүлээн авсан барааны асуудлыг манай байгууллага хариуцахгүй болно.</div>
        </div>
      </div>
    </div>
  );
}

/**
 * A4 landscape: two identical expenditure voucher copies side by side.
 * Root id `expense-voucher-print-root` is used by print CSS.
 */
export function VoucherPdfTemplate({
  order,
  company,
}: {
  order: ExpenditureVoucherOrder;
  company: InvoiceCompanyInfo;
}) {
  return (
    <div
      id="expense-voucher-print-root"
      style={{
        width: '297mm',
        minHeight: '210mm',
        maxWidth: '297mm',
        boxSizing: 'border-box',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        color: '#000',
      }}
    >
      <div style={{ flex: 1, minWidth: 0, borderRight: '1px solid #000', boxSizing: 'border-box' }}>
        <ExpenditureVoucherHalf order={order} company={company} />
      </div>
      <div style={{ flex: 1, minWidth: 0, boxSizing: 'border-box' }}>
        <ExpenditureVoucherHalf order={order} company={company} />
      </div>
    </div>
  );
}
