// src/components/contracts/FinancialSummaryCard.jsx
import Card from "../ui/Card";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  BadgeDollarSign,
  Shield,
} from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage";

function SummaryItem({
  icon: Icon,
  label,
  value,
  currency,
  color = "var(--primary)",
}) {
  const hasValue = value !== null && value !== undefined && value !== "";
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return (
    <Card className="p-4 flex items-start gap-3">
      <div
        className="p-2 rounded-lg flex-shrink-0"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon size={20} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[var(--muted)] truncate">{label}</p>
        <p className="text-lg font-bold text-[var(--text)] mt-0.5">
          {hasValue ? formatter.format(value) : "-"}
        </p>
      </div>
    </Card>
  );
}

export default function FinancialSummaryCard({ summary, currency }) {
  const { t } = useLanguage();

  if (!summary) return null;

  const hasContractValue =
    summary.original_contract_value !== null &&
    summary.original_contract_value !== undefined &&
    summary.original_contract_value !== "";
  const variationAmount = Number(summary.total_variation_amount || 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <SummaryItem
        icon={DollarSign}
        label={t("FinancialSummaryCard.originalContractValue")}
        value={summary.original_contract_value}
        currency={currency}
        color="var(--primary)"
      />
      <SummaryItem
        icon={TrendingUp}
        label={t("FinancialSummaryCard.totalVariationAmount")}
        value={summary.total_variation_amount}
        currency={currency}
        color={
          variationAmount >= 0
            ? "var(--success)"
            : "var(--danger)"
        }
      />
      <SummaryItem
        icon={BadgeDollarSign}
        label={t("FinancialSummaryCard.adjustedContractValue")}
        value={summary.adjusted_contract_value}
        currency={currency}
        color="var(--primary)"
      />
      <SummaryItem
        icon={Wallet}
        label={t("FinancialSummaryCard.totalPaid")}
        value={summary.total_paid}
        currency={currency}
        color="var(--success)"
      />
      {hasContractValue && (
        <SummaryItem
          icon={TrendingDown}
          label={t("FinancialSummaryCard.remainingAmount")}
          value={summary.remaining_amount}
          color="var(--danger)"
          currency={currency}
        />
      )}
      <SummaryItem
        icon={Shield}
        label={t("FinancialSummaryCard.retentionBalance")}
        value={summary.retention_balance}
        currency={currency}
        color="#f59e0b"
      />
      <SummaryItem
        icon={BadgeDollarSign}
        label={t("FinancialSummaryCard.totalInvoiced")}
        value={summary.total_invoiced}
        currency={currency}
        color="var(--primary)"
      />
    </div>
  );
}
