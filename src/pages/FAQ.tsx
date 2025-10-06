
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    {
      question: "How do I get started?",
      answer: "Create an account and adopt your first pet! You'll start with some Paw Dollars and Paw Points to get you going. Take care of your pet by feeding and watering them regularly."
    },
    {
      question: "What are Paw Dollars and Paw Points?",
      answer: "Paw Dollars (PD) are the premium currency used to buy pets and special items. Paw Points (PP) are earned through pet care activities and can be used in the shop for food and water."
    },
    {
      question: "What are the Paw Levels and how do I advance?",
      answer: "Paw Levels are based on your total XP earned through pet care activities. The levels are: PawNoobie (0 XP), PawNovice (10,000 XP), PawApprentice (30,000 XP), PawExpert (80,000 XP), PawMaster (160,000 XP), and PawGuru (320,000+ XP). You earn XP by feeding, watering, playing with, and caring for your pets daily."
    },
    {
      question: "How do I earn XP to advance my Paw Level?",
      answer: "You earn XP through daily pet care activities like feeding, watering, playing with, and cleaning your pets. Each activity rewards you with XP points that contribute to your overall progression through the Paw Levels system."
    },
    {
      question: "How does breeding work?",
      answer: "You can breed two compatible pets together. The breeding process takes 14 days for birth and 28 days total until weaning. Each litter produces 1-6 babies with traits inherited from both parents. You need a Litter License to breed pets."
    },
    {
      question: "How do I care for my pets?",
      answer: "Feed and water your pets regularly to keep their hunger and thirst levels up. You can also play with them and clean them. Well-cared-for pets are happier and perform better in activities."
    },
    {
      question: "What are the different pet stats?",
      answer: "Pets have five main stats: Energy, Friendliness, Playfulness, Loyalty, and Curiosity. These stats affect your pet's performance and determine their personality. Some pets may have rare 'lost' stats that can occasionally be recovered."
    },
    {
      question: "How do I earn more Paw Dollars?",
      answer: "You can earn Paw Dollars by selling pets, participating in activities, or purchasing them. Daily care activities also provide small rewards."
    },
    {
      question: "Can I trade with other users?",
      answer: "Yes! You can trade pets and items with other users through the trading system. Both parties must confirm the trade before it's completed."
    },
    {
      question: "What happens if I don't care for my pets?",
      answer: "Neglected pets will become unhappy and their stats may decline. Make sure to check on them regularly and keep their needs met."
    },
    {
      question: "How do I contact support?",
      answer: "If you need help, you can reach out through our support channels or check this FAQ for common questions."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <Navigation />
      <main className="pt-24 px-6 max-w-4xl mx-auto pb-20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-pink-800 mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-muted-foreground">Find answers to common questions about caring for your virtual pets</p>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200">
          <CardHeader>
            <CardTitle className="text-pink-800">Common Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent>
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default FAQ;
