import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, GraduationCap } from "lucide-react";
import toast from "react-hot-toast";
import { getSubjects, createSubject, updateSubject, deleteSubject, getTeachers } from "../../api/client";
import Modal from "../../components/shared/Modal";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import EmptyState from "../../components/shared/EmptyState";

const EMPTY_FORM = { name: "", teacher_id: "" };

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([getSubjects(), getTeachers()])
      .then(([s, t]) => {
        setSubjects(s.data);
        setTeachers(t.data);
      })
      .catch(() => toast.error("Failed to load data"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (s) => {
    setEditItem(s);
    setForm({ name: s.name, teacher_id: s.teacher_id ?? "" });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { name: form.name, teacher_id: form.teacher_id || null };
    try {
      if (editItem) {
        await updateSubject(editItem.id, payload);
        toast.success("Subject updated");
      } else {
        await createSubject(payload);
        toast.success("Subject added");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteSubject(deleteTarget.id);
      toast.success("Subject deleted");
      setDeleteTarget(null);
      load();
    } catch {
      toast.error("Failed to delete subject");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subjects</h1>
          <p className="text-sm text-gray-500 mt-1">{subjects.length} total</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={16} /> Add Subject
        </button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner text="Loading subjects..." />
          </div>
        ) : subjects.length === 0 ? (
          <EmptyState icon={GraduationCap} title="No subjects yet" description="Add your first subject to get started." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-header">#</th>
                  <th className="table-header">Subject Name</th>
                  <th className="table-header">Assigned Teacher</th>
                  <th className="table-header">Added</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {subjects.map((s, i) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell text-gray-400">{i + 1}</td>
                    <td className="table-cell font-medium text-gray-900">{s.name}</td>
                    <td className="table-cell">
                      {s.teacher_name ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-blue-50 text-blue-700 font-medium">
                          {s.teacher_name}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Unassigned</span>
                      )}
                    </td>
                    <td className="table-cell text-gray-400 text-xs">
                      {s.created_at ? new Date(s.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                          onClick={() => openEdit(s)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                          onClick={() => setDeleteTarget(s)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? "Edit Subject" : "Add Subject"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject Name</label>
            <input
              className="input-field"
              placeholder="e.g. Mathematics"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Assigned Teacher <span className="text-gray-400">(optional)</span>
            </label>
            <select
              className="input-field"
              value={form.teacher_id}
              onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
            >
              <option value="">— Select Teacher —</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? "Saving..." : editItem ? "Save Changes" : "Add Subject"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Subject"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will also remove all related assignments and resources.`}
      />
    </div>
  );
}
