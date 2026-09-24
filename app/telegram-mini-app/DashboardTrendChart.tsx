'use client';

import { useId } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type Point = { date: string; quantity: number; value?: number };
export default function DashboardTrendChart({ data = [], valueKey = 'quantity', color = 'cyan', unit = 'units' }: { data?: Point[]; valueKey?: 'quantity' | 'value'; color?: 'cyan' | 'indigo'; unit?: string }) {
  const id = `trend-${useId().replace(/:/g, '')}`;
  const stroke = color === 'indigo' ? '#a5b4fc' : '#5eead4';
  const weekday = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short' });
  return <figure className="mt-4 min-w-0" aria-label={`Last seven days: ${unit}`}>
    <figcaption className="mb-3 flex items-center justify-between text-[10px] text-slate-400"><span>7 maalmood ee u dambeeyey</span><span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: stroke }} />{unit}</span></figcaption>
    {!data.length ? <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-slate-700/60 text-xs text-slate-400">Xogta chart-ka lama soo qaadin</div> : <>
      <div className="h-40 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <AreaChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }} accessibilityLayer>
            <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={stroke} stopOpacity={0.24} /><stop offset="100%" stopColor={stroke} stopOpacity={0.01} /></linearGradient></defs>
            <CartesianGrid vertical={false} stroke="#334155" strokeOpacity={0.45} strokeDasharray="3 6" />
            <XAxis dataKey="date" tickFormatter={weekday} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickMargin={10} minTickGap={8} />
            <YAxis width={38} axisLine={false} tickLine={false} allowDecimals={false} domain={[0, (max: number) => Math.max(1, Math.ceil(max * 1.1))]} tick={{ fill: '#64748b', fontSize: 9 }} tickFormatter={value => Intl.NumberFormat('en', { notation: 'compact' }).format(value)} />
            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, fontSize: 12, color: '#f1f5f9' }} labelStyle={{ color: '#94a3b8', marginBottom: 4 }} itemStyle={{ color: stroke }} labelFormatter={label => new Date(`${label}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} formatter={(value: any) => [Number(value).toLocaleString(), unit]} cursor={{ stroke: '#64748b', strokeDasharray: '3 3' }} />
            <Area type="monotone" dataKey={valueKey} stroke={stroke} strokeWidth={2.5} fill={`url(#${id})`} dot={false} activeDot={{ r: 4, stroke: '#0f172a', strokeWidth: 3 }} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only"><caption>{unit} over seven days</caption><tbody>{data.map(point => <tr key={point.date}><th>{point.date}</th><td>{point[valueKey] || 0}</td></tr>)}</tbody></table>
    </>}
  </figure>;
}
