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

    // Put trip duration into HTML
    var tripDurationHTML = document.getElementById("trip-duration");
    tripDurationHTML.textContent = Math.floor(minutes) + " minutes";

    // Call function to make Deezer API call; await until API call is done and store response in songs variable
    var playlistDiv = document.getElementById("playlist-div");
    var songs = await createPlaylist(tripDuration);

    for (let index = 0; index < songs.length; index++) {
      const element = songs[index];
      var songDiv = document.createElement("p");
      songDiv.textContent = element.title;
      playlistDiv.appendChild(songDiv);
    }

    //console.log(songs);
  });

async function getSongs() {
  // Create query URL for Deezer API call
  var deezerQueryURL =
    "https://deezerdevs-deezer.p.rapidapi.com/search?q=eminem";

  // Make Deezer API call; await until API call is done and store response
  var deezerResponse = await apiCall(deezerQueryURL);
  console.log(deezerResponse);

  // Create array to hold song data
  var songs = [];

  // Loop through API response array and add applicable song data to new songs array
  for (var i = 0; i < deezerResponse.data.length; i++) {
    var e = deezerResponse.data[i];
    songs.push({ title: e.title, artist: e.artist.name, duration: e.duration });
  }

  return songs;
}

async function createPlaylist(tripDuration) {
  //  This function creates the playlist (25)
  // Get a list of 25 songs
  // add songs to the playlist until it reaches the desired length
  // create an empty array before a while loop
  // while the total duration is less than the trip duration, continue adding songs
  // return the final array
  var songs = await getSongs();
  console.log(songs);
  var playlist = [];
  var runningTotal = 0;
  for (let i = 0; i < songs.length && runningTotal < tripDuration; i++) {
    playlist.push(songs[i]);
    runningTotal += songs[i].duration;
  }
  console.log(playlist);
  return playlist;
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
