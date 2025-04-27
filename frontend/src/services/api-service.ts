import axios from 'axios';

const API_BASE_URL = 'https://final-year-project-56d5.onrender.com/api/v1';

// Event service functions
export const fetchEvents = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value.toString());
    });

    const response = await axios.get(`${API_BASE_URL}/events?${queryParams.toString()}`);

    console.log('ALL Fetched events:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

export const fetchEventById = async (eventId: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/events/${eventId}`);
    console.log('Event data: from our service- api', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching event ${eventId}:`, error);
    throw error;
  }
};

export const deleteEvent = async (eventId: string) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/events/${eventId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting event ${eventId}:`, error);
    throw error;
  }
};

// Session service functions
export const fetchSessionsByEventId = async (eventId: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/sessions/event/${eventId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching sessions for event ${eventId}:`, error);
    throw error;
  }
};

export const fetchSessionById = async (sessionId: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/sessions/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching session ${sessionId}:`, error);
    throw error;
  }
};

export const deleteSession = async (sessionId: string) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/sessions/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting session ${sessionId}:`, error);
    throw error;
  }
};

export const updateSessionLivestream = async (sessionId: string, isLiveStreamed: boolean, streamUrl?: string) => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/sessions/${sessionId}/livestream`, {
      isLiveStreamed,
      streamUrl
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating livestream for session ${sessionId}:`, error);
    throw error;
  }
};

export const registerForSession = async (sessionId: string) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/sessions/${sessionId}/register`);
    return response.data;
  } catch (error) {
    console.error(`Error registering for session ${sessionId}:`, error);
    throw error;
  }
};
