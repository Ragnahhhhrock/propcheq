import { Link } from "react-router";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DemoBanner() {
  return (
    <div className="bg-brand-gradient text-white">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-2.5 text-center">
        <p className="inline-flex items-center gap-1.5 text-sm font-medium">
          <Sparkles className="h-4 w-4" />
          You’re viewing a demo with sample data — nothing is saved.
        </p>
        <Button
          asChild
          size="sm"
          variant="outline"
          className="h-8 rounded-full border-white/60 bg-white/10 text-white hover:bg-white/20 hover:text-white"
        >
          <Link to="/login">Sign up free to create your own</Link>
        </Button>
      </div>
    </div>
  );
}
