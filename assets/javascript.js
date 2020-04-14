var input = {
	starting: { latitude: 0, longitude: 0 },
	destination: { latitude: 0, longitude: 0 },
};

document
	.getElementById("submit-button")
	.addEventListener("click", function (event) {
		event.preventDefault();
		var startingPoint = document.getElementById("startingPoint").value;
		var destination = document.getElementById("endPoint").value;
		startingPoint = startingPoint.split(",");
		destination = destination.split(",");
		input = {
			starting: { latitude: startingPoint[0], longitude: startingPoint[1] },
			destination: { latitude: destination[0], longitude: destination[1] },
		};
	});
