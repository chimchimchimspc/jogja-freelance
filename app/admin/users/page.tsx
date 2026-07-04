"use client";
import { useState, useEffect, useCallback } from "react";
import { Search, Loader2, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import Badge from "../../components/ui/Badge";
import { Select } from "../../components/ui/Input";
import Toast from "../../components/ui/Toast";
import { adminApi, type ApiAdminUser } from "../../lib/admin.api";

const ROLE_OPTIONS = [
  { value: "",                label: "Semua Role" },
  { value: "freelancer",      label: "Freelancer" },
  { value: "employer",        label: "Employer" },
  { value: "event_organizer", label: "Event Organizer" },
  { value: "admin",           label: "Admin" },
];

const ROLE_BADGE: Record<ApiAdminUser["role"], { label: string; color: "blue" | "orange" | "green" | "red" | "gray" | "gold" }> = {
  freelancer:      { label: "Freelancer",      color: "blue" },
  employer:        { label: "Employer",        color: "orange" },
  event_organizer: { label: "Event Organizer", color: "gray" },
  admin:           { label: "Admin",           color: "gold" },
};

const LIMIT = 20;

export default function AdminUsersPage() {
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<ApiAdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listUsers({ page, limit: LIMIT, role: role || undefined, search: search || undefined });
      setUsers(res.data.rows);
      setTotal(res.data.total);
    } catch (err: unknown) {
      setToast(err instanceof Error ? err.message : "Gagal memuat pengguna.");
    } finally {
      setLoading(false);
    }
  }, [page, role, search]);

  useEffect(() => {
    const t = setTimeout(loadUsers, 300);
    return () => clearTimeout(t);
  }, [loadUsers]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#232F3E]">Kelola Pengguna</h1>
          <p className="text-sm text-[#565A5C]">{total} pengguna terdaftar di platform</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="w-full sm:w-56">
            <Select
              options={ROLE_OPTIONS}
              value={role}
              onChange={(e) => { setRole(e.target.value); setPage(1); }}
              className="!mb-0"
            />
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#565A5C]" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari nama atau email..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-[#CCCCCC] rounded-lg bg-white focus:outline-none focus:border-[#146EB4]"
            />
          </div>
        </div>

        <div className="bg-white border border-[#E7E7E7] rounded-lg overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-7 h-7 animate-spin text-[#D64545]" />
            </div>
          ) : users.length === 0 ? (
            <div className="p-16 text-center text-sm text-[#565A5C]">Tidak ada pengguna untuk filter ini.</div>
          ) : (
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-[#E7E7E7] text-left text-xs text-[#565A5C] uppercase">
                  <th className="px-6 py-3 font-semibold">Nama</th>
                  <th className="px-6 py-3 font-semibold">Role</th>
                  <th className="px-6 py-3 font-semibold">Kota</th>
                  <th className="px-6 py-3 font-semibold">Verified</th>
                  <th className="px-6 py-3 font-semibold">Bergabung</th>
                  <th className="px-6 py-3 font-semibold">Login Terakhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E7E7]">
                {users.map((u) => {
                  const badge = ROLE_BADGE[u.role];
                  return (
                    <tr key={u.id} className="hover:bg-[#F8F8F8] transition-colors">
                      <td className="px-6 py-3.5">
                        <p className="font-semibold text-[#232F3E]">{u.full_name}</p>
                        <p className="text-xs text-[#565A5C]">{u.email}</p>
                      </td>
                      <td className="px-6 py-3.5"><Badge label={badge.label} color={badge.color} /></td>
                      <td className="px-6 py-3.5 text-[#232F3E]">{u.city || "—"}</td>
                      <td className="px-6 py-3.5">
                        {u.is_verified ? (
                          <CheckCircle className="w-4 h-4 text-[#12A54D]" />
                        ) : (
                          <span className="text-xs text-[#565A5C]">Belum</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-[#565A5C] text-xs">{new Date(u.created_at).toLocaleDateString("id-ID")}</td>
                      <td className="px-6 py-3.5 text-[#565A5C] text-xs">
                        {u.last_login ? new Date(u.last_login).toLocaleDateString("id-ID") : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm text-[#565A5C]">
            <span>Halaman {page} dari {totalPages} · {total} pengguna</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 border border-[#E7E7E7] rounded-lg bg-white disabled:opacity-40 hover:bg-[#F1F1F1]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 border border-[#E7E7E7] rounded-lg bg-white disabled:opacity-40 hover:bg-[#F1F1F1]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {toast && <Toast message={toast} type="error" onClose={() => setToast(null)} />}
    </>
  );
}
