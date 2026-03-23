'use client';

export interface KPICardData {
  label: string;
  value: string | number;
  sub?: string;
  trend?: { value: string; direction: 'up' | 'down' | 'neutral' };
  accent?: 'green' | 'amber' | 'red' | 'gray';
}

export interface KPICardsProps {
  cards: KPICardData[];
}

function Trend({ trend }: { trend: { value: string; direction: 'up' | 'down' | 'neutral' } }) {
  const className =
    trend.direction === 'up'
      ? 'kpi-card__trend--up'
      : trend.direction === 'down'
        ? 'kpi-card__trend--down'
        : '';
  return <span className={className}>{trend.value}</span>;
}

export function KPICards({ cards }: KPICardsProps) {
  return (
    <div className="kpi-grid">
      {cards.map((card, i) => (
        <div key={i} className="kpi-card">
          <div className="kpi-card__label">{card.label}</div>
          <div className="kpi-card__value">{card.value}</div>
          {card.sub && <div className="kpi-card__sub">{card.sub}</div>}
          {card.trend && <Trend trend={card.trend} />}
        </div>
      ))}
    </div>
  );
}
