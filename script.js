// Tab Switching Logic
function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(div => div.style.display = 'none');
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(tabId).style.display = 'block';
  event.target.classList.add('active');
}

// Initialize the map
const map = L.map('map').setView([13.7753, 121.0583], 13);

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 20,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);


const jeepneyStopIcon = L.icon({
  iconUrl: '/img/jeepney_stop.png',
  iconSize: [30, 30], // size of the icon
  iconAnchor: [15, 30], // point of the icon which will correspond to marker's location
  popupAnchor: [1, -34] // point from which the popup should open
});

let routeLayer;

let currentMarker = null;
let destinationMarker = null;

// Load selected route
function loadRoute(route) {
  if (routeLayer) {
    map.removeLayer(routeLayer);
  }

  let file;
  let color;

  switch (route) {
    case 'balagtas':
      file = '/geojson_files/batangas_balagtas_route.geojson';
      color = 'blue';
      break;
    case 'alangilan':
      file = '/geojson_files/batangas_alangilan_route.geojson';
      color = 'green';
      break;
    case 'capitolio':
      file = '/geojson_files/batangas_capitolio_hospital_route.geojson';
      color = 'red';
      break;
    default:
      return;
  }

  // Load and display the GeoJSON route
  fetch(file)
    .then(response => response.json())
    .then(data => {
      routeLayer = L.geoJSON(data, {
    style: {
      color: color,
      weight: 4,
      opacity: 1
    },
    pointToLayer: function (feature, latlng) {
      const stopNum = feature.properties.stop_number;
      const label = L.divIcon({
        className: 'stop-label',
        html: `<div style="color:black; background:yellow; width:13px; border-radius:50%; padding:1px; text-align:center; padding-top:2px; font-size:8px; border:1px solid black;">${stopNum}</div>`,
        iconSize: [30, 20],
        iconAnchor: [15, 10]
      });

      return L.marker(latlng, { icon: label }).bindPopup(`Stop ${stopNum}: ${feature.properties.name || 'Jeepney Stop'}`);
    }
  }).addTo(map);
    });
}

function geocodeLocation(locationName) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`;

  return fetch(url, {
    headers: {
      'User-Agent': 'JeepFindr/1.0 (21-07362@g.batstate-u.edu.ph)' 
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    } else {
      throw new Error(`Location "${locationName}" not found.`);
    }
  });
}


function findRoute() {
  const currentInput = document.getElementById('currentLocation').value.trim();
  const destInput = document.getElementById('destination').value.trim();

  if (!currentInput || !destInput) {
    alert("Please enter both current location and destination.");
    return;
  }

  Promise.all([
    geocodeLocation(currentInput),
    geocodeLocation(destInput)
  ])
  .then(([currCoords, destCoords]) => {
    const [currLat, currLng] = currCoords;
    const [destLat, destLng] = destCoords;

    const currentPoint = L.latLng(currLat, currLng);
    const destinationPoint = L.latLng(destLat, destLng);

    const routes = [
      { name: 'balagtas', file: '/geojson_files/batangas_balagtas_route.geojson', color: '#8E1616' },
      { name: 'alangilan', file: '/geojson_files/batangas_alangilan_route.geojson', color: '#8E1616' },
      { name: 'capitolio', file: '/geojson_files/batangas_capitolio_hospital_route.geojson', color: '#8E1616' }
    ];

    let closestRoute = null;
    let shortestTotalDistance = Infinity;

    return Promise.all(routes.map(route =>
      fetch(route.file).then(res => res.json()).then(data => {
        const coords = data.features.flatMap(f => {
          if (f.geometry.type === "LineString") return f.geometry.coordinates;
          if (f.geometry.type === "Point") return [f.geometry.coordinates];
          return [];
        }).map(([lng, lat]) => L.latLng(lat, lng));

        const currentDist = Math.min(...coords.map(p => p.distanceTo(currentPoint)));
        const destDist = Math.min(...coords.map(p => p.distanceTo(destinationPoint)));
        const totalDistance = currentDist + destDist;

        if (totalDistance < shortestTotalDistance) {
          shortestTotalDistance = totalDistance;
          closestRoute = { ...route, geojson: data };
        }
      })
    )).then(() => {
      if (!closestRoute) return alert("No suitable route found.");

      document.getElementById("routeSuggestion").innerText = `Suggested Jeepney Route: Batangas - ${closestRoute.name.charAt(0).toUpperCase() + closestRoute.name.slice(1)}`;

      if (routeLayer) map.removeLayer(routeLayer);

      routeLayer = L.geoJSON(closestRoute.geojson, {
        style: {
          color: closestRoute.color,
          weight: 4,
          opacity: 1
        },
        pointToLayer: function (feature, latlng) {
          const stopNum = feature.properties.stop_number;
          const label = L.divIcon({
            className: 'stop-label',
            html: `<div style="color:black; background:yellow; width:13px; border-radius:50%; padding:1px; text-align:center; padding-top:2px; font-size:8px; border:1px solid black;">${stopNum}</div>`,
            iconSize: [30, 20],
            iconAnchor: [15, 10]
          });

          return L.marker(latlng, { icon: label }).bindPopup(`Stop ${stopNum}: ${feature.properties.name || 'Jeepney Stop'}`);
        }
      }).addTo(map);

      const currentLocation = L.icon({
        iconUrl: '/img/user_current_location.png',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [1, -34]
      });

      const destination = L.icon({
        iconUrl: '/img/destination.png',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [1, -34]
      });

      // Remove previous markers if they exist
      if (currentMarker) {
        map.removeLayer(currentMarker);
        currentMarker = null;
      }
      if (destinationMarker) {
        map.removeLayer(destinationMarker);
        destinationMarker = null;
      }

      map.setView(currentPoint, 14);
      currentMarker = L.marker(currentPoint, { icon: currentLocation }).addTo(map).bindPopup("Current Location").openPopup();
      destinationMarker = L.marker(destinationPoint, { icon: destination }).addTo(map).bindPopup("Destination").openPopup();

      // Calculate fare estimate
function calculateFare(distanceKm, passengerType) {
  let baseFare = (passengerType === 'regular') ? 13 : 11;
  if (distanceKm <= 4) return baseFare;
  const extraKm = Math.ceil(distanceKm - 4); // round up to next km
  return baseFare + (extraKm * 4);
}

const passengerType = document.getElementById("fareType").value;

// Calculate haversine distance between current and destination
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // distance in km
}

const distanceKm = haversineDistance(currLat, currLng, destLat, destLng);
const fare = calculateFare(distanceKm, passengerType);
document.getElementById("fareEstimate").innerText = 
  `Estimated Fare (${passengerType}): ₱${fare.toFixed(2)}`;

    });
  })
  .catch(err => {
    alert(err.message || "Error finding route.");
    console.error(err);
  });
}

// Try to get user's current location and autofill the currentLocation input
if ("geolocation" in navigator) {
  navigator.geolocation.getCurrentPosition(
    position => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, {
        headers: {
          'User-Agent': 'JeepFindr/1.0 (21-07362@g.batstate-u.edu.ph)'
        }
      })
        .then(response => response.json())
        .then(data => {
          const address = data.display_name;
          document.getElementById("currentLocation").value = address;
        })
        .catch(err => console.error("Reverse geocoding failed:", err));
    },
    error => console.error("Geolocation error:", error),
    { enableHighAccuracy: true }
  );
}




// // Load and display the GeoJSON route
// fetch(file)
//   .then(response => response.json())
//   .then(data => {
//     routeLayer = L.geoJSON(data, {
//     // filter: function (feature) {
//     //     return feature.geometry.type !== 'Point';
//     //   },
//   style: {
//     color: color,
//     weight: 8,
//     opacity: 1
//   },
//   pointToLayer: function (feature, latlng) {
//     const stopNum = feature.properties.stop_number;
//     const label = L.divIcon({
//       className: 'stop-label',
//       html: `<div style="color:white; background:blue; width:18px; border-radius:50%; padding:1px; text-align:center; padding-top:3px; font-size:10px; border:1px solid black;">${stopNum}</div>`,
//       iconSize: [30, 20],
//       iconAnchor: [15, 10]
//     });

//     return L.marker(latlng, { icon: label }).bindPopup(`Stop ${stopNum}: ${feature.properties.name || 'Jeepney Stop'}`);
//   }
// }).addTo(map);
//   });


// fetch('/geojson_files/batangas_balagtas_route.geojson')
//   .then(response => response.json())
//   .then(data => {
//     L.geoJSON(data, {
//       style: {
//         color: 'red',
//         weight: 5,
//         opacity: 1
//       },
//         pointToLayer: function (feature, latlng) {
//           const stopNum = feature.properties.stop_number;
//           const label = L.divIcon({
//             className: 'stop-label',
//             html: `<div style="color:white; background:red; width:18px; border-radius:50%; padding:1px; text-align:center; padding-top:3px; font-size:10px; border:1px solid black;">${stopNum}</div>`,
//             iconSize: [30, 20],
//             iconAnchor: [15, 10]
//           });

//           return L.marker(latlng, { icon: label }).bindPopup(`Stop ${stopNum}: ${feature.properties.name || 'Jeepney Stop'}`);
//         }
//     }).addTo(map);
//   });


// fetch('/geojson_files/batangas_capitolio_hospital_route.geojson')
//   .then(response => response.json())
//   .then(data => {
//     L.geoJSON(data, {
//       //   filter: function (feature) {
//       //   return feature.geometry.type !== 'Point';
//       // },
//       style: {
//         color: 'green',
//         weight: 3,
//         opacity: 1
//       },
//       pointToLayer: function (feature, latlng) {
//         const stopNum = feature.properties.stop_number;
//         const label = L.divIcon({
//           className: 'stop-label',
//           html: `<div style="color:white; background:green; width:18px; border-radius:50%; padding:1px; text-align:center; padding-top:3px; font-size:10px; border:1px solid black;">${stopNum}</div>`,
//           iconSize: [30, 20],
//           iconAnchor: [15, 10]
//         });

//         return L.marker(latlng, { icon: label }).bindPopup(`Stop ${stopNum}: ${feature.properties.name || 'Jeepney Stop'}`);
//       }
//     }).addTo(map);
//   });

