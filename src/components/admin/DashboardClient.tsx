'use client';

import { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';

type ActivityItem = {
  id: string;
  type: 'signup' | 'generation' | 'ai_tool' | 'download';
  text: string;
  subtext: string;
  time: string;
};

type AlertItem = { id: string; type: 'warning' | 'danger' | 'info'; text: string };

interface DashboardData {
  totalUsers: number;
  todaySignups: number;
  monthSignups: number;
  lastMonthSignups: number;
  activeSubscriptions: number;
  estimatedRevenue: number;
  tierBreakdown: { FREE: number; STARTER: number; STANDARD: number; PROFESSIONAL: number; UNLIMITED: number };
  todayGenerations: number;
  monthGenerations: number;
  todayAiToolUses: number;
  monthAiToolUses: number;
  totalEmailCaptures: number;
  todayEmailCaptures: number;
  monthEmailCaptures: number;
  todayDownloads: number;
  monthDownloads: number;
  todayFreeTemplateDownloads: number;
  monthFreeTemplateDownloads: number;
  totalFreeTemplateDownloads: number;
  signupChartData: { date: string; label: string; count: number }[];
  allActivity: ActivityItem[];
  ramsActivity: ActivityItem[];
  alerts: AlertItem[];
}

interface Props {
  data: DashboardData;
}

export function DashboardClient({ data }: Props) {
  const [activityTab, setActivityTab] = useState<'all' | 'rams'>('all');
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const chartRef = useRef<HTMLCanvasElement>(null);

  const visibleAlerts = data.alerts.filter((a) => !dismissedAlerts.includes(a.id));
  const starterCount = (data.tierBreakdown.STARTER || 0) + (data.tierBreakdown.STANDARD || 0);
  const totalTier = data.tierBreakdown.FREE + starterCount + data.tierBreakdown.PROFESSIONAL + (data.tierBreakdown.UNLIMITED || 0);

  // ── Signup Chart ──
  useEffect(() => {
    if (!chartRef.current || data.signupChartData.length === 0) return;

    const canvas = chartRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 20, right: 16, bottom: 40, left: 40 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const values = data.signupChartData.map((d) => d.count);
    const maxVal = Math.max(...values, 1);

    ctx.clearRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Y-axis labels
      ctx.fillStyle = '#94A3B8';
      ctx.font = '11px -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(String(Math.round(maxVal - (maxVal / 4) * i)), padding.left - 8, y + 4);
    }

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, 'rgba(27, 91, 80, 0.15)');
    gradient.addColorStop(1, 'rgba(27, 91, 80, 0)');

    const points = data.signupChartData.map((d, i) => ({
      x: padding.left + (chartW / (data.signupChartData.length - 1)) * i,
      y: padding.top + chartH - (d.count / maxVal) * chartH,
    }));

    // Fill area
    ctx.beginPath();
    ctx.moveTo(points[0].x, height - padding.bottom);
    points.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.strokeStyle = '#1B5B50';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();

    // Dots on line
    points.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#1B5B50';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // X-axis labels (every 5th)
    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    data.signupChartData.forEach((d, i) => {
      if (i % 5 === 0 || i === data.signupChartData.length - 1) {
        ctx.fillText(d.label, points[i].x, height - padding.bottom + 18);
      }
    });
  }, [data.signupChartData]);

  const activityDotClass = (type: string) => {
    switch (type) {
      case 'signup': return 'admin-activity__dot--signup';
      case 'generation': return 'admin-activity__dot--generation';
      case 'download': return 'admin-activity__dot--download';
      case 'ai_tool': return 'admin-activity__dot--purchase';
      default: return 'admin-activity__dot--signup';
    }
  };

  const alertIcon = (type: string) => {
    switch (type) {
      case 'danger': return '🔴';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  };

  return (
    <div>
      {/* ── Alerts ── */}
      {visibleAlerts.length > 0 && (
        <div className="admin-alerts">
          {visibleAlerts.map((alert) => (
            <div key={alert.id} className={`admin-alert admin-alert--${alert.type}`}>
              <span className="admin-alert__icon">{alertIcon(alert.type)}</span>
              <span className="admin-alert__text">{alert.text}</span>
              <button
                className="admin-alert__dismiss"
                onClick={() => setDismissedAlerts([...dismissedAlerts, alert.id])}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Today + This Month Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Today */}
        <div className="admin-card">
          <div className="admin-card__header">
            <h3 className="admin-card__title">Today</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
          <div className="admin-card__body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <StatMini label="Signups" value={data.todaySignups} icon="👤" />
              <StatMini label="RAMS Gens" value={data.todayGenerations} icon="⚙️" />
              <StatMini label="AI Tool Uses" value={data.todayAiToolUses} icon="🤖" />
              <StatMini label="Downloads" value={data.todayDownloads} icon="📥" />
              <StatMini label="Free Templates" value={data.todayFreeTemplateDownloads} icon="📄" />
              <StatMini label="Registered Emails" value={data.todayEmailCaptures} icon="📧" />
            </div>
          </div>
        </div>

        {/* This Month */}
        <div className="admin-card">
          <div className="admin-card__header">
            <h3 className="admin-card__title">This Month</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
              {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div className="admin-card__body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <StatMini label="Signups" value={data.monthSignups} icon="👤"
                change={data.lastMonthSignups > 0
                  ? Math.round(((data.monthSignups - data.lastMonthSignups) / data.lastMonthSignups) * 100)
                  : undefined}
              />
              <StatMini label="RAMS Gens" value={data.monthGenerations} icon="⚙️" />
              <StatMini label="AI Tool Uses" value={data.monthAiToolUses} icon="🤖" />
              <StatMini label="Downloads" value={data.monthDownloads} icon="📥" />
              <StatMini label="Free Templates" value={data.monthFreeTemplateDownloads} icon="📄" />
              <StatMini label="Registered Emails" value={data.monthEmailCaptures} icon="📧" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Stat Cards ── */}
      <div className="admin-stats">
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon admin-stat-card__icon--green">👥</div>
          <div className="admin-stat-card__body">
            <div className="admin-stat-card__label">Total Users</div>
            <div className="admin-stat-card__value">{data.totalUsers.toLocaleString()}</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon admin-stat-card__icon--gold">⭐</div>
          <div className="admin-stat-card__body">
            <div className="admin-stat-card__label">Active Subs</div>
            <div className="admin-stat-card__value">{data.activeSubscriptions.toLocaleString()}</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon admin-stat-card__icon--blue">💰</div>
          <div className="admin-stat-card__body">
            <div className="admin-stat-card__label">Est. Monthly Revenue</div>
            <div className="admin-stat-card__value">
              £{data.estimatedRevenue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon admin-stat-card__icon--orange">📧</div>
          <div className="admin-stat-card__body">
            <div className="admin-stat-card__label">Registered Emails</div>
            <div className="admin-stat-card__value">{data.totalEmailCaptures.toLocaleString()}</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon admin-stat-card__icon--green">📄</div>
          <div className="admin-stat-card__body">
            <div className="admin-stat-card__label">Free Template Downloads</div>
            <div className="admin-stat-card__value">{data.totalFreeTemplateDownloads.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* ── Charts + Tier Breakdown ── */}
      <div className="admin-grid-2">
        {/* Signup Chart */}
        <div className="admin-card">
          <div className="admin-card__header">
            <h3 className="admin-card__title">Signups — Last 30 Days</h3>
          </div>
          <div className="admin-card__body">
            <div className="admin-chart">
              <canvas ref={chartRef} style={{ width: '100%', height: '100%' }} />
            </div>
          </div>
        </div>

        {/* Subscription Breakdown */}
        <div className="admin-card">
          <div className="admin-card__header">
            <h3 className="admin-card__title">Subscription Breakdown</h3>
          </div>
          <div className="admin-card__body">
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--admin-text)', letterSpacing: '-0.03em' }}>
                {data.activeSubscriptions}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--admin-text-muted)' }}>active subscriptions</div>
            </div>

            {totalTier > 0 && (
              <>
                <div className="admin-tier-bar">
                  <div
                    className="admin-tier-bar__segment admin-tier-bar__segment--free"
                    style={{ width: `${(data.tierBreakdown.FREE / totalTier) * 100}%` }}
                  />
                  <div
                    className="admin-tier-bar__segment admin-tier-bar__segment--standard"
                    style={{ width: `${(starterCount / totalTier) * 100}%` }}
                  />
                  <div
                    className="admin-tier-bar__segment admin-tier-bar__segment--professional"
                    style={{ width: `${(data.tierBreakdown.PROFESSIONAL / totalTier) * 100}%` }}
                  />
                  <div
                    className="admin-tier-bar__segment"
                    style={{ width: `${((data.tierBreakdown.UNLIMITED || 0) / totalTier) * 100}%`, background: 'var(--admin-gold, #D4A44C)' }}
                  />
                </div>

                <div className="admin-tier-legend">
                  <div className="admin-tier-legend__item">
                    <div className="admin-tier-legend__dot" style={{ background: 'var(--admin-text-muted)' }} />
                    <span className="admin-tier-legend__count">{data.tierBreakdown.FREE}</span>
                    <span className="admin-tier-legend__label">Free</span>
                  </div>
                  <div className="admin-tier-legend__item">
                    <div className="admin-tier-legend__dot" style={{ background: 'var(--admin-info)' }} />
                    <span className="admin-tier-legend__count">{starterCount}</span>
                    <span className="admin-tier-legend__label">Starter</span>
                  </div>
                  <div className="admin-tier-legend__item">
                    <div className="admin-tier-legend__dot" style={{ background: 'var(--admin-gold)' }} />
                    <span className="admin-tier-legend__count">{data.tierBreakdown.PROFESSIONAL}</span>
                    <span className="admin-tier-legend__label">Professional</span>
                  </div>
                  <div className="admin-tier-legend__item">
                    <div className="admin-tier-legend__dot" style={{ background: '#8B5CF6' }} />
                    <span className="admin-tier-legend__count">{data.tierBreakdown.UNLIMITED || 0}</span>
                    <span className="admin-tier-legend__label">Unlimited</span>
                  </div>
                </div>
              </>
            )}

            {totalTier === 0 && (
              <div className="admin-empty">
                <div className="admin-empty__icon">📊</div>
                <p className="admin-empty__text">No active subscriptions yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Activity Feed ── */}
      <div className="admin-card">
        <div className="admin-tabs">
          <button
            className={`admin-tab ${activityTab === 'all' ? 'admin-tab--active' : ''}`}
            onClick={() => setActivityTab('all')}
          >
            All Activity
          </button>
          <button
            className={`admin-tab ${activityTab === 'rams' ? 'admin-tab--active' : ''}`}
            onClick={() => setActivityTab('rams')}
          >
            RAMS Generations
          </button>
        </div>

        <div className="admin-card__body">
          <div className="admin-activity">
            {(activityTab === 'all' ? data.allActivity : data.ramsActivity).length === 0 ? (
              <div className="admin-empty">
                <div className="admin-empty__icon">📭</div>
                <p className="admin-empty__text">No activity yet</p>
              </div>
            ) : (
              (activityTab === 'all' ? data.allActivity : data.ramsActivity).map((item) => (
                <div key={item.id} className="admin-activity__item">
                  <div className={`admin-activity__dot ${activityDotClass(item.type)}`} />
                  <div className="admin-activity__text">
                    <strong>{item.text}</strong>
                    {item.subtext && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: '2px' }}>
                        {item.subtext}
                      </div>
                    )}
                  </div>
                  <div className="admin-activity__time">
                    {formatDistanceToNow(new Date(item.time), { addSuffix: true })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Mini Stat Component ── */
function StatMini({
  label,
  value,
  icon,
  change,
}: {
  label: string;
  value: number;
  icon: string;
  change?: number;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '8px',
        background: 'var(--admin-green-50)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.6875rem', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
          {label}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem' }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--admin-text)', lineHeight: 1 }}>
            {value.toLocaleString()}
          </span>
          {change !== undefined && change !== 0 && (
            <span style={{
              fontSize: '0.6875rem', fontWeight: 700,
              color: change > 0 ? 'var(--admin-success)' : 'var(--admin-danger)',
            }}>
              {change > 0 ? '↑' : '↓'}{Math.abs(change)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
