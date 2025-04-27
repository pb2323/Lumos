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
from uagents_adapter.langchain import UAgentRegisterTool, cleanup_uagent
from uagents_core.contrib.protocols.chat import (
    ChatMessage, TextContent, ChatAcknowledgement
)

# Configure project directory
PROJECT_DIR = os.path.expanduser('~/family_recognition')
os.makedirs(PROJECT_DIR, exist_ok=True)
os.makedirs(f"{PROJECT_DIR}/family_profiles", exist_ok=True)
os.makedirs(f"{PROJECT_DIR}/temp", exist_ok=True)

# Define the FamilyRecognitionSystem class
# ---------------------------------------

class FamilyRecognitionSystem:
    def __init__(self,
                 profiles_dir: str = f"{PROJECT_DIR}/family_profiles",
                 model_name: str = "VGG-Face",
                 distance_metric: str = "cosine",
                 threshold: float = 0.4):
        """
        Initialize the family recognition system.

        Args:
            profiles_dir: Directory to store family profiles
            model_name: Face recognition model to use (VGG-Face, Facenet, etc.)
            distance_metric: Distance metric to use (cosine, euclidean, etc.)
            threshold: Similarity threshold for recognizing faces
        """
        self.profiles_dir = profiles_dir
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

        for img_path in image_paths:
            try:
                embedding = DeepFace.represent(
                    img_path=img_path,
                    model_name=self.model_name,
                    enforce_detection=True
                )
                embeddings.append(embedding[0]["embedding"])
                valid_paths.append(img_path)
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

def main():
    """Main function for interactive mode."""
    print("Family Face Recognition System")
    print("-----------------------------")
    
    # Initialize the system
    face_system = FamilyRecognitionSystem()
    
    # Set your Google API key
    GOOGLE_API_KEY = "AIzaSyDqM0NX29baB35wtCLZI9aTNYZ3v-kyCjo"  # Replace with your actual API key
    
    # Create agent
    agent = FaceRecognitionAgent(face_system, GOOGLE_API_KEY)
    
    # Interactive menu
    while True:
        print("\nOptions:")
        print("1. Create family member profile")
        print("2. Identify person in photo")
        print("3. List family profiles")
        print("4. Start uAgent server")
        print("5. Exit")
        
        choice = input("\nEnter your choice (1-5): ")
        
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
            # Register uAgent
            print("Starting uAgent server...")
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
                print("Press Ctrl+C to stop the server...")
                try:
                    while True:
                        time.sleep(1)
                except KeyboardInterrupt:
                    print("\n🛑 Shutting down LangChain agent...")
                    cleanup_uagent("face_recognition_agent")
                    print("✅ Agent stopped.")
            except Exception as e:
                print(f"Error starting uAgent server: {e}")
                
        elif choice == "5":
            # Exit
            print("Exiting...")
            break
            
        else:
            print("Invalid choice. Please enter a number between 1 and 5.")


if __name__ == "__main__":
    main()