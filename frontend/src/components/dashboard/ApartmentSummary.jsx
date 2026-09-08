import { Building2 } from "lucide-react";

import { useLanguage } from "../../hooks/useLanguage";
import Card from "../ui/Card";

const number = (value) => Number(value || 0).toLocaleString(undefined, {
  maximumFractionDigits: 2,
});

export default function ApartmentSummary({ data }) {
  const { t } = useLanguage();
  if (!data || (!data.can_view_inventory && !data.can_view_sales)) return null;
  const text = (key, fallback) => {
    const translated = t(`DashboardApartments.${key}`);
    return translated === `DashboardApartments.${key}` ? fallback : translated;
  };

  return (
    <Card title={text("title", "Apartment Sales Overview")}>
      <div className="space-y-4">
        {data.can_view_inventory && (
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              [text("totalApartments", "Total Apartments"), data.inventory?.total],
              [text("available", "Available"), data.inventory?.available],
              [text("sold", "Sold"), data.inventory?.sold],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-[var(--hover)] p-3">
                <p className="text-xs text-[var(--muted)]">{label}</p>
                <p className="mt-1 text-xl font-bold text-[var(--text)]">{value || 0}</p>
              </div>
            ))}
          </div>
        )}

        {data.can_view_sales && (
          <>
            <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text)]">
              <Building2 className="h-5 w-5 text-[var(--primary)]" />
              <span className="font-semibold">{text("totalSales", "Total Apartment Sales")}: {data.sale_count || 0}</span>
              <span className="text-[var(--muted)]">{text("unpaid", "Unpaid")}: {data.payment_status?.unpaid || 0}</span>
              <span className="text-[var(--muted)]">{text("partiallyPaid", "Partially Paid")}: {data.payment_status?.partially_paid || 0}</span>
              <span className="text-[var(--muted)]">{text("paid", "Paid")}: {data.payment_status?.paid || 0}</span>
              <span className="text-[var(--danger)]">{text("cancelled", "Cancelled")}: {data.cancelled_sale_count || 0}</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {["AFN", "USD"].map((currency) => {
                const totals = data.currencies?.[currency] || {};
                return (
                  <div key={currency} className="rounded-xl border border-[var(--border)] p-4">
                    <h4 className="font-semibold text-[var(--text)]">{currency}</h4>
                    <dl className="mt-3 space-y-2 text-sm">
                      {[
                        [text("amountSold", "Amount Sold"), totals.sales],
                        [text("received", "Received"), totals.received],
                        [text("outstanding", "Outstanding"), totals.outstanding],
                        [text("cancelledWorth", "Cancelled worth"), totals.cancelled],
                      ].map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between gap-3">
                          <dt className="text-[var(--muted)]">{label}</dt>
                          <dd className="font-semibold tabular-nums text-[var(--text)]">{number(value)} {currency}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
