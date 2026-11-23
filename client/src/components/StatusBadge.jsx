const COLORS = {
  PLACED: 'bg-blue-100 text-blue-700',
  PACKED: 'bg-amber-100 text-amber-700',
  SHIPPED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${COLORS[status] || 'bg-gray-100'}`}>
      {status}
    </span>
  );
}