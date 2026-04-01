'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Tag,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  message,
  Space,
  Upload,
} from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import { productsApi } from '@/lib/api';
import PageHeader from '../../components/PageHeader';
import PackageSizesEditor from '../../components/PackageSizesEditor';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const [product, setProduct] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [form] = Form.useForm();
  const productUnit = Form.useWatch('unit', form) || 'кг';

  const fetchProduct = () => {
    if (!id) return;
    setLoading(true);
    productsApi
      .detail(id)
      .then(({ data }) => setProduct(data))
      .catch(() => message.error('Бараа олдсонгүй'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  useEffect(() => {
    productsApi.categories().then(({ data: res }) => setCategories(res.results || res || []));
  }, []);

  useEffect(() => {
    if (product && editing) {
      const pkgList = Array.isArray(product.package_sizes)
        ? (product.package_sizes as unknown[])
            .map((x) => Number(x))
            .filter((n) => !Number.isNaN(n) && n > 0)
        : [];
      form.setFieldsValue({
        code: product.code,
        name: product.name,
        category: product.category,
        unit: product.unit || 'кг',
        package_weight: product.package_weight,
        pieces_per_box: product.pieces_per_box,
        barcode: product.barcode,
        price: product.price,
        is_active: product.is_active !== false,
        note: product.note,
        preparation_bonus_percent: product.preparation_bonus_percent ?? 0,
        package_sizes: pkgList,
        complaint_threshold_count: product.complaint_threshold_count ?? 0,
        complaint_penalty_percent: product.complaint_penalty_percent ?? 0,
        stock_min_threshold: product.stock_min_threshold ?? undefined,
      });
    }
  }, [product, editing, form]);

  const onFinish = async (values: Record<string, unknown>) => {
    const raw = values.package_sizes;
    const package_sizes = Array.isArray(raw)
      ? raw
          .map((x) => (typeof x === 'number' ? x : parseFloat(String(x))))
          .filter((n) => !Number.isNaN(n) && n > 0)
      : [];
    const payload = { ...values, package_sizes };

    setSaving(true);
    try {
      await productsApi.update(id, payload);
      message.success('Шинэчлэгдлээ');
      setEditing(false);
      fetchProduct();
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, unknown> } };
      message.error(String(e?.response?.data?.detail || e?.response?.data || 'Алдаа'));
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    form.resetFields();
  };

  const uploadImage = async (file: File) => {
    const fd = new FormData();
    fd.append('image', file);
    try {
      await productsApi.patch(id, fd);
      message.success('Зураг шинэчлэгдлээ');
      fetchProduct();
    } catch {
      message.error('Зураг оруулахад алдаа');
    }
  };

  if (loading || !product) {
    return (
      <Card loading={loading}>
        <div style={{ minHeight: 200 }} />
      </Card>
    );
  }

  const categoryName = product.category_name != null ? String(product.category_name) : '-';

  return (
    <div style={{ maxWidth: 720 }}>
      <PageHeader
        pathname={`/products/${id}`}
        items={[
          { title: 'Нүүр', href: '/dashboard' },
          { title: 'Бараа материал', href: '/products' },
          { title: editing ? 'Засах' : `${String(product.code)} - ${String(product.name)}` },
        ]}
        extra={
          !editing ? (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => setEditing(true)}
              style={{ background: '#25671E' }}
            >
              Засах
            </Button>
          ) : null
        }
      />
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/products')}>
          Буцах
        </Button>
      </div>

      {editing ? (
        <Card title="Бараа засах">
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
            <Form.Item name="unit" label="Нэгж">
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
            <Form.Item name="price" label="Үнэ">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="preparation_bonus_percent" label="Бэлтгэлийн бонус %">
              <InputNumber min={0} max={100} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Савлагааны хэмжээнүүд">
              <PackageSizesEditor unitLabel={String(productUnit)} />
            </Form.Item>
            <Form.Item name="complaint_threshold_count" label="Гомдлын босго (0=идэвхгүй)">
              <InputNumber min={0} max={999} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="complaint_penalty_percent" label="Босго давбал хасалт %">
              <InputNumber min={0} max={100} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="stock_min_threshold" label="Доод нөөц (сануулга)">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="Хоосон = идэвхгүй" />
            </Form.Item>
            <Form.Item name="is_active" label="Идэвхтэй" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="note" label="Тайлбар">
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={saving} style={{ background: '#25671E' }}>
                  Хадгалах
                </Button>
                <Button onClick={cancelEdit} disabled={saving}>
                  Цуцлах
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      ) : (
        <Card>
          <div style={{ marginBottom: 20 }}>
            {product.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={String(product.image_url)}
                alt=""
                style={{ maxWidth: 280, maxHeight: 200, objectFit: 'contain', borderRadius: 8 }}
              />
            ) : (
              <span className="agume-product-detail-value">Зураг байхгүй</span>
            )}
            <div style={{ marginTop: 8 }}>
              <Upload accept="image/*" showUploadList={false} beforeUpload={(file) => { void uploadImage(file); return false; }}>
                <Button size="small">Зураг солих</Button>
              </Upload>
            </div>
          </div>
          <div className="agume-product-detail-rows">
            <div className="agume-product-detail-row">
              <span className="agume-product-detail-label">Код</span>
              <span className="agume-product-detail-value">{String(product.code)}</span>
            </div>
            <div className="agume-product-detail-row">
              <span className="agume-product-detail-label">Нэр</span>
              <span className="agume-product-detail-value">{String(product.name)}</span>
            </div>
            <div className="agume-product-detail-row">
              <span className="agume-product-detail-label">Бүлэг</span>
              <span className="agume-product-detail-value">{categoryName}</span>
            </div>
            <div className="agume-product-detail-row">
              <span className="agume-product-detail-label">Нэгж</span>
              <span className="agume-product-detail-value">{String(product.unit || '-')}</span>
            </div>
            <div className="agume-product-detail-row">
              <span className="agume-product-detail-label">Үнэ</span>
              <span className="agume-product-detail-value">
                {product.price != null ? `${Number(product.price).toLocaleString('mn-MN')} ₮` : '-'}
              </span>
            </div>
            <div className="agume-product-detail-row">
              <span className="agume-product-detail-label">Бонус %</span>
              <span className="agume-product-detail-value">
                {String(product.preparation_bonus_percent ?? 0)}%
              </span>
            </div>
            <div className="agume-product-detail-row">
              <span className="agume-product-detail-label">Савлагааны хэмжээнүүд</span>
              <span className="agume-product-detail-value">
                {Array.isArray(product.package_sizes) && (product.package_sizes as unknown[]).length
                  ? (product.package_sizes as number[])
                      .map((x) => `${x} ${String(product.unit || 'кг')}`)
                      .join(' · ')
                  : '—'}
              </span>
            </div>
            <div className="agume-product-detail-row">
              <span className="agume-product-detail-label">Доод нөөц</span>
              <span className="agume-product-detail-value">
                {product.stock_min_threshold != null ? String(product.stock_min_threshold) : '—'}
              </span>
            </div>
            <div className="agume-product-detail-row">
              <span className="agume-product-detail-label">Идэвхтэй</span>
              <span className="agume-product-detail-value">
                {product.is_active ? <Tag color="green">Тийм</Tag> : <Tag color="default">Үгүй</Tag>}
              </span>
            </div>
            {(product.package_weight ?? '') !== '' && (
              <div className="agume-product-detail-row">
                <span className="agume-product-detail-label">Савлагааны жин</span>
                <span className="agume-product-detail-value">{String(product.package_weight)}</span>
              </div>
            )}
            {(product.pieces_per_box ?? '') !== '' && (
              <div className="agume-product-detail-row">
                <span className="agume-product-detail-label">Хайрцаг доторх тоо</span>
                <span className="agume-product-detail-value">{String(product.pieces_per_box)}</span>
              </div>
            )}
            {(product.barcode ?? '') !== '' && (
              <div className="agume-product-detail-row">
                <span className="agume-product-detail-label">Баркод</span>
                <span className="agume-product-detail-value">{String(product.barcode)}</span>
              </div>
            )}
            {(product.note ?? '') !== '' && (
              <div className="agume-product-detail-row">
                <span className="agume-product-detail-label">Тайлбар</span>
                <span className="agume-product-detail-value">{String(product.note)}</span>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
