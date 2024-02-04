from flask import Blueprint, render_template, request, jsonify
import app.util


# Create a Blueprint for your routes
main_bp = Blueprint("main", __name__)


@main_bp.route('/')
def index():
    return render_template('index.html')


@main_bp.route('/process_coordinates', methods=['POST'])
def process_coordinates():
    coordinates = request.json.get('coordinates')
    plot_type = request.json.get('plotType')
    color_map = request.json.get('colorMap')
    x_new, y_new = app.util.interpolate(coordinates)
    arr = app.util.compute_image(y_new, plot_type)
    img = app.util.make_image(arr, color_map)
    return jsonify({'image': img})
