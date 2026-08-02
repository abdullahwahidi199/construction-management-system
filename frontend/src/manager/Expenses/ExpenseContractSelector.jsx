import { useEffect, useMemo, useState } from "react";
import { FileText, Search } from "lucide-react";
import instance from "../../api/axiosInstance";
import {
  fieldControlClass,
  fieldControlErrorClass,
  fieldErrorClass,
  fieldLabelClass,
} from "../../components/ui/formStyles.jsx";

function contractLabel(contract) {
  if (!contract) return "";
  return [contract.contract_number, contract.title].filter(Boolean).join(" - ");
}

function uniqueById(contracts) {
  const seen = new Set();
  return contracts.filter((contract) => {
    if (!contract?.id || seen.has(contract.id)) return false;
    seen.add(contract.id);
    return true;
  });
}

export default function ExpenseContractSelector({
  contracts = [],
  value = "",
  projectId = "",
  onChange,
  error,
  selectedFallback,
}) {
  const [search, setSearch] = useState("");
  const [remoteContracts, setRemoteContracts] = useState([]);

  useEffect(() => {
    const term = search.trim();
    if (term.length < 2) {
      setRemoteContracts([]);
      return undefined;
    }

    const timeout = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          status: "active",
          page_size: "100",
          search: term,
        });
        const response = await instance.get(`contracts/?${params.toString()}`, {
          skipGlobalErrorToast: true,
        });
        setRemoteContracts(response.data?.results || response.data || []);
      } catch (error) {
        setRemoteContracts([]);
      }
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [search]);

  const availableContracts = useMemo(() => {
    const selectedId = String(value || "");
    const projectScoped = [...contracts, ...remoteContracts].filter((contract) => {
      if (!projectId) return true;
      return String(contract.project || "") === String(projectId);
    });
    const withFallback =
      selectedFallback && selectedId === String(selectedFallback.id || "")
        ? [selectedFallback, ...projectScoped]
        : projectScoped;
    const term = search.trim().toLowerCase();

    return uniqueById(withFallback).filter((contract) => {
      if (!term) return true;
      return [
        contractLabel(contract),
        contract.project_name,
        contract.subcontractor_name,
        contract.status_display,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [contracts, projectId, remoteContracts, search, selectedFallback, value]);

  return (
    <div className="space-y-2">
      <label className={fieldLabelClass}>Contract</label>
      <div className="relative">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className={`${fieldControlClass} ps-10`}
          placeholder="Search active contracts"
        />
      </div>
      <div className="relative">
        <FileText className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
        <select
          value={value || ""}
          onChange={(event) => onChange?.(event.target.value)}
          className={`${fieldControlClass} ps-10 ${
            error ? fieldControlErrorClass : ""
          }`}
        >
          <option value="">No contract</option>
          {availableContracts.map((contract) => (
            <option key={contract.id} value={contract.id}>
              {contractLabel(contract)}
            </option>
          ))}
        </select>
      </div>
      {error && <p className={fieldErrorClass}>{error}</p>}
    </div>
  );
}
