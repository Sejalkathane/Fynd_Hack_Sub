import { useEffect, useState } from 'react';
import { getProducts, placeOrder } from './api';
import ProductList from './components/ProductList';
import Cart from './components/Cart';
import OrdersPanel from './components/OrdersPanel';


export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({}); // { productId: quantity }
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text, details }
  const [ordersVersion, setOrdersVersion] = useState(0);

  async function loadProducts() {
    try {
      setProducts(await getProducts());
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function addToCart(product) {
    setCart((prev) => {
      const current = prev[product._id] || 0;
      if (current >= product.stock) return prev; // UI hint only; server decides
      return { ...prev, [product._id]: current + 1 };
    });
  }

  function changeQty(product, qty) {
    if (qty < 1) return removeFromCart(product._id);
    if (qty > product.stock) return;
    setCart((prev) => ({ ...prev, [product._id]: qty }));
  }

  function removeFromCart(id) {
    setCart((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }

  async function handlePlace() {
    if (submitting) return; // blocks double clicks
    setSubmitting(true);
    setMessage(null);

    const items = Object.entries(cart).map(([productId, quantity]) => ({
      productId,
      quantity,
    }));

    try {
      const order = await placeOrder(items);
      setMessage({ type: 'success', text: `Order ${order.reference} placed` });
      setCart({});
      setOrdersVersion((v) => v + 1);
    } catch (e) {
      setMessage({ type: 'error', text: e.message, details: e.details });
    } finally {
      await loadProducts(); // always re-fetch so stock matches the database
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-4">Commerce Order Console</h1>

      {message && (
        <div
          className={`mb-4 p-3 rounded border ${
            message.type === 'success'
              ? 'bg-green-50 border-green-300 text-green-800'
              : 'bg-red-50 border-red-300 text-red-800'
          }`}
        >
          <p className="font-medium">{message.text}</p>
          {message.details && (
            <ul className="list-disc ml-5 text-sm mt-1">
              {message.details.map((d) => (
                <li key={d.productId}>
                  {d.name}: requested {d.requested}, available {d.available}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <ProductList products={products} cart={cart} onAdd={addToCart} />
        <Cart
          products={products}
          cart={cart}
          onChangeQty={changeQty}
          onRemove={removeFromCart}
          onPlace={handlePlace}
          submitting={submitting}
        />
      </div>
      <OrdersPanel refreshKey={ordersVersion} />
    </div>
  );
}


<OrdersPanel refreshKey={ordersVersion} onChanged={loadProducts} />