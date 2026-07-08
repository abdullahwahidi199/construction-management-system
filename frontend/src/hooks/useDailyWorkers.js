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

  // --- Attendance ---
  const fetchDailyStatus = useCallback(async (date) => {
    setLoading(true);
    try {
      const res = await instance.get("/worker-attendance/daily_status/", {
        params: { date },
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

  return {
    loading,
    error,
    setError,
    fetchWorkers,
    fetchDailyStatus,
    bulkMarkAttendance,
    fetchPayrolls,
    generatePayrolls,
    markPayrollPaid,
  };
}
