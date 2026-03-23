/**
 * Нэг стандарт breadcrumb — хуудас бүрт ашиглана.
 * pathname-аас эхний тохирох config-ийг буцаана (дэлгэрэнгүй хуудасны path сүүлчийн элментээр таарна).
 */

export interface BreadcrumbItem {
  title: string;
  href?: string;
}

/** Path pattern (regex эсвэл яг таарсан) -> breadcrumb. Эхний тохирлыг ашиглана. */
const BREADCRUMB_CONFIG: { pattern: RegExp | string; items: BreadcrumbItem[] }[] = [
  { pattern: /^\/dashboard\/?$/, items: [{ title: 'Нүүр', href: '/dashboard' }, { title: 'Хянах самбар' }] },
  { pattern: /^\/orders\/new\/?$/, items: [{ title: 'Нүүр', href: '/dashboard' }, { title: 'Захиалга', href: '/orders' }, { title: 'Шинэ захиалга' }] },
  { pattern: /^\/orders\/[^/]+\/?$/, items: [{ title: 'Нүүр', href: '/dashboard' }, { title: 'Захиалга', href: '/orders' }, { title: 'Дэлгэрэнгүй' }] },
  { pattern: /^\/orders\/?$/, items: [{ title: 'Нүүр', href: '/dashboard' }, { title: 'Захиалга' }] },
  { pattern: /^\/products\/[^/]+\/?$/, items: [{ title: 'Нүүр', href: '/dashboard' }, { title: 'Бараа материал', href: '/products' }, { title: 'Дэлгэрэнгүй' }] },
  { pattern: /^\/products\/?$/, items: [{ title: 'Нүүр', href: '/dashboard' }, { title: 'Бараа материал' }] },
  { pattern: /^\/customers\/?$/, items: [{ title: 'Нүүр', href: '/dashboard' }, { title: 'Харилцагч' }] },
  { pattern: /^\/employees\/[^/]+\/?$/, items: [{ title: 'Нүүр', href: '/dashboard' }, { title: 'Ажилтан', href: '/employees' }, { title: 'Дэлгэрэнгүй' }] },
  { pattern: /^\/employees\/?$/, items: [{ title: 'Нүүр', href: '/dashboard' }, { title: 'Ажилтан' }] },
  { pattern: /^\/reports\/?$/, items: [{ title: 'Нүүр', href: '/dashboard' }, { title: 'Тайлан' }] },
  { pattern: /^\/reports\/products\/?$/, items: [{ title: 'Нүүр', href: '/dashboard' }, { title: 'Тайлан', href: '/reports' }, { title: 'Барааны тайлан' }] },
  { pattern: /^\/settings\/?$/, items: [{ title: 'Нүүр', href: '/dashboard' }, { title: 'Тохиргоо' }] },
  { pattern: /^\/log\/activity\/?$/, items: [{ title: 'Нүүр', href: '/dashboard' }, { title: 'Log', href: '/log/activity' }, { title: 'Үйлдэлийн түүх' }] },
  { pattern: /^\/log\/login\/?$/, items: [{ title: 'Нүүр', href: '/dashboard' }, { title: 'Log', href: '/log/activity' }, { title: 'Нэвтрэлтийн түүх' }] },
];

function matchPattern(pattern: RegExp | string, pathname: string): boolean {
  if (typeof pattern === 'string') return pathname === pattern || pathname === pattern + '/';
  return pattern.test(pathname);
}

export function getBreadcrumbForPath(pathname: string): BreadcrumbItem[] {
  const normalized = pathname?.replace(/\/$/, '') || '';
  for (const { pattern, items } of BREADCRUMB_CONFIG) {
    if (matchPattern(pattern, normalized)) return [...items];
  }
  return [{ title: 'Нүүр', href: '/dashboard' }];
}
