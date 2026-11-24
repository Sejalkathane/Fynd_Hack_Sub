// import { formatMoney } from '../format';

// export default function Cart({ products, cart, onChangeQty, onRemove, onPlace, submitting }) {
//   // Turn { productId: qty } into lines with product details
//   const lines = Object.entries(cart)
//     .map(([id, quantity]) => {
//       const product = products.find((p) => p._id === id);
//       return product ? { product, quantity } : null;
//     })
//     .filter(Boolean);

//   // This total is only a preview. The server calculates the real one.
//   const total = lines.reduce((sum, l) => sum + l.product.priceCents * l.quantity, 0);

//   return (
//     <div>
//       <h2 className="text-xl font-semibold mb-3">Order</h2>

//       {lines.length === 0 ? (
//         <p className="text-gray-500 border rounded-lg p-4 bg-white">
//           Cart is empty. Add products from the catalogue.
//         </p>
//       ) : (
//         <div className="border rounded-lg bg-white p-3 space-y-3">
//           {lines.map(({ product, quantity }) => (
//             <div key={product._id} className="flex items-center justify-between">
//               <div>
//                 <p className="font-medium">{product.name}</p>
//                 <p className="text-sm text-gray-500">
//                   {formatMoney(product.priceCents)} each
//                 </p>
//               </div>

//               <div className="flex items-center gap-2">
//                 <button
//                   onClick={() => onChangeQty(product, quantity - 1)}
//                   className="w-7 h-7 rounded border"
//                 >
//                   -
//                 </button>
//                 <span className="w-6 text-center">{quantity}</span>
//                 <button
//                   onClick={() => onChangeQty(product, quantity + 1)}
//                   disabled={quantity >= product.stock}
//                   className="w-7 h-7 rounded border disabled:opacity-40"
//                 >
//                   +
//                 </button>
//                 <button
//                   onClick={() => onRemove(product._id)}
//                   className="ml-2 text-sm text-red-600"
//                 >
//                   Remove
//                 </button>
//               </div>
//             </div>
//           ))}

//           <div className="flex justify-between border-t pt-3 font-semibold">
//             <span>Total</span>
//             <span>{formatMoney(total)}</span>
//           </div>

//           <button
//             onClick={onPlace}
//             disabled={submitting}
//             className="w-full py-2 rounded bg-green-600 text-white
//                        disabled:bg-gray-300 disabled:cursor-not-allowed"
//           >
//             {submitting ? 'Placing order...' : 'Place order'}
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }







import { formatMoney } from "../format";

export default function Cart({
  products,
  cart,
  onChangeQty,
  onRemove,
  onPlace,
  submitting,
}) {
  const cartItems = products.filter(
    (product) => cart[product._id] > 0
  );

  const total = cartItems.reduce(
    (sum, product) => sum + product.priceCents * cart[product._id],
    0
  );

  return (
    <div className="bg-white p-5 rounded-xl border">
      <h2 className="text-xl font-bold mb-4">Your Cart</h2>

      {cartItems.length === 0 ? (
        <p className="text-gray-500">Your cart is empty.</p>
      ) : (
        <>
          {cartItems.map((product) => (
            <div
              key={product._id}
              className="flex justify-between items-center border-b py-3"
            >
              <div>
                <h3 className="font-medium">{product.name}</h3>
                <p className="text-sm text-gray-500">
                  {formatMoney(product.priceCents)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    onChangeQty(product, cart[product._id] - 1)
                  }
                  className="border px-2 rounded"
                >
                  -
                </button>

                <span>{cart[product._id]}</span>

                <button
                  onClick={() =>
                    onChangeQty(product, cart[product._id] + 1)
                  }
                  disabled={cart[product._id] >= product.stock}
                  className="border px-2 rounded disabled:opacity-40"
                >
                  +
                </button>

                <button
                  onClick={() => onRemove(product._id)}
                  className="text-red-600 ml-2"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          <div className="flex justify-between font-bold mt-5">
            <span>Total</span>
            <span>{formatMoney(total)}</span>
          </div>

          <button
            onClick={onPlace}
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-2 rounded-lg mt-4 disabled:bg-gray-300"
          >
            {submitting ? "Placing Order..." : "Place Order"}
          </button>
        </>
      )}
    </div>
  );
}
