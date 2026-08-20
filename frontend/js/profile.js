// Retrieve user session early
const storedUser = JSON.parse(localStorage.getItem("user"));

// Enforce Auth Check immediately
if (!storedUser || !storedUser.id) {
    window.location.href = "login.html";
}

// Utility: Safe DOM Element Text Setter
function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

// Utility: HTML Escaping to prevent broken layouts or XSS
function escapeHTML(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ================= 1. LOAD USER PROFILE =================
async function loadProfile() {
    try {
        const res = await fetch(`${BASE_URL}/auth/user/${storedUser.id}`);
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        
        const data = await res.json();

        // Update profile picture
        const profilePic = document.getElementById("profilePic");
        if (profilePic) {
            profilePic.src = data.profile_image 
                ? `${BASE_URL}/uploads/${data.profile_image}` 
                : "img/default-avatar.png";
        }

        // Populate basic info
        setText("name", data.name || "Student");
        setText("email", data.email || "-");
        setText("points", data.points ?? 0);
        setText("matric_no", data.matric_no || "-");

        // Load posts after profile loads
        await loadMyPosts();
    } catch (err) {
        console.error("Failed to load profile:", err);
    }
}

// ================= 2. UPLOAD PROFILE PICTURE =================
async function uploadProfile() {
    const fileInput = document.getElementById("profileInput");
    const file = fileInput?.files?.[0];

    if (!file) return alert("Please select an image file first.");

    const formData = new FormData();
    formData.append("image", file);
    formData.append("user_id", storedUser.id);

    try {
        const res = await fetch(`${BASE_URL}/auth/upload-profile`, {
            method: "POST",
            body: formData,
        });

        const data = await res.json();

        if (res.ok) {
            alert("Profile picture updated successfully! ✅");
            
            if (data.profile_image) {
                storedUser.profile_image = data.profile_image;
                localStorage.setItem("user", JSON.stringify(storedUser));
            }
            
            // Reset button states
            fileInput.value = "";
            const selectBtn = document.getElementById('selectBtn');
            const uploadBtn = document.getElementById('uploadBtn');
            if (selectBtn) selectBtn.innerText = "Choose Photo";
            if (uploadBtn) uploadBtn.style.display = "none";

            loadProfile(); // Reload image on UI
        } else {
            alert(data.error || "Upload failed ❌");
        }
    } catch (err) {
        console.error("Upload error:", err);
        alert("Server error uploading image. Check connection.");
    }
}

// ================= 3. LOAD USER POSTS =================
async function loadMyPosts() {
    const myPostsContainer = document.getElementById("myPosts");
    if (!myPostsContainer) return;

    try {
        const res = await fetch(`${BASE_URL}/posts/user/${storedUser.id}`);
        if (!res.ok) throw new Error("Failed to fetch user posts");

        const posts = await res.json();

        myPostsContainer.innerHTML = "";

        if (!Array.isArray(posts) || posts.length === 0) {
            myPostsContainer.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #888; width: 100%;">
                    <p>You haven't made any posts yet.</p>
                </div>
            `;
            return;
        }

        posts.forEach(post => {
            const isPrivate = post.visibility === "private";

            myPostsContainer.innerHTML += `
                <div class="post-card" id="post-${post.id}" style="border: 1px solid #ccc; padding: 15px; margin-bottom: 15px; border-radius: 8px;">
                    <p><strong>Title:</strong> ${escapeHTML(post.title || 'Untitled Post')}</p>
                    <p><strong>Description:</strong> ${escapeHTML(post.description || '-')}</p>
                    
                    ${post.image ? `<img src="${BASE_URL}/uploads/${post.image}" style="max-width: 100%; height: auto; border-radius: 5px; margin: 10px 0; display: block;">` : ''}

                    <p><strong>Location:</strong> ${escapeHTML(post.location || 'Campus')}</p>
                    <p><strong>Date & Time:</strong> ${escapeHTML(post.date || '-')} | ${escapeHTML(post.time || '-')}</p>
                    
                    <div style="margin-top: 10px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                        <label>
                            Visibility: 
                            <select onchange="updateVisibility(${post.id}, this.value)">
                                <option value="public" ${!isPrivate ? 'selected' : ''}>Public</option>
                                <option value="private" ${isPrivate ? 'selected' : ''}>Only Me</option>
                            </select>
                        </label>

                        <button onclick="deletePost(${post.id})" style="background: #e11d48; color: white; border: none; padding: 6px 12px; cursor: pointer; border-radius: 4px; font-weight: 500;">
                            Delete
                        </button>
                    </div>
                </div>
            `;
        });
    } catch (err) {
        console.error("Error loading posts:", err);
        myPostsContainer.innerHTML = `<p style="color: red; text-align: center;">Could not load posts. Please try again later.</p>`;
    }
}

// ================= 4. DELETE POST =================
async function deletePost(postId) {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
        const res = await fetch(`${BASE_URL}/posts/${postId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: storedUser.id })
        });

        const data = await res.json();

        if (res.ok) {
            const postElement = document.getElementById(`post-${postId}`);
            if (postElement) postElement.remove();
        } else {
            alert(data.error || "Failed to delete post.");
        }
    } catch (err) {
        console.error("Delete Error:", err);
        alert("Server error when deleting post.");
    }
}

// ================= 5. UPDATE POST VISIBILITY =================
async function updateVisibility(postId, newStatus) {
    try {
        const res = await fetch(`${BASE_URL}/posts/update-visibility/${postId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                visibility: newStatus,
                user_id: storedUser.id 
            })
        });

        if (!res.ok) {
            const data = await res.json();
            alert(data.error || "Failed to update post visibility.");
        }
    } catch (err) {
        console.error("Error updating visibility:", err);
        alert("Server error updating visibility status.");
    }
}

// ================= 6. LOGOUT & MENU TOGGLE =================
function logout() {
    if (confirm("Are you sure you want to log out?")) {
        localStorage.clear();
        window.location.href = "index.html";
    }
}

function toggleMenu() {
    const menu = document.getElementById("settingsMenu");
    if (menu) {
        menu.classList.toggle("active");
    }
}

// ================= 7. DELETE ACCOUNT =================
async function handleDeleteAccount() {
    const confirmed = confirm("Are you sure you want to delete your account? This action cannot be undone.");
    if (!confirmed) return;

    try {
        const res = await fetch(`${BASE_URL}/auth/delete-account/${storedUser.id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (res.ok) {
            alert("Your account has been deleted successfully.");
            localStorage.clear();
            window.location.href = 'index.html'; 
        } else {
            const errorData = await res.json();
            alert("Error: " + (errorData.error || "Could not delete account."));
        }
    } catch (err) {
        console.error("Delete account error:", err);
        alert("Failed to connect to the server.");
    }
}

// Safe initial loading listener
document.addEventListener("DOMContentLoaded", loadProfile);