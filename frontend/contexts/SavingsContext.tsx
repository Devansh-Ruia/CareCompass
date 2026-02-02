'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SavingsEvent, SavingsStats } from '../components/SavingsTracker';

interface SavingsContextType {
  savingsEvents: SavingsEvent[];
  totalSavings: number;
  savingsByCategory: Record<string, number>;
  estimatedTimeSaved: number;
  addSavingsEvent: (event: Omit<SavingsEvent, 'id' | 'date'>) => void;
  removeSavingsEvent: (id: string) => void;
  updateSavingsEvent: (id: string, event: Partial<SavingsEvent>) => void;
  exportSavingsData: () => string;
  importSavingsData: (data: string) => void;
  clearAllSavings: () => void;
  getSavingsStats: () => SavingsStats;
}

const SavingsContext = createContext<SavingsContextType | undefined>(undefined);

export function useSavings() {
  const context = useContext(SavingsContext);
  if (context === undefined) {
    throw new Error('useSavings must be used within a SavingsProvider');
  }
  return context;
}

interface SavingsProviderProps {
  children: React.ReactNode;
}

export function SavingsProvider({ children }: SavingsProviderProps) {
  const [savingsEvents, setSavingsEvents] = useState<SavingsEvent[]>([]);

  // Load savings from localStorage on mount
  useEffect(() => {
    try {
      const savedSavings = localStorage.getItem('medfin-savings');
      if (savedSavings) {
        const parsed = JSON.parse(savedSavings);
        setSavingsEvents(parsed);
      }
    } catch (error) {
      console.error('Error loading savings data:', error);
    }
  }, []);

  // Save savings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('medfin-savings', JSON.stringify(savingsEvents));
    } catch (error) {
      console.error('Error saving savings data:', error);
    }
  }, [savingsEvents]);

  // Calculate derived values
  const totalSavings = savingsEvents.reduce((sum, event) => sum + event.amountSaved, 0);
  
  const savingsByCategory = savingsEvents.reduce((acc, event) => {
    acc[event.category] = (acc[event.category] || 0) + event.amountSaved;
    return acc;
  }, {} as Record<string, number>);

  // Estimate time saved (rough calculation: 1 hour per $100 saved)
  const estimatedTimeSaved = Math.round(totalSavings / 100);

  const addSavingsEvent = (eventData: Omit<SavingsEvent, 'id' | 'date'>) => {
    const newEvent: SavingsEvent = {
      ...eventData,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    };
    setSavingsEvents(prev => [...prev, newEvent]);
  };

  const removeSavingsEvent = (id: string) => {
    setSavingsEvents(prev => prev.filter(event => event.id !== id));
  };

  const updateSavingsEvent = (id: string, eventData: Partial<SavingsEvent>) => {
    setSavingsEvents(prev => 
      prev.map(event => 
        event.id === id ? { ...event, ...eventData } : event
      )
    );
  };

  const exportSavingsData = (): string => {
    const data = {
      savingsEvents,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    return JSON.stringify(data, null, 2);
  };

  const importSavingsData = (data: string) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.savingsEvents && Array.isArray(parsed.savingsEvents)) {
        setSavingsEvents(parsed.savingsEvents);
      }
    } catch (error) {
      throw new Error('Invalid savings data format');
    }
  };

  const clearAllSavings = () => {
    setSavingsEvents([]);
  };

  const getSavingsStats = (): SavingsStats => ({
    totalSaved: totalSavings,
    savingsByCategory,
    savingsHistory: savingsEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    estimatedTimeSaved
  });

  const value: SavingsContextType = {
    savingsEvents,
    totalSavings,
    savingsByCategory,
    estimatedTimeSaved,
    addSavingsEvent,
    removeSavingsEvent,
    updateSavingsEvent,
    exportSavingsData,
    importSavingsData,
    clearAllSavings,
    getSavingsStats
  };

  return (
    <SavingsContext.Provider value={value}>
      {children}
    </SavingsContext.Provider>
  );
}
