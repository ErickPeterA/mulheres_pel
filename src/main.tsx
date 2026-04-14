import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { title } from "node:process";

createRoot(document.getElementById("root")!).render(<App />);
