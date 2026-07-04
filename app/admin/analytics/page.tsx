"use client";
import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { adminApi, type AnalyticsDetail } from "../../lib/admin.api";
import Toast from "../../components/ui/Toast";

const BAR_HUE = "#D64545";
const TRACK = "#F1F1F1";

function BarList({ items, valueLabel }: { items: { label: string; count: number }[]; valueLabel?: (n: number) => string }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  if (items.length === 0) {
    return <p className="text-sm text-[#565A5C] py-6 text-center">Belum ada data.</p>;
  }
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="text-xs text-[#565A5C] w-32 flex-shrink-0 truncate" title={item.label}>{item.label}</span>
          <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: TRACK }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${(item.count / max) * 100}%`, background: BAR_HUE }}
            />
          </div>
          <span className="text-xs font-semibold text-[#232F3E] w-10 text-right flex-shrink-0">
            {valueLabel ? valueLabel(item.count) : item.count}
          </span>
        </div>
      ))}
    </div>
  );
}

function TrendBars({ points, everyNthLabel = 5 }: { points: { date: string; count: number }[]; everyNthLabel?: number }) {
  const max = Math.max(1, ...points.map((p) => p.count));
  const total = points.reduce((s, p) => s + p.count, 0);
  return (
    <div>
      <div className="flex items-end gap-1 h-24 mb-2">
        {points.map((p, i) => (
          <div key={p.date} className="flex-1 flex flex-col items-center justify-end h-full group relative">
            <div
              className="w-full rounded-t-[3px] transition-all"
              style={{
                height: `${Math.max(4, (p.count / max) * 100)}%`,
                background: p.count > 0 ? BAR_HUE : TRACK,
              }}
              title={`${p.date}: ${p.count}`}
            />
            {i % everyNthLabel === 0 && (
              <span className="text-[9px] text-[#565A5C] mt-1 whitespace-nowrap">
                {new Date(p.date).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit" })}
              </span>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-[#565A5C]">Total periode ini: <span className="font-semibold text-[#232F3E]">{total}</span></p>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAnalyticsDetail();
      setData(res.data);
    } catch (err: unknown) {
      setToast(err instanceof Error ? err.message : "Gagal memuat analitik.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#232F3E]">Analitik</h1>
          <p className="text-sm text-[#565A5C]">Ringkasan aktivitas platform secara mendalam</p>
        </div>

        {loading || !data ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-[#D64545]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white border border-[#E7E7E7] rounded-lg p-5">
              <h2 className="font-bold text-[#232F3E] mb-4 text-sm">Lowongan Aktif per Kategori</h2>
              <BarList items={data.jobsByCategory.map((c) => ({ label: c.category, count: c.count }))} />
            </div>

            <div className="bg-white border border-[#E7E7E7] rounded-lg p-5">
              <h2 className="font-bold text-[#232F3E] mb-4 text-sm">Event Aktif per Tipe</h2>
              <BarList items={data.eventsByType.map((t) => ({ label: t.type, count: t.count }))} />
            </div>

            <div className="bg-white border border-[#E7E7E7] rounded-lg p-5">
              <h2 className="font-bold text-[#232F3E] mb-4 text-sm">Pertumbuhan Pengguna Baru (30 Hari)</h2>
              <TrendBars points={data.userGrowth} everyNthLabel={5} />
            </div>

            <div className="bg-white border border-[#E7E7E7] rounded-lg p-5">
              <h2 className="font-bold text-[#232F3E] mb-4 text-sm">Lamaran Masuk (14 Hari)</h2>
              <TrendBars points={data.applicationsTrend} everyNthLabel={2} />
            </div>

            <div className="bg-white border border-[#E7E7E7] rounded-lg p-5">
              <h2 className="font-bold text-[#232F3E] mb-4 text-sm">Top 10 Skill Diminati</h2>
              <BarList items={data.topSkills.map((s) => ({ label: s.name, count: s.count }))} />
            </div>

            <div className="bg-white border border-[#E7E7E7] rounded-lg p-5">
              <h2 className="font-bold text-[#232F3E] mb-4 text-sm">Top 5 Kota Pengguna</h2>
              <BarList items={data.topCities.map((c) => ({ label: c.city, count: c.count }))} />
            </div>
          </div>
        )}
      </div>

      {toast && <Toast message={toast} type="error" onClose={() => setToast(null)} />}
    </>
  );
}
