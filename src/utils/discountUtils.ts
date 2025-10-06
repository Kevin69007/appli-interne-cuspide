// Discount utility for promotional pricing
export interface DiscountInfo {
  isActive: boolean;
  discountPercentage: number;
  endDate: Date;
  originalPrice: number;
  discountedPrice: number;
  discountedPriceInCents: number;
  savings: number;
}

// Promotion end date: Set to now to end the promotion immediately
const PROMOTION_END_DATE = new Date('2024-01-01T00:00:00');

export const isPromotionActive = (): boolean => {
  return new Date() <= PROMOTION_END_DATE;
};

export const calculateDiscountedPrice = (originalPriceInCents: number): DiscountInfo => {
  const originalPrice = originalPriceInCents / 100;
  const discountPercentage = 20;
  const isActive = isPromotionActive();
  
  if (!isActive) {
    return {
      isActive: false,
      discountPercentage: 0,
      endDate: PROMOTION_END_DATE,
      originalPrice,
      discountedPrice: originalPrice,
      discountedPriceInCents: originalPriceInCents,
      savings: 0
    };
  }
  
  const discountedPrice = originalPrice * 0.8; // 20% off
  const discountedPriceInCents = Math.round(discountedPrice * 100);
  const savings = originalPrice - discountedPrice;
  
  return {
    isActive: true,
    discountPercentage,
    endDate: PROMOTION_END_DATE,
    originalPrice,
    discountedPrice,
    discountedPriceInCents,
    savings
  };
};

export const formatPromotionEndDate = (): string => {
  return PROMOTION_END_DATE.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};
