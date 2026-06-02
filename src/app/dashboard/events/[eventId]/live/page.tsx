'use client';
import Sidebar from '@/components/Sidebar';
import EventLoader from '@/components/EventLoader';
import { useApp } from '@/context/AppContext';
import { motion } from 'framer-motion';
import { use, useMemo, useState } from 'react';
import { Radio, Circle, CheckCircle2, Clock, ChefHat, Truck } from 'lucide-react';

const statusLabels: Record<string, { label: string; color: string }> = {
  pending:   { label: 'En attente', color: '#DC8C28' },
  preparing: { label: 'En préparation', color: '#FB923C' },
  ready:     { label: 'Prêt', color: '#5B8DB8' },
  served:    { label: 'Servi', color: '#22964F' },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.45 } })
};

export default function LivePage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const { events, tables, orders, updateOrder, eventsLoading } = useApp();
  const event = events.find(e => e.id === eventId);
  const eventTables = useMemo(() => tables.filter(t => t.eventId === eventId), [tables, eventId]);
  const [view, setView] = useState<'floor' | 'orders' | 'kitchen'>('floor');

  if (!event) return eventsLoading ? <EventLoader /> : <div className="flex"><Sidebar /><main className="main-content"><p>Événement non trouvé</p></main></div>;

  const getTableStatus = (tableId: string) => {
    const tableOrders = orders.filter(o => o.tableId === tableId);
    if (tableOrders.length === 0) return 'empty';
    if (tableOrders.every(o => o.status === 'served')) return 'served';
    if (tableOrders.some(o => o.status === 'preparing')) return 'preparing';
    if (tableOrders.some(o => o.status === 'ready')) return 'ready';
    return 'pending';
  };

  const tableStatusColor: Record<string, string> = {
    empty: 'rgba(200,169,110,0.04)', pending: 'rgba(220,140,40,0.12)',
    preparing: 'rgba(251,146,60,0.12)', ready: 'rgba(91,141,184,0.12)', served: 'rgba(34,150,79,0.12)',
  };
  const tableStatusBorder: Record<string, string> = {
    empty: 'rgba(200,169,110,0.15)', pending: 'rgba(220,140,40,0.35)',
    preparing: 'rgba(251,146,60,0.35)', ready: 'rgba(91,141,184,0.35)', served: 'rgba(34,150,79,0.35)',
  };

  const advanceOrderStatus = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const next = order.status === 'pending' ? 'preparing' : order.status === 'preparing' ? 'ready' : 'served';
    updateOrder(orderId, { status: next });
  };

  const ordersPending = orders.filter(o => o.status === 'pending').length;
  const ordersPreparing = orders.filter(o => o.status === 'preparing').length;
  const ordersReady = orders.filter(o => o.status === 'ready').length;
  const ordersServed = orders.filter(o => o.status === 'served').length;

  const statCards = [
    { label: 'En attente', value: ordersPending, color: '#DC8C28', bg: 'linear-gradient(135deg, rgba(220,140,40,0.12), rgba(220,140,40,0.04))', icon: Clock },
    { label: 'En préparation', value: ordersPreparing, color: '#FB923C', bg: 'linear-gradient(135deg, rgba(251,146,60,0.12), rgba(251,146,60,0.04))', icon: ChefHat },
    { label: 'Prêts', value: ordersReady, color: '#5B8DB8', bg: 'linear-gradient(135deg, rgba(91,141,184,0.12), rgba(91,141,184,0.04))', icon: Truck },
    { label: 'Servis', value: ordersServed, color: '#22964F', bg: 'linear-gradient(135deg, rgba(34,150,79,0.12), rgba(34,150,79,0.04))', icon: CheckCircle2 },
  ];

  const viewTabs = [
    { key: 'floor', label: 'Plan de salle' },
    { key: 'orders', label: 'Commandes' },
    { key: 'kitchen', label: 'Cuisine' },
  ] as const;

  return (
    <div className="flex">
      <Sidebar eventId={eventId} />
      <main className="main-content">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22964F', boxShadow: '0 0 8px rgba(34,150,79,0.5)', animation: 'pulse 2s infinite' }} />
            <h1 className="font-display text-2xl font-bold">Jour J — Live</h1>
          </div>
          <div style={{
            display: 'inline-flex', gap: '0.25rem', padding: '0.25rem',
            background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 12,
          }}>
            {viewTabs.map(t => (
              <button
                key={t.key}
                onClick={() => setView(t.key)}
                style={{
                  padding: '0.5rem 1rem', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: view === t.key ? 'var(--gold)' : 'transparent',
                  color: view === t.key ? '#fff' : 'var(--text-muted)',
                  fontWeight: 500, fontSize: '0.8rem', transition: 'all 0.2s ease',
                }}
              >{t.label}</button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {statCards.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label} initial="hidden" animate="visible" variants={fadeUp} custom={i}
                style={{ background: s.bg, border: `1px solid ${s.color}20`, borderRadius: '1rem', padding: '1.25rem', position: 'relative', overflow: 'hidden' }}
              >
                <div style={{ position: 'absolute', top: -15, right: -15, width: 50, height: 50, borderRadius: '50%', background: `${s.color}08` }} />
                <Icon size={18} color={s.color} style={{ marginBottom: '0.5rem' }} />
                <div style={{ fontSize: '1.65rem', fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: '0.15rem' }}>{s.value}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              </motion.div>
            );
          })}
        </div>

        {/* ── Floor Plan View ─────────────── */}
        {view === 'floor' && (
          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} custom={4}
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-light)',
              borderRadius: '1.25rem', padding: '1.5rem', minHeight: 500, position: 'relative', overflow: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <span className="text-sm font-medium">Légende :</span>
              {Object.entries(statusLabels).map(([key, val]) => (
                <span key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}>
                  <Circle size={10} fill={val.color} color={val.color} />{val.label}
                </span>
              ))}
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <Circle size={10} fill="rgba(200,169,110,0.2)" color="rgba(200,169,110,0.3)" />Vide
              </span>
            </div>
            <div className="relative" style={{ height: 450, minWidth: 600 }}>
              {eventTables.map((table) => {
                const status = getTableStatus(table.id);
                const tableOrders = orders.filter(o => o.tableId === table.id);
                return (
                  <motion.div
                    key={table.id}
                    className="absolute flex flex-col items-center justify-center cursor-pointer"
                    style={{
                      left: table.positionX, top: table.positionY,
                      width: table.shape === 'rectangle' ? 140 : 110,
                      height: table.shape === 'rectangle' ? 80 : 110,
                      borderRadius: table.shape === 'round' ? '50%' : 14,
                      background: tableStatusColor[status],
                      border: `2px solid ${tableStatusBorder[status]}`,
                    }}
                    animate={status === 'ready' ? { boxShadow: ['0 0 0 0 rgba(91,141,184,0.3)', '0 0 0 12px rgba(91,141,184,0)', '0 0 0 0 rgba(91,141,184,0.3)'] } : {}}
                    transition={status === 'ready' ? { duration: 2, repeat: Infinity } : {}}
                    whileHover={{ scale: 1.05 }}
                  >
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.15rem' }}>{table.name}</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{table.capacity} places</div>
                    {tableOrders.length > 0 && (
                      <span style={{
                        marginTop: '0.25rem', fontSize: '0.55rem', fontWeight: 600,
                        padding: '0.1rem 0.4rem', borderRadius: 4,
                        background: `${statusLabels[status]?.color || '#C8A96E'}20`,
                        color: statusLabels[status]?.color || '#C8A96E',
                      }}>
                        {statusLabels[status]?.label || 'Vide'}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Orders View ─────────────────── */}
        {view === 'orders' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {orders.map((order, i) => {
              const table = eventTables.find(t => t.id === order.tableId);
              const sLabel = statusLabels[order.status];
              return (
                <motion.div
                  key={order.id} initial="hidden" animate="visible" variants={fadeUp} custom={i}
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '1.25rem', padding: '1.25rem', borderLeft: `4px solid ${sLabel.color}` }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span className="font-semibold">{table?.name || order.tableId}</span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.55rem', borderRadius: 6, background: `${sLabel.color}15`, color: sLabel.color }}>{sLabel.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {order.status !== 'served' && (
                        <button className="btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }} onClick={() => advanceOrderStatus(order.id)}>
                          {order.status === 'pending' ? 'Préparer' : order.status === 'preparing' ? 'Prêt !' : 'Servir'}
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {order.items.map(item => (
                      <div key={item.id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        fontSize: '0.85rem', padding: '0.5rem 0.75rem', borderRadius: 10,
                        background: 'var(--glass)', border: '1px solid var(--glass-border)',
                      }}>
                        <span>{item.menuItemName}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>×{item.quantity}</span>
                          <span style={{
                            fontSize: '0.6rem', fontWeight: 600, padding: '0.15rem 0.4rem', borderRadius: 4,
                            background: `${statusLabels[item.status]?.color || '#C8A96E'}15`,
                            color: statusLabels[item.status]?.color || '#C8A96E',
                          }}>
                            {statusLabels[item.status]?.label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ── Kitchen View ────────────────── */}
        {view === 'kitchen' && (
          <div className="grid md:grid-cols-3 gap-5">
            {['pending', 'preparing', 'ready'].map(status => {
              const sLabel = statusLabels[status];
              const filteredOrders = orders.filter(o => o.status === status);
              return (
                <div key={status}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                    <Circle size={10} fill={sLabel.color} color={sLabel.color} />
                    <span className="font-semibold">{sLabel.label}</span>
                    <span style={{
                      fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: 6,
                      background: 'var(--glass)', color: 'var(--text-muted)',
                    }}>{filteredOrders.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {filteredOrders.map(order => {
                      const table = eventTables.find(t => t.id === order.tableId);
                      return (
                        <motion.div
                          key={order.id} layout
                          style={{
                            background: 'var(--bg-card)', border: '1px solid var(--border-light)',
                            borderRadius: '1rem', padding: '1rem', borderLeft: `3px solid ${sLabel.color}`,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span className="font-semibold text-sm">{table?.name}</span>
                            <button className="btn-primary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem' }} onClick={() => advanceOrderStatus(order.id)}>
                              {status === 'pending' ? '→ Préparer' : status === 'preparing' ? '→ Prêt' : '→ Servir'}
                            </button>
                          </div>
                          {order.items.map(item => (
                            <div key={item.id} style={{ fontSize: '0.85rem', padding: '0.2rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span>{item.menuItemName}</span>
                              <span style={{ color: 'var(--text-muted)' }}>×{item.quantity}</span>
                            </div>
                          ))}
                        </motion.div>
                      );
                    })}
                    {filteredOrders.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '2rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Aucune commande
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
