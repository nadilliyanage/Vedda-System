import os
import re
import requests
from pathlib import Path

try:
    import gdown
    GDOWN_AVAILABLE = True
except ImportError:
    GDOWN_AVAILABLE = False
    print("⚠️  gdown not available, using fallback method for Google Drive downloads")


def extract_google_drive_id(url):
    """Extract file ID from Google Drive URL."""
    # Handle various Google Drive URL formats
    patterns = [
        r'/file/d/([a-zA-Z0-9_-]+)',
        r'id=([a-zA-Z0-9_-]+)',
        r'/folders/([a-zA-Z0-9_-]+)'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def extract_google_sheets_id(url):
    """Extract spreadsheet ID from Google Sheets URL."""
    patterns = [
        r'/spreadsheets/d/([a-zA-Z0-9_-]+)',
        r'key=([a-zA-Z0-9_-]+)'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def download_google_drive_file(url, destination):
    """Download a file from Google Drive."""
    file_id = extract_google_drive_id(url)
    if not file_id:
        raise ValueError(f"Could not extract file ID from URL: {url}")
    
    print(f"📥 Downloading from Google Drive (ID: {file_id})...")
    
    os.makedirs(os.path.dirname(destination), exist_ok=True)
    
    # Try using gdown first (more reliable for Google Drive)
    if GDOWN_AVAILABLE:
        try:
            print("   Using gdown for reliable Google Drive download...")
            download_url = f"https://drive.google.com/uc?id={file_id}"
            gdown.download(download_url, destination, quiet=False, fuzzy=True)
            
            # Verify the file was downloaded correctly
            if os.path.exists(destination):
                file_size = os.path.getsize(destination)
                if file_size < 1024:  # Less than 1KB is suspicious
                    print(f"\n⚠️  Downloaded file is only {file_size} bytes. This might be an error page.")
                    os.remove(destination)
                    raise Exception("Downloaded file is too small, likely an error page")
                else:
                    print(f"\n✅ Downloaded to: {destination} ({file_size / (1024*1024):.2f} MB)")
                    return destination
            else:
                raise Exception("Download failed - file not created")
        except Exception as e:
            print(f"⚠️  gdown failed: {e}")
            print("   Trying fallback method...")
    
    # Fallback to requests method
    download_url = f"https://drive.google.com/uc?export=download&id={file_id}"
    
    session = requests.Session()
    
    # First request to get cookies and check for virus scan warning
    response = session.get(download_url, stream=True)
    
    # Check if we got a confirmation token (for large files)
    token = None
    for key, value in response.cookies.items():
        if key.startswith('download_warning'):
            token = value
            break
    
    # If we have a confirmation token, use it
    if token:
        download_url = f"https://drive.google.com/uc?export=download&id={file_id}&confirm={token}"
        response = session.get(download_url, stream=True)
    
    # Check if we got an HTML page (error) instead of the file
    content_type = response.headers.get('Content-Type', '')
    if 'text/html' in content_type:
        # Try alternative method: use uc?export=download&confirm=t
        print("⚠️  First attempt got HTML, trying alternative download method...")
        download_url = f"https://drive.google.com/uc?export=download&id={file_id}&confirm=t"
        response = session.get(download_url, stream=True, allow_redirects=True)
        
        # If still HTML, the file might require permissions or the link is wrong
        content_type = response.headers.get('Content-Type', '')
        if 'text/html' in content_type:
            raise Exception("Unable to download file. The file may be too large, require permissions, or the link may be incorrect. Please ensure the file is publicly accessible and try using a direct download link.")
    
    # Save the file
    total_size = int(response.headers.get('content-length', 0))
    block_size = 8192
    downloaded = 0
    
    with open(destination, 'wb') as f:
        for chunk in response.iter_content(chunk_size=block_size):
            if chunk:
                f.write(chunk)
                downloaded += len(chunk)
                if total_size > 0:
                    progress = (downloaded / total_size) * 100
                    print(f"\rProgress: {progress:.1f}%", end='', flush=True)
    
    # Verify the file was downloaded correctly
    file_size = os.path.getsize(destination)
    if file_size < 1024:  # Less than 1KB is suspicious
        print(f"\n⚠️  Downloaded file is only {file_size} bytes. This might be an error page.")
        print("   Please verify the Google Drive link is publicly accessible.")
        print("   To make it public: Right-click the file → Share → Change to 'Anyone with the link'")
    else:
        print(f"\n✅ Downloaded to: {destination} ({file_size / (1024*1024):.2f} MB)")
    
    return destination


def download_google_sheets_file(url, destination):
    """Download a Google Sheets file as Excel."""
    sheet_id = extract_google_sheets_id(url)
    if not sheet_id:
        raise ValueError(f"Could not extract spreadsheet ID from URL: {url}")
    
    print(f"📥 Downloading from Google Sheets (ID: {sheet_id})...")
    
    # Export as Excel
    export_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=xlsx"
    
    response = requests.get(export_url, stream=True)
    
    if response.status_code != 200:
        raise Exception(f"Failed to download Google Sheets file. Status code: {response.status_code}")
    
    os.makedirs(os.path.dirname(destination), exist_ok=True)
    
    with open(destination, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            if chunk:
                f.write(chunk)
    
    print(f"✅ Downloaded to: {destination}")
    return destination


def ensure_required_files():
    """Check if required files exist, download if missing."""
    from app.config import Config
    
    # Ensure data directory exists
    os.makedirs(Config.DATA_DIR, exist_ok=True)
    
    # Hybrid model file paths
    feature_extractor_path = Config.FEATURE_EXTRACTOR_PATH
    svm_path = Config.SVM_PATH
    scaler_path = Config.SCALER_PATH
    metadata_path = Config.METADATA_PATH
    
    # Download URLs
    feature_extractor_url = Config.FEATURE_EXTRACTOR_URL
    svm_url = Config.SVM_URL
    scaler_url = Config.SCALER_URL
    metadata_url = Config.METADATA_URL
    
    files_ok = True
    
    # Check and download feature extractor
    if not os.path.exists(feature_extractor_path) or os.path.getsize(feature_extractor_path) < 1024:
        if os.path.exists(feature_extractor_path):
            print(f"⚠️  Feature extractor file is too small, re-downloading...")
            os.remove(feature_extractor_path)
        else:
            print(f"⚠️  Feature extractor not found at: {feature_extractor_path}")
        
        if feature_extractor_url:
            try:
                download_google_drive_file(feature_extractor_url, feature_extractor_path)
                if os.path.getsize(feature_extractor_path) < 1024:
                    print("❌ Downloaded feature extractor appears to be invalid")
                    files_ok = False
            except Exception as e:
                print(f"❌ Failed to download feature extractor: {e}")
                print(f"   Please manually download and save to: {feature_extractor_path}")
                files_ok = False
        else:
            print("❌ FEATURE_EXTRACTOR_URL not configured in .env file")
            print(f"   Please download the feature extractor and place it at: {feature_extractor_path}")
            files_ok = False
    else:
        file_size = os.path.getsize(feature_extractor_path) / (1024 * 1024)  # MB
        print(f"✅ Feature extractor found: {feature_extractor_path} ({file_size:.2f} MB)")
    
    # Check and download SVM classifier
    if not os.path.exists(svm_path) or os.path.getsize(svm_path) < 100:
        if os.path.exists(svm_path):
            print(f"⚠️  SVM classifier file is too small, re-downloading...")
            os.remove(svm_path)
        else:
            print(f"⚠️  SVM classifier not found at: {svm_path}")
        
        if svm_url:
            try:
                download_google_drive_file(svm_url, svm_path)
                if os.path.getsize(svm_path) < 100:
                    print("❌ Downloaded SVM classifier appears to be invalid")
                    files_ok = False
            except Exception as e:
                print(f"❌ Failed to download SVM classifier: {e}")
                print(f"   Please manually download and save to: {svm_path}")
                files_ok = False
        else:
            print("❌ SVM_URL not configured in .env file")
            print(f"   Please download the SVM classifier and place it at: {svm_path}")
            files_ok = False
    else:
        file_size = os.path.getsize(svm_path) / 1024  # KB
        print(f"✅ SVM classifier found: {svm_path} ({file_size:.2f} KB)")
    
    # Check and download feature scaler
    if not os.path.exists(scaler_path) or os.path.getsize(scaler_path) < 100:
        if os.path.exists(scaler_path):
            print(f"⚠️  Feature scaler file is too small, re-downloading...")
            os.remove(scaler_path)
        else:
            print(f"⚠️  Feature scaler not found at: {scaler_path}")
        
        if scaler_url:
            try:
                download_google_drive_file(scaler_url, scaler_path)
                if os.path.getsize(scaler_path) < 100:
                    print("❌ Downloaded feature scaler appears to be invalid")
                    files_ok = False
            except Exception as e:
                print(f"❌ Failed to download feature scaler: {e}")
                print(f"   Please manually download and save to: {scaler_path}")
                files_ok = False
        else:
            print("❌ SCALER_URL not configured in .env file")
            print(f"   Please download the feature scaler and place it at: {scaler_path}")
            files_ok = False
    else:
        file_size = os.path.getsize(scaler_path) / 1024  # KB
        print(f"✅ Feature scaler found: {scaler_path} ({file_size:.2f} KB)")
    
    # Check and download metadata file
    if not os.path.exists(metadata_path) or os.path.getsize(metadata_path) < 100:
        if os.path.exists(metadata_path):
            print(f"⚠️  Metadata file is too small, re-downloading...")
            os.remove(metadata_path)
        else:
            print(f"⚠️  Metadata file not found at: {metadata_path}")
        
        if metadata_url:
            try:
                download_google_sheets_file(metadata_url, metadata_path)
                # Verify the downloaded file
                if os.path.getsize(metadata_path) < 100:
                    print("❌ Downloaded metadata file appears to be invalid")
                    files_ok = False
            except Exception as e:
                print(f"❌ Failed to download metadata file: {e}")
                print(f"   Please manually download from: {metadata_url}")
                print(f"   And save to: {metadata_path}")
                files_ok = False
        else:
            print("❌ METADATA_URL not configured in .env file")
            print(f"   Please download the metadata and place it at: {metadata_path}")
            files_ok = False
    else:
        file_size = os.path.getsize(metadata_path) / 1024  # KB
        print(f"✅ Metadata file found: {metadata_path} ({file_size:.2f} KB)")
    
    # Verify all files exist and have reasonable sizes
    if not (os.path.exists(feature_extractor_path) and os.path.exists(svm_path) and 
            os.path.exists(scaler_path) and os.path.exists(metadata_path)):
        print("\n⚠️  Warning: Required files are missing. Service may not work properly.")
        print("\nTroubleshooting:")
        print("1. Ensure Google Drive files are publicly accessible")
        print("2. Check that URLs in .env are correct (FEATURE_EXTRACTOR_URL, SVM_URL, SCALER_URL, METADATA_URL)")
        print("3. Manually download and place files in the data/ directory:")
        print(f"   - {feature_extractor_path}")
        print(f"   - {svm_path}")
        print(f"   - {scaler_path}")
        print(f"   - {metadata_path}")
        return False
    
    if not files_ok:
        print("\n⚠️  Warning: Some files may not have downloaded correctly.")
        return False
    
    print("\n✅ All required files are available")
    return True
