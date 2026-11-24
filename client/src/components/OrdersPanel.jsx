
import { useEffect, useState } from "react";
import { getOrders, changeStatus } from "../api";
import { formatMoney } from "../format";
import StatusBadge from "./StatusBadge";

export default function OrdersPanel({ refreshKey, onChanged }) {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selectedRef, setSelectedRef] = useState(null);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");

  const selected = orders.find(
    (order) => order.reference === selectedRef
  );

  // Fetch orders when search, filter or refreshKey changes
  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrders();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, status, refreshKey]);

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");

      const data = await getOrders(search.trim(), status);
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function getActions(orderStatus) {
    if (orderStatus === "PLACED") {
      return ["PACKED", "CANCELLED"];
    }

    if (orderStatus === "PACKED") {
      return ["SHIPPED", "CANCELLED"];
    }

    return [];
  }

  async function handleAction(newStatus) {
    if (!selected || acting) return;

    if (newStatus === "CANCELLED") {
      const confirmed = window.confirm(
        "Are you sure you want to cancel this order?"
      );

      if (!confirmed) return;
    }

    try {
      setActing(true);
      setError("");

      await changeStatus(selected.reference, newStatus);

      // Fetch updated order list and details
      const data = await getOrders(search.trim(), status);
      setOrders(data);

      onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setActing(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-slate-900">
          Order management
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Search, track and manage customer orders
        </p>
      </div>

      {/* Search and status filter */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <input
          type="text"
          placeholder="Search by order reference..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
        >
          <option value="">All statuses</option>
          <option value="PLACED">Placed</option>
          <option value="PACKED">Packed</option>
          <option value="SHIPPED">Shipped</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="py-8 text-center text-sm text-slate-500">
          Loading orders...
        </p>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center">
          <p className="font-medium text-slate-600">No orders found</p>
          <p className="mt-1 text-sm text-slate-400">
            Try another search or status filter
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <button
              key={order.reference}
              onClick={() => setSelectedRef(order.reference)}
              className={`flex w-full items-center justify-between gap-3 rounded-xl border p-4 text-left transition ${
                selectedRef === order.reference
                  ? "border-blue-400 bg-blue-50/50"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div>
                <p className="font-semibold text-slate-800">
                  {order.reference}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {order.items.length} product lines
                </p>
              </div>

              <div className="text-right">
                <StatusBadge status={order.status} />
                <p className="mt-2 text-sm font-semibold text-slate-800">
                  {formatMoney(order.totalCents)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selected order details */}
      {selected && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Selected order
              </p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">
                {selected.reference}
              </h3>
            </div>

            <button
              onClick={() => setSelectedRef(null)}
              className="text-sm font-medium text-slate-500 hover:text-slate-800"
            >
              Close
            </button>
          </div>

          <div className="mt-3">
            <StatusBadge status={selected.status} />
          </div>

          {/* Order items */}
          <div className="my-5 space-y-3">
            {selected.items.map((item, index) => (
              <div
                key={item.productId || index}
                className="flex justify-between gap-3 text-sm"
              >
                <div>
                  <p className="font-medium text-slate-700">
                    {item.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatMoney(item.unitPriceCents)} × {item.quantity}
                  </p>
                </div>

                <p className="font-semibold text-slate-800">
                  {formatMoney(item.unitPriceCents * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <div className="flex justify-between border-t border-slate-200 pt-4">
            <span className="font-semibold text-slate-700">
              Order total
            </span>
            <span className="text-lg font-bold text-slate-900">
              {formatMoney(selected.totalCents)}
            </span>
          </div>

          {/* Fulfilment actions */}
          <div className="mt-5 flex flex-wrap gap-2">
            {getActions(selected.status).map((action) => (
              <button
                key={action}
                onClick={() => handleAction(action)}
                disabled={acting}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50 ${
                  action === "CANCELLED"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {acting
                  ? "Please wait..."
                  : action === "PACKED"
                  ? "Mark as packed"
                  : action === "SHIPPED"
                  ? "Mark as shipped"
                  : "Cancel order"}
              </button>
            ))}
          </div>

          {/* Order history */}
          <div className="mt-6 border-t border-slate-200 pt-5">
            <h4 className="mb-3 font-semibold text-slate-800">
              Order timeline
            </h4>

            <div className="space-y-3">
              {(selected.history || []).map((entry, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-500" />

                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {entry.status}
                    </p>

                    {entry.at && (
                      <p className="text-xs text-slate-400">
                        {new Date(entry.at).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
