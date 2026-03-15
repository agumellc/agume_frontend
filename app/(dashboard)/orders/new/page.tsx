'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Card,
  Form,
  Select,
  DatePicker,
  Input,
  InputNumber,
  Button,
  Table,
  Alert,
  Upload,
  message,
  Space,
  Progress,
  Steps,
} from 'antd';
import type { UploadFile } from 'antd';
import { InboxOutlined, RobotOutlined, EditOutlined, DeleteOutlined, PlusOutlined, LoadingOutlined } from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
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

export default function NewOrderPage() {
  const router = useRouter();
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
  const stepTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    productsApi.list({ is_active: 'true' }).then(({ data }) => setProducts(data.results || data));
    customersApi.list({ is_active: 'true' }).then(({ data }) => setCustomers(data.results || data));
    employeesApi.list().then(({ data }) => setEmployees(data.results || data));
  }, []);

  const operators = employees.filter((e) => e.role === 'operator');
  const drivers = employees.filter((e) => e.role === 'driver');

  const clearStepTimers = () => {
    stepTimersRef.current.forEach((t) => clearTimeout(t));
    stepTimersRef.current = [];
  };

  useEffect(() => {
    return () => clearStepTimers();
  }, []);

  const handleAiUpload = async (file: File) => {
    setAiError('');
    setAiSuccess('');
    setAiLoading(true);
    setAiStep(0);
    clearStepTimers();

    // Алхам 1: бэлтгэж байна (0 → 1)
    const t1 = setTimeout(() => setAiStep(1), 300);
    const t2 = setTimeout(() => setAiStep(2), 900);
    stepTimersRef.current = [t1, t2];

    const formData = new FormData();
    formData.append('image', file);

    try {
      const { data } = await ordersApi.createFromImage(formData);
      clearStepTimers();
      setAiStep(3);

      if (data.success && data.items?.length) {
        const rows: OrderItemRow[] = data.items.map((item: Record<string, unknown>, i: number) => ({
          key: `ai-${i}-${Date.now()}`,
          product: item.product as number,
          product_name: item.product_name as string,
          product_code: item.product_code as string,
          product_unit: item.product_unit as string,
          quantity: item.quantity as number,
          unit_price: item.unit_price as number,
          note: (item.note as string) || '',
        }));
        setItems((prev) => [...prev, ...rows]);
        form.setFieldValue('note', data.note || form.getFieldValue('note'));
        setAiSuccess(data.message || `${data.items?.length ?? 0} бараа амжилттай таньлаа`);
        // "Бэлэн" алхамыг богино хугацаанд харуулсан дараа dragger руу буцаах
        await new Promise((r) => setTimeout(r, 600));
      } else {
        setAiError('Зургаас бараа олдсонгүй. Гараар нэмнэ үү.');
      }
    } catch (err: unknown) {
      clearStepTimers();
      const axErr = err as { response?: { data?: { error?: string } } };
      setAiError(axErr?.response?.data?.error || 'AI уншихад алдаа гарлаа');
    } finally {
      setAiLoading(false);
      setFileList([]);
      setAiStep(0);
    }
    return false; // prevent auto upload
  };

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
          const prod = products.find((p) => p.id === value);
          if (prod) {
            next.product_name = prod.name;
            next.product_code = prod.code;
            next.product_unit = prod.unit;
            next.unit_price = Number(prod.price);
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

  const onFinish = async (values: Record<string, unknown>) => {
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
      const payload = {
        customer: customerId,
        order_date: values.order_date ? dayjs(values.order_date as string).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        delivery_date: values.delivery_date
          ? dayjs(values.delivery_date as string).format('YYYY-MM-DD')
          : null,
        operator: values.operator || null,
        driver: values.driver || null,
        note: values.note || '',
        created_by_ai: aiMode,
        items: items
          .filter((r) => r.product && Number(r.quantity) > 0)
          .map((r) => ({
            product: r.product,
            quantity: r.quantity,
            unit_price: r.unit_price,
            note: r.note || '',
          })),
      };
      const { data } = await ordersApi.create(payload);
      message.success('Захиалга хадгалагдлаа');
      router.push(`/orders/${data.id}`);
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
      render: (val: number, row: OrderItemRow) => {
        const productOptions = products.map((p) => ({ value: p.id, label: `${p.code} - ${p.name}` }));
        const hasApiLabel = row.product_code != null && row.product_name != null && row.product;
        const apiLabel = hasApiLabel ? `${row.product_code} - ${row.product_name}` : null;
        const options = apiLabel
          ? (() => {
              const existing = productOptions.find((o) => o.value === row.product);
              if (existing) return productOptions.map((o) => (o.value === row.product ? { ...o, label: apiLabel } : o));
              return [{ value: row.product, label: apiLabel }, ...productOptions];
            })()
          : productOptions;
        return (
          <Select
            placeholder="Бараа сонгох"
            showSearch
            optionFilterProp="label"
            style={{ width: '100%' }}
            value={val}
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
      align: 'right',
      render: (_: unknown, row: OrderItemRow) => {
        const total = (Number(row.quantity) || 0) * (Number(row.unit_price) || 0);
        return total.toLocaleString('mn-MN') + ' ₮';
      },
    },
    {
      title: '',
      width: 60,
      render: (_: unknown, row: OrderItemRow) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeRow(row.key)}
        />
      ),
    },
  ];

  const pathname = usePathname();

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <PageHeader
        pathname={pathname}
        title="Шинэ захиалга"
        description="Зураг оруулбал AI бараа таньна, эсвэл гараар бүртгэнэ"
      />
      <Card title="Захиалга үүсгэх" style={{ marginBottom: 16 }}>
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
                <p className="ant-upload-text">Зураг чирж оруулна уу эсвэл товч дарж сонгоно уу</p>
                <p className="ant-upload-hint">Захиалгын зургийг оруулбал AI уншиж бараа таньна</p>
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
            delivery_date: dayjs(),
          }}
        >
          <Space wrap size="large" style={{ width: '100%', marginBottom: 16 }}>
            <Form.Item name="customer" label="Харилцагч" rules={[{ required: true, message: 'Сонгоно уу' }]} style={{ minWidth: 260 }}>
              <Select
                placeholder="Харилцагч сонгох"
                showSearch
                optionFilterProp="label"
                options={customers.map((c) => ({ value: c.id, label: `${c.code} - ${c.name}` }))}
              />
            </Form.Item>
            <Form.Item name="order_date" label="Захиалгын огноо" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="delivery_date" label="Хүргэлтийн огноо">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="operator" label="Оператор">
              <Select
                placeholder="Сонгох"
                allowClear
                options={operators.map((o) => ({ value: o.id, label: o.name }))}
                style={{ minWidth: 140 }}
              />
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

          <div style={{ marginBottom: 8 }}>Захиалгын мөрүүд</div>
          <Table
            dataSource={items}
            columns={itemColumns}
            pagination={false}
            scroll={{ x: 800 }}
            size="small"
            style={{ marginBottom: 16 }}
          />
          <Button type="dashed" onClick={addRow} block icon={<PlusOutlined />} style={{ marginBottom: 16 }}>
            Бараа нэмэх
          </Button>
          <div style={{ marginBottom: 24, fontWeight: 600, fontSize: 16 }}>
            Нийт дүн: {totalAmount.toLocaleString()} ₮
          </div>

          <Space>
            <Button type="primary" htmlType="submit" loading={saveLoading} style={{ background: 'var(--agume-primary)' }}>
              Хадгалах
            </Button>
            <Button onClick={() => router.back()}>Цуцлах</Button>
          </Space>
        </Form>
      </Card>
    </div>
  );
}
