// lightweight KPI selectors and in-memory cache for summary cards

type Raw = Array<Record<string, unknown>>

const cache: {
  todos: Raw | null
  guests: Raw | null
  vendors: Raw | null
  nextSteps: Raw | null
  timeline: Raw | null
  budgetSummary: Record<string, unknown> | null
  budgetExpenses: Raw | null
} = {
  todos: null,
  guests: null,
  vendors: null,
  nextSteps: null,
  timeline: null,
  budgetSummary: null,
  budgetExpenses: null,
}

export function setTodosCache(items: Raw | null) { cache.todos = items }
export function setGuestsCache(items: Raw | null) { cache.guests = items }
export function setVendorsCache(items: Raw | null) { cache.vendors = items }
export function setNextStepsCache(items: Raw | null) { cache.nextSteps = items }
export function setTimelineCache(items: Raw | null) { cache.timeline = items }
export function setBudgetCache(summary: Record<string, unknown> | null, expenses: Raw | null) { cache.budgetSummary = summary; cache.budgetExpenses = expenses }

function toNumber(v: unknown): number {
  if (v == null) return 0
  const n = Number(v as unknown)
  return isNaN(n) ? 0 : n
}

function computeTodos(todos?: Raw | null) {
  const list = todos ?? cache.todos
  if (!list) return { open: null as number | null, done: null as number | null }
  let open = 0; let done = 0
  for (const d of list) {
    const completed = !!(d && (d as Record<string, unknown>)['completed']);
    if (completed) done++
    else open++
  }
  return { open, done }
}

function computeGuests(guests?: Raw | null) {
  const list = guests ?? cache.guests
  if (!list) return { total: null as number | null, accepted: null as number | null, declined: null as number | null }
  let total = 0; let accepted = 0; let declined = 0
  for (const d of list) {
    total++
    const status = (d && (d as Record<string, unknown>)['status']) as string | undefined
    if (status === 'accepted') accepted++
    if (status === 'declined') declined++
  }
  return { total, accepted, declined }
}

function computeVendors(vendors?: Raw | null) {
  const list = vendors ?? cache.vendors
  if (!list) return { payments: null as number | null, pending: null as number | null, booked: null as number | null }
  let payments = 0; let pending = 0; let booked = 0
  for (const d of list) {
    const paymentStatus = (d && (d as Record<string, unknown>)['paymentStatus']) as string | undefined
    const bookingStatus = (d && (d as Record<string, unknown>)['bookingStatus']) as string | undefined
    const status = (d && (d as Record<string, unknown>)['status']) as string | undefined
    if (paymentStatus === 'paid') payments++
    if (paymentStatus === 'pending') pending++
    if (bookingStatus === 'booked' || status === 'booked') booked++
  }
  return { payments, pending, booked }
}

function computeNextSteps(nextSteps?: Raw | null) {
  const list = nextSteps ?? cache.nextSteps
  if (!list) return { total: null as number | null, upcoming: null as number | null }
  const now = Date.now()
  let total = 0; let upcoming = 0
  for (const d of list) {
    total++
    const maybe = d && (d as Record<string, unknown>)['date']
    if (!maybe) continue
    const t = (maybe instanceof Date) ? maybe.getTime() : (typeof maybe === 'number' ? maybe : Date.parse(String(maybe)))
    if (!isNaN(t) && t >= now) upcoming++
  }
  return { total, upcoming }
}

function computeBudget(summary?: Record<string, unknown> | null, expenses?: Raw | null) {
  const s = summary ?? cache.budgetSummary
  const exp = expenses ?? cache.budgetExpenses
  if (!s && !exp) return { remaining: null as number | null, limit: null as number | null, spent: null as number | null }
  const limit = toNumber(s?.limit ?? 0)
  let spent = 0
  if (exp) {
    for (const e of exp) { spent += toNumber((e && (e as Record<string, unknown>)['amount']) ?? (e && (e as Record<string, unknown>)['value']) ?? 0) }
  }
  const remaining = Math.max(limit - spent, 0)
  return { remaining, limit, spent }
}

function computeTimeline(timeline?: Raw | null) {
  const list = timeline ?? cache.timeline
  if (!list) return { count: null as number | null, nextInMinutes: null as number | null }
  const now = Date.now()
  let count = 0
  let nextTs: number | null = null
  for (const d of list) {
    count++
    const maybe = (d && ((d as Record<string, unknown>)['time'])) ?? (d && ((d as Record<string, unknown>)['date']))
    if (!maybe) continue
    const t = (maybe instanceof Date) ? maybe.getTime() : (typeof maybe === 'number' ? maybe : Date.parse(String(maybe)))
    if (isNaN(t)) continue
    if (t > now && (nextTs == null || t < nextTs)) nextTs = t
  }
  const nextInMinutes = nextTs == null ? null : Math.max(0, Math.round((nextTs - now) / 60000))
  return { count, nextInMinutes }
}

export type DashboardKpisNullable = {
  nextSteps: { total: number | null; upcoming: number | null }
  todos: { open: number | null; done: number | null }
  budget: { remaining: number | null; limit: number | null; spent: number | null }
  vendors: { payments: number | null; pending: number | null; booked: number | null }
  guests: { total: number | null; declined: number | null; accepted: number | null }
  timeline: { count: number | null; nextInMinutes: number | null }
}

export function computeDashboardKpis(sources?: {
  todos?: Raw | null
  guests?: Raw | null
  vendors?: Raw | null
  nextSteps?: Raw | null
  timeline?: Raw | null
  budgetSummary?: Record<string, unknown> | null
  budgetExpenses?: Raw | null
}): DashboardKpisNullable {
  return {
    nextSteps: computeNextSteps(sources?.nextSteps),
    todos: computeTodos(sources?.todos),
    budget: computeBudget(sources?.budgetSummary, sources?.budgetExpenses),
    vendors: computeVendors(sources?.vendors),
    guests: computeGuests(sources?.guests),
    timeline: computeTimeline(sources?.timeline),
  }
}

export function getCachedDashboardKpis(): DashboardKpisNullable | null {
  const anySet = cache.todos || cache.guests || cache.vendors || cache.nextSteps || cache.timeline || cache.budgetSummary || cache.budgetExpenses
  if (!anySet) return null
  return computeDashboardKpis()
}

export function clearKpiCache() {
  cache.todos = cache.guests = cache.vendors = cache.nextSteps = cache.timeline = cache.budgetSummary = cache.budgetExpenses = null
}

export { cache }
