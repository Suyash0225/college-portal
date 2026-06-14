import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Users, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { getTeachers, createTeacher, updateTeacher, deleteTeacher } from "../../api/client";
import Modal from "../../components/shared/Modal";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import EmptyState from "../../components/shared/EmptyState";

const EMPTY_FORM = { name: "", email: "" };

export default function Teachers() {
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
    getTeachers()
      .then((r) => setTeachers(r.data))
      .catch(() => toast.error("Failed to load teachers"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (t) => {
    setEditItem(t);
    setForm({ name: t.name, email: t.email });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editItem) {
        await updateTeacher(editItem.id, form);
        toast.success("Teacher updated");
      } else {
        await createTeacher(form);
        toast.success("Teacher added");
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
      await deleteTeacher(deleteTarget.id);
      toast.success("Teacher deleted");
      setDeleteTarget(null);
      load();
    } catch {
      toast.error("Failed to delete teacher");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teachers</h1>
          <p className="text-sm text-gray-500 mt-1">{teachers.length} total</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={16} /> Add Teacher
        </button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner text="Loading teachers..." />
          </div>
        ) : teachers.length === 0 ? (
          <EmptyState icon={Users} title="No teachers yet" description="Add your first teacher to get started." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-header">#</th>
                  <th className="table-header">Name</th>
                  <th className="table-header">Email</th>
                  <th className="table-header">Added</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {teachers.map((t, i) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell text-gray-400">{i + 1}</td>
                    <td className="table-cell font-medium text-gray-900">{t.name}</td>
                    <td className="table-cell">
                      {t.email ? (
                        <span className="flex items-center gap-1.5 text-gray-500">
                          <Mail size={13} /> {t.email}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="table-cell text-gray-400 text-xs">
                      {t.created_at ? new Date(t.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                          onClick={() => openEdit(t)}
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                          onClick={() => setDeleteTarget(t)}
                          title="Delete"
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
        title={editItem ? "Edit Teacher" : "Add Teacher"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <input
              className="input-field"
              placeholder="e.g. John Smith"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? "Saving..." : editItem ? "Save Changes" : "Add Teacher"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Teacher"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will also remove their assigned subjects and assignments.`}
      />
    </div>
  );
}
