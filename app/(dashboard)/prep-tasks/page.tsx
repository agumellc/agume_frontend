'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Checkbox,
  DatePicker,
  Form,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { PlusOutlined, TeamOutlined, CheckCircleOutlined, BuildOutlined } from '@ant-design/icons';
import Link from 'next/link';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { usePathname } from 'next/navigation';
import PageHeader from '../components/PageHeader';
import { usePrepDateQuery } from '../hooks/usePrepDateQuery';
import { authApi, employeesApi, preparationApi } from '@/lib/api';

const METHOD_LABELS: Record<string, string> = {
  wash: 'Угаах',
  chop: 'Хэрчих',
  pack: 'Савлах',
  other: 'Бусад',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'orange',
  in_progress: 'blue',
  done: 'green',
};

type TaskRow = Record<string, unknown>;

/** Тоо хэмжээг харуулахад API-ийн урт бутархайг товчлох (хамгийн ихдээ 4 орон) */
function formatQuantityPlain(q: unknown): string {
  if (q == null || q === '') return '';
  const n = typeof q === 'number' ? q : Number(String(q).trim().replace(',', '.'));
  if (!Number.isFinite(n)) return String(q);
  let s = n.toFixed(4).replace(/\.?0+$/, '');
  if (s === '' || s === '-') s = '0';
  return s;
}

function formatTaskQty(t: TaskRow): string {
  const q = t.quantity_planned;
  const u = (t.product_unit as string) || '';
  if (q == null || q === '') return u || '—';
  const num = formatQuantityPlain(q);
  return u ? `${num} ${u}` : num;
}

function PrepTasksInner() {
  const pathname = usePathname();
  const { date, setDate, dateStr } = usePrepDateQuery();
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<{ id: number; name: string }[]>([]);
  const [participantModal, setParticipantModal] = useState<TaskRow | null>(null);
  const [completeModal, setCompleteModal] = useState<TaskRow | null>(null);
  const [form] = Form.useForm();
  const [completeForm] = Form.useForm();
  const [authEmployeeId, setAuthEmployeeId] = useState<number | null>(null);
  const [reminders, setReminders] = useState<{
    overdue_tasks: TaskRow[];
    today_open_tasks: TaskRow[];
    complaints: Record<string, unknown>[];
  } | null>(null);
  const [bonusEmp, setBonusEmp] = useState<number | undefined>();
  const [bonusPreview, setBonusPreview] = useState<Record<string, unknown> | null>(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await preparationApi.tasks.list({ work_date: dateStr });
      const body = data as { results?: TaskRow[] };
      setTasks(body.results ?? (Array.isArray(data) ? data : []));
    } catch {
      message.error('Даалгавар ачааллахад алдаа');
    } finally {
      setLoading(false);
    }
  }, [dateStr]);

  const loadReminders = useCallback(async () => {
    try {
      const { data } = await preparationApi.myReminders();
      setReminders({
        overdue_tasks: (data as { overdue_tasks?: TaskRow[] }).overdue_tasks || [],
        today_open_tasks: (data as { today_open_tasks?: TaskRow[] }).today_open_tasks || [],
        complaints: (data as { complaints?: Record<string, unknown>[] }).complaints || [],
      });
      const emp = (data as { employee?: { id: number } | null }).employee;
      if (emp?.id) setBonusEmp(emp.id);
    } catch {
      setReminders(null);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    authApi.me().then(({ data }) => {
      if (data.employee?.id) setAuthEmployeeId(data.employee.id);
    });
    employeesApi.list({ is_active: 'true' }).then(({ data }) => {
      const list = (data as { results?: { id: number; name: string }[] }).results ?? data;
      setEmployees(Array.isArray(list) ? list.map((e) => ({ id: e.id, name: e.name })) : []);
    });
    loadReminders();
  }, [loadReminders]);

  const openParticipants = (row: TaskRow) => {
    setParticipantModal(row);
    const parts = (row.participants as { employee: number; share_percent: string }[]) || [];
    form.setFieldsValue({
      rows: parts.length
        ? parts.map((p) => ({ employee_id: p.employee, share_percent: Number(p.share_percent) }))
        : [{ employee_id: undefined, share_percent: 1 }],
    });
  };

  const submitParticipants = async () => {
    const id = participantModal?.id as number;
    if (!id) return;
    try {
      const v = await form.validateFields();
      const participants = (v.rows as { employee_id: number; share_percent: number }[]).map((r) => ({
        employee_id: r.employee_id,
        share_percent: r.share_percent,
      }));
      await preparationApi.tasks.setParticipants(id, participants);
      message.success('Оролцогч хадгалагдлаа');
      setParticipantModal(null);
      loadTasks();
    } catch (e: unknown) {
      const d = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      if (d) message.error(String(d));
    }
  };

  const openComplete = (row: TaskRow) => {
    setCompleteModal(row);
    const parts = (row.participants as { employee: number; share_percent: string }[]) || [];
    if (parts.length) {
      completeForm.setFieldsValue({
        useExisting: true,
        rows: parts.map((p) => ({ employee_id: p.employee, share_percent: Number(p.share_percent) })),
      });
    } else {
      completeForm.setFieldsValue({
        useExisting: false,
        rows: authEmployeeId
          ? [{ employee_id: authEmployeeId, share_percent: 100 }]
          : [{ employee_id: undefined, share_percent: 100 }],
      });
    }
  };

  const submitComplete = async () => {
    const id = completeModal?.id as number;
    if (!id) return;
    try {
      const useExisting = completeForm.getFieldValue('useExisting');
      if (useExisting) {
        await preparationApi.tasks.markComplete(id);
      } else {
        const v = await completeForm.validateFields(['rows']);
        const participants = v.rows as { employee_id: number; share_percent: number }[];
        await preparationApi.tasks.markComplete(id, participants);
      }
      message.success('Дууссан гэж бүртгэгдлээ');
      setCompleteModal(null);
      loadTasks();
      loadReminders();
    } catch (e: unknown) {
      const d = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      if (d) message.error(String(d));
    }
  };

  const loadBonus = async () => {
    if (!bonusEmp) {
      message.warning('Ажилтан сонгоно уу');
      return;
    }
    try {
      const { data } = await preparationApi.bonusPreview({
        employee: bonusEmp,
        year: dayjs().year(),
        month: dayjs().month() + 1,
      });
      setBonusPreview(data as Record<string, unknown>);
    } catch {
      message.error('Бонус тооцоолохад алдаа');
    }
  };

  const columns: ColumnsType<TaskRow> = [
    {
      title: 'Бараа',
      key: 'p',
      render: (_, r) => (
        <div>
          <strong>{String(r.product_name ?? '')}</strong>
          <div style={{ color: 'var(--agume-text-secondary)', fontSize: 12 }}>{String(r.product_code ?? '')}</div>
        </div>
      ),
    },
    {
      title: 'Арга',
      dataIndex: 'preparation_method',
      width: 100,
      render: (m: string) => METHOD_LABELS[m] || m,
    },
    {
      title: 'Тоо хэмжээ',
      key: 'qty_unit',
      width: 140,
      align: 'right',
      render: (_, r) => (
        <Typography.Text strong style={{ fontSize: 15 }}>
          {formatTaskQty(r)}
        </Typography.Text>
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      width: 120,
      render: (s: string, r) => (
        <Space direction="vertical" size={0}>
          <Tag color={STATUS_COLORS[s] || 'default'}>{String(r.status_display ?? s)}</Tag>
          {Boolean(r.is_overdue) && <Tag color="red">Хоцорсон</Tag>}
        </Space>
      ),
    },
    {
      title: 'Оролцогчид',
      key: 'parts',
      render: (_, r) => {
        const parts = (r.participants as { employee_name: string; share_percent: string }[]) || [];
        if (!parts.length) return <Typography.Text type="secondary">—</Typography.Text>;
        const wsum = parts.reduce((s, p) => s + Number(p.share_percent), 0);
        if (!(wsum > 0)) return parts.map((p) => p.employee_name).join(', ');
        return parts
          .map((p) => {
            const pct = (Number(p.share_percent) / wsum) * 100;
            const pctStr = Number.isFinite(pct) ? pct.toFixed(pct >= 10 ? 0 : 1) : '?';
            return `${p.employee_name} (~${pctStr}%)`;
          })
          .join(', ');
      },
    },
    {
      title: '',
      key: 'act',
      width: 220,
      render: (_, r) => (
        <Space wrap>
          {r.status !== 'done' && (
            <>
              <Button size="small" icon={<TeamOutlined />} onClick={() => openParticipants(r)}>
                Хувь хуваарилах
              </Button>
              <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => openComplete(r)}>
                Дууслаа
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        pathname={pathname}
        title="Өдрийн даалгавар"
        description="Үйлдвэрийн нэгтгэлтэй ижил өдөр (?date=). Энд барааны тоо хэмжээ нэгжээр харагдана. Синк нь нэгтгэлээс тухайн өдрийн тоог авна."
        extra={
          <Space wrap>
            <Link href={`/factory?date=${encodeURIComponent(dateStr)}`}>
              <Button icon={<BuildOutlined />}>Үйлдвэрийн нэгтгэл</Button>
            </Link>
            <Button
              type="primary"
              onClick={() => {
                preparationApi.tasks
                  .syncFromOrders({ date: dateStr, refresh_quantities: true })
                  .then(() => {
                    message.success('Синк дууслаа — нэгтгэлтэй ижил өдөр');
                    loadTasks();
                  })
                  .catch(() => message.error('Синк алдаа'));
              }}
            >
              Өдрөөс синк
            </Button>
          </Space>
        }
      />

      {reminders && (reminders.overdue_tasks.length > 0 || reminders.today_open_tasks.length > 0) && (
        <Card size="small" title="Сануулга" style={{ marginBottom: 16 }}>
          {reminders.overdue_tasks.length > 0 && (
            <Typography.Paragraph type="danger">
              Хоцорсон даалгавар:{' '}
              {reminders.overdue_tasks.map((t) => `${t.product_name as string} (${formatTaskQty(t)})`).join('; ')}
            </Typography.Paragraph>
          )}
          {reminders.today_open_tasks.length > 0 && (
            <Typography.Paragraph>
              Өнөөдрийн нээлттэй:{' '}
              {reminders.today_open_tasks.map((t) => `${t.product_name as string} (${formatTaskQty(t)})`).join('; ')}
            </Typography.Paragraph>
          )}
        </Card>
      )}

      {reminders && reminders.complaints.length > 0 && (
        <Card size="small" title="Танд ирсэн гомдол" style={{ marginBottom: 16 }}>
          {reminders.complaints.map((c) => (
            <div key={String(c.id)} style={{ marginBottom: 8 }}>
              <Typography.Text strong>{String(c.product_name)}</Typography.Text> — {String(c.message)}
            </div>
          ))}
        </Card>
      )}

      <Card size="small" title="Сарын бонусын тооцоо (үзүүлэх)" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="Ажилтан"
            style={{ width: 220 }}
            value={bonusEmp}
            onChange={(v) => setBonusEmp(v)}
            options={employees.map((e) => ({ value: e.id, label: e.name }))}
            allowClear
          />
          <Button onClick={loadBonus}>Тооцоолох</Button>
        </Space>
        {bonusPreview && (
          <Typography.Paragraph style={{ marginTop: 12 }}>
            <strong>Нийт бонус (гомдлын хасалттай):</strong> {String(bonusPreview.total_bonus)} ₮
          </Typography.Paragraph>
        )}
      </Card>

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <span>Огноо:</span>
          <DatePicker value={date} onChange={(d) => d && setDate(d)} allowClear={false} />
        </Space>
        <Table<TaskRow>
          rowKey="id"
          columns={columns}
          dataSource={tasks}
          loading={loading}
          pagination={false}
          locale={{
            emptyText: `Даалгавар алга (${dateStr}) — «Үйлдвэрийн нэгтгэл»-ээс синк эсвэл захиалга шалгана уу`,
          }}
        />
      </Card>

      <Modal
        title="Оролцогчид — хуваарилалтын жин"
        open={!!participantModal}
        onOk={submitParticipants}
        onCancel={() => setParticipantModal(null)}
        width={520}
        destroyOnClose
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
          Нэг ажилтанд зөвхөн жин оруулна (жишээ 5, 10). Бонусын сан тэдгээр жингийн харьцаагаар хуваагдана;
          нийлбэр 100 байх шаардлагагүй. Хоёр хүн тэнцүү авах бол хоёуланд ижил тоо (жишээ 1, 1).
        </Typography.Paragraph>
        <Form form={form} layout="vertical">
          <Form.List name="rows">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...field}
                      name={[field.name, 'employee_id']}
                      rules={[{ required: true, message: 'Сонгоно уу' }]}
                    >
                      <Select
                        placeholder="Ажилтан"
                        style={{ width: 200 }}
                        options={employees.map((e) => ({ value: e.id, label: e.name }))}
                      />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'share_percent']}
                      rules={[{ required: true, message: 'Жин оруулна уу' }]}
                    >
                      <InputNumber min={0.01} max={999.99} step={0.01} placeholder="Жин" />
                    </Form.Item>
                    <Button type="text" danger onClick={() => remove(field.name)}>
      Хасах
                    </Button>
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  Мөр нэмэх
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      <Modal
        title="Дууслаа"
        open={!!completeModal}
        onOk={submitComplete}
        onCancel={() => setCompleteModal(null)}
        width={520}
        destroyOnClose
      >
        <Typography.Paragraph type="secondary">
          Оролцогч тохируулагдсан бол «Одоогийн хувиар» сонгоно. Өөрчлөх бол доорх мөрөөр засна. Жин нь
          харьцангуй: нийлбэр 100 байх шаардлагагүй.
        </Typography.Paragraph>
        <Form form={completeForm} layout="vertical">
          <Form.Item name="useExisting" valuePropName="checked" style={{ marginBottom: 12 }}>
            <Checkbox>Одоогийн оролцогчийн хувиар дуусгах</Checkbox>
          </Form.Item>
          <Form.Item noStyle dependencies={['useExisting']}>
            {({ getFieldValue }) =>
              getFieldValue('useExisting') ? null : (
                <Form.List name="rows">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...field}
                      name={[field.name, 'employee_id']}
                      rules={[{ required: true }]}
                    >
                      <Select
                        style={{ width: 200 }}
                        options={employees.map((e) => ({ value: e.id, label: e.name }))}
                      />
                    </Form.Item>
                    <Form.Item {...field} name={[field.name, 'share_percent']} rules={[{ required: true }]}>
                      <InputNumber min={0.01} max={999.99} step={0.01} placeholder="Жин" />
                    </Form.Item>
                    <Button type="text" danger onClick={() => remove(field.name)}>
                      Хасах
                    </Button>
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  Мөр нэмэх
                </Button>
              </>
            )}
          </Form.List>
              )
            }
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default function PrepTasksPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Ачаалж байна…</div>}>
      <PrepTasksInner />
    </Suspense>
  );
}
