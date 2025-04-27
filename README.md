# LumosCare - Memory Assistance System

**Tagline**: *Bringing light back to fading memories*

---

## Project Overview

**LumosCare** is an AI-powered memory assistance platform designed to support individuals with Alzheimer's and memory-related conditions. By combining **Snapchat Spectacles**, **autonomous agents**, **AR overlays**, and **location tracking**, LumosCare offers real-time memory cues and enhances safety while respecting privacy.

It passively recognizes faces and surroundings, provides contextual reminders, alerts caregivers if patients wander outside safe zones, and preserves important daily reflections — promoting independence and improving quality of life.

---

## Core Components

### 1. **AR Experience (Patient Side)**

- Built on **Snapchat Lens Studio** / **Snapchat Spectacles**
- Real-time **face recognition** and **location tracking**
- **AR overlays** for memory cues (names, relationships, reminders)
- **Voice journaling** powered by Gemini AI
- **Offline support** through local caching

**Tech Stack**: Lens Studio, TensorFlow.js, Three.js, JavaScript, TypeScript

---

### 2. **AI and Intelligent Agent System**

- **Fetch.ai uAgents** for autonomy and coordination
- **Gemini 2.5 API** for memory prompts, decision-making, and voice journaling
- Specialized Agents:
  - **Face Recognition Agent**: Identifies faces using stored profiles
  - **Safety Agent**: Monitors GPS location and triggers alerts
  - **Notification Agent**: Manages communication with caregivers
  - **Healthcare Agent (DAIN)**: Provides healthcare insights and response orchestration

**Tech Stack**: Python, Universal Agent Framework (Fetch.ai), Google Gemini 2.5

---

### 3. **Backend Infrastructure**

- **Node.js + Express** API server
- **MongoDB Atlas** for data storage
- **Cloudflare Workers** for serverless processing
- **Firebase Authentication** for user management
- **WebSockets** for real-time updates

**Data Structures**:
- User profiles
- Recognized people profiles
- Safe zones and geofences
- Journals and memory logs

**Tech Stack**: Node.js, Express, MongoDB Atlas, Cloudflare Workers, Firebase

---

### 4. **Mobile Application - LumosCare (Caretaker App)**

- **React Native** app for caregivers
- Manage patient profiles, safe zones, and reminders
- View memory journal summaries
- Receive safety alerts in real-time
- Natural language queries to interact with agents

**Tech Stack**: React Native, Expo, TypeScript, Redux, React Navigation

---

## Key Features

- **Face Recognition and Memory Overlay**: Displays names, relationships, and memory cues when familiar faces are detected.
- **Contextual Reminders**: Non-intrusive time- and location-based prompts for medication, appointments, and daily activities.
- **Safe Zone Monitoring**: Alerts triggered if the patient exits predefined safe zones using Melissa APIs.
- **Voice Journaling**: Daily reflections captured through voice and summarized using Gemini AI.
- **Caregiver Connectivity**: Secure dashboard to manage profiles, monitor activities, and receive alerts.

---

## System Architecture

The LumosCare system follows a distributed, modular architecture:

1. **AR Wearable** (Spectacles): Captures real-time data
2. **Face Recognition Agent**: Identifies faces and context
3. **Safety Agent**: Monitors GPS coordinates
4. **Notification Agent**: Sends alerts and updates
5. **Healthcare Agent**: Provides decision-making support
6. **Backend**: Manages profiles, safe zones, and alerts
7. **Caretaker Mobile App**: User interface for caregivers

### Visual Diagrams
- **High-Level Architecture Diagram** ![Architecture Diagram](path-to-diagram)
- **Use Case Diagram** ![Use Case Diagram](path-to-diagram)

---

## Installation and Setup

### Prerequisites

- Node.js v14 or higher
- Python 3.7 or higher
- MongoDB Atlas cluster
- Google API key for Gemini access
- Firebase Project (for Authentication)

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

---

## Privacy and Ethical Considerations

- **Closed Ecosystem**: Only registered family members are recognized.
- **Consent-Based Model**: Recognition requires explicit consent.
- **On-Device Processing**: Sensitive data stays local when possible.
- **Dignified Experience**: Designed to assist, not surveil.

---

## Contributing

We welcome contributions to improve LumosCare further.  
Please open an Issue or submit a Pull Request!

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Future Roadmap

- **Medication Verification**
- **Behavior Prediction Models**
- **Integration with Healthcare Providers**
- **Expanded Device Support (Other AR glasses)**

