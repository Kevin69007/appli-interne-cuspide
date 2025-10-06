import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Save, Edit2, X, ShoppingCart, Home, Users, Copy, Link2 } from "lucide-react";
import PetStats from "@/components/pet-profile/PetStats";
import SellPetModule from "@/components/SellPetModule";
import { Link } from "react-router-dom";
import { calculatePetNumber } from "@/utils/petNumberUtils";

interface PetProfileDialogProps {
  pet: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

const PetProfileDialog = ({ pet, isOpen, onClose, onUpdate }: PetProfileDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingDescription, setEditingDescription] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [petDescription, setPetDescription] = useState(pet.description || "");
  const [petName, setPetName] = useState(pet.pet_name || "");
  const [displayOrder, setDisplayOrder] = useState(pet.display_order || 0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSellModule, setShowSellModule] = useState(false);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [petSaleInfo, setPetSaleInfo] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [editingPrice, setEditingPrice] = useState(false);
  const [newPrice, setNewPrice] = useState("");
  const [parents, setParents] = useState<{ mother: any; father: any }>({ mother: null, father: null });

  // Check if current user owns this pet
  const isOwner = user && pet.user_id === user.id;
  
  // Check if this is a baby pet (has parents)
  const isBabyPet = pet.parent1_id && pet.parent2_id;

  // Calculate pet number for display
  const petNumber = calculatePetNumber(pet);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch owner profile for the link
      if (pet.user_id) {
        const { data } = await supabase
          .from("profiles")
          .select("username, paw_dollars")
          .eq("id", pet.user_id)
          .single();
        setOwnerProfile(data);
      }

      // Fetch pet sale info
      const { data: saleData } = await supabase
        .from("pet_sales")
        .select("*")
        .eq("user_pet_id", pet.id)
        .eq("is_active", true)
        .single();
      setPetSaleInfo(saleData);
      if (saleData) {
        setNewPrice(saleData.price_nd.toString());
      }

      // Fetch current user's profile for purchase capability
      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("paw_dollars")
          .eq("id", user.id)
          .single();
        setUserProfile(profileData);
      }

      // Fetch parent information if this is a baby pet
      if (isBabyPet) {
        const { data: parentData, error: parentError } = await supabase
          .from("user_pets")
          .select("id, pet_name, gender")
          .in("id", [pet.parent1_id, pet.parent2_id]);

        if (!parentError && parentData) {
          const mother = parentData.find(p => p.gender === 'female');
          const father = parentData.find(p => p.gender === 'male');
          setParents({ mother, father });
        }
      }
    };

    fetchData();
  }, [pet.user_id, pet.id, user, isBabyPet, pet.parent1_id, pet.parent2_id]);

  const copyPrivateLink = () => {
    if (petSaleInfo?.secret_link) {
      const link = `${window.location.origin}/pet-sale/${petSaleInfo.secret_link}`;
      navigator.clipboard.writeText(link);
      toast({
        title: "Link Copied!",
        description: "Private sale link copied to clipboard",
      });
    }
  };

  const togglePrivateSale = async () => {
    if (!user || !isOwner || !petSaleInfo) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("pet_sales")
        .update({ is_private: !petSaleInfo.is_private })
        .eq("id", petSaleInfo.id);

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Sale privacy updated to ${!petSaleInfo.is_private ? 'private' : 'public'}`,
      });
      
      setPetSaleInfo({ ...petSaleInfo, is_private: !petSaleInfo.is_private });
      onUpdate?.();
    } catch (error) {
      console.error("Error updating sale privacy:", error);
      toast({
        title: "Error",
        description: "Failed to update sale privacy",
        variant: "destructive",
      });
    }
    setIsUpdating(false);
  };

  const purchasePet = async () => {
    if (!user || !petSaleInfo || !userProfile) return;

    if (userProfile.paw_dollars < petSaleInfo.price_nd) {
      toast({
        title: "Insufficient funds",
        description: "You don't have enough Paw Dollars to purchase this pet.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      // Transfer pet ownership
      const { error: petError } = await supabase
        .from("user_pets")
        .update({
          user_id: user.id,
          adopted_at: new Date().toISOString()
        })
        .eq("id", pet.id);

      if (petError) throw petError;

      // Deduct money from buyer
      const { error: buyerError } = await supabase
        .from("profiles")
        .update({
          paw_dollars: userProfile.paw_dollars - petSaleInfo.price_nd
        })
        .eq("id", user.id);

      if (buyerError) throw buyerError;

      // Add money to seller
      if (ownerProfile) {
        const { error: sellerError } = await supabase
          .from("profiles")
          .update({
            paw_dollars: ownerProfile.paw_dollars + petSaleInfo.price_nd
          })
          .eq("id", petSaleInfo.seller_id);

        if (sellerError) throw sellerError;
      }

      // Mark sale as inactive
      const { error: saleError } = await supabase
        .from("pet_sales")
        .update({ is_active: false })
        .eq("id", petSaleInfo.id);

      if (saleError) throw saleError;

      // Record transaction for buyer
      const { error: buyerTransactionError } = await supabase
        .from("pet_transactions")
        .insert({
          user_id: user.id,
          pet_id: pet.id,
          paw_dollars: -petSaleInfo.price_nd,
          description: `Purchased ${pet.pet_name} from another user`
        });

      if (buyerTransactionError) throw buyerTransactionError;

      // Record transaction for seller
      const { error: sellerTransactionError } = await supabase
        .from("pet_transactions")
        .insert({
          user_id: petSaleInfo.seller_id,
          pet_id: pet.id,
          paw_dollars: petSaleInfo.price_nd,
          description: `Sold ${pet.pet_name} to another user`
        });

      if (sellerTransactionError) throw sellerTransactionError;

      toast({
        title: "Purchase successful!",
        description: `You have successfully purchased ${pet.pet_name} for ${petSaleInfo.price_nd} Paw Dollars!`,
      });

      onUpdate?.();
      onClose();
    } catch (error) {
      console.error("Error purchasing pet:", error);
      toast({
        title: "Error",
        description: "Failed to purchase pet",
        variant: "destructive",
      });
    }
    setIsUpdating(false);
  };

  const removeFromSale = async () => {
    if (!user || !isOwner || !petSaleInfo) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("pet_sales")
        .update({ is_active: false })
        .eq("id", petSaleInfo.id);

      if (error) throw error;

      toast({
        title: "Success!",
        description: `${petName} has been removed from sale`,
      });
      
      setPetSaleInfo(null);
      onUpdate?.();
    } catch (error) {
      console.error("Error removing from sale:", error);
      toast({
        title: "Error",
        description: "Failed to remove pet from sale",
        variant: "destructive",
      });
    }
    setIsUpdating(false);
  };

  const updatePrice = async () => {
    if (!user || !isOwner || !petSaleInfo || !newPrice) return;

    const priceValue = parseInt(newPrice);
    if (isNaN(priceValue) || priceValue <= 0) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid price greater than 0",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("pet_sales")
        .update({ price_nd: priceValue })
        .eq("id", petSaleInfo.id);

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Price updated to ${priceValue} Paw Dollars`,
      });
      
      setPetSaleInfo({ ...petSaleInfo, price_nd: priceValue });
      setEditingPrice(false);
      onUpdate?.();
    } catch (error) {
      console.error("Error updating price:", error);
      toast({
        title: "Error",
        description: "Failed to update price",
        variant: "destructive",
      });
    }
    setIsUpdating(false);
  };

  // Calculate pet age
  const calculateAge = (birthday: string) => {
    if (!birthday) return "Unknown age";
    
    const birthDate = new Date(birthday);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - birthDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    const days = diffDays % 30;
    
    let ageString = "";
    if (years > 0) ageString += `${years} year${years > 1 ? 's' : ''}`;
    if (months > 0) {
      if (ageString) ageString += ", ";
      ageString += `${months} month${months > 1 ? 's' : ''}`;
    }
    if (days > 0 || (!years && !months)) {
      if (ageString) ageString += ", ";
      ageString += `${days} day${days > 1 ? 's' : ''}`;
    }
    
    return ageString;
  };

  const sellToShelter = async () => {
    if (!user || !isOwner) return;

    setIsUpdating(true);
    try {
      // Add pet to shelter
      const { error: shelterError } = await supabase
        .from("shelter_pets")
        .insert({
          user_pet_id: pet.id,
          seller_id: user.id,
          price_nd: 100,
          description: `${petName} is looking for a new home!`,
          is_available: true
        });

      if (shelterError) throw shelterError;

      // Give user 70 paw dollars
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          paw_dollars: (ownerProfile?.paw_dollars || 0) + 70
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Record transaction
      const { error: transactionError } = await supabase
        .from("pet_transactions")
        .insert({
          user_id: user.id,
          pet_id: pet.id,
          description: `Sold ${petName} to shelter`,
          paw_dollars: 70
        });

      if (transactionError) throw transactionError;

      toast({
        title: "Success!",
        description: `${petName} has been sold to the shelter for 70 Paw Dollars`,
      });
      
      onUpdate?.();
      onClose();
    } catch (error) {
      console.error("Error selling to shelter:", error);
      toast({
        title: "Error",
        description: "Failed to sell pet to shelter",
        variant: "destructive",
      });
    }
    setIsUpdating(false);
  };

  const saveDescription = async () => {
    if (!user || !isOwner) return;

    try {
      const { error } = await supabase
        .from("user_pets")
        .update({ description: petDescription })
        .eq("id", pet.id);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Pet description updated successfully",
      });
      setEditingDescription(false);
      onUpdate?.();
    } catch (error) {
      console.error("Error updating pet description:", error);
      toast({
        title: "Error",
        description: "Failed to update pet description",
        variant: "destructive",
      });
    }
  };

  const saveName = async () => {
    if (!user || !isOwner || !petName.trim()) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("user_pets")
        .update({ pet_name: petName.trim() })
        .eq("id", pet.id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Pet name updated successfully",
      });
      setEditingName(false);
      onUpdate?.();
    } catch (error) {
      console.error("Error updating pet name:", error);
      toast({
        title: "Error",
        description: "Failed to update pet name",
        variant: "destructive",
      });
    }
    setIsUpdating(false);
  };

  const cancelEditName = () => {
    setEditingName(false);
    setPetName(pet.pet_name || "");
  };

  const saveDisplayOrder = async () => {
    if (!user || !isOwner) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("user_pets")
        .update({ display_order: displayOrder })
        .eq("id", pet.id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Pet display order updated successfully",
      });
      onUpdate?.();
    } catch (error) {
      console.error("Error updating pet display order:", error);
      toast({
        title: "Error",
        description: "Failed to update pet display order",
        variant: "destructive",
      });
    }
    setIsUpdating(false);
  };

  const handleSellComplete = () => {
    setShowSellModule(false);
    onUpdate?.();
    onClose();
  };

  if (showSellModule) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <SellPetModule
            pet={pet}
            onBack={() => setShowSellModule(false)}
            onSellComplete={handleSellComplete}
          />
        </DialogContent>
      </Dialog>
    );
  }

  const tabsList = isBabyPet 
    ? ["about", "stats", "family-tree"]
    : ["about", "stats"];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-pink-800">Pet Profile</DialogTitle>
        </DialogHeader>
        
        {/* Buy Now button for pets that are for sale (and user doesn't own) */}
        {petSaleInfo && !isOwner && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-green-800 font-semibold mb-2">This pet is for sale!</p>
            <Button
              onClick={purchasePet}
              disabled={isUpdating || !userProfile || userProfile.paw_dollars < petSaleInfo.price_nd}
              className="bg-green-600 hover:bg-green-700 w-full"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {isUpdating ? "Processing..." : `Buy Now: ${petSaleInfo.price_nd} PD`}
            </Button>
            {userProfile && userProfile.paw_dollars < petSaleInfo.price_nd && (
              <p className="text-red-600 text-sm mt-2">
                Insufficient funds (You have {userProfile.paw_dollars} PD)
              </p>
            )}
          </div>
        )}
        
        <Tabs defaultValue="about" className="w-full">
          <TabsList className={`grid w-full ${isBabyPet ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger value="about">About {petName}</TabsTrigger>
            <TabsTrigger value="stats">Personality Traits</TabsTrigger>
            {isBabyPet && (
              <TabsTrigger value="family-tree">Family Tree</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="about" className="mt-4 space-y-4">
            {/* Pet Image and Basic Info */}
            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border-2 border-pink-200">
                <img
                  src={pet.pets?.image_url || "/placeholder.svg"}
                  alt={petName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-center">
                {isOwner && editingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={petName}
                      onChange={(e) => setPetName(e.target.value)}
                      className="flex-1 text-center"
                      placeholder="Enter pet name"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveName();
                        if (e.key === 'Escape') cancelEditName();
                      }}
                    />
                    <Button 
                      onClick={saveName} 
                      disabled={isUpdating || !petName.trim()}
                      size="sm"
                      className="bg-pink-600 hover:bg-pink-700"
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={cancelEditName}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <h3 className="font-bold text-lg text-gray-800">
                      {petName}
                    </h3>
                    {isOwner && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setEditingName(true)}
                        className="text-pink-600 hover:text-pink-700"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
                <p className="text-sm text-gray-600 capitalize mt-1">
                  {pet.breed || pet.pets?.name} • {pet.gender} • #{petNumber}
                </p>
                {pet.birthday && (
                  <p className="text-xs text-gray-500">
                    Born: {new Date(pet.birthday).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            {/* Detailed Pet Description */}
            <Card className="bg-white/90 backdrop-blur-sm border-pink-200">
              <CardHeader>
                <CardTitle className="text-pink-800">About {petName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">
                    {petName} is a {pet.gender} {pet.breed || pet.pets?.name} and was born{' '}
                    {pet.birthday ? new Date(pet.birthday).toLocaleDateString() : 'on an unknown date'} and was last adopted by{' '}
                    {ownerProfile?.username ? (
                      <Link 
                        to={`/profile/${encodeURIComponent(ownerProfile.username)}`} 
                        className="text-pink-600 hover:text-pink-700 underline"
                      >
                        {ownerProfile.username}
                      </Link>
                    ) : (
                      'Unknown User'
                    )} on {pet.adopted_at ? new Date(pet.adopted_at).toLocaleDateString() : 'an unknown date'}. {petName} is {calculateAge(pet.birthday)} old.
                  </p>
                  
                  {/* Custom Description Section */}
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-800">Custom Description</h4>
                      {isOwner && !editingDescription && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setEditingDescription(true)}
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                    
                    {editingDescription ? (
                      <div className="space-y-4">
                        <Textarea
                          value={petDescription}
                          onChange={(e) => setPetDescription(e.target.value)}
                          placeholder="Tell others about your pet..."
                          rows={4}
                          className="resize-none"
                        />
                        <div className="flex gap-2">
                          <Button onClick={saveDescription} className="bg-pink-600 hover:bg-pink-700">
                            <Save className="w-4 h-4 mr-2" />
                            Save
                          </Button>
                          <Button variant="outline" onClick={() => {
                            setEditingDescription(false);
                            setPetDescription(pet.description || "");
                          }}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        {pet.description || "No custom description yet. Click edit to add one!"}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Owner Actions */}
            {isOwner && (
              <>
                {/* Sale Management Section */}
                {petSaleInfo ? (
                  <Card className="bg-white/90 backdrop-blur-sm border-green-200">
                    <CardHeader>
                      <CardTitle className="text-green-800">Sale Management</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-green-800 font-medium mb-2">
                          {petName} is currently listed for sale
                        </p>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm">Current price:</span>
                          {editingPrice ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={newPrice}
                                onChange={(e) => setNewPrice(e.target.value)}
                                className="w-24 h-8"
                                min="1"
                              />
                              <span className="text-sm">PD</span>
                              <Button size="sm" onClick={updatePrice} disabled={isUpdating}>
                                <Save className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => {
                                setEditingPrice(false);
                                setNewPrice(petSaleInfo.price_nd.toString());
                              }}>
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-green-800">{petSaleInfo.price_nd} PD</span>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => setEditingPrice(true)}
                                className="h-6 px-2"
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Privacy Settings */}
                        <div className="space-y-3 border-t pt-3">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <Label htmlFor="private-sale" className="text-sm font-medium">
                                Private Sale
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                Only users with the private link can purchase this pet
                              </p>
                            </div>
                            <Switch
                              id="private-sale"
                              checked={petSaleInfo.is_private || false}
                              onCheckedChange={togglePrivateSale}
                              disabled={isUpdating}
                            />
                          </div>

                          {petSaleInfo.is_private && (
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Private Link</Label>
                              <div className="flex items-center gap-2">
                                <Input
                                  value={`${window.location.origin}/pet-sale/${petSaleInfo.secret_link}`}
                                  readOnly
                                  className="text-xs"
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={copyPrivateLink}
                                  className="flex-shrink-0"
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Share this link with buyers for private sales
                              </p>
                            </div>
                          )}
                        </div>

                        <Button
                          onClick={removeFromSale}
                          disabled={isUpdating}
                          variant="outline"
                          className="w-full border-red-300 text-red-600 hover:bg-red-50 mt-3"
                        >
                          Remove from Sale
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-white/90 backdrop-blur-sm border-green-200">
                    <CardHeader>
                      <CardTitle className="text-green-800">Sell Pet</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button
                        onClick={() => setShowSellModule(true)}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Sell {petName}
                      </Button>
                      <Button
                        onClick={sellToShelter}
                        disabled={isUpdating}
                        variant="outline"
                        className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
                      >
                        <Home className="w-4 h-4 mr-2" />
                        {isUpdating ? "Selling..." : `Sell to Shelter (70 PD)`}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Display Order Settings */}
                <Card className="bg-white/90 backdrop-blur-sm border-pink-200">
                  <CardHeader>
                    <CardTitle className="text-pink-800">Display Order</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="display-order">Order Position</Label>
                      <Input
                        id="display-order"
                        type="number"
                        value={displayOrder}
                        onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                        placeholder="Enter display order (lower numbers appear first)"
                        min="0"
                      />
                      <p className="text-xs text-muted-foreground">
                        Lower numbers will show first in your profile. Pets with the same order will be sorted by adoption date.
                      </p>
                    </div>
                    <Button
                      onClick={saveDisplayOrder}
                      disabled={isUpdating}
                      className="w-full bg-pink-600 hover:bg-pink-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isUpdating ? "Saving..." : "Save Order"}
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="stats" className="mt-4">
            <Card className="bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200">
              <CardContent className="p-4">
                <PetStats pet={pet} />
              </CardContent>
            </Card>
          </TabsContent>

          {isBabyPet && (
            <TabsContent value="family-tree" className="mt-4">
              <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-800 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Family Tree
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <h4 className="font-semibold text-lg mb-4">{petName}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h5 className="font-medium text-pink-600">Mother</h5>
                        {parents.mother ? (
                          <Link 
                            to={`/pet/${parents.mother.id}`} 
                            className="block p-3 bg-pink-50 border border-pink-200 rounded-lg hover:bg-pink-100 transition-colors"
                          >
                            <p className="font-medium text-pink-800">{parents.mother.pet_name}</p>
                            <p className="text-xs text-pink-600">♀ Female</p>
                          </Link>
                        ) : (
                          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <p className="text-gray-500">Unknown</p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <h5 className="font-medium text-blue-600">Father</h5>
                        {parents.father ? (
                          <Link 
                            to={`/pet/${parents.father.id}`} 
                            className="block p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <p className="font-medium text-blue-800">{parents.father.pet_name}</p>
                            <p className="text-xs text-blue-600">♂ Male</p>
                          </Link>
                        ) : (
                          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <p className="text-gray-500">Unknown</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default PetProfileDialog;
