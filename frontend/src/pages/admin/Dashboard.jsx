import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, GraduationCap, FileText, Library, TrendingUp, Clock } from "lucide-react";
import { getTeachers, getSubjects, getAssignments, getResources } from "../../api/client";
import LoadingSpinner from "../../components/shared/LoadingSpinner";

function StatCard({ icon: Icon, label, value, color, to }) {
  return (
    <Link
      to={to}
      className="card p-6 flex items-center gap-4 hover:shadow-md transition-shadow group"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({ teachers: 0, subjects: 0, assignments: 0, resources: 0 });
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getTeachers(), getSubjects(), getAssignments(), getResources()])
      .then(([t, s, a, r]) => {
        setStats({
          teachers: t.data.length,
          subjects: s.data.length,
          assignments: a.data.length,
          resources: r.data.length,
        });
        setRecentAssignments(a.data.slice(-5).reverse());
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back, Admin</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Teachers" value={stats.teachers} color="bg-blue-500" to="/admin/teachers" />
        <StatCard icon={GraduationCap} label="Subjects" value={stats.subjects} color="bg-purple-500" to="/admin/subjects" />
        <StatCard icon={FileText} label="Assignments" value={stats.assignments} color="bg-green-500" to="/admin/assignments" />
        <StatCard icon={Library} label="Resources" value={stats.resources} color="bg-orange-500" to="/admin/resources" />
      </div>

      <div className="card">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Clock size={18} className="text-primary-600" />
          <h2 className="font-semibold text-gray-900">Recent Assignments</h2>
        </div>
        {recentAssignments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-10">No assignments yet.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentAssignments.map((a) => (
              <div key={a.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{a.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {a.teacher_name} &middot; {a.subject_name}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    a.status === "Active"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
