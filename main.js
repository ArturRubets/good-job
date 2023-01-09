/* Grab references to the DOM elements */

const dropdown = document.querySelector('.dropdown');
const dropdownContent = document.querySelector('.dropdown-content');
const cards = document.querySelector('.cards');
const inputSearchBar = document.querySelector('.search-bar');
const buttonSearch = document.querySelector('.btn-icon-search');
const main = document.querySelector('main');
const container = document.querySelector('main .container');
const divDarkMode = document.querySelector('.dark-mode-container');
const body = document.querySelector('body');

/* Define constants */

const countriesDomain = 'https://restcountries.com';
const delayDebounce = 500;

/* Define classes */

class Country {
  constructor(url, countryName, population, region, capital) {
    this.url = url;
    this.countryName = countryName;
    this.population = numberWithCommas(population);
    this.region = region;
    this.capital = capital;
  }
}

class CountriesApi {
  codeCountries = [
    'col',
    'pe',
    'at',
    'sm',
    'sh',
    'eg',
    'hn',
    'id',
    'kp',
    'mo',
    'sl',
    'md',
    'ph',
    'cm',
    'gl',
    'mq',
    'lb',
    'rw',
    'ba',
    'it',
  ];

  async getJsonCountries() {
    const url = `${countriesDomain}/v3.1/alpha?codes=${this.codeCountries.join(
      ','
    )}`;
    const response = await fetch(url);
    if (response.ok) {
      return response.json();
    } else {
      console.log(
        `Network countries request for ${query} failed with response ${response.status}: ${response.statusText}`
      );
    }
  }

  getTargetCountries(jsonCountries) {
    return jsonCountries.map((country) => {
      const {
        flags: { png: url },
        name: { common: countryName },
        population,
        region,
        capital,
      } = country;
      return new Country(
        url,
        countryName,
        population,
        region,
        capital && capital.shift()
      );
    });
  }
}

class CountryRepository {
  constructor(countries) {
    this.countries = countries;
    this.filteredName = '';
    this.filteredRegions = [];
  }

  filterByRegion(countries) {
    // Do not apply filtering if this.filteredRegions is empty.
    if (this.filteredRegions.length === 0) {
      return countries;
    }

    return countries.filter((c) =>
      this.filteredRegions.some((r) => r === c.region)
    );
  }

  filterByName(countries) {
    // Do not apply filtering if this.filterByName is empty.
    if (!this.filterByName) {
      return countries;
    }

    return countries.filter((c) =>
      c.countryName.toLowerCase().includes(this.filteredName.toLowerCase())
    );
  }

  sortByName(countries) {
    return countries.sort((a, b) => a.countryName.localeCompare(b.countryName));
  }

  getCountries() {
    const filteredFirst = this.filterByRegion(this.countries);
    const filteredSecond = this.filterByName(filteredFirst);
    return this.sortByName(filteredSecond);
  }

  setFilterName(name) {
    this.filteredName = name;
  }

  setFilterRegion(regions) {
    this.filteredRegions = regions;
  }

  addFilterRegion(region) {
    this.setFilterRegion([...this.filteredRegions, region]);
  }

  removeFilterRegion(region) {
    this.setFilterRegion([...this.filteredRegions.filter((r) => r !== region)]);
  }

  getUniqueRegions() {
    return [...new Set(this.getCountries().map((c) => c.region))];
  }
}

class Loader {
  constructor() {
    const div = document.createElement('div');
    div.classList.add('loader');
    this.loader = div;
  }

  displayLoader() {
    main.append(this.loader);
    container.style.display = 'none';
  }

  removeLoader() {
    this.loader.remove();
    container.style.display = 'block';
  }
}

/* Define functions */

const numberWithCommas = (n) => n.toLocaleString('en-US');

const debounce =
  (callback, delay, timeout = 0) =>
  (e) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => callback(e), delay);
  };

// When the user clicks on the button, toggle between hiding and showing the dropdown content.
const toggleRegionDropdown = (e) => {
  if (
    e.target?.classList.contains('dropdown-content') ||
    e.target.parentNode?.classList.contains('dropdown-content')
  ) {
    return;
  }
  return dropdownContent.classList.toggle('show');
};

// Close the dropdown menu if the user clicks outside of it.
const closeDropdownMenuOutside = (targetEl) => {
  do {
    if (targetEl === dropdown) {
      return;
    }
    targetEl = targetEl.parentNode;
  } while (targetEl);
  // This is a click outside dropdown panel.
  dropdownContent.classList.remove('show');
};

const displayCards = (countries) => {
  const displayWarning = () => {
    const p = document.createElement('p');
    p.classList.add('warning');
    p.textContent = 'No matches found';
    container.append(p);
  };

  const removeWarning = () => {
    container.querySelector('.warning')?.remove();
  };

  const createCardHTML = (countryObj) => {
    return `
      <div class="card">
        <img
          class="flag-image"
          src="${countryObj.url}"
          alt="Flag of ${countryObj.countryName}"
        />
        <div class="card-container">
          <h2 class="country-name">${countryObj.countryName}</h2>
          <div class="indicators">
            <p class="population">
              <b>Population:</b>
              <span class="population-value">${countryObj.population}</span>
            </p>
            <p class="region">
              <b>Region:</b>
              <span class="region-value">${countryObj.region}</span>
            </p>
            ${
              countryObj.capital
                ? `<p class="capital">
                    <b>Capital:</b>
                    <span class="capital-value">${countryObj.capital}</span>
                  </p>`
                : ''
            }
          </div>
        </div>
      </div>
    `;
  };

  removeWarning();
  cards.style.display = 'grid';

  if (!countries || countries.length === 0) {
    displayWarning();
    cards.style.display = 'none';
    return;
  }

  const cardsHTML = countries.map(createCardHTML).join('');
  cards.innerHTML = cardsHTML;
};

const handleCountrySearch = async (rawQuery) => {
  countryRepository.setFilterName(rawQuery);
  displayCards(countryRepository.getCountries());
};

const fillDropdownContent = (countryRepository) => {
  const uniqueRegions = countryRepository.getUniqueRegions();

  const dropDowns = uniqueRegions.map((region) => {
    const a = document.createElement('a');
    a.textContent = region;
    a.onclick = () => {
      if (a.classList.contains('active')) {
        a.classList.remove('active');
        countryRepository.removeFilterRegion(region);
      } else {
        a.classList.add('active');
        countryRepository.addFilterRegion(region);
      }

      displayCards(countryRepository.getCountries());
    };
    return a;
  });

  dropdownContent.append(...dropDowns);
};

const toggleDisplay = (elements) => {
  elements.forEach((e) => {
    if (e.style.display === 'none') {
      e.style.display = 'block';
    } else {
      e.style.display = 'none';
    }
  });
};

const handleDarkMode = () => {
  const span = divDarkMode.querySelector('span');

  if (body.classList.contains('dark-mode')) {
    body.classList.remove('dark-mode');
    span.textContent = 'Dark Mode';
  } else {
    body.classList.add('dark-mode');
    span.textContent = 'Light Mode';
  }
};

/* Program implementation */

let countryRepository;
const countriesClient = new CountriesApi();
const loader = new Loader();

loader.displayLoader();

countriesClient.getJsonCountries().then((value) => {
  countryRepository = new CountryRepository(
    countriesClient.getTargetCountries(value)
  );
  loader.removeLoader();
  displayCards(countryRepository.getCountries());
  fillDropdownContent(countryRepository);
});

window.addEventListener('click', (e) => closeDropdownMenuOutside(e.target));

dropdown.addEventListener('click', toggleRegionDropdown);

inputSearchBar.addEventListener(
  'input',
  debounce((e) => handleCountrySearch(e.target.value), delayDebounce)
);

inputSearchBar.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') {
    inputSearchBar.blur();
    handleCountrySearch(e.target.value);
  }
});

buttonSearch.addEventListener('click', () =>
  handleCountrySearch(inputSearchBar.value)
);

divDarkMode.addEventListener('click', handleDarkMode);
