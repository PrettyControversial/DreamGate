import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  AI_DREAM_CONSENT_TEXT,
  AI_DREAM_CONSENT_TITLE,
} from "@shared/ai-dream-consent";

interface AiDreamConsentDialogProps {
  open: boolean;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onAgree: () => void;
}

export function AiDreamConsentDialog({
  open,
  saving,
  onOpenChange,
  onAgree,
}: AiDreamConsentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85dvh] overflow-y-auto border-[#171513]/20 bg-[#f6f3ec] text-[#171513] sm:rounded-2xl"
        data-testid="dialog-ai-dream-consent"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-normal leading-tight">
            {AI_DREAM_CONSENT_TITLE}
          </DialogTitle>
          <DialogDescription className="pt-3 text-sm leading-relaxed text-[#625d56]">
            {AI_DREAM_CONSENT_TEXT}
          </DialogDescription>
        </DialogHeader>
        <Link
          href="/privacy-policy"
          onClick={() => onOpenChange(false)}
          className="w-fit text-sm font-medium text-foreground underline underline-offset-4"
          data-testid="link-ai-consent-privacy"
        >
          Privacy Policy
        </Link>
        <DialogFooter className="gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => onOpenChange(false)}
            data-testid="button-ai-consent-not-now"
          >
            Not now
          </Button>
          <Button
            type="button"
            disabled={saving}
            onClick={onAgree}
            data-testid="button-ai-consent-agree"
          >
            {saving ? "Saving…" : "I agree"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
