from flask import Blueprint

# Import all routes from the original app.py temporarily
# These will be refactored into proper service layer later

dictionary_bp = Blueprint('dictionary', __name__)

# TODO: Move all dictionary routes here from app.py
# For now, keep using the original app.py structure
