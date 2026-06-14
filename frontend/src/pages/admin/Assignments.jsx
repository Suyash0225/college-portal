import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, FileText, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import {
  getAssignments, createAssignment, updateAssignment, deleteAssignment,
  getTeachers, getSubjects,
} from "../../api/client";
import Modal from "../../components/shared/Modal";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import EmptyState from "../../components/shared/EmptyState";

const EMPTY_FORM = { title: "", subject_id: "", teacher_id: "", file_url: "", due_date: "" };

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
        status === "Active"
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-600"
      }`}
    >
      {status}
    </span>
  );
}

function formatDatetimeLocal(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([getAssignments(), getTeachers(), getSubjects()])
      .then(([a, t, s]) => {
        setAssignments(a.data);
        setTeachers(t.data);
        setSubjects(s.data);
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

  const openEdit = (a) => {
    setEditItem(a);
    setForm({
      title: a.title,
      subject_id: a.subject_id ?? "",
      teacher_id: a.teacher_id ?? "",
      file_url: a.file_url ?? "",
      due_date: formatDatetimeLocal(a.due_date),
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      title: form.title,
      subject_id: form.subject_id || null,
      teacher_id: form.teacher_id || null,
      file_url: form.file_url || null,
      due_date: form.due_date,
    };
    try {
      if (editItem) {
        await updateAssignment(editItem.id, payload);
        toast.success("Assignment updated");
      } else {
        await createAssignment(payload);
        toast.success("Assignment created");
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
      await deleteAssignment(deleteTarget.id);
      toast.success("Assignment deleted");
      setDeleteTarget(null);
      load();
    } catch {
      toast.error("Failed to delete assignment");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
          <p className="text-sm text-gray-500 mt-1">{assignments.length} total</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={16} /> Add Assignment
        </button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner text="Loading assignments..." />
          </div>
        ) : assignments.length === 0 ? (
          <EmptyState icon={FileText} title="No assignments yet" description="Create your first assignment." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-header">#</th>
                  <th className="table-header">Title</th>
                  <th className="table-header">Teacher</th>
                  <th className="table-header">Subject</th>
                  <th className="table-header">Due Date</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Link</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {assignments.map((a, i) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell text-gray-400">{i + 1}</td>
                    <td className="table-cell font-medium text-gray-900 max-w-[180px] truncate">{a.title}</td>
                    <td className="table-cell text-gray-500">{a.teacher_name ?? "—"}</td>
                    <td className="table-cell text-gray-500">{a.subject_name ?? "—"}</td>
                    <td className="table-cell text-gray-500 whitespace-nowrap">
                      {a.due_date ? new Date(a.due_date).toLocaleDateString() : "—"}
                    </td>
                    <td className="table-cell"><StatusBadge status={a.status} /></td>
                    <td className="table-cell">
                      {a.file_url ? (
                        <a
                          href={a.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-xs font-medium"
                        >
                          Open <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                          onClick={() => openEdit(a)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                          onClick={() => setDeleteTarget(a)}
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
        title={editItem ? "Edit Assignment" : "Add Assignment"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Assignment Title</label>
            <input
              className="input-field"
              placeholder="e.g. Chapter 5 Exercises"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Teacher</label>
              <select
                className="input-field"
                value={form.teacher_id}
                onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
              >
                <option value="">— Select Teacher —</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
              <select
                className="input-field"
                value={form.subject_id}
                onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
              >
                <option value="">— Select Subject —</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              File URL or Assignment Link <span className="text-gray-400">(optional)</span>
            </label>
            <input
              className="input-field"
              placeholder="https://..."
              value={form.file_url}
              onChange={(e) => setForm({ ...form, file_url: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date & Time</label>
            <input
              className="input-field"
              type="datetime-local"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? "Saving..." : editItem ? "Save Changes" : "Add Assignment"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Assignment"
        message={`Delete "${deleteTarget?.title}"? This action cannot be undone.`}
      />
    </div>
  );
}
