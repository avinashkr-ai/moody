document.addEventListener('DOMContentLoaded', function() {
    const recipesContainer = document.getElementById('recipesContainer');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const hitCountSpan = document.getElementById('hitCount');

    function showLoading() {
        loadingSpinner.style.display = 'block';
        recipesContainer.style.display = 'none';
    }

    function hideLoading() {
        loadingSpinner.style.display = 'none';
        recipesContainer.style.display = 'block';
    }

    async function getClientIP() {
        try {
            // Check localStorage first
            const storedIPInfo = localStorage.getItem('ipInfo');
            if (storedIPInfo) {
                const ipInfo = JSON.parse(storedIPInfo);
                return ipInfo.ip.replace(/\./g, '_');
            }

            // If not in localStorage, fetch from API
            const response = await fetch('/api/get-ip');
            const ipInfo = await response.json();
            
            // Store in localStorage
            localStorage.setItem('ipInfo', JSON.stringify(ipInfo));
            
            return ipInfo.ip.replace(/\./g, '_');
        } catch (error) {
            console.error('Error fetching IP:', error);
            return null;
        }
    }

    async function fetchMyRecipes() {
        showLoading();
        
        try {
            const userIP = await getClientIP();
            if (!userIP) {
                throw new Error('Could not determine IP address');
            }

            const response = await fetch(`/api/my-recipes/${userIP}`);
            const recipes = await response.json();
            displayRecipes(recipes);
        } catch (error) {
            console.error('Error:', error);
            recipesContainer.innerHTML = `
                <div class="col-12 text-center">
                    <p class="text-danger">Error: ${error.message}</p>
                    <a href="/" class="btn btn-primary">Return Home</a>
                </div>`;
        } finally {
            hideLoading();
        }
    }

    function displayRecipes(recipes) {
        recipesContainer.innerHTML = '';
        
        if (!recipes || Object.keys(recipes).length === 0) {
            recipesContainer.innerHTML = `
                <div class="col-12 text-center">
                    <p class="text-muted mb-3">No recipes found for your IP address</p>
                    <a href="/" class="btn btn-primary">Create Your First Recipe</a>
                </div>`;
            return;
        }

        // Group recipes by mood
        for (const mood in recipes) {
            const moodSection = document.createElement('div');
            moodSection.className = 'col-12 mb-4';
            moodSection.innerHTML = `
                <h3 class="mb-3">
                    <span class="badge bg-secondary">${mood.charAt(0).toUpperCase() + mood.slice(1)} Mood</span>
                </h3>
                <div class="row g-3 g-md-4" id="mood-${mood}">
                </div>
            `;
            recipesContainer.appendChild(moodSection);

            const moodContainer = moodSection.querySelector(`#mood-${mood}`);
            const moodRecipes = recipes[mood];

            // Add recipes for this mood
            for (const recipeId in moodRecipes) {
                const recipe = moodRecipes[recipeId];
                const recipeCard = createRecipeCard(recipe, mood);
                moodContainer.appendChild(recipeCard);
            }
        }
    }

    function createRecipeCard(recipe, mood) {
        const col = document.createElement('div');
        col.className = 'col-12 col-sm-6 col-lg-4';
        
        col.innerHTML = `
            <div class="card h-100">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="badge bg-primary">${mood}</span>
                        <div>
                            ${recipe.created_at ? 
                                `<small class="text-muted">${recipe.created_at}</small>` 
                                : ''}
                            ${recipe.user_city ? 
                                `<small class="text-muted">, ${recipe.user_city}</small>` 
                                : ''}
                        </div>
                    </div>
                    <h5 class="card-title mb-3">${recipe.name}</h5>
                    <p class="card-text"><strong>Prep Time:</strong> ${recipe.prepTime}</p>
                    
                    <div class="recipe-details">
                        <h6 class="mb-2">Ingredients:</h6>
                        <ul class="list-group list-group-flush mb-3">
                            ${recipe.ingredients.map(ingredient => 
                                `<li class="list-group-item px-0">${ingredient}</li>`
                            ).join('')}
                        </ul>
                        
                        <h6 class="mb-2">Instructions:</h6>
                        <p class="card-text" style="white-space: pre-line">${recipe.instructions}</p>
                    </div>
                </div>
            </div>
        `;
        
        return col;
    }

    async function updateHitCount() {
        try {
            const response = await fetch('/api/hit-count', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            hitCountSpan.textContent = data.hit_count;
        } catch (error) {
            console.error('Error updating hit count:', error);
        }
    }

    // Call updateHitCount on page load
    updateHitCount();

    // Fetch recipes when page loads
    fetchMyRecipes();
}); 