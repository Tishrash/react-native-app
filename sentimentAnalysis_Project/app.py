import os
import sys
import sqlite3
from flask import Flask, request, jsonify
from flask_cors import CORS
from db import db
from Config import Config
from routes.store_routes import store_bp
from helper import preprocessing, vectorizer, get_prediction  # Ensure these functions are implemented

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize database
    db.init_app(app)

    # Enable CORS
    CORS(app)

    # Register blueprints
    app.register_blueprint(store_bp, url_prefix='/register')

    # Sentiment analysis variables stored in app.config
    app.config["reviews"] = []
    app.config["positive"] = 0
    app.config["negative"] = 0

    # Initialize SQLite database for store registration and logging
    def init_db():
        with app.app_context():
            conn = sqlite3.connect('stores.db')
            c = conn.cursor()
            # Existing store table
            c.execute('''CREATE TABLE IF NOT EXISTS stores
                         (id INTEGER PRIMARY KEY AUTOINCREMENT,
                          store_name TEXT NOT NULL,
                          store_type TEXT NOT NULL,
                          store_description TEXT,
                          contact_number TEXT NOT NULL,
                          email TEXT NOT NULL,
                          password TEXT NOT NULL,
                          latitude REAL NOT NULL,
                          longitude REAL NOT NULL)''')
            
            # New logging table
            c.execute('''CREATE TABLE IF NOT EXISTS logs
                         (id INTEGER PRIMARY KEY AUTOINCREMENT,
                          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                          level TEXT NOT NULL,
                          message TEXT NOT NULL,
                          user_email TEXT,
                          endpoint TEXT NOT NULL)''')
            
            # Products table
            c.execute('''CREATE TABLE IF NOT EXISTS products
                         (id INTEGER PRIMARY KEY AUTOINCREMENT,
                          store_id INTEGER NOT NULL,
                          name TEXT NOT NULL,
                          price REAL NOT NULL,
                          stock BOOLEAN NOT NULL,
                          FOREIGN KEY (store_id) REFERENCES stores (id))''')
            conn.commit()
            conn.close()

    init_db()

    # Helper function to log messages to the database
    def log_to_db(level, message, user_email=None, endpoint=None):
        try:
            conn = sqlite3.connect('stores.db')
            c = conn.cursor()
            c.execute('''INSERT INTO logs (level, message, user_email, endpoint)
                         VALUES (?, ?, ?, ?)''',
                      (level, message, user_email, endpoint))
            conn.commit()
        except sqlite3.OperationalError as e:
            print(f"Database error: {e}")
        finally:
            conn.close()

    # Store registration endpoint
    @app.route('/register', methods=['POST'])
    def register_store():
        data = request.get_json()
        store_name = data.get('store_name')
        store_type = data.get('store_type')
        store_description = data.get('store_description')
        contact_number = data.get('contact_number')
        email = data.get('email')
        password = data.get('password')
        latitude = data.get('latitude')
        longitude = data.get('longitude')

        if not all([store_name, store_type, contact_number, email, password, latitude, longitude]):
            log_to_db('ERROR', 'Missing required fields', email, '/register')
            return jsonify({'message': 'All fields are required'}), 400

        try:
            conn = sqlite3.connect('stores.db')
            c = conn.cursor()
            c.execute('''INSERT INTO stores (store_name, store_type, store_description, contact_number, email, password, latitude, longitude)
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
                       (store_name, store_type, store_description, contact_number, email, password, latitude, longitude))
            conn.commit()
        except sqlite3.OperationalError as e:
            log_to_db('ERROR', f'Database error: {e}', email, '/register')
            return jsonify({'message': 'Database error'}), 500
        finally:
            conn.close()

        log_to_db('INFO', 'Store registered successfully', email, '/register')
        return jsonify({'message': 'Store registered successfully'}), 201

    # Fetch store details endpoint
    @app.route('/store/<int:store_id>', methods=['GET'])
    def get_store(store_id):
        conn = sqlite3.connect('stores.db')
        c = conn.cursor()
        c.execute('SELECT * FROM stores WHERE id = ?', (store_id,))
        store = c.fetchone()
        conn.close()

        if store:
            store_data = {
                'id': store[0],
                'store_name': store[1],
                'store_type': store[2],
                'store_description': store[3],
                'contact_number': store[4],
                'email': store[5],
                'latitude': store[7],
                'longitude': store[8]
            }
            return jsonify(store_data), 200
        else:
            return jsonify({'message': 'Store not found'}), 404

    # Login endpoint
    @app.route('/login', methods=['POST'])
    def login():
        data = request.json
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            log_to_db('ERROR', 'Login attempt with missing fields', email, '/login')
            return jsonify({'message': 'Email and password are required'}), 400

        conn = sqlite3.connect('stores.db')
        c = conn.cursor()
        c.execute('SELECT * FROM stores WHERE email = ? AND password = ?', (email, password))
        user = c.fetchone()
        conn.close()

        if user:
            log_to_db('INFO', 'Login successful', email, '/login')
            return jsonify({'message': 'Login successful'}), 200
        else:
            log_to_db('ERROR', 'Login failed: Invalid credentials', email, '/login')
            return jsonify({'message': 'Invalid credentials'}), 401

    # Logging endpoint
    @app.route('/log', methods=['POST'])
    def log():
        data = request.json
        level = data.get('level')
        message = data.get('message')
        user_email = data.get('user_email')
        endpoint = data.get('endpoint')

        if not all([level, message, endpoint]):
            return jsonify({'message': 'Missing required fields'}), 400

        log_to_db(level, message, user_email, endpoint)
        return jsonify({'message': 'Log recorded successfully'}), 201

    # Sentiment analysis endpoint
    @app.route('/predict', methods=['POST'])
    def predict():
        data = request.json
        text = data.get("text", "").strip()

        if not text:
            return jsonify({"error": "No text provided"}), 400

        # Process and predict
        processed_text = preprocessing(text)
        vectorized_text = vectorizer(processed_text)
        prediction = get_prediction(vectorized_text)

        # Update counts
        if prediction == "negative":
            app.config["negative"] += 1
        else:
            app.config["positive"] += 1

        # Store reviews
        app.config["reviews"].insert(0, {"text": text, "prediction": prediction})

        return jsonify({
            "prediction": prediction,
            "positive_count": app.config["positive"],
            "negative_count": app.config["negative"],
            "recent_reviews": app.config["reviews"][:5]  # Send only last 5 reviews
        })

    # Add product endpoint
    @app.route('/store/<int:store_id>/add-product', methods=['POST'])
    def add_product(store_id):
        data = request.json
        name = data.get('name')
        price = data.get('price')
        stock = data.get('stock', True)

        if not name or not price:
            return jsonify({'message': 'Name and price are required'}), 400

        conn = sqlite3.connect('stores.db')
        c = conn.cursor()
        c.execute('''INSERT INTO products (store_id, name, price, stock)
                     VALUES (?, ?, ?, ?)''',
                  (store_id, name, price, stock))
        conn.commit()
        product_id = c.lastrowid
        conn.close()

        return jsonify({
            'id': product_id,
            'store_id': store_id,
            'name': name,
            'price': price,
            'stock': stock,
        }), 201

    return app

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        db.create_all()  # Create tables if they don't exist
    app.run(host="0.0.0.0", port=5001, debug=True)