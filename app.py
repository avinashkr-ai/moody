from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, db
import random
from dotenv import load_dotenv
import os
import google.generativeai as genai
import requests
import uuid
import json
from datetime import datetime
import pytz
import base64

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Initialize Firebase
if os.getenv('FIREBASE_CREDENTIALS_BASE64'):
    # Production: decode credentials from environment variable
    credentials_json = base64.b64decode(os.getenv('FIREBASE_CREDENTIALS_BASE64')).decode('utf-8')
    credentials_dict = json.loads(credentials_json)
    cred = credentials.Certificate(credentials_dict)
else:
    # Development: use local file
    cred = credentials.Certificate('/etc/secrets/adminsdk-py.json')

firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://cursorai-af01e-default-rtdb.firebaseio.com/'
})

# Initialize Gemini
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-pro')

def get_client_ip():
    try:
        # First try to get IP from X-Forwarded-For header
        x_forwarded_for = request.headers.get('X-Forwarded-For')
        if x_forwarded_for:
            # Get the first IP in the list (client's original IP)
            client_ip = x_forwarded_for.split(',')[0].strip()
            return client_ip
            
        # Then try X-Real-IP header
        x_real_ip = request.headers.get('X-Real-IP')
        if x_real_ip:
            return x_real_ip
            
        # If running locally, use remote_addr
        return request.remote_addr
        
    except Exception as e:
        print(f"Error getting client IP: {e}")
        # Fallback to remote_addr if all else fails
        return request.remote_addr

def generate_recipe_with_ai(mood, age, city):
    prompt = f"""Generate an Indian recipe suitable for someone who is:
    - Feeling: {mood}
    - Age: {age} years old
    - Location: {city}, India
    
    Create a recipe that:
    1. Uses ingredients commonly available in {city}
    2. Matches the mood '{mood}'
    3. Is age-appropriate for {age} years old
    4. Reflects local Indian cooking styles
    
    Format the response EXACTLY as a JSON object with this structure:
    {{
        "name": "Recipe Name (include Indian name if applicable)",
        "prepTime": "preparation time in minutes",
        "ingredients": [
            "ingredient 1 with quantity",
            "ingredient 2 with quantity"
        ],
        "instructions": "1. First step\\n2. Second step\\n3. Third step",
        "mood": "{mood}"
    }}
    
    Return ONLY the JSON object without any additional text or formatting."""

    response = model.generate_content(prompt)
    
    # Extract JSON from response
    try:
        # Clean the response text to ensure it's valid JSON
        response_text = response.text.strip()
        
        # Remove any "JSON" prefix if present
        if response_text.upper().startswith('JSON'):
            response_text = response_text[4:].strip()
            
        # Remove any markdown code block markers
        if response_text.startswith('```'):
            response_text = response_text.strip('`')
            if response_text.startswith('json'):
                response_text = response_text[4:].strip()
            response_text = response_text.strip()
        
        # Parse the cleaned JSON
        recipe_data = json.loads(response_text)
        
        # Ensure prepTime is a string
        if isinstance(recipe_data.get('prepTime'), int):
            recipe_data['prepTime'] = f"{recipe_data['prepTime']} minutes"
        
        return json.dumps(recipe_data)
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}")
        print(f"Response text: {response_text}")
        raise Exception("Failed to generate valid recipe format")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/my-recipes')
def my_recipes():
    return render_template('my_recipes.html')

@app.route('/api/recipe', methods=['POST'])
def get_recipe():
    try:
        data = request.json
        mood = data.get('mood')
        age = data.get('age')
        city = data.get('city')
        
        # Log headers and IP info for debugging
        print("Request Headers:", dict(request.headers))
        user_ip = get_client_ip()
        print(f"Detected IP: {user_ip}")
        
        # Format IP for Firebase (replace dots with underscores)
        formatted_ip = user_ip.replace('.', '_')
        
        # Generate recipe using AI
        recipe_json = generate_recipe_with_ai(mood, age, city)
        recipe = json.loads(recipe_json)
        
        # Add creation timestamp (in IST)
        ist = pytz.timezone('Asia/Kolkata')
        current_time = datetime.now(ist)
        recipe['created_at'] = current_time.strftime("%Y-%m-%d %I:%M %p")
        
        # Create a unique recipe ID
        new_recipe_id = f'recipe_{uuid.uuid4().hex[:8]}'
        
        # Save to Firebase under user's IP and mood
        recipe_ref = db.reference(f'/{formatted_ip}/{mood}')
        recipe_ref.child(new_recipe_id).set(recipe)
        
        return jsonify(recipe)
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/my-recipes/<ip>')
def get_my_recipes(ip):
    try:
        # Get all recipes for the IP
        recipes_ref = db.reference(f'/{ip}')
        recipes = recipes_ref.get()
        return jsonify(recipes or {})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/get-ip')
def get_ip():
    try:
        ipinfo_token = os.getenv('IPINFO_TOKEN')
        client_ip = get_client_ip()
        
        # Use the detected client IP with ipinfo
        response = requests.get(f'https://ipinfo.io/{client_ip}/json?token={ipinfo_token}')
        if response.status_code == 200:
            data = response.json()
            return jsonify({
                'ip': client_ip,  # Use the detected IP
                'region': data.get('region'),
                'city': data.get('city'),
                'country': data.get('country')
            })
        raise Exception("Failed to fetch IP info")
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    debug_mode = os.getenv('FLASK_DEBUG', '0') == '1'
    app.run(debug=debug_mode) 