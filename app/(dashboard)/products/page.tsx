'use client';

import { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from 'react';
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
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { FilterValue, SorterResult, TableCurrentDataSource } from 'antd/es/table/interface';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import PageHeader from '../components/PageHeader';
import PackageSizesEditor from '../components/PackageSizesEditor';
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
  preparation_bonus_percent?: number;
  package_sizes?: number[];
  complaint_threshold_count?: number;
  complaint_penalty_percent?: number;
  stock_min_threshold?: number;
  image_url?: string;
}

type PaginatedProducts = {
  count?: number;
  results?: ProductRow[];
};

export default function ProductsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { addToast } = useToast();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [ordering, setOrdering] = useState<string | undefined>(undefined);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [form] = Form.useForm();
  const productUnit = Form.useWatch('unit', form) || 'кг';
  const sortStateRef = useRef<{ field?: string; order?: string | null }>({});

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useLayoutEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, categoryFilter]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(currentPage),
        page_size: String(pageSize),
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (categoryFilter != null) params.category = String(categoryFilter);
      if (ordering) params.ordering = ordering;
      const { data } = await productsApi.list(params);
      const body = data as PaginatedProducts & ProductRow[];
      const list = (body?.results ?? (Array.isArray(body) ? body : [])) as ProductRow[];
      setProducts(Array.isArray(list) ? list : []);
      setTotal(typeof body?.count === 'number' ? body.count : list.length);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      const msg = e?.response?.data?.detail ?? 'Бараа ачааллахад алдаа гарлаа';
      addToast({ type: 'error', title: 'Алдаа', description: String(msg) });
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, currentPage, debouncedSearch, ordering, pageSize, addToast]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

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
      const pkgList = Array.isArray(r.package_sizes)
        ? (r.package_sizes as unknown[])
            .map((x) => Number(x))
            .filter((n) => !Number.isNaN(n) && n > 0)
        : [];
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
        preparation_bonus_percent: r.preparation_bonus_percent ?? 0,
        package_sizes: pkgList,
        complaint_threshold_count: r.complaint_threshold_count ?? 0,
        complaint_penalty_percent: r.complaint_penalty_percent ?? 0,
        stock_min_threshold: r.stock_min_threshold ?? undefined,
      });
      setModalOpen(true);
    } catch {
      addToast({ type: 'error', title: 'Алдаа', description: 'Бараа ачааллахад алдаа гарлаа' });
    }
  };

  const onFinish = async (values: Record<string, unknown>) => {
    const raw = values.package_sizes;
    const package_sizes = Array.isArray(raw)
      ? raw
          .map((x) => (typeof x === 'number' ? x : parseFloat(String(x))))
          .filter((n) => !Number.isNaN(n) && n > 0)
      : [];
    const payload = {
      ...values,
      package_sizes,
    };

    try {
      if (editingId) {
        await productsApi.update(editingId, payload);
        addToast({ type: 'success', title: 'Шинэчлэгдлээ' });
      } else {
        await productsApi.create(payload);
        addToast({ type: 'success', title: 'Нэмэгдлээ' });
      }
      setModalOpen(false);
      loadProducts();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      addToast({
        type: 'error',
        title: 'Алдаа',
        description: String(e?.response?.data?.detail ?? 'Алдаа'),
      });
    }
  };

  const columns: ColumnsType<ProductRow> = useMemo(
    () => [
      {
        title: '№',
        key: 'index',
        width: 56,
        align: 'center',
        render: (_: unknown, __: ProductRow, index: number) =>
          index != null ? (currentPage - 1) * pageSize + index + 1 : '—',
      },
      {
        title: 'Код',
        dataIndex: 'code',
        key: 'code',
        width: 100,
        sorter: true,
        sortOrder:
          ordering === 'code' ? 'ascend' : ordering === '-code' ? 'descend' : undefined,
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
        sorter: true,
        sortOrder:
          ordering === 'name' ? 'ascend' : ordering === '-name' ? 'descend' : undefined,
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
      },
      {
        title: 'Нэгж',
        dataIndex: 'unit',
        key: 'unit',
        width: 80,
        render: (v: string) => v ?? '—',
        sorter: true,
        sortOrder:
          ordering === 'unit' ? 'ascend' : ordering === '-unit' ? 'descend' : undefined,
      },
      {
        title: 'Үнэ',
        dataIndex: 'price',
        key: 'price',
        width: 120,
        align: 'right',
        sorter: true,
        sortOrder:
          ordering === 'price' ? 'ascend' : ordering === '-price' ? 'descend' : undefined,
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
        sorter: true,
        sortOrder:
          ordering === 'is_active'
            ? 'ascend'
            : ordering === '-is_active'
              ? 'descend'
              : undefined,
      },
    ],
    [router, currentPage, pageSize, ordering]
  );

  const onTableChange = (
    pag: TablePaginationConfig,
    _filters: Record<string, FilterValue | null>,
    sorter: SorterResult<ProductRow> | SorterResult<ProductRow>[],
    _extra: TableCurrentDataSource<ProductRow>
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
                setCurrentPage(1);
              }}
              className="agume-toolbar-clear"
            >
              Цэвэрлэх
            </Button>
          )}
          <span className="agume-toolbar-count">
            {loading ? '...' : `Нийт ${total.toLocaleString('mn-MN')} бараа`}
          </span>
        </div>

        <Table<ProductRow>
          rowKey="id"
          columns={columns}
          dataSource={products}
          loading={loading}
          bordered
          size="small"
          locale={{ emptyText: 'Бараа олдсонгүй' }}
          pagination={{
            current: currentPage,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: ['25', '50', '100', '200'],
            showTotal: (t, range) => `${range[0]}-${range[1]} / ${t}`,
          }}
          onChange={onTableChange}
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
        width={640}
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
          <Form.Item
            name="preparation_bonus_percent"
            label="Бэлтгэлийн бонус (барааны үнэ дээрх %)"
            initialValue={0}
            tooltip="Дууссан даалгаврын бонус тооцоололд ашиглана"
          >
            <InputNumber min={0} max={100} style={{ width: '100%' }} addonAfter="%" />
          </Form.Item>
          <Form.Item label="Савлагааны хэмжээнүүд" tooltip="Нэгтгэл, даалгаварт савлагаар задлахад ашиглана">
            <PackageSizesEditor unitLabel={String(productUnit)} />
          </Form.Item>
          <Form.Item
            name="complaint_threshold_count"
            label="Гомдлын босго (сард, бараагаар)"
            initialValue={0}
            tooltip="0 = идэвхгүй. Тухайн бараанд энэ тооноос их гомдол ирвэл бонусын хасалт"
          >
            <InputNumber min={0} max={999} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="complaint_penalty_percent"
            label="Босго давбал бонусын хасалт"
            initialValue={0}
          >
            <InputNumber min={0} max={100} style={{ width: '100%' }} addonAfter="%" />
          </Form.Item>
          <Form.Item
            name="stock_min_threshold"
            label="Доод нөөц (сануулга)"
            tooltip="Үлдэгдэл энэ доор орвол «Нөөц» хуудасны дутуу жагсаалтад орно"
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="Хоосон = сануулга үгүй" />
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
