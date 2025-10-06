
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User } from "lucide-react";

const tips = [
  {
    id: 1,
    title: "Essential Nutrition Guide for Puppies",
    category: "Nutrition",
    readTime: "5 min read",
    author: "Dr. Sarah Johnson",
    image: "https://images.unsplash.com/photo-1452378174528-3090a4bba7b2?w=400&h=250&fit=crop",
    excerpt: "Learn the fundamentals of proper puppy nutrition to ensure healthy growth and development."
  },
  {
    id: 2,
    title: "Creating a Cat-Friendly Home Environment",
    category: "Environment",
    readTime: "7 min read",
    author: "Emily Rodriguez",
    image: "https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=400&h=250&fit=crop",
    excerpt: "Transform your space into a paradise for your feline friend with these expert tips."
  },
  {
    id: 3,
    title: "Understanding Pet Behavior: Signs of Happiness",
    category: "Behavior",
    readTime: "6 min read",
    author: "Dr. Michael Chen",
    image: "https://images.unsplash.com/photo-1501286353178-1ec881214838?w=400&h=250&fit=crop",
    excerpt: "Recognize the subtle signs that indicate your pet is healthy, happy, and well-adjusted."
  }
];

const PetCareTips = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-secondary/20 to-background">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Expert Pet Care Tips
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get professional advice from veterinarians and pet care experts to keep your companions healthy and happy.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tips.map((tip) => (
            <Card key={tip.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <div className="relative overflow-hidden">
                <img 
                  src={tip.image} 
                  alt={tip.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <Badge className="absolute top-4 left-4 bg-primary">
                  {tip.category}
                </Badge>
              </div>
              
              <CardHeader className="pb-3">
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {tip.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-muted-foreground mb-4 line-clamp-3">{tip.excerpt}</p>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    <span>{tip.author}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{tip.readTime}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <button className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium">
            Read More Articles
          </button>
        </div>
      </div>
    </section>
  );
};

export default PetCareTips;
