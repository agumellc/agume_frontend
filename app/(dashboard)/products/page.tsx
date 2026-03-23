'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Modal,
  Form,
  InputNumber,
  Switch,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import PageHeader from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { useToast } from '../components/ToastContext';
import { productsApi } from '@/lib/api';

const UNIT_OPTIONS = [
  { value: 'кг', label: 'кг' },
  { value: 'ш', label: 'ш' },
  { value: 'л', label: 'л' },
  { value: 'м', label: 'м' },
  { value: 'хайрцаг', label: 'хайрцаг' },
];

export interface ProductRow {
  id: number;
  code?: string;
  name?: string;
  category_name?: string;
  category?: number;
  unit?: string;
  price?: number;
  is_active?: boolean;
  barcode?: string;
  note?: string;
  package_weight?: string | number;
  pieces_per_box?: string | number;
}

export default function ProductsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { addToast } = useToast();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [form] = Form.useForm();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await productsApi.list();
      const list = (data?.results ?? data) as ProductRow[];
      setProducts(Array.isArray(list) ? list : []);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      const msg = e?.response?.data?.detail ?? 'Бараа ачааллахад алдаа гарлаа';
      addToast({ type: 'error', title: 'Алдаа', description: String(msg) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    productsApi
      .categories()
      .then(({ data }) => setCategories(data?.results ?? data ?? []))
      .catch(() => {});
  }, []);

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = async (id: number) => {
    setEditingId(id);
    form.resetFields();
    try {
      const { data } = await productsApi.detail(id);
      const r = data as Record<string, unknown>;
      form.setFieldsValue({
        code: r.code,
        name: r.name,
        category: r.category ?? undefined,
        unit: r.unit ?? 'кг',
        package_weight: r.package_weight,
        pieces_per_box: r.pieces_per_box,
        barcode: r.barcode,
        price: r.price ?? 0,
        is_active: r.is_active !== false,
        note: r.note,
      });
      setModalOpen(true);
    } catch {
      addToast({ type: 'error', title: 'Алдаа', description: 'Бараа ачааллахад алдаа гарлаа' });
    }
  };

  const onFinish = async (values: Record<string, unknown>) => {
    try {
      if (editingId) {
        await productsApi.update(editingId, values);
        addToast({ type: 'success', title: 'Шинэчлэгдлээ' });
      } else {
        await productsApi.create(values);
        addToast({ type: 'success', title: 'Нэмэгдлээ' });
      }
      setModalOpen(false);
      fetchProducts();
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
    let list = products;
    if (categoryFilter != null) {
      list = list.filter((p) => p.category === categoryFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          String(p.code ?? '').toLowerCase().includes(q) ||
          String(p.name ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, categoryFilter, search]);

  const columns: ColumnsType<ProductRow> = useMemo(
    () => [
      {
        title: '№',
        key: 'index',
        width: 56,
        align: 'center',
        render: (_: unknown, __: ProductRow, index: number) => (index != null ? index + 1 : '—'),
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
              router.push(`/products/${record.id}`);
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
              router.push(`/products/${record.id}`);
            }}
          >
            {name ?? '—'}
          </Button>
        ),
      },
      {
        title: 'Бүлэг',
        dataIndex: 'category_name',
        key: 'category_name',
        width: 120,
        render: (val: string) => (val ? val : '—'),
        sorter: (a, b) =>
          String(a?.category_name ?? '').localeCompare(String(b?.category_name ?? '')),
        sortDirections: ['ascend', 'descend'],
      },
      {
        title: 'Нэгж',
        dataIndex: 'unit',
        key: 'unit',
        width: 80,
        render: (v: string) => v ?? '—',
        sorter: (a, b) => String(a?.unit ?? '').localeCompare(String(b?.unit ?? '')),
        sortDirections: ['ascend', 'descend'],
      },
      {
        title: 'Үнэ',
        dataIndex: 'price',
        key: 'price',
        width: 120,
        align: 'right',
        sorter: (a, b) => (Number(a?.price) ?? 0) - (Number(b?.price) ?? 0),
        sortDirections: ['ascend', 'descend'],
        render: (v: number) =>
          v == null || Number(v) === 0 ? (
            <Badge variant="warning">Үнэгүй</Badge>
          ) : (
            <span>{Number(v).toLocaleString('mn-MN')} ₮</span>
          ),
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
    [router]
  );

  const hasFilters = categoryFilter != null || search.trim() !== '';

  return (
    <div className="agume-products-page">
      <PageHeader
        pathname={pathname}
        title="Бараа материал"
        description="Барааны бүртгэл, ангилал, үнэ"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="middle"
            style={{ background: 'var(--agume-primary)' }}
            onClick={openCreate}
          >
            Бараа нэмэх
          </Button>
        }
      />

      <section className="agume-products-table-section">
        <div className="agume-products-toolbar">
          <Select
            placeholder="Бүлэг"
            allowClear
            size="small"
            style={{ width: 160 }}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            value={categoryFilter}
            onChange={(v) => setCategoryFilter(v ?? null)}
          />
          <Input
            placeholder="Код эсвэл нэрээр хайх..."
            prefix={<SearchOutlined style={{ color: 'var(--agume-text-tertiary)' }} />}
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={() => {}}
            size="small"
            className="agume-toolbar-search"
            style={{ width: 220 }}
          />
          {hasFilters && (
            <Button
              type="link"
              size="small"
              onClick={() => {
                setCategoryFilter(null);
                setSearch('');
              }}
              className="agume-toolbar-clear"
            >
              Цэвэрлэх
            </Button>
          )}
          <span className="agume-toolbar-count">
            {loading ? '...' : `${dataSource.length} бараа`}
          </span>
        </div>

        <Table<ProductRow>
          rowKey="id"
          columns={columns}
          dataSource={dataSource}
          loading={loading}
          bordered
          size="small"
          locale={{ emptyText: 'Бараа олдсонгүй' }}
          pagination={{
            pageSize: 100,
            showSizeChanger: true,
            pageSizeOptions: ['50', '100', '200'],
            showTotal: (total) => `Нийт ${total}`,
          }}
          scroll={{ x: 900, y: 'calc(100vh - 260px)' }}
          className="agume-data-table"
          rowClassName={(_record, index) =>
            index != null && index % 2 === 0 ? 'agume-table-row-even' : 'agume-table-row-odd'
          }
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
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="code" label="Код" rules={[{ required: true, message: 'Код оруулна уу' }]}>
            <Input placeholder="Барааны код" />
          </Form.Item>
          <Form.Item name="name" label="Нэр" rules={[{ required: true, message: 'Нэр оруулна уу' }]}>
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
            <Select options={UNIT_OPTIONS} />
          </Form.Item>
          <Form.Item name="package_weight" label="Савлагааны жин">
            <Input placeholder="Жин" />
          </Form.Item>
          <Form.Item name="pieces_per_box" label="Хайрцаг доторх тоо">
            <Input placeholder="Тоо" />
          </Form.Item>
          <Form.Item name="barcode" label="Баркод">
            <Input placeholder="Баркод" />
          </Form.Item>
          <Form.Item name="price" label="Үнэ" initialValue={0}>
            <InputNumber min={0} style={{ width: '100%' }} addonAfter="₮" />
          </Form.Item>
          <Form.Item name="is_active" label="Идэвхтэй" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
          <Form.Item name="note" label="Тайлбар">
            <Input.TextArea rows={2} placeholder="Тайлбар" />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              style={{ background: 'var(--agume-primary)' }}
            >
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
