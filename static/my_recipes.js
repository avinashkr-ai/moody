document.addEventListener('DOMContentLoaded', function () {
    const recipesContainer = document.getElementById('recipesContainer');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const hitCountSpan = document.getElementById('hitCount');
    const userIPSpan = document.getElementById('userIP');

    const moodIcons = {
        happy: 'fa-smile',
        sad: 'fa-frown',
        stressed: 'fa-meh',
        energetic: 'fa-bolt',
        tired: 'fa-bed'
    };

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
                <h2 class="moodSectionTitle mb-3">
                    <i class="fas ${moodIcons[mood]} me-2"></i>
                    <span class="badge bg-secondary">${mood.charAt(0).toUpperCase() + mood.slice(1)} Mood</span>
                </h2>
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

        let instructionsWithBreaks = recipe.instructions.replace(/(\d+\. )/g, '<br>$1');
        // Remove the first <br> if it exists, only if there is content after it
        if (instructionsWithBreaks.startsWith('<br>')) {
            instructionsWithBreaks = instructionsWithBreaks.slice(4);
        }

        col.innerHTML = `
            <div class="card h-100 glass-effect">
                <div class="card-header-gradient">
                    <h5 class="card-title mb-0 text-white">${recipe.name}</h5>
                </div>
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <span class="badge bg-secondary">
                            <i class="fas ${moodIcons[mood]} me-1"></i> ${mood.charAt(0).toUpperCase() + mood.slice(1)}
                        </span>
                        <div class="text-end">
                            <small class="text-muted"><i class="far fa-calendar-alt me-1"></i>${recipe.created_at}</small><br>
                            <small class="text-muted"><i class="fas fa-map-marker-alt me-1"></i>${recipe.user_city}</small>
                        </div>
                    </div>

                    <p class="card-text mb-3"><i class="far fa-clock me-2"></i><strong>Prep Time:</strong> ${recipe.prepTime}</p>

                    <div class="recipe-details">
                        <h6 class="mb-2"><i class="fas fa-carrot me-2"></i>Ingredients:</h6>
                        <ul class="list-group list-group-flush mb-3">
                            ${recipe.ingredients.map(ingredient => `
                                <li class="list-group-item px-2 ingredient-item">
                                    <span>${ingredient}</span>
                                </li>
                            `).join('')}
                        </ul>

                        <h6 class="mb-2"><i class="fas fa-clipboard-list me-2"></i>Instructions:</h6>
                        <div class="instruction-block">
                            ${instructionsWithBreaks}
                        </div>
                    </div>
                </div>
            </div>
        `;

        return col;
    }
    async function updateUserIP() {
        try {
            const ipInfo = JSON.parse(localStorage.getItem('ipInfo'));
            if (ipInfo && ipInfo.ip) {
                const targetIP = ipInfo.ip;
                const userIPSpan = document.getElementById('userIP');
                let currentIP = [0, 0, 0, 0];

                function animateIP() {
                    let ipString = currentIP.join('.');
                    userIPSpan.textContent = `IP: ${ipString}`;

                    if (ipString !== targetIP) {
                        let targetOctets = targetIP.split('.').map(Number);

                        for (let i = 0; i < 4; i++) {
                            if (currentIP[i] < targetOctets[i]) {
                                currentIP[i]++;
                            }
                        }

                        setTimeout(animateIP, 10); // Adjust the timeout for speed
                    } else {
                        userIPSpan.textContent = `IP: ${targetIP}`;
                    }
                }

                animateIP();
            } else {
                userIPSpan.textContent = 'IP: Not found';
            }
        } catch (error) {
            console.error('Error updating user IP:', error);
            userIPSpan.textContent = 'IP: Error';
        }
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
            const finalHitCount = data.hit_count;
            let currentHitCount = parseInt(hitCountSpan.textContent) || 0;

            function animateHitCount() {
                if (currentHitCount < finalHitCount) {
                    currentHitCount++;
                    hitCountSpan.textContent = currentHitCount;
                    setTimeout(animateHitCount, 10); // Adjust the timeout for speed
                } else {
                    hitCountSpan.textContent = finalHitCount; // Ensure final value
                }
            }

            animateHitCount();
        } catch (error) {
            console.error('Error updating hit count:', error);
        }
    }

    // Call updateHitCount and updateUserIP on page load
    updateHitCount();
    updateUserIP();

    // Fetch recipes when page loads
    fetchMyRecipes();
});