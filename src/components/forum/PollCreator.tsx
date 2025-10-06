
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BarChart3, Plus, X } from "lucide-react";

interface PollCreatorProps {
  onInsertPoll: (pollMarkup: string) => void;
}

const PollCreator = ({ onInsertPoll }: PollCreatorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  const addOption = () => {
    setOptions([...options, ""]);
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

  const handleCreatePoll = () => {
    if (!question.trim()) return;
    
    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) return;

    const pollMarkup = `[poll]
${question}
${validOptions.map(opt => `- ${opt}`).join('\n')}
[/poll]`;

    onInsertPoll(pollMarkup);
    
    // Reset form
    setQuestion("");
    setOptions(["", ""]);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          className="h-8 px-2"
          title="Create poll"
        >
          <BarChart3 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Poll</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Question</label>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What's your poll question?"
              className="mt-1"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Options</label>
            <div className="space-y-2 mt-1">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeOption(index)}
                      className="px-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addOption}
              className="mt-2"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Option
            </Button>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreatePoll}
              disabled={!question.trim() || options.filter(opt => opt.trim()).length < 2}
            >
              Insert Poll
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PollCreator;
