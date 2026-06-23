import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import instance from "../../../api/axiosInstance";

import {
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

  const [subcontractor, setSubcontractor] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [summary, setSummary] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      setLoading(true);

      const [subRes, contractsRes, summaryRes] = await Promise.all([
        instance.get(`/subcontractors/${id}/`),
        instance.get(`/subcontractors/${id}/contracts/`),
        instance.get(`/subcontractors/${id}/financial_summary/`),
      ]);

      setSubcontractor(subRes.data);

      setContracts(contractsRes.data.results || contractsRes.data);

      setSummary(summaryRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <SubcontractorInfo subcontractor={subcontractor} />

      <SubConractorFinancialSummary summary={summary} />

      <ContractTable contracts={contracts} />
    </div>
  );
}
