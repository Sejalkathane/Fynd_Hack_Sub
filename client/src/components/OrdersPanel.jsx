import { useEffect, useState } from 'react';
import { getOrders } from '../api';
import { formatMoney } from '../format';
import StatusBadge from './StatusBadge';
import { getOrders, changeStatus } from '../api';

export default function OrdersPanel({ refreshKey, onChanged }) {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selectedRef, setSelectedRef] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Re-fetch when search/filter changes (search waits 300ms after typing stops)
  // or when the parent says something changed (refreshKey)
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        setOrders(await getOrders(search.trim(), status));
        setError('');
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, status, refreshKey]);

  const selected = orders.find((o) => o.reference === selectedRef);


  const NEXT_ACTIONS = {
  PLACED: [
    { status: 'PACKED', label: 'Pack', style: 'bg-amber-500' },
    { status: 'CANCELLED', label: 'Cancel order', style: 'bg-red-600' },
  ],
  PACKED: [
    { status: 'SHIPPED', label: 'Ship', style: 'bg-green-600' },
    { status: 'CANCELLED', label: 'Cancel order', style: 'bg-red-600' },
  ],
  SHIPPED: [],
  CANCELLED: [],
};

async function handleAction(order, next) {
  if (acting) return;
  if (next === 'CANCELLED' && !window.confirm(`Cancel ${order.reference}? Stock will be returned.`)) {
    return;
  }
  setActing(true);
  setActionMsg(null);
  try {
    await changeStatus(order.reference, next);
    setActionMsg({ type: 'success', text: `${order.reference} is now ${next}` });
  } catch (e) {
    setActionMsg({ type: 'error', text: e.message });
  } finally {
    // always re-fetch, so the screen matches the database
    setOrders(await getOrders(search.trim(), status));
    onChanged && onChanged(); // refreshes product stock in App
    setActing(false);
  }
}


  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-3">Orders</h2>

      <div className="flex gap-3 mb-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by reference, e.g. ORD-0001"
          className="border rounded px-3 py-1.5 flex-1 bg-white"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border rounded px-3 py-1.5 bg-white"
        >
          <option value="">All statuses</option>
          <option value="PLACED">Placed</option>
          <option value="PACKED">Packed</option>
          <option value="SHIPPED">Shipped</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {error && <p className="text-red-600 mb-2">{error}</p>}

      <div className="grid gap-6 md:grid-cols-2">
        {/* LIST */}
        <div className="border rounded-lg bg-white overflow-hidden">
          {loading ? (
            <p className="p-4 text-gray-500">Loading orders...</p>
          ) : orders.length === 0 ? (
            <p className="p-4 text-gray-500">No orders found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="p-2">Reference</th>
                  <th className="p-2">Total</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr
                    key={o._id}
                    onClick={() => setSelectedRef(o.reference)}
                    className={`cursor-pointer border-t hover:bg-gray-50 ${
                      o.reference === selectedRef ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="p-2 font-medium">{o.reference}</td>
                    <td className="p-2">{formatMoney(o.totalCents)}</td>
                    <td className="p-2"><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* DETAIL */}
        <div className="border rounded-lg bg-white p-4">
          {!selected ? (
            <p className="text-gray-500">Click an order to see its details.</p>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">{selected.reference}</h3>
                <StatusBadge status={selected.status} />
              </div>

              <ul className="text-sm space-y-1 mb-3">
                {selected.items.map((i) => (
                  <li key={i.productId} className="flex justify-between">
                    <span>{i.name} x {i.quantity}</span>
                    <span>{formatMoney(i.unitPriceCents * i.quantity)}</span>
                  </li>
                ))}
              </ul>

              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Total</span>
                <span>{formatMoney(selected.totalCents)}</span>
              </div>






{actionMsg && (
  <p className={`mt-3 text-sm ${actionMsg.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
    {actionMsg.text}
  </p>
)}

{NEXT_ACTIONS[selected.status].length > 0 && (
  <div className="flex gap-2 mt-4">
    {NEXT_ACTIONS[selected.status].map((a) => (
      <button
        key={a.status}
        onClick={() => handleAction(selected, a.status)}
        disabled={acting}
        className={`px-3 py-1.5 rounded text-white text-sm disabled:opacity-50 ${a.style}`}
      >
        {a.label}
      </button>
    ))}
  </div>
)}




              <div className="mt-4">
                <p className="text-sm font-medium mb-1">Timeline</p>
                <ul className="text-sm text-gray-600 space-y-0.5">
                  {selected.history.map((h, idx) => (
                    <li key={idx}>
                      {h.status}: {new Date(h.at).toLocaleString()}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}