// components/dashboard/RecentActivity.jsx

import Card from "../ui/Card";

const ACTIVITY_CONFIG = {
  expense: {
    icon: "💳",
    color: "var(--warning)",
    bgColor: "var(--warning)",
  },
  contract_payment: {
    icon: "💰",
    color: "var(--success)",
    bgColor: "var(--success)",
  },
  payroll: {
    icon: "🏦",
    color: "var(--primary)",
    bgColor: "var(--primary)",
  },
  employee: {
    icon: "👤",
    color: "var(--primary)",
    bgColor: "var(--primary)",
  },
};

function formatTimeAgo(isoString) {
  const now = new Date();
  const then = new Date(isoString);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function RecentActivity({ activities }) {
  if (!activities || activities.length === 0) {
    return (
      <Card title="Recent Activity">
        <div className="flex flex-col items-center justify-center py-8 text-[var(--muted)]">
          <span className="text-4xl mb-2">📭</span>
          <p className="text-sm">No recent activity</p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Recent Activity"
      right={
        <span className="text-sm text-[var(--muted)]">
          {activities.length} items
        </span>
      }
    >
      <div className="space-y-0">
        {activities.map((activity, i) => {
          const config =
            ACTIVITY_CONFIG[activity.type] || ACTIVITY_CONFIG.expense;
          const isLast = i === activities.length - 1;

          return (
            <div key={i} className="flex gap-3">
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-lg"
                  style={{ backgroundColor: `${config.bgColor}15` }}
                >
                  {config.icon}
                </div>
                {!isLast && (
                  <div className="w-px flex-1 bg-[var(--border)] my-1" />
                )}
              </div>

              {/* Content */}
              <div className={`flex-1 ${!isLast ? "pb-4" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text)]">
                      {activity.title}
                    </p>
                    <p className="text-xs text-[var(--muted)] mt-0.5 line-clamp-1">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {activity.project && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--primary)]/10 text-[var(--primary)]">
                          {activity.project}
                        </span>
                      )}
                      {activity.amount_display && (
                        <span
                          className="text-xs font-semibold"
                          style={{ color: config.color }}
                        >
                          {activity.amount_display}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-[var(--muted)] whitespace-nowrap shrink-0 mt-0.5">
                    {formatTimeAgo(activity.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
