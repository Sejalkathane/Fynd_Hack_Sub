
import { useEffect, useState } from "react";
import { getProducts, placeOrder } from "./api";

import ProductList from "./components/ProductList";
import Cart from "./components/Cart";
import OrdersPanel from "./components/OrdersPanel";

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [refreshKey, setRefreshKey] = useState(0);

  async function loadProducts() {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      setMessage(error.message);
      setMessageType("error");
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function addToCart(product) {
    setCart((previous) => {
      const quantity = previous[product._id] || 0;

      if (quantity >= product.stock) return previous;

      return {
        ...previous,
        [product._id]: quantity + 1,
      };
    });
  }

  function changeQty(product, newQty) {
    if (newQty < 1) {
      removeFromCart(product._id);
      return;
    }

    if (newQty > product.stock) return;

    setCart((previous) => ({
      ...previous,
      [product._id]: newQty,
    }));
  }

  function removeFromCart(id) {
    setCart((previous) => {
      const updated = { ...previous };
      delete updated[id];
      return updated;
    });
  }

  async function handlePlaceOrder() {
    if (submitting || Object.keys(cart).length === 0) return;

    try {
      setSubmitting(true);
      setMessage("");

      const items = Object.entries(cart).map(
        ([productId, quantity]) => ({
          productId,
          quantity,
        })
      );

      const result = await placeOrder(items);

      setMessage(
        `Order ${result.reference} placed successfully!`
      );
      setMessageType("success");

      setCart({});
      setRefreshKey((previous) => previous + 1);
    } catch (error) {
      setMessage(error.message);
      setMessageType("error");
    } finally {
      setSubmitting(false);
      await loadProducts();
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top navigation */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white">
              C
            </div>

            <div>
              <h1 className="font-bold text-slate-900">
                Commerce Console
              </h1>
              <p className="text-xs text-slate-500">
                Store operations dashboard
              </p>
            </div>
          </div>

          <span className="hidden rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 sm:inline-flex">
            Operations workspace
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8">
        {/* Page heading */}
        <div className="mb-7">
          <p className="text-sm font-medium text-blue-600">
            OVERVIEW
          </p>

          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Order management
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Create orders, check stock and manage fulfilment in one place.
          </p>
        </div>

        {/* Success and error message */}
        {message && (
          <div
            className={`mb-6 rounded-xl border p-4 text-sm ${
              messageType === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <p>{message}</p>

              <button
                onClick={() => setMessage("")}
                className="font-bold"
                aria-label="Dismiss message"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Product and cart area */}
        <div className="grid items-start gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <ProductList
              products={products}
              cart={cart}
              onAdd={addToCart}
            />
          </div>

          <div className="lg:col-span-2">
            <Cart
              products={products}
              cart={cart}
              onChangeQty={changeQty}
              onRemove={removeFromCart}
              onPlace={handlePlaceOrder}
              submitting={submitting}
            />
          </div>
        </div>

        {/* Orders area */}
        <OrdersPanel
          refreshKey={refreshKey}
          onChanged={loadProducts}
        />

        <footer className="mt-10 border-t border-slate-200 py-5 text-center text-xs text-slate-400">
          Commerce Order Console · Store Operations
        </footer>
      </main>
    </div>
  );
}
