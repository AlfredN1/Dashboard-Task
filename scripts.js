const clockElement = document.getElementById("clock");
const dateElement = document.getElementById("date");
const dashboardTitle = document.getElementById("dashboard-title");
const linksContainer = document.getElementById("links-container");
const addLinkBtn = document.getElementById("add-link-btn");
const addLinkModal = document.getElementById("add-link-modal");
const closeModal = document.querySelector(".close-modal");
const overlay = document.getElementById("overlay");
const saveLinkBtn = document.getElementById("save-link-btn");
const linkTitleInput = document.getElementById("link-title");
const linkUrlInput = document.getElementById("link-url");
const weatherContainer = document.getElementById("weather-container");
const customApiContainer = document.getElementById("custom-api-container");
const notesArea = document.getElementById("notes-area");

const TITLE_KEY = "dashboard_title";
const LINKS_KEY = "dashboard_links";
const NOTES_KEY = "dashboard_notes";
const WEATHER_LOCATION_KEY = "dashboard_weather_location";

const WEATHER_API_KEY = "90518a305d86198b3db00f8f495ed795";
const NEWS_API_KEY = "96f97871ea114600ab0091dea70ae7be";

function initDashboard() {
  updateClock();
  setInterval(updateClock, 1000);

  loadDashboardTitle();
  loadLinks();
  loadNotes();

  getLocation();
  loadNewsData();

  setupEventListeners();
}

function updateClock() {
  const now = new Date();

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  clockElement.textContent = `${hours}:${minutes}`;

  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  dateElement.textContent = now.toLocaleDateString("sv-SE", options);
}

function loadDashboardTitle() {
  const savedTitle = localStorage.getItem(TITLE_KEY);
  if (savedTitle) {
    dashboardTitle.textContent = savedTitle;
  }
}

function saveDashboardTitle() {
  localStorage.setItem(TITLE_KEY, dashboardTitle.textContent);
}

function loadLinks() {
  const savedLinks = JSON.parse(localStorage.getItem(LINKS_KEY) || "[]");
  linksContainer.innerHTML = "";

  savedLinks.forEach((link) => {
    addLinkToDOM(link);
  });
}

function addLinkToDOM(link) {
  const linkElement = document.createElement("div");
  linkElement.className = "link-item";

  const faviconImg = document.createElement("img");
  faviconImg.className = "link-favicon";

  try {
    const url = new URL(link.url);
    faviconImg.src = `https://www.google.com/s2/favicons?domain=${url.hostname}`;
  } catch (e) {
    faviconImg.src =
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="gray" viewBox="0 0 16 16"%3E%3Cpath d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm.5 5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm2.45 9.5a1 1 0 0 1-1 1h-2.9a1 1 0 0 1-1-1v-.5a1 1 0 0 1 1-1h.9v-3h-.9a1 1 0 0 1-1-1v-.5a1 1 0 0 1 1-1h1.9a1 1 0 0 1 1 1v4.5h.9a1 1 0 0 1 1 1v.5z"/%3E%3C/svg%3E';
  }

  faviconImg.onerror = function () {
    this.src =
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="gray" viewBox="0 0 16 16"%3E%3Cpath d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm.5 5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm2.45 9.5a1 1 0 0 1-1 1h-2.9a1 1 0 0 1-1-1v-.5a1 1 0 0 1 1-1h.9v-3h-.9a1 1 0 0 1-1-1v-.5a1 1 0 0 1 1-1h1.9a1 1 0 0 1 1 1v4.5h.9a1 1 0 0 1 1 1v.5z"/%3E%3C/svg%3E';
  };

  const linkAnchor = document.createElement("a");
  linkAnchor.href = link.url;
  linkAnchor.textContent = link.title;
  linkAnchor.className = "link-title";
  linkAnchor.target = "_blank";

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-link";
  deleteBtn.innerHTML = "&times;";
  deleteBtn.dataset.url = link.url;

  linkElement.appendChild(faviconImg);
  linkElement.appendChild(linkAnchor);
  linkElement.appendChild(deleteBtn);

  linksContainer.appendChild(linkElement);
}

function saveLink() {
  const title = linkTitleInput.value.trim();
  let url = linkUrlInput.value.trim();

  if (!title || !url) {
    alert("Både titel och URL måste fyllas i!");
    return;
  }

  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }

  const link = { title, url };

  const savedLinks = JSON.parse(localStorage.getItem(LINKS_KEY) || "[]");
  savedLinks.push(link);
  localStorage.setItem(LINKS_KEY, JSON.stringify(savedLinks));

  addLinkToDOM(link);

  linkTitleInput.value = "";
  linkUrlInput.value = "";
  closeAddLinkModal();
}

function deleteLink(url) {
  const savedLinks = JSON.parse(localStorage.getItem(LINKS_KEY) || "[]");
  const updatedLinks = savedLinks.filter((link) => link.url !== url);
  localStorage.setItem(LINKS_KEY, JSON.stringify(updatedLinks));

  const linkItems = document.querySelectorAll(".link-item");
  linkItems.forEach((item) => {
    if (item.querySelector(".delete-link").dataset.url === url) {
      item.remove();
    }
  });
}

function openAddLinkModal() {
  addLinkModal.style.display = "block";
  overlay.style.display = "block";
  linkTitleInput.focus();
}

function closeAddLinkModal() {
  addLinkModal.style.display = "none";
  overlay.style.display = "none";
}

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        fetchWeatherData(latitude, longitude);

        localStorage.setItem(
          WEATHER_LOCATION_KEY,
          JSON.stringify({ latitude, longitude })
        );
      },
      (error) => {
        const savedLocation = JSON.parse(
          localStorage.getItem(WEATHER_LOCATION_KEY)
        );

        if (savedLocation) {
          fetchWeatherData(savedLocation.latitude, savedLocation.longitude);
        } else {
          fetchWeatherData(59.3293, 18.0686);
          weatherContainer.innerHTML =
            "<p>Använder standardplats. Aktivera platstjänster för exakt väder.</p>";
        }
      }
    );
  } else {
    weatherContainer.innerHTML =
      "<p>Din webbläsare stödjer inte platstjänster.</p>";

    fetchWeatherData(59.3293, 18.0686);
  }
}

async function fetchWeatherData(latitude, longitude) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&lang=sv&appid=${WEATHER_API_KEY}`
    );

    if (!response.ok) {
      throw new Error("Kunde inte hämta väderdata");
    }

    const data = await response.json();
    displayWeatherData(data);
  } catch (error) {
    weatherContainer.innerHTML =
      "<p>Det gick inte att hämta väderdata. Försök igen senare.</p>";
  }
}

function displayWeatherData(data) {
  const city = data.city.name;

  const dailyForecasts = {};

  data.list.slice(0, 8).forEach((forecast) => {
    const date = new Date(forecast.dt * 1000);
    const day = date.toLocaleDateString("sv-SE", { weekday: "long" });

    if (!dailyForecasts[day]) {
      dailyForecasts[day] = forecast;
    }
  });

  weatherContainer.innerHTML = `<h3>${city}</h3>`;

  Object.keys(dailyForecasts)
    .slice(0, 3)
    .forEach((day) => {
      const forecast = dailyForecasts[day];
      const temp = Math.round(forecast.main.temp);
      const description = forecast.weather[0].description;
      const icon = getWeatherIcon(forecast.weather[0].id);

      const weatherDay = document.createElement("div");
      weatherDay.className = "weather-day";
      weatherDay.innerHTML = `
            <div class="weather-day-title">${day}</div>
            <div class="weather-icon">${icon}</div>
            <div class="weather-temp">${temp}°C</div>
            <div class="weather-desc">${description}</div>
        `;

      weatherContainer.appendChild(weatherDay);
    });
}

function getWeatherIcon(weatherId) {
  if (weatherId >= 200 && weatherId < 300) return "⛈️";
  if (weatherId >= 300 && weatherId < 400) return "🌧️";
  if (weatherId >= 500 && weatherId < 600) return "🌧️";
  if (weatherId >= 600 && weatherId < 700) return "❄️";
  if (weatherId >= 700 && weatherId < 800) return "🌫️";
  if (weatherId === 800) return "☀️";
  if (weatherId > 800) return "☁️";
  return "❓";
}

async function loadNewsData() {
  try {
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=sweden&sortBy=publishedAt&language=sv&apiKey=${NEWS_API_KEY}`
    );

    if (!response.ok) {
      throw new Error("Kunde inte hämta nyhetsdata");
    }

    const data = await response.json();
    displayNewsData(data);
  } catch (error) {
    displaySampleNewsData();
  }
}

function displayNewsData(data) {
  const newsTitle = document.querySelector("#custom-api h2");
  newsTitle.textContent = "Senaste nytt";

  customApiContainer.innerHTML = "";

  data.articles.slice(0, 5).forEach((article) => {
    const newsItem = document.createElement("div");
    newsItem.className = "api-item";

    const title = document.createElement("a");
    title.href = article.url;
    title.target = "_blank";
    title.textContent = article.title;

    const source = document.createElement("div");
    source.className = "news-source";
    source.textContent = article.source.name;

    newsItem.appendChild(title);
    newsItem.appendChild(source);

    customApiContainer.appendChild(newsItem);
  });
}

function displaySampleNewsData() {
  const newsTitle = document.querySelector("#custom-api h2");
  newsTitle.textContent = "Senaste nytt";

  customApiContainer.innerHTML = `
        <div class="api-item">
            <a href="#" target="_blank">Regeringen presenterar ny budget</a>
            <div class="news-source">SVT Nyheter</div>
        </div>
        <div class="api-item">
            <a href="#" target="_blank">Trafikolycka på E4:an orsakar långa köer</a>
            <div class="news-source">Aftonbladet</div>
        </div>
        <div class="api-item">
            <a href="#" target="_blank">Nya regler för bostadsmarknaden</a>
            <div class="news-source">Dagens Nyheter</div>
        </div>
    `;
}

function loadNotes() {
  const savedNotes = localStorage.getItem(NOTES_KEY);
  if (savedNotes) {
    notesArea.value = savedNotes;
  }
}

function saveNotes() {
  localStorage.setItem(NOTES_KEY, notesArea.value);
}

function setupEventListeners() {
  dashboardTitle.addEventListener("blur", saveDashboardTitle);
  dashboardTitle.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      dashboardTitle.blur();
    }
  });

  addLinkBtn.addEventListener("click", openAddLinkModal);
  closeModal.addEventListener("click", closeAddLinkModal);
  overlay.addEventListener("click", closeAddLinkModal);
  saveLinkBtn.addEventListener("click", saveLink);

  linksContainer.addEventListener("click", function (e) {
    if (e.target.classList.contains("delete-link")) {
      deleteLink(e.target.dataset.url);
    }
  });

  notesArea.addEventListener("input", saveNotes);

  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && addLinkModal.style.display === "block") {
      closeAddLinkModal();
    }
  });
}

document.addEventListener("DOMContentLoaded", initDashboard);
