'use client';

import { getBreadcrumbForPath } from '@/lib/breadcrumb';

export interface PageHeaderProps {
  /** Breadcrumb items — өгөхгүй бол pathname-аар автоматаар тодорхойлно (зөвхөн сүүлчийн title ашиглагдана) */
  items?: { title: string; href?: string }[];
  /** Одоогийн pathname (items өгөхгүй үед ашиглана) */
  pathname?: string;
  /** Хуудасны гарчиг — өгөхгүй бол breadcrumb-ийн сүүлчийн зүйлээс авна */
  title?: string;
  /** Тайлбар (жижиг саарал текст) */
  description?: string;
  /** Баруун талд харуулах (жишээ нь action товч) */
  extra?: React.ReactNode;
}

export default function PageHeader({ items, pathname, title, description, extra }: PageHeaderProps) {
  const breadcrumbItems = items ?? (pathname ? getBreadcrumbForPath(pathname) : []);
  const pageTitle = title ?? breadcrumbItems[breadcrumbItems.length - 1]?.title ?? '';

  return (
    <header className={`agume-page-header${extra ? ' agume-page-header-with-extra' : ''}`}>
      <div className="agume-page-header-left">
        {pageTitle ? <h1 className="agume-page-title">{pageTitle}</h1> : null}
        {description && <p className="agume-page-description">{description}</p>}
      </div>
      {extra && <div className="agume-page-header-extra">{extra}</div>}
    </header>
  );
}
