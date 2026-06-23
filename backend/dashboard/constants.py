# constants.py

from decimal import Decimal


# ----------------------------
# ALERT THRESHOLDS
# ----------------------------
# Used for warnings/notifications based on financial or progress metrics
ALERT_THRESHOLDS = {
    "low_payment_ratio": Decimal("0.30"),   # < 30% paid → warning
    "high_overdue_days": 30,                # > 30 days overdue → alert
    "budget_warning": Decimal("0.80"),      # > 80% budget used → warning
}


# ----------------------------
# COMPLETION BUCKETS
# ----------------------------
# Used for grouping contracts/projects by completion %
COMPLETION_BUCKETS = [
    (0, 25, "0-25%"),
    (26, 50, "26-50%"),
    (51, 75, "51-75%"),
    (76, 99, "76-99%"),
    (100, 100, "Completed"),
]


# ----------------------------
# MAX VALUES FOR UI / PERFORMANCE
# ----------------------------
MAX_RETENTION_BAR_CHART = 12
TOP_N_SUBCONTRACTORS = 10
RECENT_ACTIVITY_LIMIT = 20
# constants.py

CACHE_TIMEOUTS = {
    # full payload (heavy aggregation)
    "FULL_DASHBOARD": 60 * 2,          # 2 min

    # medium-heavy summaries
    "EXECUTIVE_SUMMARY": 60 * 5,       # 5 min
    "FINANCIAL": 60 * 5,
    "CONTRACTS": 60 * 10,
    "SUBCONTRACTORS": 60 * 10,

    # moderately dynamic data
    "PAYMENTS": 60 * 3,
    "VARIATIONS": 60 * 10,

    # retention changes slowly
    "RETENTION": 60 * 15,

    # alerts should be fairly fresh
    "ALERTS": 60 * 1,                  # 1 min

    # activity feed must be fresh
    "ACTIVITY": 60 * 2,

    # charts depend on aggregation cost
    "CHARTS": 60 * 10,
}