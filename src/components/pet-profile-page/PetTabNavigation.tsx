

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PetTabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isShelterPet?: boolean;
}

const PetTabNavigation = ({ activeTab, onTabChange, isShelterPet = false }: PetTabNavigationProps) => {
  const tabs = isShelterPet 
    ? [
        { id: "profile", label: "Profile" },
        { id: "care-history", label: "Care History" },
        { id: "breeding", label: "Breeding" },
      ]
    : [
        { id: "profile", label: "Profile" },
        { id: "care-history", label: "Care History" },
        { id: "breeding", label: "Breeding" },
        { id: "sale", label: "Sale" },
      ];

  const gridCols = isShelterPet ? "grid-cols-3" : "grid-cols-4";

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className={`grid w-full ${gridCols} bg-pink-100 p-1`}>
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="text-sm font-medium text-pink-700 data-[state=active]:bg-pink-500 data-[state=active]:text-white hover:bg-pink-200 transition-colors"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};

export default PetTabNavigation;

