/**
 * React Profiler Wrapper Component
 * Wraps components with React.Profiler for performance monitoring
 */

'use client';

import React, { Profiler, ProfilerOnRenderCallback } from 'react';
import { reactProfiler, type ProfilerData } from '@/lib/performance/react-devtools-profiler';

interface ReactProfilerWrapperProps {
  id: string;
  children: React.ReactNode;
  enabled?: boolean;
  onRender?: ProfilerOnRenderCallback;
  logSlowRenders?: boolean;
  slowRenderThreshold?: number;
}

/**
 * React Profiler Wrapper Component
 * Automatically integrates with our profiling system
 */
export const ReactProfilerWrapper: React.FC<ReactProfilerWrapperProps> = ({
  id,
  children,
  enabled = process.env.NODE_ENV === 'development',
  onRender,
  logSlowRenders = true,
  slowRenderThreshold = 16
}) => {
  const handleRender: ProfilerOnRenderCallback = function (
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime,
    ...rest
  ) {
    // Record data in our profiling system
    if (enabled) {
      const profilerData: ProfilerData = {
        id,
        phase,
        actualDuration,
        baseDuration,
        startTime,
        commitTime,
        interactions: new Set(rest)
      };

      reactProfiler.recordProfilerData(profilerData);

      // Log slow renders
      if (logSlowRenders && actualDuration > slowRenderThreshold) {
        console.warn(
          `🐌 Slow render detected: ${id} (${phase}) took ${actualDuration.toFixed(2)}ms`,
          {
            actualDuration,
            baseDuration,
            phase,
            interactions: rest
          }
        );
      }
    }

    // Call custom onRender callback if provided
    onRender?.(id, phase, actualDuration, baseDuration, startTime, commitTime);
  };

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <Profiler id={id} onRender={handleRender}>
      {children}
    </Profiler>
  );
};

/**
 * Higher-Order Component for automatic profiling
 */
export const withReactProfiler = <P extends object>(
  Component: React.ComponentType<P>,
  profileId?: string,
  options: {
    enabled?: boolean;
    logSlowRenders?: boolean;
    slowRenderThreshold?: number;
  } = {}
) => {
  const WrappedComponent = (props: P) => {
    const id = profileId || Component.displayName || Component.name || 'UnknownComponent';
    
    return (
      <ReactProfilerWrapper
        id={id}
        enabled={options.enabled}
        logSlowRenders={options.logSlowRenders}
        slowRenderThreshold={options.slowRenderThreshold}
      >
        <Component {...props} />
      </ReactProfilerWrapper>
    );
  };

  WrappedComponent.displayName = `withReactProfiler(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

/**
 * Hook for manual profiling control
 */
export const useReactProfiler = () => {
  const startProfiling = (sessionId?: string) => {
    return reactProfiler.startProfiling(sessionId);
  };

  const stopProfiling = () => {
    return reactProfiler.stopProfiling();
  };

  const getStatus = () => {
    return reactProfiler.getStatus();
  };

  const generateReport = (sessionId?: string) => {
    return reactProfiler.generateReport(sessionId);
  };

  const getAllSessions = () => {
    return reactProfiler.getAllSessions();
  };

  const exportSession = (sessionId: string) => {
    return reactProfiler.exportSession(sessionId);
  };

  const clearSessions = () => {
    reactProfiler.clearSessions();
  };

  const configure = (config: any) => {
    reactProfiler.configure(config);
  };

  return {
    startProfiling,
    stopProfiling,
    getStatus,
    generateReport,
    getAllSessions,
    exportSession,
    clearSessions,
    configure
  };
};

/**
 * Profiler Control Panel Component
 */
export const ProfilerControlPanel: React.FC<{
  isVisible?: boolean;
  onToggle?: (visible: boolean) => void;
}> = ({ isVisible = false, onToggle }) => {
  const {
    startProfiling,
    stopProfiling,
    getStatus,
    generateReport,
    getAllSessions,
    exportSession,
    clearSessions
  } = useReactProfiler();

  const [status, setStatus] = React.useState(getStatus());
  const [sessions, setSessions] = React.useState(getAllSessions());
  const [selectedSession, setSelectedSession] = React.useState<string>('');

  // Update status and sessions periodically
  React.useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setStatus(getStatus());
      setSessions(getAllSessions());
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible]);

  const handleStartProfiling = () => {
    const sessionId = startProfiling();
    setSelectedSession(sessionId);
  };

  const handleStopProfiling = () => {
    stopProfiling();
  };

  const handleGenerateReport = () => {
    const report = generateReport(selectedSession || undefined);
    if (report) {
      console.log('📊 React Profiler Report:', report);
    }
  };

  const handleExportSession = () => {
    if (selectedSession) {
      const data = exportSession(selectedSession);
      if (data) {
        navigator.clipboard?.writeText(data);
        console.log('📋 Session data copied to clipboard');
      }
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => onToggle?.(true)}
        className="fixed bottom-52 right-4 z-50 bg-green-600 text-white p-2 rounded-full shadow-lg hover:bg-green-700 transition-colors"
        title="Show React Profiler"
      >
        ⚛️
      </button>
    );
  }

  return (
    <div className="fixed bottom-52 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-w-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">React Profiler</span>
          <div className={`w-2 h-2 rounded-full ${status.isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
        </div>
        <button
          onClick={() => onToggle?.(false)}
          className="p-1 rounded text-xs bg-gray-100 text-gray-600 hover:bg-gray-200"
        >
          ✕
        </button>
      </div>

      {/* Status */}
      <div className="p-3 space-y-2">
        <div className="text-xs">
          <div className="flex justify-between">
            <span>Status:</span>
            <span className={status.isRecording ? 'text-red-600 font-medium' : 'text-gray-600'}>
              {status.isRecording ? 'Recording' : 'Stopped'}
            </span>
          </div>
          {status.currentSessionId && (
            <div className="flex justify-between">
              <span>Session:</span>
              <span className="font-mono text-xs">{status.currentSessionId.slice(-8)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Profiles:</span>
            <span>{status.recordedProfiles}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Sessions:</span>
            <span>{status.totalSessions}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="border-t border-gray-200 p-3 space-y-2">
        <div className="flex space-x-2">
          <button
            onClick={handleStartProfiling}
            disabled={status.isRecording}
            className="flex-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 disabled:opacity-50"
          >
            Start
          </button>
          <button
            onClick={handleStopProfiling}
            disabled={!status.isRecording}
            className="flex-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 disabled:opacity-50"
          >
            Stop
          </button>
        </div>

        {sessions.length > 0 && (
          <>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full text-xs border rounded px-2 py-1"
            >
              <option value="">Select session...</option>
              {sessions.map(session => (
                <option key={session.sessionId} value={session.sessionId}>
                  {session.sessionId} ({session.profiles.length} profiles)
                </option>
              ))}
            </select>

            <div className="flex space-x-2">
              <button
                onClick={handleGenerateReport}
                className="flex-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
              >
                Report
              </button>
              <button
                onClick={handleExportSession}
                disabled={!selectedSession}
                className="flex-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 disabled:opacity-50"
              >
                Export
              </button>
            </div>

            <button
              onClick={clearSessions}
              className="w-full text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
            >
              Clear All
            </button>
          </>
        )}
      </div>
    </div>
  );
};

/**
 * Profiler Control Panel Provider
 */
export const ProfilerControlPanelProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [isVisible, setIsVisible] = React.useState(false);

  // Keyboard shortcut to toggle profiler
  React.useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'R') {
        event.preventDefault();
        setIsVisible(!isVisible);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVisible]);

  return (
    <>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ProfilerControlPanel 
          isVisible={isVisible} 
          onToggle={setIsVisible}
        />
      )}
    </>
  );
};
