'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Table,
  Button,
  Input,
  Select,
  Modal,
  Form,
  InputNumber,
  Switch,
  message,
} from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { productsApi } from '@/lib/api';
import PageHeader from '../components/PageHeader';

export default function ProductsPage() {
  const router = useRouter();
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      const { data: res } = await productsApi.list(params);
      setData((res?.results ?? res) as Record<string, unknown>[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryFilter]);

  useEffect(() => {
    productsApi.categories().then(({ data: res }) => setCategories(res.results || res));
  }, []);

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record: Record<string, unknown>) => {
    setEditingId(record.id as number);
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      category: record.category,
      unit: record.unit || 'кг',
      package_weight: record.package_weight,
      pieces_per_box: record.pieces_per_box,
      barcode: record.barcode,
      price: record.price,
      is_active: record.is_active !== false,
      note: record.note,
    });
    setModalOpen(true);
  };

  const onFinish = async (values: Record<string, unknown>) => {
    try {
      if (editingId) {
        await productsApi.update(editingId, values);
        message.success('Шинэчлэгдлээ');
      } else {
        await productsApi.create(values);
        message.success('Нэмэгдлээ');
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, unknown> } };
      message.error(String(e?.response?.data?.detail || e?.response?.data || 'Алдаа'));
    }
  };

  const onDelete = async (id: number) => {
    try {
      await productsApi.delete(id);
      message.success('Устгагдлаа');
      fetchProducts();
    } catch {
      message.error('Устгахад алдаа гарлаа');
    }
  };

  const columns = [
    {
      title: 'Код',
      dataIndex: 'code',
      key: 'code',
      width: 100,
      render: (code: string, record: Record<string, unknown>) => (
        <a
          href={`/products/${record.id}`}
          onClick={(e) => { e.preventDefault(); router.push(`/products/${record.id}`); }}
          style={{ color: 'var(--agume-primary)', fontWeight: 600 }}
        >
          {code}
        </a>
      ),
      sorter: (a: Record<string, unknown>, b: Record<string, unknown>) =>
        String(a?.code ?? '').localeCompare(String(b?.code ?? '')),
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: 'Нэр',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (name: string, record: Record<string, unknown>) => (
        <a
          href={`/products/${record.id}`}
          onClick={(e) => { e.preventDefault(); router.push(`/products/${record.id}`); }}
          style={{ color: 'var(--foreground)' }}
        >
          {name}
        </a>
      ),
      sorter: (a: Record<string, unknown>, b: Record<string, unknown>) =>
        String(a?.name ?? '').localeCompare(String(b?.name ?? '')),
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: 'Бүлэг',
      dataIndex: 'category_name',
      width: 120,
      sorter: (a: Record<string, unknown>, b: Record<string, unknown>) =>
        String(a?.category_name ?? '').localeCompare(String(b?.category_name ?? '')),
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: 'Нэгж',
      dataIndex: 'unit',
      width: 80,
      sorter: (a: Record<string, unknown>, b: Record<string, unknown>) =>
        String(a?.unit ?? '').localeCompare(String(b?.unit ?? '')),
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: 'Үнэ',
      dataIndex: 'price',
      width: 100,
      render: (v: number) => (v != null ? `${Number(v).toLocaleString()} ₮` : '-'),
      sorter: (a: Record<string, unknown>, b: Record<string, unknown>) =>
        (Number(a?.price) ?? 0) - (Number(b?.price) ?? 0),
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: 'Идэвхтэй',
      dataIndex: 'is_active',
      width: 80,
      render: (v: boolean) => (v ? 'Тийм' : 'Үгүй'),
      sorter: (a: Record<string, unknown>, b: Record<string, unknown>) =>
        (a?.is_active ? 1 : 0) - (b?.is_active ? 1 : 0),
      sortDirections: ['ascend', 'descend'],
    },
  ];

  const hasActiveFilters = search || categoryFilter;
  const clearFilters = () => {
    setSearch('');
    setCategoryFilter(null);
  };

  const pathname = usePathname();

  return (
    <div className="agume-products-page">
      <PageHeader
        pathname={pathname}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} size="middle" style={{ background: 'var(--agume-primary)' }}>
            Бараа нэмэх
          </Button>
        }
      />

      <section className="agume-products-table-section">
        <div className="agume-products-toolbar">
          <Input
            placeholder="Код эсвэл нэрээр хайх..."
            prefix={<SearchOutlined style={{ color: 'var(--agume-text-tertiary)' }} />}
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={() => fetchProducts()}
            className="agume-toolbar-search"
          />
          <Select
            placeholder="Бүлэг — бүгд"
            allowClear
            className="agume-toolbar-category"
            options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
            value={categoryFilter}
            onChange={setCategoryFilter}
          />
          {hasActiveFilters && (
            <Button type="link" size="small" onClick={clearFilters} className="agume-toolbar-clear">
              Цэвэрлэх
            </Button>
          )}
          <span className="agume-toolbar-count">{loading ? '...' : `${data.length} бараа`}</span>
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          bordered
          size="small"
          scroll={{ y: 'calc(100vh - 260px)' }}
          pagination={{
            pageSize: 100,
            showSizeChanger: true,
            pageSizeOptions: ['50', '100', '200'],
            showTotal: (total) => `Нийт ${total}`,
          }}
          className="agume-data-table"
          rowClassName={(_record, index) => (index != null && index % 2 === 0 ? 'agume-table-row-even' : 'agume-table-row-odd')}
          onRow={(record) => ({
            style: { cursor: 'pointer' },
            onClick: () => router.push(`/products/${record.id}`),
          })}
        />
      </section>
      <Modal
        title={editingId ? 'Бараа засах' : 'Бараа нэмэх'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={560}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="code" label="Код" rules={[{ required: true }]}>
            <Input placeholder="Барааны код" />
          </Form.Item>
          <Form.Item name="name" label="Нэр" rules={[{ required: true }]}>
            <Input placeholder="Барааны нэр" />
          </Form.Item>
          <Form.Item name="category" label="Бүлэг">
            <Select
              placeholder="Сонгох"
              allowClear
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>
          <Form.Item name="unit" label="Нэгж" initialValue="кг">
            <Select
              options={[
                { value: 'кг', label: 'кг' },
                { value: 'ш', label: 'ш' },
                { value: 'л', label: 'л' },
                { value: 'м', label: 'м' },
                { value: 'хайрцаг', label: 'хайрцаг' },
              ]}
            />
          </Form.Item>
          <Form.Item name="package_weight" label="Савлагааны жин">
            <Input />
          </Form.Item>
          <Form.Item name="pieces_per_box" label="Хайрцаг доторх тоо">
            <Input />
          </Form.Item>
          <Form.Item name="barcode" label="Баркод">
            <Input />
          </Form.Item>
          <Form.Item name="price" label="Үнэ" initialValue={0}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="is_active" label="Идэвхтэй" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
          <Form.Item name="note" label="Тайлбар">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ background: '#25671E' }}>
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
