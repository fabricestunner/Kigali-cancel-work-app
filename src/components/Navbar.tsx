import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, ShoppingCart, LogIn } from "lucide-react";
import { useCart } from "../context/CartContext";
import logo from "../assets/KCW-LOGO.png";
import rotaryDistrictLogo from "../assets/RCKV-logo.png";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cartItemCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Buy Kit", href: "/buy-kit" },
    { label: "Sponsors", href: "/sponsors" },
    { label: "Donate", href: "/donate" },

    { label: "Contact", href: "/contact" },
  ];

  // Smooth-scroll to the Partners section on the home page.
  // If we're on another route, navigate home first, then scroll.
  const scrollToPartners = () => {
    const el = document.getElementById("partners");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (href !== "/#partners") return;
    e.preventDefault();
    setIsMenuOpen(false);
    if (location.pathname !== "/") {
      navigate("/");
      // Wait for the home page to mount before scrolling.
      setTimeout(scrollToPartners, 100);
    } else {
      scrollToPartners();
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-surface dark:bg-surface-container border-b border-outline-variant shadow-lg">
      <div className="max-w-container-max mx-auto px-gutter py-3 flex items-center justify-between">
        {/* Logo Section */}
        <Link to="/" className="flex items-center gap-4">
          <img
            src={rotaryDistrictLogo}
            alt="Rotary District 9150 Logo"
            className="h-14 w-auto object-contain"
          />
          <img
            src={logo}
            alt="Kigali Cancer Walk Logo"
            className="h-20 w-auto object-contain"
          />

          <span
            className="
              hidden sm:block
              font-['Plus_Jakarta_Sans']
              text-[20px]
              leading-[1.3]
              font-extrabold
              text-secondary
              opacity-100
            "
          >
            Kigali Cancer Walk 2026
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.href;

            return (
              <Link
                key={link.href}
                to={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`font-['Inter'] text-[14px] tracking-[0.05em] font-semibold transition-colors ${
                  isActive
                    ? "text-secondary border-b-2 border-secondary pb-1"
                    : "text-on-surface-variant hover:text-secondary"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Login */}
          <Link to="/login" aria-label="Login" className="group">
            <LogIn className="w-6 h-6 text-on-surface-variant group-hover:text-secondary transition-colors" />
          </Link>

          {/* Cart */}
          <Link to="/cart" className="relative group">
            <ShoppingCart className="w-6 h-6 text-on-surface-variant group-hover:text-secondary transition-colors" />

            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-secondary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {cartItemCount}
              </span>
            )}
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden"
            aria-label="Toggle Menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-on-surface" />
            ) : (
              <Menu className="w-6 h-6 text-on-surface" />
            )}
          </button>

          {/* Buy Kit Button */}
          <Link
            to="/buy-kit"
            className="button-primary hidden sm:block py-2.5 px-6"
          >
            Buy Kit
          </Link>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="lg:hidden bg-surface border-t border-outline-variant">
          <nav className="flex flex-col p-4 gap-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;

              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={(e) => {
                    if (link.href === "/#partners") {
                      handleNavClick(e, link.href);
                    } else {
                      setIsMenuOpen(false);
                    }
                  }}
                  className={`px-4 py-2 font-semibold transition-colors ${
                    isActive
                      ? "text-secondary"
                      : "text-on-surface-variant hover:text-secondary"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            <Link
              to="/buy-kit"
              onClick={() => setIsMenuOpen(false)}
              className="button-primary py-2.5 px-6 text-center mt-2"
            >
              Buy Kit
            </Link>

            <Link
              to="/login"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-2 font-semibold text-on-surface-variant hover:text-secondary"
            >
              <LogIn className="w-5 h-5" />
              Login
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
