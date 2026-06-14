import { useEffect, useState } from "react";
import { ClipboardCheck, Search, ChevronDown, ChevronUp, User, Hash, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { getAllSubmissions, getSubmissionsByAssignment, getAssignments } from "../../api/client";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import EmptyState from "../../components/shared/EmptyState";

export default function Submissions() {
  const [submissions, setSubmissions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [detailMap, setDetailMap] = useState({});
  const [detailLoading, setDetailLoading] = useState(null);

  useEffect(() => {
    Promise.all([getAllSubmissions(), getAssignments()])
      .then(([subRes, aRes]) => {
        setSubmissions(subRes.data);
        setAssignments(aRes.data);
      })
      .catch(() => toast.error("Failed to load submissions"))
      .finally(() => setLoading(false));
  }, []);

  // Group submissions by assignment
  const grouped = assignments.map(a => ({
    ...a,
    subs: submissions.filter(s => s.assignment_id === a.id),
  })).filter(a => a.subs.length > 0);

  const toggleExpand = async (assignmentId) => {
    if (expandedId === assignmentId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(assignmentId);
    if (!detailMap[assignmentId]) {
      setDetailLoading(assignmentId);
      try {
        const res = await getSubmissionsByAssignment(assignmentId);
        setDetailMap(prev => ({ ...prev, [assignmentId]: res.data }));
      } catch {
        toast.error("Failed to load students");
      } finally {
        setDetailLoading(null);
      }
    }
  };

  const filtered = grouped.filter(a => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      a.title.toLowerCase().includes(q) ||
      (a.subject_name || "").toLowerCase().includes(q) ||
      a.subs.some(s => s.student_name.toLowerCase().includes(q) || s.roll_number.toLowerCase().includes(q));
    const matchesFilter = selectedAssignment === "all" || a.id === parseInt(selectedAssignment);
    return matchesSearch && matchesFilter;
  });

  const totalCount = submissions.length;
  const uniqueStudents = new Set(submissions.map(s => s.roll_number)).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Submissions</h1>
        <p className="text-sm text-gray-500 mt-1">Track who has completed each assignment</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Submissions</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-1">{totalCount}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Unique Students</p>
          <p className="text-3xl font-extrabold text-violet-600 mt-1">{uniqueStudents}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input-field pl-9"
            placeholder="Search by assignment, student, roll no..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input-field w-auto pr-8"
          value={selectedAssignment}
          onChange={e => setSelectedAssignment(e.target.value)}
        >
          <option value="all">All Assignments</option>
          {assignments.filter(a => grouped.find(g => g.id === a.id)).map(a => (
            <option key={a.id} value={a.id}>{a.title}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner text="Loading submissions..." />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="No submissions yet" description="Students haven't marked any assignments as complete." />
      ) : (
        <div className="space-y-3">
          {filtered.map(a => {
            const isOpen = expandedId === a.id;
            const detail = detailMap[a.id] || a.subs;
            return (
              <div key={a.id} className="card overflow-hidden">
                {/* Assignment row */}
                <button
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => toggleExpand(a.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <ClipboardCheck size={18} className="text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{a.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {a.subject_name || "General"}{a.teacher_name ? ` · ${a.teacher_name}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-violet-100 text-violet-700">
                      <User size={11} /> {a.subs.length} student{a.subs.length !== 1 ? "s" : ""}
                    </span>
                    {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </button>

                {/* Expanded student list */}
                {isOpen && (
                  <div className="border-t border-gray-100">
                    {detailLoading === a.id ? (
                      <div className="flex justify-center py-6">
                        <LoadingSpinner text="Loading..." />
                      </div>
                    ) : detail.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-6">No submissions yet</p>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {detail.map((s, i) => (
                          <div key={s.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                            <span className="w-6 text-xs text-gray-300 font-bold">{i + 1}</span>
                            <div className="w-8 h-8 rounded-full bg-violet-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                              {s.student_name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900">{s.student_name}</p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <Hash size={10} className="text-gray-400" />
                                <p className="text-xs text-gray-400">{s.roll_number}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-gray-400 flex-shrink-0">
                              <Clock size={11} />
                              <span className="text-[11px]">
                                {new Date(s.submitted_at).toLocaleString("en-US", {
                                  month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                                })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
