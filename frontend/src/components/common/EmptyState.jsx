export default function EmptyState({
  icon = "📭",
  title,
  description,
  action,
}) {
  return (
    <div className="text-center py-16">
      <div className="text-6xl mb-4">{icon}</div>
      <h3
        className="text-lg font-semibold mb-2"
        style={{ color: "var(--text)" }}
      >
        {title}
      </h3>
      <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
        {description}
      </p>
      {action}
    </div>
  );
}
