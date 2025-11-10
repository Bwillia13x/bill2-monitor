import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initWebVitals } from "./lib/webVitals";

// Initialize Web Vitals monitoring
if (typeof window !== 'undefined') {
  initWebVitals();
}

createRoot(document.getElementById("root")!).render(<App />);
