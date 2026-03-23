'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Table,
  Button,
  Input,
  Modal,
  Form,
  Switch,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
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
}

export default function CustomersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { addToast } = useToast();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [form] = Form.useForm();

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data } = await customersApi.list();
      const list = (data?.results ?? data) as CustomerRow[];
      setCustomers(Array.isArray(list) ? list : []);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      const msg = e?.response?.data?.detail ?? 'Харилцагч ачааллахад алдаа гарлаа';
      addToast({ type: 'error', title: 'Алдаа', description: String(msg) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

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
      fetchCustomers();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      addToast({
        type: 'error',
        title: 'Алдаа',
        description: String(e?.response?.data?.detail ?? 'Алдаа'),
      });
    }
  };

  const dataSource = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.trim().toLowerCase();
    return customers.filter(
      (c) =>
        String(c.code ?? '').toLowerCase().includes(q) ||
        String(c.name ?? '').toLowerCase().includes(q) ||
        String(c.phone ?? '').toLowerCase().includes(q) ||
        String(c.address ?? '').toLowerCase().includes(q)
    );
  }, [customers, search]);

  const columns: ColumnsType<CustomerRow> = useMemo(
    () => [
      {
        title: '№',
        key: 'index',
        width: 56,
        align: 'center',
        render: (_: unknown, __: CustomerRow, index: number) => (index != null ? index + 1 : '—'),
      },
      {
        title: 'Код',
        dataIndex: 'code',
        key: 'code',
        width: 100,
        sorter: (a, b) => String(a?.code ?? '').localeCompare(String(b?.code ?? '')),
        sortDirections: ['ascend', 'descend'],
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
        sorter: (a, b) => String(a?.name ?? '').localeCompare(String(b?.name ?? '')),
        sortDirections: ['ascend', 'descend'],
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
        sorter: (a, b) => String(a?.phone ?? '').localeCompare(String(b?.phone ?? '')),
        sortDirections: ['ascend', 'descend'],
      },
      {
        title: 'И-мэйл',
        dataIndex: 'email',
        key: 'email',
        render: (v: string) => <span style={{ whiteSpace: 'nowrap' }}>{v ?? '—'}</span>,
        sorter: (a, b) => String(a?.email ?? '').localeCompare(String(b?.email ?? '')),
        sortDirections: ['ascend', 'descend'],
      },
      {
        title: 'Регистр',
        dataIndex: 'register_number',
        key: 'register_number',
        render: (v: string) => <span style={{ whiteSpace: 'nowrap' }}>{v ?? '—'}</span>,
        sorter: (a, b) =>
          String(a?.register_number ?? '').localeCompare(String(b?.register_number ?? '')),
        sortDirections: ['ascend', 'descend'],
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
        sorter: (a, b) => (a?.is_active ? 1 : 0) - (b?.is_active ? 1 : 0),
        sortDirections: ['ascend', 'descend'],
      },
    ],
    []
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
              onClick={() => setSearch('')}
              className="agume-toolbar-clear"
            >
              Цэвэрлэх
            </Button>
          )}
          <span className="agume-toolbar-count">
            {loading ? '...' : `${dataSource.length} харилцагч`}
          </span>
        </div>

        <Table<CustomerRow>
          rowKey="id"
          columns={columns}
          dataSource={dataSource}
          loading={loading}
          bordered
          size="small"
          locale={{ emptyText: 'Харилцагч олдсонгүй' }}
          pagination={{
            pageSize: 100,
            showSizeChanger: true,
            pageSizeOptions: ['50', '100', '200'],
            showTotal: (total) => `Нийт ${total}`,
          }}
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
