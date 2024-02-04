from flask import Blueprint, render_template, request, jsonify
from app.utils.helper import interpolate, compute_image, make_image

main_bp = Blueprint("main", __name__)


@main_bp.route('/')
def index():
    return render_template('index.html')


@main_bp.route('/process_coordinates', methods=['POST'])
def process_coordinates():
    coordinates = request.json.get('coordinates')
    plot_type = request.json.get('plotType')
    color_map = request.json.get('colorMap')
    x_new, y_new = interpolate(coordinates)
    arr = compute_image(y_new, plot_type)
    img = make_image(arr, color_map)
    return jsonify({'image': img})
