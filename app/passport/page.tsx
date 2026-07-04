"use client";
import { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import DailyTaskCard from "../components/passport/DailyTaskCard";
import PassportTimeline from "../components/passport/PassportTimeline";
import PassportSidebar from "../components/passport/PassportSidebar";
import BadgeUnlockModal from "../components/passport/BadgeUnlockModal";
import Toast from "../components/ui/Toast";
import { PHASE_COLORS } from "../data/passport";
import { BookOpen, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import FadeInSection from "../components/ui/FadeInSection";
import { PASSPORT_DAYS, type DayEntry, type PassportProgress as LocalProgress } from "../data/passport";
import { passportApi, type PassportProgress, type PassportDayEntry } from "../lib/passport.api";

// Convert API snake_case progress to component camelCase format
function toLocalProgress(p: PassportProgress): LocalProgress {
  return {
    currentDay: p.current_day ?? 1,
    completedDays: p.completed_days ?? [],
    startDate: p.start_date ?? new Date().toISOString().split("T")[0],
    level: (p.level ?? "Bronze") as LocalProgress["level"],
    earnedBadges: p.earned_badges ?? [],
  };
}

// Merge API day entries with local static PASSPORT_DAYS (API may have all fields; fallback to static)
function mergeDay(apiDay: PassportDayEntry): DayEntry {
  const staticDay = PASSPORT_DAYS.find((d) => d.day === apiDay.day_number);
  return {
    day: apiDay.day_number,
    phase: apiDay.phase as DayEntry["phase"],
    task: apiDay.task ?? staticDay?.task ?? "",
    description: apiDay.description ?? staticDay?.description ?? "",
    estimatedTime: apiDay.estimated_time ?? staticDay?.estimatedTime ?? "",
    tips: apiDay.tips ?? staticDay?.tips ?? [],
    badgeUnlock: apiDay.badge_unlock ?? staticDay?.badgeUnlock,
    badgeIcon: staticDay?.badgeIcon,
    resources: apiDay.resources ?? staticDay?.resources,
  };
}

export default function PassportPage() {
  const [progress, setProgress]   = useState<PassportProgress | null>(null);
  const [days, setDays]           = useState<PassportDayEntry[]>([]);
  const [selectedDay, setSelectedDay] = useState(1);
  const [unlockedBadge, setUnlockedBadge] = useState<{ name: string; icon: string } | null>(null);
  const [toast, setToast]         = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [marking, setMarking]     = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await passportApi.getJourney();
        setProgress(res.data.progress);
        setDays(res.data.days);
        setSelectedDay(res.data.progress.current_day ?? 1);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Gagal memuat passport");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-[#F1F1F1] flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-[#D64545]" />
        </main>
        <Footer />
      </>
    );
  }

  if (error || !progress || days.length === 0) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-[#F1F1F1] flex items-center justify-center py-24">
          <div className="text-center">
            <p className="text-[#DC2C1E] mb-4">{error ?? "Data passport tidak tersedia"}</p>
            <button onClick={() => window.location.reload()}
              className="text-sm text-[#146EB4] hover:underline">
              Coba lagi
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const localProgress = toLocalProgress(progress);
  const mergedDays    = days.length > 0 ? days.map(mergeDay) : PASSPORT_DAYS;
  const selectedEntry = mergedDays.find((d) => d.day === selectedDay) ?? mergedDays[0];
  const isCompleted   = localProgress.completedDays.includes(selectedDay);
  const isFuture      = selectedDay > localProgress.currentDay;
  const phaseColor    = PHASE_COLORS[selectedEntry.phase] ?? PHASE_COLORS["Onboarding"];

  const handleComplete = async () => {
    if (marking || isFuture) return;
    setMarking(true);
    try {
      const res = await passportApi.markComplete(selectedDay);
      const newCompleted = [...(progress.completed_days ?? []), selectedDay];
      const newCurrent   = Math.min(selectedDay + 1, 30);

      setProgress({
        ...progress,
        completed_days: newCompleted,
        current_day: newCurrent,
        days_completed: (progress.days_completed ?? 0) + 1,
      });

      if (res.data.badge_awarded) {
        setTimeout(() => setUnlockedBadge(res.data.badge_awarded!), 400);
      } else {
        setToast(`Hari ${selectedDay} selesai! Lanjut ke hari berikutnya.`);
      }

      if (selectedDay < 30) setSelectedDay(newCurrent);
    } catch (e: unknown) {
      setToast(e instanceof Error ? e.message : "Gagal menandai selesai");
    } finally {
      setMarking(false);
    }
  };

  const goToDay = (delta: number) => {
    const next = Math.max(1, Math.min(30, selectedDay + delta));
    setSelectedDay(next);
  };

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#F1F1F1]">
        <div className="bg-white text-[#1E1B2E] py-10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-6 h-6 text-[#D64545]" />
              <h1 className="text-3xl font-bold">Jogja Passport</h1>
            </div>
            <p className="text-[#6B6880] text-sm">
              Panduan 30 hari untuk survive &amp; thriving sebagai freelancer di Yogyakarta
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-4">
              <FadeInSection delay={100}>
                <PassportTimeline
                  progress={localProgress}
                  onSelectDay={setSelectedDay}
                  selectedDay={selectedDay}
                />
              </FadeInSection>

              <FadeInSection delay={180}>
                <div className="flex items-center justify-between bg-white border border-[#E7E7E7] rounded-lg px-5 py-3">
                  <button onClick={() => goToDay(-1)} disabled={selectedDay === 1}
                    className="flex items-center gap-1 text-sm text-[#565A5C] hover:text-[#232F3E] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Sebelumnya
                  </button>
                  <div className="text-center">
                    <span className={clsx("text-xs font-bold px-3 py-1 rounded-full", phaseColor.bg, phaseColor.text)}>
                      {selectedEntry.phase}
                    </span>
                    <p className="text-sm font-bold text-[#232F3E] mt-1">Hari {selectedDay}</p>
                  </div>
                  <button onClick={() => goToDay(1)} disabled={selectedDay === 30}
                    className="flex items-center gap-1 text-sm text-[#565A5C] hover:text-[#232F3E] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    Berikutnya <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </FadeInSection>

              {isFuture && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-[#146EB4]">
                  <strong>Hari {selectedDay}</strong> belum tersedia. Selesaikan hari-hari sebelumnya
                  untuk membuka ini. Sekarang kamu di <strong>Hari {localProgress.currentDay}</strong>.
                </div>
              )}

              <FadeInSection delay={240}>
                <DailyTaskCard
                  entry={selectedEntry}
                  isCompleted={isCompleted}
                  onComplete={isFuture ? () => {} : handleComplete}
                />
              </FadeInSection>

              <FadeInSection delay={300}>
                <div className="bg-white border border-[#E7E7E7] rounded-lg p-5">
                  <h3 className="font-bold text-[#232F3E] mb-3">Fase Perjalanan</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(["Onboarding", "Eksplorasi", "Action", "Wrap-up"] as const).map((phase) => {
                      const phaseDays = mergedDays.filter((d) => d.phase === phase);
                      const doneDays  = phaseDays.filter((d) => localProgress.completedDays.includes(d.day));
                      const pc        = PHASE_COLORS[phase] ?? PHASE_COLORS["Onboarding"];
                      const isActive  = selectedEntry.phase === phase;
                      const percentage = phaseDays.length ? (doneDays.length / phaseDays.length) * 100 : 0;

                      return (
                        <div key={phase}
                          onClick={() => phaseDays[0] && setSelectedDay(phaseDays[0].day)}
                          className={clsx(
                            "rounded-lg p-3 text-center border cursor-pointer transition-all hover:shadow-md",
                            isActive ? `${pc.bg} ${pc.border}` : "bg-[#F1F1F1] border-transparent hover:bg-[#E7E7E7]"
                          )}>
                          <p className={clsx("text-sm font-bold", isActive ? pc.text : "text-[#232F3E]")}>{phase}</p>
                          <p className="text-xs text-[#565A5C] mt-0.5">{doneDays.length}/{phaseDays.length} hari</p>
                          <div className="w-full bg-[#CCCCCC] rounded-full h-1.5 mt-3">
                            <div className="h-1.5 rounded-full transition-all duration-500 bg-[#12A54D]"
                              style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </FadeInSection>
            </div>

            <PassportSidebar progress={localProgress} />
          </div>
        </div>
      </main>

      <Footer />

      <BadgeUnlockModal
        badge={unlockedBadge}
        onClose={() => {
          setUnlockedBadge(null);
          setToast(`Badge "${unlockedBadge?.name}" berhasil diraih!`);
        }}
      />

      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
    </>
  );
}
