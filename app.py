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
    cred = credentials.Certificate('etc/secrets/adminsdk-py.json')

firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://cursorai-af01e-default-rtdb.firebaseio.com/'
})

# Initialize Gemini
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-pro')

# Initialize hit count
hit_count_ref = db.reference('/hit_count')
if hit_count_ref.get() is None:
    hit_count_ref.set(0)

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

        # Fix common JSON formatting issues
        try:
            # First attempt to parse as is
            recipe_data = json.loads(response_text)
        except json.JSONDecodeError:
            # If parsing fails, try to fix common issues
            # 1. Fix missing commas between properties
            response_text = response_text.replace('"\n"', '",\n"')
            # 2. Add missing commas after closing quotes before new properties
            response_text = response_text.replace('"\n', '",\n')
            # 3. Remove any trailing commas
            response_text = response_text.replace(',\n}', '\n}')
            response_text = response_text.replace(',}', '}')
            
            # Try parsing again
            recipe_data = json.loads(response_text)
        
        # Ensure prepTime is a string
        if isinstance(recipe_data.get('prepTime'), int):
            recipe_data['prepTime'] = f"{recipe_data['prepTime']} minutes"
        
        # Validate required fields
        required_fields = ['name', 'prepTime', 'ingredients', 'instructions', 'mood']
        missing_fields = [field for field in required_fields if field not in recipe_data]
        if missing_fields:
            raise ValueError(f"Missing required fields: {', '.join(missing_fields)}")
        
        return json.dumps(recipe_data)
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}")
        print(f"Response text: {response_text}")
        raise Exception("Failed to generate valid recipe format")
    except Exception as e:
        print(f"Error processing recipe: {str(e)}")
        print(f"Response text: {response_text}")
        raise Exception(f"Failed to process recipe: {str(e)}")

@app.route('/')
def index():
    return render_template('index.html', ipinfo_token=os.getenv('IPINFO_TOKEN'))

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
        user_ip = data.get('ip')  # Get IP from request data
        
        if not user_ip:
            raise Exception("IP address not provided")
            
        # Format IP for Firebase (replace dots with underscores)
        formatted_ip = user_ip.replace('.', '_')
        
        # Generate recipe using AI
        recipe_json = generate_recipe_with_ai(mood, age, city)
        recipe = json.loads(recipe_json)
        
        # Add creation timestamp (in IST)
        ist = pytz.timezone('Asia/Kolkata')
        current_time = datetime.now(ist)
        recipe['created_at'] = current_time.strftime("%Y-%m-%d %I:%M %p")
        
        # Add user info to recipe
        recipe['user_mood'] = mood
        recipe['user_age'] = age
        recipe['user_city'] = city
        
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

@app.route('/api/hit-count', methods=['POST'])
def update_hit_count():
    try:
        # Get current hit count
        current_hit_count = hit_count_ref.get() or 0

        # Increase hit count by 2
        new_hit_count = current_hit_count + 2

        # Update hit count in Firebase
        hit_count_ref.set(new_hit_count)

        return jsonify({'hit_count': new_hit_count})
    except Exception as e:
        print(f"Error updating hit count: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    debug_mode = os.getenv('FLASK_DEBUG', '0') == '1'
    app.run(debug=debug_mode) 