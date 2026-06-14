import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Library, ExternalLink, Youtube, FileText, HardDrive } from "lucide-react";
import toast from "react-hot-toast";
import { getResources, createResource, updateResource, deleteResource, getSubjects } from "../../api/client";
import Modal from "../../components/shared/Modal";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import EmptyState from "../../components/shared/EmptyState";

const EMPTY_FORM = { subject_id: "", title: "", resource_url: "", type: "other" };

const TYPE_OPTIONS = [
  { value: "pdf", label: "PDF" },
  { value: "youtube", label: "YouTube" },
  { value: "drive", label: "Google Drive" },
  { value: "other", label: "Other" },
];

const TYPE_CONFIG = {
  pdf: { color: "bg-red-100 text-red-700", icon: FileText, label: "PDF" },
  youtube: { color: "bg-red-100 text-red-600", icon: Youtube, label: "YouTube" },
  drive: { color: "bg-blue-100 text-blue-700", icon: HardDrive, label: "Drive" },
  other: { color: "bg-gray-100 text-gray-600", icon: ExternalLink, label: "Other" },
};

function TypeBadge({ type }) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.other;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
      <Icon size={11} /> {cfg.label}
    </span>
  );
}

export default function Resources() {
  const [resources, setResources] = useState([]);
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
    Promise.all([getResources(), getSubjects()])
      .then(([r, s]) => {
        setResources(r.data);
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

  const openEdit = (r) => {
    setEditItem(r);
    setForm({
      subject_id: r.subject_id ?? "",
      title: r.title,
      resource_url: r.resource_url,
      type: r.type,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      subject_id: form.subject_id || null,
      title: form.title,
      resource_url: form.resource_url,
      type: form.type,
    };
    try {
      if (editItem) {
        await updateResource(editItem.id, payload);
        toast.success("Resource updated");
      } else {
        await createResource(payload);
        toast.success("Resource added");
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
      await deleteResource(deleteTarget.id);
      toast.success("Resource deleted");
      setDeleteTarget(null);
      load();
    } catch {
      toast.error("Failed to delete resource");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resources</h1>
          <p className="text-sm text-gray-500 mt-1">{resources.length} total</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={16} /> Add Resource
        </button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner text="Loading resources..." />
          </div>
        ) : resources.length === 0 ? (
          <EmptyState icon={Library} title="No resources yet" description="Add your first resource." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-header">#</th>
                  <th className="table-header">Title</th>
                  <th className="table-header">Subject</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Link</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {resources.map((r, i) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell text-gray-400">{i + 1}</td>
                    <td className="table-cell font-medium text-gray-900 max-w-[180px] truncate">{r.title}</td>
                    <td className="table-cell text-gray-500">{r.subject_name ?? "—"}</td>
                    <td className="table-cell"><TypeBadge type={r.type} /></td>
                    <td className="table-cell">
                      <a
                        href={r.resource_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-xs font-medium"
                      >
                        Open <ExternalLink size={12} />
                      </a>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                          onClick={() => openEdit(r)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                          onClick={() => setDeleteTarget(r)}
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
        title={editItem ? "Edit Resource" : "Add Resource"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
            <input
              className="input-field"
              placeholder="e.g. Algebra Introduction PDF"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Resource Type</label>
              <select
                className="input-field"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Resource URL</label>
            <input
              className="input-field"
              placeholder="https://..."
              value={form.resource_url}
              onChange={(e) => setForm({ ...form, resource_url: e.target.value })}
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? "Saving..." : editItem ? "Save Changes" : "Add Resource"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Resource"
        message={`Delete "${deleteTarget?.title}"? This action cannot be undone.`}
      />
    </div>
  );
}
