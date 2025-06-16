# Mood Recipe Recommender

A Flask web application that generates personalized Indian recipes based on mood, age, and location using Google's Gemini AI.

## Local Development

1. Clone the repository# Moody Bomb - Recipe Recommender 🍳

A mood-based Indian recipe recommendation system powered by Google's Gemini AI. The application suggests personalized recipes based on your current mood, age, and location.


## 🌟 Features

- **Mood-Based Recipes**: Get recipe recommendations based on your current emotional state
- **Location-Aware**: Suggests recipes using ingredients commonly available in your city
- **Age-Appropriate**: Customizes recipe complexity based on user age
- **Recipe History**: Track all your previously generated recipes
- **User Feedback**: Rate and comment on recipes
- **Real-Time Analytics**: Track visitor count and user engagement
- **Mobile Responsive**: Works seamlessly across all devices

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap 5
- **Backend**: Flask (Python)
- **Database**: Firebase Realtime Database
- **AI/ML**: Google Gemini AI
- **Authentication**: IP-based tracking
- **Deployment**: Render
- **APIs**: IPInfo for location detection

## 🚀 Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/moody-bomb.git
   cd moody-bomb
   ```

2. **Set up virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   Create a `.env` file with:
   ```env
   FLASK_DEBUG=1
   GEMINI_API_KEY=your_gemini_api_key
   IPINFO_TOKEN=your_ipinfo_token
   APP_URL=http://localhost:5000
   ```

5. **Set up Firebase**
   - Create a Firebase project
   - Download service account key and save as `etc/secrets/adminsdk-py.json`
   - Update Firebase configuration in the application

6. **Run the application**
   ```bash
   python app.py
   ```

## 📦 Project Structure

```
moody-bomb/
├── app.py              # Main Flask application
├── static/            
│   ├── feedback.js     # Feedback functionality
│   ├── my_recipes.js   # Recipe history
│   ├── script.js       # Main application logic
│   └── styles.css      # Global styles
├── templates/          
│   ├── feedback.html   # Feedback page
│   ├── index.html      # Home page
│   └── my_recipes.html # Recipe history page
└── etc/
    └── secrets/        # Firebase credentials
```

## 🌍 Deployment

The application is configured for deployment on Render. Required environment variables:

```bash
GEMINI_API_KEY=your_key
IPINFO_TOKEN=your_token
FIREBASE_CREDENTIALS_BASE64=base64_encoded_firebase_credentials
FLASK_DEBUG=0
```

## 🤝 Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/improvement`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/improvement`)
5. Create a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini AI for recipe generation
- IPInfo for location services
- Firebase for real-time database
- Bootstrap for UI components

## 📧 Contact

For questions or feedback, please contact:
- GitHub: [@avinashkr-ai](https://github.com/avinashkr-ai)
- LinkedIn: [@avinashkr-ai](https://www.linkedin.com/in/avinashkr-ai/)
- Twitter: [@avinashkr_ai](https://x.com/avinashkr_ai/)
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
