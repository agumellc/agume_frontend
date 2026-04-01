'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Button, Card, DatePicker, Space, Table, Tag, Typography, List, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SyncOutlined, SoundOutlined, BellOutlined, CheckSquareOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import PageHeader from '../components/PageHeader';
import { usePrepDateQuery } from '../hooks/usePrepDateQuery';
import { preparationApi, type DailyAggregateLine } from '@/lib/api';

const { Text, Title } = Typography;

function playUrgentBeep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = 920;
    o.type = 'sine';
    g.gain.setValueAtTime(0.12, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    o.start(ctx.currentTime);
    o.stop(ctx.currentTime + 0.25);
    setTimeout(() => ctx.close(), 400);
  } catch {
    /* ignore */
  }
}

function FactoryBoardInner() {
  const pathname = usePathname();
  const { date, setDate, dateStr } = usePrepDateQuery();
  const [lines, setLines] = useState<DailyAggregateLine[]>([]);
  const [urgentOrders, setUrgentOrders] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const lastUrgentRef = useRef<number | null>(null);
  const [alerts, setAlerts] = useState<{ id: number; task_summary: string; created_at: string }[]>([]);
  const [soundOn, setSoundOn] = useState(true);

  const loadAggregate = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await preparationApi.dailyAggregate(dateStr);
      setLines(data.lines || []);
      setUrgentOrders(data.urgent_open_orders ?? 0);
    } catch {
      message.error('Нэгтгэл ачааллахад алдаа');
    } finally {
      setLoading(false);
    }
  }, [dateStr]);

  const loadAlerts = useCallback(async () => {
    try {
      const { data } = await preparationApi.managerAlerts();
      setAlerts(data.results || []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadAggregate();
  }, [loadAggregate]);

  useEffect(() => {
    const t = setInterval(() => loadAggregate(), 45000);
    return () => clearInterval(t);
  }, [loadAggregate]);

  useEffect(() => {
    loadAlerts();
    const t = setInterval(loadAlerts, 60000);
    return () => clearInterval(t);
  }, [loadAlerts]);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const { data } = await preparationApi.urgentPoll(dateStr);
        const n = data.urgent_open_orders ?? 0;
        if (cancelled) return;
        if (lastUrgentRef.current !== null && n > lastUrgentRef.current && soundOn) {
          playUrgentBeep();
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification('AGUME — Яаралтай захиалга', {
              body: `Нээлттэй яаралтай: ${n}`,
            });
          } else if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
            Notification.requestPermission();
          }
          message.warning(`Яаралтай захиалга: ${n} (нээлттэй)`);
        }
        lastUrgentRef.current = n;
      } catch {
        /* ignore */
      }
    };
    poll();
    const iv = setInterval(poll, 12000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [dateStr, soundOn, message]);

  const onSyncTasks = async () => {
    setSyncing(true);
    try {
      const { data } = await preparationApi.tasks.syncFromOrders({
        date: dateStr,
        preparation_method: 'pack',
        refresh_quantities: true,
      });
      message.success(
        `Даалгавар: шинэ ${data.created}, тоо шинэчлэгдсөн ${data.updated_quantities ?? 0}. «Өдрийн даалгавар» хуудас ижил өдрөөр шинэчлэгдэнэ.`
      );
    } catch (e: unknown) {
      const d = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      message.error(String(d || 'Синк хийхэд алдаа'));
    } finally {
      setSyncing(false);
    }
  };

  const columns: ColumnsType<DailyAggregateLine> = [
    {
      title: 'Бараа',
      key: 'name',
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 16 }}>
            {r.product_name}
          </Text>
          <Text type="secondary">
            {r.product_code} · {r.unit}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Нийт тоо',
      dataIndex: 'total_quantity',
      width: 140,
      align: 'right',
      render: (v, r) => (
        <Space>
          {r.has_urgent && <Tag color="red">Яаралтай</Tag>}
          <Text strong style={{ fontSize: 18 }}>
            {v} {r.unit}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Савлагаар задлах',
      key: 'bd',
      render: (_, r) => (
        <div style={{ fontSize: 15, lineHeight: 1.6 }}>
          {(r.package_breakdown || []).map((b, i) => (
            <div key={i}>{b.label}</div>
          ))}
        </div>
      ),
    },
    {
      title: 'Бонус %',
      dataIndex: 'preparation_bonus_percent',
      width: 90,
      align: 'right',
      render: (v: string) => `${v}%`,
    },
  ];

  return (
    <div className="agume-factory-page">
      <PageHeader
        pathname={pathname}
        title="Үйлдвэр — өдрийн нэгтгэл"
        description="Нэгтгэл ба «Өдрийн даалгавар» ижил ?date= өдрөөр холбогдоно. Синк хийснээр даалгаврын тоо тухайн өдөрт шинэчлэгдэнэ."
        extra={
          <Space wrap>
            <Link href={`/prep-tasks?date=${encodeURIComponent(dateStr)}`}>
              <Button type="default" icon={<CheckSquareOutlined />}>
                Өдрийн даалгавар
              </Button>
            </Link>
            <Button
              type={soundOn ? 'primary' : 'default'}
              icon={<SoundOutlined />}
              onClick={() => setSoundOn(!soundOn)}
            >
              Дохио {soundOn ? 'идэвхтэй' : 'унтраалттай'}
            </Button>
            <Button icon={<BellOutlined />} onClick={() => Notification.requestPermission()}>
              Мэдэгдэл зөвшөөрөх
            </Button>
            <Button type="primary" icon={<SyncOutlined spin={syncing} />} loading={syncing} onClick={onSyncTasks}>
              Даалгавар синк
            </Button>
          </Space>
        }
      />

      <Card style={{ marginBottom: 16 }} className="no-print">
        <Space wrap align="center">
          <span>Огноо:</span>
          <DatePicker value={date} onChange={(d) => d && setDate(d)} allowClear={false} />
          <Tag color={urgentOrders > 0 ? 'red' : 'default'} style={{ fontSize: 14, padding: '4px 10px' }}>
            Яаралтай нээлттэй захиалга: {urgentOrders}
          </Tag>
          <Button onClick={() => loadAggregate()} loading={loading}>
            Шинэчлэх
          </Button>
        </Space>
      </Card>

      {alerts.length > 0 && (
        <Card title="Удирдлагад: дууссан даалгавар" size="small" style={{ marginBottom: 16 }}>
          <List
            size="small"
            dataSource={alerts}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button
                    type="link"
                    key="ack"
                    onClick={async () => {
                      try {
                        await preparationApi.ackAlert(item.id);
                        setAlerts((prev) => prev.filter((a) => a.id !== item.id));
                      } catch {
                        message.error('Алдаа');
                      }
                    }}
                  >
                    Уншсан
                  </Button>,
                ]}
              >
                <Text>{item.task_summary}</Text>
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  {item.created_at}
                </Text>
              </List.Item>
            )}
          />
        </Card>
      )}

      <Card styles={{ body: { padding: '16px 20px' } }}>
        <Title level={4} style={{ marginTop: 0 }}>
          {dateStr} — бэлтгэх нийлбэр
        </Title>
        <Table<DailyAggregateLine>
          rowKey="product_id"
          columns={columns}
          dataSource={lines}
          loading={loading}
          pagination={false}
          size="middle"
          locale={{ emptyText: 'Энэ өдөр бэлтгэх мөр алга (эсвэл захиалга байхгүй)' }}
        />
      </Card>
    </div>
  );
}

export default function FactoryBoardPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Ачаалж байна…</div>}>
      <FactoryBoardInner />
    </Suspense>
  );
}
