document.addEventListener('DOMContentLoaded', function() {
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
    const formContent = document.querySelector('.form-content');
    const formToggleContainer = document.getElementById('formToggleContainer');
    const toggleFormBtn = document.getElementById('toggleFormBtn');

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

    // Function to get IP info and store in localStorage
    async function initializeIPInfo() {
        try {
            // Check if we already have IP info in localStorage
            const storedIPInfo = localStorage.getItem('ipInfo');
            if (storedIPInfo) {
                const ipInfo = JSON.parse(storedIPInfo);
                if (ipInfo.city) {
                    addCityToDropdown(ipInfo.city);
                    setUserCity(ipInfo.city);
                }
                return ipInfo;
            }

            const response = await fetch('/api/get-ip');
            const ipInfo = await response.json();
            
            if (ipInfo.error) {
                throw new Error(ipInfo.error);
            }

            // Store IP info in localStorage
            localStorage.setItem('ipInfo', JSON.stringify(ipInfo));
            
            if (ipInfo.city) {
                addCityToDropdown(ipInfo.city);
                setUserCity(ipInfo.city);
            }
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

    function collapseForm() {
        formContent.style.display = 'none';
        formToggleContainer.style.display = 'block';
        toggleFormBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
    }

    function expandForm() {
        formContent.style.display = 'block';
        toggleFormBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
    }

    toggleFormBtn.addEventListener('click', function() {
        if (formContent.style.display === 'none') {
            expandForm();
        } else {
            collapseForm();
        }
    });

    async function fetchRecipe() {
        const mood = moodSelect.value;
        const age = ageInput.value;
        const city = citySelect.value;

        showLoading();
        collapseForm(); // Collapse form when fetching recipe
        
        try {
            // Get IP info from localStorage
            const ipInfo = JSON.parse(localStorage.getItem('ipInfo')) || await initializeIPInfo();
            if (!ipInfo) {
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
        recipeName.textContent = recipe.name;
        prepTime.textContent = recipe.prepTime;
        
        // Add creation time if available
        if (recipe.created_at) {
            const timeElement = document.createElement('p');
            timeElement.className = 'text-muted mb-3';
            timeElement.innerHTML = `<small>Created on: ${recipe.created_at}</small>`;
            recipeName.insertAdjacentElement('afterend', timeElement);
        }
        
        ingredients.innerHTML = '';
        recipe.ingredients.forEach(ingredient => {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.textContent = ingredient;
            ingredients.appendChild(li);
        });
        
        instructions.textContent = recipe.instructions;
        
        recipeCard.style.display = 'block';
        setTimeout(() => recipeCard.classList.add('show'), 10);
    }

    recipeForm.addEventListener('submit', function(e) {
        e.preventDefault();
        if (this.checkValidity()) {
            fetchRecipe();
        }
        this.classList.add('was-validated');
    });

    newRecipeBtn.addEventListener('click', function() {
        fetchRecipe();
    });

    // Initialize IP info when page loads
    initializeIPInfo();

    // Clear city selection if user manually changes it
    citySelect.addEventListener('change', function() {
        const ipInfo = JSON.parse(localStorage.getItem('ipInfo') || '{}');
        if (ipInfo.city && this.value !== ipInfo.city) {
            // Optionally store user's manual selection
            ipInfo.userSelectedCity = this.value;
            localStorage.setItem('ipInfo', JSON.stringify(ipInfo));
        }
    });
}); 