document.addEventListener('DOMContentLoaded', function () {
    const recipeForm = document.getElementById('recipeForm');
    const moodSelect = document.getElementById('moodSelect');
    const ageInput = document.getElementById('ageInput');
    const citySelect = document.getElementById('citySelect');
    const recipeCard = document.getElementById('recipeCard');
    const recipeName = document.getElementById('recipeName');
    const prepTime = document.getElementById('prepTime');
    const ingredients = document.getElementById('ingredients');
    const instructions = document.getElementById('instructions');
    const newRecipeBtn = document.getElementById('newRecipeBtn');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const hitCountSpan = document.getElementById('hitCount');
    const userIPSpan = document.getElementById('userIP');

    // Function to add city to dropdown if it doesn't exist
    function addCityToDropdown(city) {
        if (!city) return;

        // Convert existing options to array of lowercase city names
        const existingCities = Array.from(citySelect.options)
            .map(option => option.value.toLowerCase());

        // If city doesn't exist in dropdown, add it
        if (!existingCities.includes(city.toLowerCase())) {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;

            // Insert after the disabled placeholder option
            const placeholder = citySelect.querySelector('option[disabled]');
            placeholder.insertAdjacentElement('afterend', option);
        }
    }

    function setUserCity(city) {
        if (city) {
            // Add city to dropdown if it doesn't exist
            addCityToDropdown(city);

            // Find and select the city option
            const cityOption = Array.from(citySelect.options).find(option =>
                option.value.toLowerCase() === city.toLowerCase()
            );

            if (cityOption) {
                citySelect.value = cityOption.value;
            }
        }
    }

    // Function to get and store IP info
    async function initializeIPInfo() {
        try {
            // Check if we already have recent IP info in localStorage
            const storedIPInfo = localStorage.getItem('ipInfo');
            if (storedIPInfo) {
                const ipInfo = JSON.parse(storedIPInfo);
                const storedTime = new Date(ipInfo.timestamp);
                const now = new Date();
                // If stored IP info is less than 1 hour old, use it
                if ((now - storedTime) < 3600000) {
                    setUserCity(ipInfo.city);
                    return ipInfo;
                }
            }

            // Fetch new IP info
            const response = await fetch(`https://ipinfo.io/json?token=${IPINFO_TOKEN}`);
            const ipInfo = await response.json();

            // Add timestamp and store in localStorage
            ipInfo.timestamp = new Date().toISOString();
            localStorage.setItem('ipInfo', JSON.stringify(ipInfo));

            // Set the city in the form
            setUserCity(ipInfo.city);
            return ipInfo;
        } catch (error) {
            console.error('Error fetching IP info:', error);
            return null;
        }
    }

    function showLoading() {
        loadingSpinner.style.display = 'block';
        recipeCard.style.display = 'none';
        recipeCard.classList.remove('show');
    }

    function hideLoading() {
        loadingSpinner.style.display = 'none';
    }

    async function fetchRecipe() {
        const mood = moodSelect.value;
        const age = ageInput.value;
        const city = citySelect.value;

        showLoading();

        try {
            // Get IP info from localStorage
            const ipInfo = JSON.parse(localStorage.getItem('ipInfo'));
            if (!ipInfo || !ipInfo.ip) {
                throw new Error('Could not determine IP address');
            }

            const response = await fetch('/api/recipe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mood: mood,
                    age: age,
                    city: city,
                    ip: ipInfo.ip
                })
            });

            const recipe = await response.json();

            hideLoading();

            if (recipe.error) {
                alert('No recipe found for this mood');
                return;
            }

            displayRecipe(recipe);
        } catch (error) {
            hideLoading();
            console.error('Error:', error);
            alert('Error fetching recipe');
        }
    }

    function displayRecipe(recipe) {
        document.getElementById('recipeName').textContent = recipe.name;
        document.getElementById('prepTime').textContent = recipe.prepTime;

        const ingredientsList = document.getElementById('ingredients');
        ingredientsList.innerHTML = ''; // Clear existing ingredients

        recipe.ingredients.forEach(ingredient => {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.textContent = ingredient;
            ingredientsList.appendChild(li);
        });

        const instructionsDiv = document.getElementById('instructions');
        const instructionsWithBreaks = recipe.instructions.replace(/(\d+\. )/g, '<br>$1');
        instructionsDiv.innerHTML = instructionsWithBreaks;

        recipeCard.style.display = 'block';
        setTimeout(() => recipeCard.classList.add('show'), 10);

    }

    recipeForm.addEventListener('submit', function (e) {
        e.preventDefault();
        if (this.checkValidity()) {
            fetchRecipe();
        }
        this.classList.add('was-validated');
    });

    newRecipeBtn.addEventListener('click', function () {
        fetchRecipe();
    });

    // Initialize IP info when page loads
    initializeIPInfo();

    // Clear city selection if user manually changes it
    citySelect.addEventListener('change', function () {
        const ipInfo = JSON.parse(localStorage.getItem('ipInfo') || '{}');
        if (ipInfo.city && this.value !== ipInfo.city) {
            // Optionally store user's manual selection
            ipInfo.userSelectedCity = this.value;
            localStorage.setItem('ipInfo', JSON.stringify(ipInfo));
        }
    });

    async function updateUserIP() {
        try {
            const ipInfo = JSON.parse(localStorage.getItem('ipInfo'));
            if (ipInfo && ipInfo.ip) {
                const targetIP = ipInfo.ip;
                let currentIP = [0, 0, 0, 0];
                const userIPSpan = document.getElementById('userIP');

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
});