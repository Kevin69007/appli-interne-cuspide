
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Bold, Italic, Strikethrough, Heading1, Heading2, Heading3, Link, Image } from "lucide-react";
import PetLinkButton from "./PetLinkButton";
import PollCreator from "./PollCreator";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

const RichTextEditor = ({ value, onChange, placeholder, rows = 4 }: RichTextEditorProps) => {
  const [textareaRef, setTextareaRef] = useState<HTMLTextAreaElement | null>(null);

  const insertFormatting = (startTag: string, endTag: string) => {
    if (!textareaRef) return;

    const start = textareaRef.selectionStart;
    const end = textareaRef.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newValue = 
      value.substring(0, start) + 
      startTag + selectedText + endTag + 
      value.substring(end);
    
    onChange(newValue);
    
    // Set cursor position after formatting
    setTimeout(() => {
      if (textareaRef) {
        const newCursorPos = selectedText ? end + startTag.length + endTag.length : start + startTag.length;
        textareaRef.focus();
        textareaRef.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleInsertPetLink = (petId: string) => {
    const petEmbed = `[pet-profile]${petId}[/pet-profile]`;
    
    if (!textareaRef) {
      onChange(value + petEmbed);
      return;
    }

    const start = textareaRef.selectionStart;
    const end = textareaRef.selectionEnd;
    
    const newValue = 
      value.substring(0, start) + 
      petEmbed + 
      value.substring(end);
    
    onChange(newValue);
    
    // Set cursor position after the embed
    setTimeout(() => {
      if (textareaRef) {
        const newCursorPos = start + petEmbed.length;
        textareaRef.focus();
        textareaRef.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleInsertPoll = (pollMarkup: string) => {
    if (!textareaRef) {
      onChange(value + pollMarkup);
      return;
    }

    const start = textareaRef.selectionStart;
    const end = textareaRef.selectionEnd;
    
    const newValue = 
      value.substring(0, start) + 
      pollMarkup + 
      value.substring(end);
    
    onChange(newValue);
    
    // Set cursor position after the poll
    setTimeout(() => {
      if (textareaRef) {
        const newCursorPos = start + pollMarkup.length;
        textareaRef.focus();
        textareaRef.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleBold = () => insertFormatting("*", "*");
  const handleItalic = () => insertFormatting("_", "_");
  const handleStrikethrough = () => insertFormatting("-", "-");
  const handleH1 = () => insertFormatting("h1. ", "");
  const handleH2 = () => insertFormatting("h2. ", "");
  const handleH3 = () => insertFormatting("h3. ", "");
  const handleLink = () => insertFormatting('"', '":');
  const handleImagePlaceholder = () => insertFormatting("!", "!");

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleBold} className="h-8 px-2">
          <Bold className="w-4 h-4" />
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={handleItalic} className="h-8 px-2">
          <Italic className="w-4 h-4" />
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={handleStrikethrough} className="h-8 px-2">
          <Strikethrough className="w-4 h-4" />
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={handleH1} className="h-8 px-2">
          <Heading1 className="w-4 h-4" />
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={handleH2} className="h-8 px-2">
          <Heading2 className="w-4 h-4" />
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={handleH3} className="h-8 px-2">
          <Heading3 className="w-4 h-4" />
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={handleLink} className="h-8 px-2">
          <Link className="w-4 h-4" />
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={handleImagePlaceholder} 
          className="h-8 px-2"
          title="Insert image placeholder (!url!)"
        >
          <Image className="w-4 h-4" />
        </Button>
        <PollCreator onInsertPoll={handleInsertPoll} />
        <PetLinkButton onInsertPetLink={handleInsertPetLink} />
      </div>
      <Textarea
        ref={setTextareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="font-mono text-sm"
      />
      <div className="text-xs text-muted-foreground space-y-1">
        <div>Formatting: *bold* _italic_ -strikethrough-</div>
        <div>Links: "link name":url • Headings: h1. Title, h2. Subtitle, h3. Small heading</div>
        <div>Images: Use the image button for !imageurl! placeholder</div>
        <div>Pet Links: Use the heart button to insert pet profiles • Polls: [poll][/poll]</div>
      </div>
    </div>
  );
};

export default RichTextEditor;
