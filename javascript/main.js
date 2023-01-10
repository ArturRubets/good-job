/* Grab references to the DOM elements */

const inputSearch = document.querySelector('.search input');
const buttonSearch = document.querySelector('.search button');

/* Define constants */

/* Define classes */

/* Define functions */

const handleSearch = () => {
  if (inputSearch.value) {
    buttonSearch.disabled = false;
  } else {
    buttonSearch.disabled = true;
  }
};

/* Program implementation */

inputSearch.addEventListener('input', handleSearch);
