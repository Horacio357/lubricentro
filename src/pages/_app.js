import "@/styles/normalize.css";
import "@/styles/globals.css";
import localFont from "next/font/local";

// Cargamos la fuente local
const nexa = localFont({
  src: "/fonts/nexa-regular.ttf",
  display: "swap",
});

export default function App({ Component, pageProps }) {
	return (
		<main className={nexa.className} translate="no">
			<Component {...pageProps} />
		</main>
	);
}