'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Card, DatePicker, Button, Table, Statistic, message } from 'antd';
import { FileExcelOutlined, BarChartOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import Link from 'next/link';
import { ordersApi } from '@/lib/api';
import PageHeader from '../components/PageHeader';

const baseURL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:8000';

export default function ReportsPage() {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [stats, setStats] = useState<{
    date: string;
    total_orders: number;
    total_amount: number;
    by_status?: Record<string, number>;
    customers_count: number;
  } | null>(null);
  const [orders, setOrders] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);

  const dateStr = selectedDate.format('YYYY-MM-DD');

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data } = await ordersApi.dailyStats(dateStr);
      setStats(data);
    } catch {
      message.error('Тайлан ачааллахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data } = await ordersApi.list({ date: dateStr });
      setOrders(data.results || data);
    } catch {
      setOrders([]);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateStr]);

  const downloadExcel = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(
        `${baseURL}/api/orders/daily_report_excel/?date=${dateStr}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agume_${dateStr}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      message.success('Excel татагдлаа');
    } catch {
      message.error('Excel татах боломжгүй');
    }
  };

  const pathname = usePathname();

  return (
    <div>
      <PageHeader pathname={pathname} title="Тайлан" description="Өдрийн захиалгын тайлан, Excel татах" />
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
          <Link href="/reports/products">
            <Button icon={<BarChartOutlined />} style={{ marginRight: 8 }}>
              Барааны тайлан
            </Button>
          </Link>
          <DatePicker
            value={selectedDate}
            onChange={(d) => d && setSelectedDate(d)}
            format="YYYY-MM-DD"
          />
          <Button
            type="primary"
            icon={<FileExcelOutlined />}
            onClick={downloadExcel}
            style={{ background: '#25671E' }}
          >
            Excel татах
          </Button>
        </div>
      </Card>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <Card size="small" style={{ minWidth: 160 }}>
          <Statistic title="Өдрийн захиалга" value={stats?.total_orders ?? 0} loading={loading} />
        </Card>
        <Card size="small" style={{ minWidth: 160 }}>
          <Statistic
            title="Нийт дүн"
            value={stats?.total_amount ?? 0}
            suffix="₮"
            formatter={(v) => Number(v).toLocaleString()}
            loading={loading}
          />
        </Card>
        <Card size="small" style={{ minWidth: 160 }}>
          <Statistic title="Харилцагч тоо" value={stats?.customers_count ?? 0} loading={loading} />
        </Card>
        <Card size="small" style={{ minWidth: 160 }}>
          <Statistic
            title="Хүргэгдсэн"
            value={stats?.by_status?.delivered ?? 0}
            loading={loading}
          />
        </Card>
      </div>

      <Card title={`${dateStr} - Захиалгууд`}>
        <Table
          rowKey="id"
          dataSource={orders}
          loading={loading}
          columns={[
            { title: 'Дугаар', dataIndex: 'order_number', width: 140 },
            { title: 'Харилцагч', dataIndex: 'customer_name' },
            { title: 'Статус', dataIndex: 'status_display', width: 130 },
            {
              title: 'Нийт дүн',
              dataIndex: 'total_amount',
              width: 120,
              align: 'right',
              render: (v: number) => (v != null ? `${Number(v).toLocaleString()} ₮` : '-'),
            },
          ]}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      {stats?.by_status && (
        <Card title="Статусаар" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
            {Object.entries(stats.by_status).map(([status, count]) => (
              <span key={status}>
                {status === 'pending' && 'Хүлээгдэж буй'}
                {status === 'processing' && 'Бэлдэж байна'}
                {status === 'delivering' && 'Хүргэлтэнд гарсан'}
                {status === 'delivered' && 'Хүргэгдсэн'}
                {status === 'cancelled' && 'Цуцлагдсан'}: <strong>{count}</strong>
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
