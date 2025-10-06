
// More precise profanity filter - only blocks clearly inappropriate content
const inappropriateWords = [
  // Strong profanity
  'fuck', 'shit', 'bitch', 'asshole', 'damn', 'hell',
  // Sexual content
  'sex', 'porn', 'xxx', 'nude', 'naked',
  // Clearly offensive slurs and hate speech
  'nigger', 'faggot', 'retard'
  // Removed 'gay' as it's not inherently inappropriate and causes false positives
];

export const containsProfanity = (text: string): boolean => {
  if (!text) return false;
  
  const lowerText = text.toLowerCase();
  
  // Only flag if the word appears as a complete word, not as part of another word
  return inappropriateWords.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lowerText);
  });
};

export const cleanText = (text: string): string => {
  if (!text) return text;
  
  let cleanedText = text;
  
  inappropriateWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    cleanedText = cleanedText.replace(regex, '*'.repeat(word.length));
  });
  
  return cleanedText;
};

export const validateTextForProfanity = (text: string, fieldName: string = 'Text') => {
  if (!text || !text.trim()) {
    return {
      isValid: false,
      message: `${fieldName} cannot be empty`
    };
  }

  if (containsProfanity(text)) {
    return {
      isValid: false,
      message: `${fieldName} contains inappropriate content. Please revise your text.`
    };
  }

  return {
    isValid: true,
    message: ''
  };
};
