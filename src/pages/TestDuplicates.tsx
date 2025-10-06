
import Navigation from "@/components/Navigation";
import DuplicatePatternDemo from "@/components/test/DuplicatePatternDemo";

const TestDuplicates = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <Navigation />
      <main className="pt-24 px-6 max-w-4xl mx-auto">
        <DuplicatePatternDemo />
      </main>
    </div>
  );
};

export default TestDuplicates;
