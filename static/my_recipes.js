document.addEventListener('DOMContentLoaded', function() {
    // DOM Element References
    const recipesContainer = document.getElementById('recipesContainer');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const hitCountSpan = document.getElementById('hitCount');
    const userIPSpan = document.getElementById('userIP');
    const emptyState = document.getElementById('emptyState');
    const homeButtonContainer = document.getElementById('homeButtonContainer');

    // State Management
    let userIP = '';
    let totalRecipes = 0;

    // UI State Functions
    function showLoading() {
        loadingSpinner.style.display = 'block';
        recipesContainer.style.display = 'none';
        if (emptyState) emptyState.style.display = 'none';
        if (homeButtonContainer) homeButtonContainer.style.display = 'none';
    }

    function hideLoading() {
        loadingSpinner.style.display = 'none';
    }

    function showEmptyState() {
        if (emptyState) {
            recipesContainer.style.display = 'none';
            emptyState.style.display = 'block';
            if (homeButtonContainer) homeButtonContainer.style.display = 'none';
        }
    }

    function hideEmptyState() {
        if (emptyState) {
            emptyState.style.display = 'none';
            recipesContainer.style.display = 'block';
            if (homeButtonContainer) homeButtonContainer.style.display = 'block';
        }
    }

    // Animation Helper
    function applyEntryAnimation(element, delay = 0) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, delay);
    }

    // Get User IP Information
    async function getClientIP() {
        try {
            // Check localStorage first
            const storedIPInfo = localStorage.getItem('ipInfo');
            if (storedIPInfo) {
                const ipInfo = JSON.parse(storedIPInfo);
                updateUserIPDisplay(ipInfo.ip);
                return ipInfo.ip.replace(/\./g, '_');
            }

            // If not in localStorage, show error
            throw new Error('IP information not found');
        } catch (error) {
            console.error('Error fetching IP:', error);
            userIPSpan.innerHTML = '<i class="fas fa-exclamation-circle me-1"></i> IP unavailable';
            showErrorToast('Could not retrieve your IP address. Some features may be limited.');
            return null;
        }
    }

    // Update User IP Display
    function updateUserIPDisplay(ip) {
        if (ip) {
            userIP = ip;
            userIPSpan.innerHTML = `<i class="fas fa-globe-asia me-1"></i> IP: ${ip}`;
        } else {
            userIPSpan.innerHTML = '<i class="fas fa-exclamation-circle me-1"></i> IP unavailable';
        }
    }

    // Toast Notification System
    function showErrorToast(message) {
        showToast('Error', message, 'error');
    }
    
    function showSuccessToast(message) {
        showToast('Success', message, 'success');
    }
    
    function showInfoToast(message) {
        showToast('Information', message, 'info');
    }
    
    function showToast(title, message, type = 'info') {
        // Create toast container if it doesn't exist
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(toastContainer);
        }
        
        // Set toast styling based on type
        let headerClass, iconClass;
        switch(type) {
            case 'error':
                headerClass = 'bg-danger text-white';
                iconClass = 'fas fa-exclamation-circle';
                break;
            case 'success':
                headerClass = 'bg-success text-white';
                iconClass = 'fas fa-check-circle';
                break;
            case 'info':
            default:
                headerClass = 'bg-primary text-white';
                iconClass = 'fas fa-info-circle';
                break;
        }
        
        // Create toast element with unique ID
        const toastId = `toast-${Date.now()}`;
        const toastHtml = `
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header ${headerClass}">
                <i class="${iconClass} me-2"></i>
                <strong class="me-auto">${title}</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
        `;
        
        // Add toast to container
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        
        // Initialize and show the toast
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { 
            autohide: true, 
            delay: 5000 
        });
        toast.show();
        
        // Remove toast after it's hidden
        toastElement.addEventListener('hidden.bs.toast', function() {
            toastElement.remove();
        });
    }

    // Fetch User's Recipes
    async function fetchMyRecipes() {
        showLoading();
        
        try {
            userIP = await getClientIP();
            if (!userIP) {
                throw new Error('Could not determine IP address');
            }

            const response = await fetch(`/api/my-recipes/${userIP}`);
            
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            
            const recipes = await response.json();
            
            if (!recipes || Object.keys(recipes).length === 0) {
                showEmptyState();
            } else {
                displayRecipes(recipes);
                hideEmptyState();
                
                // Count total recipes
                countTotalRecipes(recipes);
                
                if (totalRecipes > 0) {
                    showInfoToast(`Successfully loaded ${totalRecipes} recipe${totalRecipes !== 1 ? 's' : ''} from your collection.`);
                }
            }
        } catch (error) {
            console.error('Error:', error);
            showErrorToast(error.message || 'Failed to load recipes');
            
            recipesContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="card glass-effect p-4">
                        <div class="text-center mb-3">
                            <i class="fas fa-exclamation-circle text-danger" style="font-size: 3rem;"></i>
                        </div>
                        <h4 class="mb-3">Error Loading Recipes</h4>
                        <p class="text-muted mb-4">${error.message || 'Something went wrong while loading your recipes.'}</p>
                        <a href="/" class="btn btn-primary">
                            <i class="fas fa-home me-2"></i>Return Home
                        </a>
                    </div>
                </div>`;
            
            hideEmptyState();
            recipesContainer.style.display = 'block';
        } finally {
            hideLoading();
        }
    }

    // Count Total Recipes
    function countTotalRecipes(recipes) {
        totalRecipes = 0;
        
        for (const mood in recipes) {
            const moodRecipes = recipes[mood];
            totalRecipes += Object.keys(moodRecipes).length;
        }
        
        return totalRecipes;
    }

    // Display Recipes
    function displayRecipes(recipes) {
        recipesContainer.innerHTML = '';
        let animationDelay = 0;
        
        // Group recipes by mood
        for (const mood in recipes) {
            const moodSection = document.createElement('div');
            moodSection.className = 'col-12 mb-4';
            
            const moodDisplayName = mood.charAt(0).toUpperCase() + mood.slice(1);
            const moodIcon = getMoodIcon(mood);
            
            moodSection.innerHTML = `
                <div class="d-flex align-items-center mb-3">
                    <h3 class="mb-0 me-2">
                        <span class="badge bg-secondary">
                            <i class="${moodIcon} me-1"></i>${moodDisplayName}
                        </span>
                    </h3>
                    <div class="flex-grow-1">
                        <hr class="gradient-line">
                    </div>
                </div>
                <div class="row g-3 g-md-4" id="mood-${mood}">
                </div>
            `;
            recipesContainer.appendChild(moodSection);
            applyEntryAnimation(moodSection, animationDelay);
            animationDelay += 100;

            const moodContainer = moodSection.querySelector(`#mood-${mood}`);
            const moodRecipes = recipes[mood];

            // Add recipes for this mood
            for (const recipeId in moodRecipes) {
                const recipe = moodRecipes[recipeId];
                const recipeCard = createRecipeCard(recipe, mood);
                moodContainer.appendChild(recipeCard);
                applyEntryAnimation(recipeCard, animationDelay);
                animationDelay += 100;
            }
        }
        
        // Show home button
        if (homeButtonContainer) {
            homeButtonContainer.style.display = 'block';
            applyEntryAnimation(homeButtonContainer, animationDelay);
        }
    }

    // Get Icon Based on Mood
    function getMoodIcon(mood) {
        switch(mood.toLowerCase()) {
            case 'happy':
                return 'fas fa-smile';
            case 'sad':
                return 'fas fa-frown';
            case 'stressed':
                return 'fas fa-tired';
            case 'energetic':
                return 'fas fa-bolt';
            case 'tired':
                return 'fas fa-bed';
            default:
                return 'fas fa-heart';
        }
    }

    // Create Recipe Card
    function createRecipeCard(recipe, mood) {
        const col = document.createElement('div');
        col.className = 'col-12 col-md-6 col-lg-4';
        
        // Format instructions for display - either use numbered steps or add them
        let formattedInstructions = recipe.instructions;
        if (!/^\d+\.\s/.test(formattedInstructions.split('\n')[0])) {
            // Not already numbered, add numbers
            formattedInstructions = formattedInstructions.split('\n')
                .map((step, index) => `${index + 1}. ${step}`)
                .join('\n');
        }
        
        const moodDisplayName = mood.charAt(0).toUpperCase() + mood.slice(1);
        const moodIcon = getMoodIcon(mood);
        
        col.innerHTML = `
            <div class="card h-100 glass-effect">
                <div class="card-header-gradient">
                    <h5 class="card-title mb-0 text-white">${recipe.name}</h5>
                </div>
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <span class="badge bg-secondary">
                            <i class="${moodIcon} me-1"></i> ${moodDisplayName}
                        </span>
                        <div class="text-end">
                            ${recipe.created_at ? 
                                `<small class="text-muted"><i class="far fa-calendar-alt me-1"></i>${recipe.created_at}</small><br>` 
                                : ''}
                            ${recipe.user_city ? 
                                `<small class="text-muted"><i class="fas fa-map-marker-alt me-1"></i>${recipe.user_city}</small>` 
                                : ''}
                        </div>
                    </div>
                    
                    <p class="card-text mb-3"><i class="far fa-clock me-2"></i><strong>Prep Time:</strong> ${recipe.prepTime}</p>
                    
                    <div class="recipe-details">
                        <h6 class="mb-2"><i class="fas fa-carrot me-2"></i>Ingredients:</h6>
                        <ul class="list-group list-group-flush mb-3">
                            ${recipe.ingredients.map(ingredient => {
                                // Extract quantity and item for styling
                                const parts = ingredient.split(/(\d+[\d\/\s]*\s*(?:g|kg|ml|l|tbsp|tsp|cup|cups|oz|lb|piece|pieces|bunch|bunches|clove|cloves|to taste)?\s*)/i);
                                
                                if (parts.length > 1) {
                                    const quantity = parts[1].trim();
                                    const item = parts.slice(2).join('').trim();
                                    
                                    return `<li class="list-group-item px-0 ingredient-item">
                                        <span class="ingredient-quantity">${quantity}</span>
                                        <span>${item}</span>
                                    </li>`;
                                } else {
                                    return `<li class="list-group-item px-0">${ingredient}</li>`;
                                }
                            }).join('')}
                        </ul>
                        
                        <h6 class="mb-2"><i class="fas fa-clipboard-list me-2"></i>Instructions:</h6>
                        <div class="instruction-block">
                            ${formattedInstructions}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        return col;
    }

    // Update Hit Count
    async function updateHitCount() {
        try {
            const response = await fetch('/api/hit-count', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }
            
            const data = await response.json();
            
            // Animate hit count increment
            const currentCount = parseInt(hitCountSpan.textContent) || 0;
            const newCount = data.hit_count;
            
            if (newCount > currentCount) {
                // Animate count up
                let count = currentCount;
                const interval = setInterval(() => {
                    count += 1;
                    hitCountSpan.textContent = count;
                    if (count >= newCount) {
                        clearInterval(interval);
                    }
                }, 50);
            } else {
                hitCountSpan.textContent = newCount;
            }
        } catch (error) {
            console.error('Error updating hit count:', error);
        }
    }

    // Initialize on page load
    updateHitCount();
    fetchMyRecipes();
});