import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Users, User, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface NotificationPreset {
  title: string;
  body: string;
  url?: string;
}

const NOTIFICATION_PRESETS: NotificationPreset[] = [
  {
    title: "⚡ Race Starting Soon!",
    body: "Your registered race starts in 30 minutes. Good luck!",
    url: "/races"
  },
  {
    title: "🏁 Race Results Available",
    body: "Championship results have been updated. Check your standings!",
    url: "/championships"
  },
  {
    title: "📅 New Race Added",
    body: "A new race has been added to the calendar. Register now!",
    url: "/races"
  },
  {
    title: "💬 Important Announcement",
    body: "Check the latest updates in the club chat.",
    url: "/chat"
  },
  {
    title: "🔥 Weekend Race Alert",
    body: "Don't forget about this weekend's championship round!",
    url: "/races"
  }
];

export function AdminPushNotifications() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sendNotificationMutation = useMutation({
    mutationFn: async (data: { title: string; body: string; url?: string }) => {
      return apiRequest('/api/push/send', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'admin' // Simple auth for now
        }
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Notifications Sent!",
        description: `Sent to ${data.sent} members. ${data.failed > 0 ? `${data.failed} failed.` : ''}`,
      });
      // Clear form
      setTitle("");
      setBody("");
      setUrl("");
      setSelectedPreset(null);
    },
    onError: (error: any) => {
      toast({
        title: "Send Failed",
        description: error.message || "Failed to send push notifications",
        variant: "destructive"
      });
    }
  });

  const usePreset = (index: number) => {
    const preset = NOTIFICATION_PRESETS[index];
    setTitle(preset.title);
    setBody(preset.body);
    setUrl(preset.url || "");
    setSelectedPreset(index);
  };

  const handleSend = () => {
    if (!title.trim() || !body.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both title and message",
        variant: "destructive"
      });
      return;
    }

    sendNotificationMutation.mutate({
      title: title.trim(),
      body: body.trim(),
      url: url.trim() || undefined
    });
  };

  const isFormValid = title.trim() && body.trim();

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Send className="h-5 w-5 text-orange-500" />
            Send Push Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Presets */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Quick Message Templates
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {NOTIFICATION_PRESETS.map((preset, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => usePreset(index)}
                  className={`text-left justify-start h-auto p-3 ${
                    selectedPreset === index 
                      ? 'border-orange-500 bg-orange-500/10' 
                      : 'border-gray-600 hover:bg-gray-700'
                  }`}
                  data-testid={`button-preset-${index}`}
                >
                  <div>
                    <div className="font-medium text-sm">{preset.title}</div>
                    <div className="text-xs text-gray-400 mt-1">{preset.body}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Message Form */}
          <div className="space-y-4 pt-4 border-t border-gray-700">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Notification Title *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., ⚡ Race Starting Soon!"
                className="bg-gray-700 border-gray-600 text-white"
                maxLength={100}
                data-testid="input-notification-title"
              />
              <div className="text-xs text-gray-400 mt-1">{title.length}/100 characters</div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Message Content *
              </label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Enter your message to all racing club members..."
                rows={3}
                className="bg-gray-700 border-gray-600 text-white resize-none"
                maxLength={300}
                data-testid="input-notification-body"
              />
              <div className="text-xs text-gray-400 mt-1">{body.length}/300 characters</div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Link (Optional)
              </label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="/races or /chat (opens when notification clicked)"
                className="bg-gray-700 border-gray-600 text-white"
                data-testid="input-notification-url"
              />
            </div>

            {/* Preview */}
            {isFormValid && (
              <div className="bg-gray-900 p-4 rounded-lg border border-gray-600">
                <div className="text-sm text-gray-400 mb-2">Preview:</div>
                <div className="bg-white text-black p-3 rounded shadow-lg max-w-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center flex-shrink-0">
                      <div className="w-4 h-4 bg-white rounded"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-900 truncate">{title}</div>
                      <div className="text-sm text-gray-700 mt-1">{body}</div>
                      <div className="text-xs text-gray-500 mt-1">The Grid Racing Club</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Send Button */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Users className="h-4 w-4" />
                <span>Will be sent to all club members with notifications enabled</span>
              </div>
              <Button
                onClick={handleSend}
                disabled={!isFormValid || sendNotificationMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700 text-white"
                data-testid="button-send-notification"
              >
                {sendNotificationMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Send to All Members
                  </div>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Tips */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-300">
                <strong>Best Practices:</strong> Use emojis in titles for visual appeal. Keep messages under 100 characters for mobile visibility.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-300">
                <strong>Timing:</strong> Send race reminders 30-60 minutes before start time for best attendance.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-300">
                <strong>Members:</strong> Only members who have enabled notifications will receive these alerts.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}