import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.dispatchEvent(new Event("auth:logout"));
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Teachers ──────────────────────────────────────────────
export const getTeachers = () => api.get("/teachers/");
export const createTeacher = (data) => api.post("/teachers/", data);
export const updateTeacher = (id, data) => api.put(`/teachers/${id}`, data);
export const deleteTeacher = (id) => api.delete(`/teachers/${id}`);

// ── Subjects ──────────────────────────────────────────────
export const getSubjects = () => api.get("/subjects/");
export const createSubject = (data) => api.post("/subjects/", data);
export const updateSubject = (id, data) => api.put(`/subjects/${id}`, data);
export const deleteSubject = (id) => api.delete(`/subjects/${id}`);

// ── Assignments ───────────────────────────────────────────
export const getAssignments = () => api.get("/assignments/");
export const createAssignment = (data) => api.post("/assignments/", data);
export const updateAssignment = (id, data) => api.put(`/assignments/${id}`, data);
export const deleteAssignment = (id) => api.delete(`/assignments/${id}`);

// ── Resources ─────────────────────────────────────────────
export const getResources = () => api.get("/resources/");
export const createResource = (data) => api.post("/resources/", data);
export const updateResource = (id, data) => api.put(`/resources/${id}`, data);
export const deleteResource = (id) => api.delete(`/resources/${id}`);

// ── Announcements ─────────────────────────────────────────
export const getAnnouncements = () => api.get("/announcements/");
export const createAnnouncement = (data) => api.post("/announcements/", data);
export const updateAnnouncement = (id, data) => api.put(`/announcements/${id}`, data);
export const deleteAnnouncement = (id) => api.delete(`/announcements/${id}`);

// ── Submissions ───────────────────────────────────────
export const submitAssignment = (assignmentId, data) => api.post(`/submissions/assignment/${assignmentId}`, data);
export const getSubmissionsByAssignment = (assignmentId) => api.get(`/submissions/assignment/${assignmentId}`);
export const getAllSubmissions = () => api.get("/submissions/");
export const getSubmissionCounts = () => api.get("/submissions/counts");

// ── Auth ──────────────────────────────────────────────────
export const login = (data) => api.post("/auth/login", data);
export const logout = () => api.post("/auth/logout");
export const getMe = () => api.get("/auth/me");
