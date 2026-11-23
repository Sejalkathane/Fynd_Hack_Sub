import { formatMoney } from '../format';

export default function Cart({ products, cart, onChangeQty, onRemove, onPlace, submitting }) {
  // Turn { productId: qty } into lines with product details
  const lines = Object.entries(cart)
    .map(([id, quantity]) => {
      const product = products.find((p) => p._id === id);
      return product ? { product, quantity } : null;
    })
    .filter(Boolean);

  // This total is only a preview. The server calculates the real one.
  const total = lines.reduce((sum, l) => sum + l.product.priceCents * l.quantity, 0);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">Order</h2>

      {lines.length === 0 ? (
        <p className="text-gray-500 border rounded-lg p-4 bg-white">
          Cart is empty. Add products from the catalogue.
        </p>
      ) : (
        <div className="border rounded-lg bg-white p-3 space-y-3">
          {lines.map(({ product, quantity }) => (
            <div key={product._id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-gray-500">
                  {formatMoney(product.priceCents)} each
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onChangeQty(product, quantity - 1)}
                  className="w-7 h-7 rounded border"
                >
                  -
                </button>
                <span className="w-6 text-center">{quantity}</span>
                <button
                  onClick={() => onChangeQty(product, quantity + 1)}
                  disabled={quantity >= product.stock}
                  className="w-7 h-7 rounded border disabled:opacity-40"
                >
                  +
                </button>
                <button
                  onClick={() => onRemove(product._id)}
                  className="ml-2 text-sm text-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          <div className="flex justify-between border-t pt-3 font-semibold">
            <span>Total</span>
            <span>{formatMoney(total)}</span>
          </div>

          <button
            onClick={onPlace}
            disabled={submitting}
            className="w-full py-2 rounded bg-green-600 text-white
                       disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {submitting ? 'Placing order...' : 'Place order'}
          </button>
        </div>
      )}
    </div>
  );
}