const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='%23a3a3a3'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm0 14c-2.03 0-3.8-.85-5.05-2.2.03-1.68 3.37-2.6 5.05-2.6s5.02.92 5.05 2.6C15.8 19.15 14.03 20 12 20z'/></svg>";

window.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get("id");

    if (!postId) {
        document.getElementById("single-post-container").innerHTML = `<p style="text-align:center; color:#a3a3a3; padding:30px;">Post not found.</p>`;
        return;
    }

    loadSinglePost(postId);
});

async function loadSinglePost(postId) {
    const container = document.getElementById("single-post-container");

    try {
        const res = await fetch(`${BASE_URL}/posts/${postId}`);
        if (!res.ok) throw new Error("Failed to load post");

        const post = await res.json();
        const userProfileImg = post.profile_image ? `${BASE_URL}/uploads/${post.profile_image}` : DEFAULT_AVATAR;
        const comments = post.comments || [];

        container.innerHTML = `
            <article style="background: #0a0a0a; border: 1px solid #262626; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
                
                <!-- Author Header -->
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                    <div style="display: flex; align-items: center; gap: 12px; cursor: pointer;" onclick="goToProfile(${post.user_id})">
                        <img src="${userProfileImg}" onerror="this.onerror=null; this.src='${DEFAULT_AVATAR}';" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 1px solid #ffffff;" />
                        <div>
                            <h3 style="margin: 0; font-size: 1rem; color: #ffffff; font-weight: 600;">${escapeHTML(post.name || "Campus Student")}</h3>
                            <small style="color: #737373; font-size: 0.78rem;">${escapeHTML(post.location || "Campus")} • ${escapeHTML(post.date || "Recently")}</small>
                        </div>
                    </div>
                </div>

                <!-- Content -->
                <div style="margin-bottom: 16px;">
                    ${post.title ? `<h4 style="margin: 0 0 8px 0; font-size: 1.1rem; color: #ffffff; font-weight: 700;">${escapeHTML(post.title)}</h4>` : ''}
                    <p style="margin: 0; color: #d4d4d4; line-height: 1.6; font-size: 0.95rem;">${escapeHTML(post.description || "")}</p>
                </div>

                <!-- Image -->
                ${post.image ? `
                    <div style="margin-bottom: 16px; border-radius: 12px; overflow: hidden; background: #000000; border: 1px solid #262626;">
                        <img src="${BASE_URL}/uploads/${post.image}" alt="Post image" style="width: 100%; max-height: 450px; object-fit: cover; display: block;" />
                    </div>
                ` : ""}

                <!-- Stats -->
                <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #262626; border-bottom: 1px solid #262626; padding: 10px 4px; margin-bottom: 20px;">
                    <span style="font-size: 0.88rem; color: #a3a3a3;"><strong>${post.likes || 0}</strong> likes</span>
                    <span style="font-size: 0.85rem; color: #737373;">${comments.length} comments</span>
                </div>

                <!-- Comments List -->
                <div id="comments-list" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
                    ${comments.length === 0 ? `<p style="color: #737373; font-size: 0.9rem; text-align: center; padding: 10px;">No comments yet. Be the first!</p>` : ''}
                    ${comments.map(c => `
                        <div style="display: flex; align-items: flex-start; gap: 10px; background: #000000; border: 1px solid #262626; padding: 10px 12px; border-radius: 10px;">
                            <img src="${c.profile_image ? `${BASE_URL}/uploads/${c.profile_image}` : DEFAULT_AVATAR}" onerror="this.onerror=null; this.src='${DEFAULT_AVATAR}';" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover; margin-top: 2px;" />
                            <div style="flex: 1;">
                                <p style="margin: 0; font-size: 0.85rem; color: #e5e5e5; line-height: 1.4;">
                                    <strong style="color: #ffffff; cursor: pointer; text-decoration: underline;" onclick="goToProfile(${c.user_id})">${escapeHTML(c.name)}:</strong> 
                                    ${escapeHTML(c.comment_text || c.comment)}
                                </p>
                            </div>
                        </div>
                    `).join("")}
                </div>

                <!-- Comment Form -->
                <div class="comment-input-box">
                    <input id="new-comment-input" type="text" placeholder="Write a comment..." onkeypress="if(event.key === 'Enter') addComment(${post.id})" />
                    <button onclick="addComment(${post.id})">Send</button>
                </div>

            </article>
        `;

    } catch (err) {
        console.error("Error loading single post:", err);
        container.innerHTML = `<p style="text-align:center; color:#a3a3a3; padding:30px;">Error loading post details.</p>`;
    }
}

async function addComment(postId) {
    const input = document.getElementById("new-comment-input");
    if (!input) return;

    const comment = input.value.trim();
    if (!comment) return;

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.id) return alert("Please log in to leave comments!");

    try {
        const res = await fetch(`${BASE_URL}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ post_id: postId, user_id: user.id, comment })
        });

        if (res.ok) {
            // Reload the post to show the new comment instantly
            loadSinglePost(postId);
        } else {
            const data = await res.json();
            alert(data.error || "Failed to post comment.");
        }
    } catch (err) {
        console.error("Error adding comment:", err);
    }
}

function goToProfile(clickedId) {
    const loggedInUser = JSON.parse(localStorage.getItem("user"));
    if (loggedInUser && (loggedInUser.id == clickedId)) {
        window.location.href = "profile.html";
    } else {
        window.location.href = `user-profile.html?id=${clickedId}`;
    }
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