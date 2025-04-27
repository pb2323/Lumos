#!/usr/bin/env python3
# Family Face Recognition System with LangChain
# =============================================

# This script creates a face identification system for recognizing family members
# using DeepFace and LangChain integration.

# Setup and Installations
# -----------------------

import os
import numpy as np
import matplotlib.pyplot as plt
from PIL import Image
from typing import List, Dict, Optional, Union, Tuple
import pickle
import json
from pathlib import Path
from deepface import DeepFace
from langchain.agents import Tool, AgentExecutor, create_react_agent
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
from langchain.tools import tool
from langchain.prompts import MessagesPlaceholder
import datetime
from uuid import uuid4
import time
from uagents import Context, Model
from uagents_adapter.langchain import UAgentRegisterTool, cleanup_uagent
from uagents_core.contrib.protocols.chat import (
    ChatMessage, TextContent, ChatAcknowledgement, chat_protocol_spec
)
import glob
import shutil
from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import logging
import io

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure project directory
PROJECT_DIR = os.path.expanduser('~/family_recognition')
WATCH_DIR = "/tmp/lumosprofiles"
UPLOAD_DIR = "/tmp/lumosinput"
PROFILE_IMAGES_DIR = os.path.join(PROJECT_DIR, "profile_images")

# Create necessary directories
os.makedirs(PROJECT_DIR, exist_ok=True)
os.makedirs(os.path.join(PROJECT_DIR, "family_profiles"), exist_ok=True)
os.makedirs(os.path.join(PROJECT_DIR, "temp"), exist_ok=True)
os.makedirs(WATCH_DIR, exist_ok=True)
os.makedirs(PROFILE_IMAGES_DIR, exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Define the FamilyRecognitionSystem class
# ---------------------------------------

class FamilyRecognitionSystem:
    def __init__(self,
                 profiles_dir: str = os.path.join(PROJECT_DIR, "family_profiles"),
                 profile_images_dir: str = PROFILE_IMAGES_DIR,
                 model_name: str = "VGG-Face",
                 distance_metric: str = "cosine",
                 threshold: float = 0.4):
        """
        Initialize the family recognition system.

        Args:
            profiles_dir: Directory to store family profiles
            profile_images_dir: Directory to store permanent copies of profile images
            model_name: Face recognition model to use (VGG-Face, Facenet, etc.)
            distance_metric: Distance metric to use (cosine, euclidean, etc.)
            threshold: Similarity threshold for recognizing faces
        """
        self.profiles_dir = profiles_dir
        self.profile_images_dir = profile_images_dir
        self.model_name = model_name
        self.distance_metric = distance_metric
        self.threshold = threshold
        self.family_profiles = self._load_profiles()

    def _load_profiles(self) -> Dict[str, Dict]:
        """Load existing family profiles from disk."""
        profiles = {}
        profile_files = Path(self.profiles_dir).glob("*.pkl")

        for profile_file in profile_files:
            name = profile_file.stem
            with open(profile_file, "rb") as f:
                profiles[name] = pickle.load(f)

        print(f"Loaded {len(profiles)} family profiles.")
        return profiles

    def _save_profile_image(self, source_path: str, name: str, index: int) -> str:
        """
        Save a permanent copy of a profile image.

        Args:
            source_path: Path to the source image
            name: Name of the person
            index: Index of the image for this person

        Returns:
            str: Path where the image was saved
        """
        # Create directory for this person's images if it doesn't exist
        person_dir = os.path.join(self.profile_images_dir, name)
        os.makedirs(person_dir, exist_ok=True)

        # Get file extension from source path
        _, ext = os.path.splitext(source_path)
        
        # Create destination path
        dest_path = os.path.join(person_dir, f"{name}_{index}{ext}")
        
        # Copy the file
        shutil.copy2(source_path, dest_path)
        
        return dest_path

    def create_profile(self, name: str, image_paths: List[str]) -> Dict:
        """
        Create a new family member profile.

        Args:
            name: Name of the family member
            image_paths: List of paths to images of the family member

        Returns:
            The created profile
        """
        if name in self.family_profiles:
            print(f"Profile for {name} already exists. Updating profile.")

        embeddings = []
        valid_paths = []

        for idx, img_path in enumerate(image_paths):
            try:
                embedding = DeepFace.represent(
                    img_path=img_path,
                    model_name=self.model_name,
                    enforce_detection=True
                )
                # Save a permanent copy of the image
                saved_path = self._save_profile_image(img_path, name, idx)
                embeddings.append(embedding[0]["embedding"])
                valid_paths.append(saved_path)
            except Exception as e:
                print(f"Could not process image {img_path}: {e}")

        if not embeddings:
            raise ValueError("No valid faces detected in provided images.")

        profile = {
            "name": name,
            "embeddings": embeddings,
            "image_paths": valid_paths,
            "model_name": self.model_name
        }

        # Save profile
        self.family_profiles[name] = profile
        with open(f"{self.profiles_dir}/{name}.pkl", "wb") as f:
            pickle.dump(profile, f)

        print(f"Created profile for {name} with {len(embeddings)} face embeddings.")
        return profile

    def identify_face(self, image_path: str) -> Tuple[Optional[str], float]:
        """
        Identify a face in an image.

        Args:
            image_path: Path to the image

        Returns:
            Tuple of (identified_name, confidence)
        """
        try:
            # Get embedding for the input face
            embedding = DeepFace.represent(
                img_path=image_path,
                model_name=self.model_name,
                enforce_detection=True
            )
            input_embedding = embedding[0]["embedding"]
        except Exception as e:
            print(f"Error detecting face: {e}")
            return None, 0.0

        if not self.family_profiles:
            print("No family profiles available.")
            return None, 0.0

        best_match = None
        best_similarity = 0.0

        # Compare with all family members
        for name, profile in self.family_profiles.items():
            for stored_embedding in profile["embeddings"]:
                print(f"Comparing {image_path} with {profile['image_paths'][0]}")
                # Calculate similarity (1 - distance)
                result = DeepFace.verify(
                    img1_path=image_path,
                    img2_path=profile["image_paths"][0],  # Use first image as reference
                    model_name=self.model_name,
                    distance_metric=self.distance_metric,
                    enforce_detection=False  # Already verified there's a face
                )

                # Convert distance to similarity
                similarity = 1.0 - result["distance"]

                if similarity > best_similarity:
                    best_similarity = similarity
                    best_match = name

        # Check if best match exceeds threshold
        if best_similarity > (1.0 - self.threshold):
            return best_match, best_similarity
        else:
            return None, best_similarity

    def list_profiles(self):
        """List all stored family profiles."""
        if not self.family_profiles:
            print("No family profiles have been created yet.")
            return

        print(f"Found {len(self.family_profiles)} family profiles:")
        for name, profile in self.family_profiles.items():
            print(f"- {name}: {len(profile['embeddings'])} face images")

    def delete_profile(self, name: str) -> bool:
        """
        Delete a family member profile.

        Args:
            name: Name of the family member whose profile should be deleted

        Returns:
            bool: True if profile was deleted successfully, False if profile doesn't exist
        """
        if name not in self.family_profiles:
            print(f"Profile for {name} does not exist.")
            return False

        # Remove profile from memory
        profile = self.family_profiles.pop(name)

        try:
            # Delete the profile file
            profile_path = os.path.join(self.profiles_dir, f"{name}.pkl")
            os.remove(profile_path)

            # Delete the profile images directory
            person_images_dir = os.path.join(self.profile_images_dir, name)
            if os.path.exists(person_images_dir):
                shutil.rmtree(person_images_dir)

            print(f"Deleted profile and images for {name}")
            return True
        except Exception as e:
            # If deletion fails, restore profile in memory
            self.family_profiles[name] = profile
            print(f"Error deleting profile: {e}")
            return False


# Define your models
class Request(Model):
    text: str

class Response(Model):
    timestamp: int
    text: str
    agent_address: str

# LangChain Integration
# --------------------

class FaceRecognitionAgent:
    def __init__(self, face_system: FamilyRecognitionSystem, api_key: str):
        """
        Initialize the Face Recognition Agent with LangChain.

        Args:
            face_system: FamilyRecognitionSystem instance
            api_key: Google API key for LangChain
        """
        self.face_system = face_system
        self.api_key = api_key
        self.tools = self._create_tools()
        self.llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro", temperature=0, google_api_key=api_key)
        self.agent_executor = self._create_agent()

    def _create_tools(self):
        """Create tools for the LangChain agent."""

        @tool
        def create_family_profile(name_and_image_paths: str) -> str:
            """
            Create a family member profile from images.
            Input should be JSON string with 'name' and 'image_paths'.
            Example: '{"name": "John", "image_paths": ["/path/to/image1.jpg", "/path/to/image2.jpg"]}'
            """
            try:
                data = json.loads(name_and_image_paths)
                name = data["name"]
                image_paths = data["image_paths"]

                profile = self.face_system.create_profile(name, image_paths)
                return f"Created profile for {name} with {len(profile['embeddings'])} face embeddings."
            except Exception as e:
                return f"Error creating profile: {str(e)}"

        @tool
        def identify_person(image_path: str) -> str:
            """
            Identify a person in an image by comparing with stored family profiles.
            Input should be the path to the image.
            Example: "/path/to/image.jpg"
            """
            try:
                name, confidence = self.face_system.identify_face(image_path)
                if name:
                    return f"Identified as family member: {name} (confidence: {confidence:.2f})"
                else:
                    return f"No matching family member found (best similarity: {confidence:.2f})"
            except Exception as e:
                return f"Error identifying person: {str(e)}"

        @tool
        def list_family_members(dummy: str = "") -> str:
            """
            List all family members with profiles.
            No input required.
            """
            profiles = self.face_system.family_profiles
            if not profiles:
                return "No family profiles have been created yet."

            result = f"Found {len(profiles)} family profiles:\n"
            for name, profile in profiles.items():
                result += f"- {name}: {len(profile['embeddings'])} face images\n"
            return result

        return [create_family_profile, identify_person, list_family_members]

    def _create_agent(self):
        """Create the LangChain agent."""

        prompt = PromptTemplate(
        input_variables=["input", "agent_scratchpad"],
        template="""You are a helpful Family Face Recognition assistant.
        You can help create profiles for family members, identify people in photos,
        and manage face recognition tasks.

        {tools}

        Use the following format:

        Question: the input question you must answer
        Thought: you should always think about what to do
        Action: the action to take, should be one of [{tool_names}]
        Action Input: the input to the action
        Observation: the result of the action
        ... (this Thought/Action/Action Input/Observation can repeat N times)
        Thought: I now know the final answer
        Final Answer: the final answer to the original input question

        Begin!

        Question: {input}
        Thought: {agent_scratchpad}"""
        )
        agent = create_react_agent(self.llm, self.tools, prompt)

        
        agent_executor = AgentExecutor(
            agent=agent,
            tools=self.tools,
            verbose=True,
            handle_parsing_errors=True
        )
        return agent_executor

    def run(self, query: str):
        """Run the agent with a query."""
        return self.agent_executor.invoke({"input": query})


# Helper Functions
# ---------------

def display_image(img_path):
    """Display an image with matplotlib."""
    img = Image.open(img_path)
    plt.figure(figsize=(8, 8))
    plt.imshow(np.array(img))
    plt.axis('off')
    plt.show()


# Main function
# ------------

def process_new_profiles(face_system: 'FamilyRecognitionSystem') -> None:
    """
    Check for new images in the watch directory and create profiles.
    Images should be named as <Person_name>_<number>.jpeg
    """
    # Get all jpeg files in the watch directory
    image_files = glob.glob(os.path.join(WATCH_DIR, "*.jpeg"))
    
    if not image_files:
        return
        
    # Group files by person name
    person_images = {}
    for image_file in image_files:
        # Get the base name without extension and path
        base_name = os.path.basename(image_file)
        # Split by underscore to get person name
        person_name = base_name.split('_')[0]
        
        if person_name not in person_images:
            person_images[person_name] = []
        person_images[person_name].append(image_file)
    
    # Process each person's images
    for person_name, images in person_images.items():
        try:
            print(f"\nProcessing profile for {person_name}")
            print(f"Found {len(images)} images")
            
            # Create profile
            profile = face_system.create_profile(person_name, images)
            print(f"Successfully created profile for {person_name}")
            
            # Delete processed images
            for image_path in images:
                try:
                    os.remove(image_path)
                    print(f"Deleted processed image: {image_path}")
                except Exception as e:
                    print(f"Error deleting image {image_path}: {e}")
                    
        except Exception as e:
            print(f"Error creating profile for {person_name}: {e}")
            # Move failed images to an error folder
            error_dir = os.path.join(WATCH_DIR, "errors", person_name)
            os.makedirs(error_dir, exist_ok=True)
            for image_path in images:
                try:
                    shutil.move(image_path, os.path.join(error_dir, os.path.basename(image_path)))
                    print(f"Moved failed image to error directory: {image_path}")
                except Exception as move_error:
                    print(f"Error moving failed image {image_path}: {move_error}")

def init_system(api_key):
    """Initialize the face recognition system and agent."""
    global face_system, agent
    face_system = FamilyRecognitionSystem()
    agent = FaceRecognitionAgent(face_system, api_key)
    return face_system, agent

def save_base64_image(base64_string: str) -> str:
    """
    Convert base64 string to image and save it.
    
    Args:
        base64_string: Base64 encoded image string
        
    Returns:
        str: Path to saved image
    """
    try:
        # Remove header if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decode base64 string
        image_data = base64.b64decode(base64_string)
        
        # Create image from binary data
        image = Image.open(io.BytesIO(image_data))
        
        # Generate unique filename
        filename = f"{uuid4()}.jpeg"
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        # Save as JPEG
        image.save(filepath, 'JPEG')
        logger.info(f"Saved image to: {filepath}")
        
        return filepath
    except Exception as e:
        logger.error(f"Error saving base64 image: {e}")
        raise

@app.route('/api/identify', methods=['POST'])
def identify_face_endpoint():
    """Handle face identification from base64 image."""
    try:
        # Check if base64 image is in request
        if not request.json or 'image' not in request.json:
            return jsonify({'error': 'No base64 image provided'}), 400
        
        base64_image = request.json['image']
        
        # Save the image
        try:
            filepath = save_base64_image(base64_image)
        except Exception as e:
            return jsonify({'error': f'Error processing image: {str(e)}'}), 400
        
        # Perform face recognition
        try:
            name, confidence = face_system.identify_face(filepath)
        except Exception as e:
            return jsonify({'error': f'Error in face recognition: {str(e)}'}), 500
        finally:
            # Clean up uploaded file
            try:
                os.remove(filepath)
                logger.info(f"Cleaned up uploaded file: {filepath}")
            except Exception as e:
                logger.warning(f"Error cleaning up file {filepath}: {e}")
        
        # Return results
        if name:
            return jsonify({
                'success': True,
                'name': name,
                'confidence': float(confidence)
            })
        else:
            return jsonify({
                'success': False,
                'message': 'No matching face found',
                'confidence': float(confidence)
            })
            
    except Exception as e:
        logger.error(f"Error processing request: {e}")
        return jsonify({'error': str(e)}), 500

def main():
    """Main function for interactive mode."""
    print("Family Face Recognition System")
    print("-----------------------------")
    
    # Initialize the system
    GOOGLE_API_KEY = "AIzaSyDqM0NX29baB35wtCLZI9aTNYZ3v-kyCjo"  # Replace with your actual API key
    global face_system, agent
    face_system, agent = init_system(GOOGLE_API_KEY)
    
    # Interactive menu
    while True:
        print("\nOptions:")
        print("1. Create family member profile")
        print("2. Identify person in photo")
        print("3. List family profiles")
        print("4. Start uAgent server (with automatic profile creation and REST API)")
        print("5. Delete family member profile")
        print("6. Exit")
        
        choice = input("\nEnter your choice (1-6): ")
        
        if choice == "1":
            # Create profile
            name = input("Enter family member name: ")
            print("Enter paths to reference images (one per line, empty line to finish):")
            image_paths = []
            while True:
                path = input()
                if not path:
                    break
                if os.path.exists(path):
                    image_paths.append(path)
                else:
                    print(f"Warning: File {path} not found!")
            
            if image_paths:
                try:
                    profile = face_system.create_profile(name, image_paths)
                    print(f"Created profile for {name} with {len(profile['embeddings'])} face embeddings.")
                except Exception as e:
                    print(f"Error creating profile: {e}")
            else:
                print("No valid images provided.")
                
        elif choice == "2":
            # Identify person
            path = input("Enter path to image to identify: ")
            if os.path.exists(path):
                try:
                    name, confidence = face_system.identify_face(path)
                    if name:
                        print(f"Identified as: {name} (confidence: {confidence:.2f})")
                    else:
                        print(f"No match found (best similarity: {confidence:.2f})")
                except Exception as e:
                    print(f"Error identifying face: {e}")
            else:
                print(f"File {path} not found!")
                
        elif choice == "3":
            # List profiles
            face_system.list_profiles()
            
        elif choice == "4":
            # Register uAgent and start profile monitoring and REST API
            print("Starting uAgent server with automatic profile creation and REST API...")
            print(f"Monitoring folder: {WATCH_DIR}")
            print("REST API will run on http://localhost:50001")
            print("Use POST /api/identify with base64 image to identify faces")
            try:
                tool = UAgentRegisterTool()
                agent_info = tool.invoke({
                    "agent_obj": agent,
                    "name": "face_recognition_agent",
                    "port": 8000,
                    "description": "A LangChain agent for family face recognition",
                    "api_token": "eyJhbGciOiJSUzI1NiJ9.eyJleHAiOjE3NDgzMTA2MjcsImlhdCI6MTc0NTcxODYyNywiaXNzIjoiZmV0Y2guYWkiLCJqdGkiOiI1MmUwMmFkYzAwN2FlMmM3N2ViYjk4M2QiLCJzY29wZSI6ImF2Iiwic3ViIjoiMWJiMGM0NWMxZTk3NDkyYTE5OTBmZDJmOGZlNWUwYjE0MTUxYzkxOTkwOWY4Zjk3In0.OE3pgKf3EifgnT4pIStyClnV6KgvCE064BW3hnoHtS3jujRqQNlDHVVojW4tBT_GVlX9xiIg_Ghut4I8q1YIMMyXqCCV3ARvgKyOGx7Yd06NjPOQ0F_sQB5RBS278Y4Jxkt-PWrV5oPE5AYDLAH_CxN04NGVh2G4a8FAH-dt3C-pE3eOCjIAwFWEmT_2uqmlJc976WfjhY0E8fCDq9wVMTCa4gau1TG3a1MRHYX802hygQhhbAbLS3xmOK4-lotuUhQEaW6G5_37-gMYYrkfe2yX1gWBLSq-8SWznuTXPHvqpBIkzF5qklcFnwZk59y28iNMaqk_oHN41fh02QGncQ"
                })
                print(f"✅ Registered LangChain agent: {agent_info}")
                print("Press Ctrl+C to stop all services...")
                
                # Start both the profile monitoring and REST API in separate threads
                from threading import Thread
                import threading
                
                # Event to signal threads to stop
                stop_event = threading.Event()
                
                def monitor_profiles():
                    try:
                        while not stop_event.is_set():
                            process_new_profiles(face_system)
                            time.sleep(5)
                    except Exception as e:
                        print(f"Error in profile monitoring: {e}")
                
                def run_flask():
                    try:
                        app.run(host='0.0.0.0', port=50001, use_reloader=False)
                    except Exception as e:
                        print(f"Error in Flask server: {e}")
                
                # Start monitoring thread
                monitor_thread = Thread(target=monitor_profiles)
                monitor_thread.daemon = True
                monitor_thread.start()
                
                # Start Flask thread
                flask_thread = Thread(target=run_flask)
                flask_thread.daemon = True
                flask_thread.start()
                
                try:
                    # Keep main thread alive until Ctrl+C
                    while True:
                        time.sleep(1)
                except KeyboardInterrupt:
                    print("\n🛑 Shutting down all services...")
                    stop_event.set()  # Signal threads to stop
                    cleanup_uagent("face_recognition_agent")
                    print("✅ All services stopped.")
                    
            except Exception as e:
                print(f"Error starting services: {e}")
                
        elif choice == "5":
            # Delete profile
            face_system.list_profiles()  # Show available profiles first
            name = input("\nEnter the name of the profile to delete: ")
            if name:
                confirm = input(f"Are you sure you want to delete the profile for '{name}'? (yes/no): ")
                if confirm.lower() == 'yes':
                    if face_system.delete_profile(name):
                        print(f"Successfully deleted profile for {name}")
                    else:
                        print("Profile deletion failed")
                else:
                    print("Profile deletion cancelled")
            else:
                print("No name provided")
                
        elif choice == "6":
            # Exit
            print("Exiting...")
            break
        else:
            print("Invalid choice. Please enter a number between 1 and 6.")


if __name__ == "__main__":
    main()