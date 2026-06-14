import { NavLink, useNavigate } from "react-router-dom";
import { BookOpen, Users, GraduationCap, FileText, Library, LayoutDashboard, LogOut, X, Menu, Megaphone, ClipboardCheck } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const NAV_ITEMS = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/admin/teachers", icon: Users, label: "Teachers" },
  { to: "/admin/subjects", icon: GraduationCap, label: "Subjects" },
  { to: "/admin/assignments", icon: FileText, label: "Assignments" },
  { to: "/admin/resources", icon: Library, label: "Resources" },
  { to: "/admin/announcements", icon: Megaphone, label: "Announcements" },
  { to: "/admin/submissions", icon: ClipboardCheck, label: "Submissions" },
];

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
            <BookOpen size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">College Portal</p>
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={isActive ? "text-primary-600" : ""} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-xl shadow-md border border-gray-200"
        onClick={() => setMobileOpen(true)}
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-white h-full shadow-2xl">
            <button
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100"
              onClick={() => setMobileOpen(false)}
            >
              <X size={18} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 fixed inset-y-0 left-0 shadow-sm">
        <SidebarContent />
      </aside>
    </>
  );
}
