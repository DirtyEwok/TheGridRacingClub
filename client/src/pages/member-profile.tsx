import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, MapPin, Car, Calendar, Video, Edit3, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import MemberHeader from "@/components/member-header";
import { getCurrentMember } from "@/lib/memberSession";
import { apiRequest } from "@/lib/queryClient";
import { updateMemberProfileSchema, type Member } from "@shared/schema";
import { z } from "zod";

function MemberProfile() {
  const { id } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentMember = getCurrentMember();
  const isOwnProfile = currentMember?.id === id;

  const { data: member, isLoading } = useQuery({
    queryKey: ["/api/members", id],
    queryFn: async () => {
      const response = await fetch(`/api/members/${id}`);
      if (!response.ok) throw new Error("Failed to fetch member");
      return response.json();
    },
    enabled: !!id,
  });

  const form = useForm({
    resolver: zodResolver(updateMemberProfileSchema),
    defaultValues: {
      displayName: "",
      bio: "",
      favoriteTrack: "",
      favoriteCarClass: "",
      carNumber: "",
      profileImageUrl: "",
      streamLink: "",
      streamLink2: "",
      experienceLevel: "Beginner",
    },
  });

  // Update form values when member data loads
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
        streamLink2: member.streamLink2 || "",
        experienceLevel: member.experienceLevel || "Beginner",
      });
    }
  }, [member, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof updateMemberProfileSchema>) => {
      const response = await apiRequest("PUT", `/api/members/${id}/profile`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members", id] });
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed", 
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    },
  });

  const handleSave = (data: z.infer<typeof updateMemberProfileSchema>) => {
    updateProfileMutation.mutate(data);
  };

  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
  };

  const renderStreamEmbed = (streamUrl: string, streamId: string) => {
    if (!streamUrl) return null;

    // Twitch embed
    if (streamUrl.includes('twitch.tv')) {
      const channelName = streamUrl.split('/').pop();
      const embedUrl = `https://player.twitch.tv/?channel=${channelName}&parent=${window.location.hostname}&autoplay=false`;
      return (
        <iframe
          src={embedUrl}
          height="100%"
          width="100%"
          allowFullScreen
          className="w-full h-full"
          title={`${channelName} Twitch Stream`}
        />
      );
    }
    
    // YouTube embed
    if (streamUrl.includes('youtube.com') || streamUrl.includes('youtu.be')) {
      let videoId = '';
      if (streamUrl.includes('watch?v=')) {
        videoId = streamUrl.split('watch?v=')[1].split('&')[0];
      } else if (streamUrl.includes('youtu.be/')) {
        videoId = streamUrl.split('youtu.be/')[1].split('?')[0];
      }
      
      if (videoId) {
        const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`;
        return (
          <iframe
            src={embedUrl}
            width="100%"
            height="100%"
            allowFullScreen
            className="w-full h-full"
            title="YouTube Stream"
          />
        );
      }
    }

    // Generic iframe fallback for other streaming platforms
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-400">
        <div className="text-center">
          <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">Stream embed not supported</p>
          <a
            href={streamUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-racing-green hover:text-green-400 text-sm mt-2 inline-block"
          >
            Open stream in new tab
          </a>
        </div>
      </div>
    );
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <MemberHeader />
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
        <MemberHeader />
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
      <MemberHeader />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 text-racing-green" />
              <h1 className="text-3xl font-bold text-white">Member Profile</h1>
            </div>
            {isOwnProfile && !isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-racing-green hover:bg-green-600 text-white"
                data-testid="button-edit-profile"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)}>
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
                        {isEditing ? (
                          <FormField
                            control={form.control}
                            name="displayName"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    {...field}
                                    className="bg-gray-800 border-gray-700 text-white text-2xl font-bold"
                                    data-testid="input-display-name"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ) : (
                          member.displayName
                        )}
                      </CardTitle>
                      <CardDescription className="text-gray-400 text-lg mb-3">
                        {member.gamertag}
                      </CardDescription>
                      <div className="flex items-center gap-4 flex-wrap">
                        {isEditing ? (
                          <FormField
                            control={form.control}
                            name="experienceLevel"
                            render={({ field }) => (
                              <FormItem>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white w-40">
                                      <SelectValue placeholder="Experience Level" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Beginner">Beginner</SelectItem>
                                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                                    <SelectItem value="Advanced">Advanced</SelectItem>
                                    <SelectItem value="Professional">Professional</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ) : (
                          <Badge className={getExperienceBadgeColor(member.experienceLevel)}>
                            {member.experienceLevel}
                          </Badge>
                        )}
                        
                        {/* Car Number */}
                        {isEditing ? (
                          <div className="flex flex-col">
                            <span className="text-white text-sm font-medium mb-1">Race No</span>
                            <FormField
                              control={form.control}
                              name="carNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="Car #"
                                      className="bg-gray-800 border-gray-700 text-white w-20"
                                      data-testid="input-car-number"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        ) : (
                          member.carNumber && (
                            <Badge variant="outline" className="text-racing-green border-racing-green">
                              #{member.carNumber}
                            </Badge>
                          )
                        )}

                        {/* Streaming Links - View mode only */}
                        {!isEditing && (member.streamLink || member.streamLink2) && (
                          <div className="flex items-center gap-2">
                            {member.streamLink && (
                              <a 
                                href={member.streamLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-racing-green hover:text-green-400 inline-flex items-center gap-1 text-sm"
                              >
                                <Video className="w-4 h-4" />
                                Stream 1
                              </a>
                            )}
                            {member.streamLink2 && (
                              <a 
                                href={member.streamLink2}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-racing-green hover:text-green-400 inline-flex items-center gap-1 text-sm"
                              >
                                <Video className="w-4 h-4" />
                                Stream 2
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Profile Details */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Profile Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Bio */}
                    <div>
                      <h3 className="text-white font-semibold mb-2">Bio</h3>
                      {isEditing ? (
                        <FormField
                          control={form.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  placeholder="Tell us about yourself..."
                                  className="bg-gray-800 border-gray-700 text-white"
                                  rows={3}
                                  data-testid="textarea-bio"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : (
                        <p className="text-gray-300">{member.bio || "No bio provided"}</p>
                      )}
                    </div>

                    {/* Embedded Streams */}
                    {!isEditing && (member.streamLink || member.streamLink2) && (
                      <div>
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                          <Video className="w-4 h-4" />
                          Live Streams
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Stream 1 */}
                          {member.streamLink && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-white font-medium">Primary Stream</h4>
                                <a
                                  href={member.streamLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-racing-green hover:text-green-400 text-sm inline-flex items-center gap-1"
                                >
                                  <Video className="w-4 h-4" />
                                  Open in new tab
                                </a>
                              </div>
                              <div className="bg-black rounded-lg overflow-hidden aspect-video">
                                {renderStreamEmbed(member.streamLink, "primary")}
                              </div>
                            </div>
                          )}

                          {/* Stream 2 */}
                          {member.streamLink2 && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-white font-medium">Secondary Stream</h4>
                                <a
                                  href={member.streamLink2}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-racing-green hover:text-green-400 text-sm inline-flex items-center gap-1"
                                >
                                  <Video className="w-4 h-4" />
                                  Open in new tab
                                </a>
                              </div>
                              <div className="bg-black rounded-lg overflow-hidden aspect-video">
                                {renderStreamEmbed(member.streamLink2, "secondary")}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Streaming Links - Edit mode */}
                    {isEditing && (
                      <div>
                        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                          <Video className="w-4 h-4" />
                          Stream Links
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="streamLink"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white">Stream Link 1</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="Enter primary stream URL"
                                    className="bg-gray-800 border-gray-700 text-white"
                                    data-testid="input-stream-link"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="streamLink2"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white">Stream Link 2</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="Enter secondary stream URL"
                                    className="bg-gray-800 border-gray-700 text-white"
                                    data-testid="input-stream-link-2"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Favorite Track */}
                      <div>
                        <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Favorite Track
                        </h3>
                        {isEditing ? (
                          <FormField
                            control={form.control}
                            name="favoriteTrack"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="Enter favorite track"
                                    className="bg-gray-800 border-gray-700 text-white"
                                    data-testid="input-favorite-track"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ) : (
                          <p className="text-gray-300">{member.favoriteTrack || "Not specified"}</p>
                        )}
                      </div>

                      {/* Favorite Car Class */}
                      <div>
                        <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                          <Car className="w-4 h-4" />
                          Favorite Car Class
                        </h3>
                        {isEditing ? (
                          <FormField
                            control={form.control}
                            name="favoriteCarClass"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="Enter favorite car class"
                                    className="bg-gray-800 border-gray-700 text-white"
                                    data-testid="input-favorite-car-class"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ) : (
                          <p className="text-gray-300">{member.favoriteCarClass || "Not specified"}</p>
                        )}
                      </div>
                    </div>


                    {/* Member Since */}
                    <div>
                      <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Member Since
                      </h3>
                      <p className="text-gray-300">{formatDate(member.createdAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>


              {/* Edit Controls */}
              {isEditing && (
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="pt-6">
                    <div className="flex gap-4 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        className="border-gray-600 text-white hover:bg-gray-800"
                        data-testid="button-cancel-edit"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-racing-green hover:bg-green-600 text-white"
                        disabled={updateProfileMutation.isPending}
                        data-testid="button-save-profile"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

export default MemberProfile;