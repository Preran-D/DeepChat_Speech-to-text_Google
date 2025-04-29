# Deep Chat Speech to Text with Google API

A web application that integrates Google Cloud Speech-to-Text for live audio transcription, featuring recording controls and send text to deepchat messages functionality.

##  Features

- 🎤 One-click speech recording with visual feedback
- 🔍 Real-time transcription using Google's Speech-to-Text API
- 📋 Send transcribed text directly to deep chat message component

##  Prerequisites

- Configure a Google Cloud account with Speech-to-Text authentication enabled and download the authentication file to the src file.
- Modern browser with microphone access
  
##  Quick Setup

### 1. Clone the repository
```bash
git clone https://github.com/Preran-D/DeepChat_SpeechToText_Google.git
cd DeepChat_SpeechToText_Google
```

### 2. Backend Configuration

```bash
cd server
npm install
npm start
```

Place your Google service account JSON file in server
Rename it to google-credentials.json or update the path in code


### 3. Frontend Setup

```bash
cd ../client
npm install
npm run dev
```
![image](https://github.com/user-attachments/assets/7b751adc-1120-4984-8159-233034f9b6ac)
