const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
    window.location = "login.html";
}

// ================= LOAD POSTS =================
const container = document.getElementById("feed");

async function loadPosts() {
    try {
        const res = await fetch(`${BASE_URL}/posts`);
        const posts = await res.json();

        if (!Array.isArray(posts)) {
            console.error("Not array:", posts);
            return;
        }

        container.innerHTML = "";

        posts.forEach(post => {
            container.innerHTML += `
            <div class="card">
                <h4>${post.title || "-"}</h4>
                <p><b>Location:</b> ${post.location || "-"}</p>
                <p><b>Date:</b> ${post.date || "-"} <b>Time:</b> ${post.time || "-"}</p>
                <p>${post.description || "-"}</p>
                <p>${post.caption || ""}</p>

                ${post.image ? `<img src="${BASE_URL}/uploads/${post.image}" style="width:100%; border-radius:10px;">` : ""}

                <button onclick="likePost(${post.id})">
                    ❤️ ${post.likes || 0}
                </button>
            </div>
            `;
        });

    } catch (err) {
        console.error(err);
    }
}

// ================= LIKE POST =================
async function likePost(post_id) {
    const user = JSON.parse(localStorage.getItem("user"));

    await fetch(`${BASE_URL}/posts/like/${post_id}`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ user_id: user.id })
    });

    loadPosts();
}

// ================= CREATE POST =================
async function createPost(e) {
    e.preventDefault();

    const formData = new FormData();
    const imageFile = document.getElementById("image").files[0];
    if (imageFile) {
        formData.append("image", imageFile);
    }
    
    formData.append("caption", document.getElementById("caption").value);
    formData.append("title", document.getElementById("title").value);
    formData.append("location", document.getElementById("location").value);
    formData.append("date", document.getElementById("date").value);
    formData.append("time", document.getElementById("time").value);
    formData.append("description", document.getElementById("description").value);
    formData.append("user_id", user.id);

    try {
        const res = await fetch(`${BASE_URL}/posts/upload`, {
            method: "POST",
            body: formData
        });

        if (!res.ok) {
            throw new Error("Failed to upload post");
        }

        alert("Post uploaded ✅");
        window.location = "feed.html";
    } catch (err) {
        console.error("Error creating post:", err);
        alert("Error creating post");
    }
}

// ================= INIT =================
if (container) {
    loadPosts();
}