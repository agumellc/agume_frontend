'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Card,
  Form,
  Select,
  DatePicker,
  Input,
  InputNumber,
  Button,
  Switch,
  Table,
  Alert,
  Upload,
  message,
  Space,
  Progress,
  Steps,
  Spin,
} from 'antd';
import type { UploadFile } from 'antd';
import { InboxOutlined, RobotOutlined, EditOutlined, DeleteOutlined, PlusOutlined, LoadingOutlined } from '@ant-design/icons';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import dayjs from 'dayjs';
import PageHeader from '../../components/PageHeader';
import { ordersApi, productsApi, customersApi, employeesApi } from '@/lib/api';

const { TextArea } = Input;
const { Dragger } = Upload;

const AI_STEPS = [
  { title: 'Зураг бэлтгэж байна' },
  { title: 'Илгээж байна' },
  { title: 'Бараа таньж байна' },
  { title: 'Бэлэн' },
] as const;

interface OrderItemRow {
  key: string;
  product?: number;
  product_name?: string;
  product_code?: string;
  product_unit?: string;
  quantity: number;
  unit_price: number;
  note?: string;
}

export default function NewOrderForm() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const draftParam = searchParams.get('draft');
  const draftIdFromUrl =
    draftParam && !Number.isNaN(Number(draftParam)) ? Number(draftParam) : null;

  const [step1Form] = Form.useForm();
  const [form] = Form.useForm();
  const [products, setProducts] = useState<{ id: number; code: string; name: string; unit: string; price: number }[]>([]);
  const [customers, setCustomers] = useState<{ id: number; code: string; name: string }[]>([]);
  const [employees, setEmployees] = useState<{ id: number; name: string; role: string }[]>([]);
  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [aiMode, setAiMode] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStep, setAiStep] = useState(0);
  const [aiError, setAiError] = useState('');
  const [aiSuccess, setAiSuccess] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [orderImagePreviewUrl, setOrderImagePreviewUrl] = useState<string | null>(null);
  const [draftLoading, setDraftLoading] = useState(false);
  /** Серверээс ирсэн created_by id — PUT үед хадгална */
  const [orderCreatedBy, setOrderCreatedBy] = useState<number | null | undefined>(undefined);
  const [createdByDisplay, setCreatedByDisplay] = useState<string | null>(null);
  const stepTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => {
      if (orderImagePreviewUrl) URL.revokeObjectURL(orderImagePreviewUrl);
    };
  }, [orderImagePreviewUrl]);

  useEffect(() => {
    productsApi
      .list({ is_active: 'true', page_size: '500' })
      .then(({ data }) => setProducts(data.results || data));
    customersApi.list({ is_active: 'true' }).then(({ data }) => setCustomers(data.results || data));
    employeesApi.list().then(({ data }) => setEmployees(data.results || data));
  }, []);

  useEffect(() => {
    if (!draftIdFromUrl) {
      setDraftLoading(false);
      setItems([]);
      setOrderCreatedBy(undefined);
      setCreatedByDisplay(null);
      return;
    }
    setDraftLoading(true);
    ordersApi
      .detail(draftIdFromUrl)
      .then(({ data }) => {
        if (data.status !== 'draft') {
          message.warning('Зөвхөн ноорог захиалгыг энд засварлана');
          router.replace('/orders/new');
          return;
        }
        form.setFieldsValue({
          customer: data.customer,
          order_date: data.order_date ? dayjs(data.order_date as string) : dayjs(),
          delivery_date: data.delivery_date ? dayjs(data.delivery_date as string) : undefined,
          driver: data.driver ?? undefined,
          note: data.note || '',
          is_urgent: Boolean(data.is_urgent),
        });
        const cb = data.created_by as number | null | undefined;
        setOrderCreatedBy(cb != null ? Number(cb) : null);
        setCreatedByDisplay(
          typeof data.created_by_name === 'string' && data.created_by_name.trim() !== ''
            ? data.created_by_name
            : null
        );
        const rawItems = (data.items as Record<string, unknown>[]) || [];
        setItems(
          rawItems.map((it) => ({
            key: `db-${it.id}`,
            product: it.product as number | undefined,
            product_name: it.product_name as string | undefined,
            product_code: it.product_code as string | undefined,
            product_unit: it.product_unit as string | undefined,
            quantity: Number(it.quantity) || 0,
            unit_price: Number(it.unit_price) || 0,
            note: String(it.note || ''),
          }))
        );
        // Алхам 2: үргэлж «AI зургаар» анхдагч (ноорог үүсэхэд created_by_ai=false байдаг)
        setAiMode(true);
      })
      .catch(() => {
        message.error('Захиалга ачаалахад алдаа гарлаа');
        router.replace('/orders/new');
      })
      .finally(() => setDraftLoading(false));
  }, [draftIdFromUrl, router, form]);

  const drivers = employees.filter((e) => e.role === 'driver');

  const clearStepTimers = () => {
    stepTimersRef.current.forEach((t) => clearTimeout(t));
    stepTimersRef.current = [];
  };

  useEffect(() => {
    return () => clearStepTimers();
  }, []);

  const handleAiUpload = useCallback(async (file: File) => {
    setAiError('');
    setAiSuccess('');
    setOrderImagePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setAiLoading(true);
    setAiStep(0);
    clearStepTimers();

    const t1 = setTimeout(() => setAiStep(1), 300);
    const t2 = setTimeout(() => setAiStep(2), 900);
    stepTimersRef.current = [t1, t2];

    const formData = new FormData();
    formData.append('image', file);

    try {
      const { data } = await ordersApi.createFromImage(formData, draftIdFromUrl ?? undefined);
      clearStepTimers();
      setAiStep(3);

      if (data.success && data.items?.length) {
        const rows: OrderItemRow[] = data.items.map((item: Record<string, unknown>, i: number) => {
          const pid = item.product;
          const hasProduct = pid != null && pid !== '';
          return {
            key: `ai-${i}-${Date.now()}`,
            ...(hasProduct
              ? {
                  product: Number(pid),
                  product_name: item.product_name as string,
                  product_code: item.product_code as string,
                  product_unit: item.product_unit as string,
                }
              : {}),
            quantity: Number(item.quantity) || 1,
            unit_price: hasProduct ? Number(item.unit_price) || 0 : 0,
            note: (item.note as string) || '',
          };
        });
        setItems((prev) => [...prev, ...rows]);
        form.setFieldValue('note', data.note || form.getFieldValue('note'));
        setAiSuccess(data.message || `${data.items?.length ?? 0} бараа амжилттай таньлаа`);
        await new Promise((r) => setTimeout(r, 600));
      } else {
        setAiError('Зургаас бараа олдсонгүй. Гараар нэмнэ үү.');
      }
    } catch (err: unknown) {
      clearStepTimers();
      const axErr = err as {
        code?: string;
        message?: string;
        response?: { data?: { error?: string } };
      };
      const msg = typeof axErr.message === 'string' ? axErr.message.toLowerCase() : '';
      const isTimeout =
        axErr.code === 'ECONNABORTED' || msg.includes('timeout') || msg.includes('exceeded');
      setAiError(
        axErr?.response?.data?.error ||
          (isTimeout
            ? 'Холболтын хугацаа дууслаа (зураг том эсвэл сервер удаан байна). Дахин оролдоно уу.'
            : 'AI уншихад алдаа гарлаа')
      );
    } finally {
      setAiLoading(false);
      setFileList([]);
      setAiStep(0);
    }
    return false;
  }, [draftIdFromUrl, form]);

  useEffect(() => {
    if (!draftIdFromUrl || !aiMode) return;
    const onPaste = (e: ClipboardEvent) => {
      if (aiLoading) return;
      const cd = e.clipboardData;
      if (!cd) return;

      const tryFile = (blob: File | Blob | null | undefined) => {
        if (!blob || blob.size <= 0) return false;
        const mime = blob.type || '';
        if (!mime.startsWith('image/')) return false;
        e.preventDefault();
        const sub = (mime.split('/')[1] || 'png').replace('jpeg', 'jpg');
        let file: File;
        if (blob instanceof File) {
          file = blob;
        } else {
          file = new File([blob], `paste.${sub}`, { type: mime });
        }
        void handleAiUpload(file);
        return true;
      };

      if (cd.items?.length) {
        for (let i = 0; i < cd.items.length; i++) {
          const item = cd.items[i];
          if (item.kind === 'file' && item.type.startsWith('image/')) {
            if (tryFile(item.getAsFile())) return;
          }
        }
      }
      const { files } = cd;
      if (files?.length) {
        for (let i = 0; i < files.length; i++) {
          if (tryFile(files[i])) return;
        }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [draftIdFromUrl, aiMode, aiLoading, handleAiUpload]);

  const addRow = () => {
    setItems((prev) => [
      ...prev,
      {
        key: `manual-${Date.now()}`,
        quantity: 1,
        unit_price: 0,
        note: '',
      },
    ]);
  };

  const removeRow = (key: string) => {
    setItems((prev) => prev.filter((r) => r.key !== key));
  };

  const updateRow = (key: string, field: string, value: unknown) => {
    setItems((prev) =>
      prev.map((r) => {
        if (r.key !== key) return r;
        const next = { ...r, [field]: value };
        if (field === 'product') {
          const prod =
            value != null && value !== ''
              ? products.find((p) => p.id === value)
              : undefined;
          if (prod) {
            next.product_name = prod.name;
            next.product_code = prod.code;
            next.product_unit = prod.unit;
            next.unit_price = Number(prod.price);
          } else {
            delete next.product;
            delete next.product_name;
            delete next.product_code;
            delete next.product_unit;
            next.unit_price = 0;
          }
        }
        return next;
      })
    );
  };

  const totalAmount = items.reduce(
    (sum, r) => sum + (Number(r.quantity) || 0) * (Number(r.unit_price) || 0),
    0
  );

  const createDraftOrder = async (values: Record<string, unknown>) => {
    setSaveLoading(true);
    try {
      const { data } = await ordersApi.create({
        customer: values.customer,
        order_date: values.order_date
          ? dayjs(values.order_date as string).format('YYYY-MM-DD')
          : dayjs().format('YYYY-MM-DD'),
        delivery_date: values.delivery_date
          ? dayjs(values.delivery_date as string).format('YYYY-MM-DD')
          : null,
        driver: values.driver || null,
        note: values.note || '',
        is_urgent: Boolean(values.is_urgent),
        status: 'draft',
        items: [],
        created_by_ai: false,
      });
      message.success('Ноорог захиалга үүслээ');
      router.replace(`/orders/new?draft=${data.id}`);
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: Record<string, unknown> } };
      const msg = axErr?.response?.data?.detail || axErr?.response?.data || 'Үүсгэхэд алдаа гарлаа';
      message.error(String(msg));
    } finally {
      setSaveLoading(false);
    }
  };

  const onFinish = async (values: Record<string, unknown>) => {
    if (!draftIdFromUrl) {
      message.error('Ноорог олдсонгүй');
      return;
    }
    if (!items.length) {
      message.error('Дор хаяж нэг бараа нэмнэ үү');
      return;
    }
    const customerId = values.customer;
    if (!customerId) {
      message.error('Харилцагч сонгоно уу');
      return;
    }
    setSaveLoading(true);
    try {
      const payload: Record<string, unknown> = {
        customer: customerId,
        order_date: values.order_date
          ? dayjs(values.order_date as string).format('YYYY-MM-DD')
          : dayjs().format('YYYY-MM-DD'),
        delivery_date: values.delivery_date
          ? dayjs(values.delivery_date as string).format('YYYY-MM-DD')
          : null,
        driver: values.driver || null,
        note: values.note || '',
        is_urgent: Boolean(values.is_urgent),
        created_by_ai: aiMode,
        status: 'pending',
        items: items
          .filter((r) => r.product && Number(r.quantity) > 0)
          .map((r) => ({
            product: r.product,
            quantity: r.quantity,
            unit_price: r.unit_price,
            note: r.note || '',
          })),
      };
      if (orderCreatedBy !== undefined && orderCreatedBy !== null) {
        payload.created_by = orderCreatedBy;
      }
      await ordersApi.update(draftIdFromUrl, payload);
      message.success('Захиалга баталгаажлаа');
      router.push(`/orders/${draftIdFromUrl}`);
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: Record<string, unknown> } };
      const msg = axErr?.response?.data?.detail || axErr?.response?.data || 'Хадгалахад алдаа гарлаа';
      message.error(String(msg));
    } finally {
      setSaveLoading(false);
    }
  };

  const itemColumns = [
    {
      title: '№',
      width: 50,
      render: (_: unknown, __: OrderItemRow, index: number) => index + 1,
    },
    {
      title: 'Бараа',
      dataIndex: 'product',
      width: 280,
      render: (val: number | undefined, row: OrderItemRow) => {
        const productOptions = products.map((p) => ({ value: p.id, label: `${p.code} - ${p.name}` }));
        const hasApiLabel = row.product_code != null && row.product_name != null && row.product;
        const apiLabel = hasApiLabel ? `${row.product_code} - ${row.product_name}` : null;
        const options = apiLabel
          ? (() => {
              const existing = productOptions.find((o) => o.value === row.product);
              if (existing) return productOptions.map((o) => (o.value === row.product ? { ...o, label: apiLabel } : o));
              return [{ value: row.product as number, label: apiLabel }, ...productOptions];
            })()
          : productOptions;
        return (
          <Select
            placeholder="Бараа сонгох"
            showSearch
            allowClear
            optionFilterProp="label"
            style={{ width: '100%' }}
            value={val ?? undefined}
            onChange={(v) => updateRow(row.key, 'product', v)}
            options={options}
          />
        );
      },
    },
    {
      title: 'Тоо хэмжээ',
      dataIndex: 'quantity',
      width: 120,
      render: (val: number, row: OrderItemRow) => (
        <InputNumber
          min={0.01}
          step={0.5}
          style={{ width: '100%' }}
          value={val}
          onChange={(v) => updateRow(row.key, 'quantity', v ?? 0)}
        />
      ),
    },
    {
      title: 'Нэгж',
      dataIndex: 'product_unit',
      width: 70,
      render: (v: string) => v || '-',
    },
    {
      title: 'Нэгжийн үнэ',
      dataIndex: 'unit_price',
      width: 110,
      render: (val: number, row: OrderItemRow) => (
        <InputNumber
          min={0}
          style={{ width: '100%' }}
          value={val}
          onChange={(v) => updateRow(row.key, 'unit_price', v ?? 0)}
        />
      ),
    },
    {
      title: 'Үнэ',
      width: 110,
      align: 'right' as const,
      render: (_: unknown, row: OrderItemRow) => {
        const total = (Number(row.quantity) || 0) * (Number(row.unit_price) || 0);
        return total.toLocaleString('mn-MN') + ' ₮';
      },
    },
    {
      title: '',
      width: 60,
      render: (_: unknown, row: OrderItemRow) => (
        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeRow(row.key)} />
      ),
    },
  ];

  const showOrderImageBesideLines = Boolean(orderImagePreviewUrl && !aiLoading);

  if (!draftIdFromUrl) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <PageHeader
          pathname={pathname}
          title="Шинэ захиалга"
          description="Эхлээд харилцагч сонгоод ноорог үүсгэнэ, дараа нь AI зураг эсвэл гараар бараа нэмнэ"
        />
        <Card title="1. Харилцагч — ноорог үүсгэх" style={{ marginBottom: 16 }}>
          <Form
            form={step1Form}
            layout="vertical"
            onFinish={createDraftOrder}
            initialValues={{
              order_date: dayjs(),
              delivery_date: dayjs().add(2, 'day'),
              is_urgent: false,
            }}
          >
            <Form.Item name="customer" label="Харилцагч" rules={[{ required: true, message: 'Сонгоно уу' }]} style={{ maxWidth: 400 }}>
              <Select
                placeholder="Харилцагч сонгох"
                showSearch
                optionFilterProp="label"
                options={customers.map((c) => ({ value: c.id, label: `${c.code} - ${c.name}` }))}
              />
            </Form.Item>
            <Space wrap size="large" style={{ width: '100%', marginBottom: 16 }}>
              <Form.Item name="order_date" label="Захиалгын огноо" rules={[{ required: true }]}>
                <DatePicker
                  style={{ width: '100%' }}
                  onChange={(d) => {
                    step1Form.setFieldsValue({
                      delivery_date: d ? d.add(2, 'day') : undefined,
                    });
                  }}
                />
              </Form.Item>
              <Form.Item
                name="delivery_date"
                label="Хүргэлтийн огноо"
                tooltip="Анхдагч: захиалгын огнооноос 2 өдрийн дараа."
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="driver" label="Жолооч">
                <Select
                  placeholder="Сонгох"
                  allowClear
                  options={drivers.map((d) => ({ value: d.id, label: d.name }))}
                  style={{ minWidth: 160 }}
                />
              </Form.Item>
            </Space>
            <Form.Item name="note" label="Тайлбар">
              <TextArea rows={2} placeholder="Тайлбар" />
            </Form.Item>
            <Form.Item name="is_urgent" label="Яаралтай" valuePropName="checked">
              <Switch checkedChildren="Тийм" unCheckedChildren="Үгүй" />
            </Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={saveLoading} style={{ background: 'var(--agume-primary)' }}>
                Үргэлжлүүлэх
              </Button>
              <Button onClick={() => router.back()}>Цуцлах</Button>
            </Space>
          </Form>
        </Card>
      </div>
    );
  }

  if (draftLoading) {
    return (
      <div style={{ maxWidth: 400, margin: '80px auto', textAlign: 'center' }}>
        <Spin size="large" tip="Ноорог ачаалж байна..." />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: showOrderImageBesideLines ? 1320 : 1000, margin: '0 auto' }}>
      <PageHeader
        pathname={pathname}
        title="Ноорог захиалга — бараа"
        description="AI зураг эсвэл гараар бүртгээд «Баталгаажуулах» дарна уу"
      />
      <Card title="2. Зураг / мөрүүд" style={{ marginBottom: 16 }}>
        <Space size="middle" style={{ marginBottom: 16 }}>
          <Button
            type={aiMode ? 'primary' : 'default'}
            icon={<RobotOutlined />}
            onClick={() => setAiMode(true)}
            style={aiMode ? { background: 'var(--agume-primary)' } : {}}
          >
            AI зургаар
          </Button>
          <Button
            type={!aiMode ? 'primary' : 'default'}
            icon={<EditOutlined />}
            onClick={() => setAiMode(false)}
            style={!aiMode ? { background: 'var(--agume-primary)' } : {}}
          >
            Гараар бүртгэх
          </Button>
        </Space>

        {aiMode && (
          <>
            {aiLoading ? (
              <div className="agume-order-ai-progress">
                <div className="agume-order-ai-progress-icon">
                  <LoadingOutlined style={{ fontSize: 40, color: 'var(--agume-primary)' }} />
                </div>
                <p className="agume-order-ai-progress-title">{AI_STEPS[aiStep]?.title ?? '...'}</p>
                <Steps
                  current={aiStep}
                  size="small"
                  className="agume-order-ai-steps"
                  items={AI_STEPS.map((s, i) => ({
                    title: s.title,
                    status: i < aiStep ? 'finish' : i === aiStep ? 'process' : 'wait',
                  }))}
                />
                <Progress
                  percent={aiStep < 3 ? undefined : 100}
                  status={aiStep < 3 ? 'active' : 'success'}
                  showInfo={aiStep === 3}
                  strokeColor="var(--agume-primary)"
                  className="agume-order-ai-progress-bar"
                />
              </div>
            ) : (
              <Dragger
                multiple={false}
                accept="image/*"
                fileList={fileList}
                beforeUpload={handleAiUpload}
                onChange={({ fileList: fl }) => setFileList(fl)}
                style={{ marginBottom: 16 }}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined style={{ fontSize: 48, color: 'var(--agume-primary)' }} />
                </p>
                <p className="ant-upload-text">Зураг чирж оруулна уу, сонгох эсвэл буферээс наана уу (Ctrl+V / ⌘V)</p>
                <p className="ant-upload-hint">Зураг оруулбал AI уншиж бараа таньна — энэ хуудсан дээр зөвхөн зураг наавал шууд уншина</p>
              </Dragger>
            )}
            {aiSuccess && !aiLoading && (
              <Alert
                type="success"
                message={aiSuccess}
                closable
                onClose={() => setAiSuccess('')}
                style={{ marginBottom: 16 }}
              />
            )}
            {aiError && (
              <Alert
                type="error"
                message={aiError}
                closable
                onClose={() => setAiError('')}
                style={{ marginBottom: 16 }}
              />
            )}
          </>
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            order_date: dayjs(),
            delivery_date: dayjs().add(2, 'day'),
          }}
        >
          <div style={{ marginBottom: 12, color: 'var(--ant-color-text-secondary, #666)' }}>
            Үүсгэсэн ажилтан: <strong>{createdByDisplay ?? '—'}</strong>
          </div>
          <Space wrap size="large" style={{ width: '100%', marginBottom: 16 }}>
            <Form.Item name="customer" label="Харилцагч" rules={[{ required: true, message: 'Сонгоно уу' }]} style={{ minWidth: 260 }}>
              <Select
                placeholder="Харилцагч сонгох"
                showSearch
                optionFilterProp="label"
                disabled
                options={customers.map((c) => ({ value: c.id, label: `${c.code} - ${c.name}` }))}
              />
            </Form.Item>
            <Form.Item name="order_date" label="Захиалгын огноо" rules={[{ required: true }]}>
              <DatePicker
                style={{ width: '100%' }}
                onChange={(d) => {
                  form.setFieldsValue({
                    delivery_date: d ? d.add(2, 'day') : undefined,
                  });
                }}
              />
            </Form.Item>
            <Form.Item
              name="delivery_date"
              label="Хүргэлтийн огноо"
              tooltip="Анхдагч: захиалгын огнооноос 2 өдрийн дараа. Өөрчилж болно."
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="driver" label="Жолооч">
              <Select
                placeholder="Сонгох"
                allowClear
                options={drivers.map((d) => ({ value: d.id, label: d.name }))}
                style={{ minWidth: 140 }}
              />
            </Form.Item>
          </Space>
          <Form.Item name="note" label="Тайлбар">
            <TextArea rows={2} placeholder="Тайлбар" />
          </Form.Item>
          <Form.Item name="is_urgent" label="Яаралтай" valuePropName="checked" initialValue={false}>
            <Switch checkedChildren="Тийм" unCheckedChildren="Үгүй" />
          </Form.Item>

          <div style={{ marginBottom: 8 }}>Захиалгын мөрүүд</div>
          <div
            className="agume-order-lines-compare"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 20,
              alignItems: 'flex-start',
              marginBottom: 16,
            }}
          >
            {showOrderImageBesideLines && orderImagePreviewUrl && (
              <div
                className="agume-order-lines-compare-image"
                style={{
                  flex: '0 1 340px',
                  maxWidth: '100%',
                  position: 'sticky',
                  top: 16,
                }}
              >
                <div style={{ marginBottom: 8, fontWeight: 600 }}>Оруулсан зураг</div>
                <div
                  style={{
                    borderRadius: 8,
                    border: '1px solid var(--ant-color-border-secondary, #f0f0f0)',
                    overflow: 'hidden',
                    background: 'var(--ant-color-fill-quaternary, #fafafa)',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={orderImagePreviewUrl}
                    alt="Захиалгын зураг — мөрүүдтэй харьцуулалт"
                    style={{
                      display: 'block',
                      width: '100%',
                      maxHeight: 'min(70vh, 640px)',
                      objectFit: 'contain',
                    }}
                  />
                </div>
                <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--ant-color-text-secondary, #666)' }}>
                  AI-ийн уншсан мөрүүдийг зурагтай зэрэгцүүлэн шалгана уу
                </p>
              </div>
            )}
            <div style={{ flex: '1 1 400px', minWidth: 0 }}>
              <Table
                dataSource={items}
                columns={itemColumns}
                pagination={false}
                scroll={{ x: 800 }}
                size="small"
              />
            </div>
          </div>
          <Button type="dashed" onClick={addRow} block icon={<PlusOutlined />} style={{ marginBottom: 16 }}>
            Бараа нэмэх
          </Button>
          <div style={{ marginBottom: 24, fontWeight: 600, fontSize: 16 }}>
            Нийт дүн: {totalAmount.toLocaleString()} ₮
          </div>

          <Space>
            <Button type="primary" htmlType="submit" loading={saveLoading} style={{ background: 'var(--agume-primary)' }}>
              Баталгаажуулах
            </Button>
            <Button onClick={() => router.push('/orders/new')}>Өөр харилцагч</Button>
            <Button onClick={() => router.back()}>Буцах</Button>
          </Space>
        </Form>
      </Card>
    </div>
  );
}
