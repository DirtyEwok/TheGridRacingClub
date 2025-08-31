import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { setCurrentMember } from "@/lib/memberSession";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import homeImage from "@assets/MAIN CLUB POSTERS-16_1756494139377.png";

const signInSchema = z.object({
  gamertag: z.string().min(1, "Xbox gamertag is required"),
});

type SignInForm = z.infer<typeof signInSchema>;

export default function SignIn() {
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      gamertag: "",
    },
  });

  const onSubmit = async (data: SignInForm) => {
    setIsSubmitting(true);
    try {
      // Look up existing member by gamertag
      const memberResponse = await fetch(`/api/members/by-gamertag/${encodeURIComponent(data.gamertag)}`);
      
      if (!memberResponse.ok) {
        toast({
          title: "Driver Not Found",
          description: `No driver profile found for gamertag "${data.gamertag}". Please create a new profile or check the spelling.`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const existingMember = await memberResponse.json();
      
      // Set member in session and redirect
      setCurrentMember(existingMember);
      
      toast({
        title: "Welcome Back!",
        description: `Successfully signed in as ${existingMember.gamertag}`,
      });
      
      setLocation("/chat");
    } catch (error) {
      console.error("Sign-in error:", error);
      toast({
        title: "Sign-In Error",
        description: "Failed to sign in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative flex items-center justify-center">
      {/* Background splash screen */}
      <div className="absolute inset-0 flex items-center justify-center p-4 opacity-20">
        <img 
          src={homeImage} 
          alt="The Grid E-Sports - Chat, Race, Run, Gun & Socialise #RACEANDRESPECT" 
          className="w-full h-full max-w-4xl max-h-[90vh] object-contain"
        />
      </div>
      
      {/* Sign-in form */}
      <div className="relative z-10 p-4 w-full max-w-md">
        <Card className="bg-gray-900/95 border-orange-600 shadow-2xl backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/")}
                className="absolute left-4 top-4 text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </div>
            <CardTitle className="text-white text-2xl mb-2">Welcome Back, Driver</CardTitle>
            <CardDescription className="text-gray-300">
              Sign in with your Xbox gamertag to access your driver profile and continue racing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="gamertag"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Xbox Gamertag</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                          placeholder="Enter your Xbox gamertag"
                          data-testid="input-gamertag"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 text-lg"
                  data-testid="button-submit"
                >
                  {isSubmitting ? "Signing In..." : "Sign In"}
                </Button>
                
                <div className="text-center">
                  <p className="text-sm text-gray-400 mb-3">
                    Don't have a driver profile yet?
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/register")}
                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                    data-testid="button-create-profile"
                  >
                    Create Driver Profile
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}