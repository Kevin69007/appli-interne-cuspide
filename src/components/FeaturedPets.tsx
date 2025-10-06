
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar } from "lucide-react";

const pets = [
  {
    id: 1,
    name: "Luna",
    breed: "Siberian Husky",
    age: "2 years old",
    location: "Seattle, WA",
    image: "https://images.unsplash.com/photo-1452378174528-3090a4bba7b2?w=400&h=300&fit=crop",
    status: "Available",
    description: "Beautiful and energetic Siberian Husky looking for an active family."
  },
  {
    id: 2,
    name: "Whiskers",
    breed: "Orange Tabby",
    age: "6 months old",
    location: "Portland, OR",
    image: "https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=400&h=300&fit=crop",
    status: "Available",
    description: "Playful kitten who loves cuddles and sunny windowsills."
  },
  {
    id: 3,
    name: "Buddy",
    breed: "Golden Retriever",
    age: "3 years old",
    location: "San Francisco, CA",
    image: "https://images.unsplash.com/photo-1452960962994-acf4fd70b632?w=400&h=300&fit=crop",
    status: "Adopted",
    description: "Gentle and loyal companion, perfect for families with children."
  }
];

const FeaturedPets = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-background to-secondary/20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Meet Our Featured Pets
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            These amazing companions are waiting for their forever homes. Each one has been lovingly cared for and is ready to bring joy to your family.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {pets.map((pet) => (
            <Card key={pet.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
              <div className="relative overflow-hidden">
                <img 
                  src={pet.image} 
                  alt={pet.name}
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <Badge 
                  className={`absolute top-4 right-4 ${
                    pet.status === 'Available' ? 'bg-green-500' : 'bg-gray-500'
                  }`}
                >
                  {pet.status}
                </Badge>
              </div>
              
              <CardContent className="p-6">
                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-foreground mb-2">{pet.name}</h3>
                  <p className="text-lg text-primary font-semibold">{pet.breed}</p>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{pet.age}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{pet.location}</span>
                  </div>
                </div>
                
                <p className="text-muted-foreground mb-6">{pet.description}</p>
                
                <Button 
                  className="w-full" 
                  variant={pet.status === 'Available' ? 'default' : 'secondary'}
                  disabled={pet.status === 'Adopted'}
                >
                  {pet.status === 'Available' ? 'Learn More' : 'Adopted'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Button size="lg" variant="outline" className="px-8 py-3">
            View All Pets
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedPets;
