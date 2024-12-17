import quotes from '.././src/data/words.json';

interface Quote {
  id: number;
  word: string;
  definition: string;
  pronunciation: string;
}

const quotesPerPage = 6;
let currentPage = parseInt(localStorage.getItem('currentPage') || '1', 10);
const quotesCache: Record<number, Quote[]> = {};

// Helper: Fetch a chunk of quotes based on start and end indexes
function fetchQuotesChunk(startIndex: number, endIndex: number): Quote[] {
  // Shuffle the quotes array and return a chunk
  const shuffledQuotes = [...quotes].sort(() => 0.5 - Math.random()); // Random shuffle
  return shuffledQuotes.slice(startIndex, endIndex);
}

// Helper: Copy text to clipboard with feedback
async function copyToClipboard(text: string, button: HTMLButtonElement): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    button.innerHTML = `<i class="fas fa-check"></i>`;
    setTimeout(() => (button.innerHTML = `<i class="fas fa-copy"></i>`), 1500);
  } catch (error) {
    console.error('Error copying text:', error);
    button.innerHTML = `<i class="fas fa-times"></i>`;
    setTimeout(() => (button.innerHTML = `<i class="fas fa-copy"></i>`), 1500);
  }
}

function renderQuotes(page: number): void {
  const container = document.getElementById('quotes-container');
  const prevBtn = document.getElementById('prev-btn') as HTMLButtonElement;
  const nextBtn = document.getElementById('next-btn') as HTMLButtonElement;
  const loadingSpinner = document.getElementById('loading-spinner');
  const darkModeToggle = document.getElementById('toggle-hide');
  const pageNumber = document.getElementById('page-number-input') as HTMLInputElement;
  const pageButton = document.getElementById('go-btn') as HTMLButtonElement;
  const pageINFO = document.getElementById('page-info') as HTMLElement;

  if (!container || !loadingSpinner || !prevBtn || !nextBtn || !darkModeToggle || !pageNumber || !pageButton || !pageINFO) {
    console.error('Required DOM elements are missing.');
    return;
  }

  // Use requestAnimationFrame to batch DOM updates
  requestAnimationFrame(() => {
    // Show loading spinner and hide other elements
    loadingSpinner.classList.remove('is-hidden');
    container.classList.add('is-hidden');
    [prevBtn, nextBtn, darkModeToggle, pageNumber, pageButton, pageINFO].forEach((btn) => btn.classList.add('is-hidden'));
  });

  // Simulate data fetching delay
  setTimeout(() => {
    const startIndex = (page - 1) * quotesPerPage;
    const endIndex = startIndex + quotesPerPage;
    quotesCache[page] = quotesCache[page] || fetchQuotesChunk(startIndex, endIndex);

    // Clear and populate container
    requestAnimationFrame(() => {
      container.innerHTML = '';
      quotesCache[page].forEach((quote) => {
        const CopyWord = `✍️ Word: ${quote.word}\n📚 Definition: ${quote.definition}\n🗣 Pronunciation:: ${quote.pronunciation}`;
        const card = document.createElement('div');
        card.className = 'box';

        card.innerHTML = `
         <div class="content">
              <p class="quote-text">
                ✍️ Wd: ${quote.word} <br>
                📚 Def: ${quote.definition} <br>
                🗣 pron: ${quote.pronunciation}
              </p>
              <button class="button is-small is-primary copy-btn mt-3">
                <i class="fas fa-copy"></i>
              </button>
              </div>
        `;

        const copyBtn = card.querySelector('.copy-btn') as HTMLButtonElement;
        copyBtn.addEventListener('click', () => copyToClipboard(CopyWord, copyBtn));

        container.appendChild(card);
      });

      // Handle pagination visibility
      const totalPages = Math.ceil(quotes.length / quotesPerPage);
      renderPagination(page, totalPages);
      updatePageInfo();

      // Hide loading spinner and show elements
      requestAnimationFrame(() => {
        loadingSpinner.classList.add('is-hidden');
        container.classList.remove('is-hidden');
        [prevBtn, nextBtn, darkModeToggle, pageNumber, pageButton, pageINFO].forEach((btn) =>
          btn.classList.remove('is-hidden')
        );

        // Save current page in localStorage
        localStorage.setItem('currentPage', page.toString());
      });
    });
  }, 500);
}

// Render pagination controls
function renderPagination(currentPage: number, totalPages: number): void {
  const prevBtn = document.getElementById('prev-btn') as HTMLButtonElement;
  const nextBtn = document.getElementById('next-btn') as HTMLButtonElement;

  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage === totalPages;

  if (prevBtn.disabled) {
    prevBtn.classList.add('blurred');
  } else {
    prevBtn.classList.remove('blurred');
  }

  if (nextBtn.disabled) {
    nextBtn.classList.add('blurred');
  } else {
    nextBtn.classList.remove('blurred');
  }

}

// Debounced pagination handler
let debounceTimeout: NodeJS.Timeout;

function handlePaginationChange(change: number): void {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    const totalPages = Math.ceil(quotes.length / quotesPerPage);
    currentPage = Math.max(1, Math.min(currentPage + change, totalPages));
    renderQuotes(currentPage);
  }, 300);
}

function handlePageInput(): void {
  const pageInput = document.getElementById('page-number-input') as HTMLInputElement;
  const pageNumber = parseInt(pageInput.value, 10);
  const totalPages = Math.ceil(quotes.length / quotesPerPage);

  if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > totalPages) {
    const notificationContainer = document.getElementById('notification-container') as HTMLElement;

    requestAnimationFrame(() => {
      if (notificationContainer) {
        notificationContainer.innerHTML = `
          <div class="notification is-danger is-light">
            Please enter a valid page number between 1 and ${totalPages}
          </div>
        `;

        setTimeout(() => {
          requestAnimationFrame(() => {
            if (notificationContainer) {
              notificationContainer.innerHTML = '';
            }
          });
        }, 2000);
      }
    });

    return;
  }

  currentPage = pageNumber;

  requestAnimationFrame(() => {
    renderQuotes(currentPage);
  });
}

function updatePageInfo(): void {
  const totalPages = Math.ceil(quotes.length / quotesPerPage);
  const pageInfo = document.getElementById('page-info') as HTMLElement;
  const pageInput = document.getElementById('page-number-input') as HTMLInputElement;

  requestAnimationFrame(() => {
    if (pageInfo) {
      pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    }

    if (pageInput) {
      pageInput.value = currentPage.toString();
    }
  });
}

// Dark mode toggle
function toggleDarkMode(): void {
  const body = document.body;
  const isDarkMode = body.classList.contains('has-background-dark');
  body.classList.toggle('has-background-dark', !isDarkMode);
  body.classList.toggle('has-text-white', !isDarkMode);
  localStorage.setItem('theme', isDarkMode ? 'light' : 'dark');

  const toggleInput = document.getElementById('dark-mode-toggle') as HTMLInputElement;
  if (toggleInput) toggleInput.checked = !isDarkMode;
}

// Apply saved or preferred theme
function applyTheme(): void {
  const savedTheme = localStorage.getItem('theme');
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;

  const isDarkMode = savedTheme === 'dark' || (savedTheme === null && prefersDarkScheme);
  document.body.classList.toggle('has-background-dark', isDarkMode);
  document.body.classList.toggle('has-text-white', isDarkMode);

  const toggleInput = document.getElementById('dark-mode-toggle') as HTMLInputElement;
  if (toggleInput) toggleInput.checked = isDarkMode;
}

// Initialize app
function init(): void {
  applyTheme();

  try {
    if (!Array.isArray(quotes) || quotes.length === 0) {
      throw new Error('No quotes found. Please check the quotes data.');
    }
    renderQuotes(currentPage);
  } catch (error) {
    console.error('Error rendering quotes:', error);
    const container = document.getElementById('quotes-container');
    if (container) {
      container.innerHTML = `<p class="has-text-danger">Failed to load quotes.</p>`;
    }
  }

  document.getElementById('prev-btn')?.addEventListener('click', () => handlePaginationChange(-1));
  document.getElementById('go-btn')?.addEventListener('click', handlePageInput);
  document.getElementById('next-btn')?.addEventListener('click', () => handlePaginationChange(1));
  document.getElementById('dark-mode-toggle')?.addEventListener('change', toggleDarkMode);
}

// Run the app
init();
