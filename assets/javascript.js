// Create object to hold user input of latitude/longitude coordinates
var input = {};
var playlist = [];
var artist;
var urlIndex = 0;
var recentArtists = [];
var playlistDiv = document.getElementById("playlist-div");
var tripDurationHTML = document.getElementById("trip-duration");
var playlistDurationHTML = document.getElementById("playlist-duration");

//to connect to library to convertaddress to lat/long
var placesStart = places({
	appId: "plRUJ22SXG0U",
	apiKey: "7621bbb9b57f4f8ddb04604ff8d24a00",
	container: document.querySelector("#startingPoint"),
});

var placesEnd = places({
	appId: "plRUJ22SXG0U",
	apiKey: "7621bbb9b57f4f8ddb04604ff8d24a00",
	container: document.querySelector("#endPoint"),
});

//on event - clicking 'get playlist' button, grab lat/long from variables where stored
placesStart.on("clear", function (suggestion) {
	input.starting = "";
});

placesEnd.on("clear", function (suggestion) {
	input.destination = "";
});

placesStart.on("change", function (suggestion) {
	input.starting = suggestion.suggestion.latlng;
});

placesEnd.on("change", function (suggestion) {
	input.destination = suggestion.suggestion.latlng;
});

// Initialize Firebase
var config = {
	apiKey: "AIzaSyA2Kgq-Zt9JprHavAmXC6lkG_gQnvvBg-c",
	authDomain: "coding-bootcamp-c2d63.firebaseapp.com",
	databaseURL: "https://coding-bootcamp-c2d63.firebaseio.com",
	projectId: "coding-bootcamp-c2d63",
	storageBucket: "coding-bootcamp-c2d63.appspot.com",
};

firebase.initializeApp(config);

// Create a variable to reference the database
var database = firebase.database();

// At the initial load and subsequent value changes, get a snapshot of the stored data.
database.ref().once("value", function (snapshot) {
	var recentArtistsHTML = document.getElementById("recent-artists");
	if (!snapshot.val()) return;
	recentArtists = snapshot.val().recentArtists;
	recentArtists.length = 5;

	for (var i = 0; i < recentArtists.length; i++) {
		if (recentArtists[i]) {
			recentArtistsHTML.innerHTML += `${i + 1}: ${recentArtists[i]} </br>`;
		}
	}
});

// Grab any existing data from local storage
if (localStorage.getItem("playlist")) {
	var tripDuration = JSON.parse(localStorage.getItem("trip-duration"));
	var playlistDuration = JSON.parse(localStorage.getItem("playlist-duration"));
	playlist = JSON.parse(localStorage.getItem("playlist"));
	showData(tripDuration, playlistDuration);
} else {
	playlist = [];
}

function showData(tripDuration, playlistDuration) {
	playlistDiv.textContent = "";
	tripDurationHTML.textContent = "";
	playlistDurationHTML.textContent = "";

	// Put durations into HTML
	tripDurationHTML.textContent =
		"Trip Duration: " +
		(tripDuration < 3600
			? (tripDuration / 60).toFixed(2) + " minutes"
			: (tripDuration / 3600).toFixed(2) + " hours");
	playlistDurationHTML.textContent =
		"Playlist Duration: " +
		(playlistDuration < 3600
			? (playlistDuration / 60).toFixed(2) + " minutes"
			: (playlistDuration / 3600).toFixed(2) + " hours");

	// Put playlist into HTML
	for (let index = 0; index < playlist.length; index++) {
		const element = playlist[index];
		var songDiv = document.createElement("p");
		var time = timeString(element.duration);
		songDiv.textContent = `${element.title} by ${element.artist} - ${time}`;
		playlistDiv.appendChild(songDiv);
	}
	playlistDiv.scrollIntoView();
}

// When Get Playlist button is clicked, run the following function
document
	.getElementById("submit-button")
	.addEventListener("click", async function (event) {
		// Prevent page from refreshing upon button click
		event.preventDefault();
		document.getElementById("alert").hidden = true;
		urlIndex = 0;

		//if starting or destination fields are empty, exit the function
		if (!input.starting || !input.destination) {
			return;
		}

		artist = document.getElementById("artist").value.split(",");
		artist = artist.filter((e) => e !== "");
		if (artist.length === 0) {
			artist = [...recentArtists];
		}
		artist = artist.map((e) => e.trim().toUpperCase());
		recentArtists.unshift(...artist);
		recentArtists = recentArtists.filter((e, i, a) => a.indexOf(e) === i);
		database.ref().set({
			recentArtists: recentArtists,
		});
		artist = artist.filter((e) => e !== "");
		// Create Mapbox query URL based on user input
		var mapBoxQueryURL =
			"https://api.mapbox.com/directions/v5/mapbox/driving/" +
			input.starting.lng +
			"%2C" +
			input.starting.lat +
			"%3B" +
			input.destination.lng +
			"%2C" +
			input.destination.lat +
			"?alternatives=true&geometries=geojson&steps=true&access_token=pk.eyJ1Ijoia2F5Z3JvZyIsImEiOiJjazh2dnBueXgwMnltM3ByejY2Y3hlM25kIn0.jyN4BskKiVdTLxWbxcPWsw";

		// Call function to make Mapbox API call; await until API call is done and store response in mapResponse variable
		var mapResponse = await apiCall(mapBoxQueryURL);

		// Store trip duration from first route from API call response
		var tripDuration = mapResponse.routes[0].duration;

		playlist.length = 0;

		// Call function to make Deezer API call; await until API call is done and store response in songs variable
		var playlistDuration = await createPlaylist(tripDuration, 0);

		showData(tripDuration, playlistDuration);

		// Store playlist in local storage
		localStorage.clear();
		localStorage.setItem("playlist", JSON.stringify(playlist));
		localStorage.setItem("trip-duration", JSON.stringify(tripDuration));
		localStorage.setItem("playlist-duration", JSON.stringify(playlistDuration));
	});

async function getSongs() {
	// Create array to hold song data

	var songs = [];
	for (var i = 0; i < artist.length; i++) {
		// Create query URL for Deezer API call
		// Make Deezer API call; await until API call is done and store response
		var deezerResponse = await apiCall(
			createDeezerUrl(urlIndex * 25, artist[i])
		);

		// Loop through API response array and add applicable song data to new songs array
		for (var j = 0; j < deezerResponse.data.length; j++) {
			var e = deezerResponse.data[j];
			songs.push({
				title: e.title,
				artist: e.artist.name,
				duration: e.duration,
			});
		}
	}
	urlIndex++;
	songs.sort(() => 0.5 - Math.random());
	return songs;
}

async function createPlaylist(tripDuration, playlistDuration) {
	var songs = await getSongs();
	if (songs.length < 1) {
		document.getElementById("alert").hidden = false;
		return playlistDuration;
	}

	for (let i = 0; i < songs.length && playlistDuration < tripDuration; i++) {
		if (!playlist.find((e) => e.title === songs[i].title)) {
			playlist.push(songs[i]);
			playlistDuration += songs[i].duration;
		}
	}
	if (playlistDuration < tripDuration) {
		return createPlaylist(tripDuration, playlistDuration);
	}

	return playlistDuration;
}
function createDeezerUrl(index, artist) {
	return `https://deezerdevs-deezer.p.rapidapi.com/search?q=${artist}&index=${index}`;
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
function timeString(seconds) {
	let min = Math.floor(seconds / 60).toString();
	let sec = (seconds % 60).toString();
	sec = sec.length === 1 ? "0" + sec : sec;
	return min + ":" + sec;
}
