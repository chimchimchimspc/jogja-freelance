"use client";
import { useState } from "react";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import {
  MOCK_EMPLOYER_JOBS,
  MOCK_APPLICANTS,
  MOCK_EMPLOYER_EVENTS,
  MOCK_EVENT_REGISTRANTS,
} from "../../data/employer";
import { Briefcase, CalendarDays, CheckCircle } from "lucide-react";

const TABS = ["Semua", "Lowongan", "Event"] as const;
type Tab = typeof TABS[number];

const levelBadge: Record<string, string> = {
  Bronze:   "text-orange-700 bg-orange-50 border-orange-200",
  Silver:   "text-gray-600  bg-gray-50   border-gray-200",
  Gold:     "text-yellow-700 bg-yellow-50 border-yellow-200",
  Platinum: "text-blue-600  bg-blue-50   border-blue-200",
};

type Entry =
  | { source: "Lowongan"; id: string; name: string; level: string; forTitle: string; at: string; extra: string }
  | { source: "Event"; id: string; name: string; level: string; forTitle: string; at: string; extra: string };

export default function ApplicantsAndRegistrantsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Semua");

  const jobEntries: Entry[] = MOCK_APPLICANTS.map((a) => ({
    source: "Lowongan",
    id: a.id,
    name: a.name,
    level: a.level,
    forTitle: MOCK_EMPLOYER_JOBS.find((j) => j.id === a.jobId)?.title ?? "Lowongan",
    at: a.appliedAt,
    extra: a.status === "shortlisted" ? "Shortlisted" : a.status === "rejected" ? "Ditolak" : "Pending",
  }));

  const eventEntries: Entry[] = MOCK_EVENT_REGISTRANTS.map((r) => ({
    source: "Event",
    id: r.id,
    name: r.name,
    level: r.level,
    forTitle: MOCK_EMPLOYER_EVENTS.find((e) => e.id === r.eventId)?.title ?? "Event",
    at: r.registeredAt,
    extra: r.checkedIn ? "Sudah check-in" : "Belum check-in",
  }));

  const allEntries = [...jobEntries, ...eventEntries];

  const filtered =
    activeTab === "Semua" ? allEntries :
    activeTab === "Lowongan" ? jobEntries :
    eventEntries;

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#F8F6FF]">
        <div className="bg-white text-[#1E1B2E] py-8">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-xl font-bold mb-1">Pendaftar</h1>
            <p className="text-sm text-[#6B6880]">Semua orang yang mendaftar lowongan & event milik Anda</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white border border-[#EAE6F5] rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-[#D64545]" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#1E1B2E]">{jobEntries.length}</p>
                <p className="text-xs text-[#6B6880]">Pelamar Lowongan</p>
              </div>
            </div>
            <div className="bg-white border border-[#EAE6F5] rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#1E1B2E]">{eventEntries.length}</p>
                <p className="text-xs text-[#6B6880]">Pendaftar Event</p>
              </div>
            </div>
          </div>

          <div className="flex gap-1 bg-white border border-[#EAE6F5] rounded-xl p-1 mb-5">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 text-sm py-2 rounded-lg font-semibold transition-colors ${
                  activeTab === tab
                    ? "bg-[#D64545] text-white"
                    : "text-[#6B6880] hover:bg-[#F3F0FB]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white border border-[#EAE6F5] rounded-xl p-12 text-center">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-[#1E1B2E] font-semibold mb-1">Belum ada pendaftar di kategori ini</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((entry) => (
                <div key={`${entry.source}-${entry.id}`} className="bg-white border border-[#EAE6F5] rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#D64545] flex items-center justify-center text-white font-bold flex-shrink-0">
                    {entry.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <p className="font-semibold text-[#1E1B2E] text-sm">{entry.name}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${levelBadge[entry.level]}`}>
                        {entry.level}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F3F0FB] text-[#6B6880] flex items-center gap-1">
                        {entry.source === "Lowongan" ? <Briefcase className="w-3 h-3" /> : <CalendarDays className="w-3 h-3" />}
                        {entry.source}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B6880] truncate">{entry.forTitle}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-[#6B6880]">{entry.at}</p>
                    <p className={`text-xs font-semibold flex items-center gap-1 justify-end ${entry.extra.includes("Sudah") || entry.extra === "Shortlisted" ? "text-green-600" : "text-[#6B6880]"}`}>
                      {(entry.extra.includes("Sudah") || entry.extra === "Shortlisted") && <CheckCircle className="w-3 h-3" />}
                      {entry.extra}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
