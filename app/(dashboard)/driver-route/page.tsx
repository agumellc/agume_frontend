'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Button,
  Card,
  DatePicker,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CameraOutlined, CheckOutlined, RollbackOutlined, WarningOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { usePathname } from 'next/navigation';
import PageHeader from '../components/PageHeader';
import { authApi, deliveryApi, type AuthUser, type DeliveryRouteStop } from '@/lib/api';

function SignatureCanvas({
  onDataUrl,
}: {
  onDataUrl: (url: string | null) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  const pos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const c = ref.current!;
    const r = c.getBoundingClientRect();
    const scaleX = c.width / r.width;
    const scaleY = c.height / r.height;
    if ('touches' in e && e.touches[0]) {
      const t = e.touches[0];
      return { x: (t.clientX - r.left) * scaleX, y: (t.clientY - r.top) * scaleY };
    }
    const me = e as React.MouseEvent<HTMLCanvasElement>;
    return { x: (me.clientX - r.left) * scaleX, y: (me.clientY - r.top) * scaleY };
  };

  const clear = () => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
    onDataUrl(null);
  };

  useEffect(() => {
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial clear only
  }, []);

  const start = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    drawing.current = true;
    last.current = pos(e);
  };

  const move = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    e.preventDefault();
    const c = ref.current!;
    const ctx = c.getContext('2d')!;
    const p = pos(e);
    const prev = last.current || p;
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    onDataUrl(c.toDataURL('image/png'));
  };

  const end = () => {
    drawing.current = false;
    last.current = null;
  };

  return (
    <div>
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
        Гарын үсэг (хулганаар зурах)
      </Typography.Text>
      <canvas
        ref={ref}
        width={400}
        height={160}
        style={{ border: '1px solid var(--agume-border, #d9d9d9)', borderRadius: 8, touchAction: 'none', maxWidth: '100%' }}
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <Button size="small" onClick={clear} style={{ marginTop: 8 }}>
        Цэвэрлэх
      </Button>
    </div>
  );
}

export default function DriverRoutePage() {
  const pathname = usePathname();
  const [date, setDate] = useState(dayjs());
  const [stops, setStops] = useState<DeliveryRouteStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<AuthUser | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activeStop, setActiveStop] = useState<DeliveryRouteStop | null>(null);
  const [sigUrl, setSigUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [returnOpen, setReturnOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [returnForm] = Form.useForm();
  const [issueForm] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await deliveryApi.myRoute(date.format('YYYY-MM-DD'));
      setStops(data.stops || []);
    } catch (e: unknown) {
      const st = (e as { response?: { status?: number; data?: { detail?: string } } })?.response?.status;
      const d = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      if (st === 403) message.warning(String(d || 'Зөвхөн жолоочийн эрхтэй'));
      else message.error('Маршрут ачааллахад алдаа');
      setStops([]);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    authApi.me().then(({ data }) => setMe(data));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isDriver = me?.employee?.role === 'driver';

  const itemCols: ColumnsType<DeliveryRouteStop['items'][0]> = [
    { title: 'Бараа', render: (_, r) => `${r.product_code} ${r.product_name}` },
    { title: 'Тоо', dataIndex: 'quantity', align: 'right', width: 90 },
    { title: 'Нэгж', dataIndex: 'unit', width: 70 },
    { title: 'Мөрийн дүн', dataIndex: 'line_total', align: 'right', width: 110 },
  ];

  const openConfirm = (s: DeliveryRouteStop) => {
    setActiveStop(s);
    setSigUrl(null);
    setPhotoFile(null);
    setConfirmOpen(true);
  };

  const submitConfirm = async () => {
    if (!activeStop) return;
    const photo = photoFile || undefined;
    if (!sigUrl && !photo) {
      message.error('Гарын үсэг эсвэл зураг сонгоно уу');
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      if (sigUrl) {
        const blob = await (await fetch(sigUrl)).blob();
        fd.append('signature', blob, 'signature.png');
      }
      if (photo) fd.append('photo', photo);
      const { data } = await deliveryApi.confirmDelivery(activeStop.id, fd);
      message.success(
        `Хүргэгдсэн. SMS: ${(data as { sms_sent?: boolean })?.sms_sent ? 'илгээгдсэн/лог' : 'алдаа'}`
      );
      setConfirmOpen(false);
      load();
    } catch (err: unknown) {
      const d = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      message.error(String(d || 'Алдаа'));
    } finally {
      setSubmitting(false);
    }
  };

  const submitReturn = async () => {
    if (!activeStop) return;
    try {
      const v = await returnForm.validateFields();
      await deliveryApi.returnGoods(activeStop.id, {
        product: v.product,
        quantity: v.quantity,
        note: v.note || '',
        adjust_stock: v.adjust_stock !== false,
      });
      message.success('Бүртгэгдлээ');
      setReturnOpen(false);
      load();
    } catch (err: unknown) {
      const d = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      if (d) message.error(String(d));
    }
  };

  const submitIssue = async () => {
    if (!activeStop) return;
    try {
      const v = await issueForm.validateFields();
      const fl = v.evidence as { originFileObj?: File }[] | undefined;
      const file = fl?.[0]?.originFileObj;
      if (file) {
        const fd = new FormData();
        fd.append('kind', v.kind);
        fd.append('message', v.message);
        if (v.product) fd.append('product', String(v.product));
        if (v.quantity != null) fd.append('quantity', String(v.quantity));
        fd.append('evidence', file);
        await deliveryApi.issue(activeStop.id, fd);
      } else {
        await deliveryApi.issue(activeStop.id, {
          kind: v.kind,
          message: v.message,
          product: v.product,
          quantity: v.quantity,
        });
      }
      message.success('Бүртгэгдлээ');
      setIssueOpen(false);
      load();
    } catch (err: unknown) {
      const d = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      if (d) message.error(String(d));
    }
  };

  return (
    <div>
      <PageHeader
        pathname={pathname}
        title="Жолоочийн маршрут"
        description="Өдрийн хүргэлтийг байршлаар эрэмбэлнэ. Гарын үсэг эсвэл зураг, буцаалт, гомдол."
      />

      {!isDriver && me && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Typography.Text type="warning">
            Анхааруулга: Энэ хуудас голчлон жолоочийн эрхтэй. Хэрэглэгчийн ажилтан &quot;жолооч&quot; үүрэгтэй эсвэл тестэнд удирдлагаар нэвтэрнэ үү.
          </Typography.Text>
        </Card>
      )}

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <span>Огноо:</span>
          <DatePicker value={date} onChange={(d) => d && setDate(d)} allowClear={false} />
          <Button onClick={load} loading={loading}>
            Шинэчлэх
          </Button>
        </Space>
      </Card>

      {stops.length === 0 && !loading ? (
        <Typography.Paragraph type="secondary">Энэ өдөр танд хүргэлтийн захиалга алга (статус: хүргэлтэнд гарсан).</Typography.Paragraph>
      ) : (
        stops.map((s) => (
          <Card
            key={s.id}
            style={{ marginBottom: 16 }}
            title={
              <Space wrap>
                <strong>{s.customer_name}</strong>
                <Tag>{s.order_number}</Tag>
                <span>{Number(s.total_amount).toLocaleString('mn-MN')} ₮</span>
                {s.customer_disputed_delivery && <Tag color="red">Маргаантай</Tag>}
              </Space>
            }
            extra={
              <Space wrap>
                <Button type="primary" icon={<CheckOutlined />} onClick={() => openConfirm(s)}>
                  Хүргэж дуусгах
                </Button>
                <Button
                  icon={<RollbackOutlined />}
                  onClick={() => {
                    setActiveStop(s);
                    returnForm.resetFields();
                    returnForm.setFieldsValue({ adjust_stock: true });
                    setReturnOpen(true);
                  }}
                >
                  Буцаалт
                </Button>
                <Button
                  icon={<WarningOutlined />}
                  onClick={() => {
                    setActiveStop(s);
                    issueForm.resetFields();
                    issueForm.setFieldsValue({ kind: 'complaint' });
                    setIssueOpen(true);
                  }}
                >
                  Гомдол
                </Button>
              </Space>
            }
          >
            <Descriptions size="small" column={1} bordered>
              <Descriptions.Item label="Утас">{s.customer_phone || '—'}</Descriptions.Item>
              <Descriptions.Item label="Хаяг">{s.customer_address || '—'}</Descriptions.Item>
              <Descriptions.Item label="Байршил (lat,lng)">
                {s.latitude && s.longitude ? `${s.latitude}, ${s.longitude}` : '— (тохиргоонд оруулбал маршрут сайжирна)'}
              </Descriptions.Item>
            </Descriptions>
            <Table
              size="small"
              style={{ marginTop: 12 }}
              rowKey={(_, idx) => `${s.id}-row-${idx}`}
              columns={itemCols}
              dataSource={s.items}
              pagination={false}
            />
          </Card>
        ))
      )}

      <Modal
        title={`Хүргэлт баталгаажуулах — ${activeStop?.order_number ?? ''}`}
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        okText="Илгээх"
        confirmLoading={submitting}
        onOk={submitConfirm}
        width={520}
        destroyOnClose
      >
        <SignatureCanvas onDataUrl={setSigUrl} />
        <div style={{ marginTop: 16 }}>
          <Typography.Text type="secondary">Нэмэлт зураг (сонголттой)</Typography.Text>
          <Upload
            maxCount={1}
            beforeUpload={(file) => {
              setPhotoFile(file);
              return false;
            }}
            onRemove={() => {
              setPhotoFile(null);
              return true;
            }}
          >
            <Button icon={<CameraOutlined />}>Зураг сонгох</Button>
          </Upload>
        </div>
        <Typography.Paragraph type="secondary" style={{ marginTop: 12, fontSize: 12 }}>
          Хадгалахад захиалга «Хүргэгдсэн» болж, харилцагчид SMS илгээнэ (SMS_GATEWAY_URL тохируулбал).
        </Typography.Paragraph>
      </Modal>

      <Modal title="Буцаасан бараа" open={returnOpen} onCancel={() => setReturnOpen(false)} onOk={submitReturn} okText="Бүртгэх">
        <Form form={returnForm} layout="vertical">
          <Form.Item name="product" label="Бараа" rules={[{ required: true }]}>
            <Select
              options={(activeStop?.items || []).map((it) => ({
                value: it.product_id,
                label: `${it.product_code} — ${it.product_name}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="quantity" label="Тоо" rules={[{ required: true }]}>
            <InputNumber min={0.0001} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="note" label="Тэмдэглэл">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="adjust_stock" label="Үлдэгдэл" valuePropName="checked" initialValue>
            <Switch checkedChildren="Хасах" unCheckedChildren="Зөвхөн бүртгэл" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Гомдол / маргаан" open={issueOpen} onCancel={() => setIssueOpen(false)} onOk={submitIssue} okText="Илгээх" width={480}>
        <Form form={issueForm} layout="vertical">
          <Form.Item name="kind" label="Төрөл" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'complaint', label: 'Гомдол' },
                { value: 'dispute_no_receive', label: 'Хүлээн аваагүй (маргаан)' },
                { value: 'other', label: 'Бусад' },
              ]}
            />
          </Form.Item>
          <Form.Item name="message" label="Тайлбар" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="product" label="Бараа (сонголттой)">
            <Select
              allowClear
              options={(activeStop?.items || []).map((it) => ({
                value: it.product_id,
                label: `${it.product_code} — ${it.product_name}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="quantity" label="Тоо (сонголттой)">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="evidence"
            label="Нотлох зураг"
            valuePropName="fileList"
            getValueFromEvent={(e) => e?.fileList ?? []}
          >
            <Upload maxCount={1} beforeUpload={() => false} listType="picture">
              <Button>Файл</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
