import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { RaceWithStats, InsertMember, InsertRegistration } from "@shared/schema";

const registrationSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  gamertag: z.string().min(1, "Xbox gamertag is required"),
  experienceLevel: z.enum(["Beginner", "Intermediate", "Advanced", "Professional"]),
});

type RegistrationForm = z.infer<typeof registrationSchema>;

interface RegistrationModalProps {
  race: RaceWithStats | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function RegistrationModal({ race, isOpen, onClose }: RegistrationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const createRegistrationMutation = useMutation({
    mutationFn: async (registrationData: InsertRegistration) => {
      const response = await apiRequest("POST", "/api/registrations", registrationData);
      return response.json();
    },
  });

  const onSubmit = async (data: RegistrationForm) => {
    if (!race) return;

    setIsSubmitting(true);
    try {
      // First, try to find existing member by gamertag
      let member;
      try {
        const memberResponse = await fetch(`/api/members/by-gamertag/${encodeURIComponent(data.gamertag)}`);
        if (memberResponse.ok) {
          member = await memberResponse.json();
        }
      } catch {
        // Member doesn't exist, we'll create one
      }

      // If member doesn't exist, create one
      if (!member) {
        member = await createMemberMutation.mutateAsync({
          displayName: data.displayName,
          gamertag: data.gamertag,
          experienceLevel: data.experienceLevel,
        });
      }

      // Create registration
      await createRegistrationMutation.mutateAsync({
        raceId: race.id,
        memberId: member.id,
      });

      // Invalidate races query to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/races"] });

      toast({
        title: "Registration Successful!",
        description: `You've been registered for ${race.name}`,
      });

      onClose();
      form.reset();
    } catch (error: any) {
      const errorMessage = error?.message || "Registration failed. Please try again.";
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!race) return null;

  const raceDate = new Date(race.date);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Race Registration</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="displayName" className="text-sm font-medium text-gray-300">
              Display Name
            </Label>
            <Input
              id="displayName"
              {...form.register("displayName")}
              placeholder="Enter your display name"
              className="bg-gray-700 border-gray-600 text-white focus:border-racing-green"
            />
            {form.formState.errors.displayName && (
              <p className="text-sm text-red-400 mt-1">{form.formState.errors.displayName.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="gamertag" className="text-sm font-medium text-gray-300">
              Xbox Gamertag
            </Label>
            <Input
              id="gamertag"
              {...form.register("gamertag")}
              placeholder="Enter your Xbox gamertag"
              className="bg-gray-700 border-gray-600 text-white focus:border-racing-green"
            />
            {form.formState.errors.gamertag && (
              <p className="text-sm text-red-400 mt-1">{form.formState.errors.gamertag.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="experienceLevel" className="text-sm font-medium text-gray-300">
              Experience Level
            </Label>
            <Select 
              onValueChange={(value) => form.setValue("experienceLevel", value as any)}
              defaultValue={form.getValues("experienceLevel")}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white focus:border-racing-green">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
                <SelectItem value="Professional">Professional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-gray-700 rounded-lg p-4 mt-4">
            <h4 className="font-medium text-white mb-2">Race Details</h4>
            <div className="text-sm text-gray-300 space-y-1">
              <div>{race.name}</div>
              <div>{raceDate.toLocaleDateString()} at {raceDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              <div>{race.track}</div>
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 border-gray-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-racing-green hover:bg-green-600 text-white"
            >
              {isSubmitting ? "Registering..." : "Register"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
