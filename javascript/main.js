/* Grab references to the DOM elements */

const searchInputWeather = document.querySelector('.search-input-weather');
const selectedText = document.querySelector('.selected-text');
const selectedInput = document.querySelector('.selected-input');
const searchRemoveText = document.querySelector('.search-remove-text');
const weatherWidget = document.querySelector('.weather-widget');

/* Define constants */

const apiKey = '77026bf24e9d8b82fd8d44d6069e70cf';
const weatherDomain = 'https://api.openweathermap.org';
const iconsDomain = 'https://openweathermap.org';
const delayDebounce = 1250;
const weatherGeocodingLimit = 1;

/* Define classes */

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
    this.weatherIconURL = `${iconsDomain}/img/wn/${weatherIcon}@2x.png`;
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

class WeatherAPI {
  // Query is city.
  async getGeocoding(query, limit, apiKey) {
    const url = `${weatherDomain}/geo/1.0/direct?q=
  ${this.geocodingQueryProcessing(query)}&limit=${limit}&appid=${apiKey}`;
    const response = await fetch(url);
    if (response.ok) {
      return await response.json();
    } else {
      console.log(
        `Network geocoding request for ${query} failed with response ${response.status}: ${response.statusText}`
      );
    }
  }

  geocodingQueryProcessing(query) {
    return query
      .split(/[\s,]+/)
      .join(',')
      .trim();
  }

  async getWeather(lat, lon, apiKey) {
    if (!lat || !lon) {
      return;
    }
    const url = `${weatherDomain}/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    const response = await fetch(url);
    if (response.ok) {
      return await response.json();
    } else {
      console.log(
        `Network weather request for lat: ${lat} and lon: ${lon} failed with response ${response.status}: ${response.statusText}`
      );
    }
  }
}

/* Define functions */

const debounce =
  (callback, delay, timeout = 0) =>
  (e) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => callback(e), delay);
  };

const removeSearch = () => {
  searchInputWeather.value = '';
  selectedText.textContent = '';
  selectedInput.style.display = 'none';
  searchInputWeather.focus();
};

const handleWeatherInput = async (e, weatherClient) => {
  const rawQuery = e.target.value;
  if (rawQuery.trim() === '') {
    removeSearch();
    return;
  }

  selectedText.textContent = rawQuery;
  selectedInput.style.display = 'block';

  try {
    const geocoding = await weatherClient.getGeocoding(
      rawQuery,
      weatherGeocodingLimit,
      apiKey
    );

    const firstCity = geocoding[0];
    if (!firstCity) {
      return;
    }

    const jsonWeather = await weatherClient.getWeather(
      firstCity.lat,
      firstCity.lon,
      apiKey
    );
    const weatherCalendar = handleJsonWeather(jsonWeather);

    displayWeather(
      weatherCalendar.currentWeather,
      weatherCalendar.forecastWeatherArray
    );

    setBackground(jsonWeather.city.name + ' ' + jsonWeather.city.country);
  } catch (error) {
    displayFailedWeatherSearch(error);
  }
};

const handleJsonWeather = (jsonWeather) => {
  if (!jsonWeather) {
    return;
  }

  const currentDate = new Date().toDateString();

  // forecast.list contains the weather forecast for every three hours.
  // tempArray contains only one forecast for each day at 12:00,
  // but for the current day, the forecast will be the first in the list.
  const tempArray = jsonWeather.list
    .filter(
      (f) =>
        jsonWeather.list[0].dt_txt === f.dt_txt ||
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
          jsonWeather.city.country,
          jsonWeather.city.name
        )
    );
  return new WeatherCalendar(tempArray[0], tempArray.slice(1));
};

const displayWeather = (currentWeather, forecastWeatherArray) => {
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
};

const displayFailedWeatherSearch = (error) => {
  weatherWidget.style.display = 'none';
  console.log(error);
};

// Getting the weather according to the user's location.
const initialWeatherSearch = (weatherClient) =>
  navigator.geolocation.getCurrentPosition(async (position) => {
    const { latitude, longitude } = position.coords;
    const jsonWeather = await weatherClient.getWeather(
      latitude,
      longitude,
      apiKey
    );
    const weatherCalendar = handleJsonWeather(jsonWeather);
    if (!weatherCalendar) {
      return;
    }
    displayWeather(
      weatherCalendar.currentWeather,
      weatherCalendar.forecastWeatherArray
    );

    setBackground(jsonWeather.city.name + ' ' + jsonWeather.city.country);
  });

const getRandomImageByContext = (contextText) =>
  `https://source.unsplash.com/1600x900/?${contextText}`;

const setBackground = (searchImage) =>
  (document.querySelector(
    '.background-image'
  ).style.backgroundImage = `url("${getRandomImageByContext(searchImage)}")`);

/* Program implementation */

searchInputWeather.focus();

searchRemoveText.addEventListener('click', removeSearch);

const weatherClient = new WeatherAPI();

searchInputWeather.addEventListener(
  'input',
  debounce((e) => handleWeatherInput(e, weatherClient), delayDebounce)
);

searchInputWeather.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') {
    searchInputWeather.blur();
    handleWeatherInput(e, weatherClient);
  }
});

initialWeatherSearch(weatherClient);
