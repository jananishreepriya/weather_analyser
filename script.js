const apiKey = "e167acb90305129f3788d93556252c64"; 
let cities = ["Coimbatore", "Chennai", "Bangalore", "Mumbai", "Delhi"];
let useCelsius = true;
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

const modal = document.getElementById("modal");
const closeModalBtn = document.getElementById("closeModal");

document.getElementById("unitToggle").onclick = () => {
  useCelsius = !useCelsius;
  fetchWeather();
};

// Map OpenWeather condition to emoji
const weatherEmojis = {
  Thunderstorm: "⛈️",
  Drizzle: "🌦️",
  Rain: "🌧️",
  Snow: "❄️",
  Clear: "☀️",
  Clouds: "☁️",
  Mist: "🌫️",
  Smoke: "🌫️",
  Haze: "🌫️",
  Dust: "🌪️",
  Fog: "🌫️",
  Sand: "🌪️",
  Ash: "🌋",
  Squall: "🌬️",
  Tornado: "🌪️"
};

function fetchWeather() {
  const container = document.getElementById("weatherContainer");
  container.innerHTML = "";
  cities.forEach(city => {
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`)
      .then(res => res.json())
      .then(data => {
        if (data.cod === 200) renderCityCard(data);
      })
      .catch(() => {});
  });
}

function renderCityCard(data) {
  const card = document.createElement("div");
  card.className = "city-card";

  const temp = useCelsius ? data.main.temp : (data.main.temp * 9/5 + 32);
  const emoji = weatherEmojis[data.weather[0].main] || "❓";

  card.innerHTML = `
    <div>
      <h3>${data.name}</h3>
      <p>${Math.round(temp)}°${useCelsius ? "C" : "F"}</p>
      <p>${emoji} ${data.weather[0].main}</p>
    </div>
    <div class="city-emoji" aria-hidden="true">${emoji}</div>
  `;
  const favBtn = document.createElement("button");
  favBtn.textContent = favorites.includes(data.name) ? "★" : "☆";
  favBtn.setAttribute("aria-label", favorites.includes(data.name) ? `Remove ${data.name} from favorites` : `Add ${data.name} to favorites`);
  favBtn.onclick = (e) => {
    e.stopPropagation();
    if (favorites.includes(data.name)) {
      favorites = favorites.filter(c => c !== data.name);
    } else {
      favorites.push(data.name);
    }
    localStorage.setItem("favorites", JSON.stringify(favorites));
    fetchWeather();
  };
  card.appendChild(favBtn);
  card.onclick = () => openModal(data.name);
  document.getElementById("weatherContainer").appendChild(card);
}

function openModal(city) {
  modal.classList.remove("hidden");
  setTimeout(() => modal.style.opacity = "1", 10);
  document.getElementById("modalTitle").innerText = `Forecast for ${city}`;
  fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`)
    .then(res => res.json())
    .then(data => renderChart(data));
}

function renderChart(data) {
  const ctx = document.getElementById("forecastChart").getContext("2d");

  if (window.forecastChart) {
    window.forecastChart.destroy();
  }

  const labels = data.list.slice(0, 8).map(item => item.dt_txt.split(" ")[1]);
  const temps = data.list.slice(0, 8).map(item => item.main.temp);
  const windSpeeds = data.list.slice(0, 8).map(item => item.wind.speed);
  const precipitation = data.list.slice(0, 8).map(item => item.rain?.["3h"] || 0);

  window.forecastChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Temperature (°C)',
          data: temps,
          borderColor: '#d4af37',
          backgroundColor: 'rgba(212, 175, 55, 0.3)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Wind Speed (m/s)',
          data: windSpeeds,
          borderColor: '#ffa500',
          backgroundColor: 'rgba(255, 165, 0, 0.3)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Rain (mm)',
          data: precipitation,
          borderColor: '#a4c639',
          backgroundColor: 'rgba(164, 198, 57, 0.3)',
          fill: true,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: '#000',
          titleColor: '#d4af37',
          bodyColor: '#ffd700'
        },
        legend: {
          position: 'top',
          labels: {
            color: '#d4af37'
          }
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      },
      scales: {
        x: {
          ticks: { color: '#d4af37' },
          grid: { color: 'rgba(212, 175, 55, 0.2)' }
        },
        y: {
          ticks: { color: '#d4af37' },
          grid: { color: 'rgba(212, 175, 55, 0.2)' }
        }
      }
    }
  });
}

closeModalBtn.onclick = () => {
  modal.style.opacity = "0";
  setTimeout(() => modal.classList.add("hidden"), 400);
  const canvas = document.getElementById("forecastChart");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
};

modal.onclick = (e) => {
  if (e.target === modal) {
    closeModalBtn.onclick();
  }
};

fetchWeather();
