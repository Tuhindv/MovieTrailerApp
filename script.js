const API_KEY = "c4c35b01a48a95fbc64048cbfcac1793";

let moviesDiv = document.getElementById("movies");
let searchInput = document.getElementById("searchInput");

let page = 1;
let currentMode = "popular";
let currentQuery = "";
let currentCategory = "";
let currentLang = "";
let isLoading = false;

// =====================
// MOBILE CHECK
// =====================
const isMobile = /iPhone|Android|iPad|iPod/i.test(navigator.userAgent);

// =====================
// LOAD HOME
// =====================
async function loadMovies() {
  currentMode = "popular";
  page = Math.floor(Math.random() * 10) + 1;

  moviesDiv.innerHTML = "Loading...";

  const res = await fetch(
    `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&page=${page}`
  );

  const data = await res.json();
  showMovies(data.results);
}

// =====================
// SHOW MOVIES
// =====================
function showMovies(movies, append = false) {
  if (!append) moviesDiv.innerHTML = "";

  movies.forEach(movie => {
    const poster = movie.poster_path
      ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
      : "https://via.placeholder.com/300x450?text=No+Image";

    const div = document.createElement("div");
    div.classList.add("movie");
    div.dataset.id = movie.id;

    div.innerHTML = `
      <img src="${poster}">
      <h4>${movie.title || movie.name}</h4>
    `;

    moviesDiv.appendChild(div);
  });
}

// =====================
// GET TRAILER
// =====================
async function getTrailer(movieId) {
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${API_KEY}`
  );

  const data = await res.json();

  const trailer = data.results.find(
    v => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")
  );

  if (!trailer) return null;

  return {
    url: `https://www.youtube.com/embed/${trailer.key}?autoplay=1`,
    videoId: trailer.key
  };
}

// =====================
// YOUTUBE DURATION API
// (ONLY DESKTOP USE)
// =====================
async function getVideoDuration(videoId) {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=YOUR_YOUTUBE_API_KEY`
  );

  const data = await res.json();

  if (!data.items || !data.items.length) return "N/A";

  const iso = data.items[0].contentDetails.duration;
  return formatDuration(iso);
}

// =====================
// FORMAT DURATION
// =====================
function formatDuration(iso) {
  const match = iso.match(/PT(\d+H)?(\d+M)?(\d+S)?/);

  const hours = match[1] ? match[1].replace("H", "") : 0;
  const minutes = match[2] ? match[2].replace("M", "") : 0;
  const seconds = match[3] ? match[3].replace("S", "") : 0;

  if (hours > 0) {
    return `${hours}:${minutes}:${seconds}`;
  }
  return `${minutes}:${seconds}`;
}

// =====================
// CLICK MOVIE → TRAILER
// =====================
moviesDiv.addEventListener("click", async (e) => {
  const movieCard = e.target.closest(".movie");
  if (!movieCard) return;

  const id = movieCard.dataset.id;

  const modal = document.getElementById("modal");
  const frame = document.getElementById("trailer");
  const durationText = document.getElementById("duration");

  frame.src = "";
  durationText.innerText = "";

  const trailer = await getTrailer(id);

  if (trailer) {
    modal.style.display = "block";
    frame.src = trailer.url;

    // =====================
    // MOBILE: hide duration
    // =====================
    if (isMobile) {
      durationText.style.display = "none";
    } else {
      durationText.style.display = "block";
      const duration = await getVideoDuration(trailer.videoId);
      durationText.innerText = `⏱ Duration: ${duration}`;
    }
  } else {
    alert("Trailer নাই 😢");
  }
});

// =====================
// CLOSE MODAL
// =====================
function closeModal() {
  document.getElementById("modal").style.display = "none";
  document.getElementById("trailer").src = "";
  document.getElementById("duration").innerText = "";
}

// =====================
// SEARCH
// =====================
async function searchMovies() {
  const q = searchInput.value.trim();
  if (!q) return;

  currentMode = "search";
  currentQuery = q;
  page = 1;

  moviesDiv.innerHTML = "Loading...";

  const res = await fetch(
    `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${q}&page=${page}`
  );

  const data = await res.json();
  showMovies(data.results);
}

// =====================
// CLEAR SEARCH
// =====================
function clearSearch() {
  searchInput.value = "";
  loadMovies();
}

// =====================
// CATEGORY
// =====================
async function loadCategory(id) {
  currentMode = "category";
  currentCategory = id;

  page = Math.floor(Math.random() * 10) + 1;

  moviesDiv.innerHTML = "Loading...";

  const res = await fetch(
    `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=${id}&page=${page}`
  );

  const data = await res.json();
  showMovies(data.results);
}

// =====================
// LANGUAGE
// =====================
async function loadLanguage(lang) {
  currentMode = "language";
  currentLang = lang;

  page = Math.floor(Math.random() * 10) + 1;

  moviesDiv.innerHTML = "Loading...";

  const res = await fetch(
    `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_original_language=${lang}&page=${page}`
  );

  const data = await res.json();
  showMovies(data.results);
}

// =====================
// LOAD MORE
// =====================
async function loadMore() {
  if (isLoading) return;
  isLoading = true;

  page++;

  let url = "";

  if (currentMode === "popular") {
    url = `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&page=${page}`;
  } 
  else if (currentMode === "search") {
    url = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${currentQuery}&page=${page}`;
  } 
  else if (currentMode === "category") {
    url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=${currentCategory}&page=${page}`;
  } 
  else if (currentMode === "language") {
    url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_original_language=${currentLang}&page=${page}`;
  }

  const res = await fetch(url);
  const data = await res.json();

  showMovies(data.results, true);

  isLoading = false;
}

// =====================
// INIT
// =====================
loadMovies();