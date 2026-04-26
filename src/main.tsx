import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const preloadLogo = () => {
	const img = new Image();
	img.src = "/lumatha-logo-new.png";
};

preloadLogo();

window.addEventListener('vite:preloadError', () => {
	window.location.reload();
});

createRoot(document.getElementById("root")!).render(<App />);

