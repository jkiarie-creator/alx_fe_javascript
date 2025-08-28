// API configuration
const API_BASE_URL = 'https://jsonplaceholder.typicode.com';
const POLLING_INTERVAL = 30000; // 30 seconds

// Create notification container
const notificationCenter = document.createElement('div');
notificationCenter.className = 'notification-center';
document.body.appendChild(notificationCenter);

// Create conflict resolution modal
const conflictModal = document.createElement('div');
conflictModal.className = 'conflict-modal';
conflictModal.innerHTML = `
    <div class="modal-content">
        <h2>Resolve Conflict</h2>
        <div class="conflict-details">
            <div class="local-version">
                <h3>Local Version</h3>
                <div class="quote-content"></div>
            </div>
            <div class="server-version">
                <h3>Server Version</h3>
                <div class="quote-content"></div>
            </div>
        </div>
        <div class="modal-actions">
            <button class="keep-local">Keep Local</button>
            <button class="keep-server">Keep Server</button>
            <button class="keep-both">Keep Both</button>
            <button class="cancel">Cancel</button>
        </div>
    </div>
`;
document.body.appendChild(conflictModal);

// Notification system
const notifications = {
    show(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span class="message">${message}</span>
            <button class="close">&times;</button>
        `;
        
        notification.querySelector('.close').addEventListener('click', () => {
            notification.remove();
        });
        
        notificationCenter.appendChild(notification);
        
        if (duration) {
            setTimeout(() => notification.remove(), duration);
        }
        
        return notification;
    },
    
    info(message) {
        return this.show(message, 'info');
    },
    
    success(message) {
        return this.show(message, 'success');
    },
    
    error(message) {
        return this.show(message, 'error', 5000);
    },
    
    conflict(message) {
        return this.show(message, 'conflict', 0);
    }
};

// Initialize quotes array from localStorage or use default quotes
const defaultQuotes = [
    { text: "Life is what happens while you're busy making other plans.", category: "Life", timestamp: Date.now(), id: 1 },
    { text: "The only way to do great work is to love what you do.", category: "Work", timestamp: Date.now(), id: 2 },
    { text: "In three words I can sum up everything I've learned about life: it goes on.", category: "Life", timestamp: Date.now(), id: 3 }
];

// Load quotes from localStorage or use default quotes
const quotes = JSON.parse(localStorage.getItem('quotes')) || defaultQuotes;

// Synchronization functions
const syncManager = {
    lastSyncTimestamp: Date.now(),

    async syncQuotes() {
        try {
            // Fetch server quotes
            const serverQuotes = await apiService.fetchQuotesFromServer();
            if (!serverQuotes.length) return;

            // Get current local quotes
            const localQuotes = [...quotes];
            const conflicts = [];
            
            // Create maps for easier lookup
            const localQuotesMap = new Map(localQuotes.map(quote => [quote.id, quote]));
            const serverQuotesMap = new Map(serverQuotes.map(quote => [quote.id, quote]));
            
            // Check for conflicts and handle non-conflicting updates
            for (const serverQuote of serverQuotes) {
                const localQuote = localQuotesMap.get(serverQuote.id);
                
                if (localQuote) {
                    // Check for conflicts (both versions modified since last sync)
                    if (localQuote.timestamp > this.lastSyncTimestamp && 
                        serverQuote.timestamp > this.lastSyncTimestamp &&
                        localQuote.text !== serverQuote.text) {
                        
                        conflicts.push({
                            local: localQuote,
                            server: serverQuote,
                            id: serverQuote.id
                        });
                    } else if (serverQuote.timestamp > localQuote.timestamp) {
                        // No conflict, server version is newer
                        const index = quotes.findIndex(q => q.id === serverQuote.id);
                        if (index !== -1) {
                            quotes[index] = serverQuote;
                            notifications.info(`Updated quote: "${serverQuote.text.substring(0, 30)}..."`);
                        }
                    }
                } else {
                    // New quote from server
                    quotes.push(serverQuote);
                    notifications.success(`New quote added: "${serverQuote.text.substring(0, 30)}..."`);
                }
            }
            
            // Handle conflicts if any
            if (conflicts.length > 0) {
                await this.handleConflicts(conflicts);
            } else {
                // Update local storage
                localStorage.setItem('quotes', JSON.stringify(quotes));
                
                // Update UI
                const categorySelect = document.getElementById('categoryFilter');
                if (categorySelect) {
                    const currentCategory = categorySelect.value;
                    populateCategories();
                    filterQuotes(currentCategory);
                }
                
                notifications.success('Synchronization completed successfully');
            }
            
            // Update last sync timestamp
            this.lastSyncTimestamp = Date.now();
            localStorage.setItem('lastSyncTimestamp', this.lastSyncTimestamp);
            
        } catch (error) {
            console.error('Error during synchronization:', error);
            this.showSyncError(error);
        }
    },
    
    showSyncNotification() {
        const notification = document.createElement('div');
        notification.className = 'sync-notification';
        notification.textContent = 'Quotes synchronized with server';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    },
    
    showSyncError(error) {
        notifications.error(`Sync error: ${error.message}`);
    },

    async handleConflicts(conflicts) {
        for (const conflict of conflicts) {
            await new Promise((resolve) => {
                const modal = conflictModal;
                const localContent = modal.querySelector('.local-version .quote-content');
                const serverContent = modal.querySelector('.server-version .quote-content');
                
                // Display conflicting versions
                localContent.innerHTML = `
                    <p class="quote-text">${conflict.local.text}</p>
                    <span class="quote-category">Category: ${conflict.local.category}</span>
                    <span class="timestamp">Last modified: ${new Date(conflict.local.timestamp).toLocaleString()}</span>
                `;
                
                serverContent.innerHTML = `
                    <p class="quote-text">${conflict.server.text}</p>
                    <span class="quote-category">Category: ${conflict.server.category}</span>
                    <span class="timestamp">Last modified: ${new Date(conflict.server.timestamp).toLocaleString()}</span>
                `;
                
                // Show modal
                modal.style.display = 'block';
                
                // Handle resolution choices
                const handleChoice = (choice) => {
                    modal.style.display = 'none';
                    switch(choice) {
                        case 'local':
                            // Keep local version (no change needed)
                            notifications.info('Kept local version');
                            break;
                        case 'server':
                            // Use server version
                            const index = quotes.findIndex(q => q.id === conflict.id);
                            if (index !== -1) {
                                quotes[index] = conflict.server;
                            }
                            notifications.info('Updated to server version');
                            break;
                        case 'both':
                            // Keep both versions
                            const newQuote = {...conflict.server, id: Date.now()};
                            quotes.push(newQuote);
                            notifications.info('Kept both versions');
                            break;
                        default:
                            notifications.info('Conflict resolution skipped');
                    }
                    resolve();
                };
                
                // Attach event listeners
                modal.querySelector('.keep-local').onclick = () => handleChoice('local');
                modal.querySelector('.keep-server').onclick = () => handleChoice('server');
                modal.querySelector('.keep-both').onclick = () => handleChoice('both');
                modal.querySelector('.cancel').onclick = () => handleChoice('cancel');
            });
        }
        
        // After all conflicts are resolved, update storage and UI
        localStorage.setItem('quotes', JSON.stringify(quotes));
        const categorySelect = document.getElementById('categoryFilter');
        if (categorySelect) {
            const currentCategory = categorySelect.value;
            populateCategories();
            filterQuotes(currentCategory);
        }
        
        notifications.success('All conflicts resolved');
    }
};

// API Service functions
const apiService = {
    async fetchQuotesFromServer() {
        try {
            const response = await fetch(`${API_BASE_URL}/posts?_limit=5`);
            if (!response.ok) throw new Error('Network response was not ok');
            const posts = await response.json();
            
            // Transform posts into quotes format with timestamp and server flag
            return posts.map(post => ({
                id: post.id,
                text: post.body.split('\n')[0], // Use first line of post body as quote
                category: post.title.split(' ')[0], // Use first word of title as category
                timestamp: Date.now(),
                serverVersion: true
            }));
        } catch (error) {
            console.error('Error fetching quotes:', error);
            return [];
        }
    },

    async postQuote(quote) {
        try {
            const response = await fetch(`https://jsonplaceholder.typicode.com/posts`, {
                method: 'POST',
                body: JSON.stringify({
                    title: quote.category,
                    body: quote.text,
                    userId: 1
                }),
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8'
                }
            });
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('Error posting quote:', error);
            return null;
        }
    }
};

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
importButton.addEventListener('change', () => fileInput.dispatchEvent(new Event('change')));

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

async function addQuote() {
    const text = newQuoteText.value.trim();
    const category = newQuoteCategory.value.trim();
    
    if (text && category) {
        const newQuote = {
            text: text,
            category: category
        };
        
        // Show loading state
        const loadingMessage = document.createElement('div');
        loadingMessage.className = 'info-message';
        loadingMessage.textContent = 'Saving quote...';
        document.body.appendChild(loadingMessage);
        
        // Try to post to server
        const result = await apiService.postQuote(newQuote);
        
        if (result) {
            // Add the new quote locally
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
            
            // Remove loading message
            loadingMessage.remove();
            
            // Show success message
            const successMessage = document.createElement('div');
            successMessage.className = 'success-message';
            successMessage.textContent = `Quote added successfully to category: ${category}`;
        
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

// Function to fetch and merge new quotes
async function fetchNewQuotes() {
    const newQuotes = await apiService.fetchQuotesFromServer();
    if (newQuotes.length > 0) {
        // Merge new quotes, avoiding duplicates
        const existingTexts = new Set(quotes.map(q => q.text));
        const uniqueNewQuotes = newQuotes.filter(q => !existingTexts.has(q.text));
        
        if (uniqueNewQuotes.length > 0) {
            quotes.push(...uniqueNewQuotes);
            localStorage.setItem('quotes', JSON.stringify(quotes));
            
            // Update the display if needed
            const categorySelect = document.getElementById('categoryFilter');
            const currentCategory = categorySelect.value;
            
            // Refresh categories and maintain current filter
            populateCategories();
            filterQuotes(currentCategory);
            
            // Show notification
            const notification = document.createElement('div');
            notification.className = 'info-message';
            notification.textContent = `${uniqueNewQuotes.length} new quote(s) added from server`;
            document.body.appendChild(notification);
            
            setTimeout(() => notification.remove(), 3000);
        }
    }
}

// Start periodic fetching
setInterval(fetchNewQuotes, POLLING_INTERVAL);

// Initial fetch
fetchNewQuotes();

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
}}
