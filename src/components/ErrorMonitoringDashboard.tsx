
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { errorTracker } from '@/utils/errorTracking';
import { AlertTriangle, Bug, Shield, Network, User, Zap } from 'lucide-react';

const ErrorMonitoringDashboard = () => {
  const [sessionSummary, setSessionSummary] = useState(errorTracker.getSessionSummary());
  const [errors, setErrors] = useState(errorTracker.getErrors({ limit: 10 }));
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSessionSummary(errorTracker.getSessionSummary());
      setErrors(errorTracker.getErrors({ limit: 10 }));
      // Security events would need to be implemented separately
      setSecurityEvents([]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'error': return 'bg-orange-500';
      case 'warning': return 'bg-yellow-500';
      case 'info': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'authentication': return <Shield className="w-4 h-4" />;
      case 'api': return <Zap className="w-4 h-4" />;
      case 'network': return <Network className="w-4 h-4" />;
      case 'ui': return <User className="w-4 h-4" />;
      default: return <Bug className="w-4 h-4" />;
    }
  };

  const clearAllData = () => {
    errorTracker.clearErrors();
    setErrors([]);
    setSecurityEvents([]);
    setSessionSummary(errorTracker.getSessionSummary());
  };

  const exportDiagnostics = () => {
    const diagnostics = {
      sessionSummary,
      errors: errorTracker.getErrors(),
      securityEvents,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(diagnostics, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-diagnostics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Error Monitoring Dashboard</h2>
        <div className="space-x-2">
          <Button onClick={exportDiagnostics} variant="outline" size="sm">
            Export Diagnostics
          </Button>
          <Button onClick={clearAllData} variant="outline" size="sm">
            Clear Data
          </Button>
        </div>
      </div>

      {/* Session Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Session Summary</CardTitle>
          <CardDescription>Overview of errors and environment for this session</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{sessionSummary.totalErrors}</div>
              <div className="text-sm text-muted-foreground">Total Errors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{sessionSummary.errorsBySeverity.critical}</div>
              <div className="text-sm text-muted-foreground">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{sessionSummary.errorsBySeverity.high}</div>
              <div className="text-sm text-muted-foreground">High</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">{sessionSummary.errorsBySeverity.medium}</div>
              <div className="text-sm text-muted-foreground">Medium</div>
            </div>
          </div>

          <div className="space-y-2">
            <div><strong>Browser:</strong> {sessionSummary.userEnvironment.browser.name} {sessionSummary.userEnvironment.browser.version}</div>
            <div><strong>Connection:</strong> {sessionSummary.userEnvironment.connection}</div>
            <div><strong>Online:</strong> {sessionSummary.userEnvironment.online ? 'Yes' : 'No'}</div>
            <div><strong>Session ID:</strong> <code className="text-xs">{sessionSummary.sessionId}</code></div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Errors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Recent Errors
          </CardTitle>
          <CardDescription>Last 10 errors in this session</CardDescription>
        </CardHeader>
        <CardContent>
          {errors.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No errors recorded this session</p>
          ) : (
            <div className="space-y-3">
              {errors.map((error) => (
                <div key={error.id} className="border rounded p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(error.category)}
                      <span className="font-medium">{error.message}</span>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">{error.category}</Badge>
                      <Badge className={getSeverityColor(error.severity)}>{error.severity}</Badge>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(error.context.timestamp).toLocaleString()}
                  </div>
                  {error.stack && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground">Stack trace</summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Events
          </CardTitle>
          <CardDescription>Security-related events in the last hour</CardDescription>
        </CardHeader>
        <CardContent>
          {securityEvents.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No security events recorded</p>
          ) : (
            <div className="space-y-2">
              {securityEvents.map((event, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <span className="font-medium">{event.type}</span>
                    <span className="text-muted-foreground ml-2">{event.message}</span>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">{event.level}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorMonitoringDashboard;
