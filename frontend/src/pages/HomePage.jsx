import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap, LayoutDashboard, FileText, Library, Megaphone,
  Calendar, Info, Mail, Download, Eye, Search, ChevronDown, Filter,
  CheckCircle, XCircle, ClipboardList, ExternalLink, MoreVertical,
  ChevronRight, Youtube, HardDrive, Clock, Menu, X,
  Home, MoreHorizontal, Link2, SlidersHorizontal, CheckCheck, User, Hash, Lock,
} from "lucide-react";
import toast from "react-hot-toast";
import { getAssignments, getResources, getSubjects, getAnnouncements, submitAssignment } from "../api/client";
import LoadingSpinner from "../components/shared/LoadingSpinner";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const SUBJECT_COLORS = [
  "bg-blue-500","bg-purple-500","bg-green-500","bg-orange-500",
  "bg-red-500","bg-cyan-500","bg-pink-500","bg-indigo-500",
];
const TEACHER_COLORS = [
  "bg-violet-400","bg-blue-400","bg-green-400","bg-orange-400",
  "bg-red-400","bg-teal-400","bg-pink-400","bg-cyan-400",
];

function strHash(str = "") {
  return [...str].reduce((a, c) => a + c.charCodeAt(0), 0);
}
const subjectColor  = (n) => SUBJECT_COLORS[strHash(n) % SUBJECT_COLORS.length];
const teacherColor  = (n) => TEACHER_COLORS[strHash(n) % TEACHER_COLORS.length];
const initials      = (n = "") => n.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const due = new Date(dateStr), now = new Date();
  due.setHours(0,0,0,0); now.setHours(0,0,0,0);
  return Math.ceil((due - now) / 86400000);
}
const dueBadge = (d) => d === null ? "text-gray-400" : d <= 2 ? "text-red-500" : d <= 7 ? "text-yellow-500" : "text-green-500";
const dueDot   = (d) => d === null ? "bg-gray-300" : d <= 2 ? "bg-red-500"  : d <= 7 ? "bg-yellow-400"  : "bg-green-500";
const dueLabel = (d) => d === null ? "" : d === 0 ? "Due today" : d < 0 ? "Overdue" : `Due in ${d} day${d !== 1 ? "s" : ""}`;

const RES_CFG = {
  pdf:     { bg: "bg-red-100",   ic: "text-red-500",  label: "PDF" },
  youtube: { bg: "bg-red-100",   ic: "text-red-600",  label: "YouTube" },
  drive:   { bg: "bg-blue-100",  ic: "text-blue-500", label: "Google Drive" },
  other:   { bg: "bg-gray-100",  ic: "text-gray-500", label: "Link" },
};

function ResIcon({ type, size = 18 }) {
  const cls = (RES_CFG[type] || RES_CFG.other).ic;
  if (type === "youtube") return <Youtube size={size} className={cls} />;
  if (type === "drive")   return <HardDrive size={size} className={cls} />;
  if (type === "pdf")     return <FileText size={size} className={cls} />;
  return <ExternalLink size={size} className={cls} />;
}

const QUOTES = [
  { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
];

const PAGE_SIZE = 5;

const NAV_SIDEBAR = [
  { id: "dashboard",     icon: LayoutDashboard, label: "Dashboard" },
  { id: "assignments",   icon: FileText,         label: "Assignments" },
  { id: "resources",     icon: Library,          label: "Resources" },
  { id: "announcements", icon: Megaphone,        label: "Announcements" },
  { id: "calendar",      icon: Calendar,         label: "Calendar" },
];
const NAV_SIDEBAR_BOTTOM = [
  { id: "about",   icon: Info, label: "About" },
  { id: "contact", icon: Mail, label: "Contact" },
];
const NAV_BOTTOM_BAR = [
  { id: "dashboard",   icon: Home,          label: "Home" },
  { id: "assignments", icon: ClipboardList, label: "Assignments" },
  { id: "resources",   icon: Library,       label: "Resources" },
  { id: "calendar",    icon: Calendar,      label: "Calendar" },
];

// ─── Assignment Card (mobile) ─────────────────────────────────────────────────
function AssignmentCard({ a, onMenuToggle, menuOpenId, onMarkDone }) {
  const days = daysUntil(a.due_date);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Colored top accent bar */}
      <div className={`h-1 w-full ${a.status === "Active" ? "bg-gradient-to-r from-violet-500 to-indigo-400" : "bg-gradient-to-r from-gray-300 to-gray-200"}`} />

      <div className="p-4">
        {/* Title + Status */}
        <div className="flex items-start justify-between gap-2 mb-3">
          {a.file_url ? (
            <a href={a.file_url} target="_blank" rel="noopener noreferrer"
              className="text-[15px] font-extrabold text-gray-900 leading-snug hover:text-violet-700 transition-colors flex-1">
              {a.title}
            </a>
          ) : (
            <p className="text-[15px] font-extrabold text-gray-900 leading-snug flex-1">{a.title}</p>
          )}
          {a.status === "Active" ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 flex-shrink-0 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-500 border border-red-100 flex-shrink-0 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Expired
            </span>
          )}
        </div>

        {/* Teacher + Subject chips */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <div className="flex items-center gap-1.5 bg-violet-50 border border-violet-100 rounded-full pl-1 pr-2.5 py-1">
            <div className={`w-5 h-5 rounded-full ${teacherColor(a.teacher_name)} text-white text-[8px] font-extrabold flex items-center justify-center flex-shrink-0`}>
              {initials(a.teacher_name)}
            </div>
            <span className="text-[11px] font-semibold text-violet-700 leading-none">{a.teacher_name || "—"}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full pl-1 pr-2.5 py-1">
            <div className={`w-5 h-5 rounded-full ${subjectColor(a.subject_name)} text-white text-[8px] font-extrabold flex items-center justify-center flex-shrink-0`}>
              {initials(a.subject_name)}
            </div>
            <span className="text-[11px] font-semibold text-gray-600 leading-none">{a.subject_name || "General"}</span>
          </div>
        </div>

        {/* Due date */}
        <div className="flex items-center gap-1.5 mb-4">
          <Calendar size={12} className="text-gray-400 flex-shrink-0" />
          <span className="text-xs text-gray-400">
            {a.due_date
              ? new Date(a.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              : "No due date"}
          </span>
          {days !== null && (
            <span className={`text-[11px] font-bold ${dueBadge(days)}`}>· {dueLabel(days)}</span>
          )}
        </div>

      {/* Action row */}
      <div className="flex items-center gap-2">
        {a.file_url ? (
          <a href={a.file_url} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 text-white text-xs font-bold shadow-sm shadow-violet-200 hover:opacity-90 transition-opacity active:scale-95">
            <Download size={14} /> Download
          </a>
        ) : (
          <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-100 text-gray-500 text-xs font-bold active:scale-95">
            <Eye size={14} /> View Details
          </button>
        )}
        <button
          onClick={() => onMarkDone(a)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 active:scale-95 transition-colors">
          <CheckCheck size={14} /> Mark Done
        </button>
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); onMenuToggle(a.id); }}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 active:scale-95"
          >
            <MoreVertical size={16} />
          </button>
          {menuOpenId === a.id && (
            <div className="absolute right-0 bottom-12 w-40 bg-white rounded-2xl shadow-2xl border border-gray-100 z-20 py-1 overflow-hidden">
              {a.file_url && (
                <a href={a.file_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 hover:bg-violet-50 active:bg-violet-100">
                  <ExternalLink size={14} /> Open Link
                </a>
              )}
              <button
                onClick={() => { navigator.clipboard?.writeText(a.file_url || window.location.href); onMenuToggle(null); }}
                className="flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 hover:bg-violet-50 active:bg-violet-100 w-full text-left"
              >
                <Link2 size={14} /> Copy Link
              </button>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate();
  const [assignments,   setAssignments]   = useState([]);
  const [resources,     setResources]     = useState([]);
  const [subjects,      setSubjects]      = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search,  setSearch]    = useState("");
  const [statusF, setStatusF]   = useState("all");
  const [subjectF,setSubjectF]  = useState("all");
  const [page, setPage]         = useState(1);
  const [activeNav, setActiveNav]     = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuId, setMenuId]           = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [submitTarget, setSubmitTarget] = useState(null);
  const [submitForm, setSubmitForm]     = useState({ student_name: "", roll_number: "" });
  const [submitting, setSubmitting]     = useState(false);

  const openSubmit = (a) => {
    setSubmitTarget(a);
    setSubmitForm({ student_name: "", roll_number: "" });
  };

  const handleSubmitDone = async (e) => {
    e.preventDefault();
    if (!/^[A-Za-z\s]+$/.test(submitForm.student_name.trim())) {
      toast.error("Name should contain letters only, no numbers");
      return;
    }
    setSubmitting(true);
    try {
      await submitAssignment(submitTarget.id, submitForm);
      toast.success("Assignment marked as complete!");
      setSubmitTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.error || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const refs = {
    dashboard:     useRef(null),
    assignments:   useRef(null),
    resources:     useRef(null),
    announcements: useRef(null),
    calendar:      useRef(null),
    about:         useRef(null),
    contact:       useRef(null),
  };

  useEffect(() => {
    Promise.all([getAssignments(), getResources(), getSubjects(), getAnnouncements()])
      .then(([a, r, s, ann]) => { setAssignments(a.data); setResources(r.data); setSubjects(s.data); setAnnouncements(ann.data); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const close = () => setMenuId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  useEffect(() => {
    if (loading) return;
    const observer = new IntersectionObserver(
      (entries) => { entries.forEach(e => { if (e.isIntersecting) setActiveNav(e.target.dataset.section); }); },
      { rootMargin: "-35% 0px -60% 0px" }
    );
    Object.entries(refs).forEach(([id, ref]) => {
      if (ref.current) { ref.current.dataset.section = id; observer.observe(ref.current); }
    });
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const scrollTo = (id) => {
    refs[id]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveNav(id);
    setSidebarOpen(false);
  };

  const filtered = assignments.filter((a) => {
    const q = search.toLowerCase();
    return (
      (!q || a.title.toLowerCase().includes(q) ||
        (a.teacher_name||"").toLowerCase().includes(q) ||
        (a.subject_name||"").toLowerCase().includes(q)) &&
      (statusF === "all" || a.status === statusF) &&
      (subjectF === "all" || String(a.subject_id) === subjectF)
    );
  });

  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = filtered.length > visible.length;

  const stats = {
    total:   assignments.length,
    active:  assignments.filter(a => a.status === "Active").length,
    expired: assignments.filter(a => a.status === "Expired").length,
  };

  const upcoming   = assignments.filter(a => a.status === "Active").sort((a, b) => new Date(a.due_date) - new Date(b.due_date)).slice(0, 5);
  const quickRes   = resources.slice(0, 4);
  const quote      = QUOTES[Math.floor(Date.now() / 86400000) % QUOTES.length];

  // ── Sidebar Component ───────────────────────────────────────────────────────
  function Sidebar() {
    return (
      <div className="flex flex-col h-full">
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-md">
              <GraduationCap size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">College Portal</p>
              <p className="text-xs text-gray-400">Assignments</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_SIDEBAR.map(({ id, icon: Icon, label }) => {
            const isActive = activeNav === id;
            return (
              <button key={id} onClick={() => scrollTo(id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all text-left relative ${
                  isActive ? "bg-violet-50 text-violet-700" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                }`}>
                {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-violet-600 rounded-r-full" />}
                <Icon size={18} className={isActive ? "text-violet-600" : ""} />
                {label}
              </button>
            );
          })}
          <div className="pt-3 mt-3 border-t border-gray-100 space-y-0.5">
            {NAV_SIDEBAR_BOTTOM.map(({ id, icon: Icon, label }) => {
              const isActive = activeNav === id;
              return (
                <button key={id} onClick={() => scrollTo(id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                    isActive ? "bg-violet-50 text-violet-700" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                  }`}>
                  <Icon size={18} className={isActive ? "text-violet-600" : ""} />
                  {label}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="px-4 py-3">
          <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-blue-50 flex items-center justify-center h-24">
            <span className="text-4xl select-none">📚🌱</span>
          </div>
        </div>

        <div className="px-3 pb-4 border-t border-gray-100 pt-3">
          <button onClick={() => navigate("/login")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 transition-colors group">
            <div className="w-9 h-9 rounded-full bg-gray-100 group-hover:bg-violet-100 flex items-center justify-center transition-colors">
              <Lock size={15} className="text-gray-400 group-hover:text-violet-600 transition-colors" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-gray-500 group-hover:text-gray-700 transition-colors">Admin Access</p>
              <p className="text-xs text-gray-300">Staff only</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F6FA]">
        <LoadingSpinner size="lg" text="Loading your assignments..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex">

      {/* ── Mobile Sidebar Drawer ── */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl z-10 flex flex-col">
            <button className="absolute top-4 right-4 p-2 rounded-xl hover:bg-gray-100 z-10" onClick={() => setSidebarOpen(false)}>
              <X size={18} />
            </button>
            <Sidebar />
          </aside>
        </div>
      )}

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 fixed inset-y-0 left-0 shadow-sm z-30">
        <Sidebar />
      </aside>

      {/* ── Main Wrapper ── */}
      <div className="flex-1 lg:ml-64 min-w-0 flex flex-col">

        {/* ── Top Header ── */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2.5 lg:hidden">
              <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
                <GraduationCap size={14} className="text-white" />
              </div>
              <span className="text-sm font-bold text-gray-900">College Portal</span>
            </div>
            <div className="hidden lg:block">
              <h1 className="text-base font-bold text-gray-900">Hello, Student! 👋</h1>
              <p className="text-xs text-gray-400">Here's what's happening with your assignments.</p>
            </div>
          </div>
        </header>

        {/* ── Mobile greeting banner ── */}
        <div className="lg:hidden bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-4">
          <p className="text-white font-bold text-base">Hello, Student! 👋</p>
          <p className="text-white/70 text-xs mt-0.5">Here's what's happening with your assignments.</p>
        </div>

        {/* ── Page content ── */}
        <div className="flex gap-6 p-3 sm:p-5 lg:p-8 pb-24 lg:pb-8">

          {/* ── Scrollable main column ── */}
          <div className="flex-1 min-w-0 space-y-4 sm:space-y-6">

            {/* Stats ── horizontal scroll on mobile, 3-col grid on desktop */}
            <div ref={refs.dashboard} className="scroll-mt-20">
              {/* Mobile horizontal scroll */}
              <div className="flex gap-3 overflow-x-auto pb-1 lg:hidden snap-x snap-mandatory scrollbar-hide -mx-3 px-3">
                {[
                  { label: "Total Assignments", value: stats.total,   icon: ClipboardList, bg: "bg-violet-50", ic: "text-violet-500", border: "border-b-violet-400", fade: "text-violet-100" },
                  { label: "Active",             value: stats.active,  icon: CheckCircle,   bg: "bg-green-50",  ic: "text-green-500",  border: "border-b-green-400",  fade: "text-green-100" },
                  { label: "Expired",            value: stats.expired, icon: XCircle,       bg: "bg-red-50",    ic: "text-red-500",    border: "border-b-red-400",    fade: "text-red-100" },
                ].map(({ label, value, icon: Icon, bg, ic, border, fade }) => (
                  <div key={label} className={`flex-shrink-0 w-44 snap-center bg-white rounded-2xl p-4 shadow-sm border border-gray-100 border-b-[3px] ${border} relative overflow-hidden`}>
                    <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-2`}>
                      <Icon size={20} className={ic} />
                    </div>
                    <p className="text-2xl font-extrabold text-gray-900 leading-none">{value}</p>
                    <p className="text-xs text-gray-400 mt-1">{label}</p>
                    <Icon size={52} className={`absolute -right-2 -bottom-2 ${fade} rotate-12`} />
                  </div>
                ))}
              </div>
              {/* Desktop 3-col grid */}
              <div className="hidden lg:grid grid-cols-3 gap-4">
                {[
                  { label: "Total Assignments", value: stats.total,   icon: ClipboardList, bg: "bg-violet-50", ic: "text-violet-500", border: "border-b-violet-400", fade: "text-violet-100" },
                  { label: "Active",             value: stats.active,  icon: CheckCircle,   bg: "bg-green-50",  ic: "text-green-500",  border: "border-b-green-400",  fade: "text-green-100" },
                  { label: "Expired",            value: stats.expired, icon: XCircle,       bg: "bg-red-50",    ic: "text-red-500",    border: "border-b-red-400",    fade: "text-red-100" },
                ].map(({ label, value, icon: Icon, bg, ic, border, fade }) => (
                  <div key={label} className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-b-[3px] ${border} relative overflow-hidden`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon size={22} className={ic} />
                      </div>
                      <div>
                        <p className="text-3xl font-extrabold text-gray-900 leading-none">{value}</p>
                        <p className="text-sm text-gray-400 mt-1">{label}</p>
                      </div>
                    </div>
                    <Icon size={64} className={`absolute -right-3 -bottom-3 ${fade} rotate-12`} />
                  </div>
                ))}
              </div>
            </div>

            {/* ── Assignments Section ── */}
            <div ref={refs.assignments} className="scroll-mt-20 bg-white rounded-2xl shadow-sm border border-gray-100">
              {/* Header */}
              <div className="px-4 sm:px-6 py-4 flex items-center justify-between border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <ClipboardList size={18} className="text-violet-600" />
                  <h2 className="font-bold text-gray-900">Assignments</h2>
                  <span className="ml-1 text-xs bg-violet-100 text-violet-700 font-semibold px-2 py-0.5 rounded-full">{filtered.length}</span>
                </div>
                <button
                  className="text-xs font-semibold text-violet-600 hover:text-violet-800 hidden sm:block"
                  onClick={() => scrollTo("assignments")}
                >View All</button>
              </div>

              {/* Search bar */}
              <div className="px-4 sm:px-6 pt-4 pb-3">
                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition"
                    placeholder="Search assignments, teachers..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  />
                  <button
                    onClick={() => setShowFilters(f => !f)}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${showFilters ? "bg-violet-100 text-violet-700" : "text-gray-400 hover:bg-gray-200"}`}
                  >
                    <SlidersHorizontal size={15} />
                  </button>
                </div>

                {/* Filter chips — collapsible */}
                {showFilters && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {/* Status chips */}
                    {["all","Active","Expired"].map(v => (
                      <button key={v}
                        onClick={() => { setStatusF(v); setPage(1); }}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          statusF === v ? "bg-violet-600 text-white shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}>
                        {v === "all" ? "All Status" : v}
                      </button>
                    ))}
                    <div className="w-px bg-gray-200 self-stretch" />
                    {/* Subject chips */}
                    <button
                      onClick={() => { setSubjectF("all"); setPage(1); }}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        subjectF === "all" ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}>
                      All Subjects
                    </button>
                    {subjects.map(s => (
                      <button key={s.id}
                        onClick={() => { setSubjectF(String(s.id)); setPage(1); }}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          subjectF === String(s.id) ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}>
                        {s.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Mobile: Cards ── */}
              <div className="lg:hidden px-4 pb-4 space-y-3">
                {visible.length === 0 ? (
                  <div className="text-center py-10">
                    <ClipboardList size={36} className="mx-auto mb-2 text-gray-200" />
                    <p className="text-sm text-gray-400">No assignments found</p>
                  </div>
                ) : (
                  visible.map(a => (
                    <AssignmentCard
                      key={a.id}
                      a={a}
                      menuOpenId={menuId}
                      onMenuToggle={(id) => setMenuId(menuId === id ? null : id)}
                      onMarkDone={openSubmit}
                    />
                  ))
                )}
                {hasMore && (
                  <button
                    onClick={() => setPage(p => p + 1)}
                    className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm font-semibold text-gray-400 hover:border-violet-300 hover:text-violet-600 transition-colors flex items-center justify-center gap-2"
                  >
                    Load More <ChevronDown size={16} />
                  </button>
                )}
              </div>

              {/* ── Desktop: Table ── */}
              <div className="hidden lg:block">
                {/* Desktop filters */}
                <div className="px-6 pb-4 flex gap-3 border-b border-gray-50">
                  <div className="relative">
                    <select className="pl-3 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-400 appearance-none"
                      value={statusF} onChange={(e) => { setStatusF(e.target.value); setPage(1); }}>
                      <option value="all">All Status</option>
                      <option value="Active">Active</option>
                      <option value="Expired">Expired</option>
                    </select>
                    <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  <div className="relative">
                    <select className="pl-3 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-400 appearance-none"
                      value={subjectF} onChange={(e) => { setSubjectF(e.target.value); setPage(1); }}>
                      <option value="all">All Subjects</option>
                      {subjects.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                    </select>
                    <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  <button className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 text-gray-400">
                    <Filter size={15} />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-50">
                        {["Subject","Teacher","Assignment","Due Date","Status","Action"].map(h => (
                          <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {visible.length === 0 ? (
                        <tr><td colSpan={6} className="px-6 py-14 text-center text-sm text-gray-400">No assignments found</td></tr>
                      ) : (
                        visible.map(a => {
                          const days = daysUntil(a.due_date);
                          return (
                            <tr key={a.id} className="hover:bg-gray-50/60 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-9 h-9 rounded-xl ${subjectColor(a.subject_name)} text-white flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                                    {initials(a.subject_name)}
                                  </div>
                                  <span className="text-sm font-medium text-gray-700 whitespace-nowrap">{a.subject_name || "—"}</span>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2">
                                  <div className={`w-8 h-8 rounded-full ${teacherColor(a.teacher_name)} text-white flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                                    {initials(a.teacher_name)}
                                  </div>
                                  <span className="text-sm text-gray-600 whitespace-nowrap">{a.teacher_name || "—"}</span>
                                </div>
                              </td>
                              <td className="px-4 py-4 max-w-[200px]">
                                {a.file_url ? (
                                  <a href={a.file_url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-violet-600 hover:underline line-clamp-2">{a.title}</a>
                                ) : (
                                  <span className="text-sm font-semibold text-gray-800">{a.title}</span>
                                )}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                                  <Calendar size={13} className="text-gray-400" />
                                  {a.due_date ? new Date(a.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                {a.status === "Active" ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Active
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Expired
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-1.5">
                                  {a.file_url ? (
                                    <a href={a.file_url} target="_blank" rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 text-xs font-semibold transition-colors">
                                      <Download size={12} /> Download
                                    </a>
                                  ) : (
                                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500 text-xs font-semibold">
                                      <Eye size={12} /> View
                                    </button>
                                  )}
                                  <div className="relative">
                                    <button onClick={(e) => { e.stopPropagation(); setMenuId(menuId === a.id ? null : a.id); }}
                                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                                      <MoreVertical size={15} />
                                    </button>
                                    {menuId === a.id && (
                                      <div className="absolute right-0 top-8 w-36 bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-1">
                                        {a.file_url && (
                                          <a href={a.file_url} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-4 py-2 text-xs text-gray-700 hover:bg-violet-50">
                                            <ExternalLink size={12} /> Open Link
                                          </a>
                                        )}
                                        <button onClick={() => { navigator.clipboard?.writeText(a.file_url || ""); setMenuId(null); }}
                                          className="flex items-center gap-2 px-4 py-2 text-xs text-gray-700 hover:bg-violet-50 w-full text-left">
                                          <Link2 size={12} /> Copy Link
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                {hasMore && (
                  <div className="px-6 py-4 border-t border-gray-50 text-center">
                    <button onClick={() => setPage(p => p + 1)}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-violet-700 transition-colors">
                      Load More <ChevronDown size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Quote Banner */}
            <div className="bg-gradient-to-r from-violet-600 to-purple-700 rounded-2xl p-5 sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
              <div className="relative flex items-center gap-4">
                <div className="flex-1">
                  <span className="text-4xl text-white/20 font-serif leading-none select-none">"</span>
                  <p className="text-white font-semibold text-sm sm:text-base mt-1 leading-relaxed">{quote.text}</p>
                  <p className="text-white/60 text-xs sm:text-sm mt-2">– {quote.author}</p>
                </div>
                <div className="text-5xl sm:text-7xl select-none flex-shrink-0 hidden sm:block">🎓</div>
              </div>
            </div>

            {/* Resources */}
            <div ref={refs.resources} className="bg-white rounded-2xl shadow-sm border border-gray-100 scroll-mt-20">
              <div className="px-4 sm:px-6 py-4 flex items-center justify-between border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <Library size={18} className="text-violet-600" />
                  <h2 className="font-bold text-gray-900">Resources</h2>
                </div>
                <span className="text-xs text-gray-400">{resources.length} total</span>
              </div>
              {resources.length === 0 ? (
                <div className="text-center py-12">
                  <Library size={36} className="mx-auto mb-2 text-gray-200" />
                  <p className="text-sm text-gray-400">No resources available yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {resources.map(r => {
                    const cfg = RES_CFG[r.type] || RES_CFG.other;
                    return (
                      <a key={r.id} href={r.resource_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-4 px-4 sm:px-6 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors group">
                        <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                          <ResIcon type={r.type} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-violet-700 transition-colors">{r.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{cfg.label}{r.subject_name ? ` · ${r.subject_name}` : ""}</p>
                        </div>
                        {r.type === "pdf"
                          ? <Download size={16} className="text-gray-300 group-hover:text-violet-600 transition-colors flex-shrink-0" />
                          : <ExternalLink size={16} className="text-gray-300 group-hover:text-violet-600 transition-colors flex-shrink-0" />}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Announcements */}
            <div ref={refs.announcements} className="bg-white rounded-2xl shadow-sm border border-gray-100 scroll-mt-20">
              <div className="px-4 sm:px-6 py-4 flex items-center justify-between border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <Megaphone size={18} className="text-violet-600" />
                  <h2 className="font-bold text-gray-900">Announcements</h2>
                </div>
                {announcements.length > 0 && (
                  <span className="text-xs bg-violet-100 text-violet-700 font-semibold px-2 py-0.5 rounded-full">{announcements.length}</span>
                )}
              </div>
              {announcements.length === 0 ? (
                <div className="text-center py-10">
                  <Megaphone size={36} className="mx-auto mb-2 text-gray-200" />
                  <p className="text-sm text-gray-400 font-medium">No announcements at this time.</p>
                  <p className="text-xs text-gray-300 mt-1">Check back later for updates from your faculty.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {announcements.map((ann) => {
                    const TYPE_STYLES = {
                      info:    { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-l-blue-400",   dot: "bg-blue-500" },
                      success: { bg: "bg-green-50",  text: "text-green-700",  border: "border-l-green-400",  dot: "bg-green-500" },
                      warning: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-l-yellow-400", dot: "bg-yellow-500" },
                      urgent:  { bg: "bg-red-50",    text: "text-red-700",    border: "border-l-red-400",    dot: "bg-red-500" },
                    };
                    const s = TYPE_STYLES[ann.type] || TYPE_STYLES.info;
                    return (
                      <div key={ann.id} className={`px-4 sm:px-6 py-4 border-l-4 ${s.border}`}>
                        <div className="flex items-start gap-3">
                          <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${s.dot}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <p className="text-sm font-bold text-gray-900">{ann.title}</p>
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${s.bg} ${s.text}`}>{ann.type}</span>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                            <p className="text-xs text-gray-400 mt-1.5">
                              {ann.created_at ? new Date(ann.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Calendar */}
            <div ref={refs.calendar} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 scroll-mt-20">
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={18} className="text-violet-600" />
                <h2 className="font-bold text-gray-900">Upcoming Deadlines</h2>
              </div>
              {upcoming.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar size={36} className="mx-auto mb-2 text-gray-200" />
                  <p className="text-sm text-gray-400">No upcoming deadlines — you're all caught up!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcoming.map(a => {
                    const d = new Date(a.due_date), days = daysUntil(a.due_date);
                    return (
                      <div key={a.id} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="w-12 text-center flex-shrink-0">
                          <p className="text-xl font-extrabold text-gray-900 leading-none">{d.getDate()}</p>
                          <p className="text-[10px] text-gray-400 uppercase font-semibold mt-0.5">{d.toLocaleString("default", { month: "short" })}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{a.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{a.subject_name || "General"}</p>
                        </div>
                        <span className={`text-xs font-bold whitespace-nowrap ${dueBadge(days)}`}>{dueLabel(days)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* About */}
            <div ref={refs.about} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 scroll-mt-20">
              <div className="flex items-center gap-2 mb-3">
                <Info size={18} className="text-violet-600" />
                <h2 className="font-bold text-gray-900">About</h2>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                College Assignment Portal is a centralized platform for students to view assignments, access study resources,
                and track upcoming deadlines. All content is managed by faculty through the admin panel.
              </p>
            </div>

            {/* Contact */}
            <div ref={refs.contact} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 scroll-mt-20">
              <div className="flex items-center gap-2 mb-3">
                <Mail size={18} className="text-violet-600" />
                <h2 className="font-bold text-gray-900">Contact</h2>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                For any queries, please reach out to your department coordinator or class teacher directly.
              </p>
            </div>
          </div>

          {/* ── Desktop Right Sidebar ── */}
          <aside className="hidden xl:flex flex-col w-72 flex-shrink-0 gap-5 sticky top-20 self-start max-h-[calc(100vh-5rem)] overflow-y-auto">
            {/* Upcoming Deadlines */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock size={15} className="text-violet-600" />
                  <h3 className="text-sm font-bold text-gray-900">Upcoming Deadlines</h3>
                </div>
                <button onClick={() => scrollTo("calendar")} className="text-xs font-semibold text-violet-600 hover:text-violet-800">View Calendar</button>
              </div>
              {upcoming.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No upcoming deadlines</p>
              ) : (
                <div className="space-y-4">
                  {upcoming.map(a => {
                    const d = new Date(a.due_date), days = daysUntil(a.due_date);
                    return (
                      <div key={a.id} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-11 bg-gray-50 rounded-xl py-2 text-center">
                          <p className="text-sm font-extrabold text-gray-900 leading-none">{d.getDate()}</p>
                          <p className="text-[10px] text-gray-400 uppercase font-semibold mt-0.5">{d.toLocaleString("default", { month: "short" })}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate">{a.title}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5 truncate">{a.subject_name || "General"}</p>
                          <p className={`text-[11px] font-bold mt-1 ${dueBadge(days)}`}>{dueLabel(days)}</p>
                        </div>
                        <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dueDot(days)}`} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </aside>
        </div>
      </div>

      {/* ── Mobile Bottom Navigation Bar ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-around px-2 py-1 safe-area-bottom">
          {NAV_BOTTOM_BAR.map(({ id, icon: Icon, label }) => {
            const isActive = activeNav === id;
            return (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-2 px-1 rounded-xl transition-all active:scale-95"
              >
                <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                  isActive ? "bg-violet-100" : ""
                }`}>
                  <Icon size={20} className={isActive ? "text-violet-600" : "text-gray-400"} />
                </div>
                <span className={`text-[10px] font-semibold leading-none ${isActive ? "text-violet-600" : "text-gray-400"}`}>
                  {label}
                </span>
              </button>
            );
          })}
          {/* More button opens sidebar */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-2 px-1 rounded-xl transition-all active:scale-95"
          >
            <div className="w-10 h-10 flex items-center justify-center rounded-xl">
              <MoreHorizontal size={20} className="text-gray-400" />
            </div>
            <span className="text-[10px] font-semibold leading-none text-gray-400">More</span>
          </button>
        </div>
      </nav>

      {/* ── Submit Assignment Modal ── */}
      {submitTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSubmitTarget(null)} />
          <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">
            {/* Handle bar (mobile) */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            <div className="p-6">
              {/* Header */}
              <div className="flex items-start gap-3 mb-5">
                <div className="w-11 h-11 rounded-2xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <CheckCheck size={20} className="text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-extrabold text-gray-900">Mark as Complete</h2>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{submitTarget.title}</p>
                </div>
                <button onClick={() => setSubmitTarget(null)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 flex-shrink-0">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmitDone} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    <span className="flex items-center gap-1.5"><User size={13} /> Your Full Name</span>
                  </label>
                  <input
                    className="input-field"
                    placeholder="e.g. Rahul Sharma"
                    value={submitForm.student_name}
                    onChange={e => setSubmitForm({ ...submitForm, student_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    <span className="flex items-center gap-1.5"><Hash size={13} /> Roll Number</span>
                  </label>
                  <input
                    className="input-field"
                    placeholder="e.g. 2023CS042"
                    value={submitForm.roll_number}
                    onChange={e => setSubmitForm({ ...submitForm, roll_number: e.target.value })}
                    required
                  />
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" className="btn-secondary flex-1" onClick={() => setSubmitTarget(null)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 text-white text-sm font-bold shadow-sm active:scale-95 disabled:opacity-60">
                    {submitting ? "Submitting..." : <><CheckCheck size={15} /> Submit</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
