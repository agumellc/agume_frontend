# AGUME Dashboard — Nexus-style refactor checklist

Reference: цагаан/саарал SaaS dashboard (sidebar + topbar + main content).

---

## 1. App shell ✅
- [x] Бүтэн layout-ийн дэвсгэр: `var(--gray-50)` (#F9FAFB)
- [x] Left sidebar + right main area, flex layout
- [x] Main content scrollable, sidebar fixed

## 2. Sidebar ✅
- [x] Дэвсгэр: цагаан (`white`), бүтэн өндөр
- [x] Баруун хүрээ: `1px solid var(--gray-200)`
- [x] Logo + collapse icon дээр
- [x] Section label: жижиг, UPPERCASE, `var(--gray-400)` (ҮНДСЭН ЦЭС)
- [x] Nav item: default `gray-600`, icon + text
- [x] Active item: `gray-100` дэвсгэр, `gray-900` текст (ногоон биш)
- [x] Footer: хэрэглэгч, Log холбоосууд

## 3. Header (Top bar) ✅
- [x] Дэвсгэр: цагаан, доод хүрээ `1px solid var(--gray-200)`
- [x] Зүүн: collapse товч + хайлтын талбар (rounded, саарал дэвсгэр)
- [x] Баруун: theme toggle + хэрэглэгчийн нэр + avatar (dropdown)
- [x] Өндөр: `var(--header-height)` (56px)

## 4. Main content ✅
- [x] Дэвсгэр: `var(--gray-50)`
- [x] Padding: `var(--space-6) var(--space-8)`
- [x] Scroll: контент урт бол scroll

## 5. Breadcrumb ✅
- [x] Контентын дээд талд, fixed биш (`position: static`)
- [x] Жижиг font (13px), `var(--gray-400)` / `var(--gray-500)`
- [x] Одоогийн хуудас: `gray-800`, font-weight 500

## 6. Cards / Tables ✅
- [x] Card-ууд: цагаан, `var(--radius-lg)`, `var(--shadow-xs)`, `var(--gray-200)` border
- [x] Table: `.table-wrapper` — цагаан, rounded, shadow

---

**Файлууд:** `app/(dashboard)/layout.tsx`, `app/globals.css`, `app/(dashboard)/products/page.tsx`
