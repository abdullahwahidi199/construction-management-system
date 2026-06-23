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

const formatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function SummaryItem({
  icon: Icon,
  label,
  value,
  currency,
  color = "var(--primary)",
}) {
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
          {formatter.format(value || 0)}
        </p>
      </div>
    </Card>
  );
}

export default function FinancialSummaryCard({ summary, currency }) {
  if (!summary) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <SummaryItem
        icon={DollarSign}
        label="Original Contract Value"
        value={summary.original_contract_value}
        currency={currency}
        color="var(--primary)"
      />
      <SummaryItem
        icon={TrendingUp}
        label="Total Variation Amount"
        value={summary.total_variation_amount}
        currency={currency}
        color={
          summary.total_variation_amount >= 0
            ? "var(--success)"
            : "var(--danger)"
        }
      />
      <SummaryItem
        icon={BadgeDollarSign}
        label="Adjusted Contract Value"
        value={summary.adjusted_contract_value}
        currency={currency}
        color="var(--primary)"
      />
      <SummaryItem
        icon={Wallet}
        label="Total Paid"
        value={summary.total_paid}
        currency={currency}
        color="var(--success)"
      />
      <SummaryItem
        icon={TrendingDown}
        label="Remaining Amount"
        value={summary.remaining_amount}
        color="var(--danger)"
        currency={currency}
      />
      <SummaryItem
        icon={Shield}
        label="Retention Balance"
        value={summary.retention_balance}
        currency={currency}
        color="#f59e0b"
      />
      <SummaryItem
        icon={BadgeDollarSign}
        label="Total Invoiced"
        value={summary.total_invoiced}
        currency={currency}
        color="var(--primary)"
      />
    </div>
  );
}
