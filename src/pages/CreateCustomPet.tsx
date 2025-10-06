
import CreateCustomPet from "@/components/admin/CreateCustomPet";
import ProfileLayout from "@/components/profile/ProfileLayout";

const CreateCustomPetPage = () => {
  return (
    <ProfileLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Create Custom Pet</h1>
        <CreateCustomPet />
      </div>
    </ProfileLayout>
  );
};

export default CreateCustomPetPage;
