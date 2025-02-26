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
    const hitCountSpan = document.getElementById('hitCount');
    const userIPSpan = document.getElementById('userIP');

    // Track the current mood for UI theming
    let currentMood = '';
    
    // Mood color mappings for UI theming (all using orange gradient variations)
    const moodColors = {
        'happy': {start: '#FF9500', end: '#FF3A00'}, // Default orange
        'sad': {start: '#FF9500', end: '#FF3A00'},   
        'stressed': {start: '#FF9500', end: '#FF3A00'}, 
        'energetic': {start: '#FF9500', end: '#FF3A00'}, 
        'tired': {start: '#FF9500', end: '#FF3A00'}  
    };

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
                    updateUserIPDisplay(ipInfo.ip);
                    return ipInfo;
                }
            }

            // Show subtle loading state for IP info
            userIPSpan.innerHTML = '<i class="fas fa-circle-notch fa-spin me-1"></i> Locating...';

            // Fetch new IP info
            const response = await fetch(`https://ipinfo.io/json?token=${IPINFO_TOKEN}`);
            const ipInfo = await response.json();
            
            // Add timestamp and store in localStorage
            ipInfo.timestamp = new Date().toISOString();
            localStorage.setItem('ipInfo', JSON.stringify(ipInfo));
            
            // Set the city in the form
            setUserCity(ipInfo.city);
            updateUserIPDisplay(ipInfo.ip);
            return ipInfo;
        } catch (error) {
            console.error('Error fetching IP info:', error);
            userIPSpan.innerHTML = '<i class="fas fa-exclamation-circle me-1"></i> IP unavailable';
            return null;
        }
    }

    function updateUserIPDisplay(ip) {
        if (ip) {
            userIPSpan.innerHTML = `<i class="fas fa-globe-asia me-1"></i> IP: ${ip}`;
        } else {
            userIPSpan.innerHTML = '<i class="fas fa-exclamation-circle me-1"></i> IP unavailable';
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

    // Apply mood theme to UI elements
    function applyMoodTheme(mood) {
        if (!mood || !moodColors[mood]) return;
        
        currentMood = mood;
        const colors = moodColors[mood];
        
        // Apply to card header
        const cardHeader = recipeCard.querySelector('.card-header-gradient');
        if (cardHeader) {
            cardHeader.style.background = `linear-gradient(to right, ${colors.start}, ${colors.end})`;
        }
        
        // Update mood badge
        const moodBadge = recipeCard.querySelector('.badge');
        if (moodBadge) {
            moodBadge.textContent = `Mood: ${mood.charAt(0).toUpperCase() + mood.slice(1)}`;
        }
    }

    // Show error toast notification
    function showErrorToast(message) {
        // Create toast container if it doesn't exist
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(toastContainer);
        }
        
        // Create toast element
        const toastId = 'error-toast-' + Date.now();
        const toastHtml = `
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header" style="background-color: #f8d7da; color: #721c24;">
                <i class="fas fa-exclamation-circle me-2"></i>
                <strong class="me-auto">Error</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
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
        const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 5000 });
        toast.show();
        
        // Remove toast after it's hidden
        toastElement.addEventListener('hidden.bs.toast', function() {
            toastElement.remove();
        });
    }

    async function fetchRecipe() {
        const mood = moodSelect.value;
        const age = ageInput.value;
        const city = citySelect.value;

        showLoading();
        collapseForm();
        
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

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }

            const recipe = await response.json();
            
            hideLoading();
            
            if (recipe.error) {
                showErrorToast('Failed to generate recipe: ' + recipe.error);
                return;
            }
            
            // Apply mood theme before displaying
            applyMoodTheme(mood);
            
            displayRecipe(recipe);
            
            // Update hit count after successful recipe generation
            updateHitCount();
        } catch (error) {
            hideLoading();
            console.error('Error:', error);
            showErrorToast(error.message || 'Error generating recipe. Please try again.');
            expandForm();
        }
    }

    function displayRecipe(recipe) {
        recipeName.textContent = recipe.name;
        prepTime.textContent = recipe.prepTime;
        
        // Clear any previous recipe creation time
        const existingTimeElement = recipeCard.querySelector('.recipe-time');
        if (existingTimeElement) {
            existingTimeElement.remove();
        }
        
        // Add creation time if available
        if (recipe.created_at) {
            const timeElement = document.createElement('p');
            timeElement.className = 'text-muted mb-3 recipe-time';
            timeElement.innerHTML = `<small><i class="far fa-calendar-alt me-1"></i> Created on: ${recipe.created_at}</small>`;
            recipeName.closest('.card-header-gradient').insertAdjacentElement('afterend', timeElement);
        }
        
        // Clear previous ingredients
        ingredients.innerHTML = '';
        
        // Add ingredients with nice formatting
        recipe.ingredients.forEach(ingredient => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex align-items-center';
            
            // Extract quantity and item for styling
            const parts = ingredient.split(/(\d+[\d\/\s]*\s*(?:g|kg|ml|l|tbsp|tsp|cup|cups|oz|lb|piece|pieces|bunch|bunches|clove|cloves|to taste)?\s*)/i);
            
            if (parts.length > 1) {
                const quantity = parts[1].trim();
                const item = parts.slice(2).join('').trim();
                
                li.innerHTML = `
                    <span class="me-2 fw-bold text-orange">${quantity}</span>
                    <span>${item}</span>
                `;
            } else {
                li.textContent = ingredient;
            }
            
            ingredients.appendChild(li);
        });
        
        // Format instructions with numbered steps
        const instructionsText = recipe.instructions;
        
        // Check if instructions are already numbered
        if (/^\d+\.\s/.test(instructionsText.split('\n')[0])) {
            // Already numbered, just format with line breaks
            instructions.innerHTML = instructionsText
                .split('\n')
                .map(step => `<p class="mb-2">${step}</p>`)
                .join('');
        } else {
            // Convert to numbered steps if not already
            const steps = instructionsText.split(/\n+/);
            instructions.innerHTML = steps
                .map((step, index) => `<p class="mb-2"><span class="fw-bold">${index + 1}.</span> ${step}</p>`)
                .join('');
        }
        
        // Show recipe card with animation
        recipeCard.style.display = 'block';
        setTimeout(() => recipeCard.classList.add('show'), 10);
    }

    recipeForm.addEventListener('submit', function(e) {
        e.preventDefault();
        if (this.checkValidity()) {
            fetchRecipe();
        } else {
            // Add custom validation styling
            this.classList.add('was-validated');
            
            // Focus the first invalid field
            const invalidField = this.querySelector(':invalid');
            if (invalidField) {
                invalidField.focus();
                
                // Scroll to the invalid field if needed
                invalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    });

    newRecipeBtn.addEventListener('click', function() {
        // Apply a subtle loading animation to the button
        this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Generating...';
        this.disabled = true;
        
        fetchRecipe().finally(() => {
            // Reset button state
            this.innerHTML = '<i class="fas fa-sync-alt me-2"></i>Get Another Recipe';
            this.disabled = false;
        });
    });

    // Add input focus effects
    const formInputs = document.querySelectorAll('.form-select, .form-control');
    formInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('input-focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('input-focused');
        });
    });

    // Clear city selection if user manually changes it
    citySelect.addEventListener('change', function() {
        const ipInfo = JSON.parse(localStorage.getItem('ipInfo') || '{}');
        if (ipInfo.city && this.value !== ipInfo.city) {
            // Optionally store user's manual selection
            ipInfo.userSelectedCity = this.value;
            localStorage.setItem('ipInfo', JSON.stringify(ipInfo));
        }
    });

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

    // Add form field animations
    function setupFormAnimations() {
        // Add label animation for select fields
        const selects = document.querySelectorAll('select.form-select');
        selects.forEach(select => {
            select.addEventListener('change', function() {
                if (this.value) {
                    this.classList.add('has-value');
                } else {
                    this.classList.remove('has-value');
                }
            });
            
            // Initialize on load
            if (select.value) {
                select.classList.add('has-value');
            }
        });
        
        // Add animation for age input
        ageInput.addEventListener('input', function() {
            if (this.value) {
                this.classList.add('has-value');
            } else {
                this.classList.remove('has-value');
            }
        });
        
        // Initialize on load
        if (ageInput.value) {
            ageInput.classList.add('has-value');
        }
    }

    // Initialize animations
    setupFormAnimations();

    // Initialize IP info when page loads
    initializeIPInfo();

    // Initial hit count update
    updateHitCount();
});