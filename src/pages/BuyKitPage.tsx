import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useCart } from "../context/useCart";
import { ShoppingCart } from "lucide-react";
import { getStock } from "../services/stock.service";
import { getProducts } from "../services/product.service";
import type { Stock } from "../services/stock.service";
import type { Product } from "../types";

export function BuyKitPage() {
  const { addToCart, cartItems } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [stockData, setStockData] = useState<Stock[]>([]);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [products, stock] = await Promise.all([getProducts(), getStock()]);
        setProduct(products[0] ?? null);
        setStockData(stock);
      } catch (err) {
        console.error("Failed to load data", err);
        setError("Failed to load product. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStockColor = (remaining: number) => {
    if (remaining > 20) return "bg-green-100 text-green-700";
    if (remaining > 0) return "bg-orange-100 text-orange-700";
    return "bg-red-100 text-red-700";
  };

  const handleAddToCart = () => {
    if (!product) return;

    if (!selectedSize) {
      alert("Please select a size");
      return;
    }

    const available = stockData.find((s) => s.item === selectedSize)?.remaining ?? 0;

    if (available <= 0) {
      alert("This size is out of stock");
      return;
    }

    if (quantity > available) {
      alert(`Only ${available} items available`);
      return;
    }

    const stockItem = stockData.find((s) => s.item === selectedSize)!;

    addToCart(product, selectedSize, quantity, stockItem.id);
    alert("Added to cart!");
  };

  if (loading) {
    return <div className="pt-20 text-center">Loading...</div>;
  }

  if (error || !product) {
    return <div className="pt-20 text-center text-red-500">{error ?? "No product found."}</div>;
  }

  return (
    <main className="pt-20">
      <section className="py-stack-lg px-gutter max-w-container-max mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-2 gap-12"
        >
          {/* PRODUCT IMAGE */}
          <div className="rounded-2xl overflow-hidden aspect-square">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* PRODUCT DETAILS */}
          <div className="space-y-6">
            <h1 className="text-[56px] font-extrabold">{product.name}</h1>

            <p className="text-[18px] text-gray-600">{product.description}</p>

            <div className="text-4xl font-bold text-primary">
              RWF {Number(product.price).toLocaleString()}
            </div>

            {/* SIZE SELECTOR + LIVE STOCK */}
            <div className="space-y-4">
              <h3 className="text-[24px] font-semibold">Select Size</h3>

              <div className="grid grid-cols-3 gap-3">
                {stockData.map((s) => (
                  <button
                    key={s.item}
                    onClick={() => setSelectedSize(s.item)}
                    disabled={s.remaining <= 0}
                    className={`p-3 rounded-lg border-2 transition ${
                      selectedSize === s.item
                        ? "border-primary bg-primary/10"
                        : "border-gray-300"
                    } ${s.remaining <= 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="font-semibold">{s.item}</div>
                    <div
                      className={`text-xs mt-1 px-2 py-1 rounded ${getStockColor(s.remaining)}`}
                    >
                      {s.remaining} left
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* QUANTITY */}
            <div className="flex items-center gap-4">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>

              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-16 text-center border"
              />

              <button onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>

            {/* ACTIONS */}
            <div className="flex gap-4">
              <button
                onClick={handleAddToCart}
                className="button-primary flex-1 flex items-center justify-center gap-2"
              >
                <ShoppingCart />
                Add to Cart
              </button>
            </div>

            {/* BUY NOW */}
            {cartItems.length > 0 ? (
              <Link to="/cart" className="button-secondary block text-center">
                Buy Now
              </Link>
            ) : (
              <button disabled className="button-secondary opacity-50">
                Add to Cart First
              </button>
            )}
          </div>
        </motion.div>
      </section>
    </main>
  );
}
