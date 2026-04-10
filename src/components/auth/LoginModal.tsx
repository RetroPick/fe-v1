import { useEffect, useState } from "react";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
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
  const { open } = useAppKit();
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

  return (
    <Dialog open={isOpen} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="gap-0 overflow-hidden border-white/40 bg-white/90 p-0 shadow-2xl shadow-blue-900/10 backdrop-blur-xl transition-colors duration-300 dark:border-slate-800/60 dark:bg-slate-950/90 dark:shadow-blue-900/20 sm:max-w-[400px]">
        <DialogTitle className="sr-only">Sign in to RetroPick</DialogTitle>
        <DialogDescription className="sr-only">
          Continue with Google to create an embedded smart account, or open the wallet connection
          modal.
        </DialogDescription>
        <div className="absolute left-0 top-0 z-10 h-1 w-full bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500" />

        <div className="pointer-events-none absolute right-[-50px] top-[-50px] h-32 w-32 rounded-full bg-blue-400/10 blur-[40px] dark:bg-blue-500/10" />
        <div className="pointer-events-none absolute bottom-[-50px] left-[-50px] h-32 w-32 rounded-full bg-indigo-400/10 blur-[40px] dark:bg-indigo-500/10" />

        <div className="relative z-10 p-6 pt-8">
          <CardHeader className="space-y-2 p-0 pb-6 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              className="mx-auto mb-2"
            >
              <div className="relative rounded-2xl border border-transparent bg-white p-1 shadow-lg shadow-blue-500/10 dark:border-slate-800 dark:bg-slate-900 dark:shadow-blue-500/20">
                <Logo className="h-12 w-12 rounded-xl" />
              </div>
            </motion.div>

            <CardTitle className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Sign in to access your dashboard
            </CardDescription>
          </CardHeader>

          <div className="space-y-4">
            <Button
              variant="outline"
              className="group h-10 w-full border-slate-200 bg-white text-slate-700 shadow-sm transition-all duration-300 hover:bg-slate-50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
            >
              <svg
                className="mr-2 h-4 w-4 transition-transform group-hover:scale-110 dark:text-white"
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
                className="h-11 w-full border-2 border-dashed border-blue-200 bg-blue-50/30 text-sm font-medium text-blue-600 transition-all hover:scale-[1.01] hover:border-blue-300 hover:bg-blue-50/80 dark:border-blue-800 dark:bg-blue-900/10 dark:text-blue-400 dark:hover:border-blue-700 dark:hover:bg-blue-900/20"
                onClick={() => open()}
              >
                <Icon name="wallet" className="mr-2 text-base" />
                Connect Web3 Wallet
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/80 p-4 text-center dark:border-slate-800 dark:bg-slate-900/50">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Don&apos;t have an account?{" "}
            <span className="cursor-pointer font-bold text-blue-600 transition-colors hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300">
              Create account
            </span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
