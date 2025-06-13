"use client";
import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import Image from "next/image";
import { Button } from "./ui/button";
import { sendEmailOTP, verifySecret } from "@/lib/actions/user.actions";

interface OtpModalProps {
  email: string;
  accountId: string;
  userId: string; // Add this line
  onVerificationSuccess: () => void;
}

const OtpModal = ({
  email,
  accountId,
  userId, // Add this line
  onVerificationSuccess,
}: OtpModalProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const sessionId = await verifySecret({
        accountId,
        userId, // Add this line
        password,
      });
      if (sessionId) {
        setIsOpen(false); // Close modal first
        onVerificationSuccess(); // Then redirect
      }
    } catch (error) {
      console.log("Failed to verify otp:", error);
    }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    await sendEmailOTP({ email });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="shad-alert-dialogue">
        <div className="relative">
          <Image
            src={"/icons/close-dark.svg"}
            alt="Close"
            width={20}
            height={20}
            onClick={() => setIsOpen(false)}
            className="absolute -right-2 -top-2 cursor-pointer"
          />
          <AlertDialogHeader className="relative flex justify-center">
            <AlertDialogTitle className="h2 text-center text-base md:text-lg">
              Enter Your OTP
            </AlertDialogTitle>
            <AlertDialogDescription className="subtitle-2 text-center text-sm text-light-100 md:text-base">
              We&apos;ve sent a code to{" "}
              <span className="pl-1 text-brand">{email}</span>. Please enter it
              below to verify your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>
        <InputOTP maxLength={6} value={password} onChange={setPassword}>
          <InputOTPGroup className="shad-otp gap-2 md:gap-4">
            <InputOTPSlot
              index={0}
              className="shad-otp-slot h-10 w-10 md:h-12 md:w-12"
            />
            <InputOTPSlot
              index={1}
              className="shad-otp-slot h-10 w-10 md:h-12 md:w-12"
            />
            <InputOTPSlot
              index={2}
              className="shad-otp-slot h-10 w-10 md:h-12 md:w-12"
            />
            <InputOTPSlot
              index={3}
              className="shad-otp-slot h-10 w-10 md:h-12 md:w-12"
            />
            <InputOTPSlot
              index={4}
              className="shad-otp-slot h-10 w-10 md:h-12 md:w-12"
            />
            <InputOTPSlot
              index={5}
              className="shad-otp-slot h-10 w-10 md:h-12 md:w-12"
            />
          </InputOTPGroup>
        </InputOTP>
        <AlertDialogFooter>
          <div className="flex w-full flex-col gap-3 md:gap-4">
            <AlertDialogAction
              onClick={handleSubmit}
              className="shad-submit-btn h-10 text-sm md:h-12 md:text-base"
              type="button"
            >
              Submit{" "}
              {loading && (
                <Image
                  src={"/icons/loader.svg"}
                  alt="loader"
                  width={24}
                  height={24}
                  className="ml-2 animate-spin"
                />
              )}
            </AlertDialogAction>
            <div className="subtitle-2 mt-2 text-center text-light-100">
              Didn&apos;t Get A Code?{" "}
              <Button
                type="button"
                variant="link"
                className="pl-1"
                onClick={handleResendOtp}
              >
                Click To Resend
              </Button>
            </div>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default OtpModal;
