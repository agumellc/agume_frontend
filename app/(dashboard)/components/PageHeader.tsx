'use client';

import { Breadcrumb } from 'antd';
import Link from 'next/link';
import { getBreadcrumbForPath } from '@/lib/breadcrumb';

export interface PageHeaderProps {
  /** Breadcrumb items — өгөхгүй бол pathname-аар автоматаар тодорхойлно */
  items?: { title: string; href?: string }[];
  /** Одоогийн pathname (items өгөхгүй үед ашиглана) */
  pathname?: string;
  /** Хуудасны гарчиг */
  title?: string;
  /** Тайлбар (жижиг саарал текст) */
  description?: string;
  /** Баруун талд харуулах (жишээ нь action товч) */
  extra?: React.ReactNode;
}

export default function PageHeader({ items, pathname, title, description, extra }: PageHeaderProps) {
  const breadcrumbItems = items ?? (pathname ? getBreadcrumbForPath(pathname) : []);

  return (
    <header className={`agume-page-header${extra ? ' agume-page-header-with-extra' : ''}`}>
      <div className="agume-page-header-left">
        <Breadcrumb
          className="agume-breadcrumb"
          items={breadcrumbItems.map((item) => ({
            title: item.href ? <Link href={item.href}>{item.title}</Link> : item.title,
          }))}
        />
        {title && <h1 className="agume-page-title">{title}</h1>}
        {description && <p className="agume-page-description">{description}</p>}
      </div>
      {extra && <div className="agume-page-header-extra">{extra}</div>}
    </header>
  );
}
