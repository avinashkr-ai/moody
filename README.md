# Mood Recipe Recommender

A Flask web application that generates personalized Indian recipes based on mood, age, and location using Google's Gemini AI.

## Local Development

1. Clone the repository
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create `.env` file with:
   ```
   FLASK_DEBUG=1
   GEMINI_API_KEY=your_key
   IPINFO_TOKEN=your_token
   ```
5. Place your Firebase credentials in `adminsdk-py.json`
6. Run the application:
   ```bash
   python app.py
   ```

## Deployment

The application is configured for deployment on Render. Required environment variables:
- GEMINI_API_KEY
- IPINFO_TOKEN
- FIREBASE_CREDENTIALS_BASE64 