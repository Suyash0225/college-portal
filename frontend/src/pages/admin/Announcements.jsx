import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Megaphone, Info, AlertTriangle, CheckCircle, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from "../../api/client";
import Modal from "../../components/shared/Modal";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import EmptyState from "../../components/shared/EmptyState";

const EMPTY_FORM = { title: "", content: "", type: "info" };

const TYPE_CONFIG = {
  info:    { label: "Info",    icon: Info,          bg: "bg-blue-50",   text: "text-blue-700",  border: "border-blue-200",  dot: "bg-blue-500" },
  success: { label: "Success", icon: CheckCircle,   bg: "bg-green-50",  text: "text-green-700", border: "border-green-200", dot: "bg-green-500" },
  warning: { label: "Warning", icon: AlertTriangle, bg: "bg-yellow-50", text: "text-yellow-700",border: "border-yellow-200",dot: "bg-yellow-500" },
  urgent:  { label: "Urgent",  icon: Zap,           bg: "bg-red-50",    text: "text-red-700",   border: "border-red-200",   dot: "bg-red-500" },
};

function TypeBadge({ type }) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.info;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <Icon size={11} /> {cfg.label}
    </span>
  );
}

export default function Announcements() {
  const [items,       setItems]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [modalOpen,   setModalOpen]   = useState(false);
  const [editItem,    setEditItem]    = useState(null);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [saving,      setSaving]      = useState(false);
  const [deleteTarget,setDeleteTarget]= useState(null);
  const [deleting,    setDeleting]    = useState(false);

  const load = () => {
    setLoading(true);
    getAnnouncements()
      .then((r) => setItems(r.data))
      .catch(() => toast.error("Failed to load announcements"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ title: item.title, content: item.content, type: item.type });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editItem) {
        await updateAnnouncement(editItem.id, form);
        toast.success("Announcement updated");
      } else {
        await createAnnouncement(form);
        toast.success("Announcement posted");
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
      await deleteAnnouncement(deleteTarget.id);
      toast.success("Announcement deleted");
      setDeleteTarget(null);
      load();
    } catch {
      toast.error("Failed to delete announcement");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-sm text-gray-500 mt-1">{items.length} total</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={16} /> New Announcement
        </button>
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner text="Loading announcements..." />
          </div>
        ) : items.length === 0 ? (
          <div className="card">
            <EmptyState icon={Megaphone} title="No announcements yet" description="Post your first announcement for students." />
          </div>
        ) : (
          items.map((item) => {
            const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.info;
            const Icon = cfg.icon;
            return (
              <div key={item.id} className={`card p-5 border-l-4 ${cfg.border}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Icon size={18} className={cfg.text} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
                        <TypeBadge type={item.type} />
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{item.content}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                          : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                      onClick={() => openEdit(item)}
                      title="Edit"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                      onClick={() => setDeleteTarget(item)}
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? "Edit Announcement" : "New Announcement"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
            <input
              className="input-field"
              placeholder="e.g. Exam Schedule Updated"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(TYPE_CONFIG).map(([value, cfg]) => {
                const Icon = cfg.icon;
                const selected = form.type === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm({ ...form, type: value })}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      selected
                        ? `${cfg.bg} ${cfg.text} ${cfg.border}`
                        : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={15} /> {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Content</label>
            <textarea
              className="input-field resize-none"
              rows={4}
              placeholder="Write the announcement message here..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
            />
          </div>

          {/* Preview */}
          {(form.title || form.content) && (
            <div className={`rounded-xl p-4 border ${TYPE_CONFIG[form.type]?.border || "border-gray-200"} ${TYPE_CONFIG[form.type]?.bg || "bg-gray-50"}`}>
              <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Preview</p>
              <p className={`text-sm font-bold ${TYPE_CONFIG[form.type]?.text || "text-gray-900"}`}>{form.title || "Title"}</p>
              <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{form.content || "Content..."}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? "Posting..." : editItem ? "Save Changes" : "Post Announcement"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Announcement"
        message={`Delete "${deleteTarget?.title}"? Students will no longer see this announcement.`}
      />
    </div>
  );
}
