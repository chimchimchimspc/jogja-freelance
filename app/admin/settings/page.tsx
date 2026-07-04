"use client";
import { useState, useEffect, useCallback } from "react";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Toast from "../../components/ui/Toast";
import { Input } from "../../components/ui/Input";
import { adminApi, type ApiCategory, type ApiSkill } from "../../lib/admin.api";

type Tab = "categories" | "skills";

export default function AdminSettingsPage() {
  const [tab, setTab] = useState<Tab>("categories");
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [skills, setSkills] = useState<ApiSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [catModal, setCatModal] = useState<{ mode: "create" | "edit"; data?: ApiCategory } | null>(null);
  const [catForm, setCatForm] = useState({ name: "", icon: "" });
  const [skillModal, setSkillModal] = useState<{ mode: "create" | "edit"; data?: ApiSkill } | null>(null);
  const [skillForm, setSkillForm] = useState({ name: "", category: "" });
  const [deleteTarget, setDeleteTarget] = useState<{ type: Tab; id: string; name: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, skillRes] = await Promise.all([adminApi.listCategories(), adminApi.listSkills()]);
      setCategories(catRes.data);
      setSkills(skillRes.data);
    } catch (err: unknown) {
      setToast({ message: err instanceof Error ? err.message : "Gagal memuat data.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCatModal = (mode: "create" | "edit", data?: ApiCategory) => {
    setCatForm({ name: data?.name || "", icon: data?.icon || "" });
    setCatModal({ mode, data });
  };

  const saveCategory = async () => {
    if (!catForm.name.trim()) return;
    try {
      if (catModal?.mode === "edit" && catModal.data) {
        await adminApi.updateCategory(catModal.data.id, catForm);
        setToast({ message: "Kategori diperbarui.", type: "success" });
      } else {
        await adminApi.createCategory(catForm);
        setToast({ message: "Kategori ditambahkan.", type: "success" });
      }
      setCatModal(null);
      loadData();
    } catch (err: unknown) {
      setToast({ message: err instanceof Error ? err.message : "Gagal menyimpan kategori.", type: "error" });
    }
  };

  const openSkillModal = (mode: "create" | "edit", data?: ApiSkill) => {
    setSkillForm({ name: data?.name || "", category: data?.category || "" });
    setSkillModal({ mode, data });
  };

  const saveSkill = async () => {
    if (!skillForm.name.trim()) return;
    try {
      if (skillModal?.mode === "edit" && skillModal.data) {
        await adminApi.updateSkill(skillModal.data.id, skillForm);
        setToast({ message: "Skill diperbarui.", type: "success" });
      } else {
        await adminApi.createSkill(skillForm);
        setToast({ message: "Skill ditambahkan.", type: "success" });
      }
      setSkillModal(null);
      loadData();
    } catch (err: unknown) {
      setToast({ message: err instanceof Error ? err.message : "Gagal menyimpan skill.", type: "error" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "categories") {
        await adminApi.deleteCategory(deleteTarget.id);
      } else {
        await adminApi.deleteSkill(deleteTarget.id);
      }
      setToast({ message: "Berhasil dihapus.", type: "success" });
      setDeleteTarget(null);
      loadData();
    } catch (err: unknown) {
      setToast({ message: err instanceof Error ? err.message : "Gagal menghapus.", type: "error" });
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#232F3E]">Pengaturan</h1>
          <p className="text-sm text-[#565A5C]">Kelola kategori lowongan dan daftar skill master</p>
        </div>

        <div className="flex gap-1 bg-white border border-[#E7E7E7] rounded-lg p-1 mb-4 w-fit">
          <button
            onClick={() => setTab("categories")}
            className={`text-sm py-2 px-4 rounded-md font-semibold transition-colors ${
              tab === "categories" ? "bg-[#232F3E] text-white" : "text-[#565A5C] hover:bg-[#F1F1F1]"
            }`}
          >
            Kategori Lowongan
          </button>
          <button
            onClick={() => setTab("skills")}
            className={`text-sm py-2 px-4 rounded-md font-semibold transition-colors ${
              tab === "skills" ? "bg-[#232F3E] text-white" : "text-[#565A5C] hover:bg-[#F1F1F1]"
            }`}
          >
            Skill
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-[#D64545]" />
          </div>
        ) : tab === "categories" ? (
          <div className="bg-white border border-[#E7E7E7] rounded-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7E7E7]">
              <h2 className="font-bold text-[#232F3E]">{categories.length} Kategori</h2>
              <Button size="sm" onClick={() => openCatModal("create")}>
                <Plus className="w-4 h-4" /> Tambah Kategori
              </Button>
            </div>
            <div className="divide-y divide-[#E7E7E7]">
              {categories.map((c) => (
                <div key={c.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-[#F8F8F8]">
                  <span className="text-xl w-8 text-center flex-shrink-0">{c.icon || "📁"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#232F3E]">{c.name}</p>
                    <p className="text-xs text-[#565A5C]">{c.job_count} lowongan menggunakan kategori ini</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => openCatModal("edit", c)} className="p-1.5 text-[#565A5C] hover:text-[#146EB4] hover:bg-blue-50 rounded">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteTarget({ type: "categories", id: c.id, name: c.name })} className="p-1.5 text-[#DC2C1E] hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-[#E7E7E7] rounded-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7E7E7]">
              <h2 className="font-bold text-[#232F3E]">{skills.length} Skill</h2>
              <Button size="sm" onClick={() => openSkillModal("create")}>
                <Plus className="w-4 h-4" /> Tambah Skill
              </Button>
            </div>
            <div className="divide-y divide-[#E7E7E7]">
              {skills.map((s) => (
                <div key={s.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-[#F8F8F8]">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#232F3E]">{s.name}</p>
                    <p className="text-xs text-[#565A5C]">{s.category || "Tanpa kategori"} · {s.job_count} lowongan</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => openSkillModal("edit", s)} className="p-1.5 text-[#565A5C] hover:text-[#146EB4] hover:bg-blue-50 rounded">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteTarget({ type: "skills", id: s.id, name: s.name })} className="p-1.5 text-[#DC2C1E] hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Category modal */}
      <Modal
        isOpen={!!catModal}
        onClose={() => setCatModal(null)}
        title={catModal?.mode === "edit" ? "Edit Kategori" : "Tambah Kategori"}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCatModal(null)}>Batal</Button>
            <Button onClick={saveCategory}>Simpan</Button>
          </>
        }
      >
        <Input label="Nama Kategori" value={catForm.name} onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))} placeholder="Contoh: Web Development" />
        <Input label="Icon (emoji)" value={catForm.icon} onChange={(e) => setCatForm((f) => ({ ...f, icon: e.target.value }))} placeholder="💻" />
      </Modal>

      {/* Skill modal */}
      <Modal
        isOpen={!!skillModal}
        onClose={() => setSkillModal(null)}
        title={skillModal?.mode === "edit" ? "Edit Skill" : "Tambah Skill"}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSkillModal(null)}>Batal</Button>
            <Button onClick={saveSkill}>Simpan</Button>
          </>
        }
      >
        <Input label="Nama Skill" value={skillForm.name} onChange={(e) => setSkillForm((f) => ({ ...f, name: e.target.value }))} placeholder="Contoh: React" />
        <Input label="Kategori" value={skillForm.category} onChange={(e) => setSkillForm((f) => ({ ...f, category: e.target.value }))} placeholder="Contoh: Web Development" />
      </Modal>

      {/* Delete confirm */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button variant="danger" onClick={handleDelete}>Ya, Hapus</Button>
          </>
        }
      >
        <p className="text-sm text-[#565A5C]">
          Yakin ingin menghapus <strong>{deleteTarget?.name}</strong>? Tindakan ini tidak bisa dibatalkan.
        </p>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
