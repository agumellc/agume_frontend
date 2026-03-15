'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Card, DatePicker, Table, message } from 'antd';
import type { ProductSalesRow } from '@/lib/api';
import { ordersApi } from '@/lib/api';
import PageHeader from '../../components/PageHeader';
import dayjs from 'dayjs';

export default function ReportsProductsPage() {
  const pathname = usePathname();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(1, 'month'),
    dayjs(),
  ]);
  const [data, setData] = useState<ProductSalesRow[]>([]);
  const [loading, setLoading] = useState(false);

  const dateFrom = dateRange[0].format('YYYY-MM-DD');
  const dateTo = dateRange[1].format('YYYY-MM-DD');

  useEffect(() => {
    setLoading(true);
    ordersApi
      .productSalesReport({ date_from: dateFrom, date_to: dateTo })
      .then(({ data: res }) => setData(res.results || []))
      .catch(() => {
        message.error('Барааны тайлан ачааллахад алдаа гарлаа');
        setData([]);
      })
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  const maxQty = Math.max(...data.map((r) => r.quantity_sold), 1);

  const columns = [
    { title: 'Код', dataIndex: 'product_code', key: 'product_code', width: 100 },
    { title: 'Барааны нэр', dataIndex: 'product_name', key: 'product_name', ellipsis: true },
    { title: 'Бүлэг', dataIndex: 'category_name', key: 'category_name', width: 120, render: (v: string | null) => v ?? '—' },
    { title: 'Нэгж', dataIndex: 'unit', key: 'unit', width: 70 },
    {
      title: 'Борлуулсан тоо',
      dataIndex: 'quantity_sold',
      key: 'quantity_sold',
      width: 120,
      align: 'right' as const,
      render: (v: number, r: ProductSalesRow) => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          {Number(v).toLocaleString('mn-MN')} {r.unit}
        </span>
      ),
    },
    {
      title: 'Нийт дүн',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 130,
      align: 'right' as const,
      render: (v: number) => (v != null ? `${Number(v).toLocaleString('mn-MN')} ₮` : '—'),
    },
    {
      title: 'Үлдэгдэл',
      dataIndex: 'stock_quantity',
      key: 'stock_quantity',
      width: 110,
      align: 'right' as const,
      render: (v: number | null, r: ProductSalesRow) =>
        v != null ? (
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{Number(v).toLocaleString('mn-MN')} {r.unit}</span>
        ) : (
          '—'
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        pathname={pathname}
        title="Барааны тайлан"
        description="Бараа тус бүрээр борлуулалт, нийт дүн, агуулахын үлдэгдэл"
      />

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
          <span style={{ fontWeight: 600, marginRight: 8 }}>Огнооны хүрээ:</span>
          <DatePicker.RangePicker
            value={dateRange}
            onChange={(dates) => dates && dates[0] && dates[1] && setDateRange([dates[0], dates[1]])}
            format="YYYY-MM-DD"
          />
        </div>
      </Card>

      <Card title="Борлуулалтын график (тоо хэмжээгээр)" style={{ marginBottom: 24 }}>
        <div className="agume-product-report-chart">
          {data.length === 0 && !loading && (
            <p style={{ color: 'var(--agume-text-tertiary)', margin: 0 }}>Өгөгдөл байхгүй байна.</p>
          )}
          {data.slice(0, 15).map((row) => (
            <div key={row.product_id} className="agume-product-report-chart-row">
              <span className="agume-product-report-chart-label" title={row.product_name}>
                {row.product_name}
              </span>
              <div className="agume-product-report-chart-bar-wrap">
                <div
                  className="agume-product-report-chart-bar"
                  style={{ width: `${(row.quantity_sold / maxQty) * 100}%` }}
                />
                <span className="agume-product-report-chart-value">
                  {row.quantity_sold.toLocaleString('mn-MN')} {row.unit}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Дэлгэрэнгүй жагсаалт">
        <Table
          rowKey="product_id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{ pageSize: 20, showTotal: (t) => `Нийт ${t} бараа` }}
          locale={{ emptyText: 'Сонгосон огноонд борлуулалт байхгүй байна.' }}
        />
      </Card>
    </div>
  );
}
