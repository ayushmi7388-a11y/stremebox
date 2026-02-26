const FALLBACK_MOVIES = [
    { id: "m1", title: "The Silent Code", genre: "Thriller", image: "https://picsum.photos/seed/movie1/500/700" },
    { id: "m2", title: "Last Metro", genre: "Drama", image: "https://picsum.photos/seed/movie2/500/700" },
    { id: "m3", title: "Crimson Night", genre: "Action", image: "https://picsum.photos/seed/movie3/500/700" },
    { id: "m4", title: "Broken Signal", genre: "Sci-Fi", image: "https://picsum.photos/seed/movie4/500/700" },
    { id: "m5", title: "High Tide", genre: "Adventure", image: "https://picsum.photos/seed/movie5/500/700" },
    { id: "m6", title: "Ghost Files", genre: "Horror", image: "https://picsum.photos/seed/movie6/500/700" },
    { id: "m7", title: "Chasing Zero", genre: "Crime", image: "https://picsum.photos/seed/movie7/500/700" },
    { id: "m8", title: "Echoes", genre: "Mystery", image: "https://picsum.photos/seed/movie8/500/700" }
];

const FAQ = [
    {
        q: "What is StreamBox?",
        a: "StreamBox is a demo streaming website where you can browse titles, save a list and manage account info."
    },
    {
        q: "How much does StreamBox cost?",
        a: "Plans start from Rs 149. You can change plan anytime from the plans page."
    },
    {
        q: "How do I sign in?",
        a: "Go to Sign In page, enter email and password."
    },
    {
        q: "Can I use this site live?",
        a: "Yes, deploy this full-stack app to Render/Railway/Fly.io and use your own domain."
    }
];

const FOOTER_LINKS = [
    "FAQ", "Help Center", "Account", "Media Center", "Investor Relations", "Jobs",
    "Ways to Watch", "Terms of Use", "Privacy", "Cookie Preferences", "Corporate Information", "Contact Us"
];

const FALLBACK_PLANS = [
    { id: "Mobile", price: "Rs 149/month", quality: "480p" },
    { id: "Basic", price: "Rs 199/month", quality: "720p" },
    { id: "Premium", price: "Rs 649/month", quality: "4K + HDR" }
];

const STORAGE = {
    token: "streambox_token",
    userEmail: "streambox_user_email",
    plan: "streambox_plan",
    list: "streambox_my_list",
    loggedIn: "streambox_logged_in"
};

const API_BASE = window.STREAMBOX_API_BASE || "/api";
let cachedMovies = null;

function getToken() {
    return localStorage.getItem(STORAGE.token) || "";
}

function setToken(token) {
    if (token) localStorage.setItem(STORAGE.token, token);
    else localStorage.removeItem(STORAGE.token);
}

function isLoggedIn() {
    return Boolean(getToken()) || localStorage.getItem(STORAGE.loggedIn) === "true";
}

function requireAuth() {
    const protectedPages = ["browse.html", "mylist.html", "account.html"];
    const page = window.location.pathname.split("/").pop();
    if (protectedPages.includes(page) && !isLoggedIn()) {
        window.location.href = "signin.html";
    }
}

async function apiRequest(path, options = {}) {
    const { method = "GET", body, auth = true } = options;
    const headers = { "Content-Type": "application/json" };
    if (auth && getToken()) {
        headers.Authorization = `Bearer ${getToken()}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    });

    let payload = null;
    const text = await response.text();
    if (text) {
        try {
            payload = JSON.parse(text);
        } catch {
            payload = null;
        }
    }

    if (!response.ok) {
        const message = payload && payload.message ? payload.message : "Request failed";
        throw new Error(message);
    }

    return payload;
}

function getLocalMyList() {
    const value = localStorage.getItem(STORAGE.list);
    return value ? JSON.parse(value) : [];
}

function setLocalMyList(ids) {
    localStorage.setItem(STORAGE.list, JSON.stringify(ids));
}

async function getMyList() {
    if (getToken()) {
        try {
            const data = await apiRequest("/me/list");
            return Array.isArray(data.list) ? data.list : [];
        } catch {
            return getLocalMyList();
        }
    }
    return getLocalMyList();
}

async function toggleMyList(movieId) {
    if (getToken()) {
        try {
            const data = await apiRequest("/me/list/toggle", {
                method: "POST",
                body: { movieId }
            });
            return Array.isArray(data.list) ? data.list : [];
        } catch {
            const list = getLocalMyList();
            const idx = list.indexOf(movieId);
            if (idx >= 0) list.splice(idx, 1);
            else list.push(movieId);
            setLocalMyList(list);
            return list;
        }
    }

    const list = getLocalMyList();
    const idx = list.indexOf(movieId);
    if (idx >= 0) list.splice(idx, 1);
    else list.push(movieId);
    setLocalMyList(list);
    return list;
}

async function getAllMovies() {
    if (cachedMovies) return cachedMovies;
    try {
        const data = await apiRequest("/movies", { auth: false });
        cachedMovies = Array.isArray(data) ? data : FALLBACK_MOVIES;
    } catch {
        cachedMovies = FALLBACK_MOVIES;
    }
    return cachedMovies;
}

async function getPlans() {
    try {
        const data = await apiRequest("/plans", { auth: false });
        return Array.isArray(data) ? data : FALLBACK_PLANS;
    } catch {
        return FALLBACK_PLANS;
    }
}

async function getCurrentPlan() {
    if (getToken()) {
        try {
            const me = await apiRequest("/me");
            return me.plan || "";
        } catch {
            return localStorage.getItem(STORAGE.plan) || "";
        }
    }
    return localStorage.getItem(STORAGE.plan) || "";
}

async function setPlan(planId) {
    if (getToken()) {
        try {
            const data = await apiRequest("/me/plan", {
                method: "POST",
                body: { planId }
            });
            localStorage.setItem(STORAGE.plan, data.plan || planId);
            return data.plan || planId;
        } catch {
            localStorage.setItem(STORAGE.plan, planId);
            return planId;
        }
    }
    localStorage.setItem(STORAGE.plan, planId);
    return planId;
}

async function getAccountDetails() {
    if (getToken()) {
        try {
            const me = await apiRequest("/me");
            return {
                email: me.email || localStorage.getItem(STORAGE.userEmail) || "Not signed in",
                plan: me.plan || localStorage.getItem(STORAGE.plan) || "Not selected"
            };
        } catch {
            return {
                email: localStorage.getItem(STORAGE.userEmail) || "Not signed in",
                plan: localStorage.getItem(STORAGE.plan) || "Not selected"
            };
        }
    }

    return {
        email: localStorage.getItem(STORAGE.userEmail) || "Not signed in",
        plan: localStorage.getItem(STORAGE.plan) || "Not selected"
    };
}

function renderTrending() {
    const row = document.getElementById("trendingRow");
    if (!row) return;

    getAllMovies().then((movies) => {
        row.innerHTML = movies.slice(0, 8).map((movie, idx) => `
            <article class="trend-card" style="background-image:url('${movie.image}')">
                <span class="n-badge">N</span>
                <span class="rank">${idx + 1}</span>
                <p class="card-title">${movie.title}</p>
            </article>
        `).join("");
    });

    const prev = document.getElementById("trendPrev");
    const next = document.getElementById("trendNext");
    if (prev && next) {
        const by = () => Math.max(220, Math.floor(row.clientWidth * 0.8));
        prev.addEventListener("click", () => row.scrollBy({ left: -by(), behavior: "smooth" }));
        next.addEventListener("click", () => row.scrollBy({ left: by(), behavior: "smooth" }));
    }
}

function renderFaq() {
    const list = document.getElementById("faqList");
    if (!list) return;
    list.innerHTML = FAQ.map((item) => `
        <article class="faq-item">
            <button class="faq-question" type="button">${item.q}</button>
            <div class="faq-answer"><p>${item.a}</p></div>
        </article>
    `).join("");

    const items = list.querySelectorAll(".faq-item");
    items.forEach((item) => {
        item.querySelector(".faq-question").addEventListener("click", () => {
            const open = item.classList.contains("open");
            items.forEach((i) => i.classList.remove("open"));
            if (!open) item.classList.add("open");
        });
    });
}

function renderFooterLinks() {
    const wrap = document.getElementById("footerLinks");
    if (!wrap) return;
    wrap.innerHTML = FOOTER_LINKS.map((text) => `<a href="#">${text}</a>`).join("");
}

function bindLeadForm(formId, emailId, messageId) {
    const form = document.getElementById(formId);
    const input = document.getElementById(emailId);
    const msg = document.getElementById(messageId);
    if (!form || !input || !msg) return;

    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const email = input.value.trim();
        if (!regex.test(email)) {
            msg.textContent = "Please enter a valid email.";
            msg.classList.add("error");
            input.focus();
            return;
        }

        localStorage.setItem(STORAGE.userEmail, email);
        msg.textContent = "Great. Continue with Sign In.";
        msg.classList.remove("error");
        setTimeout(() => {
            window.location.href = "signin.html";
        }, 500);
    });
}

function bindSignIn() {
    const form = document.getElementById("signInForm");
    if (!form) return;

    const emailInput = document.getElementById("signInEmail");
    const passwordInput = document.getElementById("signInPassword");
    const message = document.getElementById("signInMessage");
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

    const savedEmail = localStorage.getItem(STORAGE.userEmail);
    if (savedEmail) emailInput.value = savedEmail;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const email = emailInput.value.trim();
        const pass = passwordInput.value.trim();

        if (!regex.test(email)) {
            message.textContent = "Enter valid email.";
            message.classList.add("error");
            return;
        }
        if (pass.length < 4) {
            message.textContent = "Password must be at least 4 characters.";
            message.classList.add("error");
            return;
        }

        message.classList.remove("error");
        message.textContent = "Signing in...";

        try {
            let data;
            try {
                data = await apiRequest("/auth/signin", {
                    method: "POST",
                    body: { email, password: pass },
                    auth: false
                });
            } catch (err) {
                if (String(err.message).toLowerCase().includes("invalid")) {
                    data = await apiRequest("/auth/signup", {
                        method: "POST",
                        body: { email, password: pass },
                        auth: false
                    });
                } else {
                    throw err;
                }
            }

            setToken(data.token || "");
            localStorage.setItem(STORAGE.userEmail, data.email || email);
            localStorage.setItem(STORAGE.loggedIn, "true");
            if (data.plan) localStorage.setItem(STORAGE.plan, data.plan);
            if (Array.isArray(data.list)) setLocalMyList(data.list);
            message.textContent = "Signed in. Redirecting...";
            setTimeout(() => {
                window.location.href = "browse.html";
            }, 500);
        } catch (error) {
            localStorage.setItem(STORAGE.userEmail, email);
            localStorage.setItem(STORAGE.loggedIn, "true");
            message.textContent = `Backend unavailable (${error.message}). Demo mode sign-in done.`;
            setTimeout(() => {
                window.location.href = "browse.html";
            }, 900);
        }
    });
}

function movieCardTemplate(movie, inList) {
    return `
        <article class="movie-card">
            <div class="movie-thumb" style="background-image:url('${movie.image}')"></div>
            <div class="movie-body">
                <h3>${movie.title}</h3>
                <p>${movie.genre}</p>
                <div class="movie-actions">
                    <button class="btn btn-small watch-btn" type="button" data-id="${movie.id}">Play</button>
                    <button class="btn btn-small btn-outline list-btn" type="button" data-id="${movie.id}">
                        ${inList ? "Remove" : "+ My List"}
                    </button>
                </div>
            </div>
        </article>
    `;
}

async function bindCatalog() {
    const grid = document.getElementById("catalogGrid");
    if (!grid) return;

    const search = document.getElementById("searchInput");
    const movies = await getAllMovies();

    const render = async (query = "") => {
        const listIds = await getMyList();
        const filtered = movies.filter((m) => m.title.toLowerCase().includes(query.toLowerCase()));
        grid.innerHTML = filtered.map((movie) => movieCardTemplate(movie, listIds.includes(movie.id))).join("");
        bindCatalogActions();
    };

    await render();
    if (search) {
        search.addEventListener("input", (event) => {
            render(event.target.value);
        });
    }
}

function bindCatalogActions() {
    document.querySelectorAll(".watch-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            btn.textContent = "Playing...";
            setTimeout(() => {
                btn.textContent = "Play";
            }, 900);
        });
    });

    document.querySelectorAll(".list-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const id = btn.dataset.id;
            const list = await toggleMyList(id);
            btn.textContent = list.includes(id) ? "Remove" : "+ My List";
        });
    });
}

async function renderMyList() {
    const grid = document.getElementById("myListGrid");
    const empty = document.getElementById("emptyListMessage");
    if (!grid || !empty) return;

    const movies = await getAllMovies();
    const listIds = await getMyList();
    const selected = movies.filter((m) => listIds.includes(m.id));

    grid.innerHTML = selected.map((movie) => movieCardTemplate(movie, true)).join("");
    empty.style.display = selected.length ? "none" : "block";
    bindCatalogActions();
}

async function renderPlans() {
    const grid = document.getElementById("planGrid");
    const msg = document.getElementById("planMessage");
    if (!grid || !msg) return;

    const plans = await getPlans();
    const currentPlan = await getCurrentPlan();

    grid.innerHTML = plans.map((plan) => `
        <article class="plan-card">
            <h3>${plan.id}</h3>
            <p>${plan.price}</p>
            <p>Quality: ${plan.quality}</p>
            <button class="btn btn-small pick-plan" type="button" data-plan="${plan.id}">
                ${currentPlan === plan.id ? "Selected" : "Choose Plan"}
            </button>
        </article>
    `).join("");

    grid.querySelectorAll(".pick-plan").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const selected = btn.dataset.plan;
            await setPlan(selected);
            msg.textContent = `${selected} plan selected.`;
            renderPlans();
        });
    });
}

async function renderAccount() {
    const emailEl = document.getElementById("accountEmail");
    const planEl = document.getElementById("accountPlan");
    if (!emailEl || !planEl) return;

    const details = await getAccountDetails();
    emailEl.textContent = details.email;
    planEl.textContent = details.plan || "Not selected";
}

function bindSignOut() {
    document.querySelectorAll("#signOutBtn").forEach((btn) => {
        btn.addEventListener("click", async () => {
            if (getToken()) {
                try {
                    await apiRequest("/auth/signout", { method: "POST" });
                } catch {
                    // ignore
                }
            }
            setToken("");
            localStorage.removeItem(STORAGE.loggedIn);
            window.location.href = "index.html";
        });
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    requireAuth();
    renderTrending();
    renderFaq();
    renderFooterLinks();
    bindLeadForm("emailForm", "emailInput", "formMessage");
    bindSignIn();
    await bindCatalog();
    await renderMyList();
    await renderPlans();
    await renderAccount();
    bindSignOut();
});
