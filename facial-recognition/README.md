# Family Face Recognition System

This project implements a face recognition system to identify family members using DeepFace and LangChain integration. It allows you to create profiles for family members, upload images, and identify individuals in photos.

## Features

- Creates family member profiles using facial embeddings.
- Identifies faces in images by comparing with stored profiles.
- Provides a confidence score for identification results.
- Integrates with LangChain for conversational AI capabilities.
- Allows for easy profile management and image uploads.

## Requirements

- Python 3.7 or higher
- Required packages: `deepface`, `langchain`, `langchain_google_genai`, `pillow`, `matplotlib`
- Google Cloud Project with Vertex AI API enabled
- Google API Key

## Installation

1. Install the necessary packages:
```
bash pip install deepface langchain langchain_google_genai pillow matplotlib
```

2. Set up your Google Cloud project and enable the Vertex AI API.
3. Obtain a Google API key and store it securely.

## Usage

1. **Mount Google Drive:**
   - This step is for persistent storage of family profiles.
   - Follow the instructions within the notebook for mounting your Drive.

2. **Create Profiles:**
   - Run the `upload_images()` function to upload reference images for family members.
   - Provide the name and image paths to the `create_profile()` function to create new profiles.

3. **Identify Faces:**
   - Use the `upload_images()` function to upload a test image.
   - Call the `identify_face()` function to identify the individual in the image.

4. **LangChain Integration:**
   - Set your Google API key in the `GOOGLE_API_KEY` variable.
   - Initialize the `FaceRecognitionAgent` with the face system and API key.
   - Use the `run()` method of the agent to perform tasks like listing profiles or identifying faces using natural language queries.


