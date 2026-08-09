import { apiRequest, downloadFile } from "./client";

export const adminApi = {
  getUsers: (role?: string) => apiRequest(`/api/auth/users${role ? `?role=${role}` : ""}`),
  getClasses: () => apiRequest("/api/classes"),
  createUser: <T extends object>(userData: T) =>
    apiRequest("/api/auth/users", { method: "POST", body: JSON.stringify(userData) }),
  updateUser: <T extends object>(id: number, userData: T) =>
    apiRequest(`/api/auth/users/${id}`, { method: "PUT", body: JSON.stringify(userData) }),
  deleteUser: (id: number) => apiRequest(`/api/auth/users/${id}`, { method: "DELETE" }),
  createClass: <T extends object>(classData: T) =>
    apiRequest("/api/classes", { method: "POST", body: JSON.stringify(classData) }),
  updateClass: <T extends object>(id: number, classData: T) =>
    apiRequest(`/api/classes/${id}`, { method: "PUT", body: JSON.stringify(classData) }),
  getStats: () => apiRequest("/api/admin/stats"),
  downloadStudentTemplate: () => downloadFile("/api/admin/student-template", "mau_danh_sach_hoc_sinh.csv"),
  importStudents: (classId: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiRequest(`/api/admin/import-students?class_id=${classId}`, { method: "POST", body: formData });
  },
  changePassword: <T extends object>(data: T) =>
    apiRequest("/api/auth/change-password", { method: "POST", body: JSON.stringify(data) }),
  resetPassword: (userId: number) =>
    apiRequest(`/api/auth/users/${userId}/reset-password`, { method: "POST" }),
};
