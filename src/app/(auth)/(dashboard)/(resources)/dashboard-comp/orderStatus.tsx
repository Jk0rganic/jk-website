const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "processing":
      return "#eab308"; // yellow
    case "completed":
      return "#22c55e"; // green
    case "cancelled":
      return "#ef4444"; // red
    default:
      return "#6b7280"; // gray
  }
};

export default function OrderStatus({ status }: { status?: string }) {
  const safeStatus = status ?? "unknown";

  return (
    <span
      style={{
        backgroundColor: getStatusColor(safeStatus),
        color: "white",
        padding: "6px 12px",
        borderRadius: "8px",
        fontWeight: "bold",
        textTransform: "capitalize",
        display: "inline-block",
      }}
    >
      {safeStatus}
    </span>
  );
}
