from flask import Flask, request, jsonify
import subprocess
import sys
import time
from pyngrok import ngrok
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def deploy_with_ngrok(port=50001):
    """
    Deploy Flask server with ngrok tunnel.
    
    Args:
        port: The port number where Flask server is running
    """
    try:
        # Start ngrok tunnel
        public_url = ngrok.connect(port).public_url
        logger.info(f"ngrok tunnel established at: {public_url}")
        logger.info(f"Send this URL to your friend: {public_url}/api/identify")
        
        # Keep the script running
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\nShutting down ngrok tunnel...")
        ngrok.kill()
        print("✅ ngrok tunnel closed")
    except Exception as e:
        print(f"Error setting up ngrok: {e}")
        ngrok.kill()

if __name__ == "__main__":
    print("Starting ngrok tunnel...")
    print("Make sure your face recognition server is running on port 50001")
    deploy_with_ngrok() 