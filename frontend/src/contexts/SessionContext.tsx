import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Session {
  _id: string;
  eventId: string;
  title: string;
 
}

interface SessionContextType {
  currentSession: Session | null;
  setCurrentSession: (session: Session | null) => void;
  sessionList: Session[];
  setSessionList: (sessions: Session[]) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [sessionList, setSessionList] = useState<Session[]>([]);

  return (
    <SessionContext.Provider
      value={{
        currentSession,
        setCurrentSession,
        sessionList,
        setSessionList
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
