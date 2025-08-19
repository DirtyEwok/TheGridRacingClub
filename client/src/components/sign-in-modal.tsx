import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { setCurrentMember } from "@/lib/memberSession";

const signInSchema = z.object({
  gamertag: z.string().min(1, "Gamertag is required"),
});

type SignInForm = z.infer<typeof signInSchema>;

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      gamertag: "",
    },
  });

  const onSubmit = async (data: SignInForm) => {
    setIsSubmitting(true);
    try {
      const memberResponse = await fetch(`/api/members/by-gamertag/${encodeURIComponent(data.gamertag)}`);
      if (!memberResponse.ok) {
        throw new Error("Gamertag not found. Please check your gamertag or register for a race first.");
      }
      
      const member = await memberResponse.json();
      
      // Store member in session
      setCurrentMember(member);
      
      // Refresh races to show registration status
      queryClient.invalidateQueries({ queryKey: ["/api/races"] });
      
      toast({
        title: "Signed In Successfully!",
        description: `Welcome back, ${member.displayName}!`,
      });
      
      onClose();
      form.reset();
    } catch (error: any) {
      toast({
        title: "Sign In Failed",
        description: error.message || "Please check your gamertag and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Sign In</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="gamertag"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Xbox Gamertag</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Your Xbox gamertag"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="text-sm text-gray-400">
              Enter your gamertag to restore your registration status across browsers.
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="flex-1 bg-gray-700 hover:bg-gray-600 border-gray-600 text-white"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1 bg-racing-green hover:bg-green-700 text-white"
              >
                {isSubmitting ? "Signing In..." : "Sign In"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}