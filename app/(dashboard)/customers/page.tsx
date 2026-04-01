'use client';

import { useState, useEffect, useMemo, useCallback, useLayoutEffect, useRef } from 'react';
import {
  Table,
  Button,
  Input,
  Modal,
  Form,
  Switch,
  InputNumber,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { FilterValue, SorterResult, TableCurrentDataSource } from 'antd/es/table/interface';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { usePathname } from 'next/navigation';
import PageHeader from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { useToast } from '../components/ToastContext';
import { customersApi } from '@/lib/api';

export interface CustomerRow {
  id: number;
  code?: string;
  name?: string;
  phone?: string;
  address?: string;
  email?: string;
  register_number?: string;
  note?: string;
  is_active?: boolean;
  latitude?: number;
  longitude?: number;
}

type PaginatedCustomers = {
  count?: number;
  results?: CustomerRow[];
};

export default function CustomersPage() {
  const pathname = usePathname();
  const { addToast } = useToast();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [ordering, setOrdering] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [form] = Form.useForm();
  const sortStateRef = useRef<{ field?: string; order?: string | null }>({});

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useLayoutEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(currentPage),
        page_size: String(pageSize),
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (ordering) params.ordering = ordering;
      const { data } = await customersApi.list(params);
      const body = data as PaginatedCustomers & CustomerRow[];
      const list = (body?.results ?? (Array.isArray(body) ? body : [])) as CustomerRow[];
      setCustomers(Array.isArray(list) ? list : []);
      setTotal(typeof body?.count === 'number' ? body.count : list.length);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      const msg = e?.response?.data?.detail ?? 'Харилцагч ачааллахад алдаа гарлаа';
      addToast({ type: 'error', title: 'Алдаа', description: String(msg) });
    } finally {
      setLoading(false);
    }
  }, [addToast, currentPage, debouncedSearch, ordering, pageSize]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record: CustomerRow) => {
    setEditingId(record.id);
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      phone: record.phone,
      address: record.address,
      email: record.email,
      register_number: record.register_number,
      note: record.note,
      latitude: record.latitude,
      longitude: record.longitude,
      is_active: record.is_active !== false,
    });
    setModalOpen(true);
  };

  const onFinish = async (values: Record<string, unknown>) => {
    try {
      if (editingId) {
        await customersApi.update(editingId, values);
        addToast({ type: 'success', title: 'Шинэчлэгдлээ' });
      } else {
        await customersApi.create(values);
        addToast({ type: 'success', title: 'Нэмэгдлээ' });
      }
      setModalOpen(false);
      loadCustomers();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      addToast({
        type: 'error',
        title: 'Алдаа',
        description: String(e?.response?.data?.detail ?? 'Алдаа'),
      });
    }
  };

  const onTableChange = (
    pag: TablePaginationConfig,
    _filters: Record<string, FilterValue | null>,
    sorter: SorterResult<CustomerRow> | SorterResult<CustomerRow>[],
    _extra: TableCurrentDataSource<CustomerRow>
  ) => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    const fieldKey =
      (s?.columnKey as string) || (typeof s?.field === 'string' ? s.field : undefined);
    const order = s?.order;
    const fk = fieldKey || '';
    const prev = sortStateRef.current;
    const sortChanged = fk !== (prev.field || '') || (order || '') !== (prev.order || '');
    sortStateRef.current = { field: fk || undefined, order };

    let newOrdering: string | undefined;
    if (fk && order) {
      newOrdering = order === 'descend' ? `-${fk}` : fk;
    } else {
      newOrdering = undefined;
    }

    const nextPageSize = pag.pageSize ?? pageSize;
    const sizeChanged = nextPageSize !== pageSize;

    setOrdering(newOrdering);
    if (sizeChanged) setPageSize(nextPageSize);
    if (sortChanged || sizeChanged) {
      setCurrentPage(1);
    } else {
      setCurrentPage(pag.current ?? 1);
    }
  };

  const columns: ColumnsType<CustomerRow> = useMemo(
    () => [
      {
        title: '№',
        key: 'index',
        width: 56,
        align: 'center',
        render: (_: unknown, __: CustomerRow, index: number) =>
          index != null ? (currentPage - 1) * pageSize + index + 1 : '—',
      },
      {
        title: 'Код',
        dataIndex: 'code',
        key: 'code',
        width: 100,
        sorter: true,
        sortDirections: ['ascend', 'descend'],
        sortOrder:
          ordering === 'code' ? 'ascend' : ordering === '-code' ? 'descend' : undefined,
        render: (code: string, record) => (
          <Button
            type="link"
            size="small"
            className="agume-cell-link"
            onClick={(e) => {
              e.stopPropagation();
              openEdit(record);
            }}
          >
            {code ?? '—'}
          </Button>
        ),
      },
      {
        title: 'Нэр',
        dataIndex: 'name',
        key: 'name',
        ellipsis: true,
        sorter: true,
        sortDirections: ['ascend', 'descend'],
        sortOrder:
          ordering === 'name' ? 'ascend' : ordering === '-name' ? 'descend' : undefined,
        render: (name: string, record) => (
          <Button
            type="link"
            size="small"
            className="agume-cell-link"
            onClick={(e) => {
              e.stopPropagation();
              openEdit(record);
            }}
          >
            {name ?? '—'}
          </Button>
        ),
      },
      {
        title: 'Утас',
        dataIndex: 'phone',
        key: 'phone',
        render: (v: string) => <span style={{ whiteSpace: 'nowrap' }}>{v ?? '—'}</span>,
        sorter: true,
        sortDirections: ['ascend', 'descend'],
        sortOrder:
          ordering === 'phone' ? 'ascend' : ordering === '-phone' ? 'descend' : undefined,
      },
      {
        title: 'И-мэйл',
        dataIndex: 'email',
        key: 'email',
        render: (v: string) => <span style={{ whiteSpace: 'nowrap' }}>{v ?? '—'}</span>,
        sorter: true,
        sortDirections: ['ascend', 'descend'],
        sortOrder:
          ordering === 'email' ? 'ascend' : ordering === '-email' ? 'descend' : undefined,
      },
      {
        title: 'Регистр',
        dataIndex: 'register_number',
        key: 'register_number',
        render: (v: string) => <span style={{ whiteSpace: 'nowrap' }}>{v ?? '—'}</span>,
        sorter: true,
        sortDirections: ['ascend', 'descend'],
        sortOrder:
          ordering === 'register_number'
            ? 'ascend'
            : ordering === '-register_number'
              ? 'descend'
              : undefined,
      },
      {
        title: 'Хаяг',
        dataIndex: 'address',
        key: 'address',
        render: (v: string) => v ?? '—',
      },
      {
        title: 'Идэвхтэй',
        dataIndex: 'is_active',
        key: 'is_active',
        width: 100,
        render: (v: boolean) =>
          v !== false ? (
            <Badge variant="success" dot>
              Идэвхтэй
            </Badge>
          ) : (
            <Badge variant="neutral">Идэвхгүй</Badge>
          ),
        sorter: true,
        sortDirections: ['ascend', 'descend'],
        sortOrder:
          ordering === 'is_active'
            ? 'ascend'
            : ordering === '-is_active'
              ? 'descend'
              : undefined,
      },
    ],
    [currentPage, pageSize, ordering]
  );

  const hasFilters = search.trim() !== '';

  return (
    <div className="agume-products-page">
      <PageHeader
        pathname={pathname}
        title="Харилцагч"
        description="Харилцагчийн бүртгэл, хайлт"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="middle"
            style={{ background: 'var(--agume-primary)' }}
            onClick={openCreate}
          >
            Харилцагч нэмэх
          </Button>
        }
      />

      <section className="agume-products-table-section">
        <div className="agume-products-toolbar">
          <Input
            placeholder="Код, нэр, утас эсвэл хаягаар хайх..."
            prefix={<SearchOutlined style={{ color: 'var(--agume-text-tertiary)' }} />}
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            className="agume-toolbar-search"
            style={{ width: 280 }}
          />
          {hasFilters && (
            <Button
              type="link"
              size="small"
              onClick={() => {
                setSearch('');
                setCurrentPage(1);
              }}
              className="agume-toolbar-clear"
            >
              Цэвэрлэх
            </Button>
          )}
          <span className="agume-toolbar-count">
            {loading ? '...' : `Нийт ${total.toLocaleString('mn-MN')} харилцагч`}
          </span>
        </div>

        <Table<CustomerRow>
          rowKey="id"
          columns={columns}
          dataSource={customers}
          loading={loading}
          bordered
          size="small"
          locale={{ emptyText: 'Харилцагч олдсонгүй' }}
          pagination={{
            current: currentPage,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: ['50', '100', '200'],
            showTotal: (t, range) => `${range[0]}-${range[1]} / ${t}`,
          }}
          onChange={onTableChange}
          scroll={{ x: 1080, y: 'calc(100vh - 260px)' }}
          className="agume-data-table"
          rowClassName={(_record, index) =>
            index != null && index % 2 === 0 ? 'agume-table-row-even' : 'agume-table-row-odd'
          }
          onRow={(record) => ({
            style: { cursor: 'pointer' },
            onClick: () => openEdit(record),
          })}
        />
      </section>

      <Modal
        title={editingId ? 'Харилцагч засах' : 'Харилцагч нэмэх'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="code" label="Код" rules={[{ required: true, message: 'Код оруулна уу' }]}>
            <Input placeholder="Код" />
          </Form.Item>
          <Form.Item name="name" label="Нэр" rules={[{ required: true, message: 'Нэр оруулна уу' }]}>
            <Input placeholder="Нэр" />
          </Form.Item>
          <Form.Item name="phone" label="Утас">
            <Input placeholder="Утас" />
          </Form.Item>
          <Form.Item name="address" label="Хаяг">
            <Input.TextArea rows={2} placeholder="Хаяг" />
          </Form.Item>
          <Form.Item name="latitude" label="Өргөрөг (lat) — маршрут">
            <InputNumber style={{ width: '100%' }} step={0.000001} placeholder="47.918" />
          </Form.Item>
          <Form.Item name="longitude" label="Уртраг (lng) — маршрут">
            <InputNumber style={{ width: '100%' }} step={0.000001} placeholder="106.917" />
          </Form.Item>
          <Form.Item name="email" label="И-мэйл">
            <Input type="email" placeholder="И-мэйл" />
          </Form.Item>
          <Form.Item name="register_number" label="Регистр">
            <Input placeholder="Регистрийн дугаар" />
          </Form.Item>
          <Form.Item name="note" label="Тайлбар">
            <Input.TextArea rows={2} placeholder="Тайлбар" />
          </Form.Item>
          <Form.Item name="is_active" label="Идэвхтэй" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ background: 'var(--agume-primary)' }}>
              Хадгалах
            </Button>
            <Button onClick={() => setModalOpen(false)} style={{ marginLeft: 8 }}>
              Цуцлах
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
