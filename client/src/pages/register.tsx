import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { getCurrentMember, setCurrentMember } from "@/lib/memberSession";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { type InsertMember } from "@shared/schema";

const registrationSchema = z.object({
  displayName: z.string().min(1, "Nickname is required"),
  gamertag: z.string().min(1, "Xbox gamertag is required"),
  experienceLevel: z.enum(["Beginner", "Intermediate", "Advanced", "Professional"]),
});

type RegistrationForm = z.infer<typeof registrationSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      displayName: "",
      gamertag: "",
      experienceLevel: "Intermediate",
    },
  });

  const createMemberMutation = useMutation({
    mutationFn: async (memberData: InsertMember) => {
      const response = await apiRequest("POST", "/api/members", memberData);
      return response.json();
    },
  });

  const onSubmit = async (data: RegistrationForm) => {
    setIsSubmitting(true);
    try {
      // Check if gamertag already exists
      let existingMember;
      try {
        const memberResponse = await fetch(`/api/members/by-gamertag/${encodeURIComponent(data.gamertag)}`);
        if (memberResponse.ok) {
          existingMember = await memberResponse.json();
        }
      } catch {
        // Member doesn't exist, continue with creation
      }

      if (existingMember) {
        toast({
          title: "Gamertag Already Exists",
          description: `The gamertag "${data.gamertag}" is already registered. Please choose a different one.`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Create new member
      const newMember = await createMemberMutation.mutateAsync({
        displayName: data.displayName,
        gamertag: data.gamertag,
        experienceLevel: data.experienceLevel,
      });

      // Store member in session
      setCurrentMember(newMember);

      toast({
        title: "Profile Created Successfully!",
        description: "Welcome to The Grid Racing Club! Your profile has been created and is pending approval.",
      });

      // Redirect to races page
      setLocation("/races");
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // If user already has a profile, redirect to races
  const currentMember = getCurrentMember();
  if (currentMember) {
    setLocation("/races");
    return null;
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="bg-gray-900 border-gray-800 max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2 mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation("/")}
              className="text-gray-400 hover:text-white p-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <CardTitle className="text-white text-2xl">Create Driver Profile</CardTitle>
          </div>
          <CardDescription className="text-gray-400">
            Join The Grid Racing Club by creating your driver profile. You'll be able to register for races, chat with other drivers, and compete in championships.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Display Name */}
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Nickname/Known as</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Racing Pro, Speed Demon"
                        className="bg-gray-800 border-gray-700 text-white"
                        data-testid="input-display-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Xbox Gamertag */}
              <FormField
                control={form.control}
                name="gamertag"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Xbox Gamertag</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter your Xbox gamertag"
                        className="bg-gray-800 border-gray-700 text-white"
                        data-testid="input-gamertag"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Experience Level */}
              <FormField
                control={form.control}
                name="experienceLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Racing Experience Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white" data-testid="select-experience-level">
                          <SelectValue placeholder="Select your experience level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="Beginner" className="text-white">Beginner</SelectItem>
                        <SelectItem value="Intermediate" className="text-white">Intermediate</SelectItem>
                        <SelectItem value="Advanced" className="text-white">Advanced</SelectItem>
                        <SelectItem value="Professional" className="text-white">Professional</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4 space-y-3">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  data-testid="button-create-profile"
                >
                  {isSubmitting ? "Creating Profile..." : "Create Profile"}
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  Your profile will be pending admin approval before you can join races.
                </p>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}