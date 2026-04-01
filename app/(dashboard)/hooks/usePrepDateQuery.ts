'use client';

import { useCallback, useEffect, useMemo } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

function validYmd(raw: string | null): boolean {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return false;
  return dayjs(raw).isValid();
}

/**
 * Factory болон prep-tasks хооронд ижил өдрийг ?date=YYYY-MM-DD-аар холбоно.
 */
export function usePrepDateQuery() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const date = useMemo(() => {
    const raw = searchParams.get('date');
    if (validYmd(raw)) return dayjs(raw as string);
    return dayjs();
  }, [searchParams]);

  useEffect(() => {
    const raw = searchParams.get('date');
    if (!validYmd(raw)) {
      const q = new URLSearchParams(searchParams.toString());
      q.set('date', dayjs().format('YYYY-MM-DD'));
      router.replace(`${pathname}?${q.toString()}`, { scroll: false });
    }
  }, [pathname, router, searchParams]);

  const setDate = useCallback(
    (d: Dayjs) => {
      const q = new URLSearchParams(searchParams.toString());
      q.set('date', d.format('YYYY-MM-DD'));
      router.replace(`${pathname}?${q.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  return { date, setDate, dateStr: date.format('YYYY-MM-DD') };
}
