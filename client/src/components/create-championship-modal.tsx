import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertChampionshipSchema, type InsertChampionship } from "@shared/schema";

type CreateChampionshipFormData = {
  name: string;
  description?: string;
  season: string;
  startDate: string;
  endDate: string;
  maxParticipants?: number;
  rules?: string;
};

interface CreateChampionshipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateChampionshipModal({ isOpen, onClose }: CreateChampionshipModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateChampionshipFormData>({
    resolver: zodResolver(z.object({
      name: z.string().min(1, "Championship name is required"),
      description: z.string().optional(),
      season: z.string().min(1, "Season is required"),
      startDate: z.string().min(1, "Start date is required"),
      endDate: z.string().min(1, "End date is required"),
      maxParticipants: z.number().min(1).optional(),
      rules: z.string().optional(),
    })),
    defaultValues: {
      name: "",
      description: "",
      season: "",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // 90 days from now
      maxParticipants: undefined,
      rules: "",
    },
  });

  const createChampionshipMutation = useMutation({
    mutationFn: async (data: InsertChampionship) => {
      const response = await apiRequest("POST", "/api/championships", data, {
        headers: { Authorization: "admin" }
      });
      return response.json();
    },
  });

  const onSubmit = async (data: CreateChampionshipFormData) => {
    setIsSubmitting(true);
    try {
      // Transform form data to match API expectations
      const championshipData: InsertChampionship = {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        description: data.description || undefined,
        maxParticipants: data.maxParticipants || undefined,
        rules: data.rules || undefined,
        isActive: true, // Set championships as active by default
      };
      await createChampionshipMutation.mutateAsync(championshipData);
      
      // Invalidate championships query to refresh data
      await queryClient.invalidateQueries({ queryKey: ["/api/championships"] });
      
      toast({
        title: "Championship Created",
        description: `${data.name} has been created successfully.`,
      });
      
      // Reset form and close modal
      form.reset();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create championship",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create New Championship</DialogTitle>
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
                {isSubmitting ? "Creating..." : "Create Championship"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}