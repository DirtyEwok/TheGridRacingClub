import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Film, Search } from "lucide-react";

interface GifPickerProps {
  onGifSelect: (gifUrl: string) => void;
  disabled?: boolean;
}

// Popular racing and general GIFs - using a mix of racing terms and general reactions
const popularGifs = {
  "Racing": [
    {
      url: "https://media.giphy.com/media/3o6Zt9y2JCjc450T3q/giphy.gif",
      title: "Fast Car Racing"
    },
    {
      url: "https://media.giphy.com/media/xT0xeMA62E1XIlup68/giphy.gif", 
      title: "Checkered Flag"
    },
    {
      url: "https://media.giphy.com/media/26BRuo6sLetdllPAQ/giphy.gif",
      title: "Victory Celebration"
    },
    {
      url: "https://media.giphy.com/media/3o6ZsZKbgw4QVWEbzq/giphy.gif",
      title: "Speed Demon"
    },
    {
      url: "https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif",
      title: "Racing Wheel"
    },
    {
      url: "https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif",
      title: "Finish Line"
    }
  ],
  "Reactions": [
    {
      url: "https://media.giphy.com/media/3oz8xLd9DJq2l2VFtu/giphy.gif",
      title: "Thumbs Up"
    },
    {
      url: "https://media.giphy.com/media/1zSz5MVw4zKg0/giphy.gif",
      title: "Good Job"
    },
    {
      url: "https://media.giphy.com/media/26BRrSvJUa0crqw4E/giphy.gif",
      title: "Excited"
    },
    {
      url: "https://media.giphy.com/media/3ohzdIuqJoo8QdKlnW/giphy.gif",
      title: "Fire"
    },
    {
      url: "https://media.giphy.com/media/26AHPxxnSw1L9T1rW/giphy.gif",
      title: "Mind Blown"
    },
    {
      url: "https://media.giphy.com/media/l0MYryZTmQgvHI5TG/giphy.gif",
      title: "Perfect"
    }
  ],
  "Funny": [
    {
      url: "https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif",
      title: "LOL"
    },
    {
      url: "https://media.giphy.com/media/26BRrSvJUa0crqw4E/giphy.gif",
      title: "Clapping"
    },
    {
      url: "https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif",
      title: "Dancing"
    },
    {
      url: "https://media.giphy.com/media/3o6Zt4HU9uwXmXSAuI/giphy.gif",
      title: "Party Time"
    },
    {
      url: "https://media.giphy.com/media/26BRBKqUiq586bRVm/giphy.gif",
      title: "High Five"
    },
    {
      url: "https://media.giphy.com/media/26u4lOMA8JKSnL9Uk/giphy.gif",
      title: "Celebration"
    }
  ]
};

export function GifPicker({ onGifSelect, disabled = false }: GifPickerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("Racing");
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleGifClick = (gifUrl: string) => {
    onGifSelect(gifUrl);
    setIsOpen(false);
  };

  const getCurrentGifs = () => {
    if (searchQuery.trim()) {
      // Simple search - filter by title containing search term
      const allGifs = Object.values(popularGifs).flat();
      return allGifs.filter(gif => 
        gif.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return popularGifs[selectedCategory as keyof typeof popularGifs] || [];
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
          data-testid="button-gif-picker"
        >
          <Film className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 bg-gray-800 border-gray-600" side="top">
        <div className="p-3 border-b border-gray-600">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search GIFs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              data-testid="input-gif-search"
            />
          </div>
        </div>

        {!searchQuery.trim() && (
          <div className="border-b border-gray-600">
            <div className="flex overflow-x-auto p-2 space-x-1">
              {Object.keys(popularGifs).map((category) => (
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
        )}
        
        <ScrollArea className="h-64 p-3">
          <div className="grid grid-cols-2 gap-2">
            {getCurrentGifs().map((gif, index) => (
              <button
                key={`${gif.url}-${index}`}
                onClick={() => handleGifClick(gif.url)}
                className="group relative aspect-square bg-gray-700 rounded overflow-hidden hover:ring-2 hover:ring-racing-green transition-all"
                data-testid={`gif-${index}`}
              >
                <img
                  src={gif.url}
                  alt={gif.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-1 bg-gradient-to-t from-black to-transparent">
                  <p className="text-xs text-white truncate">{gif.title}</p>
                </div>
              </button>
            ))}
          </div>
          
          {getCurrentGifs().length === 0 && searchQuery.trim() && (
            <div className="text-center py-8 text-gray-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No GIFs found for "{searchQuery}"</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          )}
        </ScrollArea>
        
        <div className="p-2 border-t border-gray-600 text-xs text-gray-400">
          Click a GIF to add it to your message
        </div>
      </PopoverContent>
    </Popover>
  );
}