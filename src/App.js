import React from "react";
import Weather from "./Weather";
import "./App.css";

export default function App() {
	return (
		<div className="App text-white">
			<div className="container">
				<Weather defaultCity="Subang Jaya" />

				<footer className="text-center">
					This project was coded by{" "}
					<a
						href="https://www.linkedin.com/in/imaninamajeed/"
						target="_blank"
						rel="noopener noreferrer">
						Nur Imanina
					</a>{" "}
					and is{" "}
					<a
						href="https://github.com/imaninamajeed"
						target="_blank"
						rel="noopener noreferrer">
						available on GitHub
					</a>{" "}
					and{" "}
					<a
						href="https://nax16b-react-weather-search.netlify.app/"
						target="_blank"
						rel="noopener noreferrer">
						hosted on Netlify
					</a>
				</footer>
			</div>
		</div>
	);
}
