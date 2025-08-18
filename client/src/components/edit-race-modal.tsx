import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { updateRaceSchema, type UpdateRace, type RaceWithStats } from "@shared/schema";

type EditRaceFormData = {
  name: string;
  track: string;
  carClass: string;
  date: string;
  maxParticipants: number;
  registrationDeadline: string;
  isActive: boolean;
};

interface EditRaceModalProps {
  race: RaceWithStats | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditRaceModal({ race, isOpen, onClose }: EditRaceModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EditRaceFormData>({
    defaultValues: {
      name: "",
      track: "",
      carClass: "",
      date: new Date().toISOString().slice(0, 16),
      maxParticipants: 20,
      registrationDeadline: new Date().toISOString().slice(0, 16),
      isActive: true,
    },
  });

  // Update form when race changes
  useEffect(() => {
    if (race) {
      form.reset({
        name: race.name,
        track: race.track,
        carClass: race.carClass,
        date: new Date(race.date).toISOString().slice(0, 16),
        maxParticipants: race.maxParticipants,
        registrationDeadline: new Date(race.registrationDeadline).toISOString().slice(0, 16),
        isActive: race.isActive,
      });
    }
  }, [race, form]);

  const updateRaceMutation = useMutation({
    mutationFn: async (raceData: UpdateRace) => {
      if (!race) throw new Error("No race selected");
      const response = await apiRequest("PUT", `/api/races/${race.id}`, raceData, {
        headers: { Authorization: "admin" }
      });
      return response.json();
    },
  });

  const onSubmit = async (data: EditRaceFormData) => {
    if (!race) return;

    setIsSubmitting(true);
    try {
      // Transform form data to match API expectations
      const raceData: UpdateRace = {
        ...data,
        date: new Date(data.date),
        registrationDeadline: new Date(data.registrationDeadline),
      };
      await updateRaceMutation.mutateAsync(raceData);
      
      // Invalidate races query to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/races"] });

      toast({
        title: "Race Updated!",
        description: `${data.name} has been successfully updated.`,
      });

      onClose();
    } catch (error: any) {
      toast({
        title: "Failed to Update Race",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!race) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Edit Race</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-gray-300">
              Race Name
            </Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="Enter race name"
              className="bg-gray-700 border-gray-600 text-white focus:border-racing-green"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-400 mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="track" className="text-sm font-medium text-gray-300">
              Track
            </Label>
            <Input
              id="track"
              {...form.register("track")}
              placeholder="Enter track name"
              className="bg-gray-700 border-gray-600 text-white focus:border-racing-green"
            />
            {form.formState.errors.track && (
              <p className="text-sm text-red-400 mt-1">{form.formState.errors.track.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="carClass" className="text-sm font-medium text-gray-300">
              Car Class
            </Label>
            <Input
              id="carClass"
              {...form.register("carClass")}
              placeholder="Enter car class"
              className="bg-gray-700 border-gray-600 text-white focus:border-racing-green"
            />
            {form.formState.errors.carClass && (
              <p className="text-sm text-red-400 mt-1">{form.formState.errors.carClass.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="date" className="text-sm font-medium text-gray-300">
              Race Date & Time
            </Label>
            <Input
              id="date"
              type="datetime-local"
              {...form.register("date")}
              className="bg-gray-700 border-gray-600 text-white focus:border-racing-green"
            />
            {form.formState.errors.date && (
              <p className="text-sm text-red-400 mt-1">{form.formState.errors.date.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="registrationDeadline" className="text-sm font-medium text-gray-300">
              Registration Deadline
            </Label>
            <Input
              id="registrationDeadline"
              type="datetime-local"
              {...form.register("registrationDeadline")}
              className="bg-gray-700 border-gray-600 text-white focus:border-racing-green"
            />
            {form.formState.errors.registrationDeadline && (
              <p className="text-sm text-red-400 mt-1">{form.formState.errors.registrationDeadline.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="maxParticipants" className="text-sm font-medium text-gray-300">
              Max Participants
            </Label>
            <Input
              id="maxParticipants"
              type="number"
              min="1"
              max="50"
              {...form.register("maxParticipants", { valueAsNumber: true })}
              className="bg-gray-700 border-gray-600 text-white focus:border-racing-green"
            />
            {form.formState.errors.maxParticipants && (
              <p className="text-sm text-red-400 mt-1">{form.formState.errors.maxParticipants.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch 
              id="isActive"
              {...form.register("isActive")}
              checked={form.watch("isActive")}
              onCheckedChange={(checked) => form.setValue("isActive", checked)}
            />
            <Label htmlFor="isActive" className="text-sm font-medium text-gray-300">
              Race is active
            </Label>
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
              {isSubmitting ? "Updating..." : "Update Race"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}