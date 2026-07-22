import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import { Navbar, Footer, ProtectedRoute } from "./components";
import { CartProvider } from "./context/CartContext";
import { HomePage } from "./pages/HomePage";
import { AboutPage } from "./pages/AboutPage";
import { BuyKitPage } from "./pages/BuyKitPage";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { OrderSuccessPage } from "./pages/OrderSuccessPage";
import { RedeemKitPage } from "./pages/RedeemKitPage";

import { SponsorsPage } from "./pages/SponsorsPage";
import { FAQPage } from "./pages/FAQPage";
import { ContactPage } from "./pages/ContactPage";
import { DonationPage } from "./pages/DonationPage";
import { DonationSuccessPage } from "./pages/DonationSuccessPage";
import { PaymentPage } from "./pages/PaymentPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterVolunteerPage } from "./pages/RegisterVolunteerPage";
import { RegisterInfluencerPage } from "./pages/RegisterInfluencerPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DashboardSponsorsPage } from "./pages/DashboardSponsorsPage";
import { DashboardDonationsPage } from "./pages/DashboardDonationsPage";
import { DashboardVolunteersPage } from "./pages/DashboardVolunteersPage";
import { DashboardOrdersPage } from "./pages/DashboardOrdersPage";
import { DashboardBuddyGroupsPage } from "./pages/DashboardBuddyGroupsPage";
import { TestEmailPage } from "./pages/TestEmailPage";
import ScrollToTop from "./components/ScrollToTop";

function AppContent() {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/dashboard");

  if (isDashboard) {
    return (
      <ProtectedRoute>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/sponsors" element={<DashboardSponsorsPage />} />
          <Route
            path="/dashboard/donations"
            element={<DashboardDonationsPage />}
          />
          <Route path="/dashboard/orders" element={<DashboardOrdersPage />} />
          <Route path="/dashboard/volunteers" element={<DashboardVolunteersPage />} />
          <Route
            path="/dashboard/buddy-groups"
            element={<DashboardBuddyGroupsPage />}
          />
          <Route path="/dashboard/test-email" element={<TestEmailPage />} />
          <Route path="/dashboard/*" element={<DashboardPage />} />
        </Routes>
      </ProtectedRoute>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/buy-kit" element={<BuyKitPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-success" element={<OrderSuccessPage />} />
          <Route path="/redeem-kit" element={<RedeemKitPage />} />

          <Route path="/sponsors" element={<SponsorsPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/donate" element={<DonationPage />} />
          <Route path="/donation-success" element={<DonationSuccessPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register-volunteer" element={<RegisterVolunteerPage />} />
          <Route path="/register-influencer" element={<RegisterInfluencerPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <CartProvider>
      <Router>
        <ScrollToTop />
        <AppContent />
      </Router>
    </CartProvider>
  );
}

export default App;
