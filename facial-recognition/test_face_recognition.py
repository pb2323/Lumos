import base64
import requests
import json

def image_to_base64(image_path):
    """Convert image to base64 string."""
    try:
        with open(image_path, "rb") as image_file:
            # Read the image file and encode it to base64
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
            return encoded_string
    except Exception as e:
        print(f"Error converting image to base64: {e}")
        return None

def test_face_recognition():
    """Test the face recognition endpoint."""
    # Image path
    image_path = "/Users/puneetbajaj/Downloads/Chayan_3.jpeg"
    
    # Convert image to base64
    base64_image = image_to_base64(image_path)
    if not base64_image:
        print("Failed to convert image to base64")
        return
    
    # Prepare the request
    url = "http://localhost:50001/api/identify"
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "image": base64_image
    }
    
    try:
        # Send POST request
        print("Sending request to face recognition endpoint...")
        response = requests.post(url, headers=headers, json=payload)
        
        # Print response
        print("\nResponse Status:", response.status_code)
        print("Response Body:")
        print(json.dumps(response.json(), indent=2))
        
    except Exception as e:
        print(f"Error making request: {e}")

if __name__ == "__main__":
    test_face_recognition() 