
import { formatMoney } from "../format";

export default function ProductList({ products, cart, onAdd }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Product catalogue</h2>
          <p className="mt-1 text-sm text-slate-500">
            Select products to create an order
          </p>
        </div>

        <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
          {products.length} products
        </span>
      </div>

      {products.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">
          No products available.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {products.map((product) => {
            const quantity = cart[product._id] || 0;
            const unavailable = product.stock === 0;
            const maxAdded = quantity >= product.stock;

            return (
              <div
                key={product._id}
                className="rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:shadow-sm"
              >
                <div className="mb-4 flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {product.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatMoney(product.priceCents)}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      unavailable
                        ? "bg-red-50 text-red-600"
                        : product.stock <= 5
                        ? "bg-amber-50 text-amber-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {unavailable
                      ? "Out of stock"
                      : `${product.stock} in stock`}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {quantity > 0 ? `${quantity} added` : "Not selected"}
                  </span>

                  <button
                    onClick={() => onAdd(product)}
                    disabled={unavailable || maxAdded}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                  >
                    {unavailable
                      ? "Unavailable"
                      : maxAdded
                      ? "Max added"
                      : "+ Add"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
