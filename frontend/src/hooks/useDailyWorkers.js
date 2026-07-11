import { useState, useCallback } from "react";
import instance from "../api/axiosInstance";
export function useDailyWorkers() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- Workers ---
  const fetchWorkers = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await instance.get("/daily-workers/", { params });
      return res.data.results || res.data;
    } catch (err) {
      setError("Failed to fetch workers");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    const res = await instance.get("/projects/");
    return res.data.results || res.data;
  }, []);

  const fetchWorkerDetail = async (id) => {
    const res = await instance.get(`/daily-workers/${id}/detail_summary/`);
    return res.data;
  };

  const updateWorker = async (id, workerData) => {
    setLoading(true);
    try {
      const res = await instance.patch(`/daily-workers/${id}/`, workerData);
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  const deleteWorker = async (id) => {
    setLoading(true);
    try {
      await instance.delete(`/daily-workers/${id}/`);
    } finally {
      setLoading(false);
    }
  };

  // --- Attendance ---
  const fetchDailyStatus = useCallback(async (date, params = {}) => {
    setLoading(true);
    try {
      const res = await instance.get("/worker-attendance/daily_status/", {
        params: { date, ...params },
      });
      return res.data;
    } catch (err) {
      setError("Failed to fetch daily status");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkMarkAttendance = async (data) => {
    setLoading(true);
    try {
      const res = await instance.post("/worker-attendance/bulk_mark/", data);
      return res.data;
    } catch (err) {
      setError("Failed to save attendance");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createWorker = async (workerData) => {
    setLoading(true);
    try {
      const res = await instance.post("/daily-workers/", workerData);
      return res.data;
    } catch (err) {
      setError(err.response?.data || "Failed to create worker");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await instance.get("/worker-attendance/", { params });
      return res.data.results || res.data;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAttendance = async (id, data) => {
    const res = await instance.patch(`/worker-attendance/${id}/`, data);
    return res.data;
  };

  const fetchAttendanceSummary = async (params = {}) => {
    const res = await instance.get("/worker-attendance/summary/", { params });
    return res.data;
  };

  // Don't forget to export it at the bottom:
  // return { ..., createWorker, ... }
  // --- Payroll ---
  const fetchPayrolls = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await instance.get("/worker-payroll/", { params });
      return res.data.results || res.data;
    } catch (err) {
      setError("Failed to fetch payrolls");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const generatePayrolls = async (data) => {
    setLoading(true);
    try {
      const res = await instance.post("/worker-payroll/generate/", data);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate payroll");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createPayroll = async (data) => {
    setLoading(true);
    try {
      const res = await instance.post("/worker-payroll/", data);
      return res.data;
    } catch (err) {
      setError(err.response?.data || "Failed to create payroll");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePayroll = async (id, data) => {
    setLoading(true);
    try {
      const res = await instance.patch(`/worker-payroll/${id}/`, data);
      return res.data;
    } catch (err) {
      setError(err.response?.data || "Failed to update payroll");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deletePayroll = async (id) => {
    setLoading(true);
    try {
      await instance.delete(`/worker-payroll/${id}/`);
    } finally {
      setLoading(false);
    }
  };

  const markPayrollPaid = async (id, paymentDate) => {
    setLoading(true);
    try {
      const res = await instance.patch(`/worker-payroll/${id}/mark_paid/`, {
        payment_date: paymentDate,
      });
      return res.data;
    } catch (err) {
      setError("Failed to mark as paid");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const approvePayroll = async (id) => {
    const res = await instance.patch(`/worker-payroll/${id}/approve/`);
    return res.data;
  };

  const fetchPayrollReports = async (params = {}) => {
    const res = await instance.get("/worker-payroll/reports/", { params });
    return res.data;
  };

  const fetchAdvances = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await instance.get("/worker-advances/", { params });
      return res.data.results || res.data;
    } finally {
      setLoading(false);
    }
  }, []);

  const createAdvance = async (data) => {
    const res = await instance.post("/worker-advances/", data);
    return res.data;
  };

  const updateAdvance = async (id, data) => {
    const res = await instance.patch(`/worker-advances/${id}/`, data);
    return res.data;
  };

  const deleteAdvance = async (id) => {
    await instance.delete(`/worker-advances/${id}/`);
  };

  return {
    loading,
    error,
    setError,
    fetchWorkers,
    fetchProjects,
    fetchWorkerDetail,
    createWorker,
    updateWorker,
    deleteWorker,
    fetchAttendance,
    fetchDailyStatus,
    bulkMarkAttendance,
    updateAttendance,
    fetchAttendanceSummary,
    fetchPayrolls,
    createPayroll,
    updatePayroll,
    deletePayroll,
    generatePayrolls,
    markPayrollPaid,
    approvePayroll,
    fetchPayrollReports,
    fetchAdvances,
    createAdvance,
    updateAdvance,
    deleteAdvance,
  };
}
