
export const getTierFromNovaPoints = (novaPoints: number = 0): string => {
  if (novaPoints >= 10000) return 'platinum';
  if (novaPoints >= 5000) return 'gold';
  if (novaPoints >= 2000) return 'silver';
  return 'bronze';
};

export const getTierColor = (tier: string) => {
  switch (tier?.toLowerCase()) {
    case 'platinum':
      return 'text-purple-600 bg-purple-50 border-purple-200';
    case 'gold':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'silver':
      return 'text-gray-600 bg-gray-50 border-gray-200';
    case 'bronze':
    default:
      return 'text-amber-600 bg-amber-50 border-amber-200';
  }
};
