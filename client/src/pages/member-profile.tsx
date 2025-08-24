import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { User, Edit3, Save, Camera, MapPin, Car, Hash, Video } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateMemberProfileSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { Member, UpdateMemberProfile } from "@shared/schema";

function MemberProfile() {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const { data: member, isLoading } = useQuery({
    queryKey: ["/api/members/by-id", id],
    queryFn: async () => {
      const response = await fetch(`/api/members/${id}`);
      if (!response.ok) throw new Error("Failed to fetch member");
      return response.json();
    },
    enabled: !!id,
  });

  const form = useForm<UpdateMemberProfile>({
    resolver: zodResolver(updateMemberProfileSchema),
    defaultValues: {
      displayName: "",
      bio: "",
      favoriteTrack: "",
      favoriteCarClass: "",
      carNumber: "",
      profileImageUrl: "",
      streamLink: "",
    },
  });

  // Update form when member data loads
  useEffect(() => {
    if (member) {
      form.reset({
        displayName: member.displayName || "",
        bio: member.bio || "",
        favoriteTrack: member.favoriteTrack || "",
        favoriteCarClass: member.favoriteCarClass || "",
        carNumber: member.carNumber || "",
        profileImageUrl: member.profileImageUrl || "",
        streamLink: member.streamLink || "",
      });
    }
  }, [member, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateMemberProfile) => {
      const response = await fetch(`/api/members/${id}/profile`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update profile");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members/by-id", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update profile: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (objectPath: string) => {
    // Set the form value with the object path
    form.setValue("profileImageUrl", objectPath);
    
    // Automatically save the profile with the new image
    const currentValues = form.getValues();
    updateProfileMutation.mutate({
      ...currentValues,
      profileImageUrl: objectPath
    });
  };

  const onSubmit = (data: UpdateMemberProfile) => {
    updateProfileMutation.mutate(data);
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString();
  };

  const getExperienceBadgeColor = (level: string) => {
    switch (level) {
      case "Beginner": return "bg-green-100 text-green-800";
      case "Intermediate": return "bg-blue-100 text-blue-800";
      case "Advanced": return "bg-purple-100 text-purple-800";
      case "Professional": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const trackOptions = [
    "Silverstone", "Spa-Francorchamps", "Monza", "Nürburgring GP", "Brands Hatch",
    "Barcelona", "Imola", "Hungaroring", "Zandvoort", "Kyalami", "Mount Panorama",
    "Suzuka", "Laguna Seca", "Road America", "Watkins Glen", "Misano"
  ];

  const carClassOptions = [
    "GT3", "GT4", "LMP1", "LMP2", "Formula 1", "Formula 2", "Formula 3",
    "Touring Cars", "Stock Cars", "IndyCar", "Prototype"
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-white">Loading profile...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Member Not Found</h1>
            <p className="text-gray-400">The requested member profile could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 text-racing-green" />
              <h1 className="text-3xl font-bold text-white">Member Profile</h1>
            </div>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? "secondary" : "default"}
              className="bg-racing-green hover:bg-racing-green/80"
              data-testid="button-edit-profile"
            >
              {isEditing ? (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Cancel
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Profile Header */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  {member.profileImageUrl ? (
                    <img
                      src={member.profileImageUrl}
                      alt={member.displayName}
                      className="w-24 h-24 rounded-full object-cover border-2 border-racing-green"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-racing-green rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {member.displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-white text-2xl mb-2">
                    {member.displayName}
                  </CardTitle>
                  <CardDescription className="text-gray-400 text-lg mb-3">
                    {member.gamertag}
                  </CardDescription>
                  <div className="flex items-center gap-4">
                    <Badge className={getExperienceBadgeColor(member.experienceLevel)}>
                      {member.experienceLevel}
                    </Badge>
                    {member.carNumber && (
                      <Badge variant="outline" className="text-racing-green border-racing-green">
                        #{member.carNumber}
                      </Badge>
                    )}
                    {member.streamLink && (
                      <a 
                        href={member.streamLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-racing-green hover:text-green-400 inline-flex items-center gap-1 text-sm"
                      >
                        <Video className="w-4 h-4" />
                        Watch Stream
                      </a>
                    )}
                    <span className="text-sm text-gray-400">
                      Member since {formatDate(member.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Profile Form */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Profile Information</CardTitle>
              <CardDescription className="text-gray-400">
                {isEditing ? "Update your racing profile details" : "Your racing profile details"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Profile Image */}
                  {isEditing && (
                    <FormField
                      control={form.control}
                      name="profileImageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Profile Image</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-4">
                              <ObjectUploader
                                onComplete={handleImageUpload}
                                buttonClassName="bg-gray-800 hover:bg-gray-700 text-white border border-gray-600"
                              >
                                <Camera className="w-4 h-4 mr-2" />
                                Upload Photo
                              </ObjectUploader>
                              {field.value && (
                                <span className="text-sm text-gray-400">Image uploaded</span>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Display Name */}
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Display Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={!isEditing}
                            className="bg-gray-800 border-gray-700 text-white disabled:bg-gray-900 disabled:text-gray-400"
                            data-testid="input-display-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Bio */}
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            disabled={!isEditing}
                            placeholder="Tell us about your racing background and interests..."
                            className="bg-gray-800 border-gray-700 text-white disabled:bg-gray-900 disabled:text-gray-400"
                            rows={4}
                            data-testid="textarea-bio"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Favorite Track */}
                    <FormField
                      control={form.control}
                      name="favoriteTrack"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Favorite Track
                          </FormLabel>
                          <FormControl>
                            {isEditing ? (
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                                  <SelectValue placeholder="Select your favorite track" />
                                </SelectTrigger>
                                <SelectContent>
                                  {trackOptions.map((track) => (
                                    <SelectItem key={track} value={track}>
                                      {track}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                value={field.value || "Not specified"}
                                disabled
                                className="bg-gray-900 border-gray-700 text-gray-400"
                              />
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Favorite Car Class */}
                    <FormField
                      control={form.control}
                      name="favoriteCarClass"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white flex items-center gap-2">
                            <Car className="w-4 h-4" />
                            Favorite Car Class
                          </FormLabel>
                          <FormControl>
                            {isEditing ? (
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                                  <SelectValue placeholder="Select your favorite car class" />
                                </SelectTrigger>
                                <SelectContent>
                                  {carClassOptions.map((carClass) => (
                                    <SelectItem key={carClass} value={carClass}>
                                      {carClass}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                value={field.value || "Not specified"}
                                disabled
                                className="bg-gray-900 border-gray-700 text-gray-400"
                              />
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Car Number */}
                  <FormField
                    control={form.control}
                    name="carNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white flex items-center gap-2">
                          <Hash className="w-4 h-4" />
                          Car Number
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={!isEditing}
                            placeholder="Your preferred racing number"
                            className="bg-gray-800 border-gray-700 text-white disabled:bg-gray-900 disabled:text-gray-400"
                            data-testid="input-car-number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Stream Link */}
                  <FormField
                    control={form.control}
                    name="streamLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white flex items-center gap-2">
                          <Video className="w-4 h-4" />
                          Stream Link
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={!isEditing}
                            placeholder="Your streaming channel URL (Twitch, YouTube, etc.)"
                            className="bg-gray-800 border-gray-700 text-white disabled:bg-gray-900 disabled:text-gray-400"
                            data-testid="input-stream-link"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {isEditing && (
                    <div className="flex gap-3 pt-4">
                      <Button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                        className="bg-racing-green hover:bg-racing-green/80"
                        data-testid="button-save-profile"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setIsEditing(false)}
                        disabled={updateProfileMutation.isPending}
                        data-testid="button-cancel-edit"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default MemberProfile;