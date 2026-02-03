"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useauth } from "@/lib/authcontext";
import { signupschema, type signupform } from "@/lib/schemas/auth";
import { apicall } from "@/lib/api";
import Link from "next/link";

const iiitemail = /^[a-zA-Z0-9._%+-]+@((research|students)\.)?iiit\.ac\.in$/;

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [error, seterror] = useState('');
  const { login } = useauth();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<signupform>({
    resolver: zodResolver(signupschema),
  });

  const emailvalue = watch('email');
  const isiiit = emailvalue ? iiitemail.test(emailvalue) : false;

  useEffect(() => {
    if (isiiit) {
      setValue('college', 'IIIT Hyderabad');
    }
  }, [isiiit, setValue]);

  const onsubmit = async (data: signupform) => {
    seterror('');
    try {
      const type = isiiit ? 'IIIT' : 'External';
      const result = await apicall('/api/auth/signup', {
        method: 'POST',
        body: { ...data, type },
      });
      login(result.token, result);
    } catch (err: any) {
      seterror(err.message);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="bg-card/50">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>
            Enter your details to create your Felicity account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onsubmit)}>
            <FieldGroup>
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="firstName">First name</FieldLabel>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Raghu"
                    {...register('firstName')}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive">{errors.firstName.message}</p>
                  )}
                </Field>
                <Field>
                  <FieldLabel htmlFor="lastName">Last name</FieldLabel>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Reddy"
                    {...register('lastName')}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-destructive">{errors.lastName.message}</p>
                  )}
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="raghu.reddy@iiit.ac.in"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="contact">Contact number</FieldLabel>
                <Input
                  id="contact"
                  type="tel"
                  placeholder="1234567890"
                  {...register('contact')}
                />
                {errors.contact && (
                  <p className="text-sm text-destructive">{errors.contact.message}</p>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="college">College/Organization</FieldLabel>
                <Input
                  id="college"
                  type="text"
                  placeholder="IIIT Hyderabad"
                  {...register('college')}
                  readOnly={isiiit}
                  className={isiiit ? 'cursor-not-allowed opacity-75' : ''}
                />
                {errors.college && (
                  <p className="text-sm text-destructive">{errors.college.message}</p>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  {...register('password')}
                />
                <FieldDescription>
                  Must be at least 8 characters long
                </FieldDescription>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </Field>

              <Field>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating account...' : 'Create account'}
                </Button>
                <FieldDescription className="text-center">
                  Already have an account?{" "}
                  <Link href="/login" className="underline underline-offset-4">
                    Sign in
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
