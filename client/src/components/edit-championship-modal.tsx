import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { updateChampionshipSchema, type UpdateChampionship, type ChampionshipWithStats } from "@shared/schema";

type EditChampionshipFormData = {
  name: string;
  description?: string;
  season: string;
  startDate: string;
  endDate: string;
  maxParticipants?: number;
  rules?: string;
  isActive: boolean;
};

interface EditChampionshipModalProps {
  championship: ChampionshipWithStats | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditChampionshipModal({ championship, isOpen, onClose }: EditChampionshipModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EditChampionshipFormData>({
    resolver: zodResolver(z.object({
      name: z.string().min(1, "Championship name is required"),
      description: z.string().optional(),
      season: z.string().min(1, "Season is required"),
      startDate: z.string().min(1, "Start date is required"),
      endDate: z.string().min(1, "End date is required"),
      maxParticipants: z.number().min(1).optional(),
      rules: z.string().optional(),
      isActive: z.boolean(),
    })),
    defaultValues: {
      name: "",
      description: "",
      season: "",
      startDate: "",
      endDate: "",
      maxParticipants: undefined,
      rules: "",
      isActive: true,
    },
  });

  // Update form when championship changes
  useEffect(() => {
    if (championship) {
      const startDate = new Date(championship.startDate);
      const endDate = new Date(championship.endDate);
      
      form.reset({
        name: championship.name,
        description: championship.description || "",
        season: championship.season,
        startDate: startDate.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10),
        maxParticipants: championship.maxParticipants || undefined,
        rules: championship.rules || "",
        isActive: championship.isActive,
      });
    }
  }, [championship, form]);

  const updateChampionshipMutation = useMutation({
    mutationFn: async (data: UpdateChampionship) => {
      const response = await apiRequest("PUT", `/api/championships/${championship!.id}`, data, {
        headers: { Authorization: "admin" }
      });
      return response.json();
    },
  });

  const onSubmit = async (data: EditChampionshipFormData) => {
    if (!championship) return;

    setIsSubmitting(true);
    try {
      // Transform form data to match API expectations
      const championshipData: UpdateChampionship = {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        description: data.description || undefined,
        maxParticipants: data.maxParticipants || undefined,
        rules: data.rules || undefined,
      };
      await updateChampionshipMutation.mutateAsync(championshipData);
      
      // Invalidate championships query to refresh data
      await queryClient.invalidateQueries({ queryKey: ["/api/championships"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/races"] }); // Refresh races as championship names may change
      
      toast({
        title: "Championship Updated",
        description: `${data.name} has been updated successfully.`,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update championship",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!championship) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Edit Championship</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Championship Name</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Winter Championship 2024"
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="season"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Season</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="2024 Season 1"
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Championship description..."
                      rows={3}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="date"
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="date"
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="maxParticipants"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Participants (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number"
                      min="1"
                      placeholder="24"
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      value={field.value || ""}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rules"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rules (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Championship rules and point system..."
                      rows={4}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-600 p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Championship</FormLabel>
                    <div className="text-sm text-gray-400">
                      Inactive championships won't appear in public listings
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="bg-gray-700 hover:bg-gray-600 border-gray-600 text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-racing-green hover:bg-green-600 text-white"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}