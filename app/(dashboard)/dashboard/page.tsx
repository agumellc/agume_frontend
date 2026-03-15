'use client';

import { Card, Row, Col } from 'antd';
import {
  ShoppingCartOutlined,
  AppstoreOutlined,
  TeamOutlined,
  UserOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '../components/PageHeader';

const SHORTCUTS = [
  { title: 'Захиалга', description: 'Захиалгын жагсаалт, шинэ захиалга', icon: <ShoppingCartOutlined />, href: '/orders', color: '#25671E' },
  { title: 'Бараа материал', description: 'Барааны каталог, ангилал', icon: <AppstoreOutlined />, href: '/products', color: '#25671E' },
  { title: 'Харилцагч', description: 'Харилцагчийн бүртгэл', icon: <TeamOutlined />, href: '/customers', color: '#25671E' },
  { title: 'Ажилтан', description: 'Ажилтны бүртгэл', icon: <UserOutlined />, href: '/employees', color: '#25671E' },
  { title: 'Тайлан', description: 'Өдрийн тайлан, статистик', icon: <BarChartOutlined />, href: '/reports', color: '#25671E' },
];

export default function DashboardPage() {
  const pathname = usePathname();

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <PageHeader
        pathname={pathname}
        title="Хянах самбар"
        description="Системийн үндсэн цэс болон түр зам"
      />
      <Row gutter={[16, 16]}>
        {SHORTCUTS.map(({ title, description, icon, href, color }) => (
          <Col xs={24} sm={12} lg={8} key={href}>
            <Link href={href}>
              <Card
                hoverable
                style={{ height: '100%' }}
                styles={{
                  body: { display: 'flex', alignItems: 'flex-start', gap: 16 },
                }}
              >
                <span style={{ fontSize: 28, color }}>{icon}</span>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: 13, color: 'var(--agume-text-tertiary)' }}>{description}</div>
                </div>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
      <Card title="Түр зам" style={{ marginTop: 24 }}>
        <Row gutter={[12, 12]}>
          <Col>
            <Link href="/orders/new">
              <span style={{ color: 'var(--agume-primary)', fontWeight: 500 }}>+ Шинэ захиалга үүсгэх</span>
            </Link>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
