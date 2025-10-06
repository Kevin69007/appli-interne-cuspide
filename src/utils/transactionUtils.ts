
import { supabase } from "@/integrations/supabase/client";

export const recordXPTransaction = async (
  userId: string,
  xpAmount: number,
  activityType: string,
  description: string
) => {
  try {
    const { error } = await supabase
      .from("xp_transactions")
      .insert({
        user_id: userId,
        xp_amount: xpAmount,
        activity_type: activityType,
        description: description
      });

    if (error) {
      console.error("Error recording XP transaction:", error);
      throw error;
    }

    console.log(`✅ XP transaction recorded: ${xpAmount} XP for ${activityType}`);
  } catch (error) {
    console.error("Failed to record XP transaction:", error);
    throw error;
  }
};

export const recordPawDollarTransaction = async (
  userId: string,
  amount: number,
  type: string,
  description: string
) => {
  try {
    const { error } = await supabase
      .from("paw_dollar_transactions")
      .insert({
        user_id: userId,
        amount: amount,
        type: type,
        description: description,
        status: 'completed'
      });

    if (error) {
      console.error("Error recording Paw Dollar transaction:", error);
      throw error;
    }

    console.log(`✅ Paw Dollar transaction recorded: ${amount} PD for ${type}`);
  } catch (error) {
    console.error("Failed to record Paw Dollar transaction:", error);
    throw error;
  }
};

export const recordGiftTransaction = async (
  senderId: string,
  recipientId: string,
  amount: number,
  senderUsername: string,
  recipientUsername: string
) => {
  try {
    // Record the outgoing transaction for the sender
    await recordPawDollarTransaction(
      senderId,
      -amount,
      'gift_sent',
      `Gift sent to ${recipientUsername}`
    );

    // Record the incoming transaction for the recipient
    await recordPawDollarTransaction(
      recipientId,
      amount,
      'gift_received',
      `Gift received from ${senderUsername}`
    );

    console.log(`✅ Gift transaction recorded: ${amount} PD from ${senderUsername} to ${recipientUsername}`);
  } catch (error) {
    console.error("Failed to record gift transaction:", error);
    throw error;
  }
};

// Generic transaction recording function
export const recordTransaction = async ({
  userId,
  pawDollars,
  pawPoints,
  description,
  transactionType
}: {
  userId: string;
  pawDollars?: number;
  pawPoints?: number;
  description: string;
  transactionType: string;
}) => {
  try {
    if (pawDollars !== undefined) {
      await recordPawDollarTransaction(userId, pawDollars, transactionType, description);
    }
    
    if (pawPoints !== undefined) {
      // For now, we'll record paw points transactions as paw dollar transactions with a different type
      await recordPawDollarTransaction(userId, pawPoints, `${transactionType}_points`, description);
    }
  } catch (error) {
    console.error("Failed to record transaction:", error);
    throw error;
  }
};

// Pet adoption transaction
export const recordPetAdoptionTransaction = async (
  userId: string,
  petId: string,
  petName: string,
  amount: number,
  isFirstPet: boolean
) => {
  try {
    const transactionType = isFirstPet ? 'first_pet_adoption' : 'pet_adoption';
    const description = isFirstPet 
      ? `Adopted first pet: ${petName} (FREE!)`
      : `Adopted pet: ${petName} for ${amount} PD`;
    
    if (!isFirstPet && amount > 0) {
      await recordPawDollarTransaction(userId, -amount, transactionType, description);
    }
    
    console.log(`✅ Pet adoption transaction recorded: ${petName}`);
  } catch (error) {
    console.error("Failed to record pet adoption transaction:", error);
    throw error;
  }
};

// Pet sale transaction
export const recordPetSaleTransaction = async (
  sellerId: string,
  buyerId: string,
  petId: string,
  petName: string,
  amount: number,
  sellerUsername: string,
  buyerUsername: string
) => {
  try {
    // Record seller receiving money
    await recordPawDollarTransaction(
      sellerId,
      amount,
      'pet_sale_received',
      `Sold ${petName} to ${buyerUsername} for ${amount} PD`
    );
    
    // Record buyer spending money
    await recordPawDollarTransaction(
      buyerId,
      -amount,
      'pet_purchase',
      `Purchased ${petName} from ${sellerUsername} for ${amount} PD`
    );
    
    console.log(`✅ Pet sale transaction recorded: ${petName} sold for ${amount} PD`);
  } catch (error) {
    console.error("Failed to record pet sale transaction:", error);
    throw error;
  }
};
