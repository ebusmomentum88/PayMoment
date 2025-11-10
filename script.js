const API_BASE_URL = "https://paymomentbackend.onrender.com/api";
const newsContainer = document.getElementById("news-container");
const adminList = document.getElementById("admin-news-list");

// ====== FRONTEND ======
async function loadNews() {
  if (!newsContainer) return;
  newsContainer.innerHTML = "<p style='text-align:center;'>Loading news...</p>";
  try {
    const res = await fetch(`${API_BASE_URL}/news`);
    const data = await res.json();
    if (data.success && data.news.length > 0) {
      const newsData = data.news;
      newsContainer.innerHTML = newsData
        .map(
          (n) => `
        <div class="news-card">
          ${n.imageUrl ? `<img src="${n.imageUrl}" class="news-image">` : ""}
          <div class="news-content">
            <h3 class="news-title">${n.title}</h3>
            <p class="news-text">${n.content}</p>
          </div>
        </div>`
        )
        .join("");
      localStorage.setItem("PayMoment_news", JSON.stringify(newsData));
    } else {
      newsContainer.innerHTML = "<p style='text-align:center;'>No news yet.</p>";
    }
  } catch (err) {
    console.error(err);
    const newsData = JSON.parse(localStorage.getItem("PayMoment_news")) || [];
    if (newsData.length > 0) {
      newsContainer.innerHTML = newsData
        .map(
          (n) => `
        <div class="news-card">
          ${n.imageUrl ? `<img src="${n.imageUrl}" class="news-image">` : ""}
          <div class="news-content">
            <h3 class="news-title">${n.title}</h3>
            <p class="news-text">${n.content}</p>
          </div>
        </div>`
        )
        .join("");
    } else newsContainer.innerHTML = "<p style='text-align:center;color:red;'>Failed to load news</p>";
  }
}

// ====== ADMIN PANEL ======
function loadAdminNews() {
  if (!adminList) return;
  fetch(`${API_BASE_URL}/news`)
    .then((res) => res.json())
    .then((data) => {
      if (!data.success) return;
      const newsData = data.news;
      localStorage.setItem("PayMoment_news", JSON.stringify(newsData));
      adminList.innerHTML = newsData
        .map(
          (n) => `
        <div class="news-card" data-id="${n.id}">
          ${n.imageUrl ? `<img src="${n.imageUrl}" class="news-image">` : ""}
          <div class="news-content">
            <h3 class="news-title">${n.title}</h3>
            <p class="news-text">${n.content}</p>
          </div>
          <div class="admin-controls">
            <button class="btn-edit" onclick="editNews(${n.id})">Edit</button>
            <button class="btn-delete" onclick="deleteNews(${n.id})">Delete</button>
          </div>
        </div>`
        )
        .join("");
    })
    .catch((err) => console.error(err));
}

// ====== ADD / EDIT / DELETE ======
const modal = document.getElementById("newsModal");
const form = document.getElementById("newsForm");
const addNewsBtn = document.getElementById("addNewsBtn");
const closeModalBtn = document.getElementById("closeModal");
const previewImage = document.getElementById("previewImage");
const imageInput = document.getElementById("newsImage");
let editId = null;

// Show Modal
if (addNewsBtn) {
  addNewsBtn.addEventListener("click", () => {
    editId = null;
    document.getElementById("modalTitle").textContent = "Add News";
    modal.style.display = "flex";
    form.reset();
    previewImage.style.display = "none";
  });
}

// Close Modal
if (closeModalBtn) closeModalBtn.addEventListener("click", () => (modal.style.display = "none"));

// Image Preview
if (imageInput) {
  imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewImage.src = e.target.result;
        previewImage.style.display = "block";
      };
      reader.readAsDataURL(file);
    }
  });
}

// Save News
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("newsTitle").value.trim();
    const content = document.getElementById("newsContent").value.trim();
    const file = imageInput.files[0];

    if (!title || !content) return alert("Please fill all fields");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    if (file) formData.append("image", file);

    try {
      let url = `${API_BASE_URL}/news`;
      let method = "POST";
      if (editId) {
        url = `${API_BASE_URL}/news/${editId}`;
        method = "PUT";
      }
      const res = await fetch(url, { method, body: formData });
      const data = await res.json();
      if (data.success) {
        modal.style.display = "none";
        form.reset();
        previewImage.style.display = "none";
        editId = null;
        loadNews();
        loadAdminNews();
      } else alert(data.message || "Failed to save news");
    } catch (err) {
      console.error(err);
      alert("Error connecting to backend");
    }
  });
}

// Edit news
function editNews(id) {
  editId = id;
  fetch(`${API_BASE_URL}/news/${id}`)
    .then((res) => res.json())
    .then((data) => {
      if (!data.success) return alert("Failed to load news item");
      const n = data.news;
      modal.style.display = "flex";
      document.getElementById("modalTitle").textContent = "Edit News";
      document.getElementById("newsTitle").value = n.title;
      document.getElementById("newsContent").value = n.content;
      previewImage.src = n.imageUrl || "";
      previewImage.style.display = n.imageUrl ? "block" : "none";
    })
    .catch((err) => console.error(err));
}

// Delete news
function deleteNews(id) {
  if (!confirm("Are you sure you want to delete this news?")) return;
  fetch(`${API_BASE_URL}/news/${id}`, { method: "DELETE" })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) loadAdminNews();
      else alert(data.message || "Failed to delete news");
    })
    .catch((err) => console.error(err));
}

// ====== INIT ======
document.addEventListener("DOMContentLoaded", () => {
  loadNews();
  loadAdminNews();
});


