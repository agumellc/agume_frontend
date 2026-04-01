'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Table,
  Button,
  Tag,
  Input,
  Select,
  DatePicker,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, FileExcelOutlined, SearchOutlined } from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import dayjs from 'dayjs';
import PageHeader from '../components/PageHeader';
import { ordersApi, customersApi, employeesApi } from '@/lib/api';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Хүлээгдэж буй' },
  { value: 'processing', label: 'Бэлдэж байна' },
  { value: 'delivering', label: 'Хүргэлтэнд гарсан' },
  { value: 'delivered', label: 'Хүргэгдсэн' },
  { value: 'cancelled', label: 'Цуцлагдсан' },
] as const;

const STATUS_COLORS: Record<string, string> = {
  pending: 'orange',
  processing: 'blue',
  delivering: 'purple',
  delivered: 'green',
  cancelled: 'red',
};

type OrderRow = Record<string, unknown>;

export default function OrdersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<{ id: number; name: string; code: string }[]>([]);
  const [drivers, setDrivers] = useState<{ id: number; name: string }[]>([]);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({
    total_orders: 0,
    total_amount: 0,
    customers_count: 0,
    delivered: 0,
  });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (dateRange?.[0]) params.date_from = dateRange[0].format('YYYY-MM-DD');
      if (dateRange?.[1]) params.date_to = dateRange[1].format('YYYY-MM-DD');
      if (customerId) params.customer = customerId;
      if (statusFilter) params.status = statusFilter;
      if (driverId) params.driver = driverId;
      if (search) params.search = search;
      const { data } = await ordersApi.list(params);
      setOrders((data.results || data) as OrderRow[]);
    } catch {
      message.error('Захиалга ачааллахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    const date = dateRange?.[0]?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD');
    try {
      const { data } = await ordersApi.dailyStats(date);
      setStats({
        total_orders: data.total_orders ?? 0,
        total_amount: data.total_amount ?? 0,
        customers_count: data.customers_count ?? 0,
        delivered: data.by_status?.delivered ?? 0,
      });
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [dateRange, customerId, statusFilter, driverId]);

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  useEffect(() => {
    customersApi.list().then(({ data }) => setCustomers(data.results || data));
    employeesApi.list({ role: 'driver' }).then(({ data }) => setDrivers(data.results || data));
  }, []);

  const onSearch = () => {
    fetchOrders();
  };

  const downloadExcel = async () => {
    const dateStr = dateRange?.[0]?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD');
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:8000'}/api/orders/daily_report_excel/?date=${dateStr}`,
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

  const statusLabel = (status: string) =>
    STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;

  const columns: ColumnsType<OrderRow> = useMemo(
    () => [
      {
        title: 'Дугаар',
        dataIndex: 'order_number',
        key: 'order_number',
        width: 160,
        sorter: (a, b) =>
          String(a.order_number ?? '').localeCompare(String(b.order_number ?? '')),
        sortDirections: ['ascend', 'descend'],
        render: (_: unknown, r: OrderRow) => (
          <a
            href={`/orders/${r.id}`}
            onClick={(e) => {
              e.preventDefault();
              router.push(`/orders/${r.id}`);
            }}
            style={{ color: 'var(--agume-primary)', fontWeight: 600 }}
          >
            {String(r.order_number ?? '')}
          </a>
        ),
      },
      {
        title: 'Огноо',
        dataIndex: 'order_date',
        key: 'order_date',
        width: 112,
        sorter: (a, b) =>
          String(a.order_date ?? '').localeCompare(String(b.order_date ?? '')),
        sortDirections: ['ascend', 'descend'],
        render: (v: unknown) => (v ? String(v) : '–'),
      },
      {
        title: 'Яаралтай',
        dataIndex: 'is_urgent',
        key: 'is_urgent',
        width: 90,
        render: (v: unknown) =>
          v ? <Tag color="red">Яаралтай</Tag> : <span style={{ color: 'var(--agume-text-tertiary)' }}>—</span>,
      },
      {
        title: 'Харилцагч',
        dataIndex: 'customer_name',
        key: 'customer_name',
        width: 160,
        ellipsis: true,
        sorter: (a, b) =>
          String(a.customer_name ?? '').localeCompare(String(b.customer_name ?? '')),
        sortDirections: ['ascend', 'descend'],
        render: (v: unknown) => (v ? String(v) : '–'),
      },
      {
        title: 'Оператор',
        dataIndex: 'operator_name',
        key: 'operator_name',
        width: 120,
        ellipsis: true,
        sorter: (a, b) =>
          String(a.operator_name ?? '').localeCompare(String(b.operator_name ?? '')),
        sortDirections: ['ascend', 'descend'],
        render: (v: unknown) => (v ? String(v) : '–'),
      },
      {
        title: 'Статус',
        dataIndex: 'status',
        key: 'status',
        width: 140,
        filters: STATUS_OPTIONS.map((o) => ({ text: o.label, value: o.value })),
        onFilter: (value, record) => record.status === value,
        sorter: (a, b) => String(a.status ?? '').localeCompare(String(b.status ?? '')),
        sortDirections: ['ascend', 'descend'],
        render: (status: unknown) => {
          const s = String(status ?? '');
          return <Tag color={STATUS_COLORS[s] || 'default'}>{statusLabel(s)}</Tag>;
        },
      },
      {
        title: 'Нийт дүн',
        dataIndex: 'total_amount',
        key: 'total_amount',
        width: 120,
        align: 'right',
        sorter: (a, b) => Number(a.total_amount ?? 0) - Number(b.total_amount ?? 0),
        sortDirections: ['ascend', 'descend'],
        render: (v: unknown) =>
          v != null && v !== '' ? `${Number(v).toLocaleString('mn-MN')} ₮` : '–',
      },
      {
        title: 'Баталгаа',
        dataIndex: 'has_delivery_proof',
        key: 'has_delivery_proof',
        width: 90,
        render: (v: unknown) => (v ? <Tag color="green">Тийм</Tag> : <span>—</span>),
      },
      {
        title: 'Маргаан',
        dataIndex: 'customer_disputed_delivery',
        key: 'customer_disputed_delivery',
        width: 90,
        render: (v: unknown) => (v ? <Tag color="red">Тийм</Tag> : <span>—</span>),
      },
    ],
    [router]
  );

  const dataSource = useMemo(
    () => orders.filter((o) => o.id != null),
    [orders]
  );

  const hasActiveFilters = dateRange?.[0] || dateRange?.[1] || customerId || statusFilter || driverId || search;

  return (
    <div className="agume-products-page">
      <PageHeader
        pathname={pathname}
        extra={
          <Button
            type="primary"
            onClick={() => router.push('/orders/new')}
            icon={<PlusOutlined />}
            size="middle"
            style={{ background: 'var(--agume-primary)' }}
          >
            Шинэ захиалга
          </Button>
        }
      />

      {/* Stats — тойм */}
      <section className="agume-orders-stats" aria-label="Тойм">
        <div className="agume-orders-stats-grid">
          <div className="agume-orders-stat">
            <span className="agume-orders-stat-label">Нийт захиалга</span>
            <span className="agume-orders-stat-value">{stats.total_orders}</span>
          </div>
          <div className="agume-orders-stat agume-orders-stat-primary">
            <span className="agume-orders-stat-label">Нийт дүн</span>
            <span className="agume-orders-stat-value">
              {Number(stats.total_amount).toLocaleString('mn-MN')} ₮
            </span>
          </div>
          <div className="agume-orders-stat">
            <span className="agume-orders-stat-label">Харилцагч</span>
            <span className="agume-orders-stat-value">{stats.customers_count}</span>
          </div>
          <div className="agume-orders-stat">
            <span className="agume-orders-stat-label">Хүргэгдсэн</span>
            <span className="agume-orders-stat-value">{stats.delivered}</span>
          </div>
        </div>
      </section>

      {/* Table section — Product table-тай ижил бүтэц */}
      <section className="agume-products-table-section">
        <div className="agume-products-toolbar">
          <DatePicker.RangePicker
            value={dateRange}
            onChange={(v) => setDateRange(v as [dayjs.Dayjs, dayjs.Dayjs] | null)}
            placeholder={['Эхлэх', 'Дуусах']}
            size="small"
          />
          <Select
            placeholder="Харилцагч"
            allowClear
            size="small"
            style={{ width: 180 }}
            showSearch
            optionFilterProp="label"
            options={customers.map((c) => ({ value: String(c.id), label: `${c.code} – ${c.name}` }))}
            value={customerId}
            onChange={setCustomerId}
          />
          <Select
            placeholder="Статус"
            allowClear
            size="small"
            style={{ width: 140 }}
            options={STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            value={statusFilter}
            onChange={setStatusFilter}
          />
          <Select
            placeholder="Жолооч"
            allowClear
            size="small"
            style={{ width: 140 }}
            options={drivers.map((d) => ({ value: String(d.id), label: d.name }))}
            value={driverId}
            onChange={setDriverId}
          />
          <Input
            placeholder="Дугаар / Харилцагч хайх..."
            prefix={<SearchOutlined style={{ color: 'var(--agume-text-tertiary)' }} />}
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={onSearch}
            size="small"
            className="agume-toolbar-search"
          />
          <Button type="primary" size="small" onClick={onSearch} icon={<SearchOutlined />} ghost>
            Шүүх
          </Button>
          <Button size="small" icon={<FileExcelOutlined />} onClick={downloadExcel}>
            Excel
          </Button>
          {hasActiveFilters && (
            <Button
              type="link"
              size="small"
              onClick={() => {
                setDateRange(null);
                setCustomerId(null);
                setStatusFilter(null);
                setDriverId(null);
                setSearch('');
              }}
              className="agume-toolbar-clear"
            >
              Цэвэрлэх
            </Button>
          )}
          <span className="agume-toolbar-count">
            {loading ? '...' : `${dataSource.length} захиалга`}
          </span>
        </div>
        <Table<OrderRow>
          rowKey="id"
          columns={columns}
          dataSource={dataSource}
          loading={loading}
          bordered
          size="small"
          locale={{ emptyText: 'Захиалга олдсонгүй' }}
          pagination={{
            pageSize: 100,
            showSizeChanger: true,
            pageSizeOptions: ['50', '100', '200'],
            showTotal: (total) => `Нийт ${total}`,
          }}
          scroll={{ x: 1020, y: 'calc(100vh - 260px)' }}
          className="agume-data-table"
          rowClassName={(_record, index) =>
            index != null && index % 2 === 0 ? 'agume-table-row-even' : 'agume-table-row-odd'
          }
          onRow={(record) => ({
            style: { cursor: 'pointer' },
            onClick: () => router.push(`/orders/${record.id}`),
          })}
        />
      </section>
    </div>
  );
}
