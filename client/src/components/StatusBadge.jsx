
const COLORS = {
  PLACED: "bg-blue-50 text-blue-700 ring-blue-200",
  PACKED: "bg-amber-50 text-amber-700 ring-amber-200",
  SHIPPED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 ring-red-200",
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
        COLORS[status] || "bg-gray-100 text-gray-700 ring-gray-200"
      }`}
    >
      {status}
    </span>
  );
}
