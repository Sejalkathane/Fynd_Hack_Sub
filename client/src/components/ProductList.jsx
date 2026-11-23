import { formatMoney } from '../format';

export default function ProductList({ products, cart, onAdd }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">Catalogue</h2>
      <div className="space-y-2">
        {products.map((p) => {
          const inCart = cart[p._id] || 0;
          const outOfStock = p.stock === 0;
          const maxedOut = inCart >= p.stock;

          let badge = 'bg-green-100 text-green-700';
          let label = `${p.stock} in stock`;
          if (outOfStock) {
            badge = 'bg-red-100 text-red-700';
            label = 'Out of stock';
          } else if (p.stock <= 3) {
            badge = 'bg-amber-100 text-amber-700';
            label = `Only ${p.stock} left`;
          }

          return (
            <div
              key={p._id}
              className="flex items-center justify-between border rounded-lg p-3 bg-white"
            >
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-gray-500">{formatMoney(p.priceCents)}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${badge}`}>
                  {label}
                </span>
              </div>

              <button
                onClick={() => onAdd(p)}
                disabled={outOfStock || maxedOut}
                className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm
                           disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {outOfStock ? 'Unavailable' : maxedOut ? 'Max added' : 'Add'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}