// Initialize quotes array from localStorage or use default quotes
const defaultQuotes = [
    { text: "Life is what happens while you're busy making other plans.", category: "Life" },
    { text: "The only way to do great work is to love what you do.", category: "Work" },
    { text: "In three words I can sum up everything I've learned about life: it goes on.", category: "Life" }
];

// Load quotes from localStorage or use default quotes
const quotes = JSON.parse(localStorage.getItem('quotes')) || defaultQuotes;

// Get DOM elements
const newQuoteBtn = document.getElementById('new-quote');
const quoteDisplay = document.createElement('div');
const newQuoteText = document.getElementById('newQuoteText');
const newQuoteCategory = document.getElementById('newQuoteCategory');

// Create export button
const exportButton = document.getElementById('export-quotes');
exportButton.addEventListener('click', exportQuotes);

// Create import functionality
const importContainer = document.createElement('div');
importContainer.className = 'import-container';

const fileInput = document.getElementById('importFile');

const importButton = document.createElement('button');
importButton.textContent = 'Import Quotes';
importButton.id = 'import-quotes';
importButton.addEventListener('click', () => fileInput.click());

importContainer.appendChild(importButton);
importContainer.appendChild(fileInput);

// Add elements to DOM
document.body.appendChild(quoteDisplay);
document.body.appendChild(exportButton);
document.body.appendChild(importContainer);


function showRandomQuote() {
    if (quotes.length === 0) {
        quoteDisplay.textContent = "No quotes available";
        return;
    }
    
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const quote = quotes[randomIndex];
    
    // Display the quote and its category in the browser
    quoteDisplay.innerHTML = `
        <p class="quote-text">${quote.text}</p>
        <span class="quote-category">Category: ${quote.category}</span>
    `;
}

function createAddQuoteForm(){
}

function addQuote() {
    const text = newQuoteText.value.trim();
    const category = newQuoteCategory.value.trim();
    
    if (text && category) {
        const newQuote = {
            text: text,
            category: category
        };
        
        // Add the new quote
        quotes.push(newQuote);
        
        // Clear the form
        newQuoteText.value = '';
        newQuoteCategory.value = '';
        
        // Save to localStorage
        localStorage.setItem('quotes', JSON.stringify(quotes));
        
        // Get the currently selected category
        const categorySelect = document.getElementById('categoryFilter');
        const currentCategory = categorySelect.value;
        
        // Update categories dropdown and maintain selection
        populateCategories();
        
        // If we're viewing a specific category and the new quote matches it,
        // or if we're viewing all quotes, show the updated list
        if (!currentCategory || currentCategory === category) {
            filterQuotes(currentCategory);
        }
        
        // Show success message with category information
        const message = document.createElement('div');
        message.className = 'success-message';
        message.textContent = `Quote added successfully to category: ${category}`;
        document.body.appendChild(message);
        
        // Remove success message after 2 seconds
        setTimeout(() => {
            message.remove();
        }, 2000);
    } else {
        // Show error message
        const message = document.createElement('div');
        message.className = 'error-message';
        message.textContent = 'Please fill in both the quote text and category!';
        document.body.appendChild(message);
        
        // Remove error message after 2 seconds
        setTimeout(() => {
            message.remove();
        }, 2000);
    }
}

// Function to export quotes to JSON file
function exportQuotes() {
    // Convert quotes array to JSON string with formatting
    const quotesJson = JSON.stringify(quotes, null, 2);
    
    // Create blob with JSON content
    const blob = new Blob([quotesJson], { type: 'application/json' });
    
    // Create URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Create temporary download link
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = 'my_quotes.json';
    
    // Append link to body, click it, and remove it
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Clean up by revoking the blob URL
    URL.revokeObjectURL(url);
}

// Function to handle file import
function importFromJsonFile(event) {
    const file = event.target.files[0];
    if (file) {
        const fileReader = new FileReader();
        
        fileReader.onload = function(event) {
            try {
                // Parse the JSON content
                const importedQuotes = JSON.parse(event.target.result);
                
                // Validate the imported data
                if (Array.isArray(importedQuotes) && importedQuotes.every(quote => 
                    typeof quote === 'object' && 
                    typeof quote.text === 'string' && 
                    typeof quote.category === 'string')) {
                    
                    // Merge imported quotes with existing ones
                    quotes.push(...importedQuotes);
                    
                    // Update local storage
                    localStorage.setItem('quotes', JSON.stringify(quotes));
                    
                    // Show the latest quote
                    showRandomQuote();
                    
                    // Show success message
                    alert(`Successfully imported ${importedQuotes.length} quotes!`);
                } else {
                    throw new Error('Invalid quote format in JSON file');
                }
            } catch (error) {
                alert('Error importing quotes: ' + error.message);
            }
        };
        
        fileReader.onerror = function() {
            alert('Error reading file');
        };
        
        // Read the file as text
        fileReader.readAsText(file);
    }
};
addEventListener('change', importFromJsonFile);

function populateCategories() {
    // Get unique categories from quotes array
    const categories = [...new Set(quotes.map(quote => quote.category))];
    
    // Get select element
    const categorySelect = document.getElementById('categoryFilter');
    
    // Clear existing options
    categorySelect.innerHTML = '';

    // Add options for each category
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
    
    // Restore the previously selected category from localStorage
    const savedCategory = localStorage.getItem('selectedCategory');
    if (savedCategory && categories.includes(savedCategory)) {
        categorySelect.value = savedCategory;
        filterQuotes(savedCategory);
    }
}

    // Add change event listener to filter quotes
    categorySelect.addEventListener('change', (e) => {
        filterQuotes(e.target.value);
    });

// Function to populate categories dropdown
function populateCategories() {
    // Get unique categories from quotes array and sort them alphabetically
    const categories = [...new Set(quotes.map(quote => quote.category))].sort();
    
    // Get select element
    const categorySelect = document.getElementById('categoryFilter');
    
    // Store the current selection before updating
    const currentSelection = categorySelect.value;
    
    // Clear existing options
    categorySelect.innerHTML = '';
    
    // Add options for each category
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
    
    // First try to restore the current selection
    if (currentSelection && categories.includes(currentSelection)) {
        categorySelect.value = currentSelection;
    } 
    // If no current selection or it's no longer valid, try the saved category
    else {
        const savedCategory = localStorage.getItem('selectedCategory');
        if (savedCategory && categories.includes(savedCategory)) {
            categorySelect.value = savedCategory;
            filterQuotes(savedCategory);
        } else {
            categorySelect.value = ''; // Default to "All Categories"
            filterQuotes('');
        }
    }
}

// Add event listeners
newQuoteBtn.addEventListener('click', showRandomQuote);

// Initialize the display
const savedCategory = localStorage.getItem('selectedCategory');
if (savedCategory) {
    filterQuotes(savedCategory);
} else {
    showRandomQuote();
}

// Initialize categories dropdown
populateCategories();

// Add change event listener to category filter
document.getElementById('categoryFilter').addEventListener('change', (e) => {
    filterQuotes(e.target.value);
});

function filterQuotes(category) {
    // Clear the current display
    quoteDisplay.innerHTML = '';
    
    // Save the selected category to localStorage
    if (category) {
        localStorage.setItem('selectedCategory', category);
    } else {
        localStorage.removeItem('selectedCategory');
    }
    
    // Filter quotes based on category
    const filteredQuotes = category 
        ? quotes.filter(quote => quote.category === category)
        : quotes;
    
    if (filteredQuotes.length === 0) {
        quoteDisplay.innerHTML = `
            <p class="no-quotes">No quotes found in category: ${category}</p>
        `;
        return;
    }
    
    // Create quotes container
    const quotesContainer = document.createElement('div');
    quotesContainer.className = 'quotes-container';
    
    // Display all filtered quotes
    filteredQuotes.forEach(quote => {
        const quoteElement = document.createElement('div');
        quoteElement.className = 'quote';
        quoteElement.innerHTML = `
            <p class="quote-text">${quote.text}</p>
            <span class="quote-category">Category: ${quote.category}</span>
        `;
        quotesContainer.appendChild(quoteElement);
    });
    
    quoteDisplay.appendChild(quotesContainer);
}