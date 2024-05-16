import React from "react";
import FormattedDate from "./FormattedDate";
import WeatherIcon from "./WeatherIcon";
import WeatherTemperature from "./WeatherTemperature";

export default function WeatherInfo(props) {
	return (
		<div className="WeatherInfo mt-5">
			<h1 className="text mb-1">{props.data.city}</h1>
			<div className="row mb-3">
				<div className="col-7">
					<div className="d-flex">
						<ul className="mt-3">
							<FormattedDate date={props.data.date} />
							<li className="text-capitalize">{props.data.description}</li>
							<li>Humidity: {props.data.humidity}%</li>
							<li>Wind: {props.data.wind} km/h</li>
						</ul>
					</div>
				</div>
				<div className="col-3">
					<div className="row">
						<div className="col-6">
							<WeatherIcon code={props.data.icon} size={52} />
						</div>
						<div className="col-6">
							<WeatherTemperature celsius={props.data.temperature} />
						</div>{" "}
					</div>
				</div>
			</div>
		</div>
	);
}
