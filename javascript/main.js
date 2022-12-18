const searchInputWeather = document.querySelector('.search-input-weather');
const selectedText = document.querySelector('.selected-text');
const selectedInput = document.querySelector('.selected-input');
const searchRemoveText = document.querySelector('.search-remove-text');
const weatherWidget = document.querySelector('.weather-widget');
const delay = 2000;
const weatherLimit = 1;
const debounce =
  (callback, delay, timeout = 0) =>
  (e) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => callback(e), delay);
  };
const apiKey = '77026bf24e9d8b82fd8d44d6069e70cf';
const domain = 'https://api.openweathermap.org';

class Weather {
  constructor(
    temperature,
    feelsLike,
    temperatureMin,
    temperatureMax,
    weatherMainText,
    weatherDescription,
    weatherIcon,
    dateString,
    locationCountry,
    locationCity
  ) {
    this.temperature = temperature;
    this.feelsLike = feelsLike;
    this.temperatureMin = temperatureMin;
    this.temperatureMax = temperatureMax;
    this.weatherMainText = weatherMainText;
    this.weatherDescription = weatherDescription;
    this.weatherIconURL = `http://openweathermap.org/img/wn/${weatherIcon}@2x.png`;
    this.date = new Date(dateString);
    this.locationCountry = locationCountry;
    this.locationCity = locationCity;
  }
}

class WeatherCalendar {
  constructor(currentWeather, forecastWeatherArray) {
    this.currentWeather = currentWeather;
    this.forecastWeatherArray = forecastWeatherArray;
  }
}

searchInputWeather.focus();

async function getGeocoding(query, limit, apiKey) {
  const url = `${domain}/geo/1.0/direct?q=
  ${geocodingQueryProcessing(query)}&limit=${limit}&appid=${apiKey}`;
  console.log(url);
  const response = await fetch(url);
  if (response.ok) {
    return await response.json();
  } else {
    console.log(
      `Network geocoding request for ${query} failed with response ${response.status}: ${response.statusText}`
    );
  }
}

const geocodingQueryProcessing = (query) =>
  query
    .split(/[\s,]+/)
    .join(',')
    .trim();

async function getWeather(lat, lon, apiKey) {
  if (!lat || !lon) {
    return;
  }
  const url = `${domain}/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
  console.log(url);
  const response = await fetch(url);
  if (response.ok) {
    return await response.json();
  } else {
    console.log(
      `Network weather request for lat: ${lat} and lon: ${lon} failed with response ${response.status}: ${response.statusText}`
    );
  }
}

searchRemoveText.addEventListener('click', removeSearch);

function removeSearch() {
  searchInputWeather.value = '';
  selectedText.textContent = '';
  selectedInput.style.display = 'none';
  searchInputWeather.focus();
}

searchInputWeather.addEventListener(
  'input',
  debounce(handleWeatherInput, delay)
);

async function handleWeatherInput(e) {
  const rawQuery = e.target.value;
  if (rawQuery.trim() === '') {
    removeSearch();
    return;
  }

  selectedText.textContent = rawQuery;
  selectedInput.style.display = 'block';

  try {
    const geocoding = await getGeocoding(rawQuery, weatherLimit, apiKey);
    const firstCity = geocoding[0];

    const forecast = await getWeather(firstCity.lat, firstCity.lon, apiKey);
    const weatherCalendar = handleAPIForecast(forecast);

    displayWeather(
      weatherCalendar.currentWeather,
      weatherCalendar.forecastWeatherArray
    );
  } catch (error) {
    displayFailedWeatherSearch(error);
  }
}

function handleAPIForecast(forecast) {
  const currentDate = new Date().toDateString();

  // forecast.list contains the weather forecast for every three hours.
  // tempArray contains only one forecast for each day at 12:00,
  // but for the current day, the forecast will be the first in the list.
  const tempArray = forecast.list
    .filter(
      (f) =>
        forecast.list[0].dt_txt === f.dt_txt ||
        (f.dt_txt.includes('12:00') &&
          new Date(f.dt_txt).toDateString() !== currentDate)
    )
    .map(
      (f) =>
        new Weather(
          f.main.temp,
          f.main.feels_like,
          f.main.temp_min,
          f.main.temp_max,
          f.weather[0].main,
          f.weather[0].description,
          f.weather[0].icon,
          f.dt_txt,
          forecast.city.country,
          forecast.city.name
        )
    );
  return new WeatherCalendar(tempArray[0], tempArray.slice(1));
}

function displayWeather(currentWeather, forecastWeatherArray) {
  try {
    const currentWeatherHTML = (() => {
      const temperature = Math.round(currentWeather.temperature);
      const feelsLike = Math.round(currentWeather.feelsLike);
      const location =
        currentWeather.locationCity + ', ' + currentWeather.locationCountry;
      return `
      <div class="weather-current">
        <div class="weather-container">
          <div>
            <span class="today-temperature">
            ${temperature}°C
            </span>
            <span class="feels-like-temperature">
            Feels like ${feelsLike}°C
            </span>
          </div>
          <div class="weather-info">
            <div class="weather-text">${currentWeather.weatherMainText}</div>
            <div class="location">${location}</div>
          </div>
          <div>
            <img class="weather-image" src="${currentWeather.weatherIconURL}" alt="Weather image" />
          </div>
        </div>
      </div>
    `;
    })();

    const forecastWeatherHTML = (() => {
      const forecastSections = forecastWeatherArray
        .map((f) => {
          const day = new Date(f.date).toLocaleDateString('en-gb', {
            weekday: 'short',
          });
          const temperatureMin = Math.round(f.temperatureMin);
          const temperatureMax = Math.round(f.temperatureMax);
          return `
              <div class="section">
                <span class="day-of-week">${day}</span>
                <div>
                  <img
                    class="weather-image"
                    src="${f.weatherIconURL}"
                    alt="Weather image"
                  />
                </div>
                <span>${f.weatherDescription}</span>
                <div>
                  <div class="temperature max-temperature">${temperatureMin}°C</div>
                  <div class="temperature min-temperature">${temperatureMax}°C</div>
                </div>
              </div>
            `;
        })
        .join('');
      return `
      <div class="weather-forecast">
        <div class="weather-container">
          ${forecastSections}
        </div>
      </div>
    `;
    })();

    weatherWidget.style.display = 'block';
    weatherWidget.innerHTML = currentWeatherHTML + forecastWeatherHTML;
  } catch (error) {
    displayFailedWeatherSearch(error);
  }
}

function displayFailedWeatherSearch(error) {
  weatherWidget.style.display = 'none';
  console.log(error);
}

// Getting the weather according to the user's location
function initialWeatherSearch() {
  navigator.geolocation.getCurrentPosition(async (position) => {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    const forecast = await getWeather(lat, lon, apiKey);
    const weatherCalendar = handleAPIForecast(forecast);
    displayWeather(
      weatherCalendar.currentWeather,
      weatherCalendar.forecastWeatherArray
    );
  });
}

initialWeatherSearch();
