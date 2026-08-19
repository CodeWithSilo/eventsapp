
const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
  window.location = "login.html";
}

async function loadMap() {

  navigator.geolocation.getCurrentPosition(async(position)=>{

    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    const map = new google.maps.Map(document.getElementById("map"), {
      center: {lat, lng},
      zoom: 15
    });

    new google.maps.Marker({
      position: {lat, lng},
      map,
      title: "You"
    });

    // LOAD EVENTS
    const res = await fetch(`${BASE_URL}/events`);
    const events = await res.json();

    events.forEach(event => {

      new google.maps.Marker({
        position: {
          lat: parseFloat(event.latitude),
          lng: parseFloat(event.longitude)
        },
        map,
        title: event.title
      });

    });

  });

}

loadMap();