import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
}

// Racing and general emoji collections
const emojiCategories = {
  "Racing": [
    "🏁", "🏎️", "🏆", "🥇", "🥈", "🥉", "🎯", "⚡", "🔥", "💨", 
    "🚗", "🏃‍♂️", "🏃‍♀️", "⏱️", "📍", "🛣️", "🏃", "💪", "🎖️", "🏅"
  ],
  "Reactions": [
    "👍", "👎", "❤️", "😂", "😮", "😢", "😡", "👏", "🙌", "🔥",
    "💯", "⭐", "✅", "❌", "⚠️", "💥", "🎉", "🎊", "👌", "✨"
  ],
  "Faces": [
    "😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂",
    "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛",
    "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏"
  ],
  "Gestures": [
    "👍", "👎", "👌", "🤌", "🤏", "✌️", "🤞", "🫰", "🤟", "🤘",
    "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "🫵", "👋", "🤚"
  ],
  "Objects": [
    "🎮", "📱", "💻", "⌚", "📺", "🎧", "🎤", "🔊", "🔇", "📢",
    "📣", "📯", "🔔", "🔕", "🎵", "🎶", "🎼", "🎹", "🥁", "🎸"
  ]
};

export function EmojiPicker({ onEmojiSelect, disabled = false }: EmojiPickerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("Racing");
  const [isOpen, setIsOpen] = useState(false);

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="h-10 w-10 p-0 bg-gray-700 hover:bg-gray-600 text-white"
          data-testid="button-emoji-picker"
        >
          <Smile className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-gray-800 border-gray-600" side="top">
        <div className="border-b border-gray-600">
          <div className="flex overflow-x-auto p-2 space-x-1">
            {Object.keys(emojiCategories).map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={`text-xs whitespace-nowrap ${
                  selectedCategory === category 
                    ? "bg-gray-600 text-white" 
                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                }`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
        
        <ScrollArea className="h-48 p-2">
          <div className="grid grid-cols-8 gap-1">
            {emojiCategories[selectedCategory as keyof typeof emojiCategories]?.map((emoji, index) => (
              <Button
                key={`${emoji}-${index}`}
                variant="ghost"
                size="sm"
                onClick={() => handleEmojiClick(emoji)}
                className="h-8 w-8 p-0 text-lg hover:bg-gray-700 rounded"
                data-testid={`emoji-${emoji}`}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </ScrollArea>
        
        <div className="p-2 border-t border-gray-600 text-xs text-gray-400">
          Click an emoji to add it to your message
        </div>
      </PopoverContent>
    </Popover>
  );
}