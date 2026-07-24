import { useState, useCallback } from "react";
import instance from "../api/axiosInstance";
import { getFriendlyErrorMessage } from "../utils/apiErrors";

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
      setError(getFriendlyErrorMessage(err, "Unable to load workers."));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await instance.get("/projects/");
      return res.data.results || res.data;
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "Unable to load projects."));
      throw err;
    }
  }, []);

  const fetchWorkerDetail = async (id) => {
    try {
      const res = await instance.get(`/daily-workers/${id}/detail_summary/`);
      return res.data;
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "Unable to load worker details."));
      throw err;
    }
  };

  const updateWorker = async (id, workerData) => {
    setLoading(true);
    try {
      const res = await instance.patch(`/daily-workers/${id}/`, workerData);
      return res.data;
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "Unable to save worker."));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteWorker = async (id) => {
    setLoading(true);
    try {
      await instance.delete(`/daily-workers/${id}/`);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "Unable to delete worker."));
      throw err;
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
      setError(getFriendlyErrorMessage(err, "Unable to load daily status."));
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
      setError(getFriendlyErrorMessage(err, "Unable to save attendance."));
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
      setError(getFriendlyErrorMessage(err, "Unable to create worker."));
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
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "Unable to load attendance."));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAttendance = async (id, data) => {
    try {
      const res = await instance.patch(`/worker-attendance/${id}/`, data);
      return res.data;
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "Unable to save attendance."));
      throw err;
    }
  };

  const fetchAttendanceSummary = async (params = {}) => {
    try {
      const res = await instance.get("/worker-attendance/summary/", { params });
      return res.data;
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "Unable to load attendance summary."));
      throw err;
    }
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
      setError(getFriendlyErrorMessage(err, "Unable to load payrolls."));
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
      setError(getFriendlyErrorMessage(err, "Unable to generate payroll."));
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
      setError(getFriendlyErrorMessage(err, "Unable to create payroll."));
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
      setError(getFriendlyErrorMessage(err, "Unable to save payroll."));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deletePayroll = async (id) => {
    setLoading(true);
    try {
      await instance.delete(`/worker-payroll/${id}/`);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "Unable to delete payroll."));
      throw err;
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
      setError(getFriendlyErrorMessage(err, "Unable to mark payroll as paid."));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const approvePayroll = async (id) => {
    try {
      const res = await instance.patch(`/worker-payroll/${id}/approve/`);
      return res.data;
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "Unable to approve payroll."));
      throw err;
    }
  };

  const fetchPayrollReports = async (params = {}) => {
    try {
      const res = await instance.get("/worker-payroll/reports/", { params });
      return res.data;
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "Unable to load payroll reports."));
      throw err;
    }
  };

  const fetchAdvances = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await instance.get("/worker-advances/", { params });
      return res.data.results || res.data;
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "Unable to load advances."));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createAdvance = async (data) => {
    try {
      const res = await instance.post("/worker-advances/", data);
      return res.data;
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "Unable to create advance."));
      throw err;
    }
  };

  const updateAdvance = async (id, data) => {
    try {
      const res = await instance.patch(`/worker-advances/${id}/`, data);
      return res.data;
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "Unable to save advance."));
      throw err;
    }
  };

  const deleteAdvance = async (id) => {
    try {
      await instance.delete(`/worker-advances/${id}/`);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "Unable to delete advance."));
      throw err;
    }
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
