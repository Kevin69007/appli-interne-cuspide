import PetProfileEmbed from "./PetProfileEmbed";
import Poll from "./Poll";
import { useSearchParams } from "react-router-dom";

interface FormattedTextProps {
  content: string;
  className?: string;
}

interface TextSegment {
  type: 'text' | 'bold' | 'italic' | 'strikethrough' | 'heading' | 'link' | 'image' | 'break';
  content: string;
  level?: number;
  href?: string;
  alt?: string;
}

const FormattedTextSafe = ({ content, className = "" }: FormattedTextProps) => {
  const [searchParams] = useSearchParams();
  const currentPath = window.location.pathname;
  
  // Extract post ID from current URL path (assuming format /forums/{forumId}/{postId})
  const postId = currentPath.split('/').pop();

  const parseTextToSegments = (text: string): TextSegment[] => {
    const segments: TextSegment[] = [];
    let remaining = text;
    
    while (remaining.length > 0) {
      // Check for bold text (**text** or *text*)
      const boldMatch = remaining.match(/^(\*\*([^*]+?)\*\*|\*([^*]+?)\*)/);
      if (boldMatch) {
        segments.push({
          type: 'bold',
          content: boldMatch[2] || boldMatch[3]
        });
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // Check for italic text (__text__ or _text_)
      const italicMatch = remaining.match(/^(__([^_]+?)__|_([^_]+?)_)/);
      if (italicMatch) {
        segments.push({
          type: 'italic',
          content: italicMatch[2] || italicMatch[3]
        });
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }

      // Check for strikethrough text (-text-)
      const strikeMatch = remaining.match(/^-([^-\n]+?)-/);
      if (strikeMatch) {
        segments.push({
          type: 'strikethrough',
          content: strikeMatch[1]
        });
        remaining = remaining.slice(strikeMatch[0].length);
        continue;
      }

      // Check for headings (h1., h2., h3.)
      const headingMatch = remaining.match(/^h([123])\.\s*(.+?)(?=\n|$)/);
      if (headingMatch) {
        segments.push({
          type: 'heading',
          content: headingMatch[2],
          level: parseInt(headingMatch[1])
        });
        remaining = remaining.slice(headingMatch[0].length);
        continue;
      }

      // Check for images (!imageurl!)
      const imageMatch = remaining.match(/^!([^!\s]+\.(jpg|jpeg|png|gif|webp|svg))!/i);
      if (imageMatch) {
        segments.push({
          type: 'image',
          content: imageMatch[1],
          alt: 'Forum image'
        });
        remaining = remaining.slice(imageMatch[0].length);
        continue;
      }

      // Check for links ("link name":url) - Preserve exact URL
      const linkMatch = remaining.match(/^"([^"]+?)":(\S+)/);
      if (linkMatch) {
        const originalUrl = linkMatch[2].trim(); // Trim any whitespace
        
        console.log('Link found in markup:', { 
          linkText: linkMatch[1], 
          originalUrl: originalUrl,
          fullMatch: linkMatch[0] 
        });
        
        segments.push({
          type: 'link',
          content: linkMatch[1],
          href: originalUrl // Store the exact original URL
        });
        remaining = remaining.slice(linkMatch[0].length);
        continue;
      }

      // Check for line breaks
      if (remaining.startsWith('\n')) {
        segments.push({
          type: 'break',
          content: ''
        });
        remaining = remaining.slice(1);
        continue;
      }

      // Regular text - take until next special character
      const nextSpecial = remaining.search(/[\*_\-!\n]|h[123]\.|"/);
      if (nextSpecial === -1) {
        segments.push({
          type: 'text',
          content: remaining
        });
        break;
      } else if (nextSpecial > 0) {
        segments.push({
          type: 'text',
          content: remaining.slice(0, nextSpecial)
        });
        remaining = remaining.slice(nextSpecial);
      } else {
        // Single character that didn't match any pattern
        segments.push({
          type: 'text',
          content: remaining[0]
        });
        remaining = remaining.slice(1);
      }
    }

    return segments;
  };

  const renderSegment = (segment: TextSegment, index: number) => {
    switch (segment.type) {
      case 'bold':
        return <strong key={index}>{segment.content}</strong>;
      case 'italic':
        return <em key={index}>{segment.content}</em>;
      case 'strikethrough':
        return <del key={index}>{segment.content}</del>;
      case 'heading':
        const HeadingTag = `h${segment.level}` as keyof JSX.IntrinsicElements;
        const headingClass = segment.level === 1 ? 'text-2xl font-bold mb-2' :
                            segment.level === 2 ? 'text-xl font-bold mb-2' :
                            'text-lg font-bold mb-2';
        return <HeadingTag key={index} className={headingClass}>{segment.content}</HeadingTag>;
      case 'link':
        return (
          <span 
            key={index} 
            className="text-blue-600 hover:underline cursor-pointer" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              
              if (segment.href) {
                let targetUrl = segment.href;
                
                // Add https:// if the URL doesn't have a protocol and looks like a domain
                if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://') && 
                    !targetUrl.startsWith('mailto:') && !targetUrl.startsWith('tel:') &&
                    targetUrl.includes('.')) {
                  targetUrl = `https://${targetUrl}`;
                }
                
                console.log('Opening link in new tab:', targetUrl);
                
                // Open the link in a new tab to keep user signed in
                window.open(targetUrl, '_blank');
              }
            }}
          >
            {segment.content}
          </span>
        );
      case 'image':
        return (
          <img 
            key={index}
            src={segment.content} 
            alt={segment.alt} 
            className="max-w-full h-auto rounded-lg my-2 border border-gray-200" 
            style={{ maxHeight: '400px' }}
          />
        );
      case 'break':
        return <br key={index} />;
      default:
        return segment.content;
    }
  };

  const renderContentWithEmbeds = () => {
    const petProfileRegex = /\[pet-profile\]([^[\]]+)\[\/pet-profile\]/g;
    const pollRegex = /\[poll\]\s*(.*?)\s*\[\/poll\]/gs;
    
    const parts = [];
    let lastIndex = 0;
    
    // Find all embeds (pet profiles and polls) and their positions
    const embeds = [];
    
    // Find pet profile embeds
    let match;
    while ((match = petProfileRegex.exec(content)) !== null) {
      embeds.push({
        type: 'pet-profile',
        start: match.index,
        end: match.index + match[0].length,
        data: match[1]
      });
    }
    
    // Find poll embeds
    const pollMatches = [...content.matchAll(pollRegex)];
    pollMatches.forEach((match) => {
      if (match.index !== undefined) {
        embeds.push({
          type: 'poll',
          start: match.index,
          end: match.index + match[0].length,
          data: match[1]
        });
      }
    });
    
    // Sort embeds by position
    embeds.sort((a, b) => a.start - b.start);
    
    // Process content with embeds
    embeds.forEach((embed, index) => {
      // Add text before the embed
      if (embed.start > lastIndex) {
        const textBefore = content.slice(lastIndex, embed.start);
        if (textBefore.trim()) {
          const segments = parseTextToSegments(textBefore);
          parts.push(
            <div key={`text-${lastIndex}`} className={`whitespace-pre-wrap ${className}`}>
              {segments.map((segment, segIndex) => renderSegment(segment, segIndex))}
            </div>
          );
        }
      }

      // Add the embed
      if (embed.type === 'pet-profile') {
        parts.push(
          <div key={`embed-${embed.start}-${Date.now()}`} className="my-4">
            <PetProfileEmbed petId={embed.data} />
          </div>
        );
      } else if (embed.type === 'poll') {
        // Parse poll data
        const pollContent = embed.data.trim();
        const lines = pollContent.split('\n').map(line => line.trim()).filter(line => line);
        
        if (lines.length >= 3) { // Question + at least 2 options
          const question = lines[0];
          const options = lines.slice(1)
            .filter(line => line.startsWith('- '))
            .map(line => line.substring(2));
          
          if (options.length >= 2) {
            // Generate a unique poll ID based on content and position
            const pollId = `poll-${embed.start}-${btoa(pollContent).replace(/[^a-zA-Z0-9]/g, '').substring(0, 10)}`;
            
            parts.push(
              <div key={`poll-${embed.start}-${Date.now()}`} className="my-4">
                <Poll 
                  question={question} 
                  options={options} 
                  pollId={pollId}
                  postId={postId}
                />
              </div>
            );
          }
        }
      }

      lastIndex = embed.end;
    });

    // Add remaining text
    if (lastIndex < content.length) {
      const remainingText = content.slice(lastIndex);
      if (remainingText.trim()) {
        const segments = parseTextToSegments(remainingText);
        parts.push(
          <div key={`text-${lastIndex}`} className={`whitespace-pre-wrap ${className}`}>
            {segments.map((segment, segIndex) => renderSegment(segment, segIndex))}
          </div>
        );
      }
    }

    // If no embeds found, just return formatted text
    if (parts.length === 0) {
      const segments = parseTextToSegments(content);
      return (
        <div className={`whitespace-pre-wrap ${className}`}>
          {segments.map((segment, segIndex) => renderSegment(segment, segIndex))}
        </div>
      );
    }

    return <div>{parts}</div>;
  };

  return renderContentWithEmbeds();
};

export default FormattedTextSafe;
