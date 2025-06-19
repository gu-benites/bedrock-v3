/**
 * Performance Test Runner Component
 * UI for running and displaying performance regression tests
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  performanceRegressionTester, 
  type PerformanceTestResult 
} from '@/lib/testing/performance-regression-tester';
import { 
  createRecipePerformanceTestSuite, 
  runQuickPerformanceCheck 
} from '@/lib/testing/create-recipe-performance-tests';
import { cn } from '@/lib/utils';

interface PerformanceTestRunnerProps {
  isVisible?: boolean;
  onToggle?: (visible: boolean) => void;
  className?: string;
}

export const PerformanceTestRunner: React.FC<PerformanceTestRunnerProps> = ({
  isVisible = false,
  onToggle,
  className
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<PerformanceTestResult[]>([]);
  const [quickCheckResult, setQuickCheckResult] = useState<any>(null);
  const [selectedTest, setSelectedTest] = useState<string>('');

  // Load existing test results
  useEffect(() => {
    if (isVisible) {
      const allResults = Array.from(performanceRegressionTester.getAllTestResults().values()).flat();
      setTestResults(allResults.slice(-10)); // Show last 10 results
    }
  }, [isVisible]);

  const handleRunFullSuite = async () => {
    setIsRunning(true);
    try {
      const results = await performanceRegressionTester.runTestSuite(createRecipePerformanceTestSuite);
      setTestResults(results);
      console.log('📊 Performance test suite completed:', results);
    } catch (error) {
      console.error('❌ Performance test suite failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleQuickCheck = async () => {
    setIsRunning(true);
    try {
      const result = await runQuickPerformanceCheck();
      setQuickCheckResult(result);
      console.log('⚡ Quick performance check:', result);
    } catch (error) {
      console.error('❌ Quick performance check failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleGenerateReport = () => {
    const report = performanceRegressionTester.generateReport();
    console.log('📈 Performance Report:', report);
    
    // Copy to clipboard
    navigator.clipboard?.writeText(JSON.stringify(report, null, 2));
  };

  const handleExportResults = () => {
    const data = performanceRegressionTester.exportResults();
    navigator.clipboard?.writeText(data);
    console.log('📋 Test results exported to clipboard');
  };

  const handleClearResults = () => {
    performanceRegressionTester.clearResults();
    setTestResults([]);
    setQuickCheckResult(null);
  };

  const getTestStatusIcon = (result: PerformanceTestResult) => {
    if (result.passed) return '✅';
    const hasErrors = result.violations.some(v => v.severity === 'error');
    return hasErrors ? '❌' : '⚠️';
  };

  const getTestStatusColor = (result: PerformanceTestResult) => {
    if (result.passed) return 'text-green-600 bg-green-50';
    const hasErrors = result.violations.some(v => v.severity === 'error');
    return hasErrors ? 'text-red-600 bg-red-50' : 'text-yellow-600 bg-yellow-50';
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => onToggle?.(true)}
        className="fixed bottom-68 right-4 z-50 bg-purple-600 text-white p-2 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
        title="Show Performance Test Runner"
      >
        🧪
      </button>
    );
  }

  return (
    <div className={cn(
      "fixed bottom-68 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-w-md",
      "dark:bg-gray-800 dark:border-gray-700",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Performance Tests</span>
          {isRunning && <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />}
        </div>
        <button
          onClick={() => onToggle?.(false)}
          className="p-1 rounded text-xs bg-gray-100 text-gray-600 hover:bg-gray-200"
        >
          ✕
        </button>
      </div>

      {/* Quick Check Result */}
      {quickCheckResult && (
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className={cn(
            "p-2 rounded text-xs",
            quickCheckResult.passed ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          )}>
            <div className="font-medium">{quickCheckResult.summary}</div>
            {quickCheckResult.issues.length > 0 && (
              <div className="mt-1 space-y-1">
                {quickCheckResult.issues.map((issue: string, index: number) => (
                  <div key={index} className="text-xs">• {issue}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="p-3 space-y-2">
        <div className="flex space-x-2">
          <button
            onClick={handleQuickCheck}
            disabled={isRunning}
            className="flex-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 disabled:opacity-50"
          >
            Quick Check
          </button>
          <button
            onClick={handleRunFullSuite}
            disabled={isRunning}
            className="flex-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 disabled:opacity-50"
          >
            {isRunning ? 'Running...' : 'Full Suite'}
          </button>
        </div>

        {testResults.length > 0 && (
          <>
            <select
              value={selectedTest}
              onChange={(e) => setSelectedTest(e.target.value)}
              className="w-full text-xs border rounded px-2 py-1"
            >
              <option value="">All test results...</option>
              {testResults.map((result, index) => (
                <option key={`${result.testId}-${index}`} value={result.testId}>
                  {result.testName} ({new Date(result.timestamp).toLocaleTimeString()})
                </option>
              ))}
            </select>

            <div className="flex space-x-2">
              <button
                onClick={handleGenerateReport}
                className="flex-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
              >
                Report
              </button>
              <button
                onClick={handleExportResults}
                className="flex-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
              >
                Export
              </button>
            </div>
          </>
        )}
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          <div className="p-3">
            <h4 className="text-sm font-medium mb-2">Recent Test Results</h4>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {testResults
                .filter(result => !selectedTest || result.testId === selectedTest)
                .slice(-5)
                .reverse()
                .map((result, index) => (
                  <div
                    key={`${result.testId}-${index}`}
                    className={cn(
                      "p-2 rounded text-xs border",
                      getTestStatusColor(result)
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium flex items-center">
                        <span className="mr-1">{getTestStatusIcon(result)}</span>
                        {result.testName}
                      </span>
                      <span className="text-xs opacity-75">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className="text-xs opacity-75">
                      Duration: {result.duration.toFixed(2)}ms
                    </div>

                    {result.violations.length > 0 && (
                      <div className="mt-1 space-y-1">
                        {result.violations.slice(0, 2).map((violation, vIndex) => (
                          <div key={vIndex} className="text-xs opacity-75">
                            ⚠️ {violation.metric}: {violation.actual} > {violation.threshold}
                          </div>
                        ))}
                        {result.violations.length > 2 && (
                          <div className="text-xs opacity-75">
                            +{result.violations.length - 2} more issues
                          </div>
                        )}
                      </div>
                    )}

                    {Object.keys(result.metrics).length > 0 && (
                      <div className="mt-1 text-xs opacity-75">
                        Metrics: {Object.entries(result.metrics)
                          .slice(0, 2)
                          .map(([key, value]) => `${key}: ${typeof value === 'number' ? value.toFixed(1) : value}`)
                          .join(', ')}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-3">
            <button
              onClick={handleClearResults}
              className="w-full text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
            >
              Clear All Results
            </button>
          </div>
        </div>
      )}

      {/* Test Suite Info */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3">
        <div className="text-xs text-gray-600 dark:text-gray-400">
          <div>Suite: {createRecipePerformanceTestSuite.suiteName}</div>
          <div>Tests: {createRecipePerformanceTestSuite.tests.length}</div>
          <div>Results: {testResults.length}</div>
        </div>
      </div>
    </div>
  );
};

/**
 * Performance Test Runner Provider
 */
export const PerformanceTestRunnerProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Keyboard shortcut to toggle test runner
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'U') {
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
        <PerformanceTestRunner 
          isVisible={isVisible} 
          onToggle={setIsVisible}
        />
      )}
    </>
  );
};
