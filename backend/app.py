from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS from flask_cors

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

game_data = {"score": 0}  # Sample data

@app.route('/update_score', methods=['POST'])
def update_score():
    try:
        data = request.get_json()
        if data and 'score' in data:
            game_data['score'] = data['score']
            return jsonify({"message": "Score updated successfully!"}), 200
        else:
            return jsonify({"error": "Invalid data. Please provide 'score'."}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/get_score', methods=['GET'])
def get_score():
    return jsonify(game_data)

if __name__ == '__main__':
    app.run(debug=True)
