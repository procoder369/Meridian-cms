import { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { FolderKanban, FileLock2, Clock, AlertTriangle } from 'lucide-react'
import Navbar from '../components/Navbar'
import StatCard from '../components/StatCard'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const STATUS_COLORS = {
  Open: '#2f6f63',
  'Under Review': '#b07d1f',
  Closed: '#6b829f',
}

export default function Dashboard({ onOpenMobile }) {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/dashboard/summary')
      .then((res) => setSummary(res.data))
      .catch(() => setError('Could not load dashboard data from the server.'))
  }, [])

  return (
    <div className="flex h-full flex-col">
      <Navbar
        title="Dashboard"
        subtitle={`Welcome back, ${user?.fullName?.split(' ')[0] ?? ''}`}
        onOpenMobile={onOpenMobile}
      />

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        {error && (
          <div className="mb-6 rounded-md border border-[var(--clay-600)]/30 bg-[var(--clay-100)] px-4 py-3 text-sm text-[var(--clay-600)]">
            {error} Showing illustrative data until the backend is connected.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Assigned cases"
            value={summary?.stats.assignedCases ?? '—'}
            delta="Visible to your account"
            icon={FolderKanban}
            accent="brass"
          />
          <StatCard
            label="Open cases"
            value={summary?.stats.openCases ?? '—'}
            delta="Active investigations"
            icon={Clock}
            accent="teal"
          />
          <StatCard
            label="Documents on file"
            value={summary?.stats.totalDocuments ?? '—'}
            delta="Integrity-verified via SHA-256"
            icon={FileLock2}
            accent="ink"
          />
          <StatCard
            label="Restricted items"
            value={summary?.stats.restrictedDocuments ?? '—'}
            delta="Locked to unassigned users"
            icon={AlertTriangle}
            accent="clay"
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-[var(--parchment-300)] bg-white p-5 lg:col-span-2">
            <h3 className="mb-1 text-sm font-semibold text-[var(--ink-950)]">
              Case volume, last 6 months
            </h3>
            <p className="mb-4 text-xs text-[var(--ink-400)]">Opened vs. closed, by month</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={summary?.monthlyVolume ?? FALLBACK_MONTHLY}>
                  <defs>
                    <linearGradient id="openedFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#b8923f" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#b8923f" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="closedFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2f6f63" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#2f6f63" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e0d0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b829f' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b829f' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e7e0d0', fontSize: 13 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area
                    type="monotone"
                    dataKey="opened"
                    name="Opened"
                    stroke="#b8923f"
                    fill="url(#openedFill)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="closed"
                    name="Closed"
                    stroke="#2f6f63"
                    fill="url(#closedFill)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--parchment-300)] bg-white p-5">
            <h3 className="mb-1 text-sm font-semibold text-[var(--ink-950)]">Cases by status</h3>
            <p className="mb-4 text-xs text-[var(--ink-400)]">Across your assigned caseload</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summary?.statusBreakdown ?? FALLBACK_STATUS}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {(summary?.statusBreakdown ?? FALLBACK_STATUS).map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? '#6b829f'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e7e0d0', fontSize: 13 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-[var(--parchment-300)] bg-white p-5">
          <h3 className="mb-1 text-sm font-semibold text-[var(--ink-950)]">
            Document uploads by case type
          </h3>
          <p className="mb-4 text-xs text-[var(--ink-400)]">Last 30 days</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary?.documentsByCategory ?? FALLBACK_CATEGORY}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e0d0" />
                <XAxis dataKey="category" tick={{ fontSize: 12, fill: '#6b829f' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#6b829f' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e7e0d0', fontSize: 13 }} />
                <Bar dataKey="count" name="Documents" fill="#22364f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

// Shown only if the backend request fails, so the page never renders empty.
const FALLBACK_MONTHLY = [
  { month: 'Apr', opened: 4, closed: 2 },
  { month: 'May', opened: 6, closed: 4 },
  { month: 'Jun', opened: 5, closed: 5 },
  { month: 'Jul', opened: 8, closed: 3 },
  { month: 'Aug', opened: 7, closed: 6 },
  { month: 'Sep', opened: 9, closed: 4 },
]
const FALLBACK_STATUS = [
  { name: 'Open', value: 12 },
  { name: 'Under Review', value: 5 },
  { name: 'Closed', value: 20 },
]
const FALLBACK_CATEGORY = [
  { category: 'Evidence', count: 14 },
  { category: 'Correspondence', count: 9 },
  { category: 'Filings', count: 6 },
  { category: 'Financial', count: 4 },
]
