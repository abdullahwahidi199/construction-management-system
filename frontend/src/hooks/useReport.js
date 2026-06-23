import { useState, useCallback } from "react";
import instance from "../api/axiosInstance";

export default function useReport(endpoint) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  const buildParams = (filters) => {
    const params = {};
    Object.entries(filters || {}).forEach(([k, v]) => {
      if (v !== "" && v !== null && v !== undefined) {
        params[k] = v;
      }
    });
    return params;
  };

  const fetchReport = useCallback(
    async (filters = {}) => {
      setLoading(true);
      setError(null);
      try {
        const res = await instance.get(endpoint, {
          params: buildParams(filters),
        });
        setData(res.data);
      } catch (err) {
        setError(err);
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [endpoint]
  );

  const exportPdf = useCallback(
    async (filters = {}, filename = "report.pdf") => {
      setExporting(true);
      setError(null);
      try {
        const res = await instance.get(endpoint, {
          params: { ...buildParams(filters), export: "pdf" },
          responseType: "blob",
        });

        const blob = new Blob([res.data], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        setError(err);
      } finally {
        setExporting(false);
      }
    },
    [endpoint]
  );

  return { data, loading, exporting, error, fetchReport, exportPdf };
}