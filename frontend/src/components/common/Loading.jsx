export default function Loading({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div
        className="w-12 h-12 border-4 rounded-full animate-spin"
        style={{
          borderColor: "var(--border)",
          borderTopColor: "var(--primary)",
        }}
      />
      <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
        {message}
      </p>
    </div>
  );
}
