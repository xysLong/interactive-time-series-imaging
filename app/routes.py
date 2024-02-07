from flask import Blueprint, render_template, request, jsonify
from app.utils.helper import interpolate, compute_image, make_image

main_bp = Blueprint("main", __name__)


@main_bp.route('/')
def index():
    return render_template('index.html')


@main_bp.route('/process_coordinates', methods=['POST'])
def process_coordinates():
    coordinates = request.json.get('coordinates')
    imaging = request.json.get('imaging')
    colormap = request.json.get('colormap')
    x_new, y_new = interpolate(coordinates)
    arr = compute_image(y_new, imaging)
    img = make_image(arr, colormap)
    return jsonify({'image': img})
