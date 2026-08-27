'use client'
import { useEffect, useState } from 'react'
import { PageShell }            from '../page'

function api(path) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('kaali_token') : ''
  return fetch(path, { headers: { Authorization:`Bearer ${token}` } }).then(r => r.json())
}

// Simple bar chart using divs
function BarChart({ data = [], valueKey = 'count', labelKey = 'date', color = 'var(--ac)', height = 140, formatLabel }) {
  const max = Math.max(...data.map(d => d[valueKey]), 1)
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:3, height, paddingTop:8 }}>
      {data.map((d, i) => {
        const pct = (d[valueKey] / max) * 100
        const label = formatLabel ? formatLabel(d[labelKey]) : d[labelKey]
        return (
          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3, height:'100%', justifyContent:'flex-end' }}
            title={`${label}: ${d[valueKey]}`}>
            <div style={{ width:'100%', borderRadius:'3px 3px 0 0', background: pct > 0 ? color : 'var(--b1)',
              height: `${Math.max(pct, pct > 0 ? 4 : 0)}%`, transition:'height .3s', minHeight: pct > 0 ? 3 : 0 }} />
          </div>
        )
      })}
    </div>
  )
}

// Horizontal bar for top pages
function HBar({ label, count, max, color = 'var(--ac)' }) {
  const pct = max > 0 ? (count / max) * 100 : 0
  const shortLabel = label.length > 40 ? label.slice(0, 38) + '…' : label
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
        <span style={{ fontSize:12, color:'var(--ts)', fontFamily:'monospace' }}>{shortLabel}</span>
        <span style={{ fontSize:12, fontWeight:600, color:'var(--tx)' }}>{count}</span>
      </div>
      <div style={{ height:6, background:'var(--b1)', borderRadius:3, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background: color, borderRadius:3, transition:'width .5s' }} />
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, color = 'var(--tx)' }) {
  return (
    <div style={{ background:'var(--s1)', border:'0.5px solid var(--b1)', borderRadius:12, padding:'18px 20px' }}>
      <div style={{ fontSize:12, color:'var(--tm)', marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:28, fontWeight:700, color, marginBottom:2 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:'var(--td)' }}>{sub}</div>}
    </div>
  )
}

function formatDay(dateStr) {
  const d = new Date(dateStr)
  return `${d.getDate()}/${d.getMonth()+1}`
}

const RANGES = [
  { label:'7 days',  days:7  },
  { label:'30 days', days:30 },
  { label:'90 days', days:90 },
]

const TYPE_COLORS = {
  CLIENT:'#3B82F6', EXISTING:'#10B981', INVESTOR:'#8B5CF6', GENERAL:'#6B7280'
}
const TYPE_LABELS = {
  CLIENT:'New Client', EXISTING:'Existing Client', INVESTOR:'Investor', GENERAL:'Exploring'
}

export default function AnalyticsPage() {
  const [days,    setDays]    = useState(30)
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api(`/api/analytics?days=${days}`)
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [days])

  const maxPage     = data?.topPages?.[0]?.count || 1
  const totalType   = Object.values(data?.typeCounts || {}).reduce((a,b) => a+b, 0)

  return (
    <PageShell title="Analytics" action={
      <div style={{ display:'flex', gap:6 }}>
        {RANGES.map(r => (
          <button key={r.days} onClick={() => setDays(r.days)}
            style={{ padding:'5px 14px', borderRadius:8, border:'0.5px solid var(--b2)', fontSize:12, cursor:'pointer', fontWeight: days===r.days ? 600 : 400,
              background: days===r.days ? 'var(--ac)' : 'var(--s1)',
              color:      days===r.days ? '#fff'       : 'var(--tm)' }}>
            {r.label}
          </button>
        ))}
      </div>
    }>

      {loading ? (
        <div style={{ textAlign:'center', padding:60, color:'var(--tm)', fontSize:14 }}>Loading analytics…</div>
      ) : (
        <>
          {/* Summary cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
            <StatCard label="Conversations" value={data?.summary?.totalConvos ?? 0} sub={`Last ${days} days`} />
            <StatCard label="Messages" value={data?.summary?.totalMessages ?? 0} sub="Visitor messages" />
            <StatCard label="Leads captured" value={data?.summary?.totalLeads ?? 0} color="var(--ac)" sub="From conversations" />
            <StatCard label="Conversion rate" value={`${data?.summary?.conversionRate ?? 0}%`} color="#10B981" sub="Chats → leads" />
          </div>

          {/* Charts row 1: conversations + messages */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>

            {/* Conversations over time */}
            <div style={{ background:'var(--s1)', border:'0.5px solid var(--b1)', borderRadius:12, padding:'18px 20px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--tx)' }}>Conversations over time</div>
                <div style={{ fontSize:11, color:'var(--td)' }}>last {days} days</div>
              </div>
              <BarChart data={data?.convsByDay || []} valueKey="count" labelKey="date"
                color="var(--ac)" height={130} formatLabel={formatDay} />
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
                <span style={{ fontSize:10, color:'var(--td)' }}>{data?.convsByDay?.[0]?.date?.slice(5)}</span>
                <span style={{ fontSize:10, color:'var(--td)' }}>{data?.convsByDay?.[data.convsByDay.length-1]?.date?.slice(5)}</span>
              </div>
            </div>

            {/* Messages per day */}
            <div style={{ background:'var(--s1)', border:'0.5px solid var(--b1)', borderRadius:12, padding:'18px 20px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--tx)' }}>Messages per day</div>
                <div style={{ fontSize:11, color:'var(--td)' }}>visitor messages</div>
              </div>
              <BarChart data={data?.msgsByDay || []} valueKey="count" labelKey="date"
                color="#7B73B5" height={130} formatLabel={formatDay} />
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
                <span style={{ fontSize:10, color:'var(--td)' }}>{data?.msgsByDay?.[0]?.date?.slice(5)}</span>
                <span style={{ fontSize:10, color:'var(--td)' }}>{data?.msgsByDay?.[data.msgsByDay.length-1]?.date?.slice(5)}</span>
              </div>
            </div>
          </div>

          {/* Charts row 2: top pages + visitor types */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>

            {/* Top pages */}
            <div style={{ background:'var(--s1)', border:'0.5px solid var(--b1)', borderRadius:12, padding:'18px 20px' }}>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--tx)', marginBottom:16 }}>Top pages where chats start</div>
              {data?.topPages?.length === 0 ? (
                <div style={{ fontSize:13, color:'var(--td)', textAlign:'center', padding:'20px 0' }}>No page data yet</div>
              ) : (
                (data?.topPages || []).map(({ page, count }) => (
                  <HBar key={page} label={page} count={count} max={maxPage} color="var(--ac)" />
                ))
              )}
            </div>

            {/* Visitor type breakdown */}
            <div style={{ background:'var(--s1)', border:'0.5px solid var(--b1)', borderRadius:12, padding:'18px 20px' }}>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--tx)', marginBottom:16 }}>Visitor type breakdown</div>
              {totalType === 0 ? (
                <div style={{ fontSize:13, color:'var(--td)', textAlign:'center', padding:'20px 0' }}>No data yet</div>
              ) : (
                Object.entries(data?.typeCounts || {}).map(([type, count]) => {
                  const pct = totalType > 0 ? Math.round((count / totalType) * 100) : 0
                  return (
                    <div key={type} style={{ marginBottom:14 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ width:10, height:10, borderRadius:'50%', background: TYPE_COLORS[type] || '#6B7280', flexShrink:0 }} />
                          <span style={{ fontSize:12, color:'var(--ts)' }}>{TYPE_LABELS[type] || type}</span>
                        </div>
                        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                          <span style={{ fontSize:12, color:'var(--td)' }}>{count}</span>
                          <span style={{ fontSize:11, fontWeight:600, color: TYPE_COLORS[type] || '#6B7280' }}>{pct}%</span>
                        </div>
                      </div>
                      <div style={{ height:6, background:'var(--b1)', borderRadius:3, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${pct}%`, background: TYPE_COLORS[type] || '#6B7280', borderRadius:3, transition:'width .5s' }} />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </PageShell>
  )
}
