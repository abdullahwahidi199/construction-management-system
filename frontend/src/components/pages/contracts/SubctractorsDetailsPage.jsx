import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import instance from "../../../api/axiosInstance";

import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  User,
  MapPin,
  FileText,
  DollarSign,
  TrendingUp,
} from "lucide-react";

import ContractTable from "../../contracts/ContractTable";
import SubcontractorInfo from "../../contracts/SubcontractorInfo";
import SubConractorFinancialSummary from "../../contracts/SubcontractorFinancialSummary";

export default function SubcontractorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [subcontractor, setSubcontractor] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [subRes, contractsRes, summaryRes] = await Promise.all([
        instance.get(`/subcontractors/${id}/`),
        instance.get(`/subcontractors/${id}/contracts/`),
        instance.get(`/subcontractors/${id}/financial_summary/`),
      ]);

      setSubcontractor(subRes.data);

      setContracts(contractsRes.data.results || contractsRes.data);

      setSummary(summaryRes.data);
    } catch (error) {
      setError(error.userMessage || "The requested item could not be found.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20">Loading...</div>;
  }

  if (error || !subcontractor) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate("/manager/subcontractors")}
          className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--text)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to subcontractors
        </button>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-10 text-center">
          <h1 className="text-xl font-semibold text-[var(--text)]">Subcontractor not found</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {error || "The requested item could not be found."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SubcontractorInfo subcontractor={subcontractor} />

      <SubConractorFinancialSummary summary={summary} />

      <ContractTable contracts={contracts} />
    </div>
  );
}
