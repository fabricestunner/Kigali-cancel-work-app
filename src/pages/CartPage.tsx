import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { Trash2, Calendar, MapPin, Clock, Info, Users, Loader2, Gift } from "lucide-react";
import { getAllBuddyGroups, type BuddyGroup } from "../services/buddygroup.service";

export function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, cartTotal, clearCart } =
    useCart();
  const [deliveryOption, setDeliveryOption] = useState<"pickup" | "delivery" | "buddy" | null>(null);
  const [pickupLocation, setPickupLocation] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [buddyGroups, setBuddyGroups] = useState<BuddyGroup[] | null>(null);
  const [buddyGroupsLoading, setBuddyGroupsLoading] = useState(false);
  const [buddyGroupId, setBuddyGroupId] = useState<number | null>(null);

  useEffect(() => {
    if (deliveryOption !== "buddy" || buddyGroups !== null) return;
    setBuddyGroupsLoading(true);
    getAllBuddyGroups()
      .then(setBuddyGroups)
      .catch(() => setBuddyGroups([]))
      .finally(() => setBuddyGroupsLoading(false));
  }, [deliveryOption, buddyGroups]);

  const selectedBuddyGroup = buddyGroups?.find((g) => g.id === buddyGroupId) ?? null;

  const deliveryFee = 2500;
  const totalWithDelivery = deliveryOption === "delivery" ? cartTotal + deliveryFee : cartTotal;

  // Buy 4 Get 1 Free promotion
  const totalKitQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const qualifiesForFreeKit = totalKitQuantity >= 4;
  const kitsUntilFree = 4 - totalKitQuantity;

  const pickupLocations = [
    {
      id: "bk-arena",
      name: "High Land Suit - NYARUTARAMA",
      availability: "Tuesday's and Wednesday's",
      time: "9:00 AM - 6:00 PM",
      icon: <MapPin className="w-4 h-4" />
    },
    {
      id: "kcc",
      name: "Car Free Zone",
      availability: "July 31 - August 8th",
      time: "10:00 AM - 7:00 PM",
      icon: <MapPin className="w-4 h-4" />
    }
  ];

  if (cartItems.length === 0) {
    return (
      <main className="pt-20 min-h-screen bg-surface">
        <section className="py-stack-lg px-gutter max-w-container-max mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-8 max-w-2xl mx-auto"
          >
            <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h1 className="font-['Plus_Jakarta_Sans'] text-[48px] leading-[1.1] tracking-[-0.02em] font-extrabold text-on-surface">
              Your Cart is Empty
            </h1>
            <p className="font-['Inter'] text-[18px] leading-[1.6] font-normal text-on-surface-variant">
              Looks like you haven't added any kits to your cart yet. Start shopping to join the movement!
            </p>
            <Link to="/buy-kit" className="button-primary inline-block px-8 py-4 rounded-full">
              Browse Kits
            </Link>
          </motion.div>
        </section>
      </main>
    );
  }

  return (
    <main className="pt-20 bg-surface min-h-screen">
      <section className="py-stack-lg px-gutter max-w-container-max mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8">
            <h1 className="font-['Plus_Jakarta_Sans'] text-[48px] leading-[1.1] tracking-[-0.02em] font-extrabold text-on-surface mb-2">
              Shopping Cart
            </h1>
            <p className="font-['Inter'] text-[16px] leading-[1.6] font-normal text-on-surface-variant">
              Review your selected kits before checkout
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white p-6 rounded-2xl border border-outline-variant/20 shadow-sm hover:shadow-md transition-shadow flex gap-6"
                >
                  <div className="relative">
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-28 h-28 object-cover rounded-xl"
                    />
                    <div className="absolute -top-2 -left-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded-full">
                      {item.quantity}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-['Plus_Jakarta_Sans'] text-[20px] leading-[1.3] font-semibold text-on-surface mb-2">
                      {item.product.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                        Size: {item.size}
                      </span>
                    </div>
                    <p className="font-['Inter'] text-[18px] leading-[1.6] font-bold text-primary">
                      RWF {Number(item.product.price).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <div className="flex items-center border border-outline-variant rounded-lg overflow-hidden">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        className="px-3 py-2 hover:bg-surface-container transition-colors border-r border-outline-variant"
                      >
                        −
                      </button>
                      <span className="px-4 py-2 font-['Inter'] text-sm font-semibold text-on-surface min-w-[40px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className="px-3 py-2 hover:bg-surface-container transition-colors border-l border-outline-variant"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="flex items-center gap-2 px-3 py-2 text-error hover:bg-error/5 rounded-lg transition-colors text-sm font-semibold"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white p-6 rounded-2xl border border-outline-variant/20 shadow-sm h-fit sticky top-28"
            >
              <h2 className="font-['Plus_Jakarta_Sans'] text-[24px] leading-[1.3] font-semibold text-on-surface mb-6">
                Order Summary
              </h2>

              {/* Items in Summary with Sizes */}
              <div className="mb-6 space-y-3">
                <h3 className="font-['Inter'] text-sm font-semibold text-on-surface mb-3">
                  Items ({cartItems.length})
                </h3>
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center py-2 border-b border-outline-variant/20 last:border-0"
                  >
                    <div className="flex-1">
                      <p className="font-['Inter'] text-sm font-medium text-on-surface">
                        {item.product.name}
                      </p>
                      <p className="font-['Inter'] text-xs text-on-surface-variant mt-1">
                        Size: {item.size} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-['Inter'] text-sm font-semibold text-on-surface">
                      RWF {(Number(item.product.price) * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              {/* Buy 4 Get 1 Free promo */}
              <div
                className={`mb-6 p-4 rounded-xl border-2 flex items-start gap-3 ${
                  qualifiesForFreeKit
                    ? "border-amber-300 bg-amber-50"
                    : "border-outline-variant bg-surface-container/50"
                }`}
              >
                <Gift
                  className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    qualifiesForFreeKit ? "text-amber-600" : "text-on-surface-variant"
                  }`}
                />
                <div>
                  <p className="font-['Inter'] text-sm font-bold text-on-surface">
                    Buy 4 Kits, Get 1 Free
                  </p>
                  <p className="font-['Inter'] text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                    {qualifiesForFreeKit
                      ? "🎉 You qualify! A free kit claim token will be emailed to you after payment."
                      : `Add ${kitsUntilFree} more kit${kitsUntilFree !== 1 ? "s" : ""} to earn a free kit claim token.`}
                  </p>
                </div>
              </div>

              {/* Delivery Option */}
              <div className="mb-6">
                <h3 className="font-['Inter'] text-sm font-semibold text-on-surface mb-3">
                  Delivery Method
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setDeliveryOption("pickup")}
                    className={`w-full p-4 rounded-xl border-2 transition-all ${
                      deliveryOption === "pickup"
                        ? "border-primary bg-primary/5"
                        : "border-outline-variant hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-primary" />
                      <span className="font-['Inter'] text-base font-semibold text-on-surface">
                        Pick Up
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => setDeliveryOption("delivery")}
                    className={`w-full p-4 rounded-xl border-2 transition-all ${
                      deliveryOption === "delivery"
                        ? "border-primary bg-primary/5"
                        : "border-outline-variant hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-primary" />
                        <span className="font-['Inter'] text-base font-semibold text-on-surface">
                          Deliver
                        </span>
                      </div>
                      <span className="text-xs text-on-surface-variant">
                        + RWF 2,500
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => setDeliveryOption("buddy")}
                    className={`w-full p-4 rounded-xl border-2 transition-all ${
                      deliveryOption === "buddy"
                        ? "border-primary bg-primary/5"
                        : "border-outline-variant hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-primary" />
                      <span className="font-['Inter'] text-base font-semibold text-on-surface">
                        Pick Up from Buddy Team
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Delivery Address */}
              {deliveryOption === "delivery" && (
                <div className="mb-6 space-y-3">
                  <h3 className="font-['Inter'] text-sm font-semibold text-on-surface flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary" />
                    Delivery Address
                  </h3>
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter your full delivery address (street, district, landmarks…)"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition text-on-surface placeholder:text-on-surface-variant/50 font-['Inter'] text-sm resize-none"
                  />
                </div>
              )}

              {/* Buddy Group Selection */}
              {deliveryOption === "buddy" && (
                <div className="mb-6 space-y-4">
                  <h3 className="font-['Inter'] text-sm font-semibold text-on-surface flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary" />
                    Select Your Buddy Group
                  </h3>
                  {buddyGroupsLoading ? (
                    <div className="flex items-center justify-center gap-2 py-6 text-on-surface-variant">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="font-['Inter'] text-sm">Loading buddy groups…</span>
                    </div>
                  ) : buddyGroups && buddyGroups.length > 0 ? (
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {buddyGroups.map((group) => (
                        <button
                          key={group.id}
                          onClick={() => setBuddyGroupId(group.id)}
                          className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                            buddyGroupId === group.id
                              ? "border-primary bg-primary/5"
                              : "border-outline-variant hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1 text-primary">
                              <Users className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <p className="font-['Inter'] text-base font-semibold text-on-surface">
                                {group.name}
                              </p>
                              <p className="font-['Inter'] text-xs text-on-surface-variant mt-1">
                                Team Leader: {group.leader_name}
                              </p>
                            </div>
                            {buddyGroupId === group.id && (
                              <div className="mt-1">
                                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="font-['Inter'] text-sm text-on-surface-variant py-4">
                      No buddy groups are available yet. Please choose another
                      delivery method.
                    </p>
                  )}
                </div>
              )}

              {/* Pickup Information Form */}
              {deliveryOption === "pickup" && (
                <div className="mb-6 space-y-4">
                  <h3 className="font-['Inter'] text-sm font-semibold text-on-surface flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary" />
                    Select Pickup Location
                  </h3>
                  <div className="space-y-3">
                    {pickupLocations.map((location) => (
                      <button
                        key={location.id}
                        onClick={() => setPickupLocation(location.id)}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                          pickupLocation === location.id
                            ? "border-primary bg-primary/5"
                            : "border-outline-variant hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1 text-primary">
                            {location.icon}
                          </div>
                          <div className="flex-1">
                            <p className="font-['Inter'] text-base font-semibold text-on-surface">
                              {location.name}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Calendar className="w-4 h-4 text-on-surface-variant" />
                              <span className="font-['Inter'] text-xs text-on-surface-variant">
                                {location.availability}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="w-4 h-4 text-on-surface-variant" />
                              <span className="font-['Inter'] text-xs text-on-surface-variant">
                                {location.time}
                              </span>
                            </div>
                          </div>
                          {pickupLocation === location.id && (
                            <div className="mt-1">
                              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3 mb-6 pt-4 border-t border-outline-variant/20">
                <div className="flex justify-between font-['Inter'] text-[16px] leading-[1.6] font-normal text-on-surface-variant">
                  <span>Subtotal</span>
                  <span>RWF {cartTotal.toLocaleString()}</span>
                </div>
                {deliveryOption === "delivery" && (
                  <div className="flex justify-between font-['Inter'] text-[16px] leading-[1.6] font-normal text-on-surface-variant">
                    <span>Delivery Fee</span>
                    <span>RWF {deliveryFee.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-outline-variant pt-3 flex justify-between font-['Plus_Jakarta_Sans'] text-[24px] leading-[1.3] font-semibold text-on-surface">
                  <span>Total</span>
                  <span className="text-primary">
                    RWF {totalWithDelivery.toLocaleString()}
                  </span>
                </div>
              </div>
              <Link
                to="/checkout"
                state={{
                  deliveryOption,
                  pickupLocation,
                  deliveryAddress,
                  buddyGroupId,
                  buddyGroupName: selectedBuddyGroup?.name ?? "",
                  deliveryFee: deliveryOption === "delivery" ? deliveryFee : 0,
                  totalAmount: totalWithDelivery
                }}
                className="button-primary block text-center mb-3"
                onClick={(e) => {
                  if (!deliveryOption) {
                    e.preventDefault();
                    alert("Please select a delivery option");
                    return;
                  }
                  if (deliveryOption === "pickup" && !pickupLocation) {
                    e.preventDefault();
                    alert("Please select a pickup location");
                    return;
                  }
                  if (deliveryOption === "delivery" && !deliveryAddress.trim()) {
                    e.preventDefault();
                    alert("Please enter your delivery address");
                    return;
                  }
                  if (deliveryOption === "buddy" && !selectedBuddyGroup) {
                    e.preventDefault();
                    alert("Please select your buddy group");
                  }
                }}
              >
                Proceed to Checkout
              </Link>
              <button
                onClick={() => clearCart()}
                className="w-full py-3 rounded-full border-2 border-outline-variant text-on-surface hover:bg-surface-container transition font-['Inter'] text-sm font-semibold"
              >
                Clear Cart
              </button>
            </motion.div>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
