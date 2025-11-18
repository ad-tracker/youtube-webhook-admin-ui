import { useState } from 'react';
import { useAPI } from '../contexts/APIContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';

/**
 * Form for configuring API credentials
 */
export function APIConfigForm() {
  const { configure } = useAPI();
  const [baseURL, setBaseURL] = useState('http://localhost:8000');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!baseURL.trim()) {
      setError('API Base URL is required');
      return;
    }

    if (!apiKey.trim()) {
      setError('API Key is required');
      return;
    }

    // Validate URL format
    try {
      const url = new URL(baseURL);
      // Ensure URL has a valid protocol (http or https)
      if (!url.protocol.startsWith('http')) {
        setError('Please enter a valid URL');
        return;
      }
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    configure({
      baseURL: baseURL.trim(),
      apiKey: apiKey.trim(),
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            YouTube Webhook Admin
          </CardTitle>
          <CardDescription>
            Enter your API credentials to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="baseURL">API Base URL</Label>
              <Input
                id="baseURL"
                type="url"
                placeholder="http://localhost:8000"
                value={baseURL}
                onChange={(e) => setBaseURL(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The base URL of your YouTube Webhook API
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Your API key for authentication (stored securely in session)
              </p>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full">
              Connect to API
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
