import { useEffect, useState } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { openAppKitModal } from "@/lib/openAppKitModal";
import { executeSocialLogin } from "@reown/appkit-controllers/utils";
import { Button } from "@/components/ui/button";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import Icon from "@/components/Icon";
import Logo from "@/components/Logo";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { isConnected } = useAppKitAccount();
  const { toast } = useToast();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    if (isOpen && isConnected) {
      onClose();
    }
  }, [isConnected, isOpen, onClose]);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);

    try {
      await executeSocialLogin("google");
    } catch (error) {
      const description =
        error instanceof Error ? error.message : "Google sign-in could not be started.";

      toast({
        title: "Google sign-in failed",
        description,
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  /** Close Radix Dialog first: overlay/focus trap can block or hide the AppKit modal behind it. */
  const handleWeb3Connect = () => {
    onClose();
    window.setTimeout(() => {
      void Promise.resolve(openAppKitModal()).catch((error: unknown) => {
        toast({
          title: "Could not open wallet modal",
          description: error instanceof Error ? error.message : "Try again or refresh the page.",
          variant: "destructive",
        });
      });
    }, 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="gap-0 overflow-hidden border border-border bg-popover/95 p-0 text-popover-foreground shadow-2xl shadow-black/20 backdrop-blur-xl transition-colors duration-300 dark:shadow-black/40 sm:max-w-[400px]">
        <DialogTitle className="sr-only">Sign in to RetroPick</DialogTitle>
        <DialogDescription className="sr-only">
          Continue with Google to create an embedded smart account, or open the wallet connection
          modal.
        </DialogDescription>
        <div className="absolute left-0 top-0 z-10 h-1 w-full bg-gradient-to-r from-primary via-accent-cyan to-primary" />

        <div className="pointer-events-none absolute right-[-50px] top-[-50px] h-32 w-32 rounded-full bg-primary/15 blur-[40px] dark:bg-primary/20" />
        <div className="pointer-events-none absolute bottom-[-50px] left-[-50px] h-32 w-32 rounded-full bg-accent-cyan/15 blur-[40px] dark:bg-accent-cyan/20" />

        <div className="relative z-10 p-6 pt-8">
          <CardHeader className="space-y-2 p-0 pb-6 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              className="mx-auto mb-2"
            >
              <div className="relative rounded-2xl border border-border bg-card p-1 shadow-lg shadow-primary/10 ring-1 ring-border/60 dark:shadow-primary/20">
                <Logo className="h-12 w-12 rounded-xl" />
              </div>
            </motion.div>

            <CardTitle className="text-xl font-bold tracking-tight text-card-foreground">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Sign in to access your dashboard
            </CardDescription>
          </CardHeader>

          <div className="space-y-4">
            <Button
              variant="outline"
              className="group h-10 w-full border-border bg-secondary text-secondary-foreground shadow-sm transition-all duration-300 hover:bg-muted hover:text-foreground"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
            >
              <svg
                className="mr-2 h-4 w-4 transition-transform group-hover:scale-110 text-foreground"
                aria-hidden="true"
                focusable="false"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 488 512"
              >
                <path
                  fill="currentColor"
                  d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                />
              </svg>
              {isGoogleLoading ? "Opening Google..." : "Continue with Google"}
            </Button>

            <div className="pt-2">
              <Button
                variant="outline"
                className="h-11 w-full border-2 border-dashed border-primary/35 bg-primary/5 text-sm font-medium text-primary transition-all hover:scale-[1.01] hover:border-primary/55 hover:bg-primary/10 dark:border-accent-cyan/45 dark:bg-accent-cyan/10 dark:text-accent-cyan dark:hover:border-accent-cyan/70 dark:hover:bg-accent-cyan/15"
                onClick={handleWeb3Connect}
              >
                <Icon name="wallet" className="mr-2 text-base" />
                Connect Web3 Wallet
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-border bg-muted/40 p-4 text-center dark:bg-muted/25">
          <p className="text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <span className="cursor-pointer font-semibold text-primary transition-colors hover:text-accent-cyan hover:underline dark:text-accent-cyan dark:hover:text-primary">
              Create account
            </span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
