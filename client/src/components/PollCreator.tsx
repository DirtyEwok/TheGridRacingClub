import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, BarChart3 } from "lucide-react";
import { type ReactNode } from "react";

interface PollCreatorProps {
  chatRoomId: string;
  currentMemberId: string;
  onPollCreated?: () => void;
  children: ReactNode;
}

export function PollCreator({ chatRoomId, currentMemberId, onPollCreated, children }: PollCreatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim() || options.filter(opt => opt.trim()).length < 2) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/chat-rooms/${chatRoomId}/polls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.trim(),
          options: options.filter(opt => opt.trim()),
          createdBy: currentMemberId,
          allowMultipleVotes: false,
        }),
      });

      if (response.ok) {
        setQuestion("");
        setOptions(["", ""]);
        setIsOpen(false);
        if (onPollCreated) {
          onPollCreated();
        }
      }
    } catch (error) {
      console.error('Error creating poll:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setQuestion("");
    setOptions(["", ""]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-racing-green" />
            Create a Poll
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="poll-question">Question</Label>
            <Textarea
              id="poll-question"
              placeholder="What would you like to ask?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="bg-gray-900 border-gray-700 text-white resize-none"
              rows={2}
              maxLength={200}
              data-testid="input-poll-question"
            />
            <div className="text-xs text-gray-500 mt-1">
              {question.length}/200 characters
            </div>
          </div>

          <div>
            <Label>Options (2-6 required)</Label>
            <div className="space-y-2 mt-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    className="bg-gray-900 border-gray-700 text-white flex-1"
                    maxLength={100}
                    data-testid={`input-poll-option-${index + 1}`}
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(index)}
                      className="h-8 w-8 p-0 hover:bg-red-600 hover:text-white"
                      title="Remove option"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              
              {options.length < 6 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addOption}
                  className="h-8 text-blue-400 hover:bg-blue-600 hover:text-white"
                  data-testid="button-add-poll-option"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Option
                </Button>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!question.trim() || options.filter(opt => opt.trim()).length < 2 || isSubmitting}
              className="bg-racing-green hover:bg-racing-green/80"
              data-testid="button-create-poll"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Create Poll"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}