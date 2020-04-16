// Create object to hold user input of latitude/longitude coordinates
var input = {
	starting: { latitude: 0, longitude: 0 },
	destination: { latitude: 0, longitude: 0 },
};

// When Get Playlist buton is clicked, run the following function
document
	.getElementById("submit-button")
	.addEventListener("click", async function (event) {
		// Prevent page from refreshing upon button click
		event.preventDefault();

		// Get user input from fields
		var startingPoint = document.getElementById("startingPoint").value;
		var destination = document.getElementById("endPoint").value;

		// Store user input coordinates as an array split at comma [latitude, longitude]
		startingPoint = startingPoint.split(",");
		destination = destination.split(",");

		// Store user input that is stored in array in the object created above
		input = {
			starting: { latitude: startingPoint[0], longitude: startingPoint[1] },
			destination: { latitude: destination[0], longitude: destination[1] },
		};

		// Create Mapbox query URL based on user input
		var mapBoxQueryURL =
			"https://api.mapbox.com/directions/v5/mapbox/driving/" +
			input.starting.longitude +
			"%2C" +
			input.starting.latitude +
			"%3B" +
			input.destination.longitude +
			"%2C" +
			input.destination.latitude +
			"?alternatives=true&geometries=geojson&steps=true&access_token=pk.eyJ1Ijoia2F5Z3JvZyIsImEiOiJjazh2dnBueXgwMnltM3ByejY2Y3hlM25kIn0.jyN4BskKiVdTLxWbxcPWsw";

		// Call function to make Mapbox API call; await until API call is done and store response in mapResponse variable
		var mapResponse = await apiCall(mapBoxQueryURL);

		// Store trip duration from first route from API call response
		var tripDuration = mapResponse.routes[0].duration;

		// Convert duration to minutes
		var minutes = tripDuration / 60;

		// Call function to make Deezer API call; await until API call is done and store response in songs variable
		var playlistDiv = document.getElementById("playlist-div");
		var playlist = [];
		var playlistData = await createPlaylist(
			playlist,
			tripDuration,
			0,
			createDeezerUrl(0)
		);
		var playlist = playlistData.playlist;
		var playlistDuration = 0;

		playlist.forEach((e) => (playlistDuration += Number(e.duration)));
		for (let index = 0; index < playlist.length; index++) {
			const element = playlist[index];
			var songDiv = document.createElement("p");
			songDiv.textContent = element.title;
			playlistDiv.appendChild(songDiv);
		}

		// Put trip duration into HTML
		var tripDurationHTML = document.getElementById("trip-duration");
		tripDurationHTML.textContent =
			"Trip Duration: " + minutes.toFixed(2) + " minutes";
		var playlistDurationDiv = document.getElementById("playlist-duration");
		playlistDurationDiv.textContent =
			"Playlist Duration: " + (playlistDuration / 60).toFixed(2) + " minutes";
	});

async function getSongs(URL) {
	// Create query URL for Deezer API call
	var deezerQueryURL = URL;

	// Make Deezer API call; await until API call is done and store response
	var deezerResponse = await apiCall(deezerQueryURL);

	// Create array to hold song data
	var songs = [];

	// Loop through API response array and add applicable song data to new songs array
	for (var i = 0; i < deezerResponse.data.length; i++) {
		var e = deezerResponse.data[i];
		songs.push({ title: e.title, artist: e.artist.name, duration: e.duration });
	}
	return { songs: songs, next: deezerResponse.next };
}

async function createPlaylist(playlist, tripDuration, runningTotal, URL) {
	var songs = await getSongs(URL);

	for (let i = 0; i < songs.songs.length && runningTotal < tripDuration; i++) {
		playlist.push(songs.songs[i]);
		runningTotal += songs.songs[i].duration;
	}
	if (runningTotal < tripDuration) {
		await createPlaylist(
			playlist,
			tripDuration,
			runningTotal,
			createDeezerUrl(playlist.length)
		);
	}

	return { playlist: playlist, duration: runningTotal };
}
function createDeezerUrl(index) {
	return (
		"https://deezerdevs-deezer.p.rapidapi.com/search?q=eminem&index=" + index
	);
}
// API call function
function apiCall(queryURL) {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open("GET", queryURL);
		if (queryURL.includes("deezer")) {
			xhr.setRequestHeader(
				"x-rapidapi-host",
				"deezerdevs-deezer.p.rapidapi.com"
			);
			xhr.setRequestHeader(
				"x-rapidapi-key",
				"ec3c5ea0ebmsh0160b4b2056a0a1p1c3058jsn53757ea9b4b5"
			);
		}
		xhr.onload = function () {
			if (xhr.status === 200) {
				resolve(JSON.parse(xhr.responseText));
			} else {
				reject("Request failed.  Returned status of " + xhr.status);
			}
		};
		xhr.send();
	});
}
