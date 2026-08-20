const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='%23a3a3a3'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm0 14c-2.03 0-3.8-.85-5.05-2.2.03-1.68 3.37-2.6 5.05-2.6s5.02.92 5.05 2.6C15.8 19.15 14.03 20 12 20z'/></svg>";

window.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get("id");

    if (!userId) {
        document.getElementById("profile-info-container").innerHTML = `<p style="text-align:center; color:#a3a3a3;">User ID missing.</p>`;
        return;
    }

    loadUserProfile(userId);
    loadUserPosts(userId);
});

async function loadUserProfile(userId) {
    const container = document.getElementById("profile-info-container");

    try {
        const res = await fetch(`${BASE_URL}/auth/user/${userId}`);
        if (!res.ok) throw new Error("Failed to fetch user info");

        const user = await res.json();
        const profileImg = user.profile_image ? `${BASE_URL}/uploads/${user.profile_image}` : DEFAULT_AVATAR;

        document.getElementById("header-title").textContent = user.name || "Student Profile";

        container.innerHTML = `
            <div class="profile-card">
                <img src="${profileImg}" onerror="this.onerror=null; this.src='${DEFAULT_AVATAR}';" />
                <h2>${escapeHTML(user.name || "Campus Student")}</h2>
                <p><strong>Matric Number:</strong> ${escapeHTML(user.matric || user.matric_number || "N/A")}</p>
                <p><strong>Email:</strong> ${escapeHTML(user.email || "N/A")}</p>
                <button class="message-btn" onclick="startMessage(${user.id}, '${escapeHTML(user.name)}')">💬 Message Student</button>
            </div>
        `;
    } catch (err) {
        console.error("Error loading user profile:", err);
        container.innerHTML = `<p style="text-align:center; color:#a3a3a3;">Could not load user profile details.</p>`;
    }
}

async function loadUserPosts(userId) {
    const container = document.getElementById("user-posts-container");

    try {
        const res = await fetch(`${BASE_URL}/posts/user/${userId}`);
        if (!res.ok) throw new Error("Failed to load user posts");

        const posts = await res.json();

        if (posts.length === 0) {
            container.innerHTML = `<p style="text-align:center; color:#737373; padding: 20px;">This student hasn't posted anything yet.</p>`;
            return;
        }

        container.innerHTML = posts.map(post => `
            <article style="background: #0a0a0a; border: 1px solid #262626; border-radius: 16px; padding: 20px; margin-bottom: 20px;">
                <div style="margin-bottom: 12px;">
                    ${post.title ? `<h4 style="margin: 0 0 6px 0; color: #ffffff; font-size: 1rem;">${escapeHTML(post.title)}</h4>` : ''}
                    <p style="color: #d4d4d4; font-size: 0.9rem; line-height: 1.5;">${escapeHTML(post.description || "")}</p>
                </div>
                ${post.image ? `
                    <div style="border-radius: 10px; overflow: hidden; background: #000; border: 1px solid #262626; margin-bottom: 12px;">
                        <img src="${BASE_URL}/uploads/${post.image}" style="width: 100%; max-height: 350px; object-fit: cover; display: block;" />
                    </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: #737373;">
                    <span>${escapeHTML(post.date || "Recently")}</span>
                    <span>${post.likes || 0} likes • ${(post.comments || []).length} comments</span>
                </div>
            </article>
        `).join("");

    } catch (err) {
        console.error("Error loading user posts:", err);
        container.innerHTML = `<p style="text-align:center; color:#a3a3a3;">Error loading posts.</p>`;
    }
}

function startMessage(userId, userName) {
    // Redirect to messaging page with target user ID
    window.location.href = `messages.html?recipient=${userId}&name=${encodeURIComponent(userName)}`;
}

function escapeHTML(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}