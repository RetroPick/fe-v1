import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LoginModal from "./LoginModal";

const openAppKitMock = vi.fn();
const executeSocialLoginMock = vi.fn();
const toastMock = vi.fn();
const useAppKitAccountMock = vi.fn();

vi.mock("@reown/appkit/react", () => ({
  useAppKit: () => ({
    open: (...args: unknown[]) => openAppKitMock(...args),
  }),
  useAppKitAccount: () => useAppKitAccountMock(),
}));

vi.mock("@reown/appkit-controllers/utils", () => ({
  executeSocialLogin: (...args: unknown[]) => executeSocialLoginMock(...args),
}));

vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

describe("LoginModal", () => {
  beforeEach(() => {
    openAppKitMock.mockReset();
    executeSocialLoginMock.mockReset();
    toastMock.mockReset();
    useAppKitAccountMock.mockReset();

    useAppKitAccountMock.mockReturnValue({
      isConnected: false,
    });
  });

  it("opens AppKit when Connect Web3 Wallet is clicked", () => {
    render(<LoginModal isOpen onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /connect web3 wallet/i }));

    expect(openAppKitMock).toHaveBeenCalled();
  });

  it("starts Google social login from Continue with Google", async () => {
    executeSocialLoginMock.mockResolvedValue(undefined);

    render(<LoginModal isOpen onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /continue with google/i }));

    await waitFor(() => {
      expect(executeSocialLoginMock).toHaveBeenCalledWith("google");
    });
  });

  it("surfaces an error toast when Google sign-in fails", async () => {
    executeSocialLoginMock.mockRejectedValue(new Error("Popup blocked"));

    render(<LoginModal isOpen onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /continue with google/i }));

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Google sign-in failed",
          description: "Popup blocked",
          variant: "destructive",
        }),
      );
    });
  });
});
