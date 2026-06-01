# app.py
from flask import Flask, jsonify
from flask_cors import CORS
import db

app = Flask(__name__)
# Enable CORS so the React frontend (e.g., localhost:3000) can make requests to Flask
CORS(app)

@app.route('/api/systems/<system_name>/drift/latest', methods=['GET'])
def get_latest_drift(system_name):
    """API endpoint to get current DRIFTED components."""
    try:
        # Calls the function from your db.py module
        data = db.get_latest_drift_status(system_name)
        return jsonify({"status": "success", "data": data}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/systems/<system_name>/drift/trend', methods=['GET'])
def get_drift_trend(system_name):
    """API endpoint to get drift trends over time."""
    try:
        # Calls the function from your db.py module
        data = db.get_drift_trend(system_name)
        return jsonify({"status": "success", "data": data}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    # Run the API on port 5000
    app.run(debug=True, port=5000)