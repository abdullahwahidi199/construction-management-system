import { useEffect, useMemo, useState } from "react";
import instance from "../../api/axiosInstance";
import SearchableSelect from "../../components/ui/SearchableSelect";

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
      } catch {
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

  const options = availableContracts.map((contract) => ({
    value: contract.id,
    label: contractLabel(contract),
  }));

  return (
    <SearchableSelect
      label="Contract"
      value={value}
      onChange={(nextValue) => {
        const selectedContract = availableContracts.find(
          (contract) => String(contract.id) === String(nextValue),
        );
        onChange?.(nextValue, selectedContract?.project || "");
      }}
      options={options}
      placeholder="Search active contracts"
      inputValue={search}
      onInputChange={(nextValue, actionMeta) => {
        if (actionMeta.action === "input-change") {
          setSearch(nextValue);
          if (nextValue.trim().length < 2) setRemoteContracts([]);
        }
        if (actionMeta.action === "menu-close") {
          setSearch("");
          setRemoteContracts([]);
        }
      }}
      noOptionsMessage="No matching contracts"
      openMenuOnFocus
      isClearable
      error={error}
    />
  );
}
