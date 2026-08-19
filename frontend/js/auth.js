/*
if (!user) {
  window.location = "login.html";
}*/

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    // If the response is not OK (400, 401, etc.), 'data' will be the error string
    if (!res.ok) {
      alert(data || "Login failed"); 
      return;
    }

    // Success: save the object directly
    localStorage.setItem("user", JSON.stringify(data));
    window.location = "feed.html";

  } catch (err) {
    console.error("Login error:", err);
    alert("Server is down or unreachable.");
  }
}

async function register() {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const matric_no = document.getElementById("matric_no").value;

  if (!name || !email || !password || !matric_no) {
    alert("Please fill all fields");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ name, email, password, matric_no })
    });

    const data = await res.json();

    console.log("REGISTER RESPONSE:", data);

    if (!res.ok) {
      alert(data.error || data || "Registration failed");
      return;
    }

    alert("Account created ✅");

    // Redirect to login
    window.location = "login.html";

  } catch (err) {
    console.error(err);
    alert("Error creating account");
  }
}