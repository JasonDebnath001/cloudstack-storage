"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createAccount, signInUser } from "@/lib/actions/user.actions";
import OtpModal from "./OtpModal";

type FormType = "sign-in" | "sign-up";

interface SignUpValues {
  email: string;
  fullname: string;
}

interface SignInValues {
  email: string;
  fullname?: string;
}

const authFormSchema = (formType: FormType) => {
  if (formType === "sign-up") {
    return z.object({
      email: z.string().email(),
      fullname: z.string().min(2, "Full name is required").max(50),
    });
  }
  return z.object({
    email: z.string().email(),
    fullname: z.string().optional(),
  });
};

const AuthForm = ({ type }: { type: FormType }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [accountId, setAccountId] = useState(null);
  const [userId, setUserId] = useState(null); // Add this line
  const [showModal, setShowModal] = useState(false);

  const formSchema = authFormSchema(type);
  const form = useForm<SignUpValues | SignInValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullname: "",
      email: "",
    },
  });

  const onSubmit = async (values: SignUpValues | SignInValues) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      if (type === "sign-up") {
        const signUpValues = values as SignUpValues;
        if (!signUpValues.fullname) {
          throw new Error("Full name is required for sign up");
        }
        const user = await createAccount({
          fullname: signUpValues.fullname,
          email: signUpValues.email,
        });
        if (user) {
          setAccountId(user.accountId);
          setUserId(user.userId); // Add this line
          setShowModal(true);
        }
      } else {
        const user = await signInUser({
          email: values.email,
        });
        if (user) {
          setAccountId(user.accountId);
          setUserId(user.userId); // Add this line
          setShowModal(true);
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      setErrorMessage(
        error?.message || "An unexpected error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSuccess = () => {
    setShowModal(false);
    router.push("/");
    router.refresh(); // Add this to refresh the router state
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="auth-form">
          <h1 className="form-title">
            {type === "sign-in" ? "Sign In" : "Sign Up"}
          </h1>
          {type === "sign-up" && (
            <FormField
              control={form.control}
              name="fullname"
              render={({ field }) => (
                <FormItem>
                  <div className="shad-form-item">
                    <FormLabel className="shad-form-label">Full Name</FormLabel>

                    <FormControl>
                      <Input
                        placeholder="Enter your full name"
                        className="shad-input"
                        {...field}
                      />
                    </FormControl>
                  </div>

                  <FormMessage className="shad-form-message" />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <div className="shad-form-item">
                  <FormLabel className="shad-form-label">Email</FormLabel>

                  <FormControl>
                    <Input
                      placeholder="Enter your email"
                      className="shad-input"
                      {...field}
                    />
                  </FormControl>
                </div>

                <FormMessage className="shad-form-message" />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="form-submit-button"
            disabled={isLoading}
          >
            {type === "sign-in" ? "Sign In" : "Sign Up"}

            {isLoading && (
              <Image
                src="/assets/icons/loader.svg"
                alt="loader"
                width={24}
                height={24}
                className="ml-2 animate-spin"
              />
            )}
          </Button>

          {errorMessage && <p className="error-message">*{errorMessage}</p>}

          <div className="body-2 flex justify-center">
            <p className="text-light-100">
              {type === "sign-in"
                ? "Don't have an account?"
                : "Already have an account?"}
            </p>
            <Link
              href={type === "sign-in" ? "/sign-up" : "/sign-in"}
              className="ml-1 font-medium text-brand"
            >
              {" "}
              {type === "sign-in" ? "Sign Up" : "Sign In"}
            </Link>
          </div>
        </form>
      </Form>

      {showModal && (
        <OtpModal
          email={form.getValues("email")}
          accountId={accountId}
          userId={userId} // Add this line
          onClose={() => setShowModal(false)}
          onVerificationSuccess={handleVerificationSuccess}
        />
      )}
    </>
  );
};

export default AuthForm;
