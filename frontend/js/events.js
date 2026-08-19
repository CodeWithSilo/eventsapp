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

    try {
        const res = await fetch(`${API_URL}/events`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(event)
        });

        if (!res.ok) {
            const errorData = await res.json();
            alert(errorData.error || "Failed to create event");
            return;
        }

        alert("Event created ✅");
        // Optionally redirect or clear the form here
    } catch (err) {
        console.error("Error creating event:", err);
        alert("Server error while creating event.");
    }
}