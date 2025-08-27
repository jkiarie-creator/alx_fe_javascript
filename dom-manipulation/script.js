// Array to store quote objects
const quotes = [
    { text: "Life is what happens while you're busy making other plans.", category: "Life" },
    { text: "The only way to do great work is to love what you do.", category: "Work" },
    { text: "In three words I can sum up everything I've learned about life: it goes on.", category: "Life" }
];

// Get DOM elements
const newQuoteBtn = document.getElementById('new-quote');
const quoteDisplay = document.createElement('div');
const newQuoteText = document.getElementById('newQuoteText');
const newQuoteCategory = document.getElementById('newQuoteCategory');
document.body.appendChild(quoteDisplay);

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
    } else {
        alert('Please fill in both the quote text and category!');
    }
}

// Add event listener to new quote button
newQuoteBtn.addEventListener('click', showRandomQuote);

// Show initial random quote
showRandomQuote();
