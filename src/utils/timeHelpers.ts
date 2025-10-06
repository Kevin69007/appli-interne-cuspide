export const calculateAge = (birthday: string) => {
  const birth = new Date(birthday);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - birth.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = Math.abs(now.getTime() - date.getTime());
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInSeconds < 60) {
    return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  } else {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  }
};

// Use consistent formatting everywhere - same as formatTimeAgo
export const formatReplyTime = (dateString: string) => {
  return formatTimeAgo(dateString);
};

export const formatTimestamp = (dateString: string) => {
  return formatTimeAgo(dateString);
};

export const calculateTimeRemaining = (targetDate: string) => {
  const target = new Date(targetDate);
  const now = new Date();
  const diffInMs = target.getTime() - now.getTime();
  
  if (diffInMs <= 0) {
    return "Due now!";
  }
  
  const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
  const diffInHours = Math.ceil(diffInMs / (1000 * 60 * 60));
  
  if (diffInDays >= 1) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} remaining`;
  } else {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} remaining`;
  }
};
