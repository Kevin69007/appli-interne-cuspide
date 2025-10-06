
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator } from "lucide-react";

const BreedingDateCalculator = () => {
  const [desiredBirthDate, setDesiredBirthDate] = useState("");
  const [breedingDate, setBreedingDate] = useState("");

  const calculateBreedingDate = () => {
    if (!desiredBirthDate) return;
    
    const birthDate = new Date(desiredBirthDate);
    const breedDate = new Date(birthDate);
    breedDate.setDate(breedDate.getDate() - 14); // 14 days before birth
    
    setBreedingDate(breedDate.toISOString().split('T')[0]);
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-green-600" />
          Breeding Date Calculator
        </CardTitle>
        <CardDescription>
          Calculate when to start breeding for your desired birth date
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="desired-birth">Desired Birth Date</Label>
          <Input
            id="desired-birth"
            type="date"
            value={desiredBirthDate}
            onChange={(e) => setDesiredBirthDate(e.target.value)}
          />
        </div>
        
        <Button 
          onClick={calculateBreedingDate}
          disabled={!desiredBirthDate}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          Calculate Breeding Date
        </Button>
        
        {breedingDate && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-800">
              <strong>Start breeding on:</strong> {new Date(breedingDate).toLocaleDateString()}
            </p>
            <p className="text-xs text-green-600 mt-1">
              (14 days before your desired birth date)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BreedingDateCalculator;
