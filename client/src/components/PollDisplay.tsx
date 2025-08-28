import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Users, Clock } from "lucide-react";
import { type PollWithDetails } from "@shared/schema";
import { format } from "date-fns";

interface PollDisplayProps {
  poll: PollWithDetails;
  currentMemberId: string;
  onVote: (pollId: string, optionId: string) => Promise<void>;
}

export function PollDisplay({ poll, currentMemberId, onVote }: PollDisplayProps) {
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (optionId: string) => {
    setIsVoting(true);
    try {
      await onVote(poll.id, optionId);
    } finally {
      setIsVoting(false);
    }
  };

  const isExpired = poll.expiresAt && new Date() > new Date(poll.expiresAt);
  const canVote = poll.isActive && !isExpired && !poll.hasUserVoted;

  return (
    <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/50 my-3">
      {/* Poll Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
          <BarChart3 className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-blue-400 text-sm">Poll</span>
            <span className="text-xs text-gray-400">
              by {poll.creator.gamertag}
            </span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-500">
              {format(new Date(poll.createdAt), "HH:mm")}
            </span>
          </div>
          <h3 className="text-white font-medium text-base leading-tight">
            {poll.question}
          </h3>
        </div>
      </div>

      {/* Poll Options */}
      <div className="space-y-2 mb-4">
        {poll.options.map((option) => {
          const percentage = poll.totalVotes > 0 
            ? Math.round((option.voteCount / poll.totalVotes) * 100) 
            : 0;
          
          return (
            <div key={option.id} className="relative">
              {canVote ? (
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left h-auto p-3 hover:bg-gray-700 border border-gray-600"
                  onClick={() => handleVote(option.id)}
                  disabled={isVoting}
                  data-testid={`button-vote-option-${option.displayOrder}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-white">{option.text}</span>
                    <span className="text-gray-400 text-sm">
                      {option.voteCount} votes
                    </span>
                  </div>
                </Button>
              ) : (
                <div className="relative p-3 border border-gray-600 rounded-md bg-gray-700/30">
                  {/* Vote percentage bar */}
                  <div 
                    className="absolute inset-0 bg-blue-600/20 rounded-md transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-white">{option.text}</span>
                      {option.hasUserVoted && (
                        <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                          Your vote
                        </span>
                      )}
                    </div>
                    <div className="text-right text-sm">
                      <div className="text-blue-400 font-medium">{percentage}%</div>
                      <div className="text-gray-400">{option.voteCount} votes</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Poll Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {poll.totalVotes} total votes
          </span>
          {poll.expiresAt && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {isExpired 
                ? "Expired" 
                : `Expires ${format(new Date(poll.expiresAt), "MMM d, HH:mm")}`
              }
            </span>
          )}
        </div>
        <div className="text-right">
          {!poll.isActive && (
            <span className="text-red-400">Closed</span>
          )}
          {poll.hasUserVoted && poll.isActive && (
            <span className="text-green-400">You voted</span>
          )}
        </div>
      </div>
    </div>
  );
}