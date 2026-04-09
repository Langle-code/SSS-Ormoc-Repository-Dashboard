import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function SurveyModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [surveyUrl, setSurveyUrl] = useState("");

  useEffect(() => {
    const handleShowSurvey = (e: CustomEvent<string>) => {
      setSurveyUrl(e.detail);
      setIsOpen(true);
    };

    window.addEventListener("show-survey" as any, handleShowSurvey);
    return () => {
      window.removeEventListener("show-survey" as any, handleShowSurvey);
    };
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>We value your feedback!</DialogTitle>
          <DialogDescription>
            You have logged in multiple times. We would appreciate it if you could take a moment to fill out a short survey about your experience.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center py-6">
          <img 
            src="https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=400" 
            alt="Feedback" 
            className="rounded-lg object-cover h-40 w-full"
          />
        </div>
        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
            Remind me later
          </Button>
          <Button 
            type="button" 
            onClick={() => {
              window.open(surveyUrl, "_blank");
              setIsOpen(false);
            }}
          >
            Take Survey Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
