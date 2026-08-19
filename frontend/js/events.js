
const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
    window.location = "login.html";
}


async function createNewEvent() {

    const event = {
        title: document.getElementById("title").value,
        description: document.getElementById("description").value,
        location: document.getElementById("location").value,
        latitude: 0,
        longitude: 0,
        date: document.getElementById("date").value,
        time: document.getElementById("time").value
    };

    await fetch(`http://localhost:5000/events`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(event)
    });

    alert("Event created ✅");
}