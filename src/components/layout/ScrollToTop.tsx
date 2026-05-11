import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrolls window to top whenever the route pathname changes.
 * Render once inside <BrowserRouter>.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    // Use auto so it feels instant on navigation, not animated.
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);
  return null;
};

export default ScrollToTop;
