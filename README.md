# LUMOS - Intelligent Caregiving Platform

Lumos is a comprehensive caregiving platform that integrates facial recognition, location tracking, and notification systems to provide advanced care for family members, particularly seniors or individuals who need monitoring.

## Project Overview

Lumos consists of several integrated components:

1. **Facial Recognition System** - Identifies family members and caregivers
2. **Backend API Server** - Manages data and coordinates services
3. **Mobile Application (LumosCare)** - User interface for family and caregivers
4. **Intelligent Agents** - Autonomous services for location tracking and notifications
5. **Healthcare Model** - AI models for healthcare insights

## Components

### Facial Recognition

A Python-based system that:
- Creates profiles for family members using facial embeddings
- Identifies individuals in real-time through camera feeds
- Integrates with LangChain for conversational AI capabilities
- Securely stores profile data and facial recognition logs

**Tech Stack**: Python, DeepFace, LangChain, Google Vertex AI

### Backend Server

A Node.js REST API server that:
- Authenticates users and manages permissions
- Stores and retrieves recognition events, alerts, and logs
- Manages safe zones and location tracking
- Coordinates with external services and agents

**Tech Stack**: Node.js, Express, MongoDB, JWT, WebSockets

### Mobile Application (LumosCare)

A cross-platform mobile app built with Expo that:
- Provides a user-friendly interface for family members and caregivers
- Displays alerts, recognition events, and location information
- Allows management of user profiles and safe zones
- Sends notifications for important events

**Tech Stack**: React Native, Expo, TypeScript

### Intelligent Agents

Autonomous services that:
- Track location and detect anomalies
- Send notifications for alerts
- Make automated phone calls when necessary
- Follow predefined protocols for different scenarios

**Tech Stack**: Python, Universal Agent Framework

## Installation and Setup

### Prerequisites

- Node.js v14 or higher
- Python 3.7 or higher
- MongoDB instance
- Google API key for LangChain integration

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

### Facial Recognition Setup

```bash
cd facial-recognition
pip install -r requirements.txt
python face_recognition.py
```

### Mobile App Setup

```bash
cd lumoscare
npm install
npx expo start
```

## Architecture

The Lumos platform uses a distributed architecture with several services communicating via APIs:

1. The facial recognition system processes camera feeds and identifies individuals
2. The backend server stores recognition events and coordinates responses
3. Intelligent agents monitor conditions and trigger notifications
4. The mobile app provides a user interface for monitoring and configuration

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the [MIT License](LICENSE).

