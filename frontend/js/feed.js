// Global SVG fallback avatar (Grayscale/Monochrome)
const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='%23a3a3a3'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm0 14c-2.03 0-3.8-.85-5.05-2.2.03-1.68 3.37-2.6 5.05-2.6s5.02.92 5.05 2.6C15.8 19.15 14.03 20 12 20z'/></svg>";

window.addEventListener("DOMContentLoaded", loadPosts);

// ================= 1. LOAD FEED POSTS =================
async function loadPosts() {
  const feedContainer = document.getElementById("feed");
  if (!feedContainer) return;

  try {
    // BASE_URL comes directly from config.js
    const res = await fetch(`${BASE_URL}/posts`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    
    const posts = await res.json();

    if (!Array.isArray(posts)) {
      console.error("Posts data is not an array:", posts);
      feedContainer.innerHTML = `<p style="text-align:center; color:#a3a3a3; padding:30px;">Unable to load feed.</p>`;
      return;
    }

    if (posts.length === 0) {
      feedContainer.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: #a3a3a3; background: #000000; border: 1px solid #262626; border-radius: 16px;">
          <p style="font-size: 1.1rem; font-weight: 600; margin-bottom: 8px; color: #ffffff;">No posts yet 🖤</p>
          <p style="font-size: 0.9rem; margin: 0;">Be the first student to share an update on campus!</p>
        </div>
      `;
      return;
    }

    let allPostsHTML = "";

    posts.forEach(post => {
      const userProfileImg = post.profile_image 
        ? `${BASE_URL}/uploads/${post.profile_image}` 
        : DEFAULT_AVATAR;

      allPostsHTML += `
        <article class="post-card" id="post-${post.id}" style="background: #0a0a0a; border: 1px solid #262626; border-radius: 16px; padding: 20px; margin-bottom: 24px; box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.8);">
          
          <!-- Post Author Header -->
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 12px; cursor: pointer;" onclick="goToProfile(${post.user_id})">
              <img 
                src="${userProfileImg}" 
                onerror="this.onerror=null; this.src='${DEFAULT_AVATAR}';" 
                alt="${escapeHTML(post.name || 'User')}" 
                style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 1px solid #ffffff;" 
              />
              <div>
                <h3 style="margin: 0; font-size: 1rem; color: #ffffff; font-weight: 600;">${escapeHTML(post.name || "Campus Student")}</h3>
                <small style="color: #737373; font-size: 0.78rem;">${escapeHTML(post.location || "Campus")} • ${escapeHTML(post.date || "Recently")}</small>
              </div>
            </div>
            
            ${post.time ? `<span style="font-size: 0.75rem; background: #171717; color: #a3a3a3; border: 1px solid #262626; padding: 4px 10px; border-radius: 20px; font-weight: 500;">${escapeHTML(post.time)}</span>` : ''}
          </div>

          <!-- Post Content -->
          <div style="margin-bottom: 16px;">
            ${post.title ? `<h4 style="margin: 0 0 8px 0; font-size: 1.1rem; color: #ffffff; font-weight: 700; letter-spacing: -0.01em;">${escapeHTML(post.title)}</h4>` : ''}
            <p style="margin: 0; color: #d4d4d4; line-height: 1.6; font-size: 0.95rem;">${escapeHTML(post.description || "")}</p>
          </div>

          <!-- Post Attachment Image -->
          ${post.image ? `
            <div style="margin-bottom: 16px; border-radius: 12px; overflow: hidden; background: #000000; border: 1px solid #262626;">
              <img src="${BASE_URL}/uploads/${post.image}" alt="Post image" style="width: 100%; max-height: 450px; object-fit: cover; display: block; filter: grayscale(15%);" />
            </div>
          ` : ""}

          <!-- Action & Stats Bar -->
          <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #262626; border-bottom: 1px solid #262626; padding: 10px 4px; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <button onclick="toggleLike(${post.id})" id="like-btn-${post.id}" style="background: #ffffff; color: #000000; border: none; padding: 6px 16px; border-radius: 20px; cursor: pointer; font-weight: 600; font-size: 0.85rem; display: flex; align-items: center; gap: 6px; transition: opacity 0.2s ease;">
                🖤 Like
              </button>
              <span style="font-size: 0.88rem; color: #a3a3a3; font-weight: 500;">
                <strong id="likes-${post.id}" style="color: #ffffff;">${post.likes || 0}</strong> likes
              </span>
            </div>
            
            <span style="font-size: 0.85rem; color: #737373;">
              ${(post.comments || []).length} comments
            </span>
          </div>

          <!-- Comments Feed -->
          <div class="comments" id="comments-${post.id}" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; max-height: 250px; overflow-y: auto; padding-right: 4px;">
            ${(post.comments || []).map(c => `
              <div style="display: flex; align-items: flex-start; gap: 10px; background: #000000; border: 1px solid #262626; padding: 8px 12px; border-radius: 10px;">
                <img 
                  src="${c.profile_image ? `${BASE_URL}/uploads/${c.profile_image}` : DEFAULT_AVATAR}" 
                  onerror="this.onerror=null; this.src='${DEFAULT_AVATAR}';" 
                  style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover; margin-top: 2px; border: 1px solid #404040;" 
                />
                <div style="flex: 1;">
                  <p style="margin: 0; font-size: 0.85rem; color: #e5e5e5; line-height: 1.4;">
                    <strong style="color: #ffffff; cursor: pointer; text-decoration: underline;" onclick="goToProfile(${c.user_id})">${escapeHTML(c.name)}:</strong> 
                    ${escapeHTML(c.comment)}
                  </p>
                </div>
              </div>
            `).join("")}
          </div>

          <!-- Comment Input Form -->
          <div style="display: flex; gap: 8px; align-items: center;">
            <input 
              id="comment-${post.id}" 
              type="text" 
              placeholder="Write a comment..." 
              onkeypress="if(event.key === 'Enter') addComment(${post.id})"
              style="flex: 1; background: #000000; color: #ffffff; border: 1px solid #262626; padding: 10px 14px; border-radius: 20px; font-size: 0.88rem; outline: none;" 
            />
            <button 
              onclick="addComment(${post.id})" 
              style="background: #ffffff; color: #000000; border: none; padding: 10px 18px; border-radius: 20px; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: opacity 0.2s ease;"
            >
              Send
            </button>
          </div>

        </article>
      `;
    });

    feedContainer.innerHTML = allPostsHTML;

  } catch (err) {
    console.error("Error loading posts:", err);
    feedContainer.innerHTML = `<p style="text-align:center; color:#a3a3a3; padding:30px;">Server connection error. Ensure your backend server is running.</p>`;
  }
}

// ================= 2. ADD COMMENT =================
async function addComment(postId) {
  const input = document.getElementById(`comment-${postId}`);
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
      const profileImg = user.profile_image ? `${BASE_URL}/uploads/${user.profile_image}` : DEFAULT_AVATAR;
      const commentsDiv = document.getElementById(`comments-${postId}`);
      
      const newCommentHTML = `
        <div style="display: flex; align-items: flex-start; gap: 10px; background: #000000; border: 1px solid #262626; padding: 8px 12px; border-radius: 10px;">
          <img 
            src="${profileImg}" 
            onerror="this.onerror=null; this.src='${DEFAULT_AVATAR}';" 
            style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover; margin-top: 2px; border: 1px solid #404040;" 
          />
          <div style="flex: 1;">
            <p style="margin: 0; font-size: 0.85rem; color: #e5e5e5; line-height: 1.4;">
              <strong style="color: #ffffff; cursor: pointer; text-decoration: underline;" onclick="goToProfile(${user.id})">${escapeHTML(user.name || "You")}:</strong> 
              ${escapeHTML(comment)}
            </p>
          </div>
        </div>
      `;
      
      if (commentsDiv) {
        commentsDiv.insertAdjacentHTML('beforeend', newCommentHTML);
        commentsDiv.scrollTop = commentsDiv.scrollHeight;
      }
      input.value = "";
    } else {
      const data = await res.json();
      alert(data.error || "Failed to post comment.");
    }
  } catch (err) {
    console.error("Error adding comment:", err);
  }
}

// ================= 3. TOGGLE LIKE =================
async function toggleLike(postId) {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || !user.id) return alert("Please log in first!");

  const likesSpan = document.getElementById(`likes-${postId}`);

  try {
    const res = await fetch(`${BASE_URL}/posts/like/${postId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id })
    });

    if (res.ok) {
      const data = await res.json();
      if (likesSpan && typeof data.likes !== "undefined") {
        likesSpan.textContent = data.likes;
      } else if (likesSpan) {
        likesSpan.textContent = parseInt(likesSpan.textContent || 0) + 1;
      }
    }
  } catch (err) {
    console.error("Error toggling like:", err);
  }
}

// ================= 4. NAVIGATION & UTILITIES =================
function goToProfile(clickedId) {
  const loggedInUser = JSON.parse(localStorage.getItem("user"));
  
  if (loggedInUser && (loggedInUser.id == clickedId)) {
    window.location.href = "profile.html";
  } else {
    window.location.href = `user-profile.html?id=${clickedId}`;
  }
}

function toggleSearch() {
  const searchBar = document.getElementById("searchBarContainer");
  if (!searchBar) return;

  if (searchBar.style.display === "none" || searchBar.style.display === "") {
    searchBar.style.display = "block";
    document.getElementById("matricSearch")?.focus();
  } else {
    searchBar.style.display = "none";
  }
}

async function executeSearch() {
  const matricInput = document.getElementById("matricSearch");
  if (!matricInput) return;

  const matric = matricInput.value.trim();
  if (!matric) return alert("Please enter a Matric Number to search.");

  try {
    const res = await fetch(`${BASE_URL}/auth/search/${encodeURIComponent(matric)}`);
    
    if (res.status === 404) {
      alert("No student found with that Matric Number.");
      return;
    }

    if (!res.ok) throw new Error("Search failed");

    const student = await res.json();
    window.location.href = `user-profile.html?id=${student.id}`;
    
  } catch (err) {
    console.error("Search failed:", err);
    alert("An error occurred while searching for student.");
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