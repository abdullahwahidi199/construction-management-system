// components/dashboard/ContractSection.jsx

import { useLanguage } from "../../hooks/useLanguage";
import Card from "../ui/Card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const STATUS_COLORS = {
  draft: "#6b7280",
  active: "var(--primary)",
  completed: "var(--success)",
  terminated: "var(--danger)",
  cancelled: "var(--warning)",
};

// format single currency value
const formatMoney = (val, currency = "USD") => {
  if (val === null || val === undefined) return `${currency} 0`;

  const num = parseFloat(val);

  if (num >= 1000000) return `${currency} ${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${currency} ${(num / 1000).toFixed(0)}K`;

  return `${currency} ${num.toFixed(0)}`;
};

// show both currencies together
const renderDual = (usd, afn) => {
  return (
    <div className="text-sm font-bold text-[var(--text)]">
      <div>{formatMoney(usd, "USD")}</div>
      <div className="text-[var(--muted)] text-xs">
        {formatMoney(afn, "AFN")}
      </div>
    </div>
  );
};

export default function ContractSection({ contracts, subcontractors }) {
  if (!contracts) return null;
  const { t } = useLanguage();
  const STATUS_LABELS = {
    draft: t("contractSection.draft"),
    active: t("contractSection.activeStatus"),
    completed: t("contractSection.completed"),
    terminated: t("contractSection.terminated"),
    cancelled: t("contractSection.cancelled"),
  };

  const statusData = Object.entries(contracts.status_breakdown || {})
    .filter(([, count]) => count > 0)
    .map(([key, count]) => ({
      name: STATUS_LABELS[key] || key,
      value: count,
      color: STATUS_COLORS[key] || "#6b7280",
    }));

  return (
    <Card
      title={t("contractSection.title")}
      right={
        <span className="text-sm text-[var(--muted)]">
          {contracts.total_contracts} {t("contractSection.contracts")}
        </span>
      }
    >
      <div className="space-y-6">
        {/* KPI GRID */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-[var(--bg)]">
            <p className="text-xs text-[var(--muted)]">
              {t("contractSection.totalValue")}
            </p>
            {renderDual(
              contracts.total_contract_value_usd,
              contracts.total_contract_value_afn,
            )}
          </div>

          <div className="p-3 rounded-lg bg-[var(--bg)]">
            <p className="text-xs text-[var(--muted)]">
              {t("contractSection.totalPaid")}
            </p>
            <div className="text-[var(--success)]">
              {renderDual(
                contracts.total_payments_made_usd,
                contracts.total_payments_made_afn,
              )}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[var(--bg)]">
            <p className="text-xs text-[var(--muted)]">
              {t("contractSection.retentionHeld")}
            </p>
            <div className="text-[var(--warning)]">
              {renderDual(
                contracts.total_retention_held_usd,
                contracts.total_retention_held_afn,
              )}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[var(--bg)]">
            <p className="text-xs text-[var(--muted)]">
              {t("contractSection.avgCompletion")}
            </p>
            <p className="text-lg font-bold text-[var(--primary)]">
              {contracts.avg_completion}%
            </p>
          </div>
        </div>

        {/* STATUS PIE */}
        {statusData.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-[var(--muted)] mb-2">
              {t("contractSection.contractStatus")}
            </h4>

            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>

                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--text)",
                  }}
                />

                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ENDING SOON */}
        {contracts.contracts_ending_soon?.length > 0 && (
          <div className="bg-[var(--warning)]/10 border border-[var(--warning)]/20 rounded-lg p-3">
            <p className="text-xs font-semibold text-[var(--warning)] mb-2">
              ⏰ {t("contractSection.endingWithin30Days")}
            </p>

            <div className="space-y-1.5">
              {contracts.contracts_ending_soon.map((c) => (
                <div key={c.id} className="flex justify-between text-xs">
                  <span className="text-[var(--text)]">
                    {c.contract_number} — {c.title}
                  </span>
                  <span className="text-[var(--muted)]">{c.end_date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBCONTRACTORS */}
        {subcontractors && (
          <div className="border-t border-[var(--border)] pt-4">
            <h4 className="text-sm font-medium text-[var(--muted)] mb-3">
              {t("contractSection.subcontractors")}
            </h4>

            <div className="flex gap-4 mb-3">
              <div>
                <p className="text-xl font-bold">
                  {subcontractors.active_subcontractors}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  {t("contractSection.active")}
                </p>
              </div>

              <div>
                <p className="text-xl font-bold text-[var(--muted)]">
                  {subcontractors.inactive_subcontractors}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  {t("contractSection.inactive")}
                </p>
              </div>
            </div>

            {subcontractors.top_subcontractors_by_value
              ?.slice(0, 4)
              .map((sc) => (
                <div
                  key={sc.id}
                  className="flex items-center justify-between text-xs mb-2"
                >
                  <span className="text-[var(--text)]">{sc.name}</span>

                  <div className="text-right">
                    {renderDual(sc.total_value_usd, sc.total_value_afn)}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </Card>
  );
}
