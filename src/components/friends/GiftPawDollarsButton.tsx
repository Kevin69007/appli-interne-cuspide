
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Gift } from "lucide-react";
import GiftPawDollarsModal from "./GiftPawDollarsModal";

interface GiftPawDollarsButtonProps {
  recipientId: string;
  recipientUsername: string;
}

const GiftPawDollarsButton = ({ recipientId, recipientUsername }: GiftPawDollarsButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsModalOpen(true)}
        className="flex-1 border-pink-200 text-pink-600 hover:text-pink-700 hover:bg-pink-50 hover:border-pink-300 transition-all duration-200"
      >
        <Gift className="w-4 h-4 mr-2" />
        Gift PD
      </Button>

      <GiftPawDollarsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        recipientId={recipientId}
        recipientUsername={recipientUsername}
        onSuccess={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default GiftPawDollarsButton;
