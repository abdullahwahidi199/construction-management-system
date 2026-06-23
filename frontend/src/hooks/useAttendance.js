import { useState } from "react";
import instance from "../api/axiosInstance";

export default function useAttendance() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAttendance = async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `/attendance/?${queryString}` : "/attendance/";
      const res = await instance.get(url);
      return res.data;
    } catch (err) {
      const message =
        err?.response?.data || err?.message || "Failed to fetch attendance";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createAttendance = async (data) => {
    try {
      setLoading(true);
      setError(null);
      const res = await instance.post("/attendance/", data);
      return res.data;
    } catch (err) {
      const message =
        err?.response?.data || err?.message || "Failed to create attendance";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateAttendance = async (id, data) => {
    try {
      setLoading(true);
      setError(null);
      const res = await instance.put(`/attendance/${id}/`, data);
      return res.data;
    } catch (err) {
      const message =
        err?.response?.data || err?.message || "Failed to update attendance";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteAttendance = async (id) => {
    try {
      setLoading(true);
      setError(null);
      await instance.delete(`/attendance/${id}/`);
      return { success: true };
    } catch (err) {
      const message =
        err?.response?.data || err?.message || "Failed to delete attendance";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const bulkMarkAttendance = async (data) => {
    try {
      setLoading(true);
      setError(null);
      const res = await instance.post("/attendance/bulk_mark/", data);
      return res.data;
    } catch (err) {
      const message =
        err?.response?.data || err?.message || "Failed to bulk mark attendance";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyAttendance = async (date) => {
    try {
      setLoading(true);
      setError(null);
      const res = await instance.get(`/attendance/daily/?date=${date}`);
      return res.data;
    } catch (err) {
      const message =
        err?.response?.data ||
        err?.message ||
        "Failed to fetch daily attendance";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlySummary = async (employeeId, month, year) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ employee: employeeId, month, year });
      const res = await instance.get(`/attendance/summary/?${params}`);
      return res.data;
    } catch (err) {
      const message =
        err?.response?.data ||
        err?.message ||
        "Failed to fetch monthly summary";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    setError,
    fetchAttendance,
    createAttendance,
    updateAttendance,
    deleteAttendance,
    bulkMarkAttendance,
    fetchDailyAttendance,
    fetchMonthlySummary,
  };
}
