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
        
        quotes.push(newQuote);
        newQuoteText.value = '';
        newQuoteCategory.value = '';
        
        // Show the newly added quote
        showRandomQuote();
        
        // Show success message
        alert('Quote added successfully!');
        localStorage.setItem('quotes', JSON.stringify(quotes)); 
    } else {
        alert('Please fill in both the quote text and category!');
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

// Add event listener to new quote button
newQuoteBtn.addEventListener('click', showRandomQuote);

// Show initial random quote
showRandomQuote();
