import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <Navigation />
      <main className="pt-24 px-12 lg:px-24 xl:px-32 max-w-7xl mx-auto pb-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-pink-800 mb-4">Privacy Policy</h1>
          <p className="text-xl text-muted-foreground">How we protect and handle your information</p>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200">
          <CardHeader>
            <CardTitle className="text-pink-800">Privacy Policy</CardTitle>
            <CardDescription>
              Last updated: {new Date().toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold text-pink-800 mb-2">Information We Collect</h3>
              <p className="text-muted-foreground">
                We collect information you provide when creating an account, including your username, email address, and profile information. We also collect game-related data such as your pets, activities, and progress.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-pink-800 mb-2">How We Use Your Information</h3>
              <p className="text-muted-foreground">
                Your information is used to provide and improve the PawPets gaming experience, including managing your account, pets, and progress. We may also use it to communicate important updates about the service.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-pink-800 mb-2">Data Security</h3>
              <p className="text-muted-foreground">
                We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-pink-800 mb-2">Information Sharing</h3>
              <p className="text-muted-foreground">
                We do not sell, trade, or otherwise transfer your personal information to outside parties except as described in this privacy policy or with your consent.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-pink-800 mb-2">Your Rights</h3>
              <p className="text-muted-foreground">
                You have the right to access, update, or delete your personal information. You can manage your privacy settings through your profile page.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-pink-800 mb-2">Contact Us</h3>
              <p className="text-muted-foreground">
                If you have any questions about this Privacy Policy, please contact us through our support page.
              </p>
            </section>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
