import { supabase } from './client'

// Minimal payload types to avoid any
export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE'
export interface RealtimePayload<Row = Record<string, unknown>> {
  old: Row | null
  new: Row | null
  eventType: RealtimeEventType
}

// Generic helper to create a typed Realtime channel with automatic cleanup
export function createChannel(name: string) {
  const channel = supabase.channel(name, {
    config: {
      broadcast: { ack: true },
      presence: { key: undefined },
    },
  })
  return channel
}

// Subscribe to a single order's status updates
// Assumes table: public.orders with columns: id (uuid/text) and status (text)
export function subscribeOrderStatus(
  orderId: string,
  onChange: (payload: RealtimePayload) => void,
) {
  const channel = createChannel(`orders:status:${orderId}`)

  channel.on(
    'postgres_changes',
    {
      event: '*', // typically UPDATE is enough, but * handles INSERT/DELETE too
      schema: 'public',
      table: 'orders',
      filter: `id=eq.${orderId}`,
    },
    (payload: {
      old: Record<string, unknown> | null
      new: Record<string, unknown> | null
      eventType: RealtimeEventType
    }) => {
      onChange({ old: payload.old, new: payload.new, eventType: payload.eventType })
    },
  )

  channel.subscribe()

  // Return unsubscribe fn
  return () => {
    supabase.removeChannel(channel)
  }
}

// Subscribe to stock changes for a single product
// Assumes table: public.products with columns: id and stock (or stock_quantity)
export function subscribeProductStock(
  productId: string,
  opts: { stockColumn?: 'stock' | 'stock_quantity' } = {},
  onChange?: (payload: {
    old: Record<string, unknown> | null
    new: Record<string, unknown> | null
    changed: boolean
  }) => void,
) {
  const { stockColumn = 'stock' } = opts
  const channel = createChannel(`products:stock:${productId}`)

  channel.on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'products',
      filter: `id=eq.${productId}`,
    },
    (payload: { old: Record<string, unknown> | null; new: Record<string, unknown> | null }) => {
      const oldVal = (payload.old as Record<string, unknown> | null)?.[stockColumn]
      const newVal = (payload.new as Record<string, unknown> | null)?.[stockColumn]
      const changed = oldVal !== newVal
      onChange?.({ old: payload.old, new: payload.new, changed })
    },
  )

  channel.subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

// Example: subscribe to all product stock changes (use carefully)
export function subscribeAllStockChanges(onChange: (payload: RealtimePayload) => void) {
  const channel = createChannel('products:stock:all')
  channel.on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'products' },
    (payload: {
      old: Record<string, unknown> | null
      new: Record<string, unknown> | null
      eventType: RealtimeEventType
    }) => {
      onChange({ old: payload.old, new: payload.new, eventType: payload.eventType })
    },
  )
  channel.subscribe()
  return () => supabase.removeChannel(channel)
}
