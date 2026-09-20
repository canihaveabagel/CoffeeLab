import { createRoot } from "react-dom/client";
import SiteApp from "./SiteApp";
import "./index.css";

const root = document.getElementById("root");
if (root) createRoot(root).render(<SiteApp />);
