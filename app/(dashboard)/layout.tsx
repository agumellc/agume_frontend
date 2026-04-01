'use client';

import { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Input, Tooltip } from 'antd';
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
  TeamOutlined,
  UserOutlined,
  BarChartOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  SearchOutlined,
  ApartmentOutlined,
  MoonOutlined,
  SunOutlined,
  BuildOutlined,
  CheckSquareOutlined,
  InboxOutlined,
  CarOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import dayjs from 'dayjs';
import 'dayjs/locale/mn';
import { useTheme } from '@/app/ThemeProvider';
import { ToastProvider } from './components/ToastContext';
import { authApi, type AuthUser } from '@/lib/api';

dayjs.locale('mn');

const { Sider, Header, Content } = Layout;

const MAIN_NAV_ITEMS: { key: string; icon: React.ReactNode; label: string; href: string }[] = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Хянах самбар', href: '/dashboard' },
  { key: '/orders', icon: <ShoppingCartOutlined />, label: 'Захиалга', href: '/orders' },
  { key: '/factory', icon: <BuildOutlined />, label: 'Үйлдвэр (нэгтгэл)', href: '/factory' },
  { key: '/prep-tasks', icon: <CheckSquareOutlined />, label: 'Даалгавар', href: '/prep-tasks' },
  { key: '/inventory', icon: <InboxOutlined />, label: 'Нөөц', href: '/inventory' },
  { key: '/driver-route', icon: <CarOutlined />, label: 'Жолоочийн маршрут', href: '/driver-route' },
  { key: '/products', icon: <AppstoreOutlined />, label: 'Бараа материал', href: '/products' },
  { key: '/customers', icon: <TeamOutlined />, label: 'Харилцагч', href: '/customers' },
  { key: '/employees', icon: <UserOutlined />, label: 'Ажилтан', href: '/employees' },
  { key: '/reports', icon: <BarChartOutlined />, label: 'Тайлан', href: '/reports' },
  { key: '/settings', icon: <SettingOutlined />, label: 'Тохиргоо', href: '/settings' },
];

function getDisplayName(user: AuthUser | null): string {
  if (!user) return 'Нэвтэрсэн хэрэглэгч';
  const full = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  return full || user.username || 'Нэвтэрсэн хэрэглэгч';
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem('access_token')) {
      router.push('/login');
      return;
    }
    authApi.me()
      .then(({ data }) => setAuthUser(data))
      .catch((err) => {
        // Fallback: show username from localStorage if /api/auth/me/ fails (e.g. CORS, 404)
        const username = localStorage.getItem('user_username');
        if (username) {
          setAuthUser({
            id: 0,
            username,
            first_name: '',
            last_name: '',
          });
        }
        if (process.env.NODE_ENV === 'development') {
          console.warn('auth/me failed:', err?.response?.status, err?.message);
        }
      });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_username');
    setAuthUser(null);
    router.push('/login');
  };

  const siderWidth = collapsed ? 80 : 248;

  const path = pathname || '';
  const prepDateQs = `?date=${encodeURIComponent(dayjs().format('YYYY-MM-DD'))}`;
  const mainNavLinks = MAIN_NAV_ITEMS.map((item) =>
    item.key === '/factory' || item.key === '/prep-tasks'
      ? { ...item, href: `${item.key}${prepDateQs}` }
      : item
  );
  const selectedKey = (() => {
    const keys = MAIN_NAV_ITEMS.map((i) => i.key);
    const matched = keys.filter((key) => path === key || path.startsWith(key + '/'));
    const longest = matched.sort((a, b) => b.length - a.length)[0];
    return longest ?? path;
  })();
  const displayName = getDisplayName(authUser);
  const sidebarUsername = displayName;

  return (
    <ToastProvider>
      <Layout className="agume-dashboard-layout" style={{ minHeight: '100vh' }}>
        <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={248}
        collapsedWidth={80}
        className="agume-sidebar agume-sidebar-fixed agume-sidebar-light"
        style={{
          background: 'var(--agume-sidebar-bg)',
          overflow: 'hidden',
          position: 'fixed',
          left: 0,
          top: 0,
          height: '100vh',
          zIndex: 100,
        }}
      >
        <div className="agume-sidebar-logo">
          <Link href="/orders" className="agume-sidebar-logo-link">
            {collapsed ? (
              <Tooltip title="AGUME" placement="right">
                <span className="agume-sidebar-logo-icon">
                  <ApartmentOutlined />
                </span>
              </Tooltip>
            ) : (
              <>
                <span className="agume-sidebar-logo-icon">
                  <ApartmentOutlined />
                </span>
                <span className="agume-sidebar-logo-text">AGUME</span>
              </>
            )}
          </Link>
          {!collapsed && (
            <div className="agume-sidebar-date">
              {dayjs().format('YYYY-MM-DD')} · {dayjs().format('dddd')}
            </div>
          )}
        </div>
        {!collapsed && (
          <div className="agume-sidebar-section-label">
            <span>Үндсэн цэс</span>
          </div>
        )}
        <Menu
          theme="dark"
          mode="inline"
          inlineCollapsed={collapsed}
          selectedKeys={[selectedKey]}
          items={mainNavLinks.map(({ key, icon, label, href }) => ({
            key,
            icon,
            label: <Link href={href}>{label}</Link>,
          }))}
          className="agume-sidebar-menu agume-sidebar-menu-main"
          style={{
            background: 'transparent',
            borderRight: 0,
            padding: collapsed ? '12px 8px 8px' : '12px 12px 8px',
          }}
        />
        <div className="agume-sidebar-footer">
          {!collapsed && (
            <>
              <div className="agume-sidebar-footer-user">
                <Avatar size="small" style={{ background: 'var(--green-600)' }} icon={<UserOutlined />} />
                <span className="agume-sidebar-footer-username">{sidebarUsername || 'Нэвтэрсэн хэрэглэгч'}</span>
              </div>
              <div className="agume-sidebar-footer-log">
                <span className="agume-sidebar-footer-log-label">Log</span>
                <div className="agume-sidebar-footer-log-links">
                  <Link href="/log/activity" className={path.startsWith('/log/activity') ? 'agume-sidebar-footer-link active' : 'agume-sidebar-footer-link'}>
                    Үйлдэлийн түүх
                  </Link>
                  <Link href="/log/login" className={path.startsWith('/log/login') ? 'agume-sidebar-footer-link active' : 'agume-sidebar-footer-link'}>
                    Нэвтрэлтийн түүх
                  </Link>
                </div>
              </div>
            </>
          )}
          {collapsed && (
            <Tooltip title={sidebarUsername || 'Нэвтэрсэн'} placement="right">
              <div className="agume-sidebar-footer-user-collapsed">
                <Avatar size="small" style={{ background: 'var(--green-600)' }} icon={<UserOutlined />} />
              </div>
            </Tooltip>
          )}
        </div>
      </Sider>
      <Layout
        className="agume-main-wrap"
        style={{
          background: 'var(--agume-content-bg)',
          marginLeft: siderWidth,
          minHeight: '100vh',
          transition: 'margin-left 0.2s ease',
        }}
      >
        <Header className="agume-header">
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="agume-header-trigger agume-header-trigger--collapse"
            aria-label={collapsed ? 'Цэсийг нээх' : 'Цэсийг хаах'}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>
          <div className="agume-header-search-wrap">
            <Input
              placeholder="Хайх..."
              prefix={<SearchOutlined className="agume-header-search-icon" />}
              className="agume-header-search"
              allowClear
              bordered={false}
            />
            <span className="agume-header-search-shortcut">⌘K</span>
          </div>
          <div className="agume-header-right">
            <Tooltip title={isDark ? 'Гэрэл горим' : 'Харанхуй горим'}>
              <button
                type="button"
                onClick={toggleTheme}
                className="agume-header-icon-btn"
                aria-label={isDark ? 'Гэрэл горим' : 'Харанхуй горим'}
              >
                {isDark ? <SunOutlined /> : <MoonOutlined />}
              </button>
            </Tooltip>
            <div className="agume-header-divider-v" aria-hidden />
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'logout',
                    icon: <LogoutOutlined />,
                    label: 'Гарах',
                    onClick: handleLogout,
                  },
                ],
              }}
              trigger={['click']}
              placement="bottomRight"
            >
              <button type="button" className="agume-header-user-wrap">
                <span className="agume-header-user-avatar">
                  <Avatar size="small" style={{ background: 'var(--green-600)', color: 'white' }} icon={<UserOutlined />} />
                </span>
                <span className="agume-header-user-info">
                  <span className="agume-header-user-name">{displayName}</span>
                  {authUser?.username && (
                    <span className="agume-header-user-sub">{authUser.username}</span>
                  )}
                </span>
              </button>
            </Dropdown>
          </div>
        </Header>
        <Content className="agume-content">
            {children}
          </Content>
        </Layout>
      </Layout>
    </ToastProvider>
  );
}
