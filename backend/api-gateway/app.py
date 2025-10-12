from flask import Flask, request, jsonify, redirect
from flask_cors import CORS
import requests
import json
import os
from werkzeug.exceptions import RequestTimeout

app = Flask(__name__)
CORS(app)

# Service configuration
SERVICES = {
    'translator': {
        'url': 'http://localhost:5001',
        'health': '/health'
    },
    'dictionary': {
        'url': 'http://localhost:5002',
        'health': '/health'
    },
    'history': {
        'url': 'http://localhost:5003',
        'health': '/health'
    }
}

# Route mapping
ROUTE_MAPPINGS = {
    '/api/translate': 'translator',
    '/api/languages': 'translator',
    '/api/dictionary': 'dictionary',
    '/api/dictionary/search': 'dictionary',
    '/api/dictionary/add': 'dictionary',
    '/api/history': 'history',
    '/api/feedback': 'history'
}

def get_service_url(service_name):
    """Get the base URL for a service"""
    return SERVICES.get(service_name, {}).get('url', '')

def forward_request(service_name, path, method='GET', data=None, params=None):
    """Forward request to appropriate microservice"""
    try:
        service_url = get_service_url(service_name)
        if not service_url:
            return jsonify({'error': 'Service not found'}), 404
        
        url = f"{service_url}{path}"
        
        # Forward the request
        if method == 'GET':
            response = requests.get(url, params=params, timeout=30)
        elif method == 'POST':
            response = requests.post(url, json=data, params=params, timeout=30)
        elif method == 'PUT':
            response = requests.put(url, json=data, params=params, timeout=30)
        elif method == 'DELETE':
            response = requests.delete(url, params=params, timeout=30)
        else:
            return jsonify({'error': 'Method not allowed'}), 405
        
        return jsonify(response.json()), response.status_code
        
    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'Service unavailable: {str(e)}'}), 503
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    service_health = {}
    
    for service_name, config in SERVICES.items():
        try:
            response = requests.get(f"{config['url']}{config['health']}", timeout=5)
            service_health[service_name] = {
                'status': 'healthy' if response.status_code == 200 else 'unhealthy',
                'response_time': response.elapsed.total_seconds()
            }
        except Exception as e:
            service_health[service_name] = {
                'status': 'unhealthy',
                'error': str(e)
            }
    
    overall_status = 'healthy' if all(
        service['status'] == 'healthy' for service in service_health.values()
    ) else 'degraded'
    
    return jsonify({
        'status': overall_status,
        'services': service_health,
        'timestamp': requests.get('http://worldtimeapi.org/api/timezone/Etc/UTC').json()['datetime'] if overall_status == 'healthy' else None
    })

@app.route('/api/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE'])
def api_gateway(path):
    """Main API gateway endpoint"""
    full_path = f'/api/{path}'
    
    # Find the appropriate service
    service_name = None
    for route_pattern, service in ROUTE_MAPPINGS.items():
        if full_path.startswith(route_pattern):
            service_name = service
            break
    
    if not service_name:
        return jsonify({'error': 'Route not found'}), 404
    
    # Get request data
    data = None
    if request.method in ['POST', 'PUT']:
        data = request.get_json()
    
    params = request.args.to_dict()
    
    # Forward the request
    return forward_request(service_name, full_path, request.method, data, params)

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print("Starting API Gateway on port 5000...")
    print("Available routes:")
    for route, service in ROUTE_MAPPINGS.items():
        print(f"  {route} -> {service} service")
    
    app.run(host='0.0.0.0', port=5000, debug=True)