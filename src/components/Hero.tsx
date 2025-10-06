
import { Button } from "@/components/ui/button";
import { Heart, Users, Award } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-amber-50">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=1200&h=800&fit=crop')] bg-cover bg-center opacity-20"></div>
      
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        <div className="mb-8">
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 animate-fade-in">
            Love Lives Here
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Discover the joy of virtual pet companionship. Adopt adorable pets, care for them, and watch them grow in your personal PawPets adventure.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link to="/auth">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg">
              Start Your Pet Journey
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="px-8 py-3 text-lg">
            Learn About Pet Care
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Virtual Care</h3>
            <p className="text-muted-foreground">Feed, water, clean and play with your virtual pets</p>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">XP System</h3>
            <p className="text-muted-foreground">Earn experience points and unlock new tiers</p>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Award className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Progression</h3>
            <p className="text-muted-foreground">Watch your pets grow and improve their stats</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
