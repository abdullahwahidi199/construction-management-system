import { DollarSign, Wallet, TrendingUp, FileText } from "lucide-react";

function formatNumber(value, currency) {
  return new Intl.NumberFormat("en-US", {
    style: currency ? "currency" : "decimal",
    currency: currency || undefined,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export default function SubConractorFinancialSummary({ summary }) {
  if (!summary) return null;

  return (
    <div className="space-y-8">
      {Object.entries(summary).map(([currency, data]) => {
        const cards = [
          {
            title: "Total Contract Value",
            value: data.total_contract_value,
            icon: DollarSign,
          },
          {
            title: "Total Paid",
            value: data.total_paid,
            icon: Wallet,
          },
          {
            title: "Remaining",
            value: data.remaining_amount,
            icon: TrendingUp,
          },
          {
            title: "Contracts",
            value: data.total_contracts,
            icon: FileText,
          },
        ];

        return (
          <div key={currency}>
            {/* Currency Header */}
            <h2 className="text-lg font-bold text-[var(--text)] mb-4">
              {currency}
            </h2>

            {/* Cards */}
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
              {cards.map((card) => {
                const Icon = card.icon;

                return (
                  <div
                    key={card.title}
                    className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-[var(--muted)]">
                          {card.title}
                        </p>

                        <h3 className="text-2xl font-bold text-[var(--text)] mt-2">
                          {formatNumber(card.value, currency)}
                        </h3>
                      </div>

                      <Icon size={24} className="text-[var(--primary)]" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
