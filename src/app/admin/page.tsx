import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-utils';
import { formatDistanceToNow } from 'date-fns';

export default async function AdminDashboard() {
  await requireAdmin();

  // Fetch dashboard stats
  const [totalUsers, subscriptions, thisMonthGenerations] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
    }),
    prisma.generation.findMany({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      select: { id: true, estimatedDurationSeconds: true, createdAt: true },
    }),
  ]);

  // Calculate stats
  const activeSubscriptions = subscriptions.length;
  const subscriptionsByTier = {
    FREE: subscriptions.filter((s) => s.tier === 'FREE').length,
    STANDARD: subscriptions.filter((s) => s.tier === 'STANDARD').length,
    PREMIUM: subscriptions.filter((s) => s.tier === 'PREMIUM').length,
  };

  const totalGenerations = thisMonthGenerations.length;
  const estimatedRevenue =
    subscriptions.reduce((sum, sub) => {
      const prices: Record<string, number> = {
        FREE: 0,
        STANDARD: 9.99,
        PREMIUM: 29.99,
      };
      return sum + (prices[sub.tier] || 0);
    }, 0) * 30; // Rough monthly estimate

  // Fetch recent generations
  const recentGenerations = await prisma.generation.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, email: true } },
      format: { select: { name: true } },
    },
  });

  return (
    <div className="admin-dashboard">
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="admin-stat-card" style={{ borderLeft: `4px solid #1B5B50` }}>
          <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>Total Users</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1B5B50' }}>
            {totalUsers.toLocaleString()}
          </div>
        </div>

        <div className="admin-stat-card" style={{ borderLeft: `4px solid #D4A44C` }}>
          <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>Active Subscriptions</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#D4A44C' }}>
            {activeSubscriptions.toLocaleString()}
          </div>
        </div>

        <div className="admin-stat-card" style={{ borderLeft: `4px solid #1B5B50` }}>
          <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>Generations (This Month)</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1B5B50' }}>
            {totalGenerations.toLocaleString()}
          </div>
        </div>

        <div className="admin-stat-card" style={{ borderLeft: `4px solid #D4A44C` }}>
          <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>Est. Monthly Revenue</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#D4A44C' }}>
            ${estimatedRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {/* Subscription Breakdown */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div style={{ padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '0.5rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>Free Tier</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1B5B50' }}>
            {subscriptionsByTier.FREE}
          </div>
        </div>
        <div style={{ padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '0.5rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>Standard Tier</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1B5B50' }}>
            {subscriptionsByTier.STANDARD}
          </div>
        </div>
        <div style={{ padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '0.5rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>Premium Tier</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1B5B50' }}>
            {subscriptionsByTier.PREMIUM}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 style={{ margin: '0 0 1rem 0', color: '#1B5B50', fontSize: '1.25rem' }}>Recent Activity</h2>
        <div className="admin-activity">
          {recentGenerations.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
              No generations yet
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: '#1B5B50', fontWeight: 'bold' }}>
                    User
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: '#1B5B50', fontWeight: 'bold' }}>
                    Format
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: '#1B5B50', fontWeight: 'bold' }}>
                    Status
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: '#1B5B50', fontWeight: 'bold' }}>
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentGenerations.map((gen) => (
                  <tr key={gen.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ fontSize: '0.875rem' }}>{gen.user?.name || 'Unknown'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#999' }}>{gen.user?.email}</div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>{gen.format?.name}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          backgroundColor:
                            gen.status === 'COMPLETED' ? '#d4edda' : '#fff3cd',
                          color: gen.status === 'COMPLETED' ? '#155724' : '#856404',
                        }}
                      >
                        {gen.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#999', fontSize: '0.875rem' }}>
                      {formatDistanceToNow(new Date(gen.createdAt), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
